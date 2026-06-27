"use client";

import React from "react";
import { VirtualPet, VirtualPetProps } from "./VirtualPet";

export type CompanionAction = "idle" | "sleep" | "happy" | "sad" | "eat" | "study" | "welcome";

export interface RabbitCompanionProps {
  stage: number;
  action: CompanionAction;
  equippedOutfit?: string;
  className?: string;
}

// Kích thước cắt ảnh tự động từ script
const BABY_FRAME_W = 262;
const BABY_FRAME_H = 222;

const CHILD_FRAME_W = 276;
const CHILD_FRAME_H = 224;

interface StageConfig extends Partial<VirtualPetProps> {
  name: string;
  roomBackground: string;
  defaultScale: number;
  actions?: Record<string, { offsetY: number; totalFrames?: number; fps?: number }>;
}

// The newer *_actions.png sheets are all 1024×1024 grids: 5 rows in the order
// idle, happy, sad, sleep, study (one action per row). 1024/5 ≈ 204.8 → row Y.
const ACTION_ROW_Y = [0, 205, 410, 614, 819];

/** Build the action map shared by every 1024×1024 action sheet. `frames` is the
 *  number of columns (4 for most stages, 6 for the teen sheet). */
function gridActions(frames: number): StageConfig["actions"] {
  return {
    idle: { offsetY: ACTION_ROW_Y[0], fps: 4, totalFrames: frames },
    happy: { offsetY: ACTION_ROW_Y[1], fps: 6, totalFrames: frames },
    sad: { offsetY: ACTION_ROW_Y[2], fps: 3, totalFrames: frames },
    sleep: { offsetY: ACTION_ROW_Y[3], fps: 2, totalFrames: frames },
    study: { offsetY: ACTION_ROW_Y[4], fps: 4, totalFrames: frames },
    welcome: { offsetY: ACTION_ROW_Y[1], fps: 6, totalFrames: frames }, // → happy
    eat: { offsetY: ACTION_ROW_Y[0], fps: 4, totalFrames: frames }, // → idle (no eat row)
  };
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
    spriteUrl: "/assets/baby_rabbit_phase1_clean.png",
    sheetWidth: BABY_FRAME_W * 4,
    sheetHeight: BABY_FRAME_H * 5,
    frameWidth: BABY_FRAME_W,
    frameHeight: BABY_FRAME_H,
    defaultScale: 0.8,
    roomBackground: "bg-gradient-to-b from-blue-200 via-green-100 to-green-300",
    actions: {
      idle: { offsetY: 0, fps: 4, totalFrames: 4 },
      sleep: { offsetY: BABY_FRAME_H * 1, fps: 2, totalFrames: 4 },
      happy: { offsetY: BABY_FRAME_H * 2, fps: 6, totalFrames: 4 },
      sad: { offsetY: BABY_FRAME_H * 3, fps: 3, totalFrames: 4 },
      eat: { offsetY: BABY_FRAME_H * 4, fps: 5, totalFrames: 4 },
      welcome: { offsetY: BABY_FRAME_H * 2, fps: 6, totalFrames: 4 }, // Fallback to happy
      study: { offsetY: 0, fps: 4, totalFrames: 4 }, // Fallback to idle
    },
  },
  2: {
    name: "Young Rabbit",
    spriteUrl: "/assets/young_rabbit_actions.png",
    sheetWidth: 1024,
    sheetHeight: 1024,
    frameWidth: 256, // 1024 / 4 columns
    frameHeight: 205, // 1024 / 5 rows
    defaultScale: 1.25, // tune if the character looks too small/large
    roomBackground: "bg-gradient-to-b from-emerald-100 via-teal-50 to-emerald-200",
    actions: gridActions(4),
  },
  3: {
    name: "Spirit Rabbit",
    spriteUrl: "/assets/spirit_rabbit_actions.png",
    sheetWidth: 1024,
    sheetHeight: 1024,
    frameWidth: 256,
    frameHeight: 205,
    defaultScale: 1.2,
    roomBackground: "bg-gradient-to-b from-indigo-900 via-purple-900 to-indigo-950 text-white",
    actions: gridActions(4),
  },
  4: {
    name: "Bunny Girl Child",
    spriteUrl: "/assets/bunny_child_phase1_clean.png",
    sheetWidth: CHILD_FRAME_W * 4,
    sheetHeight: CHILD_FRAME_H * 5,
    frameWidth: CHILD_FRAME_W,
    frameHeight: CHILD_FRAME_H,
    defaultScale: 0.7,
    roomBackground: "bg-gradient-to-b from-rose-100 via-pink-50 to-rose-200",
    actions: {
      idle: { offsetY: 0, fps: 4, totalFrames: 4 },
      study: { offsetY: CHILD_FRAME_H * 1, fps: 5, totalFrames: 4 },
      sleep: { offsetY: CHILD_FRAME_H * 2, fps: 2, totalFrames: 4 },
      happy: { offsetY: CHILD_FRAME_H * 3, fps: 6, totalFrames: 4 },
      welcome: { offsetY: CHILD_FRAME_H * 4, fps: 6, totalFrames: 4 },
      sad: { offsetY: 0, fps: 4, totalFrames: 4 }, // Fallback to idle
      eat: { offsetY: 0, fps: 4, totalFrames: 4 }, // Fallback to idle
    },
  },
  5: {
    name: "Teen Bunny Girl",
    spriteUrl: "/assets/bunny_teen_actions.png",
    sheetWidth: 1024,
    sheetHeight: 1024,
    frameWidth: 170, // 1024 / 6 columns (this sheet has 6 frames per row)
    frameHeight: 205,
    defaultScale: 1.3,
    roomBackground: "bg-gradient-to-b from-blue-100 via-indigo-50 to-blue-200",
    actions: gridActions(6),
  },
  6: {
    name: "Young Woman",
    spriteUrl: "/assets/bunny_woman_actions.png",
    sheetWidth: 1024,
    sheetHeight: 1024,
    frameWidth: 256,
    frameHeight: 205,
    defaultScale: 1.15,
    roomBackground: "bg-gradient-to-b from-amber-50 via-stone-100 to-amber-100",
    actions: gridActions(4),
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
  equippedOutfit,
  className,
}) => {
  const config = STAGES_CONFIG[stage] || STAGES_CONFIG[0];
  
  // Xử lý mặc trang phục (Outfit Override)
  // Chỉ áp dụng override nếu đang ở Stage 6 và có đồ (bản demo concept)
  let finalSpriteUrl = config.spriteUrl!;
  if (equippedOutfit && stage === 6) {
    // Tạm thời lấy placeholder hoặc ảnh thật của outfit nếu đã làm
    // Trong tương lai, mỗi outfit sẽ có sprite sheet tương ứng
    // Ví dụ: outfit_summer_dress -> /assets/outfit_summer_dress_sprite.png
    finalSpriteUrl = `/assets/${equippedOutfit}_sprite.png`;
    // Lưu ý: Nếu file chưa có thật, UI sẽ bị gãy ảnh (broken image).
    // Tạm thời giữ fallback về spriteUrl gốc nếu không load được, nhưng thẻ <img> không dễ bắt lỗi trong Canvas.
    // Vì đây là demo, ta cứ truyền link mới.
  }

  // Nếu stage này có file multi-action sprite sheet
  if (config.actions) {
    const actionConfig = config.actions[action] || config.actions["idle"];
    
    return (
      <VirtualPet
        spriteUrl={finalSpriteUrl}
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
      spriteUrl={finalSpriteUrl}
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
