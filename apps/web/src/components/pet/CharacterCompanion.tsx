"use client";

import React, { useEffect, useState } from "react";
import { clsx } from "clsx";
import {
  getCharacter,
  resolveSheet,
  type CharacterAction,
  type CharacterId,
} from "@/lib/characters";

export interface CharacterCompanionProps {
  /** Which character to draw. Unknown values fall back to the default character. */
  characterId?: CharacterId | string | null;
  action?: CharacterAction;
  /** Overrides the character's defaultScale (or duoScale for duo sheets). */
  scale?: number;
  className?: string;
  flipX?: boolean;
  /** Overrides the sheet's fps. */
  fps?: number;
  /** Freeze on the first frame (useful for static previews). */
  paused?: boolean;
}

/**
 * Sprite-sheet renderer driven entirely by `lib/characters.ts`. Every frame size,
 * grid and asset path comes from the registry, so swapping Panda Girl → Tiger Boy
 * is a data change, not a code change.
 */
export const CharacterCompanion: React.FC<CharacterCompanionProps> = ({
  characterId,
  action = "idle",
  scale,
  className,
  flipX = false,
  fps,
  paused = false,
}) => {
  const [currentFrame, setCurrentFrame] = useState(0);

  const resolved = resolveSheet(characterId, action);
  const sheet = resolved?.sheet;
  const totalFrames = sheet ? sheet.totalFrames ?? sheet.cols * sheet.rows : 1;
  const frameRate = fps ?? sheet?.fps ?? 6;

  // Restart the loop whenever the sheet changes so a shorter sheet never gets
  // stuck showing a frame index it doesn't have.
  useEffect(() => {
    setCurrentFrame(0);
  }, [sheet?.spriteUrl, totalFrames]);

  useEffect(() => {
    if (paused || totalFrames <= 1) return;
    const intervalId = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % totalFrames);
    }, 1000 / frameRate);
    return () => clearInterval(intervalId);
  }, [paused, totalFrames, frameRate]);

  if (!sheet) return null;

  const character = getCharacter(characterId);
  const effectiveScale = scale ?? (sheet.duo ? character.duoScale : character.defaultScale);

  const frame = currentFrame % totalFrames;
  const col = frame % sheet.cols;
  const row = Math.floor(frame / sheet.cols);

  const scaledWidth = Math.round(sheet.frameWidth * effectiveScale);
  const scaledHeight = Math.round(sheet.frameHeight * effectiveScale);
  const scaledSheetWidth = Math.round(sheet.frameWidth * sheet.cols * effectiveScale);
  const scaledSheetHeight = Math.round(sheet.frameHeight * sheet.rows * effectiveScale);

  const posX = -Math.round(col * sheet.frameWidth * effectiveScale);
  const posY = -Math.round(row * sheet.frameHeight * effectiveScale);

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
          backgroundImage: `url('${sheet.spriteUrl}')`,
          backgroundPosition: `${posX}px ${posY}px`,
          backgroundSize: `${scaledSheetWidth}px ${scaledSheetHeight}px`,
          imageRendering: "crisp-edges",
        }}
      />
    </div>
  );
};
