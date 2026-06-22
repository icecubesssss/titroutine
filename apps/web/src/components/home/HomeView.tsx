"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle, Flame, Pencil, Settings, BookOpen } from "lucide-react";
import confetti from "canvas-confetti";
import { DuoButton } from "@/components/ui/DuoButton";
import { VirtualPet } from "@/components/pet/VirtualPet";
import { HabitModal } from "@/components/home/HabitModal";
import { SettingsModal } from "@/components/home/SettingsModal";
import { TimerModal } from "@/components/home/TimerModal";
import { MemoryAlbumModal } from "@/components/home/MemoryAlbumModal";
import { useSound } from "@/hooks/useSound";
import { toggleHabitAction, updateTimezoneAction } from "@/app/[locale]/actions";
import type { DashboardData, HabitWithLog } from "@/lib/types";

interface StageMetadata {
  name: string;
  spriteUrl: string;
  frameWidth: number;
  frameHeight: number;
  totalFrames: number;
  fps: number;
  scale: number;
  offsetX?: number;
  offsetY?: number;
  sheetWidth?: number;
  sheetHeight?: number;
  roomBackground: string;
  idle?: boolean;
}

const STAGES_METADATA: Record<number, StageMetadata> = {
  0: {
    name: "Egg",
    spriteUrl: "/assets/egg_sprite_clean.png",
    frameWidth: 170,
    frameHeight: 186,
    totalFrames: 6,
    fps: 6,
    scale: 0.8,
    roomBackground: "bg-gradient-to-b from-amber-100 via-orange-100 to-amber-200",
    idle: false,
  },
  1: {
    name: "Baby Rabbit",
    spriteUrl: "/assets/baby_rabbit_sprite_clean.png",
    sheetWidth: 1024,
    sheetHeight: 468,
    offsetX: 313,
    offsetY: 316,
    frameWidth: 188,
    frameHeight: 152,
    totalFrames: 1,
    fps: 1,
    scale: 1.1,
    roomBackground: "bg-gradient-to-b from-blue-200 via-green-100 to-green-300",
    idle: true,
  },
  2: {
    name: "Young Rabbit",
    spriteUrl: "/assets/young_rabbit_sprite_clean.png",
    frameWidth: 236,
    frameHeight: 345,
    totalFrames: 8,
    fps: 8,
    scale: 0.5,
    roomBackground: "bg-gradient-to-b from-emerald-100 via-teal-50 to-emerald-200",
    idle: true,
  },
  3: {
    name: "Spirit Rabbit",
    spriteUrl: "/assets/spirit_rabbit_sprite_clean.png",
    frameWidth: 245,
    frameHeight: 474,
    totalFrames: 8,
    fps: 8,
    scale: 0.4,
    roomBackground: "bg-gradient-to-b from-indigo-900 via-purple-900 to-indigo-950 text-white",
    idle: true,
  },
  4: {
    name: "Bunny Girl Child",
    spriteUrl: "/assets/bunny_child_sprite_clean.png",
    frameWidth: 232,
    frameHeight: 399,
    totalFrames: 8,
    fps: 8,
    scale: 0.5,
    roomBackground: "bg-gradient-to-b from-rose-100 via-pink-50 to-rose-200",
    idle: true,
  },
  5: {
    name: "Teen Bunny Girl",
    spriteUrl: "/assets/bunny_teen_sprite_clean.png",
    frameWidth: 222,
    frameHeight: 385,
    totalFrames: 8,
    fps: 8,
    scale: 0.5,
    roomBackground: "bg-gradient-to-b from-blue-100 via-indigo-50 to-blue-200",
    idle: true,
  },
  6: {
    name: "Young Woman",
    spriteUrl: "/assets/bunny_woman_sprite_clean.png",
    frameWidth: 299,
    frameHeight: 516,
    totalFrames: 6,
    fps: 6,
    scale: 0.4,
    roomBackground: "bg-gradient-to-b from-amber-50 via-stone-100 to-amber-100",
    idle: true,
  },
};

function getStageFromStreak(streak: number): number {
  if (streak < 3) return 0;
  if (streak < 7) return 1;
  if (streak < 15) return 2;
  if (streak < 30) return 3;
  if (streak < 60) return 4;
  if (streak < 100) return 5;
  return 6;
}

