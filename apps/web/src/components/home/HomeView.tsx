"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { CheckCircle, Flame, Pencil, Settings, BookOpen, BarChart3, ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, parseISO } from "date-fns";
import confetti from "canvas-confetti";
import Image from "next/image";
import { DuoButton } from "@/components/ui/DuoButton";
import { RabbitCompanion, STAGES_CONFIG, CompanionAction, getDefaultActionByTime } from "@/components/pet/RabbitCompanion";
import { HabitModal } from "@/components/home/HabitModal";
import { SettingsModal } from "@/components/home/SettingsModal";
import { TimerModal } from "@/components/home/TimerModal";
import { MemoryAlbumModal } from "@/components/home/MemoryAlbumModal";
import { ShopModal } from "@/components/home/ShopModal";
import { CelebrationModal } from "@/components/home/CelebrationModal";
import { SHOP_ITEMS } from "@/lib/items";
import { useSound } from "@/hooks/useSound";
import { toggleHabitAction, updateTimezoneAction, claimDailyCheckinAction, buyFreezeAction, incrementCounterHabitAction } from "@/app/[locale]/actions";
import { stageFromStreak } from "@/lib/game";
import type { DashboardData, HabitWithLog } from "@/lib/types";

export function HomeView({ data }: { data: DashboardData }) {
  const t = useTranslations("Home");
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

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitWithLog | null>(null);
  const [timerHabit, setTimerHabit] = useState<HabitWithLog | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAlbumOpen, setIsAlbumOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [companionOverrideAction, setCompanionOverrideAction] = useState<CompanionAction | null>(null);

  // Dev-only overrides (from the Settings → Developer Tools panel) for previewing
  // pet stages / streaks before the higher-stage art lands.
  const [devStageOverride, setDevStageOverride] = useState<number | null>(null);
  const [devStreakOverride, setDevStreakOverride] = useState<number | null>(null);

  const [celebration, setCelebration] = useState<{
    isOpen: boolean;
    type: "streak" | "checkin" | "habit";
    streakCount?: number;
    coinsAwarded?: number;
    habitTitle?: string;
  }>({ isOpen: false, type: "streak" });

  const [hasClaimedCheckinUI, setHasClaimedCheckinUI] = useState(false);

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

  // Xử lý action tự động nhả về trạng thái mặc định sau vài giây
  useEffect(() => {
    if (companionOverrideAction === "welcome" || companionOverrideAction === "happy" || companionOverrideAction === "sad") {
      const timer = setTimeout(() => {
        setCompanionOverrideAction(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [companionOverrideAction]);

  // Welcome back effect
  useEffect(() => {
    setCompanionOverrideAction("welcome");
  }, []);

  // Re-sync whenever the server sends fresh data (after router.refresh()).
  useEffect(() => {
    setHabits(data.habits);
    setCoins(data.profile.coins);
  }, [data]);

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

  const currentStreak = devStreakOverride !== null ? devStreakOverride : data.profile.currentStreak;
  const normalStage = stageFromStreak(currentStreak);
  const currentStage = devStageOverride !== null ? devStageOverride : normalStage;

  const activeStage = STAGES_CONFIG[currentStage] || STAGES_CONFIG[0];
  
  // Custom Room Theme (nếu có trang bị Wallpaper, nó ghi đè roomBackground mặc định)
  const equippedWallpaperId = data.inventory.equippedItems["wallpaper"];
  const customWallpaper = SHOP_ITEMS.find((item) => item.id === equippedWallpaperId);
  const roomBackground = customWallpaper ? customWallpaper.className : activeStage.roomBackground;

  // Custom Rug
  const equippedRugId = data.inventory.equippedItems["rug"];
  const customRug = SHOP_ITEMS.find((item) => item.id === equippedRugId);

  const isEvolved = currentStage >= 1;

  // Determine current companion action
  let currentAction: CompanionAction = companionOverrideAction || getDefaultActionByTime();
  if (timerHabit) {
    currentAction = "study"; // Đang bật timer thì bắt học
  } else if (totalCount > 0 && completedCount === totalCount && !companionOverrideAction) {
    currentAction = "happy"; // Hoàn thành hết task trong ngày thì vui
  }

  return (
    <main className="flex min-h-screen flex-col bg-earth-bg text-earth-text max-w-md mx-auto shadow-2xl overflow-hidden relative">
      {/* Top half: Pet Room */}
      <section
        className={`relative flex-1 flex flex-col items-center justify-center border-b-4 border-earth-brown/20 p-6 min-h-[40vh] transition-colors duration-1000 ${roomBackground}`}
      >
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20">
          <div className="bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 font-bold shadow-sm cursor-pointer group relative">
            <Flame className="w-5 h-5 text-fire-orange" />
            <span className="text-fire-orange">
              {t("streakDays", { count: currentStreak })}
            </span>
            {data.profile.streakFreezes > 0 && (
              <span className="ml-1 flex items-center text-blue-500 text-sm bg-blue-100 px-1.5 rounded" title="Thẻ đóng băng chuỗi">
                ❄️ {data.profile.streakFreezes}
              </span>
            )}
            {/* Tooltip mua thẻ */}
            <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <p className="text-xs text-gray-500 mb-2">Thẻ đóng băng giúp giữ chuỗi khi quên điểm danh (Giá: 50 Xu).</p>
              <button 
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
                Mua thẻ (❄️)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 font-bold shadow-sm">
              <span className="text-yellow-500">💰 {coins}</span>
            </div>

            {/* Sổ tay kỷ niệm (Memory Album) */}
            <button
              aria-label="Sổ tay kỷ niệm"
              title="Sổ tay kỷ niệm"
              onClick={() => {
                playSwoosh();
                setIsAlbumOpen(true);
              }}
              className="bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-sm hover:bg-gray-100 transition-colors text-purple-500 hover:text-purple-600 animate-pulse"
            >
              <BookOpen className="w-5 h-5" />
            </button>

            {/* Cửa hàng (Shop) */}
            <button
              aria-label="Cửa hàng"
              title="Cửa hàng"
              onClick={() => {
                playSwoosh();
                setIsShopOpen(true);
              }}
              className="bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-sm hover:bg-gray-100 transition-colors text-amber-500 hover:text-amber-600"
            >
              <ShoppingBag className="w-5 h-5" />
            </button>

            {/* Thống kê (Analytics) */}
            <button
              aria-label="Thống kê"
              title="Thống kê"
              onClick={() => {
                playSwoosh();
                router.push(`/${locale}/analytics`);
              }}
              className="bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-sm hover:bg-gray-100 transition-colors text-blue-500 hover:text-blue-600"
            >
              <BarChart3 className="w-5 h-5" />
            </button>

            <button
              aria-label={t("settings")}
              title={t("settings")}
              onClick={() => setIsSettingsOpen(true)}
              className="bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-sm hover:bg-gray-100 transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div
          className="relative mt-12 drop-shadow-2xl z-10 transition-transform hover:scale-110 cursor-pointer"
          onClick={() => {
            playSwoosh();
            setCompanionOverrideAction("happy"); // Bấm vào thỏ thì nó vui
          }}
        >
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

          <RabbitCompanion
            key={`stage-${currentStage}-${currentAction}-${data.inventory.equippedItems["outfit"]}`}
            stage={currentStage}
            action={currentAction}
            equippedOutfit={data.inventory.equippedItems["outfit"]}
            className="drop-shadow-lg"
          />

          {isEvolved && (
            <div className="absolute -top-6 -right-6 animate-bounce">
              <span className="text-4xl">✨</span>
            </div>
          )}
        </div>
      </section>

      {/* Bottom half: Habits */}
      <section className="flex-[1.2] bg-earth-bg p-6 pb-24 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <button
              aria-label="Ngày trước"
              title="Ngày trước"
              onClick={() => router.push(`/${locale}?date=${format(addDays(parseISO(data.currentDate), -1), "yyyy-MM-dd")}`)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-gray-400" />
            </button>
            <h2 className="text-2xl font-black tracking-tight min-w-[120px] text-center">
              {data.isToday ? t("title") : format(parseISO(data.currentDate), "dd/MM/yyyy")}
            </h2>
            <button
              aria-label="Ngày tiếp theo"
              title="Ngày tiếp theo"
              disabled={data.isToday}
              onClick={() => router.push(`/${locale}?date=${format(addDays(parseISO(data.currentDate), 1), "yyyy-MM-dd")}`)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <ChevronRight className="w-6 h-6 text-gray-400" />
            </button>
          </div>
          <span className="text-sm font-bold text-gray-500 shrink-0">
            {t("completed", { completed: completedCount, total: totalCount })}
          </span>
        </div>

        {totalCount === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 py-12 text-center text-gray-400">
            <span className="text-4xl">🌱</span>
            <p className="font-medium">{t("empty")}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {[
              { id: "morning", label: "🌅 Buổi Sáng", items: habits.filter(h => h.timeOfDay === "morning") },
              { id: "afternoon", label: "☀️ Buổi Chiều", items: habits.filter(h => h.timeOfDay === "afternoon") },
              { id: "evening", label: "🌙 Buổi Tối", items: habits.filter(h => h.timeOfDay === "evening") },
              { id: "anytime", label: "♾️ Bất kỳ lúc nào", items: habits.filter(h => !h.timeOfDay || h.timeOfDay === "anytime") }
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
                      className={`bg-white p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${
                        habit.isCompleted
                          ? "border-gray-100 opacity-60"
                          : habit.type === "negative"
                          ? "border-red-200 border-b-4 bg-red-50"
                          : "border-gray-200 border-b-4"
                      }`}
                    >
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
                              ? `Mục tiêu: ${habit.config.target_count}`
                              : habit.type === "negative"
                              ? "Cấm vi phạm"
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
                          Vi phạm
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
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="absolute bottom-6 right-6 z-20">
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
      />

      <MemoryAlbumModal
        isOpen={isAlbumOpen}
        onClose={() => setIsAlbumOpen(false)}
        currentStreak={currentStreak}
      />
      
      <ShopModal
        isOpen={isShopOpen}
        onClose={() => setIsShopOpen(false)}
        coins={coins}
        unlockedItems={data.inventory.unlockedItems}
        equippedItems={data.inventory.equippedItems}
      />
      
      <CelebrationModal
        isOpen={celebration.isOpen}
        onClose={handleCloseCelebration}
        type={celebration.type}
        streakCount={currentStreak}
        coinsAwarded={celebration.coinsAwarded}
      />
    </main>
  );
}
