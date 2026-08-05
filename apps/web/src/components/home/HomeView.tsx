"use client";

import React, { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import confetti from "canvas-confetti";
import { DuoButton } from "@/components/ui/DuoButton";
import { HabitModal } from "@/components/home/HabitModal";
import { SettingsModal } from "@/components/home/SettingsModal";
import { TimerModal } from "@/components/home/TimerModal";
import { ShopModal } from "@/components/home/ShopModal";
import { CelebrationModal } from "@/components/home/CelebrationModal";
import { BottomNav } from "@/components/home/BottomNav";
import { DesktopSidebar } from "@/components/home/DesktopSidebar";
import { MobileSidebar } from "@/components/home/MobileSidebar";
import { HabitsPanel } from "@/components/home/HabitsPanel";
import type { ActiveOverlay } from "@/components/home/overlayTypes";
import { useAutoHideToolbars } from "@/components/home/hooks/useAutoHideToolbars";
import { useCaptureTimezone } from "@/components/home/hooks/useCaptureTimezone";
import { useSound } from "@/hooks/useSound";
import {
  toggleHabitAction,
  claimDailyCheckinAction,
  incrementCounterHabitAction,
  setVacationModeAction,
  moveBadgeAction,
  setBadgeVisibilityAction,
  acknowledgeBadgeMilestoneAction,
} from "@/app/[locale]/actions";
import type { DashboardData, HabitWithLog } from "@/lib/types";
import { CharacterCompanion } from "@/components/pet/CharacterCompanion";
import { hasSheet } from "@/lib/characters";
import { usePandaAction } from "@/components/home/hooks/usePandaAction";
import { MinimalCozyRoom } from "@/components/room/MinimalCozyRoom";
import { NeighborVisitModal } from "@/components/social/NeighborVisitModal";
import { VisitLayer } from "@/components/social/VisitLayer";
import { COOP_KINDS, type CoopKind } from "@/lib/coop";
import { getBadge, eligibleBadgeKeys, nextUncelebratedBadge } from "@/lib/badges";
import { RoomBadge } from "@/components/home/RoomBadge";


/** How long a co-op duo animation plays before both companions go back to idle. */
const COOP_ANIMATION_MS = 4000;

export function HomeView({ data }: { data: DashboardData }) {
  const locale = useLocale();
  const router = useRouter();
  const { playTing, playSwoosh } = useSound();

  // Live from server data every render — was previously a local hook seeded once
  // at mount and never updated, so the bar froze at its initial value forever.
  const happyMeter = Math.round(((data.profile.satiety ?? 80) + (data.profile.affection ?? 50)) / 2);
  const { currentAction } = usePandaAction();

  // Server data is the source of truth; mirror it locally for optimistic UI.
  const [habits, setHabits] = useState(data.habits);
  const [coins, setCoins] = useState(data.profile.coins);
  const [focusTokens, setFocusTokens] = useState(data.profile.focusTokens ?? 0);
  const [consumables, setConsumables] = useState(data.inventory.consumables ?? {});
  const [unlockedItems, setUnlockedItems] = useState(data.inventory.unlockedItems ?? []);
  const [vacationMode, setVacationMode] = useState(data.profile.vacationMode ?? false);
  const [badges, setBadges] = useState(data.badges);
  const roomCanvasRef = useRef<HTMLDivElement>(null);

  const handleBadgeMove = (key: string, x: number, y: number) => {
    setBadges((prev) => prev.map((b) => (b.key === key ? { ...b, x, y } : b)));
    startTransition(async () => {
      await moveBadgeAction(key, x, y);
    });
  };

  const handleBadgeHide = (key: string) => {
    setBadges((prev) => prev.map((b) => (b.key === key ? { ...b, visible: false } : b)));
    startTransition(async () => {
      await setBadgeVisibilityAction(key, false);
    });
  };

  const hasUnpurchasedBadge = eligibleBadgeKeys(data.profile.currentStreak).some(
    (key) => !badges.some((b) => b.key === key)
  );
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());
  const [activeTab, setActiveTab] = useState<"habits" | "tasks">("habits");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Drag-to-walk: the companion can be dragged anywhere within the room floor
  // (Study Bunny style). Pure client UI state — resets on reload, never persisted.
  const floorBoundsRef = useRef<HTMLDivElement>(null);
  const companionDragElRef = useRef<HTMLDivElement>(null);
  const [companionOffset, setCompanionOffset] = useState({ x: 0, y: 0 });
  const [companionFacingLeft, setCompanionFacingLeft] = useState(false);
  const companionDrag = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startOffset: { x: number; y: number };
    minDx: number;
    maxDx: number;
    minDy: number;
    maxDy: number;
  } | null>(null);
  // Survives past pointerup (unlike the ref above, which is cleared there) so the
  // click handler that fires right after can tell a drag from a tap.
  const companionWasDragged = useRef(false);

  const handleCompanionPointerDown = (e: React.PointerEvent) => {
    const el = companionDragElRef.current;
    const bounds = floorBoundsRef.current;
    if (!el || !bounds) return;
    const elRect = el.getBoundingClientRect();
    const boundsRect = bounds.getBoundingClientRect();
    el.setPointerCapture(e.pointerId);
    companionWasDragged.current = false;
    companionDrag.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startOffset: companionOffset,
      minDx: boundsRect.left - elRect.left,
      maxDx: boundsRect.right - elRect.right,
      minDy: boundsRect.top - elRect.top,
      maxDy: boundsRect.bottom - elRect.bottom,
    };
  };

  const handleCompanionPointerMove = (e: React.PointerEvent) => {
    const drag = companionDrag.current;
    if (!drag || e.pointerId !== drag.pointerId) return;
    const rawDx = e.clientX - drag.startX;
    const rawDy = e.clientY - drag.startY;
    if (Math.abs(rawDx) > 4 || Math.abs(rawDy) > 4) companionWasDragged.current = true;
    if (Math.abs(rawDx) > 2) setCompanionFacingLeft(rawDx < 0);
    const dx = Math.min(Math.max(rawDx, drag.minDx), drag.maxDx);
    const dy = Math.min(Math.max(rawDy, drag.minDy), drag.maxDy);
    setCompanionOffset({ x: drag.startOffset.x + dx, y: drag.startOffset.y + dy });
  };

  const handleCompanionPointerUp = (e: React.PointerEvent) => {
    const drag = companionDrag.current;
    if (!drag || e.pointerId !== drag.pointerId) return;
    companionDrag.current = null;
  };

  const handleCompanionClick = () => {
    // A real drag shouldn't also count as a tap-to-open-shop.
    if (companionWasDragged.current) {
      companionWasDragged.current = false;
      return;
    }
    setIsShopOpen(true);
  };

  // Mobile only: the habits/tasks panel is a full-screen overlay over the room,
  // opened from the room's ☰ menu or the bottom nav. Desktop always shows both
  // side-by-side and ignores this flag entirely.
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(false);

  // Co-op animation currently playing in the room. Set when a co-op action is
  // sent, cleared on a timer so the companions return to their idle loop.
  const [activeCoop, setActiveCoop] = useState<CoopKind | null>(null);
  const visit = data.activeVisit;
  // Duo sheets are still being drawn. Until one exists, playing it would just
  // swap in the idle fallback and make the partner vanish — so keep both sprites
  // and let the emoji in the speech bubbles carry the moment instead.
  const coopConfig = activeCoop ? COOP_KINDS[activeCoop] : null;
  const coopDuoReady = coopConfig
    ? hasSheet(data.profile.characterId, coopConfig.action)
    : false;

  /**
   * Without a duo sheet, both companions play the co-op's solo action in sync
   * (greeting = both wave). Resolved per character, since one may have the sheet
   * while the other doesn't — whoever is missing it just keeps idling.
   */
  const coopSoloFor = (characterId: string) =>
    !coopDuoReady && coopConfig?.soloAction && hasSheet(characterId, coopConfig.soloAction)
      ? coopConfig.soloAction
      : null;
  const myCoopAction = coopSoloFor(data.profile.characterId);
  const partnerCoopAction = visit ? coopSoloFor(visit.partner.characterId) : null;

  useEffect(() => {
    if (!activeCoop) return;
    const timeoutId = setTimeout(() => setActiveCoop(null), COOP_ANIMATION_MS);
    return () => clearTimeout(timeoutId);
  }, [activeCoop]);

  // A visit that ended elsewhere shouldn't leave a duo animation frozen mid-room.
  useEffect(() => {
    if (!visit) setActiveCoop(null);
  }, [visit]);

  
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

  const isSettingsOpen = activeOverlay === "settings";
  const setIsSettingsOpen = (val: boolean) => setActiveOverlay(val ? "settings" : null);

  const isShopOpen = activeOverlay === "shop";
  const setIsShopOpen = (val: boolean) => setActiveOverlay(val ? "shop" : null);

  const isNeighborVisitOpen = activeOverlay === "neighbor";
  const setIsNeighborVisitOpen = (val: boolean) => setActiveOverlay(val ? "neighbor" : null);

  const [celebration, setCelebration] = useState<{
    isOpen: boolean;
    type: "streak" | "checkin" | "habit" | "badge";
    streakCount?: number;
    coinsAwarded?: number;
    habitTitle?: string;
    badgeEmoji?: string;
    badgeDays?: number;
  }>({ isOpen: false, type: "streak" });




  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const showToolbars = useAutoHideToolbars(habitsRef, mobileScrollRef);

  // Auto-trigger daily checkin popup
  useEffect(() => {
    if (data.profile.lastCheckinDate !== data.today) {
      setCelebration({
        isOpen: true,
        type: "checkin",
        coinsAwarded: 15,
      });
    }
  }, [data.profile.lastCheckinDate, data.today]);

  // Auto-trigger the "you unlocked a badge!" popup once per newly-reached milestone.
  useEffect(() => {
    const badge = nextUncelebratedBadge(data.profile.currentStreak, data.profile.badgeMilestoneSeen);
    if (badge) {
      setCelebration({
        isOpen: true,
        type: "badge",
        badgeEmoji: badge.emoji,
        badgeDays: badge.requiredStreak,
      });
    }
  }, [data.profile.currentStreak, data.profile.badgeMilestoneSeen]);

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
    
    if (willComplete && !isNegative) {
      playTing();
      setCelebration({
        isOpen: true,
        type: "habit",
        coinsAwarded: 10,
      });
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
    const isBadge = celebration.type === "badge";
    setCelebration((prev) => ({ ...prev, isOpen: false }));
    if (isCheckin) {
      setCoins((c) => c + 15);
      startTransition(async () => {
        await claimDailyCheckinAction();
        router.refresh();
      });
    } else if (isBadge) {
      startTransition(async () => {
        await acknowledgeBadgeMilestoneAction();
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

  const isEvolved = data.profile.petStage >= 1;

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
        onAnalytics={() => { playSwoosh(); router.push(`/${locale}/analytics`); }}
        onSettings={() => setIsSettingsOpen(true)}
        onNeighbor={() => setIsNeighborVisitOpen(true)}
      />

      {/* Main Workspace split panel. On mobile the room owns the whole screen —
          the habits/tasks panel below becomes a full-screen overlay (see
          isMobilePanelOpen) instead of being stacked underneath it. */}
      <div className="flex-1 flex flex-col md:flex-row min-w-0 h-full overflow-hidden relative">
        <section className="relative flex-1 flex flex-col p-0 min-h-[420px] md:min-h-0 h-full overflow-hidden border-b md:border-b-0 md:border-r border-theme-border bg-[#FAF5ED]">
          <MinimalCozyRoom bgImageUrl="/assets/user_room_vertical.png">

            {/* Top Bar 1: Happy Meter Progress Bar (Emerald Green Bar) */}
            <div className="w-full bg-stone-200/50 h-2.5 relative overflow-hidden z-30">
              <div
                className="bg-emerald-500 h-full transition-all duration-500 rounded-r-full shadow-xs"
                style={{ width: `${happyMeter}%` }}
              />
            </div>

            {/* Invisible bounds badges can be dragged within — nearly the whole room. */}
            <div ref={roomCanvasRef} className="absolute inset-x-2 top-[8%] bottom-[4%] z-0 pointer-events-none" />

            {/* Purchased streak badges hanging in the room. */}
            {badges
              .filter((b) => b.visible)
              .map((b) => {
                const cfg = getBadge(b.key);
                if (!cfg) return null;
                return (
                  <RoomBadge
                    key={b.key}
                    badge={b}
                    emoji={cfg.emoji}
                    title={`${cfg.requiredStreak} ngày streak — bấm để ẩn`}
                    boundsRef={roomCanvasRef}
                    onMove={(x, y) => handleBadgeMove(b.key, x, y)}
                    onHide={() => handleBadgeHide(b.key)}
                  />
                );
              })}

            {/* Top Bar 2: Official Study Bunny HUD Bar (Glassmorphism card, clean & no overlapping) */}
            <div className="mx-3 mt-2 z-30 pointer-events-auto flex items-center justify-between px-3.5 py-2 bg-white/85 backdrop-blur-md rounded-2xl border border-white/60 shadow-sm">
              {/* Left Side: Currencies + Streak */}
              <div className="flex items-center gap-2 text-xs font-black text-stone-800">
                <button
                  onClick={() => setIsShopOpen(true)}
                  className="relative flex items-center gap-1 bg-amber-100/80 px-2.5 py-1 rounded-full border border-amber-200/60 text-amber-900 shadow-xs hover:bg-amber-100 active:scale-95 transition-all"
                >
                  🪙 {data.profile.coins} <span className="text-[10px] text-amber-600 font-normal">+</span>
                  {hasUnpurchasedBadge && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white animate-pulse" />
                  )}
                </button>
                <button
                  onClick={() => setIsShopOpen(true)}
                  className="flex items-center gap-1 bg-orange-100/80 px-2.5 py-1 rounded-full border border-orange-200/60 text-orange-900 shadow-xs hover:bg-orange-100 active:scale-95 transition-all"
                >
                  🥕 {data.inventory.consumables?.carrots ?? 40} <span className="text-[10px] text-orange-600 font-normal">+</span>
                </button>
                <span className="flex items-center gap-1 bg-red-100/80 px-2.5 py-1 rounded-full border border-red-200/60 text-red-900 shadow-xs">
                  🔥 {data.profile.currentStreak}
                </span>
              </div>

              {/* Center: Companion Name (user-renameable, see Settings) */}
              <div className="text-sm font-black text-amber-950 tracking-wide">
                {data.profile.characterName}
              </div>

              {/* Right Side: Menu Button (≡) */}
              <button
                onClick={() => { playSwoosh(); setIsMenuOpen(!isMenuOpen); }}
                className="w-9 h-9 rounded-full bg-white border border-stone-200 shadow-xs flex items-center justify-center text-stone-800 font-bold hover:bg-stone-100 active:scale-95 transition-all"
              >
                {isMenuOpen ? "✕" : "☰"}
              </button>
            </div>

            {/* Official Study Bunny Dropdown Icon Stack (When Menu (≡) is Tapped) */}
            {isMenuOpen && (
              <div className="absolute top-16 right-4 z-40 flex flex-col items-end gap-2 animate-in fade-in slide-in-from-top-4 duration-200 pointer-events-auto">
                <button
                  onClick={() => { setIsMenuOpen(false); setIsShopOpen(true); }}
                  className="relative flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-stone-200 shadow-md text-xs font-bold text-stone-700 hover:bg-amber-50 active:scale-95 transition-all"
                >
                  <span>Cửa Hàng</span>
                  <span className="relative w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-sm">
                    🛒
                    {hasUnpurchasedBadge && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-white animate-pulse" />
                    )}
                  </span>
                </button>
                <button
                  onClick={() => { setIsMenuOpen(false); router.push(`/${locale}/analytics`); }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-stone-200 shadow-md text-xs font-bold text-stone-700 hover:bg-amber-50 active:scale-95 transition-all"
                >
                  <span>Thống Kê</span>
                  <span className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-sm">📊</span>
                </button>
                <button
                  onClick={() => { setIsMenuOpen(false); setActiveTab("habits"); setIsMobilePanelOpen(true); }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-stone-200 shadow-md text-xs font-bold text-stone-700 hover:bg-amber-50 active:scale-95 transition-all"
                >
                  <span>Thói Quen</span>
                  <span className="w-7 h-7 rounded-full bg-lime-100 flex items-center justify-center text-sm">🌱</span>
                </button>
                <button
                  onClick={() => { setIsMenuOpen(false); setActiveTab("tasks"); setIsMobilePanelOpen(true); }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-stone-200 shadow-md text-xs font-bold text-stone-700 hover:bg-amber-50 active:scale-95 transition-all"
                >
                  <span>Task Board</span>
                  <span className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-sm">📋</span>
                </button>
                <button
                  onClick={() => { setIsMenuOpen(false); setIsNeighborVisitOpen(true); }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-stone-200 shadow-md text-xs font-bold text-stone-700 hover:bg-amber-50 active:scale-95 transition-all"
                >
                  <span>Hàng Xóm</span>
                  <span className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-sm">🏡</span>
                </button>
                <button
                  onClick={() => { setIsMenuOpen(false); setIsSettingsOpen(true); }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-stone-200 shadow-md text-xs font-bold text-stone-700 hover:bg-amber-50 active:scale-95 transition-all"
                >
                  <span>Cài Đặt</span>
                  <span className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-sm">⚙️</span>
                </button>
              </div>
            )}

            {/* Center Area: Focus Timer Ring (Overlay when Timer Active) */}
            <div className="w-full flex-1 relative flex flex-col items-center justify-center">
              {timerHabit && (
                <div className="absolute top-4 z-20 flex flex-col items-center animate-fade-in">
                  <div className="w-28 h-28 rounded-full border-4 border-emerald-400 bg-white/95 backdrop-blur-md flex items-center justify-center shadow-lg">
                    <span className="text-2xl font-black text-emerald-800 font-mono">
                      {Math.floor((timerHabit.config.target_time ?? 900) / 60)}:00
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Invisible walkable region the companion can be dragged within — spans
                most of the floor, clear of the top HUD and the very bottom edge. */}
            <div ref={floorBoundsRef} className="absolute inset-x-3 top-[26%] bottom-[8%] z-0 pointer-events-none" />

            {/* Floor Space: Panda Girl Standing / Sitting ON THE FULL ROOM FLOOR CARPET */}
            <div className="absolute bottom-[16%] left-1/2 -translate-x-1/2 z-20 flex items-end justify-center gap-1 pointer-events-auto">
              {activeCoop && coopDuoReady ? (
                /* Co-op in progress: one duo sheet draws BOTH companions together. */
                <div className="relative flex flex-col items-center">
                  <div className="mb-1 px-3 py-0.5 bg-white/95 backdrop-blur-md rounded-full text-[10px] font-bold text-amber-900 shadow-xs border border-amber-200/80">
                    {COOP_KINDS[activeCoop].emoji} {data.profile.characterName}
                  </div>
                  <CharacterCompanion
                    characterId={data.profile.characterId}
                    action={COOP_KINDS[activeCoop].action}
                  />
                </div>
              ) : (
                <>
                  {/* Drag-to-walk: this outer div owns the pointer gesture + offset
                      transform; the inner one keeps its own hover/tap styling so the
                      two transforms never fight each other. */}
                  <div
                    ref={companionDragElRef}
                    onPointerDown={handleCompanionPointerDown}
                    onPointerMove={handleCompanionPointerMove}
                    onPointerUp={handleCompanionPointerUp}
                    onPointerCancel={handleCompanionPointerUp}
                    style={{
                      transform: `translate(${companionOffset.x}px, ${companionOffset.y}px)`,
                      touchAction: "none",
                    }}
                    className="cursor-grab active:cursor-grabbing"
                  >
                    <div
                      className="relative flex flex-col items-center cursor-pointer group transition-transform hover:scale-105"
                      onClick={handleCompanionClick}
                    >
                      {/* Speech Bubble — shows the co-op emoji while one is playing. */}
                      {(() => {
                        const hasInProgressTask = (data.tasks || []).some((t) => t.status === "in_progress");
                        const isWorking = timerHabit || hasInProgressTask || currentAction === "working";
                        return (
                          <>
                            <div className="mb-1 px-3 py-0.5 bg-white/95 backdrop-blur-md rounded-full text-[10px] font-bold text-amber-900 shadow-xs border border-amber-200/80">
                              {activeCoop
                                ? `${COOP_KINDS[activeCoop].emoji} ${data.profile.characterName}`
                                : isWorking
                                ? "✍️ Đang làm việc..."
                                : data.profile.characterName}
                            </div>
                            <CharacterCompanion
                              characterId={data.profile.characterId}
                              action={
                                myCoopAction ??
                                (isWorking ? "working" : "idle")
                              }
                              flipX={companionFacingLeft}
                            />
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* The other side of an active visit, standing in the same room. */}
                  {visit && (
                    <div className="relative flex flex-col items-center animate-in fade-in slide-in-from-right-4 duration-500">
                      <div className="mb-1 px-3 py-0.5 bg-white/95 backdrop-blur-md rounded-full text-[10px] font-bold text-sky-900 shadow-xs border border-sky-200/80">
                        {activeCoop
                          ? `${COOP_KINDS[activeCoop].emoji} ${visit.partner.characterName}`
                          : visit.partner.characterName}
                      </div>
                      <CharacterCompanion
                        characterId={visit.partner.characterId}
                        action={partnerCoopAction ?? "idle"}
                        flipX
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Visit banner + co-op dock + unclaimed co-op rewards */}
            <VisitLayer
              visit={visit}
              pendingCoops={data.pendingCoops}
              coopUsedToday={data.coopUsedToday}
              affection={data.profile.affection}
              onCoopPlayed={setActiveCoop}
              onRefresh={() => router.refresh()}
            />
          </MinimalCozyRoom>
        </section>


      {/* Bottom half: Habits / Tasks panel. Desktop keeps it side-by-side with the
          room (md:static, always visible); mobile turns it into a full-screen
          overlay so the room gets the whole screen until this is opened. */}
      <div
        ref={mobileScrollRef}
        className={`${isMobilePanelOpen ? "flex" : "hidden"} md:flex fixed md:static inset-0 md:inset-auto z-40 md:z-auto flex-col overflow-y-auto md:overflow-visible md:flex-1 md:min-w-0 md:h-full bg-earth-bg md:bg-transparent`}
      >
        <button
          type="button"
          onClick={() => setIsMobilePanelOpen(false)}
          className="md:hidden sticky top-0 z-10 flex items-center gap-1.5 px-4 py-3 bg-earth-bg/95 backdrop-blur-md text-xs font-bold text-theme-text/70 active:scale-95 transition-transform"
        >
          <span aria-hidden>←</span>
          <span>Về phòng</span>
        </button>
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
      </div>
      </div> {/* Close Main Workspace split panel */}

      {/* Single bottom navigation — keeps the header clean (streak + coins only). */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${
        showToolbars ? "translate-y-0" : "translate-y-full"
      }`}>
        <BottomNav
          activeTab={activeTab}
          onHome={() => { playSwoosh(); setIsMobilePanelOpen(false); }}
          onTasks={() => { playSwoosh(); setActiveTab("tasks"); setIsMobilePanelOpen(true); }}
          onShop={() => { playSwoosh(); setIsShopOpen(true); }}
          onAnalytics={() => { playSwoosh(); router.push(`/${locale}/analytics`); }}
          onSettings={() => setIsSettingsOpen(true)}
        />
      </div>

      {/* Add-habit FAB, floating just above the bottom nav. Mobile: only while the
          panel is open (no point floating over the empty room). Desktop: always,
          same as before. */}
      {activeTab === "habits" && (
        <div className={`${isMobilePanelOpen ? "block" : "hidden"} md:block absolute bottom-24 md:bottom-6 right-6 z-30 transition-all duration-300 ${
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
        vacationMode={vacationMode}
        onVacationChange={handleVacationToggle}
        characterId={data.profile.characterId}
        characterName={data.profile.characterName}
        hasCustomCharacterName={data.profile.hasCustomCharacterName}
        visitPrivacy={data.profile.visitPrivacy}
      />
      
      <ShopModal
        isOpen={isShopOpen}
        onClose={() => setIsShopOpen(false)}
        coins={coins}
        focusTokens={focusTokens}
        unlockedItems={unlockedItems}
        equippedItems={data.inventory.equippedItems}
        consumables={consumables}
        currentStreak={data.profile.currentStreak}
        ownedBadgeKeys={badges.map((b) => b.key)}
        onBuyBadgeOptimistic={(badgeKey, price) => {
          setCoins((c) => Math.max(0, c - price));
          setBadges((prev) => [...prev, { key: badgeKey, visible: true, x: 50, y: 40 }]);
        }}
        onBuyBadgeRollback={(badgeKey, price) => {
          setCoins((c) => c + price);
          setBadges((prev) => prev.filter((b) => b.key !== badgeKey));
        }}
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
        onBuyFocusItemOptimistic={(itemId, price) => {
          setFocusTokens((t) => Math.max(0, t - price));
        }}
        onBuyFocusItemRollback={(itemId, price) => {
          setFocusTokens((t) => t + price);
        }}
        onEquipItem={() => Promise.resolve(null)}
        onEquipped={() => {}}
      />
      
      <CelebrationModal
        isOpen={celebration.isOpen}
        onClose={handleCloseCelebration}
        type={celebration.type}
        streakCount={data.profile.currentStreak}
        coinsAwarded={celebration.coinsAwarded}
        badgeEmoji={celebration.badgeEmoji}
        badgeDays={celebration.badgeDays}
      />

      <NeighborVisitModal
        isOpen={isNeighborVisitOpen}
        onClose={() => setIsNeighborVisitOpen(false)}
        myFriendCode={data.profile.id}
        myTasks={data.tasks}
        onVisitStarted={() => router.refresh()}
      />

      {/* Room switcher / house explorer */}
      {/* Mobile slide-over sidebar */}
      <MobileSidebar
        open={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        activeTab={activeTab}
        onHome={() => { playSwoosh(); setIsMobilePanelOpen(false); setIsMobileSidebarOpen(false); }}
        onTasks={() => { playSwoosh(); setActiveTab("tasks"); setIsMobilePanelOpen(true); setIsMobileSidebarOpen(false); }}
        onShop={() => { playSwoosh(); setIsShopOpen(true); setIsMobileSidebarOpen(false); }}
        onAnalytics={() => { playSwoosh(); router.push(`/${locale}/analytics`); setIsMobileSidebarOpen(false); }}
        onSettings={() => { playSwoosh(); setIsSettingsOpen(true); setIsMobileSidebarOpen(false); }}
        onNeighbor={() => { playSwoosh(); setIsNeighborVisitOpen(true); setIsMobileSidebarOpen(false); }}
      />
    </main>
  );
}
