"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { CheckCircle, Flame, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { format, parseISO, subWeeks, addWeeks } from "date-fns";
import confetti from "canvas-confetti";
import Image from "next/image";
import { DuoButton } from "@/components/ui/DuoButton";
import { RabbitCompanion, STAGES_CONFIG, CompanionAction } from "@/components/pet/RabbitCompanion";
import { pickAmbientAction, streakMilestoneAction, weatherFromCode } from "@/lib/companion";
import { EggCompanion } from "@/components/pet/EggCompanion";
import { PetSpeechBubble } from "@/components/pet/PetSpeechBubble";
import { HabitModal } from "@/components/home/HabitModal";
import { SettingsModal } from "@/components/home/SettingsModal";
import { TimerModal } from "@/components/home/TimerModal";
import { MemoryAlbumModal } from "@/components/home/MemoryAlbumModal";
import { ShopModal } from "@/components/home/ShopModal";
import { CelebrationModal } from "@/components/home/CelebrationModal";
import { PetHud } from "@/components/home/PetHud";
import { BottomNav } from "@/components/home/BottomNav";
import { InteractionDock } from "@/components/home/InteractionDock";
import { FeedPicker } from "@/components/home/FeedPicker";
import { NeighborModal } from "@/components/home/NeighborModal";
import { SHOP_ITEMS } from "@/lib/items";
import { useSound } from "@/hooks/useSound";
import {
  toggleHabitAction,
  updateTimezoneAction,
  claimDailyCheckinAction,
  buyFreezeAction,
  incrementCounterHabitAction,
  feedPetAction,
  petInteractAction,
  claimNeighborGiftAction,
} from "@/app/[locale]/actions";
import { stageFromStreak, daysBetween, moodFromStats, levelFromExp, expToNextLevel, foodTier } from "@/lib/game";
import { roomDef, unlockedRooms, allRoomsUnlocked, INTERACTION_ACTION, type RoomId, type InteractionKind } from "@/lib/rooms";
import type { DashboardData, HabitWithLog } from "@/lib/types";

const LAST_ROOM_KEY = "titroutine:lastRoom";

// Floating dust/light motes for room depth. Positions/timing come from CSS
// (.dust-mote:nth-child(n) in globals.css); here we just render N spans.
const DUST_MOTES = [0, 1, 2, 3, 4, 5];

// The 4 always-available care actions (never gated by room/level — so nurturing
// can never softlock) and the room each one *moves the pet to* when that room is
// unlocked. Users think "I want to feed / bathe the pet", not "go to the kitchen".
const CARE_ACTIONS: InteractionKind[] = ["feed", "play", "clean", "sleep"];
const ACTION_ROOM: Record<InteractionKind, RoomId> = {
  feed: "kitchen",
  play: "garden",
  clean: "bathroom",
  sleep: "bedroom",
  pat: "living",
};

const LAST_STAGE_KEY = "titroutine:lastPetStage";

