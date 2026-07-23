"use client";

import React, { useEffect, useState } from "react";
import { clsx } from "clsx";

export interface PandaGirlCompanionProps {
  action?: "idle" | "working" | "study" | "happy" | "sad" | "eating" | string;
  scale?: number;
  className?: string;
  flipX?: boolean;
  fps?: number;
}

const FRAME_WIDTH = 563.2;
const FRAME_HEIGHT = 768;
const SHEET_WIDTH = 2816;
const SHEET_HEIGHT = 1536;
const COLS = 5;
const ROWS = 2;
const TOTAL_FRAMES = COLS * ROWS;

export const PandaGirlCompanion: React.FC<PandaGirlCompanionProps> = ({
  action = "idle",
  scale = 0.25,
  className,
  flipX = false,
  fps = 6,
}) => {
  const [currentFrame, setCurrentFrame] = useState(0);

  // Switch sprite sheet based on current action
  const isWorking = action === "working" || action === "study";
  const spriteUrl = isWorking
    ? "/assets/workingwithtask.png"
    : "/assets/pandagirlidle.png";

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % TOTAL_FRAMES);
    }, 1000 / fps);

    return () => clearInterval(intervalId);
  }, [fps]);

  const col = currentFrame % COLS;
  const row = Math.floor(currentFrame / COLS);

  const scaledWidth = Math.round(FRAME_WIDTH * scale);
  const scaledHeight = Math.round(FRAME_HEIGHT * scale);
  const scaledSheetWidth = Math.round(SHEET_WIDTH * scale);
  const scaledSheetHeight = Math.round(SHEET_HEIGHT * scale);

  const posX = -Math.round(col * FRAME_WIDTH * scale);
  const posY = -Math.round(row * FRAME_HEIGHT * scale);

  return (
    <div
      className={clsx(
        "relative flex items-center justify-center transition-transform duration-300 select-none",
        flipX && "-scale-x-100",
        className
      )}
      style={{
        width: `${scaledWidth}px`,
        height: `${scaledHeight}px`,
      }}
    >
      <div
        className="w-full h-full bg-no-repeat"
        style={{
          backgroundImage: `url('${spriteUrl}')`,
          backgroundPosition: `${posX}px ${posY}px`,
          backgroundSize: `${scaledSheetWidth}px ${scaledSheetHeight}px`,
          imageRendering: "crisp-edges",
        }}
      />
    </div>
  );
};
