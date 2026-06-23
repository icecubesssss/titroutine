"use client";

import React, { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { Flame, Star, Gift } from "lucide-react";
import { DuoButton } from "@/components/ui/DuoButton";

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "streak" | "checkin" | "habit";
  streakCount?: number;
  coinsAwarded?: number;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  isOpen,
  onClose,
  type,
  streakCount = 0,
  coinsAwarded = 0,
}) => {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowContent(true);
      // Fire confetti when modal opens
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#FFD700", "#FF8C00", "#FF4500", "#32CD32", "#1E90FF"]
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#FFD700", "#FF8C00", "#FF4500", "#32CD32", "#1E90FF"]
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    } else {
      setShowContent(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className={`w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden border-b-8 border-gray-200 transform transition-all duration-500 delay-100 ${
          showContent ? "translate-y-0 opacity-100 scale-100" : "translate-y-8 opacity-0 scale-95"
        }`}
      >
        {/* Header Ribbon */}
        <div className={`pt-8 pb-6 px-6 flex flex-col items-center justify-center text-white ${
          type === 'streak' ? 'bg-gradient-to-b from-orange-400 to-red-500' :
          type === 'checkin' ? 'bg-gradient-to-b from-blue-400 to-indigo-500' :
          'bg-gradient-to-b from-green-400 to-emerald-500'
        }`}>
          <div className="relative mb-4">
            {/* Pulsing background ring */}
            <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
            
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-inner relative z-10">
              {type === "streak" && <Flame className="w-12 h-12 text-orange-500 animate-pulse" />}
              {type === "checkin" && <Gift className="w-12 h-12 text-blue-500 animate-bounce" />}
              {type === "habit" && <Star className="w-12 h-12 text-green-500" />}
            </div>
          </div>
          
          <h2 className="text-3xl font-black text-center drop-shadow-md tracking-tight uppercase">
            {type === "streak" && "Tuyệt Vời!"}
            {type === "checkin" && "Điểm Danh!"}
            {type === "habit" && "Hoàn Thành!"}
          </h2>
        </div>

        {/* Content Body */}
        <div className="p-8 flex flex-col items-center text-center space-y-6">
          <div className="space-y-2">
            {type === "streak" && (
              <>
                <p className="text-xl font-bold text-gray-700">Bạn đã đạt chuỗi</p>
                <div className="text-6xl font-black text-orange-500 flex items-center justify-center gap-2">
                  {streakCount} <span className="text-2xl text-gray-400 font-bold uppercase">Ngày</span>
                </div>
              </>
            )}
            {type === "checkin" && (
              <p className="text-xl font-bold text-gray-700">Chào buổi sáng, nhận quà nào!</p>
            )}
            {type === "habit" && (
              <p className="text-xl font-bold text-gray-700">Bạn đang làm rất tốt!</p>
            )}
          </div>

          {coinsAwarded > 0 && (
            <div className="bg-yellow-50 text-yellow-600 px-6 py-3 rounded-2xl font-bold text-2xl flex items-center gap-3 border-2 border-yellow-200">
              <span>💰</span> +{coinsAwarded} Xu
            </div>
          )}

          <div className="w-full pt-4">
            <DuoButton
              variant="primary"
              size="lg"
              className="w-full text-xl"
              onClick={onClose}
            >
              Tiếp tục
            </DuoButton>
          </div>
        </div>
      </div>
    </div>
  );
};
