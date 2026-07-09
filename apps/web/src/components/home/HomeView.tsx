"use client";

import { useEffect, useRef, useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { CheckCircle, Flame, Pencil, ChevronLeft, ChevronRight, X, DoorOpen, CircleUser, Users, Palette, Compass, Heart, Lock } from "lucide-react";
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
import { DesktopSidebar } from "@/components/home/DesktopSidebar";

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
  startAdventureAction,
  equipItemAction,
  cleanMessSpotAction,
  setVacationModeAction,
  moveDecorAction,
} from "@/app/[locale]/actions";
import { spotsForRoom, cleaningProgress, SPOT_CLEAN_COINS, ROOM_CLEAN_BONUS_COINS, ROOM_CLEAN_GIFTS, type MessSpot } from "@/lib/cleaning";
import { stageFromStreak, daysBetween, moodFromStats, levelFromExp, expToNextLevel, foodTier } from "@/lib/game";
import { roomDef, unlockedRooms, allRoomsUnlocked, ROOMS, INTERACTION_ACTION, type RoomId, type InteractionKind } from "@/lib/rooms";
import type { DashboardData, HabitWithLog } from "@/lib/types";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { CarrotPlanting } from "@/components/tasks/CarrotPlanting";

// Import các Modal & Action mới cho tính năng nâng cấp (Finch Level)
import { MoodCheckinModal } from "@/components/mindfulness/MoodCheckinModal";
import { BreathingModal } from "@/components/mindfulness/BreathingModal";
import { FirstAidModal } from "@/components/mindfulness/FirstAidModal";
import { PetProfileModal } from "@/components/home/PetProfileModal";
import { AdventureView } from "@/components/adventure/AdventureView";
import { StoryDialogModal } from "@/components/adventure/StoryDialogModal";
import { TreeTownModal } from "@/components/social/TreeTownModal";
import { VibeInboxModal } from "@/components/social/VibeInboxModal";

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
  const tShop = useTranslations("Shop");
  const locale = useLocale();
  const router = useRouter();
  const { playTing, playSwoosh } = useSound();

  // Server data is the source of truth; mirror it locally for optimistic UI.
  const [habits, setHabits] = useState(data.habits);
  const [coins, setCoins] = useState(data.profile.coins);
  const [focusTokens, setFocusTokens] = useState(data.profile.focusTokens ?? 0);
  const [consumables, setConsumables] = useState(data.inventory.consumables ?? {});
  const [unlockedItems, setUnlockedItems] = useState(data.inventory.unlockedItems ?? []);
  const [cleaningEnergy, setCleaningEnergy] = useState(data.profile.cleaningEnergy ?? 0);
  const [cleanedSpots, setCleanedSpots] = useState(data.profile.cleanedSpots ?? {});
  const [vacationMode, setVacationMode] = useState(data.profile.vacationMode ?? false);
  const [decorPositions, setDecorPositions] = useState(data.inventory.decorPositions ?? {});
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());
  const [activeTab, setActiveTab] = useState<"habits" | "tasks">("habits");

  const overdueTasks = (data.tasks || []).filter(
    (t) => t.status !== "done" && t.deadline && new Date(t.deadline) < new Date()
  );
  const hasOverdueTasks = overdueTasks.length > 0;
  const hasInProgressTask = (data.tasks || []).some((t) => t.status === "in_progress");
  
  // Theme state: default is 'matcha' to highlight the upgraded aesthetic!
  const [theme, setTheme] = useState<"neutral" | "matcha" | "ube">("matcha");
  
  useEffect(() => {
    const saved = window.localStorage.getItem("titroutine:theme") as "neutral" | "matcha" | "ube" | null;
    if (saved) setTheme(saved);
  }, []);

  const handleThemeChange = (newTheme: "neutral" | "matcha" | "ube") => {
    setTheme(newTheme);
    window.localStorage.setItem("titroutine:theme", newTheme);
  };
  // Synchronous guard so a rapid double-tap can't double-award coins/EXP.
  const inFlight = useRef<Set<string>>(new Set());
  // The internally-scrolling habits pane (the shell itself never scrolls).
  const habitsRef = useRef<HTMLElement>(null);
  const [, startTransition] = useTransition();
  const [isNavigating, startNavigation] = useTransition();

  type ActiveOverlay =
    | null
    | "settings"
    | "shop"
    | "album"
    | "neighbor"
    | "timer"
    | "mood_checkin"
    | "breathing"
    | "first_aid"
    | "pet_profile"
    | "add_habit"
    | "edit_habit"
    | "feed"
    | "celebration"
    | "friendships"
    | "adventure_story"
    | "vibe_inbox"
    | "mindfulness_menu"
    | "quick_menu";

  const [activeOverlay, setActiveOverlay] = useState<ActiveOverlay>(null);

  const isAddOpen = activeOverlay === "add_habit";
  const setIsAddOpen = (val: boolean) => setActiveOverlay(val ? "add_habit" : null);

  const [editingHabit, _setEditingHabit] = useState<HabitWithLog | null>(null);
  const setEditingHabit = (val: HabitWithLog | null) => {
    _setEditingHabit(val);
    setActiveOverlay(val ? "edit_habit" : null);
  };

  const [timerHabit, _setTimerHabit] = useState<HabitWithLog | null>(null);
  const setTimerHabit = (val: HabitWithLog | null) => {
    _setTimerHabit(val);
    setActiveOverlay(val ? "timer" : null);
  };

  const isSettingsOpen = activeOverlay === "settings";
  const setIsSettingsOpen = (val: boolean) => setActiveOverlay(val ? "settings" : null);

  const isAlbumOpen = activeOverlay === "album";
  const setIsAlbumOpen = (val: boolean) => setActiveOverlay(val ? "album" : null);

  const isShopOpen = activeOverlay === "shop";
  const setIsShopOpen = (val: boolean) => setActiveOverlay(val ? "shop" : null);

  const [petDialogue, setPetDialogue] = useState<string | null>(null);
  const dialogueTimerRef = useRef<NodeJS.Timeout | null>(null);
  const showPetDialogue = (text: string) => {
    if (dialogueTimerRef.current) clearTimeout(dialogueTimerRef.current);
    setPetDialogue(text);
    dialogueTimerRef.current = setTimeout(() => {
      setPetDialogue(null);
    }, 6000);
  };

  const [pendingVibesOpen, setPendingVibesOpen] = useState(true);
  const [showStoryDialog, setShowStoryDialog] = useState(false);
  const [adventureTimeLeft, setAdventureTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (data.profile.adventureStatus !== "adventuring" || !data.profile.adventureStartAt) {
      setAdventureTimeLeft(0);
      return;
    }

    const calculate = () => {
      const startMs = new Date(data.profile.adventureStartAt!).getTime();
      const elapsed = (Date.now() - startMs) / 1000;
      const totalDuration = 30; // 30 seconds
      setAdventureTimeLeft(Math.max(0, Math.ceil(totalDuration - elapsed)));
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [data.profile.adventureStatus, data.profile.adventureStartAt]);

  // States for Interactive Decor Mode & Furniture Toggles
  const [isDecorMode, setIsDecorMode] = useState(false);
  const [selectedDecorSlot, setSelectedDecorSlot] = useState<"wallpaper" | "rug" | "object" | null>(null);
  const [isLampOn, setIsLampOn] = useState(true);
  const [isCandleOn, setIsCandleOn] = useState(true);
  const [isRadioOn, setIsRadioOn] = useState(true);

  // Optimistic tracking for room decoration swaps
  const [localEquipped, setLocalEquipped] = useState<Record<string, string | null>>({});
  const equippedFor = (slot: string): string | null =>
    slot in localEquipped ? localEquipped[slot] : data.inventory.equippedItems[slot] ?? null;

  const commitEquip = async (slot: string, itemId: string | null): Promise<string | null> => {
    const previous = equippedFor(slot);
    setLocalEquipped((prev) => ({ ...prev, [slot]: itemId }));
    try {
      const res = await equipItemAction(slot, itemId);
      if (res?.error) {
        setLocalEquipped((prev) => ({ ...prev, [slot]: previous }));
        return res.error;
      }
    } catch (e: unknown) {
      setLocalEquipped((prev) => ({ ...prev, [slot]: previous }));
      return e instanceof Error ? e.message : "error";
    }
    router.refresh();
    return null;
  };

  const [companionOverrideAction, setCompanionOverrideAction] = useState<CompanionAction | null>(null);
  // "Hành động nền" do scheduler chọn theo giờ/mùa (khi không có override/timer).
  const [ambientAction, setAmbientAction] = useState<CompanionAction>("idle");
  // Thời tiết thật (nếu xin được vị trí) → thỏ ngắm mưa/đắp người tuyết đúng lúc.
  const [weather, setWeather] = useState<"rain" | "snow" | null>(null);

  // ── Nurture (feeding) state — optimistic mirrors of server truth ──────────
  const [satiety, setSatiety] = useState(data.profile.satiety);
  const [petExp, setPetExp] = useState(data.profile.petExp);
  const [affection, setAffection] = useState(data.profile.affection);

  const isFeedOpen = activeOverlay === "feed";
  const setIsFeedOpen = (val: boolean) => setActiveOverlay(val ? "feed" : null);

  const isNeighborOpen = activeOverlay === "neighbor";
  const setIsNeighborOpen = (val: boolean) => setActiveOverlay(val ? "neighbor" : null);
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

  // Tooltip, room switcher & sweeping states
  const [showFreezeTooltip, setShowFreezeTooltip] = useState(false);
  const [isRoomSwitcherOpen, setIsRoomSwitcherOpen] = useState(false);
  const [sweepingSpotId, setSweepingSpotId] = useState<string | null>(null);

  const [showToolbars, setShowToolbars] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const habitsEl = habitsRef.current;
    if (!habitsEl) return;

    const handleScroll = () => {
      const currentScrollY = habitsEl.scrollTop;
      
      // Nếu cuộn về sát trên cùng, luôn hiện thanh công cụ
      if (currentScrollY <= 10) {
        setShowToolbars(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      const diff = currentScrollY - lastScrollY.current;
      // Khoảng cách cuộn tối thiểu là 15px để tránh quá nhạy
      if (Math.abs(diff) < 15) return;

      if (diff > 0) {
        // Đang cuộn xuống -> Ẩn thanh công cụ
        setShowToolbars(false);
      } else {
        // Đang cuộn lên -> Hiện thanh công cụ
        setShowToolbars(true);
      }
      lastScrollY.current = currentScrollY;
    };

    habitsEl.addEventListener("scroll", handleScroll);
    return () => {
      habitsEl.removeEventListener("scroll", handleScroll);
    };
  }, []);

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
    setFocusTokens(data.profile.focusTokens ?? 0);
    setConsumables(data.inventory.consumables ?? {});
    setUnlockedItems(data.inventory.unlockedItems ?? []);
    setCleaningEnergy(data.profile.cleaningEnergy ?? 0);
    setCleanedSpots(data.profile.cleanedSpots ?? {});
    setVacationMode(data.profile.vacationMode ?? false);
    setDecorPositions(data.inventory.decorPositions ?? {});
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
    if (careInFlight.current) return;
    const tier = foodTier(tierId);
    if (!tier) return;
    careInFlight.current = true;
    moveToRoomFor("feed");

    // Optimistic: tăng satiety tạm thời, không trừ tiền trực tiếp ở client nữa
    playTing();
    const prevConsumables = { ...consumables };
    const prevSatiety = satiety;

    setSatiety((s) => Math.min(100, s + tier.satiety));
    setConsumables((c) => ({
      ...c,
      [tierId]: Math.max(0, (c[tierId] ?? 0) - 1),
    }));
    setCompanionOverrideAction("eat");

    startTransition(async () => {
      try {
        const res = await feedPetAction(tierId);
        if (res.dialogue) {
          showPetDialogue(res.dialogue);
        }
        if (res.error) {
          setCompanionOverrideAction("sad");
          setSatiety(prevSatiety);
          setConsumables(prevConsumables);
        } else {
          if (res.expGain && res.expGain > 0) spawnFloat(`+${res.expGain} EXP`);
          if (res.leveledUp) {
            confetti({ particleCount: 130, spread: 95, origin: { y: 0.5 } });
          }
        }
        router.refresh();
      } catch {
        setCompanionOverrideAction("sad");
        setSatiety(prevSatiety);
        setConsumables(prevConsumables);
      } finally {
        careInFlight.current = false;
      }
    });
  };

  const handleInteract = (kind: InteractionKind, itemId?: string) => {
    playSwoosh();
    setCompanionOverrideAction(INTERACTION_ACTION[kind]);
    moveToRoomFor(kind);

    const prevConsumables = { ...consumables };
    const prevAffection = affection;
    const prevSatiety = satiety;

    // Optimistic tiny bond bump
    setAffection((a) => Math.min(100, a + 2));
    if (kind === "play" && itemId) {
      setConsumables((c) => ({
        ...c,
        [itemId]: Math.max(0, (c[itemId] ?? 0) - 1),
      }));
      setSatiety((s) => Math.max(0, s - 5));
    }

    startTransition(async () => {
      try {
        const res = await petInteractAction(kind, itemId);
        if (res.dialogue) {
          showPetDialogue(res.dialogue);
        }
        if (res.error) {
          setCompanionOverrideAction("sad");
          setAffection(prevAffection);
          if (kind === "play" && itemId) {
            setConsumables(prevConsumables);
            setSatiety(prevSatiety);
          }
        }
      } catch {
        setCompanionOverrideAction("sad");
        setAffection(prevAffection);
        if (kind === "play" && itemId) {
          setConsumables(prevConsumables);
          setSatiety(prevSatiety);
        }
      }
      router.refresh();
    });
  };

  // Dọn một điểm bừa bộn (Habit-Rabbit loop): optimistic trừ năng lượng + ẩn
  // đống bừa ngay, server xác nhận; rollback đầy đủ nếu lỗi.
  const cleanInFlight = useRef(false);
  const handleCleanSpot = (spot: MessSpot) => {
    if (cleanInFlight.current || cleanedSpots[spot.id] || sweepingSpotId !== null) return;
    if (cleaningEnergy < spot.cost) {
      showPetDialogue(t("cleanNotEnough"));
      return;
    }
    cleanInFlight.current = true;
    setSweepingSpotId(spot.id);

    // After 800ms of sweeping animation, complete the cleaning process
    setTimeout(() => {
      playTing();

      const prevEnergy = cleaningEnergy;
      const prevCleaned = { ...cleanedSpots };
      const prevCoins = coins;

      setCleaningEnergy((e) => Math.max(0, e - spot.cost));
      setCleanedSpots((m) => ({ ...m, [spot.id]: true }));
      setCoins((c) => c + SPOT_CLEAN_COINS);
      spawnFloat(`+${SPOT_CLEAN_COINS} 🪙`);
      confetti({ particleCount: 30, spread: 45, origin: { y: 0.55 }, scalar: 0.7 });

      startTransition(async () => {
        try {
          const res = await cleanMessSpotAction(spot.id);
          if (res.error) {
            setCleaningEnergy(prevEnergy);
            setCleanedSpots(prevCleaned);
            setCoins(prevCoins);
            setCompanionOverrideAction("sad");
          } else if (res.roomCleaned) {
            setCoins((c) => c + ROOM_CLEAN_BONUS_COINS);
            if (res.giftItemId) {
              setUnlockedItems((prev) => (prev.includes(res.giftItemId!) ? prev : [...prev, res.giftItemId!]));
            }
            confetti({ particleCount: 130, spread: 95, origin: { y: 0.5 } });
            showPetDialogue(t("cleanRoomDone"));
          }
          router.refresh();
        } catch {
          setCleaningEnergy(prevEnergy);
          setCleanedSpots(prevCleaned);
          setCoins(prevCoins);
          setCompanionOverrideAction("sad");
        } finally {
          setSweepingSpotId(null);
          cleanInFlight.current = false;
        }
      });
    }, 800);
  };

  // Bật/tắt chế độ đi nghỉ — optimistic, rollback khi server lỗi.
  const handleVacationToggle = (enabled: boolean) => {
    playTing();
    setVacationMode(enabled);
    startTransition(async () => {
      try {
        const res = await setVacationModeAction(enabled);
        if (res?.error) setVacationMode(!enabled);
      } catch {
        setVacationMode(!enabled);
      }
      router.refresh();
    });
  };

  // Kéo-thả nội thất (Habit-Rabbit draggable decor): giữ + kéo món object trong
  // phòng, vị trí (%) lưu theo từng phòng. Kéo < 8px được coi là "chạm" để giữ
  // nguyên hành vi bật/tắt đèn-nến-đài cũ.
  const roomSectionRef = useRef<HTMLElement | null>(null);
  const decorDragRef = useRef<{ down: boolean; moved: boolean; startX: number; startY: number; prev?: { x: number; y: number } } | null>(null);
  const decorDragMovedRef = useRef(false);
  const latestDecorPosRef = useRef<{ x: number; y: number } | null>(null);

  const handleDecorPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    decorDragRef.current = {
      down: true,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
      prev: decorPositions[currentRoomId],
    };
  };

  const handleDecorPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = decorDragRef.current;
    if (!d?.down) return;
    if (!d.moved && Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < 8) return;
    d.moved = true;
    const rect = roomSectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.min(94, Math.max(6, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(92, Math.max(18, ((e.clientY - rect.top) / rect.height) * 100));
    const pos = { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
    latestDecorPosRef.current = pos;
    setDecorPositions((m) => ({ ...m, [currentRoomId]: pos }));
  };

  const handleDecorPointerUp = () => {
    const d = decorDragRef.current;
    if (!d) return;
    decorDragRef.current = null;
    if (!d.moved) return;
    decorDragMovedRef.current = true; // chặn onClick toggle ngay sau cú kéo
    const pos = latestDecorPosRef.current;
    if (!pos) return;
    const roomAtDrop = currentRoomId;
    const prev = d.prev;
    playTing();
    startTransition(async () => {
      const rollback = () =>
        setDecorPositions((m) => {
          const next = { ...m };
          if (prev) next[roomAtDrop] = prev;
          else delete next[roomAtDrop];
          return next;
        });
      try {
        const res = await moveDecorAction(roomAtDrop, pos.x, pos.y);
        if (res?.error) rollback();
      } catch {
        rollback();
      }
      router.refresh();
    });
  };

  const currentStreak = devStreakOverride !== null ? devStreakOverride : data.profile.currentStreak;
  const normalStage = devStreakOverride !== null ? stageFromStreak(devStreakOverride) : data.profile.petStage;
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
  // the other rooms use their themed background. The wallpaper is rendered as a
  // real <Image fill> layer (NOT a dynamic Tailwind arbitrary-value class —
  // url classes assembled at runtime are never generated by the compiler).
  const equippedWallpaperId = equippedFor("wallpaper");
  const customWallpaper = SHOP_ITEMS.find((item) => item.id === equippedWallpaperId);
  const showWallpaper = currentRoomId === "bedroom" && !!customWallpaper;
  const roomBackground = currentRoom.bgClass;

  // Custom Rug
  const equippedRugId = equippedFor("rug");
  const customRug = SHOP_ITEMS.find((item) => item.id === equippedRugId);

  // Custom Object (free-standing decor in the corner of the room)
  const equippedObjectId = equippedFor("object");
  const customObject = SHOP_ITEMS.find((item) => item.id === equippedObjectId);

  // Pet accessory (emoji hat/bow worn on the head — works for every stage)
  const equippedAccessory = SHOP_ITEMS.find((item) => item.id === equippedFor("accessory"));

  // Vị trí kéo-thả của món nội thất trong phòng hiện tại (undefined = góc trái cũ)
  const objectPos = decorPositions[currentRoomId];

  const isEvolved = currentStage >= 1;

  // Determine current companion action. Ưu tiên: override (tương tác/tiến hoá/chào) >
  // đang bấm giờ (study) > có task quá hạn (sad) > hoàn thành hết task (happy) > hành động nền (ambient).
  let currentAction: CompanionAction = companionOverrideAction || ambientAction;
  if (timerHabit) {
    currentAction = "study"; // Đang bật timer thì bắt học
  } else if (hasInProgressTask && !companionOverrideAction) {
    currentAction = "study"; // Có task đang làm -> thỏ làm cùng
  } else if (hasOverdueTasks && !companionOverrideAction) {
    currentAction = "sad"; // Có task quá hạn -> buồn bã
  } else if (totalCount > 0 && completedCount === totalCount && !companionOverrideAction) {
    currentAction = "happy"; // Hoàn thành hết task trong ngày thì vui
  } else if (mood === "hungry" && !companionOverrideAction) {
    currentAction = "sad"; // Đói bụng → mặt buồn (fallback lo phần thiếu sprite)
  }

  const optimisticEquippedItems = useMemo(() => {
    const res = { ...data.inventory.equippedItems };
    for (const [k, v] of Object.entries(localEquipped)) {
      if (v === null) {
        delete res[k];
      } else {
        res[k] = v;
      }
    }
    return res;
  }, [data.inventory.equippedItems, localEquipped]);

  return (
    // App-shell: the shell is exactly one viewport tall (h-dvh) and never grows —
    // the habits section scrolls internally, so the bottom nav + FAB stay on
    // screen no matter how long the habit list gets.
    <main className={`flex h-dvh w-full max-w-md md:max-w-none flex-col md:flex-row bg-earth-bg text-earth-text shadow-xl md:shadow-none overflow-hidden relative theme-${theme}`}>
      {/* Desktop Sidebar (Notion-style) */}
      <DesktopSidebar
        activeTab={activeTab}
        onHome={() => { playSwoosh(); setActiveTab("habits"); }}
        onTasks={() => { playSwoosh(); setActiveTab("tasks"); }}
        onShop={() => { playSwoosh(); setIsShopOpen(true); }}
        onAlbum={() => { playSwoosh(); setIsAlbumOpen(true); }}
        onAnalytics={() => { playSwoosh(); router.push(`/${locale}/analytics`); }}
        onSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Workspace split panel */}
      <div className="flex-1 flex flex-col md:flex-row min-w-0 h-full relative">
        {/* Top half: Pet Room */}
        <section
          ref={roomSectionRef}
          className={`relative flex-1 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-theme-border p-6 pb-24 min-h-[52vh] md:min-h-0 h-full transition-colors duration-1000 ${roomBackground}`}
        >
        {/* Equipped wallpaper (bedroom only) — sits under the lighting/motes layers. */}
        {showWallpaper && customWallpaper && (
          <Image
            src={customWallpaper.imageUrl}
            alt=""
            fill
            priority
            sizes="(max-width: 448px) 100vw, 448px"
            className="pointer-events-none absolute inset-0 z-0 object-cover"
            aria-hidden
          />
        )}

        {/* Depth layers (decorative, non-interactive): time-of-day light wash,
            floating motes, and a soft floor plane under the pet. */}
        <div className={`pointer-events-none absolute inset-0 z-0 room-lighting-${timeOfDay}`} aria-hidden />

        {/* Dynamic weather (rain) overlay */}
        {weather === "rain" && (
          <div className="pointer-events-none absolute inset-0 z-10 room-rain-overlay" aria-hidden />
        )}

        {/* Interactive candle glow */}
        {isCandleOn && equippedObjectId === "object_scented_candle" && (
          <div className="pointer-events-none absolute bottom-14 left-14 w-20 h-20 bg-amber-400/25 rounded-full blur-xl z-10 animate-pulse" aria-hidden />
        )}

        {/* Interactive warm lamp glow */}
        {isLampOn && equippedObjectId === "object_lamp_warm" && (
          <div className="pointer-events-none absolute bottom-12 left-12 w-48 h-48 bg-yellow-300/20 rounded-full blur-2xl z-10" aria-hidden />
        )}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
          {DUST_MOTES.map((i) => (
            <span key={i} className="dust-mote" />
          ))}
        </div>
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-0 h-44 room-floor" aria-hidden />

        {/* Mess spots (Habit-Rabbit cleaning loop): clutter piles of the current
            room; tap to spend cleaning energy and clear them permanently. */}
        {!isDecorMode &&
          spotsForRoom(currentRoomId)
            .filter((spot) => !cleanedSpots[spot.id])
            .map((spot) => {
              const affordable = cleaningEnergy >= spot.cost;
              const isSweeping = sweepingSpotId === spot.id;
              return (
                <button
                  key={spot.id}
                  type="button"
                  disabled={isSweeping}
                  onClick={() => handleCleanSpot(spot)}
                  title={t("cleanSpotTitle", { cost: spot.cost })}
                  aria-label={t("cleanSpotTitle", { cost: spot.cost })}
                  className={`absolute ${spot.positionClass} z-20 pointer-events-auto flex flex-col items-center group`}
                >
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    {isSweeping ? (
                      <>
                        {/* Sweeping broom icon */}
                        <span className="text-3xl select-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-sweep z-30">
                          🧹
                        </span>
                        {/* Sweeping dust cloud particles */}
                        <span className="absolute inset-0 bg-stone-200/50 rounded-full blur-sm scale-110 animate-ping -z-10" />
                        <span className="text-[10px] absolute -top-2 text-amber-600 font-extrabold animate-bounce select-none">
                          ✨
                        </span>
                      </>
                    ) : (
                      <>
                        {/* Soft pulsing backing glow */}
                        <span className="absolute inset-1.5 bg-amber-200/35 rounded-full blur-[6px] animate-pulse-glow -z-10" />
                        
                        {/* Mess Emoji */}
                        <span
                          className={`text-3xl select-none drop-shadow-sm transition-transform duration-300 group-hover:scale-125 group-active:scale-90 animate-wiggle ${
                            affordable ? "" : "grayscale-[50%] opacity-70"
                          }`}
                        >
                          {spot.emoji}
                        </span>
                      </>
                    )}
                  </div>

                  {!isSweeping && (
                    <span
                      className={`-mt-1 rounded-full border px-2 py-0.5 text-[9px] font-black leading-none shadow-sm backdrop-blur-sm transition-all ${
                        affordable
                          ? "bg-emerald-500 border-emerald-450 text-white animate-pulse"
                          : "bg-white/80 border-stone-200 text-stone-400"
                      }`}
                    >
                      🧹 {spot.cost}
                    </span>
                  )}
                </button>
              );
            })}

        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20">
          {/* Streak pill with click popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                playTing();
                setShowFreezeTooltip((prev) => !prev);
              }}
              className="bg-white/70 border border-white/50 backdrop-blur-md px-3.5 py-1.5 rounded-full flex items-center gap-2 font-bold shadow-sm hover:bg-white/95 active:scale-95 transition-all text-theme-text"
            >
              <Flame className="w-4.5 h-4.5 text-orange-500 fill-orange-500/10" />
              <span className="text-orange-600 text-xs">
                {t("streakDays", { count: currentStreak })}
              </span>
              {data.profile.streakFreezes > 0 && (
                <span className="ml-1 flex items-center text-blue-600 text-[10px] bg-blue-50/90 border border-blue-200/40 px-1.5 py-0.5 rounded-full font-black" title={t("freezeTitle")}>
                  ❄️ {data.profile.streakFreezes}
                </span>
              )}
            </button>

            {showFreezeTooltip && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowFreezeTooltip(false)} />
                <div className="absolute top-full left-0 mt-2.5 w-52 bg-white/95 border border-amber-900/10 p-3.5 rounded-2xl shadow-xl z-50 text-left pointer-events-auto text-theme-text animate-sheet-up">
                  <div className="text-[10px] font-black text-amber-950/40 uppercase tracking-wider mb-1">
                    ❄️ {t("freezeTitle")}
                  </div>
                  <p className="text-[11px] text-theme-text/80 mb-2.5 leading-relaxed">
                    {t("freezeTooltip", { price: 50 })}
                  </p>
                  <button
                    type="button"
                    className="w-full bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 text-white text-[11px] font-extrabold py-2 rounded-xl disabled:opacity-50 disabled:from-stone-200 disabled:to-stone-300 shadow-sm transition-all"
                    disabled={coins < 50}
                    onClick={() => {
                      setCoins(c => c - 50);
                      setShowFreezeTooltip(false);
                      startTransition(async () => {
                         await buyFreezeAction();
                         router.refresh();
                      });
                    }}
                  >
                    {t("buyFreeze")}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Center: Room Switcher Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                playTing();
                setIsRoomSwitcherOpen(true);
              }}
              className="bg-white/70 border border-white/50 backdrop-blur-md px-4 py-1.5 rounded-full flex items-center gap-1.5 font-black text-xs shadow-sm hover:bg-white/90 active:scale-95 transition-all text-amber-900/80 border-b-2 border-b-amber-200/50"
            >
              <DoorOpen className="w-4 h-4 text-amber-800" />
              <span>{tRooms(currentRoomId)}</span>
              <span className="text-[10px] text-amber-900/40 font-normal">▾</span>
            </button>
          </div>

          {/* Right: Coins + broom (cleaning energy) */}
          <div className="flex items-center gap-2">
            {vacationMode && (
              <div
                title={t("vacationActive")}
                className="flex items-center rounded-full bg-sky-100/85 border border-sky-200/60 px-2.5 py-1.5 shadow-sm backdrop-blur-md cursor-help animate-pulse"
              >
                <span className="text-sm leading-none">🏖️</span>
              </div>
            )}
            <div
              title={t("cleanEnergyTitle", cleaningProgress(cleanedSpots))}
              className="flex items-center gap-1 rounded-full bg-white/70 border border-white/50 px-2.5 py-1.5 font-bold shadow-sm backdrop-blur-md text-theme-text cursor-help"
            >
              <span className="text-sm leading-none">🧹</span>
              <span className="tabular-nums text-emerald-600 text-xs font-black">{cleaningEnergy}</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-white/70 border border-white/50 px-3 py-1.5 font-bold shadow-sm backdrop-blur-md text-theme-text">
              <Image src="/assets/ui/icon_coin.png" alt="" width={16} height={16} className="h-4 w-4 object-contain" />
              <span className="tabular-nums text-amber-600 text-xs font-black">{coins}</span>
            </div>
          </div>
        </div>

        {/* Floating HUD at the top center */}
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none animate-bubble-pop">
          <div className="pointer-events-auto">
            <PetHud level={petLevel} levelProgress={levelProgress} satiety={effSatiety} affection={affection} mood={mood} />
          </div>
        </div>

        {/* Mobile Quick Menu Button */}
        <div className="absolute left-4 top-24 z-30 md:hidden pointer-events-auto">
          <button
            type="button"
            onClick={() => {
              playSwoosh();
              setActiveOverlay("quick_menu");
            }}
            className={`flex flex-col items-center group transition-all duration-300 ${
              showToolbars ? "translate-x-0 opacity-100 scale-100" : "-translate-x-16 opacity-0 scale-75 pointer-events-none"
            }`}
          >
            <div className="w-10 h-10 bg-white/75 border border-white/50 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm text-amber-800 hover:scale-105 active:scale-95 transition-all">
              <span className="text-xl">🎒</span>
            </div>
            <span className="text-[9px] font-black text-theme-text/80 mt-1 bg-white/60 border border-white/40 px-2 py-0.5 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.03)] backdrop-blur-sm leading-none whitespace-nowrap">
              Menu
            </span>
          </button>
        </div>

        {/* Left Side Buttons (Desktop only) */}
        <div className="absolute left-4 top-24 z-20 hidden md:flex flex-col gap-3.5 pointer-events-none">
          {/* Profile Button */}
          <button
            type="button"
            onClick={() => {
              playSwoosh();
              setActiveOverlay("pet_profile");
            }}
            className="pointer-events-auto flex flex-col items-center group"
          >
            <div className="w-10 h-10 bg-white/75 border border-white/50 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm group-hover:scale-105 group-hover:bg-white/95 group-active:scale-95 transition-all text-amber-600 relative">
              <CircleUser className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-black text-theme-text/80 mt-1 bg-white/60 border border-white/40 px-2 py-0.5 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.03)] backdrop-blur-sm leading-none whitespace-nowrap">
              {t("profile")}
            </span>
          </button>

          {/* Neighbors Button */}
          {roomsAllUnlocked && (
            <button
              type="button"
              onClick={() => {
                playSwoosh();
                setIsNeighborOpen(true);
              }}
              className="pointer-events-auto flex flex-col items-center group"
            >
              <div className="w-10 h-10 bg-white/75 border border-white/50 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm group-hover:scale-105 group-hover:bg-white/95 group-active:scale-95 transition-all text-teal-650 relative">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-black text-theme-text/80 mt-1 bg-white/60 border border-white/40 px-2 py-0.5 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.03)] backdrop-blur-sm leading-none whitespace-nowrap">
                {t("neighbor")}
              </span>
            </button>
          )}

          {/* Decor Mode Toggle Button */}
          {currentStage >= 1 && (
            <button
              type="button"
              onClick={() => {
                playSwoosh();
                setIsDecorMode((prev) => !prev);
                setSelectedDecorSlot(null);
              }}
              className="pointer-events-auto flex flex-col items-center group"
            >
              <div className={`w-10 h-10 ${isDecorMode ? 'bg-amber-150 border-amber-400 scale-105 shadow-md text-amber-800' : 'bg-white/75 border-white/50 text-orange-500'} border backdrop-blur-md rounded-full flex items-center justify-center shadow-sm group-hover:scale-105 group-hover:bg-white/95 group-active:scale-95 transition-all relative`}>
                <Palette className="w-5 h-5" />
              </div>
              <span className="text-[9px] font-black text-theme-text/80 mt-1 bg-white/60 border border-white/40 px-2 py-0.5 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.03)] backdrop-blur-sm leading-none whitespace-nowrap">
                {isDecorMode ? t("decorDone") : t("decor")}
              </span>
            </button>
          )}
        </div>

        {/* Right Side Buttons (Desktop only) */}
        <div className="absolute right-4 top-24 z-20 hidden md:flex flex-col gap-3.5 pointer-events-none">
          {/* Adventure Button */}
          {currentStage >= 1 && (
            <button
              type="button"
              onClick={() => {
                playSwoosh();
                setActiveOverlay("adventure_story");
              }}
              className="pointer-events-auto flex flex-col items-center group"
            >
              <div className="w-10 h-10 bg-white/75 border border-white/50 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm group-hover:scale-105 group-hover:bg-white/95 group-active:scale-95 transition-all text-indigo-600 relative">
                <Compass className="w-5 h-5" />
                {data.profile.adventureEnergy >= 30 && (
                  <span className="absolute -top-1 -right-1 text-[8px] animate-pulse">🔥</span>
                )}
              </div>
              <span className="text-[9px] font-black text-theme-text/80 mt-1 bg-white/60 border border-white/40 px-2 py-0.5 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.03)] backdrop-blur-sm leading-none whitespace-nowrap">
                {t("adventure")}
              </span>
            </button>
          )}

          {/* Mindfulness/Care Button */}
          <button
            type="button"
            onClick={() => {
              playSwoosh();
              setActiveOverlay("mindfulness_menu");
            }}
            className="pointer-events-auto flex flex-col items-center group"
          >
            <div className="w-10 h-10 bg-white/75 border border-white/50 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm group-hover:scale-105 group-hover:bg-white/95 group-active:scale-95 transition-all text-rose-500 relative">
              <Heart className="w-5 h-5 fill-rose-500/10" />
            </div>
            <span className="text-[9px] font-black text-theme-text/80 mt-1 bg-white/60 border border-white/40 px-2 py-0.5 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.03)] backdrop-blur-sm leading-none whitespace-nowrap">
              {t("care")}
            </span>
          </button>
        </div>

        {/* Right-aligned vertical glassmorphic menu (REPLACED by Quick Menu) */}

        {/* Interactive Wallpaper Target */}
        {isDecorMode && (
          <button
            type="button"
            onClick={() => setSelectedDecorSlot("wallpaper")}
            className={`absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-auto border-2 border-dashed px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[10px] font-bold shadow-md transition-all ${
              selectedDecorSlot === "wallpaper"
                ? "border-amber-500 bg-amber-50 text-amber-700 scale-105"
                : "border-stone-400 bg-white/80 text-stone-600 hover:border-amber-400 hover:text-amber-600"
            }`}
          >
            🖼️ {t("selectWallpaper")}
          </button>
        )}

        {/* Equipped decor object — draggable anywhere in the room (position saved
            per room); defaults to the bottom-left corner until first moved. */}
        {customObject && !isDecorMode && (
          <div
            onPointerDown={handleDecorPointerDown}
            onPointerMove={handleDecorPointerMove}
            onPointerUp={handleDecorPointerUp}
            onPointerCancel={handleDecorPointerUp}
            title={t("dragObjectHint")}
            onClick={() => {
              // Cú kéo vừa kết thúc cũng bắn onClick — bỏ qua để không bật/tắt nhầm.
              if (decorDragMovedRef.current) {
                decorDragMovedRef.current = false;
                return;
              }
              if (equippedObjectId === "object_lamp_warm") {
                setIsLampOn((prev) => !prev);
                playTing();
              } else if (equippedObjectId === "object_scented_candle") {
                setIsCandleOn((prev) => !prev);
                playTing();
              } else if (equippedObjectId === "object_vintage_radio") {
                setIsRadioOn((prev) => !prev);
                playTing();
              }
            }}
            {...(objectPos ? { style: { left: `${objectPos.x}%`, top: `${objectPos.y}%` } } : {})}
            className={`absolute z-20 h-24 w-24 object-contain drop-shadow-md select-none touch-none pointer-events-auto cursor-grab active:cursor-grabbing hover:scale-105 transition-transform ${
              objectPos ? "-translate-x-1/2 -translate-y-1/2" : "bottom-3 left-3"
            }`}
          >
            <Image
              src={customObject.imageUrl}
              alt=""
              width={120}
              height={120}
              className="h-full w-full object-contain"
            />
            {/* Scented candle flame particle */}
            {isCandleOn && equippedObjectId === "object_scented_candle" && (
              <span className="absolute top-[28%] left-[48%] -translate-x-1/2 w-1.5 h-2 bg-amber-400 rounded-full blur-[0.5px] animate-pulse z-30 shadow-[0_0_4px_rgba(251,191,36,0.8)]"></span>
            )}
            {/* Vintage radio music notes */}
            {isRadioOn && equippedObjectId === "object_vintage_radio" && (
              <div className="absolute inset-0 pointer-events-none">
                <span className="music-note-float">🎵</span>
                <span className="music-note-float">🎶</span>
                <span className="music-note-float">♪</span>
              </div>
            )}
          </div>
        )}

        {/* Interactive Object Target Overlay (Decor Mode) */}
        {isDecorMode && (
          <button
            type="button"
            onClick={() => setSelectedDecorSlot("object")}
            className={`absolute bottom-3 left-3 z-30 pointer-events-auto h-24 w-24 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-all ${
              selectedDecorSlot === "object"
                ? "border-amber-500 bg-amber-50/80 text-amber-700 scale-105"
                : "border-stone-400 bg-white/70 text-stone-600 hover:border-amber-400 hover:text-amber-600"
            }`}
          >
            🛋️ <span className="leading-none">{t("selectObject")}</span>
          </button>
        )}

        {/* Pet Container with dynamic offset for bed/sofa sleeping or sitting */}
        {(() => {
          if (data.profile.adventureStatus === "adventuring" && !isDecorMode) {
            return (
              <div className="flex flex-col items-center justify-center p-5 bg-white/75 border border-orange-200/50 rounded-3xl backdrop-blur-md shadow-sm max-w-[280px] mx-auto text-center space-y-3 pointer-events-auto">
                <span className="text-4xl animate-bounce-slow">🌲🎒🏕️</span>
                <div>
                  <h4 className="text-xs font-black text-orange-850">Thỏ đang thám hiểm dã ngoại</h4>
                  <p className="text-[10px] text-stone-500 mt-1 leading-snug">
                    Bé đang đi dạo ngắm cảnh tại Vườn Thông Cozy để mang kỷ niệm về cho bạn.
                  </p>
                </div>
                {adventureTimeLeft > 0 ? (
                  <span className="text-[10px] font-mono font-bold text-orange-600 bg-orange-50 border border-orange-200 px-3 py-1 rounded-full">
                    ⏱️ Trở về sau: {adventureTimeLeft} giây
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      playSwoosh();
                      setShowStoryDialog(true);
                      setActiveOverlay("adventure_story");
                    }}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-[10px] uppercase tracking-wide px-4 py-2 rounded-full hover:shadow-md active:scale-95 transition-all animate-pulse"
                  >
                    🎉 Đón thỏ cưng về nhà!
                  </button>
                )}
              </div>
            );
          }

          let containerClass = "relative mt-2 drop-shadow-lg z-10 transition-all duration-700 hover:scale-105 cursor-pointer animate-sheet-up";
          let containerStyle: React.CSSProperties | undefined;
          if (!isDecorMode) {
            const onFurniture =
              (equippedObjectId === "object_bed_cozy" && currentAction === "sleep") ||
              (equippedObjectId === "object_cozy_sofa" && currentAction === "idle") ||
              (equippedObjectId === "object_gaming_chair" && (currentAction === "study" || currentAction === "idle"));
            if (onFurniture) {
              if (objectPos) {
                // Nội thất đã được kéo đi chỗ khác → thỏ ngồi/ngủ theo món đồ.
                containerClass =
                  "absolute -translate-x-1/2 -translate-y-[92%] drop-shadow-lg z-30 transition-all duration-700 hover:scale-105 cursor-pointer animate-sheet-up";
                containerStyle = { left: `${objectPos.x}%`, top: `${objectPos.y}%` };
              } else if (equippedObjectId === "object_cozy_sofa") {
                containerClass = "absolute bottom-10 left-9 drop-shadow-lg z-30 transition-all duration-700 hover:scale-105 cursor-pointer animate-sheet-up";
              } else {
                containerClass = "absolute bottom-10 left-8 drop-shadow-lg z-30 transition-all duration-700 hover:scale-105 cursor-pointer animate-sheet-up";
              }
            }
          }
          return (
            <div
              className={containerClass}
              {...(containerStyle ? { style: containerStyle } : {})}
              onClick={() => {
                playSwoosh();
                const reactions: CompanionAction[] = ["happy", "proud_smile", "embarrassed_blush", "eat"];
                setCompanionOverrideAction(reactions[Math.floor(Math.random() * reactions.length)]);
              }}
            >
              {/* Encouragement chat — only once the egg has hatched into a companion. */}
              {currentStage >= 0 && (
                <div
                  className="absolute bottom-[105%] left-1/2 -translate-x-1/2 z-30 mb-2 pointer-events-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <PetSpeechBubble remaining={totalCount - completedCount} total={totalCount} customText={petDialogue} />
                </div>
              )}

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
                  key={`stage-${currentStage}-${currentAction}-${equippedFor("outfit")}`}
                  stage={currentStage}
                  action={currentAction}
                  equippedOutfit={equippedFor("outfit") ?? undefined}
                  className="drop-shadow-lg"
                />
              )}

              {/* Emoji accessory perched on the head — follows the container so it
                  moves with the pet across rooms/furniture poses. */}
              {equippedAccessory?.emoji && (
                <span
                  className="pointer-events-none absolute top-[2%] left-1/2 -translate-x-1/2 z-20 text-3xl select-none drop-shadow-sm -rotate-12"
                  aria-hidden
                >
                  {equippedAccessory.emoji}
                </span>
              )}
            </div>
          );
        })()}

        {/* Interactive Rug Target (Decor Mode) */}
        {isDecorMode && (
          <button
            type="button"
            onClick={() => setSelectedDecorSlot("rug")}
            className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto w-[200px] h-10 rounded-full border-2 border-dashed flex items-center justify-center gap-1 text-[10px] font-bold transition-all ${
              selectedDecorSlot === "rug"
                ? "border-amber-500 bg-amber-50/80 text-amber-700 scale-105 shadow-md"
                : "border-stone-400 bg-white/70 text-stone-600 hover:border-amber-400 hover:text-amber-600"
            }`}
          >
            🧹 <span>{t("selectRug")}</span>
          </button>
        )}

        {/* Room Decor Selection Bottom Drawer */}
        {isDecorMode && selectedDecorSlot && (
          <div className="absolute bottom-0 left-0 right-0 z-40 bg-white/95 border-t-2 border-amber-800/10 p-4 shadow-xl flex flex-col pointer-events-auto animate-sheet-up rounded-t-[28px] max-h-[160px] text-theme-text">
            <div className="flex justify-between items-center mb-2.5">
              <span className="text-[11px] font-black text-amber-900/60 uppercase tracking-wider">
                {selectedDecorSlot === "wallpaper"
                  ? t("selectWallpaper")
                  : selectedDecorSlot === "rug"
                  ? t("selectRug")
                  : t("selectObject")}
              </span>
              <button
                type="button"
                aria-label="Close"
                title="Close"
                onClick={() => setSelectedDecorSlot(null)}
                className="p-1 rounded-full hover:bg-stone-100 text-stone-500 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
            
            <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar snap-x">
              {/* Option to unequip rugs or objects */}
              {selectedDecorSlot !== "wallpaper" && (
                <button
                  type="button"
                  onClick={() => commitEquip(selectedDecorSlot, null)}
                  className={`flex flex-col items-center justify-center shrink-0 w-16 h-16 rounded-xl border border-stone-200 hover:border-amber-400 bg-stone-50 transition-all ${
                    equippedFor(selectedDecorSlot) === null ? "ring-2 ring-amber-500 border-transparent bg-amber-50/40" : ""
                  }`}
                >
                  <span className="text-xl">🚫</span>
                  <span className="text-[8px] font-bold text-stone-500 mt-1">{t("Shop.unequip")}</span>
                </button>
              )}

              {/* Owned items lists */}
              {SHOP_ITEMS.filter((item) => item.slot === selectedDecorSlot && data.inventory.unlockedItems.includes(item.id))
                .length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-xs font-bold text-stone-400/80 py-4">
                    {t("emptyDecorSlot")}
                  </div>
                ) : (
                  SHOP_ITEMS.filter((item) => item.slot === selectedDecorSlot && data.inventory.unlockedItems.includes(item.id))
                    .map((item) => {
                      const isEquipped = equippedFor(selectedDecorSlot) === item.id;
                      return (
                        <button
                          type="button"
                          key={item.id}
                          aria-label={item.id}
                          title={item.id}
                          onClick={() => commitEquip(selectedDecorSlot, item.id)}
                          className={`flex flex-col items-center justify-center shrink-0 w-16 h-16 rounded-xl border border-stone-200 hover:border-amber-400 bg-white transition-all snap-start relative ${
                            isEquipped ? "ring-2 ring-amber-500 border-transparent bg-amber-50/40" : ""
                          }`}
                        >
                          <div className="relative w-10 h-10">
                            <Image
                              src={item.imageUrl}
                              alt=""
                              fill
                              sizes="40px"
                              className="object-contain"
                            />
                          </div>
                        </button>
                      );
                    })
                )}
            </div>
          </div>
        )}

          {/* One-shot light burst when the pet just evolved / hatched. */}
          {justEvolvedStage !== null && (
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
              <div className="evo-burst-fx" />
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

        {/* Care actions are grouped at the bottom in a spacious dock. */}
        <div className="absolute bottom-4 left-0 right-0 z-20 flex flex-col items-center px-3">
          <InteractionDock
            interactions={CARE_ACTIONS}
            onFeed={() => {
              playSwoosh();
              setIsFeedOpen(true);
            }}
            onInteract={(kind) => {
              if (kind === "play") {
                setIsFeedOpen(true); // Open care inventory picker instead of immediate play
              } else {
                handleInteract(kind);
              }
            }}
            disabled={data.profile.adventureStatus === "adventuring"}
          />
        </div>
      </section>

      {/* Bottom half: Habits (scrolls internally — min-h-0 lets it shrink inside the shell) */}
      <section ref={habitsRef} className={`flex-[1.3] min-h-0 bg-earth-bg p-6 md:p-8 pb-28 overflow-y-auto transition-opacity duration-300 ${isNavigating ? "opacity-50 pointer-events-none" : ""}`}>
        {activeTab === "habits" ? (
          <>
            {/* Weekly Header */}
            <div className="mb-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 bg-theme-card-bg px-2 py-1 rounded-full shadow-sm border border-theme-card-border">
                  <button
                    type="button"
                    aria-label={t("prevDay")}
                    onClick={() => startNavigation(() => router.push(`/${locale}?date=${format(subWeeks(parseISO(data.currentDate), 1), "yyyy-MM-dd")}`))}
                    className="p-1 hover:bg-theme-accent-light rounded-full transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-theme-text/60" />
                  </button>
                  <div className="text-sm font-bold text-theme-accent text-center min-w-[110px]">
                    {data.weekDates ? `${format(parseISO(data.weekDates[0]), "dd/MM")} - ${format(parseISO(data.weekDates[6]), "dd/MM")}` : format(parseISO(data.currentDate), "dd/MM/yyyy")}
                  </div>
                  <button
                    type="button"
                    aria-label={t("nextDay")}
                    onClick={() => startNavigation(() => router.push(`/${locale}?date=${format(addWeeks(parseISO(data.currentDate), 1), "yyyy-MM-dd")}`))}
                    className="p-1 hover:bg-theme-accent-light rounded-full transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-theme-text/60" />
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  {!data.isToday && (
                    <button
                      type="button"
                      onClick={() => startNavigation(() => router.push(`/${locale}`))}
                      className="bg-theme-accent text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-sm uppercase tracking-wider hover:brightness-110"
                    >
                      Hôm nay
                    </button>
                  )}
                  <span className="text-sm font-bold text-theme-text bg-theme-card-bg px-3 py-1.5 rounded-full shadow-sm border border-theme-card-border">
                    {t("completed", { completed: completedCount, total: totalCount })}
                  </span>
                </div>
              </div>

              {/* DailyBean Mood Grid: Days of Week row */}
              {data.weekDates && (
                <div className="flex justify-between bg-theme-card-bg p-2 rounded-3xl shadow-sm border border-theme-card-border">
                  {data.weekDates.map((dateStr, i) => {
                    const dateObj = parseISO(dateStr);
                    const isSelected = dateStr === data.currentDate;
                    const isRealToday = dateStr === data.today;
                    const dayNames = t("weekdaysShort").split(",");
                    
                    // Trích xuất thông tin cảm xúc từ logs
                    const moodLog = data.moodLogs?.[dateStr];
                    
                    const MOOD_DESIGNS: Record<string, { bg: string; border: string; text: string; emoji: string }> = {
                      awesome: { bg: "bg-pink-100 hover:bg-pink-200 border-pink-200", border: "border-pink-300", text: "text-pink-700", emoji: "😆" },
                      good: { bg: "bg-emerald-100 hover:bg-emerald-200 border-emerald-200", border: "border-emerald-300", text: "text-emerald-700", emoji: "🙂" },
                      neutral: { bg: "bg-amber-100 hover:bg-amber-200 border-amber-200", border: "border-amber-300", text: "text-amber-700", emoji: "😐" },
                      bad: { bg: "bg-blue-100 hover:bg-blue-200 border-blue-200", border: "border-blue-300", text: "text-blue-700", emoji: "🙁" },
                      awful: { bg: "bg-red-100 hover:bg-red-200 border-red-200", border: "border-red-300", text: "text-red-700", emoji: "😭" },
                    };
                    
                    const moodDesign = moodLog ? MOOD_DESIGNS[moodLog.mood] : null;
                    
                    let btnStyles = "hover:bg-theme-accent-light text-theme-text/60 border-transparent";
                    if (isSelected) {
                      btnStyles = "bg-theme-accent text-white shadow-md scale-105 border-transparent";
                    } else if (moodDesign) {
                      btnStyles = `${moodDesign.bg} ${moodDesign.text} border-2 ${moodDesign.border}`;
                    }

                    return (
                      <button
                        type="button"
                        key={dateStr}
                        onClick={() => startNavigation(() => router.push(`/${locale}?date=${dateStr}`))}
                        className={`group flex flex-col items-center justify-center w-11 h-14 rounded-2xl transition-all relative border ${btnStyles}`}
                      >
                        {isRealToday && !isSelected && (
                          <span className="absolute -top-1 w-2 h-2 bg-amber-400 rounded-full z-10 animate-pulse"></span>
                        )}
                        
                        <span className={`text-[9px] font-bold mb-0.5 uppercase tracking-wider ${isSelected ? "text-white/70" : "text-theme-text/40"}`}>
                          {dayNames[i]}
                        </span>
                        
                        {moodDesign ? (
                          <span className="text-lg leading-none animate-bounce-slow mt-0.5 select-none">{moodDesign.emoji}</span>
                        ) : (
                          <span className="text-base font-black leading-none">{format(dateObj, "dd")}</span>
                        )}

                        {/* Dotted placeholder for missing mood */}
                        {!moodDesign && !isSelected && (
                          <span className="w-1 h-1 rounded-full bg-black/10 mt-1"></span>
                        )}

                        {/* Interactive CSS Tooltip Card */}
                        {moodLog && moodDesign && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-48 hidden group-hover:block bg-white/95 border border-amber-900/10 p-3 rounded-2xl shadow-xl z-50 text-left pointer-events-none text-theme-text animate-fade-in">
                            <div className="text-[9px] font-black text-theme-text/35 uppercase tracking-wider mb-1">Nhật ký hôm đó</div>
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <span className="text-base leading-none">{moodDesign.emoji}</span>
                              <span className={`text-xs font-black capitalize ${moodDesign.text}`}>{moodLog.mood}</span>
                            </div>
                            {moodLog.activities.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-1.5">
                                {moodLog.activities.map(act => (
                                  <span key={act} className="text-[8px] font-bold bg-black/[0.04] px-1.5 py-0.5 rounded-full text-theme-text/60">
                                    {act}
                                  </span>
                                ))}
                              </div>
                            )}
                            {moodLog.note && (
                              <p className="text-[10px] font-medium text-theme-text/75 leading-relaxed italic border-t border-black/[0.03] pt-1.5">
                                &ldquo;{moodLog.note}&rdquo;
                              </p>
                            )}
                          </div>
                        )}
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
                          className={`bg-theme-card-bg p-4 rounded-3xl border flex flex-col transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 ${
                            habit.isCompleted
                              ? "border-theme-card-border opacity-60"
                              : habit.type === "negative"
                              ? "border-red-200 bg-red-50/50"
                              : "border-theme-card-border"
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
                                habit.type === "negative" ? "bg-red-100 hover:bg-red-200" : "bg-theme-accent-light hover:bg-theme-border/20"
                              }`}
                            >
                              <span className="group-hover:opacity-0 transition-opacity">
                                {habit.type === "timer" ? "⏳" : habit.type === "negative" ? "💥" : "💧"}
                              </span>
                              <Pencil className={`w-5 h-5 absolute opacity-0 group-hover:opacity-100 transition-opacity ${
                                habit.type === "negative" ? "text-red-500" : "text-theme-accent"
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

                          {/* Mini Weekly Beans Progress */}
                          {data.weekDates && (
                            <div className="mt-3 pt-2.5 border-t border-black/[0.03] flex items-center justify-between">
                              <span className="text-[10px] font-bold text-theme-text/40 uppercase tracking-wider">{t("weeklyPerformance")}</span>
                              <div className="flex gap-1.5">
                                {data.weekDates.map((dateStr, i) => {
                                  const isPast = dateStr < data.today;
                                  const completed = habit.weeklyLogs?.[dateStr];
                                  const dayNames = t("weekdaysShort").split(",");
                                  
                                  let bgClass = "bg-black/[0.04]";
                                  let tooltipText = `${dayNames[i]}: ${t("notDone")}`;
                                  
                                  if (completed) {
                                    bgClass = "bg-theme-accent";
                                    tooltipText = `${dayNames[i]}: ${t("completedText")} 🎉`;
                                  } else if (isPast) {
                                    bgClass = "bg-black/[0.12]";
                                  }
                                  
                                  return (
                                    <div
                                      key={dateStr}
                                      className={`w-7 h-2.5 rounded-full transition-all duration-300 ${bgClass}`}
                                      title={tooltipText}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <div className="space-y-6">
            <CarrotPlanting hasInProgress={(data.tasks || []).some((t) => t.status === "in_progress")} />
            <TaskBoard tasks={data.tasks || []} onRefresh={() => router.refresh()} />
          </div>
        )}
      </section>

      </div> {/* Close Main Workspace split panel */}

      {/* Single bottom navigation — keeps the header clean (streak + coins only). */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ${
        showToolbars ? "translate-y-0" : "translate-y-full"
      }`}>
        <BottomNav
          activeTab={activeTab}
          onHome={() => { playSwoosh(); setActiveTab("habits"); }}
          onTasks={() => { playSwoosh(); setActiveTab("tasks"); }}
          onShop={() => { playSwoosh(); setIsShopOpen(true); }}
          onAlbum={() => { playSwoosh(); setIsAlbumOpen(true); }}
          onAnalytics={() => { playSwoosh(); router.push(`/${locale}/analytics`); }}
          onSettings={() => setIsSettingsOpen(true)}
        />
      </div>

      {/* Add-habit FAB, floating just above the bottom nav. */}
      {activeTab === "habits" && (
        <div className={`absolute bottom-24 md:bottom-6 right-6 z-30 transition-all duration-300 ${
          showToolbars ? "translate-y-0 scale-100 opacity-100" : "translate-y-16 scale-0 opacity-0 pointer-events-none"
        }`}>
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
      )}

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
        currentTheme={theme}
        onThemeChange={handleThemeChange}
        devStageOverride={devStageOverride}
        setDevStageOverride={setDevStageOverride}
        devStreakOverride={devStreakOverride}
        setDevStreakOverride={setDevStreakOverride}
        devLevelOverride={devLevelOverride}
        setDevLevelOverride={setDevLevelOverride}
        devSatietyOverride={devSatietyOverride}
        setDevSatietyOverride={setDevSatietyOverride}
        vacationMode={vacationMode}
        onVacationChange={handleVacationToggle}
      />

      <MemoryAlbumModal
        isOpen={isAlbumOpen}
        onClose={() => setIsAlbumOpen(false)}
        currentStreak={currentStreak}
        unlockedMemories={data.unlockedMemories}
        unlockedItems={data.inventory.unlockedItems}
      />
      
      <ShopModal
        isOpen={isShopOpen}
        onClose={() => setIsShopOpen(false)}
        coins={coins}
        focusTokens={focusTokens}
        unlockedItems={unlockedItems}
        equippedItems={optimisticEquippedItems}
        consumables={consumables}
        onBuyItemOptimistic={(itemId, price) => {
          setCoins((c) => Math.max(0, c - price));
          setUnlockedItems((prev) => [...prev, itemId]);
        }}
        onBuyItemRollback={(itemId, price) => {
          setCoins((c) => c + price);
          setUnlockedItems((prev) => prev.filter((id) => id !== itemId));
        }}
        onBuyConsumableOptimistic={(itemId, price) => {
          setCoins((c) => Math.max(0, c - price));
          setConsumables((prev) => ({
            ...prev,
            [itemId]: (prev[itemId] ?? 0) + 1,
          }));
        }}
        onBuyConsumableRollback={(itemId, price) => {
          setCoins((c) => c + price);
          setConsumables((prev) => ({
            ...prev,
            [itemId]: Math.max(0, (prev[itemId] ?? 0) - 1),
          }));
        }}
        onBuyFocusItemOptimistic={(itemId, price, affectionGain) => {
          setFocusTokens((t) => Math.max(0, t - price));
          setAffection((a) => Math.min(100, a + affectionGain));
        }}
        onBuyFocusItemRollback={(itemId, price, affectionGain) => {
          setFocusTokens((t) => t + price);
          setAffection((a) => Math.max(0, a - affectionGain));
        }}
        onEquipItem={commitEquip}
        onEquipped={(slot, itemId) => {
          // Jump to the bedroom so a freshly equipped wallpaper is visible right away
          // (it only decorates the pet's own room).
          if (slot === "wallpaper" && itemId) goToRoom("bedroom");
        }}
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
        consumables={consumables}
        onClose={() => setIsFeedOpen(false)}
        onFeed={handleFeed}
        onPlay={(toyId) => handleInteract("play", toyId)}
      />

      {/* TreeTownModal thay thế cho NeighborModal */}
      <TreeTownModal
        isOpen={isNeighborOpen}
        onClose={() => setIsNeighborOpen(false)}
        myFriendCode={data.profile.username || data.email || "ABC-123"}
      />

      {/* MODAL CO-ORDINATORS CHO CÁC TÍNH NĂNG NÂNG CẤP MỚI */}
      
      {/* 1. Nhật ký cảm xúc */}
      <MoodCheckinModal
        isOpen={activeOverlay === "mood_checkin"}
        onClose={() => setActiveOverlay(null)}
      />

      {/* 2. Luyện thở chánh niệm */}
      <BreathingModal
        isOpen={activeOverlay === "breathing"}
        onClose={() => setActiveOverlay(null)}
      />

      {/* 3. Sơ cứu tâm lý SOS */}
      <FirstAidModal
        isOpen={activeOverlay === "first_aid"}
        onClose={() => setActiveOverlay(null)}
      />

      {/* 4. Hồ sơ pet cưng */}
      <PetProfileModal
        isOpen={activeOverlay === "pet_profile"}
        onClose={() => setActiveOverlay(null)}
        petLevel={petLevel}
        petLevelProgress={levelProgress}
        personalityCuriosity={data.profile.personalityCuriosity}
        personalityCompassion={data.profile.personalityCompassion}
        personalityResilience={data.profile.personalityResilience}
        personalityEnergy={data.profile.personalityEnergy}
        petLikes={data.profile.petLikes}
        petDislikes={data.profile.petDislikes}
      />

      {/* 5. Giao diện Thám hiểm & Phiêu lưu */}
      {activeOverlay === "adventure_story" && !showStoryDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-fade-in" onClick={() => setActiveOverlay(null)}>
          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl relative animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setActiveOverlay(null)}
              aria-label="Đóng"
              className="absolute top-4 right-4 z-30 p-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 transition-colors"
            >
              <X size={16} />
            </button>
            <AdventureView
              adventureEnergy={data.profile.adventureEnergy}
              adventureStatus={data.profile.adventureStatus}
              adventureStartAt={data.profile.adventureStartAt}
              currentStage={currentStage}
              currentStreak={currentStreak}
              equippedOutfit={data.inventory.equippedItems["outfit"]}
              onStartAdventure={() => {
                startTransition(async () => {
                  await startAdventureAction();
                  router.refresh();
                });
              }}
              onOpenStory={() => {
                setShowStoryDialog(true);
              }}
            />
          </div>
        </div>
      )}

      {/* Kịch bản lựa chọn thám hiểm */}
      <StoryDialogModal
        isOpen={activeOverlay === "adventure_story" && showStoryDialog}
        storyId={data.profile.adventureStoryId}
        onClose={() => {
          setShowStoryDialog(false);
          setActiveOverlay(null);
        }}
      />

      {/* 6. Hòm thư Rung cảm (Vibes Inbox) */}
      <VibeInboxModal
        isOpen={pendingVibesOpen && data.pendingVibes && data.pendingVibes.length > 0}
        vibes={data.pendingVibes || []}
        onClose={() => setPendingVibesOpen(false)}
      />

      {/* 8. Hộp Công Cụ Tiện Ích di động (Cozy Toolbag Menu) */}
      {activeOverlay === "quick_menu" && (
        <div 
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 backdrop-blur-sm animate-fade-in" 
          onClick={() => setActiveOverlay(null)}
        >
          <div
            className="w-full max-w-md rounded-t-[32px] rounded-b-[24px] bg-theme-bg p-6 shadow-2xl border border-theme-card-border animate-sheet-up text-theme-text"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-5 flex items-center justify-between border-b border-theme-card-border pb-3.5">
              <h3 className="text-base font-black flex items-center gap-2 text-amber-900">
                🎒 Hộp Công Cụ Thỏ Cưng
              </h3>
              <button 
                onClick={() => setActiveOverlay(null)} 
                className="text-theme-text/45 hover:text-theme-text/80 font-bold p-1 rounded-full hover:bg-black/[0.03]"
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            {/* Grid menu */}
            <div className="grid grid-cols-2 gap-3 mb-2">
              {/* Profile */}
              <button
                onClick={() => {
                  playSwoosh();
                  setActiveOverlay("pet_profile");
                }}
                className="flex flex-col items-center justify-center p-4 bg-white/70 hover:bg-theme-accent-light border border-theme-card-border rounded-2xl transition-all active:scale-95 group shadow-sm text-center"
              >
                <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 mb-2 group-hover:scale-110 transition-transform">
                  <CircleUser className="w-6 h-6" />
                </div>
                <span className="text-xs font-black text-amber-950">{t("profile")}</span>
                <span className="text-[9px] text-theme-text/45 mt-0.5 leading-none">Thông tin thỏ cưng</span>
              </button>

              {/* Adventure */}
              <button
                onClick={() => {
                  playSwoosh();
                  setActiveOverlay("adventure_story");
                }}
                className="flex flex-col items-center justify-center p-4 bg-white/70 hover:bg-theme-accent-light border border-theme-card-border rounded-2xl transition-all active:scale-95 group shadow-sm text-center relative"
              >
                <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-2 group-hover:scale-110 transition-transform">
                  <Compass className="w-6 h-6" />
                </div>
                {data.profile.adventureEnergy >= 30 && (
                  <span className="absolute top-2 right-2 text-[8px] animate-pulse">🔥 Sẵn sàng</span>
                )}
                <span className="text-xs font-black text-amber-950">{t("adventure")}</span>
                <span className="text-[9px] text-theme-text/45 mt-0.5 leading-none">Đi dã ngoại kiếm quà</span>
              </button>

              {/* Neighborhood / Tree Town */}
              {roomsAllUnlocked ? (
                <button
                  onClick={() => {
                    playSwoosh();
                    setIsNeighborOpen(true);
                  }}
                  className="flex flex-col items-center justify-center p-4 bg-white/70 hover:bg-theme-accent-light border border-theme-card-border rounded-2xl transition-all active:scale-95 group shadow-sm text-center"
                >
                  <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center text-teal-650 mb-2 group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-black text-amber-950">{t("neighbor")}</span>
                  <span className="text-[9px] text-theme-text/45 mt-0.5 leading-none">Gặp bạn bè & gửi vibe</span>
                </button>
              ) : (
                <div className="flex flex-col items-center justify-center p-4 bg-black/[0.02] border border-black/[0.04] rounded-2xl opacity-60 text-center select-none relative">
                  <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center text-stone-400 mb-2">
                    <Lock className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-black text-stone-500">{t("neighbor")}</span>
                  <span className="text-[8px] bg-amber-500 text-white px-1 py-0.5 rounded-full font-bold mt-1 scale-90">
                    Mở khoá ở LV.10
                  </span>
                </div>
              )}

              {/* Decor Mode */}
              {currentStage >= 1 ? (
                <button
                  onClick={() => {
                    playSwoosh();
                    setIsDecorMode((prev) => !prev);
                    setSelectedDecorSlot(null);
                    setActiveOverlay(null);
                  }}
                  className={`flex flex-col items-center justify-center p-4 ${
                    isDecorMode ? "bg-amber-100/50 border-amber-400" : "bg-white/70"
                  } hover:bg-theme-accent-light border border-theme-card-border rounded-2xl transition-all active:scale-95 group shadow-sm text-center`}
                >
                  <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 mb-2 group-hover:scale-110 transition-transform">
                    <Palette className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-black text-amber-950">
                    {isDecorMode ? t("decorDone") : t("decor")}
                  </span>
                  <span className="text-[9px] text-theme-text/45 mt-0.5 leading-none">Sắp xếp phòng ốc</span>
                </button>
              ) : (
                <div className="flex flex-col items-center justify-center p-4 bg-black/[0.02] border border-black/[0.04] rounded-2xl opacity-60 text-center select-none relative">
                  <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center text-stone-400 mb-2">
                    <Lock className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-black text-stone-500">{t("decor")}</span>
                  <span className="text-[8px] bg-amber-500 text-white px-1 py-0.5 rounded-full font-bold mt-1 scale-90">
                    Mở khoá khi thỏ tiến hoá
                  </span>
                </div>
              )}
            </div>

            {/* Quick Mindfulness Toolbox Banner */}
            <button
              onClick={() => {
                playSwoosh();
                setActiveOverlay("mindfulness_menu");
              }}
              className="w-full text-left p-3.5 bg-gradient-to-r from-rose-50 to-pink-50 hover:from-rose-100 hover:to-pink-100 border border-rose-100 rounded-2xl transition-all flex items-center gap-3.5 active:scale-98 mt-2"
            >
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-rose-500 shadow-sm shrink-0">
                <Heart className="w-5 h-5 fill-rose-500/10" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-black text-rose-950">🧘 Hộp công cụ Chánh niệm</div>
                <div className="text-[9px] text-rose-900/60 leading-tight">Nhật ký cảm xúc, Luyện thở Box Breathing, Sơ cứu tâm lý SOS</div>
              </div>
              <span className="text-rose-400 font-bold text-xs">➔</span>
            </button>
          </div>
        </div>
      )}

      {/* 7. Trình đơn Tự chăm sóc (Mindfulness Menu Bottom Sheet) */}
      {activeOverlay === "mindfulness_menu" && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 backdrop-blur-sm animate-fade-in" onClick={() => setActiveOverlay(null)}>
          <div
            className="w-full max-w-md rounded-3xl bg-theme-bg p-6 shadow-2xl border border-theme-card-border animate-sheet-up text-theme-text"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between border-b border-theme-card-border pb-3">
              <h3 className="text-lg font-black flex items-center gap-2">
                🧘 Hộp Công Cụ Chánh Niệm
              </h3>
              <button onClick={() => setActiveOverlay(null)} className="text-theme-text/45 hover:text-theme-text/80 font-bold">✕</button>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => setActiveOverlay("mood_checkin")}
                className="w-full text-left p-4 bg-theme-card-bg hover:bg-theme-accent-light border-2 border-theme-card-border rounded-2xl transition-all flex items-center gap-3 active:scale-98"
              >
                <span className="text-3xl">💭</span>
                <div>
                  <div className="text-xs font-black">Báo cáo cảm xúc hằng ngày</div>
                  <div className="text-[10px] text-theme-text/45 leading-tight">Nhìn nhận cảm xúc của bản thân và ghi chép biết ơn (+15 xu)</div>
                </div>
              </button>

              <button
                onClick={() => setActiveOverlay("breathing")}
                className="w-full text-left p-4 bg-theme-card-bg hover:bg-theme-accent-light border-2 border-theme-card-border rounded-2xl transition-all flex items-center gap-3 active:scale-98"
              >
                <span className="text-3xl">🌬️</span>
                <div>
                  <div className="text-xs font-black">Luyện thở Box Breathing</div>
                  <div className="text-[10px] text-theme-text/45 leading-tight">2 phút tập thở khoa học giúp xoa dịu stress tức thì (+10 xu)</div>
                </div>
              </button>

              <button
                onClick={() => setActiveOverlay("first_aid")}
                className="w-full text-left p-4 bg-theme-card-bg hover:bg-theme-accent-light border-2 border-theme-card-border rounded-2xl transition-all flex items-center gap-3 active:scale-98"
              >
                <span className="text-3xl">🚑</span>
                <div>
                  <div className="text-xs font-black">Sơ cứu tâm lý khẩn cấp</div>
                  <div className="text-[10px] text-theme-text/45 leading-tight">Kết nối giác quan, bóp bóng xả giận, thẻ đọc chữa lành</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Room Switcher Modal */}
      {isRoomSwitcherOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-fade-in" onClick={() => setIsRoomSwitcherOpen(false)}>
          <div className="w-full max-w-md bg-theme-bg rounded-3xl overflow-hidden shadow-2xl relative border border-theme-card-border animate-scale-up text-theme-text p-6" onClick={(e) => e.stopPropagation()}>
            
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-theme-card-border">
              <h3 className="text-base font-black flex items-center gap-2 text-amber-900">
                🏡 {tRooms("title") || "Khám Phá Ngôi Nhà"}
              </h3>
              <button
                type="button"
                onClick={() => setIsRoomSwitcherOpen(false)}
                title={t("close")}
                aria-label={t("close")}
                className="p-1 rounded-full hover:bg-stone-100 text-stone-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-[11px] text-theme-text/60 mb-5 leading-relaxed">
              Mở khoá phòng mới bằng cách nâng cấp level thỏ cưng (cho thỏ ăn để tăng EXP) và dọn sạch các đống bừa bộn để nhận nội thất miễn phí!
            </p>

            <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1 no-scrollbar">
              {ROOMS.map((room) => {
                const unlocked = devLevelOverride !== null ? levelFromExp(petExp) >= room.unlockLevel : data.profile.unlockedRooms.includes(room.id);
                const spots = spotsForRoom(room.id);
                const cleanedCount = spots.filter(s => cleanedSpots[s.id]).length;
                const totalSpots = spots.length;
                const isCurrent = currentRoomId === room.id;
                const cleanProgressPercent = totalSpots > 0 ? Math.round((cleanedCount / totalSpots) * 100) : 100;
                const isFullyClean = cleanedCount === totalSpots;

                // Gift item display name
                const giftItemId = ROOM_CLEAN_GIFTS[room.id];
                const giftName = giftItemId ? tShop(`item_${giftItemId}_name`) : "";

                return (
                  <div
                    key={room.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isCurrent
                        ? "border-amber-500 bg-amber-50/20 ring-1 ring-amber-500/30"
                        : "border-theme-card-border bg-theme-card-bg hover:border-amber-300"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{room.icon}</span>
                        <div>
                          <h4 className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                            {tRooms(room.id)}
                            {isCurrent && (
                              <span className="text-[8px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-extrabold tracking-wide uppercase">
                                Đang ở
                              </span>
                            )}
                          </h4>
                          {!unlocked && (
                            <span className="text-[9px] text-orange-655 bg-orange-50 border border-orange-100 px-1.5 rounded flex items-center gap-0.5 mt-0.5">
                              <Lock size={8} className="inline" /> {tRooms("lockedHint", { level: room.unlockLevel })}
                            </span>
                          )}
                        </div>
                      </div>

                      {unlocked && (
                        <button
                          type="button"
                          disabled={isCurrent}
                          onClick={() => {
                            goToRoom(room.id);
                            setIsRoomSwitcherOpen(false);
                            playTing();
                          }}
                          className={`text-[10px] font-black px-3 py-1.5 rounded-xl shadow-sm transition-all ${
                            isCurrent
                              ? "bg-stone-100 text-stone-400 cursor-default"
                              : "bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 text-white active:scale-95"
                          }`}
                        >
                          Ghé thăm
                        </button>
                      )}
                    </div>

                    {unlocked && (
                      <div className="space-y-2 border-t border-black/[0.03] pt-2 mt-2">
                        {/* Progress Bar */}
                        <div className="flex items-center justify-between text-[9px] text-theme-text/50 font-bold">
                          <span className="flex items-center gap-0.5">
                            🧹 Sạch sẽ: {cleanedCount}/{totalSpots} ({cleanProgressPercent}%)
                          </span>
                          {isFullyClean && (
                            <span className="text-emerald-600 flex items-center gap-0.5 font-extrabold">
                              ✨ Sạch bóng!
                            </span>
                          )}
                        </div>
                        <div className="h-1.5 w-full bg-black/[0.04] rounded-full overflow-hidden">
                          <div
                            ref={(el) => {
                              if (el) el.style.width = `${cleanProgressPercent}%`;
                            }}
                            className={`h-full w-0 rounded-full transition-all duration-500 ${
                              isFullyClean ? "bg-gradient-to-r from-emerald-400 to-teal-500" : "bg-gradient-to-r from-amber-400 to-orange-500"
                            }`}
                          />
                        </div>

                        {/* Gift Info */}
                        {giftName && (
                          <div className="text-[9px] text-amber-900/60 bg-amber-50/50 border border-amber-900/5 p-1.5 rounded-lg flex items-center justify-between font-bold">
                            <span>🎁 Quà dọn dẹp:</span>
                            <span className="text-amber-950 font-extrabold">{giftName}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}
    </main>
  );
}
