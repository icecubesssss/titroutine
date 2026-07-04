"use client";

import React, { useState, useEffect, useRef } from "react";
import { Compass, Play } from "lucide-react";
import { RabbitCompanion } from "../pet/RabbitCompanion";

interface AdventureViewProps {
  adventureEnergy: number;
  adventureStatus: "idle" | "adventuring" | "returned";
  adventureStartAt: string | null;
  currentStage: number;
  currentStreak: number;
  equippedOutfit?: string;
  onStartAdventure: () => void;
  onOpenStory: () => void;
}

export const AdventureView: React.FC<AdventureViewProps> = ({
  adventureEnergy,
  adventureStatus,
  adventureStartAt,
  currentStage,
  currentStreak: _currentStreak,
  equippedOutfit,
  onStartAdventure,
  onOpenStory,
}) => {
  void _currentStreak;
  const [progress, setProgress] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(30);

  const energyRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Cập nhật độ dài thanh năng lượng imperatively để tránh cảnh báo CSS inline
  useEffect(() => {
    if (adventureStatus === "idle" && energyRef.current) {
      energyRef.current.style.width = `${(adventureEnergy / 30) * 100}%`;
    }
  }, [adventureEnergy, adventureStatus]);

  // Cập nhật độ dài tiến trình thám hiểm imperatively
  useEffect(() => {
    if (adventureStatus === "adventuring" && progressRef.current) {
      progressRef.current.style.width = `${progress}%`;
    }
  }, [progress, adventureStatus]);

  // Tính toán thời gian thám hiểm (30s cho môi trường thử nghiệm)
  useEffect(() => {
    if (adventureStatus !== "adventuring" || !adventureStartAt) {
      setProgress(0);
      return;
    }

    const calculateProgress = () => {
      const startMs = new Date(adventureStartAt).getTime();
      const elapsed = (Date.now() - startMs) / 1000;
      const totalDuration = 30; // 30 giây thám hiểm để test

      if (elapsed >= totalDuration) {
        setProgress(100);
        setSecondsRemaining(0);
      } else {
        setProgress(Math.floor((elapsed / totalDuration) * 100));
        setSecondsRemaining(Math.ceil(totalDuration - elapsed));
      }
    };

    calculateProgress();
    const interval = setInterval(calculateProgress, 1000);
    return () => clearInterval(interval);
  }, [adventureStatus, adventureStartAt]);

  const isAdventureFinished = progress >= 100;

  return (
    <div className="w-full bg-[#fdfaf6] rounded-3xl border-4 border-[#ebdcc5] overflow-hidden shadow-md p-5 flex flex-col items-center">
      {adventureStatus === "idle" && (
        <div className="w-full text-center space-y-4 py-4 flex flex-col items-center">
          <div className="h-14 w-14 bg-orange-100 rounded-full flex items-center justify-center border-2 border-orange-400 animate-pulse">
            <Compass className="h-8 w-8 text-orange-600" />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#5c4033]">Bắt đầu thám hiểm cùng Thỏ cưng</h3>
            <p className="text-[11px] text-stone-500 mt-1 max-w-[280px]">
              Tích lũy năng lượng bằng cách hoàn thành thói quen. Khi đủ 30 năng lượng, Thỏ có thể đi thám hiểm thế giới cozy ngoài trời!
            </p>
          </div>

          {/* Energy Bar */}
          <div className="w-full max-w-[280px] bg-stone-100 rounded-full h-4 overflow-hidden border border-orange-200 relative flex items-center justify-center">
            <div
              ref={energyRef}
              className="bg-gradient-to-r from-orange-400 to-amber-400 h-full absolute left-0 top-0 transition-all duration-500"
            />
            <span className="text-[9px] font-black text-orange-950 z-10 drop-shadow-sm font-mono">
              Năng lượng: {adventureEnergy}/30
            </span>
          </div>

          <button
            type="button"
            disabled={adventureEnergy < 30}
            onClick={onStartAdventure}
            className={`px-8 py-3 rounded-2xl font-black text-xs text-white shadow-md transition-all flex items-center gap-1.5 ${
              adventureEnergy >= 30
                ? "bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 hover:shadow-lg active:scale-95 animate-bounce-slow"
                : "bg-gray-300 shadow-none cursor-not-allowed"
            }`}
          >
            <Play size={12} fill="currentColor" /> KHÁM PHÁ NGAY (CẦN 30 🔥)
          </button>
        </div>
      )}

      {adventureStatus === "adventuring" && (
        <div className="w-full flex flex-col items-center">
          {/* Status banner */}
          <div className="w-full text-center py-2 px-4 bg-orange-50 border border-orange-200 rounded-2xl mb-4">
            <span className="text-xs font-black text-orange-800 flex items-center justify-center gap-1.5">
              🌲 Bé thỏ đang đi thám hiểm tại Vườn Thông Cozy...
            </span>
            <div className="w-full bg-[#ebdcc5] rounded-full h-2.5 overflow-hidden mt-2 relative">
              <div
                ref={progressRef}
                className="bg-gradient-to-r from-orange-400 to-emerald-400 h-full transition-all duration-1000"
              />
            </div>
            <span className="text-[9px] font-mono text-stone-500 font-bold block mt-1.5">
              {isAdventureFinished ? "Thỏ đã thám hiểm xong! 🎉" : `Quay về sau: ${secondsRemaining} giây`}
            </span>
          </div>

          {/* PARALLAX OUTDOOR SCREEN CONTAINER */}
          <div className="relative w-full h-44 rounded-2xl overflow-hidden border-2 border-[#ebdcc5] bg-sky-200 shadow-inner flex flex-col justify-end">
            {/* Parallax Clouds */}
            <div className="absolute top-2 w-full h-8 overflow-hidden opacity-80 pointer-events-none">
              <div className="absolute flex gap-12 animate-cloud-drift whitespace-nowrap">
                <span className="text-lg">☁️</span>
                <span className="text-sm">☁️</span>
                <span className="text-2xl">☁️</span>
                <span className="text-lg">☁️</span>
              </div>
            </div>

            {/* Parallax Mountain Background */}
            <div className="absolute inset-0 bg-[url('/assets/ui/outdoor_bg_parallax.png')] bg-repeat-x bg-bottom bg-contain opacity-55 animate-mountain-drift pointer-events-none" />

            {/* Floor Grass Layer */}
            <div className="w-full h-12 bg-emerald-300 border-t-2 border-emerald-400 z-10 flex flex-col justify-end relative">
              <div className="absolute -top-4 w-full text-center z-20 flex justify-center">
                {/* Happy Jumping Rabbit */}
                <RabbitCompanion
                  stage={currentStage}
                  action="happy"
                  equippedOutfit={equippedOutfit}
                  className="scale-[0.8] origin-bottom transform translate-y-3"
                />
              </div>
              <div className="w-full h-2 bg-emerald-400/30 animate-grass-drift" />
            </div>
          </div>

          {/* Finish CTA button */}
          <button
            type="button"
            disabled={!isAdventureFinished}
            onClick={onOpenStory}
            className={`w-full mt-4 py-3.5 rounded-2xl font-black text-xs text-white shadow-md transition-all flex items-center justify-center gap-1.5 ${
              isAdventureFinished
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 hover:shadow-lg active:scale-95 animate-bounce-slow"
                : "bg-gray-200 text-gray-400 shadow-none cursor-not-allowed"
            }`}
          >
            🐰 THỎ ĐÃ VỀ - XEM KỶ NIỆM 🏡
          </button>
        </div>
      )}
    </div>
  );
};
