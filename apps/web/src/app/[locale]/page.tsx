"use client";

import { useState, useEffect } from "react";
import { DuoButton } from "@/components/ui/DuoButton";
import { CheckCircle, Flame, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { VirtualPet } from "@/components/pet/VirtualPet";
import { useHabitStore } from "@/store/useHabitStore";
import { useSound } from "@/hooks/useSound";
import { AddHabitModal } from "@/components/home/AddHabitModal";
import { SettingsModal } from "@/components/home/SettingsModal";
import confetti from "canvas-confetti";

export default function Home() {
  const t = useTranslations("Home");
  const { habits, coins, currentStreak, completeHabit } = useHabitStore();
  const { playTing, playSwoosh } = useSound();
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const completedCount = habits.filter((h) => h.isCompleted).length;
  const totalCount = habits.length;

  useEffect(() => {
    // Confetti when all habits are completed
    if (totalCount > 0 && completedCount === totalCount) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.4 },
        colors: ["#FF3B30", "#FF9500", "#FFCC00", "#4CD964", "#5AC8FA", "#007AFF"]
      });
    }
  }, [completedCount, totalCount]);

  const handleComplete = (id: string) => {
    playTing();
    completeHabit(id);
  };

  const handleOpenAddModal = () => {
    playSwoosh();
    setIsAddModalOpen(true);
  };

  // EVOLUTION LOGIC: If coins >= 170, the egg hatches into a baby rabbit!
  const isEvolved = coins >= 170;
  const petSpriteUrl = isEvolved ? "/assets/baby_rabbit_sprite_clean.png" : "/assets/egg_sprite_clean.png";
  const totalFrames = isEvolved ? 7 : 6;
  const frameWidth = isEvolved ? 146 : 170; // 1024/7 = 146, 1024/6 = 170
  const frameHeight = isEvolved ? 468 : 186;
  
  // Background styling depending on evolution stage
  const roomBackground = isEvolved 
    ? "bg-gradient-to-b from-blue-300 via-green-200 to-green-400" // Meadow for rabbit
    : "bg-gradient-to-b from-amber-100 via-orange-100 to-amber-200"; // Incubator for egg

  return (
    <main className="flex min-h-screen flex-col bg-earth-bg text-earth-text max-w-md mx-auto shadow-2xl overflow-hidden relative">
      {/* Nửa trên: Pet Room */}
      <section className={`relative flex-1 flex flex-col items-center justify-center border-b-4 border-earth-brown/20 p-6 min-h-[40vh] transition-colors duration-1000 ${roomBackground}`}>
        
        {/* Top bar */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20">
          <div className="bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 font-bold shadow-sm">
            <Flame className="w-5 h-5 text-fire-orange" />
            <span className="text-fire-orange">{currentStreak} Days</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 font-bold shadow-sm">
              <span className="text-yellow-500">💰 {coins}</span>
            </div>
            
            <button 
              aria-label="Settings"
              title="Settings"
              onClick={() => setIsSettingsModalOpen(true)}
              className="bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-sm hover:bg-gray-100 transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Pet Component */}
        <div className="relative mt-12 drop-shadow-2xl z-10 transition-transform hover:scale-110 cursor-pointer" onClick={playSwoosh}>
          {/* Base shadow/nest under the pet */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-black/20 rounded-[100%] blur-[4px]"></div>
          
          <VirtualPet
            key={petSpriteUrl} // Force re-mount on evolution
            spriteUrl={petSpriteUrl}
            frameWidth={frameWidth}
            frameHeight={frameHeight}
            totalFrames={totalFrames}
            fps={6}
            scale={isEvolved ? 0.7 : 0.8}
            className="drop-shadow-lg"
          />
          {/* Evolution Particle Effect Placeholder */}
          {isEvolved && (
            <div className="absolute -top-6 -right-6 animate-bounce">
              <span className="text-4xl">✨</span>
            </div>
          )}
        </div>
      </section>

      {/* Nửa dưới: Habits */}
      <section className="flex-[1.2] bg-earth-bg p-6 pb-24 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black tracking-tight">{t('title')}</h2>
          <span className="text-sm font-bold text-gray-500">{t('completed', { completed: completedCount, total: totalCount })}</span>
        </div>

        <div className="space-y-4">
          {habits.map((habit) => (
            <div
              key={habit.id}
              className={`bg-white p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${
                habit.isCompleted
                  ? "border-gray-100 opacity-60"
                  : "border-gray-200 border-b-4 active:translate-y-1 active:border-b-0 cursor-pointer"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-2xl">
                  {habit.type === "daily" ? "💧" : "⏳"}
                </div>
                <div>
                  <h3 className={`font-bold ${habit.isCompleted ? "line-through text-gray-400" : "text-earth-text"}`}>
                    {habit.title}
                  </h3>
                  <p className="text-sm text-gray-400 font-medium">
                    {habit.type === "timer" ? `${habit.duration} mins` : "Daily"}
                  </p>
                </div>
              </div>
              
              {habit.isCompleted ? (
                <CheckCircle className="w-8 h-8 text-green-500" />
              ) : (
                <DuoButton variant="primary" size="sm" onClick={() => handleComplete(habit.id)}>
                  {t('doIt')}
                </DuoButton>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Floating Action Button for adding Habit */}
      <div className="absolute bottom-6 right-6 z-20">
        <DuoButton 
          variant="primary" 
          size="lg" 
          onClick={handleOpenAddModal}
          className="rounded-full w-16 h-16 !p-0 text-3xl shadow-lg border-b-8 hover:brightness-110 active:border-b-0 active:translate-y-2">
          +
        </DuoButton>
      </div>

      {/* Modals */}
      <AddHabitModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
      <SettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </main>
  );
}