export function HomeView({ data }: { data: DashboardData }) {
  const t = useTranslations("Home");
  const tStages = useTranslations("Stages");
  const tRooms = useTranslations("Rooms");
  const locale = useLocale();
  const router = useRouter();
  const { playTing, playSwoosh } = useSound();

  // Server data is the source of truth; mirror it locally for optimistic UI.
  const [habits, setHabits] = useState(data.habits);
  const [coins, setCoins] = useState(data.profile.coins);
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());
  // Synchronous guard so a rapid double-tap can't double-award coins/EXP.
  const inFlight = useRef<Set<string>>(new Set());
  const [, startTransition] = useTransition();
  const [isNavigating, startNavigation] = useTransition();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitWithLog | null>(null);
  const [timerHabit, setTimerHabit] = useState<HabitWithLog | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAlbumOpen, setIsAlbumOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [companionOverrideAction, setCompanionOverrideAction] = useState<CompanionAction | null>(null);
  // "Hành động nền" do scheduler chọn theo giờ/mùa (khi không có override/timer).
  const [ambientAction, setAmbientAction] = useState<CompanionAction>("idle");
  // Thời tiết thật (nếu xin được vị trí) → thỏ ngắm mưa/đắp người tuyết đúng lúc.
  const [weather, setWeather] = useState<"rain" | "snow" | null>(null);

  // ── Nurture (feeding) state — optimistic mirrors of server truth ──────────
  const [satiety, setSatiety] = useState(data.profile.satiety);
  const [petExp, setPetExp] = useState(data.profile.petExp);
  const [affection, setAffection] = useState(data.profile.affection);
  const [isFeedOpen, setIsFeedOpen] = useState(false);
  const [isNeighborOpen, setIsNeighborOpen] = useState(false);
  // Floating "+N EXP" texts that pop over the pet when fed.
  const [floats, setFloats] = useState<{ id: number; text: string }[]>([]);
  const floatId = useRef(0);
  const careInFlight = useRef(false);

  // Current room the user is viewing (persisted). Clamped to an unlocked room.
  const [currentRoomId, setCurrentRoomId] = useState<RoomId>("bedroom");
  // Time-of-day tint for room lighting. Client-only (set in effect) so the first
  // render matches the server and there's no hydration mismatch.
  const [timeOfDay, setTimeOfDay] = useState<"morning" | "day" | "evening" | "night">("day");

  // Dev-only overrides (from the Settings → Developer Tools panel) for previewing
  // pet stages / streaks before the higher-stage art lands.
  const [devStageOverride, setDevStageOverride] = useState<number | null>(null);
  const [devStreakOverride, setDevStreakOverride] = useState<number | null>(null);
  const [devLevelOverride, setDevLevelOverride] = useState<number | null>(null);
  const [devSatietyOverride, setDevSatietyOverride] = useState<number | null>(null);

  const [celebration, setCelebration] = useState<{
    isOpen: boolean;
    type: "streak" | "checkin" | "habit";
    streakCount?: number;
    coinsAwarded?: number;
    habitTitle?: string;
  }>({ isOpen: false, type: "streak" });

  const [hasClaimedCheckinUI, setHasClaimedCheckinUI] = useState(false);

  // Stage the user just evolved INTO this visit (drives the evolution celebration).
  const [justEvolvedStage, setJustEvolvedStage] = useState<number | null>(null);

  // Detect an evolution since the last visit. We persist the last-seen stage in
  // localStorage so reaching a new form feels like a milestone event rather than a
  // silent sprite swap. First-ever load just records the baseline (no popup).
  useEffect(() => {
    const serverStage = data.profile.petStage;
    const stored = window.localStorage.getItem(LAST_STAGE_KEY);
    if (stored !== null && serverStage > Number(stored)) {
      setJustEvolvedStage(serverStage);
      setCompanionOverrideAction("happy");
      // Cinematic: pháo hoa mừng khoảnh khắc tiến hoá.
      confetti({ particleCount: 180, spread: 100, startVelocity: 45, origin: { y: 0.5 }, scalar: 1.1 });
      setTimeout(() => confetti({ particleCount: 110, angle: 60, spread: 70, origin: { x: 0, y: 0.6 } }), 250);
      setTimeout(() => confetti({ particleCount: 110, angle: 120, spread: 70, origin: { x: 1, y: 0.6 } }), 420);
    }
    window.localStorage.setItem(LAST_STAGE_KEY, String(serverStage));
  }, [data.profile.petStage]);

  // Auto-trigger daily checkin popup
  useEffect(() => {
    if (!hasClaimedCheckinUI && data.profile.lastCheckinDate !== data.today) {
      setCelebration({
        isOpen: true,
        type: "checkin",
        coinsAwarded: 15,
      });
      setHasClaimedCheckinUI(true); // Prevent re-triggering while server action runs
    }
  }, [data.profile.lastCheckinDate, data.today, hasClaimedCheckinUI]);

  // Xử lý action tự động nhả về trạng thái nền sau vài giây (các action "một lần").
  useEffect(() => {
    const transient: CompanionAction[] = [
      "welcome", "happy", "sad", "return_cry", "task_celebrate",
      "proud_smile", "embarrassed_blush", "eat",
      "streak_30", "streak_100", "streak_365", "streak_1000",
    ];
    if (companionOverrideAction && transient.includes(companionOverrideAction)) {
      const timer = setTimeout(() => {
        setCompanionOverrideAction(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [companionOverrideAction]);

  // Lời chào khi mở app: chỉ chạy MỘT lần (ref guard) — nếu đã vắng mặt ≥ 2 ngày thì
  // thỏ mừng tủi chạy tới (return_cry), ngược lại vẫy tay chào bình thường. Ref guard
  // cho phép khai báo đủ deps (hết cảnh báo exhaustive-deps) mà vẫn không chào lại sau
  // mỗi lần router.refresh().
  const greetedRef = useRef(false);
  useEffect(() => {
    if (greetedRef.current) return;
    greetedRef.current = true;
    const last = data.profile.lastCheckinDate;
    const away = last ? daysBetween(last, data.today) >= 2 : false;
    setCompanionOverrideAction(away ? "return_cry" : "welcome");
  }, [data.profile.lastCheckinDate, data.today]);

  // Re-sync whenever the server sends fresh data (after router.refresh()).
  useEffect(() => {
    setHabits(data.habits);
    setCoins(data.profile.coins);
    setSatiety(data.profile.satiety);
    setPetExp(data.profile.petExp);
    setAffection(data.profile.affection);
  }, [data]);

  // Restore last-viewed room, clamped to one that's actually unlocked.
  useEffect(() => {
    const stored = window.localStorage.getItem(LAST_ROOM_KEY) as RoomId | null;
    if (stored && data.profile.unlockedRooms.includes(stored)) {
      setCurrentRoomId(stored);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If the current room ever falls outside the unlocked set, snap back to bedroom.
  // Skipped while a dev level override is active so rooms can be previewed freely.
  useEffect(() => {
    if (devLevelOverride === null && !data.profile.unlockedRooms.includes(currentRoomId)) {
      setCurrentRoomId("bedroom");
    }
  }, [data.profile.unlockedRooms, currentRoomId, devLevelOverride]);

  // Pick a time-of-day tint once on mount (and refresh it hourly).
  useEffect(() => {
    const compute = () => {
      const h = new Date().getHours();
      setTimeOfDay(h < 6 || h >= 22 ? "night" : h < 9 ? "morning" : h < 17 ? "day" : "evening");
    };
    compute();
    const id = setInterval(compute, 60 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  const goToRoom = (id: RoomId) => {
    setCurrentRoomId(id);
    window.localStorage.setItem(LAST_ROOM_KEY, id);
    setAmbientAction(roomDef(id).idleAction);
  };

  // Move the pet to an action's room *only if it's unlocked* — the action itself
  // always runs regardless, so care never depends on room progression.
  const moveToRoomFor = (kind: InteractionKind) => {
    const target = ACTION_ROOM[kind];
    const unlocked = devLevelOverride !== null ? unlockedRooms(devLevelOverride) : data.profile.unlockedRooms;
    if (target && target !== currentRoomId && unlocked.includes(target)) goToRoom(target);
  };

  // Capture the user's real timezone once so streaks roll over on their local day.
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && tz !== data.profile.timezone) {
      updateTimezoneAction(tz).then(() => router.refresh());
    }
  }, [data.profile.timezone, router]);

  const completedCount = habits.filter((h) => h.isCompleted).length;
  const totalCount = habits.length;

  useEffect(() => {
    if (totalCount > 0 && completedCount === totalCount) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.4 },
        colors: ["#FF3B30", "#FF9500", "#FFCC00", "#4CD964", "#5AC8FA", "#007AFF"],
      });
    }
  }, [completedCount, totalCount]);

  const commitToggle = (habit: HabitWithLog, value?: number) => {
    if (inFlight.current.has(habit.id)) return; // ignore re-entrant taps
    inFlight.current.add(habit.id);
    setPendingIds((prev) => new Set(prev).add(habit.id));

    const willComplete = !habit.isCompleted;
    const isNegative = habit.type === "negative";
    const delta = (willComplete ? 1 : -1) * (isNegative ? -1 : 1);

    // Optimistic update.
    setHabits((prev) =>
      prev.map((h) => (h.id === habit.id ? { ...h, isCompleted: willComplete, value: value ?? null } : h))
    );
    setCoins((c) => Math.max(0, c + delta * 10));
    
    if (willComplete) {
      if (!isNegative) {
        playTing();
        setCompanionOverrideAction("happy");
        setCelebration({
          isOpen: true,
          type: "habit",
          coinsAwarded: 10,
        });
      } else {
        setCompanionOverrideAction("sad");
      }
    } else {
      if (isNegative) {
        setCompanionOverrideAction("happy");
      } else {
        setCompanionOverrideAction("sad");
      }
    }

    startTransition(async () => {
      try {
        await toggleHabitAction({ habitId: habit.id, value, date: data.currentDate });
        router.refresh();
      } finally {
        inFlight.current.delete(habit.id);
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(habit.id);
          return next;
        });
      }
    });
  };

  const handleIncrementCounter = (habit: HabitWithLog, amount: number) => {
    if (pendingIds.has(habit.id)) return;
    const currentVal = habit.value || 0;
    const target = habit.config.target_count || 1;
    if (currentVal + amount < 0) return;
    
    playSwoosh();
    setPendingIds((prev) => new Set(prev).add(habit.id));
    inFlight.current.add(habit.id);

    startTransition(async () => {
      try {
        await incrementCounterHabitAction({ 
          habitId: habit.id, 
          incrementAmount: amount, 
          targetCount: target,
          date: data.currentDate
        });
        
        // If it completes, play celebration
        if (currentVal + amount >= target) {
          playTing();
          setCelebration({ isOpen: true, type: "habit", habitTitle: habit.title });
          setCompanionOverrideAction("happy");
        }
        
        router.refresh();
      } finally {
        inFlight.current.delete(habit.id);
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(habit.id);
          return next;
        });
      }
    });
  };

  const handleCloseCelebration = () => {
    const isCheckin = celebration.type === "checkin";
    setCelebration((prev) => ({ ...prev, isOpen: false }));
    if (isCheckin) {
      setCoins((c) => c + 15);
      startTransition(async () => {
        await claimDailyCheckinAction();
        router.refresh();
      });
    }
  };

  const handleDoIt = (habit: HabitWithLog) => {
    if (habit.type === "timer") {
      playSwoosh();
      setTimerHabit(habit);
      return;
    }
    commitToggle(habit);
  };

  const spawnFloat = (text: string) => {
    const id = ++floatId.current;
    setFloats((f) => [...f, { id, text }]);
    setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 1400);
  };

  const handleFeed = (tierId: string) => {
    if (careInFlight.current) return; // ignore rapid re-taps (double-spend guard)
    const tier = foodTier(tierId);
    if (!tier || coins < tier.cost) return;
    careInFlight.current = true;
    moveToRoomFor("feed");

    // Optimistic: spend coins + restore satiety. EXP is reconciled from the server
    // result (it depends on the real satiety deficit) then via router.refresh().
    playTing();
    setCoins((c) => Math.max(0, c - tier.cost));
    setSatiety((s) => Math.min(100, s + tier.satiety));
    setCompanionOverrideAction("eat");

    startTransition(async () => {
      try {
        const res = await feedPetAction(tierId);
        if (res.expGain && res.expGain > 0) spawnFloat(`+${res.expGain} EXP`);
        if (res.leveledUp) {
          confetti({ particleCount: 130, spread: 95, origin: { y: 0.5 } });
        }
        router.refresh();
      } finally {
        careInFlight.current = false;
      }
    });
  };

  const handleInteract = (kind: InteractionKind) => {
    playSwoosh();
    setCompanionOverrideAction(INTERACTION_ACTION[kind]);
    moveToRoomFor(kind);
    // Optimistic tiny bond bump; server enforces cooldown/daily-cap and refresh reconciles.
    setAffection((a) => Math.min(100, a + 2));
    startTransition(async () => {
      await petInteractAction(kind);
      router.refresh();
    });
  };

  const handleClaimNeighbor = () => {
    if (!data.profile.canClaimNeighborGift) return;
    playTing();
    setCoins((c) => c + 20); // NEIGHBOR_GIFT_COINS (reconciled by refresh)
    setIsNeighborOpen(false);
    setCompanionOverrideAction("happy");
    startTransition(async () => {
      await claimNeighborGiftAction();
      router.refresh();
    });
  };

  const currentStreak = devStreakOverride !== null ? devStreakOverride : data.profile.currentStreak;
  const normalStage = stageFromStreak(currentStreak);
  const currentStage = devStageOverride !== null ? devStageOverride : normalStage;

  // Life-sim: đổi "hành động nền" theo giờ/mùa mỗi ~11s để thỏ trông có cuộc sống
  // riêng (uống trà sáng, đọc sách, ngủ đêm, lễ hội...). Chỉ đề xuất action mà stage
  // hiện tại có sprite; còn lại tự về idle. Egg (stage 0) do EggCompanion lo riêng.
  useEffect(() => {
    if (currentStage === 0) return;
    const available = new Set(Object.keys(STAGES_CONFIG[currentStage]?.actions ?? {}));
    const repick = () => setAmbientAction(pickAmbientAction({ available, weather }));
    repick();
    const id = setInterval(repick, 11000);
    return () => clearInterval(id);
  }, [currentStage, weather]);

  // Thời tiết thật (một lần/phiên): xin vị trí (im lặng nếu bị từ chối) → Open-Meteo
  // (không cần API key) → map mã WMO ra mưa/tuyết cho scheduler.
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${coords.latitude}&longitude=${coords.longitude}&current=weather_code`
          );
          const json = await res.json();
          const code = json?.current?.weather_code;
          if (!cancelled && typeof code === "number") setWeather(weatherFromCode(code));
        } catch {
          /* mạng lỗi → bỏ qua, dùng sinh hoạt theo giờ/mùa */
        }
      },
      () => {/* từ chối vị trí → bỏ qua */},
      { timeout: 8000, maximumAge: 3_600_000 }
    );
    return () => { cancelled = true; };
  }, []);

  // Ăn mừng mốc streak (30/100/365/1000) một lần duy nhất mỗi mốc.
  useEffect(() => {
    const milestone = streakMilestoneAction(currentStreak);
    if (!milestone) return;
    const key = "titroutine:celebratedStreak";
    if (window.localStorage.getItem(key) === String(currentStreak)) return;
    window.localStorage.setItem(key, String(currentStreak));
    setCompanionOverrideAction(milestone);
  }, [currentStreak]);

  // Nurture (feeding) derived state — optimistic mirrors drive these live.
  // Dev Tools can override level/satiety to preview room unlocks + moods.
  const petLevel = devLevelOverride ?? levelFromExp(petExp);
  const levelProgress = devLevelOverride !== null ? 1 : expToNextLevel(petExp).ratio;
  const effSatiety = devSatietyOverride ?? satiety;
  const mood = moodFromStats(effSatiety, affection);
  const currentRoom = roomDef(currentRoomId);
  const roomsAllUnlocked =
    devLevelOverride !== null ? allRoomsUnlocked(devLevelOverride) : data.profile.allRoomsUnlocked;

  // Room backdrop: the bedroom honours an equipped wallpaper ("its own room");
  // the other rooms use their themed background.
  const equippedWallpaperId = data.inventory.equippedItems["wallpaper"];
  const customWallpaper = SHOP_ITEMS.find((item) => item.id === equippedWallpaperId);
  const roomBackground =
    currentRoomId === "bedroom" && customWallpaper ? customWallpaper.className : currentRoom.bgClass;

  // Custom Rug
  const equippedRugId = data.inventory.equippedItems["rug"];
  const customRug = SHOP_ITEMS.find((item) => item.id === equippedRugId);

  // Custom Object (free-standing decor in the corner of the room)
  const equippedObjectId = data.inventory.equippedItems["object"];
  const customObject = SHOP_ITEMS.find((item) => item.id === equippedObjectId);

  const isEvolved = currentStage >= 1;

  // Determine current companion action. Ưu tiên: override (tương tác/tiến hoá/chào) >
  // đang bấm giờ (study) > hoàn thành hết task (happy) > hành động nền (ambient).
  let currentAction: CompanionAction = companionOverrideAction || ambientAction;
  if (timerHabit) {
    currentAction = "study"; // Đang bật timer thì bắt học
  } else if (totalCount > 0 && completedCount === totalCount && !companionOverrideAction) {
    currentAction = "happy"; // Hoàn thành hết task trong ngày thì vui
  } else if (mood === "hungry" && !companionOverrideAction) {
    currentAction = "sad"; // Đói bụng → mặt buồn (fallback lo phần thiếu sprite)
  }

  return (
    <main className="flex min-h-screen flex-col bg-earth-bg text-earth-text max-w-md mx-auto shadow-xl overflow-hidden relative">
      {/* Top half: Pet Room */}
      <section
        className={`relative flex-1 flex flex-col items-center justify-center border-b-4 border-earth-brown/10 p-6 pb-28 min-h-[52vh] transition-colors duration-1000 ${roomBackground}`}
      >
        {/* Depth layers (decorative, non-interactive): time-of-day light wash,
            floating motes, and a soft floor plane under the pet. */}
        <div className={`pointer-events-none absolute inset-0 z-0 room-lighting-${timeOfDay}`} aria-hidden />
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
          {DUST_MOTES.map((i) => (
            <span key={i} className="dust-mote" />
          ))}
        </div>
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-0 h-44 room-floor" aria-hidden />

        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20">
          <div className="bg-white/70 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 font-bold shadow-[0_1px_3px_rgba(0,0,0,0.06)] cursor-pointer group relative">
            <Flame className="w-5 h-5 text-fire-orange" />
            <span className="text-fire-orange">
              {t("streakDays", { count: currentStreak })}
            </span>
            {data.profile.streakFreezes > 0 && (
              <span className="ml-1 flex items-center text-blue-500 text-sm bg-blue-100 px-1.5 rounded" title={t("freezeTitle")}>
                ❄️ {data.profile.streakFreezes}
              </span>
            )}
            {/* Tooltip mua thẻ */}
            <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <p className="text-xs text-gray-500 mb-2">{t("freezeTooltip", { price: 50 })}</p>
              <button
                type="button"
                className="w-full bg-blue-100 text-blue-600 hover:bg-blue-200 text-xs font-bold py-1.5 rounded-lg disabled:opacity-50"
                disabled={coins < 50}
                onClick={() => {
                  setCoins(c => c - 50);
                  startTransition(async () => {
                    await buyFreezeAction();
                    router.refresh();
                  });
                }}
              >
                {t("buyFreeze")}
              </button>
            </div>
          </div>

          {/* Coins — the only other header element. Everything else moved to the
              bottom nav so the header stays clean (streak + coins only). */}
          <div className="flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 font-bold shadow-[0_1px_3px_rgba(0,0,0,0.06)] backdrop-blur-md">
            <Image src="/assets/ui/icon_coin.png" alt="" width={18} height={18} className="h-[18px] w-[18px] object-contain" />
            <span className="tabular-nums text-yellow-600">{coins}</span>
          </div>
        </div>

        {/* Equipped decor object, tucked into the bottom-left corner of the room. */}
        {customObject && (
          <Image
            src={customObject.imageUrl}
            alt=""
            width={120}
            height={120}
            className="absolute bottom-3 left-3 z-0 h-24 w-24 object-contain drop-shadow-md pointer-events-none"
          />
        )}

        {/* Encouragement chat — only once the egg has hatched into a companion. */}
        {currentStage >= 1 && (
          <div className="z-30 mb-1">
            <PetSpeechBubble remaining={totalCount - completedCount} total={totalCount} />
          </div>
        )}

        <div
          className="relative mt-2 drop-shadow-lg z-10 transition-transform hover:scale-105 cursor-pointer"
          onClick={() => {
            playSwoosh();
            // Bấm vào thỏ → phản ứng dễ thương ngẫu nhiên (stage thiếu sẽ tự fallback).
            const reactions: CompanionAction[] = ["happy", "proud_smile", "embarrassed_blush", "eat"];
            setCompanionOverrideAction(reactions[Math.floor(Math.random() * reactions.length)]);
          }}
        >
          {/* Mood-tinted spotlight behind the pet — anchors it in the room and
              carries its emotion as ambient colour (moves with the sprite). */}
          <div
            className={`pet-spotlight pet-spotlight-${mood} pointer-events-none absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2`}
            aria-hidden
          />

          {customRug ? (
            <Image
              src={customRug.imageUrl}
              alt="Rug"
              width={250}
              height={125}
              className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[220px] object-contain opacity-95 -z-10"
            />
          ) : (
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-black/20 rounded-[100%] blur-[4px] -z-10"></div>
          )}

          {currentStage === 0 ? (
            <EggCompanion streak={currentStreak} action={currentAction} className="drop-shadow-lg" />
          ) : (
            <RabbitCompanion
              key={`stage-${currentStage}-${currentAction}-${data.inventory.equippedItems["outfit"]}`}
              stage={currentStage}
              action={currentAction}
              equippedOutfit={data.inventory.equippedItems["outfit"]}
              className="drop-shadow-lg"
            />
          )}

          {/* One-shot light burst when the pet just evolved / hatched. */}
          {justEvolvedStage !== null && (
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
              <div className="evo-burst-fx" />
            </div>
          )}

          {isEvolved && (
            <div className="absolute -top-6 -right-6 animate-bounce">
              <span className="text-4xl">✨</span>
            </div>
          )}

          {/* Floating "+N EXP" rewards that rise off the pet when fed. */}
          {floats.map((f) => (
            <div
              key={f.id}
              className="exp-float pointer-events-none absolute left-1/2 top-0 z-30 -translate-x-1/2 whitespace-nowrap text-sm font-black text-purple-600 drop-shadow"
            >
              {f.text}
            </div>
          ))}
        </div>

        {/* Status chips — the read-out sits directly under the pet (not beside it),
            so nothing competes with the character for attention. */}
        <div className="z-20 mt-4">
          <PetHud level={petLevel} levelProgress={levelProgress} satiety={effSatiety} affection={affection} mood={mood} />
        </div>

        {/* Care actions — ALWAYS available (feeding can never softlock on room level).
            Each action moves the pet to its room when unlocked. The neighbourhood
            entry appears once the whole house is unlocked. */}
        <div className="absolute bottom-4 left-0 right-0 z-20 flex flex-col items-center gap-2 px-3">
          {roomsAllUnlocked && (
            <button
              type="button"
              onClick={() => {
                playSwoosh();
                setIsNeighborOpen(true);
              }}
              className="flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 text-xs font-bold text-amber-600 shadow-[0_1px_3px_rgba(0,0,0,0.06)] backdrop-blur-md hover:brightness-105"
            >
              🏘️ {tRooms("neighbors")}
            </button>
          )}
          <InteractionDock
            interactions={CARE_ACTIONS}
            onFeed={() => {
              playSwoosh();
              setIsFeedOpen(true);
            }}
            onInteract={handleInteract}
          />
        </div>
      </section>

      {/* Bottom half: Habits */}
      <section className={`flex-[1.2] bg-earth-bg p-6 pb-24 overflow-y-auto transition-opacity duration-300 ${isNavigating ? "opacity-50 pointer-events-none" : ""}`}>
        {/* Weekly Header */}
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-full shadow-sm border border-gray-100">
              <button
                type="button"
                aria-label={t("prevDay")}
                onClick={() => startNavigation(() => router.push(`/${locale}?date=${format(subWeeks(parseISO(data.currentDate), 1), "yyyy-MM-dd")}`))}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-500" />
              </button>
              <div className="text-sm font-bold text-earth-brown text-center min-w-[110px]">
                {data.weekDates ? `${format(parseISO(data.weekDates[0]), "dd/MM")} - ${format(parseISO(data.weekDates[6]), "dd/MM")}` : format(parseISO(data.currentDate), "dd/MM/yyyy")}
              </div>
              <button
                type="button"
                aria-label={t("nextDay")}
                onClick={() => startNavigation(() => router.push(`/${locale}?date=${format(addWeeks(parseISO(data.currentDate), 1), "yyyy-MM-dd")}`))}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              {!data.isToday && (
                <button
                  type="button"
                  onClick={() => startNavigation(() => router.push(`/${locale}`))}
                  className="bg-blue-600 text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-sm uppercase tracking-wider hover:bg-blue-700"
                >
                  Hôm nay
                </button>
              )}
              <span className="text-sm font-bold text-gray-500 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100">
                {t("completed", { completed: completedCount, total: totalCount })}
              </span>
            </div>
          </div>

          {/* Days of Week row */}
          {data.weekDates && (
            <div className="flex justify-between bg-white p-2 rounded-3xl shadow-sm border border-gray-100">
              {data.weekDates.map((dateStr, i) => {
                const dateObj = parseISO(dateStr);
                const isSelected = dateStr === data.currentDate;
                const isRealToday = dateStr === data.today;
                const dayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
                
                return (
                  <button
                    type="button"
                    key={dateStr}
                    onClick={() => startNavigation(() => router.push(`/${locale}?date=${dateStr}`))}
                    className={`flex flex-col items-center justify-center w-11 h-14 rounded-2xl transition-all relative ${
                      isSelected 
                        ? "bg-blue-600 text-white shadow-md scale-105" 
                        : "hover:bg-gray-50 text-gray-500"
                    }`}
                  >
                    {isRealToday && !isSelected && (
                      <span className="absolute -top-1 w-2 h-2 bg-amber-400 rounded-full"></span>
                    )}
                    <span className={`text-[10px] font-bold mb-0.5 ${isSelected ? "text-blue-200" : ""}`}>{dayNames[i]}</span>
                    <span className="text-base font-black leading-none">{format(dateObj, "dd")}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {totalCount === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 py-12 text-center text-gray-400">
            <span className="text-4xl">🌱</span>
            <p className="font-medium">{t("empty")}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {[
              { id: "morning", label: t("morning"), items: habits.filter(h => h.timeOfDay === "morning") },
              { id: "afternoon", label: t("afternoon"), items: habits.filter(h => h.timeOfDay === "afternoon") },
              { id: "evening", label: t("evening"), items: habits.filter(h => h.timeOfDay === "evening") },
              { id: "anytime", label: t("anytime"), items: habits.filter(h => !h.timeOfDay || h.timeOfDay === "anytime") }
            ].map(section => {
              if (section.items.length === 0) return null;
              return (
                <div key={section.id} className="space-y-3">
                  <h3 className="text-lg font-bold text-earth-brown flex items-center gap-2">
                    {section.label}
                  </h3>
                  {section.items.map((habit) => (
                    <div
                      key={habit.id}
                      className={`bg-white p-4 rounded-2xl border-2 flex flex-col transition-all ${
                        habit.isCompleted
                          ? "border-gray-100 opacity-60"
                          : habit.type === "negative"
                          ? "border-red-200 border-b-4 bg-red-50"
                          : "border-gray-200 border-b-4"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-4 min-w-0">
                        <button
                          type="button"
                          aria-label={t("edit")}
                          title={t("edit")}
                          onClick={() => setEditingHabit(habit)}
                          className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 transition-colors group relative ${
                            habit.type === "negative" ? "bg-red-100 hover:bg-red-200" : "bg-blue-100 hover:bg-blue-200"
                          }`}
                        >
                          <span className="group-hover:opacity-0 transition-opacity">
                            {habit.type === "timer" ? "⏳" : habit.type === "negative" ? "💥" : "💧"}
                          </span>
                          <Pencil className={`w-5 h-5 absolute opacity-0 group-hover:opacity-100 transition-opacity ${
                            habit.type === "negative" ? "text-red-500" : "text-blue-500"
                          }`} />
                        </button>
                        <div className="min-w-0">
                          <h3
                            className={`font-bold truncate ${
                              habit.isCompleted ? "line-through text-gray-400" : habit.type === "negative" ? "text-red-600" : "text-earth-text"
                            }`}
                          >
                            {habit.title}
                          </h3>
                          <p className={`text-sm font-medium ${habit.type === "negative" ? "text-red-400" : "text-gray-400"}`}>
                            {habit.type === "timer" && habit.config.target_time
                              ? t("minutes", { count: Math.round(habit.config.target_time / 60) })
                              : habit.type === "counter" && habit.config.target_count
                              ? t("targetGoal", { count: habit.config.target_count })
                              : habit.type === "negative"
                              ? t("noViolate")
                              : t("daily")}
                          </p>
                        </div>
                      </div>

                      {habit.isCompleted ? (
                        <button
                          type="button"
                          aria-label={t("undo")}
                          title={t("undo")}
                          disabled={pendingIds.has(habit.id)}
                          onClick={() => commitToggle(habit)}
                          className="shrink-0 disabled:opacity-50"
                        >
                          <CheckCircle className={`w-8 h-8 ${habit.type === "negative" ? "text-red-500" : "text-green-500"}`} />
                        </button>
                      ) : habit.type === "counter" ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={pendingIds.has(habit.id)}
                            onClick={() => handleIncrementCounter(habit, -1)}
                            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold hover:bg-gray-200 text-gray-600 disabled:opacity-50"
                          >
                            -
                          </button>
                          <span className="font-bold tabular-nums min-w-[2.5rem] text-center text-earth-text">
                            {habit.value || 0}/{habit.config.target_count || 1}
                          </span>
                          <button
                            type="button"
                            disabled={pendingIds.has(habit.id)}
                            onClick={() => handleIncrementCounter(habit, 1)}
                            className="w-8 h-8 rounded-full bg-fire-orange flex items-center justify-center font-bold text-white hover:bg-orange-600 shadow-sm disabled:opacity-50"
                          >
                            +
                          </button>
                        </div>
                      ) : habit.type === "negative" ? (
                        <button
                          type="button"
                          disabled={pendingIds.has(habit.id)}
                          onClick={() => handleDoIt(habit)}
                          className="shrink-0 bg-red-100 text-red-600 border-2 border-red-200 hover:bg-red-200 font-bold px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                        >
                          {t("violate")}
                        </button>
                      ) : (
                        <DuoButton
                          variant="primary"
                          size="sm"
                          className="shrink-0"
                          disabled={pendingIds.has(habit.id)}
                          onClick={() => handleDoIt(habit)}
                        >
                          {t("doIt")}
                        </DuoButton>
                      )}
                      </div>

                      {/* Mini Weekly Calendar */}
                      {data.weekDates && (
                        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between px-2">
                          {data.weekDates.map((dateStr, i) => {
                            const isPast = dateStr < data.today;
                            const isFuture = dateStr > data.today;
                            const completed = habit.weeklyLogs?.[dateStr];
                            const dayNames = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
                            
                            let bgClass = "bg-gray-50 border border-gray-100"; 
                            let textClass = "text-gray-400";
                            let checkIcon = null;

                            if (completed) {
                              bgClass = "bg-green-100 border border-green-200";
                              textClass = "text-green-600 font-bold";
                              checkIcon = "✓";
                            } else if (isPast) {
                              bgClass = "bg-red-50 border border-red-200";
                              textClass = "text-red-500";
                              checkIcon = "×";
                            } else if (!isFuture && !completed) {
                              // Today and not completed
                              bgClass = "bg-gray-100 border border-gray-300";
                              textClass = "text-gray-500";
                            }
                            
                            return (
                              <div key={dateStr} className="flex flex-col items-center gap-1.5" title={format(parseISO(dateStr), "dd/MM/yyyy")}>
                                <span className={`text-[9px] uppercase tracking-wider font-bold ${textClass}`}>{dayNames[i]}</span>
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${bgClass} ${textClass}`}>
                                  {checkIcon}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Single bottom navigation — keeps the header clean (streak + coins only). */}
      <BottomNav
        onHome={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        onShop={() => { playSwoosh(); setIsShopOpen(true); }}
        onAlbum={() => { playSwoosh(); setIsAlbumOpen(true); }}
        onAnalytics={() => { playSwoosh(); router.push(`/${locale}/analytics`); }}
        onSettings={() => setIsSettingsOpen(true)}
      />

      {/* Add-habit FAB, floating just above the bottom nav. */}
      <div className="absolute bottom-24 right-6 z-30">
        <DuoButton
          variant="primary"
          size="lg"
          onClick={() => {
            playSwoosh();
            setIsAddOpen(true);
          }}
          className="rounded-full w-16 h-16 !p-0 text-3xl shadow-lg border-b-8 hover:brightness-110 active:border-b-0 active:translate-y-2"
        >
          +
        </DuoButton>
      </div>

      {/* Modals */}
      <HabitModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSaved={() => router.refresh()}
      />
      <HabitModal
        isOpen={editingHabit !== null}
        habit={editingHabit}
        onClose={() => setEditingHabit(null)}
        onSaved={() => router.refresh()}
      />
      <TimerModal
        habit={timerHabit}
        onClose={() => setTimerHabit(null)}
        onComplete={(seconds) => {
          if (timerHabit) commitToggle(timerHabit, seconds);
          setTimerHabit(null);
        }}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        report={{
          streak: data.profile.currentStreak,
          coins: data.profile.coins,
          habitsCompleted: completedCount,
          totalHabits: totalCount,
          petStage: isEvolved ? "rabbit" : "egg",
        }}
        email={data.email}
        devStageOverride={devStageOverride}
        setDevStageOverride={setDevStageOverride}
        devStreakOverride={devStreakOverride}
        setDevStreakOverride={setDevStreakOverride}
        devLevelOverride={devLevelOverride}
        setDevLevelOverride={setDevLevelOverride}
        devSatietyOverride={devSatietyOverride}
        setDevSatietyOverride={setDevSatietyOverride}
      />

      <MemoryAlbumModal
        isOpen={isAlbumOpen}
        onClose={() => setIsAlbumOpen(false)}
        currentStreak={currentStreak}
        unlockedMemories={data.unlockedMemories}
      />
      
      <ShopModal
        isOpen={isShopOpen}
        onClose={() => setIsShopOpen(false)}
        coins={coins}
        unlockedItems={data.inventory.unlockedItems}
        equippedItems={data.inventory.equippedItems}
        onSpend={(amt) => setCoins((c) => Math.max(0, c - amt))}
      />
      
      <CelebrationModal
        isOpen={celebration.isOpen}
        onClose={handleCloseCelebration}
        type={celebration.type}
        streakCount={currentStreak}
        coinsAwarded={celebration.coinsAwarded}
      />

      <CelebrationModal
        isOpen={justEvolvedStage !== null}
        onClose={() => setJustEvolvedStage(null)}
        type="evolution"
        evolutionStageName={justEvolvedStage !== null ? tStages(`stage${justEvolvedStage}`) : undefined}
      />

      <FeedPicker
        isOpen={isFeedOpen}
        coins={coins}
        onClose={() => setIsFeedOpen(false)}
        onFeed={handleFeed}
      />

      <NeighborModal
        isOpen={isNeighborOpen}
        canClaim={data.profile.canClaimNeighborGift}
        onClose={() => setIsNeighborOpen(false)}
        onVisit={handleClaimNeighbor}
      />
    </main>
  );
}
