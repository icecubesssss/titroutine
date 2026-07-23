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
        "relative w-full h-full min-h-[420px] flex flex-col justify-between overflow-hidden select-none bg-[#FDF9F0] transition-colors duration-500",
        className
      )}
    >
      {/* 2D Flat Front-View Room Background */}
      <div className="absolute inset-0 z-0 flex flex-col justify-between pointer-events-none">
        {/* Flat Back Wall (Top 68%) */}
        <div className="w-full h-[68%] bg-gradient-to-b from-[#FFFDF9] via-[#FAF5ED] to-[#F5EAD9] relative flex flex-col items-center">
          {/* Subtle Ceiling Trim */}
          <div className="w-full h-2 border-b border-[#D8C7B0]/40 bg-[#EFE4D3]/20" />

          {/* Centered 2D Flat Window */}
          <div className="relative mt-4 w-36 h-40 border-4 border-[#8C7A6B]/40 rounded-t-xl bg-slate-900 overflow-hidden shadow-inner flex flex-col justify-between">
            {/* Night Sky / Moon Inside Window */}
            <div className="relative w-full h-full bg-gradient-to-b from-[#0F172A] to-[#1E293B] flex items-center justify-center">
              {/* Crescent Moon & Stars */}
              <div className="absolute top-3 left-4 w-4 h-4 rounded-full bg-amber-200/90 shadow-[0_0_8px_rgba(254,240,138,0.6)]" />
              <div className="absolute top-6 right-6 w-1 h-1 rounded-full bg-white opacity-80" />
              <div className="absolute top-12 left-10 w-1 h-1 rounded-full bg-white opacity-60" />
              <div className="absolute top-10 right-10 w-1.5 h-1.5 rounded-full bg-amber-100 opacity-90 animate-pulse" />
            </div>

            {/* Window Frame Windowpane Dividers */}
            <div className="absolute inset-0 border-r-2 border-b-2 border-[#8C7A6B]/30 pointer-events-none" />
            <div className="absolute inset-0 border-l-2 border-t-2 border-[#8C7A6B]/30 pointer-events-none" />

            {/* Soft Green Curtains */}
            <div className="absolute top-0 left-0 w-4 h-full bg-[#A3B899]/40 border-r border-[#8A9F80]/40 rounded-r-md" />
            <div className="absolute top-0 right-0 w-4 h-full bg-[#A3B899]/40 border-l border-[#8A9F80]/40 rounded-l-md" />
          </div>

          {/* Wall Posters / Hanging Shelf */}
          <div className="absolute top-8 left-8 w-10 h-14 border-2 border-[#8C7A6B]/30 rounded bg-amber-50/70 p-1 shadow-xs flex flex-col items-center justify-center">
            <span className="text-xs opacity-70">🌸</span>
          </div>

          <div className="absolute top-8 right-8 w-12 h-1 border-b-2 border-[#8C7A6B]/40 rounded-full" />
        </div>

        {/* Skirting Board / Floor Trim Line */}
        <div className="w-full h-3 bg-[#D8C7B0] border-t-2 border-b border-[#C4B29B] shadow-xs" />

        {/* 2D Flat Horizontal Wooden Floor (Bottom 32%) */}
        <div className="w-full h-[32%] bg-[#EFE4D3] relative flex items-center justify-center overflow-hidden">
          {/* Wood Floor Lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0000000a_1px,transparent_1px)] bg-[size:48px_100%]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:100%_16px]" />

          {/* Flat Oval Green Rug (Center Floor) */}
          <div className="w-64 sm:w-80 h-24 rounded-[100%] bg-[#D4E4D3] border-2 border-[#B3CCA9] shadow-inner flex items-center justify-center relative mt-2">
            <div className="w-[90%] h-[80%] rounded-[100%] border border-dashed border-[#A0BD96]" />
          </div>
        </div>
      </div>

      {/* Children Layer (HUD, Dropdown Menu, Character) */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between">
        {children}
      </div>
    </div>
  );
};
