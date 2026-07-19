"use client";

import React from "react";
import { VirtualPet, VirtualPetProps } from "./VirtualPet";

export type CompanionAction = 
  | "idle" | "sleep" | "happy" | "sad" | "eat" | "study" | "welcome"
  | "egg_idle" | "egg_shake" | "egg_crack"
  | "young_play" | "spirit_meditate" | "spirit_read"
  | "wake_up_stretch" | "morning_tea" | "exercise_stretch"
  | "study_laptop" | "read_floor" | "read_window"
  | "relax_music" | "brush_hair"
  | "proud_smile" | "embarrassed_blush" | "sleepy_yawn"
  | "task_celebrate" | "inactive_alone" | "return_cry"
  | "streak_30" | "streak_100" | "streak_365" | "streak_1000"
  | "weather_rain" | "weather_snow"
  | "season_spring" | "season_autumn" | "event_christmas" | "event_lunar_new_year"
  | "rare_sleep_drool" | "rare_read_sleep" | "rare_cat"
  | "rare_star" | "rare_sing" | "rare_cook_burn"
  | "teen_laptop" | "teen_yoga" | "teen_coffee"
  | "woman_plan" | "woman_tea" | "woman_wave";

export interface RabbitCompanionProps {
  stage: number;
  action: CompanionAction;
  equippedOutfit?: string;
  className?: string;
  flipX?: boolean;
}

const BABY_FRAME_W = 262;
const BABY_FRAME_H = 222;

const CHILD_FRAME_W = 276;
const CHILD_FRAME_H = 224;

interface ActionConfig {
  offsetY: number;
  totalFrames?: number;
  fps?: number;
  spriteUrl?: string;
  sheetWidth?: number;
  sheetHeight?: number;
  frameWidth?: number;
  frameHeight?: number;
}

interface StageConfig extends Partial<VirtualPetProps> {
  name: string;
  roomBackground: string;
  defaultScale: number;
  actions?: Record<string, ActionConfig>;
}

