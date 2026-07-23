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
        "relative w-full h-full min-h-[420px] flex flex-col justify-between overflow-hidden select-none bg-cover bg-center transition-all duration-500",
        className
      )}
      style={{ backgroundImage: `url('${bgImageUrl}')` }}
    >
      {/* Soft Lighting Overlay for Cozy Atmosphere */}
      <div className="absolute inset-0 bg-amber-900/5 pointer-events-none z-0" />

      {/* Children Layer (HUD, Dropdown Menu, Character) */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between">
        {children}
      </div>
    </div>
  );
};
