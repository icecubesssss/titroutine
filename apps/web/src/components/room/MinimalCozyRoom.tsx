"use client";

import React from "react";
import { clsx } from "clsx";

interface MinimalCozyRoomProps {
  children?: React.ReactNode;
  className?: string;
  bgImageUrl?: string;
}

export const MinimalCozyRoom: React.FC<MinimalCozyRoomProps> = ({
  children,
  className,
  bgImageUrl = "/assets/study_bunny_room.png",
}) => {
  return (
    <div
      className={clsx(
        "relative w-full h-full min-h-[380px] flex flex-col justify-between overflow-hidden select-none bg-[#FAF5ED] transition-all duration-500",
        className
      )}
    >
      {/* Full Panoramic Room Image Container (bg-contain fits 100% of the artwork without cropping) */}
      <div
        className="absolute inset-0 bg-contain bg-top bg-no-repeat z-0 transition-all"
        style={{ backgroundImage: `url('${bgImageUrl}')` }}
      />

      {/* Soft Cozy Lighting Overlay */}
      <div className="absolute inset-0 bg-amber-900/5 pointer-events-none z-0" />

      {/* Children Layer (HUD, Dropdown Menu, Character) */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between">
        {children}
      </div>
    </div>
  );
};