export function HomeView({ data }: { data: DashboardData }) {
  const t = useTranslations("Home");
  const router = useRouter();
  const { playTing, playSwoosh } = useSound();

  // Server data is the source of truth; mirror it locally for optimistic UI.
  const [habits, setHabits] = useState(data.habits);
  const [coins, setCoins] = useState(data.profile.coins);
  const [, startTransition] = useTransition();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<HabitWithLog | null>(null);
  const [timerHabit, setTimerHabit] = useState<HabitWithLog | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAlbumOpen, setIsAlbumOpen] = useState(false);
  // Dev-only overrides (from the Settings → Developer Tools panel) for previewing
  // pet stages / streaks before the higher-stage art lands.
  const [devStageOverride, setDevStageOverride] = useState<number | null>(null);
  const [devStreakOverride, setDevStreakOverride] = useState<number | null>(null);

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
    const willComplete = !habit.isCompleted;

    // Optimistic update.
    setHabits((prev) =>
      prev.map((h) => (h.id === habit.id ? { ...h, isCompleted: willComplete, value: value ?? null } : h))
    );
    setCoins((c) => Math.max(0, c + (willComplete ? 10 : -10)));
    if (willComplete) playTing();

    startTransition(async () => {
      await toggleHabitAction({ habitId: habit.id, value });
      router.refresh();
    });
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
  const normalStage = getStageFromStreak(currentStreak);
  const currentStage = devStageOverride !== null ? devStageOverride : normalStage;

  const activeStage = STAGES_METADATA[currentStage] || STAGES_METADATA[0];
  const roomBackground = activeStage.roomBackground;
  const isEvolved = currentStage >= 1;

  return (
    <main className="flex min-h-screen flex-col bg-earth-bg text-earth-text max-w-md mx-auto shadow-2xl overflow-hidden relative">
      {/* Top half: Pet Room */}
      <section
        className={`relative flex-1 flex flex-col items-center justify-center border-b-4 border-earth-brown/20 p-6 min-h-[40vh] transition-colors duration-1000 ${roomBackground}`}
      >
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20">
          <div className="bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 font-bold shadow-sm">
            <Flame className="w-5 h-5 text-fire-orange" />
            <span className="text-fire-orange">
              {t("streakDays", { count: currentStreak })}
            </span>
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
          onClick={playSwoosh}
        >
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-black/20 rounded-[100%] blur-[4px]"></div>

          <VirtualPet
            key={`stage-${currentStage}`}
            spriteUrl={activeStage.spriteUrl}
            sheetWidth={activeStage.sheetWidth}
            sheetHeight={activeStage.sheetHeight}
            offsetX={activeStage.offsetX}
            offsetY={activeStage.offsetY}
            frameWidth={activeStage.frameWidth}
            frameHeight={activeStage.frameHeight}
            totalFrames={activeStage.totalFrames}
            fps={activeStage.fps}
            scale={activeStage.scale}
            idle={activeStage.idle}
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
          <h2 className="text-2xl font-black tracking-tight">{t("title")}</h2>
          <span className="text-sm font-bold text-gray-500">
            {t("completed", { completed: completedCount, total: totalCount })}
          </span>
        </div>

        {totalCount === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 py-12 text-center text-gray-400">
            <span className="text-4xl">🌱</span>
            <p className="font-medium">{t("empty")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {habits.map((habit) => (
              <div
                key={habit.id}
                className={`bg-white p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${
                  habit.isCompleted
                    ? "border-gray-100 opacity-60"
                    : "border-gray-200 border-b-4"
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <button
                    type="button"
                    aria-label={t("edit")}
                    title={t("edit")}
                    onClick={() => setEditingHabit(habit)}
                    className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-2xl shrink-0 hover:bg-blue-200 transition-colors group relative"
                  >
                    <span className="group-hover:opacity-0 transition-opacity">
                      {habit.type === "timer" ? "⏳" : "💧"}
                    </span>
                    <Pencil className="w-5 h-5 text-blue-500 absolute opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <div className="min-w-0">
                    <h3
                      className={`font-bold truncate ${
                        habit.isCompleted ? "line-through text-gray-400" : "text-earth-text"
                      }`}
                    >
                      {habit.title}
                    </h3>
                    <p className="text-sm text-gray-400 font-medium">
                      {habit.type === "timer" && habit.config.target_time
                        ? t("minutes", { count: Math.round(habit.config.target_time / 60) })
                        : t("daily")}
                    </p>
                  </div>
                </div>

                {habit.isCompleted ? (
                  <button
                    type="button"
                    aria-label={t("undo")}
                    title={t("undo")}
                    onClick={() => commitToggle(habit)}
                    className="shrink-0"
                  >
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </button>
                ) : (
                  <DuoButton
                    variant="primary"
                    size="sm"
                    className="shrink-0"
                    onClick={() => handleDoIt(habit)}
                  >
                    {t("doIt")}
                  </DuoButton>
                )}
              </div>
            ))}
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
    </main>
  );
}
