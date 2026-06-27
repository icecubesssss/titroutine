"use client";

import React, { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { useTranslations } from "next-intl";
import { Flame, Star, Gift, Sparkles } from "lucide-react";
import { DuoButton } from "@/components/ui/DuoButton";

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "streak" | "checkin" | "habit" | "evolution";
  streakCount?: number;
  coinsAwarded?: number;
  /** Display name of the new stage, for the "evolution" celebration. */
  evolutionStageName?: string;
}

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  isOpen,
  onClose,
  type,
  streakCount = 0,
  coinsAwarded = 0,
  evolutionStageName,
}) => {
  const t = useTranslations("Celebration");
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
          type === 'evolution' ? 'bg-gradient-to-b from-fuchsia-500 to-purple-600' :
          'bg-gradient-to-b from-green-400 to-emerald-500'
        }`}>
          <div className="relative mb-4">
            {/* Pulsing background ring */}
            <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>

            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-inner relative z-10">
              {type === "streak" && <Flame className="w-12 h-12 text-orange-500 animate-pulse" />}
              {type === "checkin" && <Gift className="w-12 h-12 text-blue-500 animate-bounce" />}
              {type === "habit" && <Star className="w-12 h-12 text-green-500" />}
              {type === "evolution" && <Sparkles className="w-12 h-12 text-fuchsia-500 animate-pulse" />}
            </div>
          </div>

          <h2 className="text-3xl font-black text-center drop-shadow-md tracking-tight uppercase">
            {type === "streak" && t("streakTitle")}
            {type === "checkin" && t("checkinTitle")}
            {type === "habit" && t("habitTitle")}
            {type === "evolution" && t("evolutionTitle")}
          </h2>
        </div>

        {/* Content Body */}
        <div className="p-8 flex flex-col items-center text-center space-y-6">
          <div className="space-y-2">
            {type === "streak" && (
              <>
                <p className="text-xl font-bold text-gray-700">{t("streakBody")}</p>
                <div className="text-6xl font-black text-orange-500 flex items-center justify-center gap-2">
                  {streakCount} <span className="text-2xl text-gray-400 font-bold uppercase">{t("days")}</span>
                </div>
              </>
            )}
            {type === "checkin" && (
              <p className="text-xl font-bold text-gray-700">{t("checkinBody")}</p>
            )}
            {type === "habit" && (
              <p className="text-xl font-bold text-gray-700">{t("habitBody")}</p>
            )}
            {type === "evolution" && (
              <>
                <p className="text-xl font-bold text-gray-700">{t("evolutionBody")}</p>
                <div className="text-3xl font-black text-fuchsia-600">
                  {evolutionStageName ?? "?"}
                </div>
                <p className="text-sm font-medium text-gray-400 pt-1">
                  {t("evolutionSub")}
                </p>
              </>
            )}
          </div>

          {coinsAwarded > 0 && (
            <div className="bg-yellow-50 text-yellow-600 px-6 py-3 rounded-2xl font-bold text-2xl flex items-center gap-3 border-2 border-yellow-200">
              <span>💰</span> {t("coins", { count: coinsAwarded })}
            </div>
          )}

          <div className="w-full pt-4">
            <DuoButton
              variant="primary"
              size="lg"
              className="w-full text-xl"
              onClick={onClose}
            >
              {t("continue")}
            </DuoButton>
          </div>
        </div>
      </div>
    </div>
  );
};
