"use client";

import React from "react";
import { VirtualPet, VirtualPetProps } from "./VirtualPet";

export type CompanionAction = "idle" | "sleep" | "happy" | "sad" | "eat" | "study" | "welcome";

export interface RabbitCompanionProps {
  stage: number;
  action: CompanionAction;
  className?: string;
}

// Giả định bạn sẽ dọn dẹp sprite sheet thành 64x64 sau, 
// nhưng hiện tại AI tạo ảnh 1024x1024 (4 cột x 5 hàng).
// => frameWidth = 1024/4 = 256. frameHeight = 1024/5 ≈ 205.
const TEMP_FRAME_WIDTH = 256;
const TEMP_FRAME_HEIGHT = 205;

interface StageConfig extends Partial<VirtualPetProps> {
  name: string;
  roomBackground: string;
  defaultScale: number;
  actions?: Record<string, { offsetY: number; totalFrames?: number; fps?: number }>;
}

export const STAGES_CONFIG: Record<number, StageConfig> = {
  0: {
    name: "Egg",
    spriteUrl: "/assets/egg_sprite_clean.png",
    frameWidth: 170,
    frameHeight: 186,
    totalFrames: 6,
    fps: 6,
    defaultScale: 0.8,
    roomBackground: "bg-gradient-to-b from-amber-100 via-orange-100 to-amber-200",
    idle: false,
  },
  1: {
    name: "Baby Rabbit",
    spriteUrl: "/assets/baby_rabbit_phase1.png",
    sheetWidth: 1024,
    sheetHeight: 1024,
    frameWidth: TEMP_FRAME_WIDTH,
    frameHeight: TEMP_FRAME_HEIGHT,
    defaultScale: 0.8,
    roomBackground: "bg-gradient-to-b from-blue-200 via-green-100 to-green-300",
    actions: {
      idle: { offsetY: 0, fps: 4, totalFrames: 4 },
      sleep: { offsetY: TEMP_FRAME_HEIGHT * 1, fps: 2, totalFrames: 4 },
      happy: { offsetY: TEMP_FRAME_HEIGHT * 2, fps: 6, totalFrames: 4 },
      sad: { offsetY: TEMP_FRAME_HEIGHT * 3, fps: 3, totalFrames: 4 },
      eat: { offsetY: TEMP_FRAME_HEIGHT * 4, fps: 5, totalFrames: 4 },
      welcome: { offsetY: TEMP_FRAME_HEIGHT * 2, fps: 6, totalFrames: 4 }, // Fallback to happy
      study: { offsetY: 0, fps: 4, totalFrames: 4 }, // Fallback to idle
    },
  },
  2: {
    name: "Young Rabbit",
    spriteUrl: "/assets/young_rabbit_sprite_clean.png",
    frameWidth: 236,
    frameHeight: 345,
    totalFrames: 8,
    fps: 8,
    defaultScale: 0.5,
    roomBackground: "bg-gradient-to-b from-emerald-100 via-teal-50 to-emerald-200",
    idle: true,
  },
  3: {
    name: "Spirit Rabbit",
    spriteUrl: "/assets/spirit_rabbit_sprite_clean.png",
    frameWidth: 245,
    frameHeight: 474,
    totalFrames: 8,
    fps: 8,
    defaultScale: 0.4,
    roomBackground: "bg-gradient-to-b from-indigo-900 via-purple-900 to-indigo-950 text-white",
    idle: true,
  },
  4: {
    name: "Bunny Girl Child",
    spriteUrl: "/assets/bunny_child_phase1.png",
    sheetWidth: 1024,
    sheetHeight: 1024,
    frameWidth: TEMP_FRAME_WIDTH,
    frameHeight: TEMP_FRAME_HEIGHT,
    defaultScale: 0.7,
    roomBackground: "bg-gradient-to-b from-rose-100 via-pink-50 to-rose-200",
    actions: {
      idle: { offsetY: 0, fps: 4, totalFrames: 4 },
      study: { offsetY: TEMP_FRAME_HEIGHT * 1, fps: 5, totalFrames: 4 },
      sleep: { offsetY: TEMP_FRAME_HEIGHT * 2, fps: 2, totalFrames: 4 },
      happy: { offsetY: TEMP_FRAME_HEIGHT * 3, fps: 6, totalFrames: 4 },
      welcome: { offsetY: TEMP_FRAME_HEIGHT * 4, fps: 6, totalFrames: 4 },
      sad: { offsetY: 0, fps: 4, totalFrames: 4 }, // Fallback to idle
      eat: { offsetY: 0, fps: 4, totalFrames: 4 }, // Fallback to idle
    },
  },
  5: {
    name: "Teen Bunny Girl",
    spriteUrl: "/assets/bunny_teen_sprite_clean.png",
    frameWidth: 222,
    frameHeight: 385,
    totalFrames: 8,
    fps: 8,
    defaultScale: 0.5,
    roomBackground: "bg-gradient-to-b from-blue-100 via-indigo-50 to-blue-200",
    idle: true,
  },
  6: {
    name: "Young Woman",
    spriteUrl: "/assets/bunny_woman_sprite_clean.png",
    frameWidth: 299,
    frameHeight: 516,
    totalFrames: 6,
    fps: 6,
    defaultScale: 0.4,
    roomBackground: "bg-gradient-to-b from-amber-50 via-stone-100 to-amber-100",
    idle: true,
  },
};

/**
 * Xử lý logic logic mốc thời gian để quyết định hành động mặc định.
 */
export function getDefaultActionByTime(): CompanionAction {
  const hour = new Date().getHours();
  if (hour >= 23 || hour < 6) {
    return "sleep"; // 23:00 -> 05:59
  }
  return "idle";
}

export const RabbitCompanion: React.FC<RabbitCompanionProps> = ({
  stage,
  action,
  className,
}) => {
  const config = STAGES_CONFIG[stage] || STAGES_CONFIG[0];

  // Nếu stage này có file multi-action sprite sheet
  if (config.actions) {
    const actionConfig = config.actions[action] || config.actions["idle"];
    
    return (
      <VirtualPet
        spriteUrl={config.spriteUrl!}
        sheetWidth={config.sheetWidth}
        sheetHeight={config.sheetHeight}
        frameWidth={config.frameWidth!}
        frameHeight={config.frameHeight!}
        scale={config.defaultScale}
        offsetX={0} // Theo file AI tạo thì luôn chạy ngang từ cột 0
        offsetY={actionConfig.offsetY}
        totalFrames={actionConfig.totalFrames || 4}
        fps={actionConfig.fps || 4}
        idle={false} // Tắt idle hop mặc định để dùng hẳn animation
        className={className}
      />
    );
  }

  // Fallback cho các stage cũ chưa vẽ xong
  return (
    <VirtualPet
      spriteUrl={config.spriteUrl!}
      sheetWidth={config.sheetWidth}
      sheetHeight={config.sheetHeight}
      offsetX={config.offsetX}
      offsetY={config.offsetY}
      frameWidth={config.frameWidth!}
      frameHeight={config.frameHeight!}
      totalFrames={config.totalFrames!}
      fps={config.fps}
      scale={config.defaultScale}
      idle={config.idle}
      className={className}
    />
  );
};
