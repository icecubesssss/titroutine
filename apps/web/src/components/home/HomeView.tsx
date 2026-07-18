"use client";

import React, { useEffect, useRef, useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { X, DoorOpen } from "lucide-react";
import confetti from "canvas-confetti";
import Image from "next/image";
import { DuoButton } from "@/components/ui/DuoButton";
import { RabbitCompanion, STAGES_CONFIG, CompanionAction } from "@/components/pet/RabbitCompanion";
import { pickAmbientAction, streakMilestoneAction } from "@/lib/companion";
import { EggCompanion } from "@/components/pet/EggCompanion";
import { PetSpeechBubble } from "@/components/pet/PetSpeechBubble";
import { HabitModal } from "@/components/home/HabitModal";
import { SettingsModal } from "@/components/home/SettingsModal";
import { TimerModal } from "@/components/home/TimerModal";
import { MemoryAlbumModal } from "@/components/home/MemoryAlbumModal";
import { ShopModal } from "@/components/home/ShopModal";
import { CelebrationModal } from "@/components/home/CelebrationModal";
import { BottomNav } from "@/components/home/BottomNav";
import { InteractionDock } from "@/components/home/InteractionDock";
import { FeedPicker } from "@/components/home/FeedPicker";
import { DesktopSidebar } from "@/components/home/DesktopSidebar";
import { QuickMenuSheet } from "@/components/home/QuickMenuSheet";
import { MindfulnessMenuSheet } from "@/components/home/MindfulnessMenuSheet";
import { RoomSwitcherModal } from "@/components/home/RoomSwitcherModal";
import { MobileSidebar } from "@/components/home/MobileSidebar";
import { HabitsPanel } from "@/components/home/HabitsPanel";
import type { ActiveOverlay } from "@/components/home/overlayTypes";
import { useTimeOfDay } from "@/components/home/hooks/useTimeOfDay";
import { useRealWeather } from "@/components/home/hooks/useRealWeather";
import { useAutoHideToolbars } from "@/components/home/hooks/useAutoHideToolbars";
import { useCaptureTimezone } from "@/components/home/hooks/useCaptureTimezone";
import { useEvolutionCelebration } from "@/components/home/hooks/useEvolutionCelebration";
import { RoomBackdrop } from "@/components/home/RoomBackdrop";

import { SHOP_ITEMS } from "@/lib/items";
import { useSound } from "@/hooks/useSound";
import {
  toggleHabitAction,
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
import { spotsForRoom, SPOT_CLEAN_COINS, ROOM_CLEAN_BONUS_COINS, type MessSpot } from "@/lib/cleaning";
import { stageFromStreak, daysBetween, moodFromStats, levelFromExp, expToNextLevel, foodTier } from "@/lib/game";
import { roomDef, unlockedRooms, allRoomsUnlocked, INTERACTION_ACTION, type RoomId, type InteractionKind } from "@/lib/rooms";
import type { DashboardData, HabitWithLog } from "@/lib/types";

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

const SPOT_ISO_COORDS: Record<string, { x: number; y: number }> = {
  // Bedroom
  bedroom_socks: { x: 30, y: 70 },
  bedroom_laundry: { x: 75, y: 30 },
  bedroom_papers: { x: 25, y: 40 },
  bedroom_cobweb: { x: 15, y: 15 },
  // Kitchen
  kitchen_dishes: { x: 35, y: 65 },
  kitchen_peels: { x: 70, y: 35 },
  kitchen_trash: { x: 20, y: 45 },
  kitchen_spill: { x: 55, y: 55 },
  // Living
  living_pillows: { x: 70, y: 30 },
  living_books: { x: 25, y: 45 },
  living_crumbs: { x: 45, y: 60 },
  living_dust: { x: 15, y: 25 },
  // Garden
  garden_leaves: { x: 30, y: 60 },
  garden_weeds: { x: 75, y: 35 },
  garden_branches: { x: 25, y: 40 },
  garden_snail_trail: { x: 50, y: 50 },
  // Bathroom
  bathroom_towels: { x: 30, y: 65 },
  bathroom_puddle: { x: 70, y: 40 },
  bathroom_soap: { x: 20, y: 40 },
  bathroom_mirror: { x: 15, y: 15 },
};

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
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const [, startTransition] = useTransition();
  const [isNavigating, startNavigation] = useTransition();

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

  // The strict focus timer is phone-only (relies on the flip-face-down sensor).

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
  const weather = useRealWeather();

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
  const timeOfDay = useTimeOfDay();

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
  const [justEvolvedStage, setJustEvolvedStage] = useEvolutionCelebration(data.profile.petStage, () => setCompanionOverrideAction("happy"));

  // Tooltip, room switcher & sweeping states
  const [showFreezeTooltip, setShowFreezeTooltip] = useState(false);
  const [isRoomSwitcherOpen, setIsRoomSwitcherOpen] = useState(false);
  const [sweepingSpotId, setSweepingSpotId] = useState<string | null>(null);

  // Coordinates and dragging state for the rabbit companion
  const [rabbitX, setRabbitX] = useState<number>(50);
  const [rabbitY, setRabbitY] = useState<number>(50);
  const [facingLeft, setFacingLeft] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 400);
    return () => clearTimeout(timer);
  }, [currentRoomId]);

  // Load rabbit position per room from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem(`titroutine:rabbitPos:${currentRoomId}`);
      if (saved) {
        try {
          const { x, y } = JSON.parse(saved);
          if (typeof x === "number" && typeof y === "number") {
            setRabbitX(x);
            setRabbitY(y);
          }
        } catch {
          setRabbitX(50);
          setRabbitY(50);
        }
      } else {
        setRabbitX(50);
        setRabbitY(50);
      }
    }
  }, [currentRoomId]);

  // Forward isometric projection: maps x (10 to 90), y (10 to 90) to screen percentage coordinates
  const getIsoCoords = (x: number, y: number) => {
    const left = 50 + (x - y) * 0.42;
    const top = 52 + (x + y) * 0.18;
    return { left, top };
  };

  // Inverse isometric projection: maps screen percentage coordinates back to x, y
  const getFloorCoords = (left: number, top: number) => {
    const L = (left - 50) / 0.42;
    const T = (top - 52) / 0.18;
    const x = (L + T) / 2;
    const y = (T - L) / 2;
    return {
      x: Math.max(10, Math.min(90, x)),
      y: Math.max(10, Math.min(90, y)),
    };
  };

  const handlePetPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    petDragMovedRef.current = false;
    playTing();
  };

  const handlePetPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !roomSectionRef.current) return;
    petDragMovedRef.current = true;
    const rect = roomSectionRef.current.getBoundingClientRect();
    const pX = ((e.clientX - rect.left) / rect.width) * 100;
    const pY = ((e.clientY - rect.top) / rect.height) * 100;

    const newPos = getFloorCoords(pX, pY);

    // Determine facing direction based on horizontal position delta
    const oldCoords = getIsoCoords(rabbitX, rabbitY);
    const newCoords = getIsoCoords(newPos.x, newPos.y);
    if (newCoords.left < oldCoords.left - 0.5) {
      setFacingLeft(true);
    } else if (newCoords.left > oldCoords.left + 0.5) {
      setFacingLeft(false);
    }

    setRabbitX(newPos.x);
    setRabbitY(newPos.y);
  };

  const handlePetPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsDragging(false);

    let finalX = rabbitX;
    let finalY = rabbitY;

    // Resolve current equipped items for snapping using type-safe helper
    const equippedRugId = equippedFor("rug");
    const customRug = SHOP_ITEMS.find((item) => item.id === equippedRugId);
    const equippedObjectId = equippedFor("object");
    const customObject = SHOP_ITEMS.find((item) => item.id === equippedObjectId);
    const objectPos = decorPositions[currentRoomId];

    // Proximity Snap to Equipped Object (Furniture)
    if (customObject && objectPos) {
      const objFloor = getFloorCoords(objectPos.x, objectPos.y);
      const distToObj = Math.hypot(rabbitX - objFloor.x, rabbitY - objFloor.y);
      if (distToObj < 12) {
        finalX = objFloor.x;
        finalY = objFloor.y;
        
        // Choose sweet action animations
        if (customObject.id.includes("desk") || customObject.id.includes("study")) {
          setCompanionOverrideAction("study");
        } else if (customObject.id.includes("bath") || customObject.id.includes("tub")) {
          setCompanionOverrideAction("brush_hair");
        } else if (customObject.id.includes("bed") || customObject.id.includes("sleep")) {
          setCompanionOverrideAction("sleep");
        } else {
          setCompanionOverrideAction("happy");
        }
      }
    } 
    // Proximity Snap to Custom Rug (Center of the room)
    else if (customRug) {
      const distToRug = Math.hypot(rabbitX - 50, rabbitY - 50);
      if (distToRug < 12) {
        finalX = 50;
        finalY = 50;
        setCompanionOverrideAction("happy");
      }
    }

    setRabbitX(finalX);
    setRabbitY(finalY);

    // Save to localStorage
    window.localStorage.setItem(
      `titroutine:rabbitPos:${currentRoomId}`,
      JSON.stringify({ x: finalX, y: finalY })
    );
    playTing();
  };


  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const showToolbars = useAutoHideToolbars(habitsRef, mobileScrollRef);

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
  useCaptureTimezone(data.profile.timezone, () => router.refresh());

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
    // Timer habits open the focus countdown on both mobile and desktop.
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
  const roomSectionRef = useRef<HTMLDivElement | null>(null);
  const decorDragRef = useRef<{ down: boolean; moved: boolean; startX: number; startY: number; prev?: { x: number; y: number } } | null>(null);
  const decorDragMovedRef = useRef(false);
  const latestDecorPosRef = useRef<{ x: number; y: number } | null>(null);
  const petDragMovedRef = useRef(false);

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
    const pX = ((e.clientX - rect.left) / rect.width) * 100;
    const pY = ((e.clientY - rect.top) / rect.height) * 100;
    const floorPos = getFloorCoords(pX, pY);
    const screenPos = getIsoCoords(floorPos.x, floorPos.y);
    const pos = { x: Math.round(screenPos.left * 10) / 10, y: Math.round(screenPos.top * 10) / 10 };
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
      <style>{`
        @keyframes floatDiorama {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }
        @keyframes scaleShadow {
          0% { transform: scale(1); opacity: 0.22; }
          50% { transform: scale(0.88); opacity: 0.12; }
          100% { transform: scale(1); opacity: 0.22; }
        }
        .float-diorama {
          animation: floatDiorama 4.5s infinite ease-in-out;
        }
        .scale-shadow {
          animation: scaleShadow 4.5s infinite ease-in-out;
        }
      `}</style>
      {/* Desktop Sidebar (Notion-style) */}
      <DesktopSidebar
        activeTab={activeTab}
        onHome={() => { playSwoosh(); setActiveTab("habits"); }}
        onTasks={() => { playSwoosh(); setActiveTab("tasks"); }}
        onShop={() => { playSwoosh(); setIsShopOpen(true); }}
        onAlbum={() => { playSwoosh(); setIsAlbumOpen(true); }}
        onAnalytics={() => { playSwoosh(); router.push(`/${locale}/analytics`); }}
        onSettings={() => setIsSettingsOpen(true)}
        onProfile={() => { playSwoosh(); setActiveOverlay("pet_profile"); }}
        onAdventure={() => { playSwoosh(); setActiveOverlay("adventure_story"); }}
        onMindfulness={() => { playSwoosh(); setActiveOverlay("mindfulness_menu"); }}
        onNeighbors={() => { playSwoosh(); setIsNeighborOpen(true); }}
        onDecorToggle={() => {
          playSwoosh();
          setIsDecorMode((prev) => !prev);
          setSelectedDecorSlot(null);
        }}
        isDecorMode={isDecorMode}
        roomsAllUnlocked={roomsAllUnlocked}
        currentStage={currentStage}
      />

      {/* Main Workspace split panel */}
      <div
        ref={mobileScrollRef}
        className="flex-1 flex flex-col md:flex-row min-w-0 h-full overflow-y-auto md:overflow-hidden relative"
      >
        {/* Top half: Pet Room */}
        <section
          className={`relative flex-1 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-theme-border p-4 pb-20 md:p-6 md:pb-24 min-h-[60vh] md:min-h-0 h-[65vh] md:h-full transition-colors duration-1000 ${roomBackground}`}
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

        {/* Floating 3D Diorama Island */}
        <div
          ref={roomSectionRef}
          className={`relative w-full max-w-[460px] aspect-square mx-auto flex items-center justify-center float-diorama z-10 mt-8 pointer-events-auto select-none transition-all duration-300 ${
            isTransitioning ? "scale-90 opacity-0 blur-sm" : "scale-100 opacity-100 blur-0"
          }`}
        >
          {/* Diorama Ambient Floating Shadow */}
          <div className="absolute bottom-[2%] left-1/2 -translate-x-1/2 w-[65%] h-5 bg-black/20 rounded-full blur-[6px] scale-shadow pointer-events-none -z-10" />

          {/* 3D Isometric Room Backdrop */}
          <RoomBackdrop
            roomId={currentRoomId}
            timeOfDay={timeOfDay}
            weather={weather}
            showWallpaper={showWallpaper}
            customWallpaper={customWallpaper}
          />

          {/* Glowing guide grid in Decor Mode */}
          {isDecorMode && (
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-30 animate-pulse"
              viewBox="0 0 340 340"
            >
              {Array.from({ length: 9 }).map((_, i) => {
                const gX = 10 + i * 10;
                const startLine = getIsoCoords(gX, 10);
                const endLine = getIsoCoords(gX, 90);
                const startLineCross = getIsoCoords(10, gX);
                const endLineCross = getIsoCoords(90, gX);
                return (
                  <React.Fragment key={`grid-${i}`}>
                    <line x1={`${startLine.left}%`} y1={`${startLine.top}%`} x2={`${endLine.left}%`} y2={`${endLine.top}%`} stroke="#eab308" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1={`${startLineCross.left}%`} y1={`${startLineCross.top}%`} x2={`${endLineCross.left}%`} y2={`${endLineCross.top}%`} stroke="#eab308" strokeWidth="1" strokeDasharray="3 3" />
                  </React.Fragment>
                );
              })}
            </svg>
          )}
          {/* Mess spots (Habit-Rabbit cleaning loop): clutter piles of the current
              room; tap to spend cleaning energy and clear them permanently. */}
          {!isDecorMode &&
          spotsForRoom(currentRoomId)
            .filter((spot) => !cleanedSpots[spot.id])
            .map((spot) => {
              const affordable = cleaningEnergy >= spot.cost;
              const isSweeping = sweepingSpotId === spot.id;
              const isoCoord = SPOT_ISO_COORDS[spot.id];
              const { left, top } = isoCoord ? getIsoCoords(isoCoord.x, isoCoord.y) : { left: 50, top: 70 };
              return (
                <button
                  key={spot.id}
                  type="button"
                  disabled={isSweeping}
                  onClick={() => handleCleanSpot(spot)}
                  title={t("cleanSpotTitle", { cost: spot.cost })}
                  aria-label={t("cleanSpotTitle", { cost: spot.cost })}
                  style={{
                    left: `${left}%`,
                    top: `${top}%`,
                    transform: "translate(-50%, -85%)",
                    zIndex: isoCoord ? Math.round(isoCoord.x + isoCoord.y) : 20,
                  }}
                  className="absolute pointer-events-auto flex flex-col items-center group"
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
        {customObject && !isDecorMode && (() => {
          const finalObjectStyle = objectPos
            ? {
                left: `${objectPos.x}%`,
                top: `${objectPos.y}%`,
                zIndex: Math.round(getFloorCoords(objectPos.x, objectPos.y).x + getFloorCoords(objectPos.x, objectPos.y).y),
              }
            : {
                left: "41.6%",
                top: "62.8%",
                zIndex: 60,
              };
          return (
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
              style={finalObjectStyle}
              className="absolute h-24 w-24 object-contain drop-shadow-md select-none touch-none pointer-events-auto cursor-grab active:cursor-grabbing hover:scale-105 transition-all -translate-x-1/2 -translate-y-[80%]"
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
          );
        })()}

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

        {/* Custom Rug (Fixed flat on the floor center) */}
        {(() => {
          if (isDecorMode) return null;
          return customRug ? (
            <div 
              className="absolute w-[180px] h-[180px] pointer-events-none transition-all duration-700"
              style={{
                left: "50%",
                top: "70%",
                transform: "translate(-50%, -50%) rotate(45deg) scale(1, 0.5)",
                zIndex: 5,
              }}
            >
              <Image
                src={customRug.imageUrl}
                alt="Rug"
                fill
                sizes="180px"
                className="object-contain opacity-90"
              />
            </div>
          ) : (
            <div 
              className="absolute w-[140px] h-[140px] bg-black/[0.08] rounded-full blur-[2px] pointer-events-none transition-all duration-700"
              style={{
                left: "50%",
                top: "70%",
                transform: "translate(-50%, -50%) rotate(45deg) scale(1, 0.5)",
                zIndex: 4,
              }}
            />
          );
        })()}

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

          const { left, top } = getIsoCoords(rabbitX, rabbitY);
          const containerClass = `absolute -translate-x-1/2 -translate-y-[92%] cursor-pointer select-none touch-none pointer-events-auto transition-all ${
            isDragging ? "drop-shadow-2xl scale-105 z-40 opacity-90" : "drop-shadow-lg hover:scale-102 z-25"
          }`;
          const containerStyle = {
            left: `${left}%`,
            top: `${isDragging ? top - 3 : top}%`, // Lift slightly when dragging
            zIndex: Math.round(rabbitX + rabbitY),
          };

          return (
            <div
              className={containerClass}
              style={containerStyle}
              onPointerDown={handlePetPointerDown}
              onPointerMove={handlePetPointerMove}
              onPointerUp={handlePetPointerUp}
              onPointerCancel={handlePetPointerUp}
              onClick={() => {
                if (petDragMovedRef.current) {
                  petDragMovedRef.current = false;
                  return;
                }
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
              {/* Foot shadow under pet */}
              <div 
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-14 h-4 bg-black/20 rounded-full blur-[2px] -z-10 pointer-events-none"
                style={{ transform: "translateX(-50%) scale(1, 0.4)" }}
              />

              {currentStage === 0 ? (
                <EggCompanion streak={currentStreak} action={currentAction} className="drop-shadow-lg" />
              ) : (
                <RabbitCompanion
                  key={`stage-${currentStage}-${currentAction}-${equippedFor("outfit")}`}
                  stage={currentStage}
                  action={currentAction}
                  equippedOutfit={equippedFor("outfit") ?? undefined}
                  className="drop-shadow-lg"
                  flipX={facingLeft}
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
        </div>

        {/* HUD Overlay (Level & Satiety) — Positioned relative to the section for breathing room */}
        <div 
          className="absolute top-4 left-4 md:top-6 md:left-6 z-30 flex flex-col gap-2 p-3 bg-white/70 backdrop-blur-md rounded-2xl border border-white/50 shadow-[0_8px_24px_rgba(0,0,0,0.06)] text-theme-text max-w-[140px] pointer-events-auto hover:scale-102 transition-all duration-300"
        >
          {/* Level Badge */}
          <div className="flex items-center gap-1.5">
            <div className="w-5.5 h-5.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 flex items-center justify-center text-[10px] font-black text-white shadow-sm ring-2 ring-white animate-pulse-glow">
              ⭐
            </div>
            <span className="text-[11px] font-black text-amber-955/90 tracking-tight">Cấp {petLevel}</span>
          </div>
          {/* Satiety Mini progress bar */}
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-900">
            <span className="leading-none text-xs">🍲</span>
            <div className="flex-1 w-16 h-2 bg-stone-200/80 rounded-full overflow-hidden border border-stone-300/30">
              <div className="h-full bg-gradient-to-r from-orange-400 to-amber-500 rounded-full transition-all duration-500" style={{ width: `${effSatiety}%` }} />
            </div>
          </div>
          {/* Affection Mini progress bar */}
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-900">
            <span className="leading-none text-xs">❤️</span>
            <div className="flex-1 w-16 h-2 bg-stone-200/80 rounded-full overflow-hidden border border-stone-300/30">
              <div className="h-full bg-gradient-to-r from-rose-400 to-pink-500 rounded-full transition-all duration-500" style={{ width: `${affection}%` }} />
            </div>
          </div>
        </div>

        {/* Currency & Stats Card (Streak | Coins | Cleaning Energy) — Positioned relative to the section */}
        <div 
          className="absolute top-4 right-4 md:top-6 md:right-6 z-30 pointer-events-auto transition-all duration-300"
        >
          <button
            type="button"
            onClick={() => {
              playTing();
              setShowFreezeTooltip((prev) => !prev);
            }}
            className="flex flex-col gap-1.5 p-3 bg-white/70 hover:bg-white/85 active:scale-95 backdrop-blur-md rounded-2xl border border-white/50 shadow-[0_8px_24px_rgba(0,0,0,0.06)] text-theme-text min-w-[110px] items-end text-right transition-all animate-bubble-pop"
          >
            <div className="flex items-center gap-1 text-[10px] font-black text-orange-600 bg-orange-50/50 border border-orange-100 px-2 py-0.5 rounded-full">
              {vacationMode && (
                <span className="animate-pulse mr-0.5" title={t("vacationActive")}>🏖️</span>
              )}
              <span>🔥 {currentStreak} {t("streakDaysShort", { defaultValue: "ngày" })}</span>
              {data.profile.streakFreezes > 0 && (
                <span className="text-[8px] bg-blue-100/80 border border-blue-200 px-1 rounded-full ml-0.5">❄️ {data.profile.streakFreezes}</span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[10px] font-black text-amber-600 bg-amber-50/50 border border-amber-100 px-2 py-0.5 rounded-full">
              <span>🪙 {coins}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50/50 border border-emerald-100 px-2 py-0.5 rounded-full">
              <span>🧹 {cleaningEnergy}</span>
            </div>
          </button>

          {showFreezeTooltip && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowFreezeTooltip(false)} />
              <div className="absolute top-full right-0 mt-2.5 w-52 bg-white/95 border border-amber-900/10 p-3.5 rounded-2xl shadow-xl z-50 text-left pointer-events-auto text-theme-text animate-sheet-up">
                <div className="text-[10px] font-black text-amber-955/40 uppercase tracking-wider mb-1">
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

        {/* Bottom Floating Menu Trigger (Mobile only) — Positioned relative to the section */}
        <button
          type="button"
          onClick={() => {
            playSwoosh();
            setIsMobileSidebarOpen(true);
          }}
          className="absolute bottom-28 left-4 w-12 h-12 md:hidden rounded-full bg-gradient-to-b from-stone-500 to-stone-600 border-b-4 border-b-stone-800 flex flex-col items-center justify-center shadow-[0_6px_16px_rgba(87,83,78,0.35)] hover:scale-105 active:border-b-0 active:translate-y-[4px] transition-all duration-300 z-30 text-white pointer-events-auto"
          aria-label="Menu"
        >
          <span className="text-lg leading-none -mb-0.5">☰</span>
          <span className="text-[8px] font-extrabold tracking-tighter text-white/90">Menu</span>
        </button>

        {/* Bottom Floating Map / Room Switcher Button (Both mobile & desktop) — Positioned relative to the section */}
        <button
          type="button"
          onClick={() => {
            playTing();
            setIsRoomSwitcherOpen(true);
          }}
          className="absolute bottom-28 right-4 w-13 h-13 rounded-full bg-gradient-to-b from-amber-400 via-amber-500 to-orange-500 border-b-4 border-b-amber-700 flex flex-col items-center justify-center shadow-[0_6px_16px_rgba(217,119,6,0.35)] hover:scale-105 active:border-b-0 active:translate-y-[4px] transition-all duration-300 z-30 text-white pointer-events-auto"
        >
          <DoorOpen className="w-5.5 h-5.5 text-white" />
          <span className="text-[8px] font-black tracking-tighter text-white -mt-0.5">{tRooms(currentRoomId)}</span>
        </button>

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

      {/* Bottom half: Habits / Tasks panel (scrolls internally) */}
      <HabitsPanel
        scrollRef={habitsRef}
        data={data}
        habits={habits}
        activeTab={activeTab}
        isNavigating={isNavigating}
        completedCount={completedCount}
        totalCount={totalCount}
        pendingIds={pendingIds}
        onSelectDate={(dateStr) => startNavigation(() => router.push(`/${locale}?date=${dateStr}`))}
        onToday={() => startNavigation(() => router.push(`/${locale}`))}
        onRefresh={() => router.refresh()}
        onEditHabit={setEditingHabit}
        onToggle={commitToggle}
        onDoIt={handleDoIt}
        onIncrement={handleIncrementCounter}
      />

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
      {timerHabit && (
        <TimerModal
          title={timerHabit.title}
          durationSeconds={timerHabit.config.target_time ?? 15 * 60}
          reward
          defaultFocusMode={timerHabit.config.focus_mode}
          onClose={() => setTimerHabit(null)}
          onComplete={(seconds) => {
            commitToggle(timerHabit, seconds);
            setTimerHabit(null);
          }}
        />
      )}
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

      {/* Neighbourhood / Tree Town */}
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

      {/* Mobile "cozy toolbag" quick menu */}
      <QuickMenuSheet
        open={activeOverlay === "quick_menu"}
        setActiveOverlay={setActiveOverlay}
        playSwoosh={playSwoosh}
        adventureReady={data.profile.adventureEnergy >= 30}
        roomsAllUnlocked={roomsAllUnlocked}
        onOpenNeighbor={() => setIsNeighborOpen(true)}
        currentStage={currentStage}
        isDecorMode={isDecorMode}
        onToggleDecor={() => {
          playSwoosh();
          setIsDecorMode((prev) => !prev);
          setSelectedDecorSlot(null);
          setActiveOverlay(null);
        }}
      />

      {/* Mindfulness tools bottom sheet */}
      <MindfulnessMenuSheet
        open={activeOverlay === "mindfulness_menu"}
        setActiveOverlay={setActiveOverlay}
      />

      {/* Room switcher / house explorer */}
      <RoomSwitcherModal
        open={isRoomSwitcherOpen}
        onClose={() => setIsRoomSwitcherOpen(false)}
        onVisitRoom={(id) => {
          goToRoom(id);
          setIsRoomSwitcherOpen(false);
          playTing();
        }}
        currentRoomId={currentRoomId}
        petExp={petExp}
        devLevelOverride={devLevelOverride}
        unlockedRooms={data.profile.unlockedRooms}
        cleanedSpots={cleanedSpots}
      />

      {/* Mobile slide-over sidebar */}
      <MobileSidebar
        open={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        activeTab={activeTab}
        isDecorMode={isDecorMode}
        currentStage={currentStage}
        roomsAllUnlocked={roomsAllUnlocked}
        onHome={() => { playSwoosh(); setActiveTab("habits"); setIsDecorMode(false); setIsMobileSidebarOpen(false); }}
        onTasks={() => { playSwoosh(); setActiveTab("tasks"); setIsDecorMode(false); setIsMobileSidebarOpen(false); }}
        onProfile={() => { playSwoosh(); setActiveOverlay("pet_profile"); setIsMobileSidebarOpen(false); }}
        onAdventure={() => { playSwoosh(); setActiveOverlay("adventure_story"); setIsMobileSidebarOpen(false); }}
        onMindfulness={() => { playSwoosh(); setActiveOverlay("mindfulness_menu"); setIsMobileSidebarOpen(false); }}
        onNeighbors={() => { playSwoosh(); setIsNeighborOpen(true); setIsMobileSidebarOpen(false); }}
        onToggleDecor={() => { playSwoosh(); setIsDecorMode((prev) => !prev); setSelectedDecorSlot(null); setIsMobileSidebarOpen(false); }}
        onShop={() => { playSwoosh(); setIsShopOpen(true); setIsMobileSidebarOpen(false); }}
        onAlbum={() => { playSwoosh(); setIsAlbumOpen(true); setIsMobileSidebarOpen(false); }}
        onAnalytics={() => { playSwoosh(); router.push(`/${locale}/analytics`); setIsMobileSidebarOpen(false); }}
        onSettings={() => { playSwoosh(); setIsSettingsOpen(true); setIsMobileSidebarOpen(false); }}
      />
    </main>
  );
}
