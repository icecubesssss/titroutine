"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface CarrotPlantingProps {
  hasInProgress: boolean;
}

export const CarrotPlanting: React.FC<CarrotPlantingProps> = ({ hasInProgress }) => {
  const [growth, setGrowth] = useState(0); // 0 to 100

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (hasInProgress) {
      interval = setInterval(() => {
        setGrowth((g) => {
          if (g >= 100) return 0; // loop
          return g + 1;
        });
      }, 3000); // grows 1% every 3s
    } else {
      setGrowth(0);
    }
    return () => clearInterval(interval);
  }, [hasInProgress]);

  if (!hasInProgress) return null;

  // Choose display based on growth level
  let stageEmoji = "🌱";
  let stageText = "Vừa gieo hạt...";
  if (growth > 25 && growth <= 50) {
    stageEmoji = "🌿";
    stageText = "Đang mọc mầm...";
  } else if (growth > 50 && growth <= 75) {
    stageEmoji = "🍃";
    stageText = "Cà rốt lớn dần...";
  } else if (growth > 75) {
    stageEmoji = "🥕";
    stageText = "Sắp thu hoạch!";
  }

  return (
    <div className="bg-white/40 border border-white/20 p-4 rounded-3xl shadow-sm backdrop-blur-sm flex items-center gap-4 select-none mb-6">
      <div className="relative w-16 h-16 bg-orange-100/60 rounded-2xl flex items-center justify-center text-3xl border border-orange-200">
        <motion.span
          animate={
            hasInProgress
              ? {
                  scale: [1, 1.15, 1],
                  rotate: [0, 5, -5, 0],
                }
              : {}
          }
          transition={{ repeat: Infinity, duration: 2.5 }}
          className="select-none"
        >
          {stageEmoji}
        </motion.span>
        {/* Tiny growth progress bar under emoji */}
        <div className="absolute bottom-1 left-2 right-2 h-1 bg-amber-200/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-orange-500 rounded-full transition-all duration-1000"
            {...{ style: { width: `${growth}%` } }}
          />
        </div>
      </div>
      <div>
        <h4 className="text-xs font-black text-theme-accent uppercase tracking-wider">
          Đang Trồng Cà Rốt 🥕
        </h4>
        <p className="text-sm font-bold text-theme-text/80 mt-0.5 leading-snug">
          {stageText} ({growth}%)
        </p>
        <span className="text-[10px] text-theme-text/45 font-medium leading-none block mt-1">
          Giữ trạng thái In Progress để cà rốt phát triển!
        </span>
      </div>
    </div>
  );
};
