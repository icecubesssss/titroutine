"use client";

import React, { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";

export interface VirtualPetProps {
  spriteUrl: string;
  /** Size of a single visible frame / crop window, in source pixels. */
  frameWidth: number;
  frameHeight: number;
  /** Number of horizontal animation frames. Use 1 for a single static crop. */
  totalFrames: number;
  fps?: number;
  scale?: number;
  /**
   * Offset of the first frame inside the sprite sheet, in source pixels.
   * Lets us crop one character out of a non-gridded sheet.
   */
  offsetX?: number;
  offsetY?: number;
  /**
   * Full sprite-sheet dimensions, in source pixels. Required when the sheet is
   * NOT a tight horizontal strip (i.e. when using offsetX/offsetY to crop).
   * Falls back to a `frameWidth * totalFrames` strip when omitted.
   */
  sheetWidth?: number;
  sheetHeight?: number;
  /** Apply a gentle idle "breathing / hop in place" animation. */
  idle?: boolean;
  className?: string;
  /** Flip the sprite horizontally (e.g. when walking left) */
  flipX?: boolean;
}

export const VirtualPet: React.FC<VirtualPetProps> = ({
  spriteUrl,
  frameWidth,
  frameHeight,
  totalFrames,
  fps = 8,
  scale = 2,
  offsetX = 0,
  offsetY = 0,
  sheetWidth,
  sheetHeight,
  idle = false,
  className,
  flipX = false,
}) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // No need to run a timer for a single static frame.
    if (totalFrames <= 1) return;

    const intervalId = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % totalFrames);
    }, 1000 / fps);

    return () => clearInterval(intervalId);
  }, [totalFrames, fps]);

  const containerId = React.useId().replace(/:/g, "");
  const styleClass = `virtual-pet-${containerId}`;

  // We remove vertical headroom (set to 0) because rabbit sprite sheets fit
  // completely inside their standard frame boundaries, and having a non-zero
  // headroom offsetsposY into the row above, cutting multi-action sheets in half.
  const verticalHeadroom = 0;

  // Background size = the full sheet (scaled). For a tight horizontal strip we
  // can derive it from frameWidth * totalFrames; otherwise use the real sheet.
  const bgWidth = (sheetWidth ?? frameWidth * totalFrames) * scale;
  const bgHeight = (sheetHeight ?? frameHeight) * scale;

  // Position the visible frame: walk horizontally across frames, plus the crop offset.
  const posX = (offsetX + currentFrame * frameWidth) * scale;
  const posY = offsetY * scale;

  return (
    <>
      <style suppressHydrationWarning>{`
        @keyframes ${styleClass}-idle {
          0%, 100% { transform: translateY(0) scaleY(1); }
          30%      { transform: translateY(-6%) scaleY(1.03); }
          60%      { transform: translateY(0) scaleY(0.98); }
        }
        .${styleClass}-container {
          width: ${frameWidth * scale}px;
          height: ${(frameHeight + verticalHeadroom) * scale}px;
          transform-origin: 50% 100%;
          ${idle ? `animation: ${styleClass}-idle 1.6s ease-in-out infinite;` : ""}
        }
        .${styleClass}-sprite {
          width: ${frameWidth * scale}px;
          height: ${(frameHeight + verticalHeadroom) * scale}px;
          background-image: url('${spriteUrl}');
          background-size: ${bgWidth}px ${bgHeight}px;
          background-position: -${posX}px -${posY}px;
          background-repeat: no-repeat;
          image-rendering: pixelated;
          image-rendering: -moz-crisp-edges;
          image-rendering: crisp-edges;
          transform: ${flipX ? "scaleX(-1)" : "none"};
          transform-origin: 50% 50%;
        }
      `}</style>
      <div
        ref={containerRef}
        className={clsx("relative overflow-hidden inline-block", `${styleClass}-container`, className)}
      >
        <div
          className={clsx("absolute top-0 left-0 will-change-transform", `${styleClass}-sprite`)}
        />
      </div>
    </>
  );
};
