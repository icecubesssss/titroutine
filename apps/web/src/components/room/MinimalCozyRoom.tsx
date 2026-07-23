"use client";

import React from "react";
import { clsx } from "clsx";

interface MinimalCozyRoomProps {
  children?: React.ReactNode;
  className?: string;
}

export const MinimalCozyRoom: React.FC<MinimalCozyRoomProps> = ({ children, className }) => {
  return (
    <div
      className={clsx(
        "relative w-full h-full min-h-[380px] flex flex-col justify-between overflow-hidden select-none bg-[#FBF6EA] transition-colors duration-500",
        className
      )}
    >
      {/* Wall & Ceiling Background Area */}
      <div className="absolute inset-0 z-0 flex flex-col justify-between pointer-events-none">
        {/* Wall (Top 70%) */}
        <div className="w-full h-[72%] bg-gradient-to-b from-[#FFFDF9] via-[#FAF6ED] to-[#F5ECE0] relative">
          {/* Subtle Wall Trim / Molding */}
          <div className="w-full h-2 border-b border-amber-900/10 bg-amber-900/5" />

          {/* Simple Minimalist Window (Left) */}
          <div className="absolute top-8 left-6 w-24 h-32 border-4 border-[#8C7A6B]/30 rounded-t-full bg-sky-100/40 backdrop-blur-xs overflow-hidden flex flex-col justify-between p-1">
            <div className="w-full h-1/2 border-b-2 border-[#8C7A6B]/20" />
            {/* Curtain accents */}
            <div className="absolute top-0 left-0 w-3 h-full bg-[#A3B899]/30 rounded-r-lg" />
            <div className="absolute top-0 right-0 w-3 h-full bg-[#A3B899]/30 rounded-l-lg" />
          </div>

          {/* Simple Minimalist Shelf / Wall Frames (Right) */}
          <div className="absolute top-10 right-8 flex flex-col items-end gap-3 opacity-60">
            <div className="w-20 h-1 border-b-4 border-[#8C7A6B]/40 rounded-full" />
            <div className="w-12 h-14 border-2 border-[#8C7A6B]/30 rounded-lg bg-amber-50/50" />
          </div>
        </div>

        {/* Floor Skirting Line */}
        <div className="w-full h-2 bg-[#D1C3B2]/40 border-t border-[#B8A793]/30" />

        {/* Wooden Floor Area (Bottom 28%) */}
        <div className="w-full h-[28%] bg-[#EFE5D5] relative flex items-center justify-center overflow-hidden">
          {/* Floor Planks (Minimal lines) */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px)] bg-[size:40px_100%]" />

          {/* Large Oval Rug in Center (Study Bunny Style Carpet) */}
          <div className="w-64 sm:w-72 h-20 rounded-[100%] bg-[#D4E4D3]/70 border-2 border-[#B8D1B7]/60 shadow-inner flex items-center justify-center relative">
            <div className="w-[92%] h-[84%] rounded-[100%] border border-dashed border-[#A8C7A6]/50" />
          </div>
        </div>
      </div>

      {/* Children Layer (HUD & Character) */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between">
        {children}
      </div>
    </div>
  );
};