export const STAGES_CONFIG: Record<number, StageConfig> = {
  0: {
    name: "Egg",
    spriteUrl: "/assets/egg_phase3_clean.png",
    sheetWidth: 228 * 4,
    sheetHeight: 254 * 3,
    frameWidth: 228,
    frameHeight: 254,
    defaultScale: 0.35,
    roomBackground: "bg-gradient-to-b from-amber-100 via-orange-100 to-amber-200",
    actions: {
      egg_idle: { offsetY: 0, fps: 4, totalFrames: 4 },
      egg_shake: { offsetY: 254 * 1, fps: 6, totalFrames: 4 },
      egg_crack: { offsetY: 254 * 2, fps: 4, totalFrames: 4 },
      idle: { offsetY: 0, fps: 4, totalFrames: 4 }, // Fallback
    }
  },
  1: {
    name: "Baby Rabbit",
    spriteUrl: "/assets/baby_rabbit_phase1_clean.png",
    sheetWidth: BABY_FRAME_W * 4,
    sheetHeight: BABY_FRAME_H * 5,
    frameWidth: BABY_FRAME_W,
    frameHeight: BABY_FRAME_H,
    defaultScale: 0.35,
    roomBackground: "bg-gradient-to-b from-blue-200 via-green-100 to-green-300",
    actions: {
      idle: { offsetY: 0, fps: 4, totalFrames: 4 },
      sleep: { offsetY: BABY_FRAME_H * 1, fps: 2, totalFrames: 4 },
      happy: { offsetY: BABY_FRAME_H * 2, fps: 6, totalFrames: 4 },
      sad: { offsetY: BABY_FRAME_H * 3, fps: 3, totalFrames: 4 },
      eat: { offsetY: BABY_FRAME_H * 4, fps: 5, totalFrames: 4 },
      welcome: { offsetY: BABY_FRAME_H * 2, fps: 6, totalFrames: 4 }, 
      study: { offsetY: 0, fps: 4, totalFrames: 4 },
    },
  },
  2: {
    // Full emotion sheet (Gemini G1). Rows: idle / happy / sad / sleep / study.
    name: "Young Rabbit",
    spriteUrl: "/assets/young_rabbit_actions_clean.png",
    sheetWidth: 207 * 4,
    sheetHeight: 224 * 5,
    frameWidth: 207,
    frameHeight: 224,
    defaultScale: 0.35,
    roomBackground: "bg-gradient-to-b from-emerald-100 via-teal-50 to-emerald-200",
    actions: {
      idle: { offsetY: 0, fps: 4 },
      happy: { offsetY: 224 * 1, fps: 6 },
      sad: { offsetY: 224 * 2, fps: 3 },
      sleep: { offsetY: 224 * 3, fps: 2 },
      study: { offsetY: 224 * 4, fps: 4 },
      young_play: { offsetY: 224 * 1, fps: 6 }, // alias -> happy
    },
  },
  3: {
    // Full emotion sheet (Gemini G1). Rows: idle / happy / sad / sleep / study.
    name: "Spirit Rabbit",
    spriteUrl: "/assets/spirit_rabbit_actions_clean.png",
    sheetWidth: 276 * 4,
    sheetHeight: 224 * 5,
    frameWidth: 276,
    frameHeight: 224,
    defaultScale: 0.4,
    roomBackground: "bg-gradient-to-b from-indigo-900 via-purple-900 to-indigo-950 text-white",
    actions: {
      idle: { offsetY: 0, fps: 4 },
      happy: { offsetY: 224 * 1, fps: 6 },
      sad: { offsetY: 224 * 2, fps: 3 },
      sleep: { offsetY: 224 * 3, fps: 2 },
      study: { offsetY: 224 * 4, fps: 4 },
      // Thematic poses kept from the old combined sheet (different frame size).
      spirit_meditate: { spriteUrl: "/assets/young_spirit_rabbit_phase3_clean.png", frameWidth: 239, frameHeight: 357, sheetWidth: 239*4, sheetHeight: 357*3, offsetY: 357*1, fps: 4 },
      spirit_read: { spriteUrl: "/assets/young_spirit_rabbit_phase3_clean.png", frameWidth: 239, frameHeight: 357, sheetWidth: 239*4, sheetHeight: 357*3, offsetY: 357*2, fps: 4 },
    },
  },
  4: {
    name: "Bunny Girl Child",
    spriteUrl: "/assets/bunny_child_phase1_clean.png",
    sheetWidth: CHILD_FRAME_W * 4,
    sheetHeight: CHILD_FRAME_H * 5,
    frameWidth: CHILD_FRAME_W,
    frameHeight: CHILD_FRAME_H,
    defaultScale: 0.32,
    roomBackground: "bg-gradient-to-b from-rose-100 via-pink-50 to-rose-200",
    actions: {
      // Phase 1 (Base Sprite)
      idle: { offsetY: 0, fps: 4 },
      study: { offsetY: CHILD_FRAME_H * 1, fps: 5 },
      sleep: { offsetY: CHILD_FRAME_H * 2, fps: 2 },
      happy: { offsetY: CHILD_FRAME_H * 3, fps: 6 },
      welcome: { offsetY: CHILD_FRAME_H * 4, fps: 6 },
      sad: { offsetY: 0, fps: 4 },
      eat: { offsetY: 0, fps: 4 },

      // Phase 2 Morning (267x337)
      wake_up_stretch: { spriteUrl: "/assets/bunny_child_phase2_morning_clean.png", frameWidth: 267, frameHeight: 337, sheetWidth: 267*4, sheetHeight: 337*3, offsetY: 0, fps: 4 },
      morning_tea: { spriteUrl: "/assets/bunny_child_phase2_morning_clean.png", frameWidth: 267, frameHeight: 337, sheetWidth: 267*4, sheetHeight: 337*3, offsetY: 337*1, fps: 4 },
      exercise_stretch: { spriteUrl: "/assets/bunny_child_phase2_morning_clean.png", frameWidth: 267, frameHeight: 337, sheetWidth: 267*4, sheetHeight: 337*3, offsetY: 337*2, fps: 5 },

      // Phase 2 Study (276x361)
      study_laptop: { spriteUrl: "/assets/bunny_child_phase2_study_clean.png", frameWidth: 276, frameHeight: 361, sheetWidth: 276*4, sheetHeight: 361*3, offsetY: 0, fps: 5 },
      read_floor: { spriteUrl: "/assets/bunny_child_phase2_study_clean.png", frameWidth: 276, frameHeight: 361, sheetWidth: 276*4, sheetHeight: 361*3, offsetY: 361*1, fps: 3 },
      read_window: { spriteUrl: "/assets/bunny_child_phase2_study_clean.png", frameWidth: 276, frameHeight: 361, sheetWidth: 276*4, sheetHeight: 361*3, offsetY: 361*2, fps: 3 },

      // Phase 2 Extra (276x224)
      relax_music: { spriteUrl: "/assets/bunny_child_phase2_extra_processed.png", frameWidth: 276, frameHeight: 224, sheetWidth: 276*4, sheetHeight: 224*5, offsetY: 0, fps: 4 },
      brush_hair: { spriteUrl: "/assets/bunny_child_phase2_extra_processed.png", frameWidth: 276, frameHeight: 224, sheetWidth: 276*4, sheetHeight: 224*5, offsetY: 224*1, fps: 5 },
      proud_smile: { spriteUrl: "/assets/bunny_child_phase2_extra_processed.png", frameWidth: 276, frameHeight: 224, sheetWidth: 276*4, sheetHeight: 224*5, offsetY: 224*2, fps: 4 },
      embarrassed_blush: { spriteUrl: "/assets/bunny_child_phase2_extra_processed.png", frameWidth: 276, frameHeight: 224, sheetWidth: 276*4, sheetHeight: 224*5, offsetY: 224*3, fps: 4 },
      sleepy_yawn: { spriteUrl: "/assets/bunny_child_phase2_extra_processed.png", frameWidth: 276, frameHeight: 224, sheetWidth: 276*4, sheetHeight: 224*5, offsetY: 224*4, fps: 3 },

      // Phase 4 Interaction (253x358)
      task_celebrate: { spriteUrl: "/assets/user_interaction_phase4_clean.png", frameWidth: 253, frameHeight: 358, sheetWidth: 253*4, sheetHeight: 358*3, offsetY: 0, fps: 6 },
      inactive_alone: { spriteUrl: "/assets/user_interaction_phase4_clean.png", frameWidth: 253, frameHeight: 358, sheetWidth: 253*4, sheetHeight: 358*3, offsetY: 358*1, fps: 3 },
      return_cry: { spriteUrl: "/assets/user_interaction_phase4_clean.png", frameWidth: 253, frameHeight: 358, sheetWidth: 253*4, sheetHeight: 358*3, offsetY: 358*2, fps: 5 },

      // Phase 5 Weather (251x361)
      weather_rain: { spriteUrl: "/assets/weather_seasons_phase5_clean.png", frameWidth: 251, frameHeight: 361, sheetWidth: 251*4, sheetHeight: 361*3, offsetY: 0, fps: 4 },
      weather_snow: { spriteUrl: "/assets/weather_seasons_phase5_clean.png", frameWidth: 251, frameHeight: 361, sheetWidth: 251*4, sheetHeight: 361*3, offsetY: 361*1, fps: 5 },
      season_spring: { spriteUrl: "/assets/weather_seasons_phase5_clean.png", frameWidth: 251, frameHeight: 361, sheetWidth: 251*4, sheetHeight: 361*3, offsetY: 361*2, fps: 4 },

      // Phase 5 Festivals (276x310)
      season_autumn: { spriteUrl: "/assets/festivals_phase5_clean.png", frameWidth: 276, frameHeight: 310, sheetWidth: 276*4, sheetHeight: 310*3, offsetY: 0, fps: 4 },
      event_christmas: { spriteUrl: "/assets/festivals_phase5_clean.png", frameWidth: 276, frameHeight: 310, sheetWidth: 276*4, sheetHeight: 310*3, offsetY: 310*1, fps: 5 },
      event_lunar_new_year: { spriteUrl: "/assets/festivals_phase5_clean.png", frameWidth: 276, frameHeight: 310, sheetWidth: 276*4, sheetHeight: 310*3, offsetY: 310*2, fps: 4 },

      // Phase 6 Rare Events 1 (271x331)
      rare_sleep_drool: { spriteUrl: "/assets/rare_events_1_phase6_clean.png", frameWidth: 271, frameHeight: 331, sheetWidth: 271*4, sheetHeight: 331*3, offsetY: 0, fps: 3 },
      rare_read_sleep: { spriteUrl: "/assets/rare_events_1_phase6_clean.png", frameWidth: 271, frameHeight: 331, sheetWidth: 271*4, sheetHeight: 331*3, offsetY: 331*1, fps: 2 },
      rare_cat: { spriteUrl: "/assets/rare_events_1_phase6_clean.png", frameWidth: 271, frameHeight: 331, sheetWidth: 271*4, sheetHeight: 331*3, offsetY: 331*2, fps: 4 },

      // Phase 6 Rare Events 2 (239x346)
      rare_star: { spriteUrl: "/assets/rare_events_2_phase6_clean.png", frameWidth: 239, frameHeight: 346, sheetWidth: 239*4, sheetHeight: 346*3, offsetY: 0, fps: 4 },
      rare_sing: { spriteUrl: "/assets/rare_events_2_phase6_clean.png", frameWidth: 239, frameHeight: 346, sheetWidth: 239*4, sheetHeight: 346*3, offsetY: 346*1, fps: 6 },
      rare_cook_burn: { spriteUrl: "/assets/rare_events_2_phase6_clean.png", frameWidth: 239, frameHeight: 346, sheetWidth: 239*4, sheetHeight: 346*3, offsetY: 346*2, fps: 3 },
    },
  },
  5: {
    // Full emotion sheet (Gemini G5 regen — lưới đều). Rows: idle/happy/sad/sleep/study.
    // Nhân vật teen mới (khác old teen) nên bỏ thematic cũ để đồng nhất một thiết kế.
    name: "Teen Bunny Girl",
    spriteUrl: "/assets/bunny_teen_actions_clean.png",
    sheetWidth: 141 * 4,
    sheetHeight: 224 * 5,
    frameWidth: 141,
    frameHeight: 224,
    defaultScale: 0.42,
    roomBackground: "bg-gradient-to-b from-blue-100 via-indigo-50 to-blue-200",
    actions: {
      idle: { offsetY: 0, fps: 4 },
      happy: { offsetY: 224 * 1, fps: 6 },
      sad: { offsetY: 224 * 2, fps: 3 },
      sleep: { offsetY: 224 * 3, fps: 2 },
      study: { offsetY: 224 * 4, fps: 4 },
    },
  },
  6: {
    // Full emotion sheet (Gemini G2). Rows: idle / happy / sad / sleep / study.
    name: "Young Woman",
    spriteUrl: "/assets/bunny_woman_actions_clean.png",
    sheetWidth: 229 * 4,
    sheetHeight: 224 * 5,
    frameWidth: 229,
    frameHeight: 224,
    defaultScale: 0.42,
    roomBackground: "bg-gradient-to-b from-amber-50 via-stone-100 to-amber-100",
    actions: {
      idle: { offsetY: 0, fps: 4 },
      happy: { offsetY: 224 * 1, fps: 6 },
      sad: { offsetY: 224 * 2, fps: 3 },
      sleep: { offsetY: 224 * 3, fps: 2 },
      study: { offsetY: 224 * 4, fps: 4 },
      // Thematic poses kept from the old woman sheet (different frame size).
      woman_plan: { spriteUrl: "/assets/young_woman_bunny_phase3_clean.png", frameWidth: 233, frameHeight: 352, sheetWidth: 233*4, sheetHeight: 352*3, offsetY: 0, fps: 4 },
      woman_tea: { spriteUrl: "/assets/young_woman_bunny_phase3_clean.png", frameWidth: 233, frameHeight: 352, sheetWidth: 233*4, sheetHeight: 352*3, offsetY: 352*1, fps: 4 },
      woman_wave: { spriteUrl: "/assets/young_woman_bunny_phase3_clean.png", frameWidth: 233, frameHeight: 352, sheetWidth: 233*4, sheetHeight: 352*3, offsetY: 352*2, fps: 6 },

      // Phase 4 Streaks Milestones (253x276)
      streak_30: { spriteUrl: "/assets/streaks_milestone_phase4_clean.png", frameWidth: 253, frameHeight: 276, sheetWidth: 253*4, sheetHeight: 276*4, offsetY: 0, fps: 4 },
      streak_100: { spriteUrl: "/assets/streaks_milestone_phase4_clean.png", frameWidth: 253, frameHeight: 276, sheetWidth: 253*4, sheetHeight: 276*4, offsetY: 276*1, fps: 3 },
      streak_365: { spriteUrl: "/assets/streaks_milestone_phase4_clean.png", frameWidth: 253, frameHeight: 276, sheetWidth: 253*4, sheetHeight: 276*4, offsetY: 276*2, fps: 4 },
      streak_1000: { spriteUrl: "/assets/streaks_milestone_phase4_clean.png", frameWidth: 253, frameHeight: 276, sheetWidth: 253*4, sheetHeight: 276*4, offsetY: 276*3, fps: 5 },
    },
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

/**
 * Chuỗi thay thế khi một stage CHƯA có sprite cho action được yêu cầu.
 * Các stage 2/3/5/6 hiện chỉ có vài tư thế chuyên đề (chưa có đủ bộ
 * happy/sad/sleep như stage 1 & 4), nên thay vì đơ về `idle` ta chọn tư thế
 * gần nghĩa nhất mà stage đó thực sự có. Mỗi chuỗi bắt đầu bằng chính action.
 * (Khi Gemini vẽ xong bộ action đầy đủ — xem GEMINI_TASKS.md — các fallback này
 * tự động ngừng kích hoạt vì action gốc đã tồn tại.)
 */
const ACTION_FALLBACKS: Partial<Record<CompanionAction, CompanionAction[]>> = {
  happy: ["happy", "welcome", "task_celebrate", "young_play", "teen_yoga", "woman_wave", "idle"],
  welcome: ["welcome", "woman_wave", "happy", "young_play", "idle"],
  sad: ["sad", "inactive_alone", "sleepy_yawn", "idle"],
  sleep: ["sleep", "rare_sleep_drool", "idle"],
  eat: ["eat", "morning_tea", "happy", "idle"],
  proud_smile: ["proud_smile", "happy", "welcome", "idle"],
  embarrassed_blush: ["embarrassed_blush", "happy", "idle"],
  study: ["study", "study_laptop", "teen_laptop", "woman_plan", "spirit_read", "read_window", "idle"],
  return_cry: ["return_cry", "sad", "welcome", "idle"],
  task_celebrate: ["task_celebrate", "happy", "welcome", "woman_wave", "idle"],
  streak_30: ["streak_30", "task_celebrate", "happy", "welcome", "woman_wave", "idle"],
  streak_100: ["streak_100", "task_celebrate", "happy", "welcome", "woman_wave", "idle"],
  streak_365: ["streak_365", "task_celebrate", "happy", "welcome", "woman_wave", "idle"],
  streak_1000: ["streak_1000", "task_celebrate", "happy", "welcome", "woman_wave", "idle"],
};

/** Chọn key action thực sự sẽ render cho stage này (đi theo chuỗi fallback). */
function resolveActionKey(actions: Record<string, ActionConfig>, action: CompanionAction): string {
  const chain = ACTION_FALLBACKS[action] ?? [action, "idle"];
  for (const key of chain) {
    if (actions[key]) return key;
  }
  return actions["idle"] ? "idle" : Object.keys(actions)[0];
}

/**
 * Outfit id -> sprite sheet cho Stage 6. Cùng bố cục 4×5 (idle/happy/sad/sleep/
 * study) như `bunny_woman_actions`, nên chỉ cần hoán base sheet + dims; các action
 * cảm xúc cơ bản (không có override riêng) tự khớp offsetY. Thêm entry khi có file.
 */
const OUTFIT_SHEETS: Record<string, { spriteUrl: string; frameWidth: number; frameHeight: number; sheetWidth: number; sheetHeight: number }> = {
  outfit_summer_dress: { spriteUrl: "/assets/outfit_summer_dress_sprite_clean.png", frameWidth: 229, frameHeight: 224, sheetWidth: 229 * 4, sheetHeight: 224 * 5 },
  outfit_winter_coat: { spriteUrl: "/assets/outfit_winter_coat_sprite_clean.png", frameWidth: 229, frameHeight: 224, sheetWidth: 229 * 4, sheetHeight: 224 * 5 },
  outfit_chef: { spriteUrl: "/assets/outfit_chef_sprite_clean.png", frameWidth: 269, frameHeight: 224, sheetWidth: 269 * 4, sheetHeight: 224 * 5 },
};

export const RabbitCompanion: React.FC<RabbitCompanionProps> = ({
  stage,
  action,
  equippedOutfit,
  className,
  flipX = false,
}) => {
  const config = STAGES_CONFIG[stage] || STAGES_CONFIG[0];

  // Outfit override (chỉ Stage 6, chỉ khi outfit có sprite thật → tránh gãy ảnh).
  // Hoán base sheet + dims sang bộ đồ; các action cảm xúc cơ bản dùng lại offsetY.
  // Action chuyên đề (woman_tea/streak…) giữ art riêng nên tạm hiện bản không mặc đồ.
  const outfit = equippedOutfit && stage === 6 ? OUTFIT_SHEETS[equippedOutfit] : undefined;
  const baseSpriteUrl = outfit?.spriteUrl ?? config.spriteUrl!;
  const baseFrameWidth = outfit?.frameWidth ?? config.frameWidth!;
  const baseFrameHeight = outfit?.frameHeight ?? config.frameHeight!;
  const baseSheetWidth = outfit?.sheetWidth ?? config.sheetWidth;
  const baseSheetHeight = outfit?.sheetHeight ?? config.sheetHeight;

  // Nếu stage này có file multi-action sprite sheet
  if (config.actions) {
    const actionConfig = config.actions[resolveActionKey(config.actions, action)];

    // Áp dụng override từ actionConfig nếu có, ngược lại dùng base (đã tính outfit)
    const currentSpriteUrl = actionConfig.spriteUrl || baseSpriteUrl;
    const currentSheetWidth = actionConfig.sheetWidth || baseSheetWidth;
    const currentSheetHeight = actionConfig.sheetHeight || baseSheetHeight;
    const currentFrameWidth = actionConfig.frameWidth || baseFrameWidth;
    const currentFrameHeight = actionConfig.frameHeight || baseFrameHeight;

    return (
      <VirtualPet
        spriteUrl={currentSpriteUrl}
        sheetWidth={currentSheetWidth}
        sheetHeight={currentSheetHeight}
        frameWidth={currentFrameWidth}
        frameHeight={currentFrameHeight}
        scale={config.defaultScale}
        offsetX={0} // Theo file AI tạo thì luôn chạy ngang từ cột 0
        offsetY={actionConfig.offsetY}
        totalFrames={actionConfig.totalFrames || 4}
        fps={actionConfig.fps || 4}
        idle={false} // Tắt idle hop mặc định để dùng hẳn animation
        className={className}
        flipX={flipX}
      />
    );
  }

  // Fallback cho các stage cũ chưa vẽ xong
  return (
    <VirtualPet
      spriteUrl={baseSpriteUrl}
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
      flipX={flipX}
    />
  );
};
