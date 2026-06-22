"use client";

import React, { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";

export interface VirtualPetProps {
  spriteUrl: string;
  frameWidth: number;
  frameHeight: number;
  totalFrames: number;
  fps?: number;
  scale?: number;
  className?: string;
}

export const VirtualPet: React.FC<VirtualPetProps> = ({
  spriteUrl,
  frameWidth,
  frameHeight,
  totalFrames,
  fps = 8,
  scale = 2,
  className,
}) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % totalFrames);
    }, 1000 / fps);

    return () => clearInterval(intervalId);
  }, [totalFrames, fps]);

  const containerId = React.useId().replace(/:/g, "");
  const styleClass = `virtual-pet-${containerId}`;

  return (
    <>
      <style suppressHydrationWarning>{`
        .${styleClass}-container {
          width: ${frameWidth * scale}px;
          height: ${frameHeight * scale}px;
        }
        .${styleClass}-sprite {
          width: ${frameWidth * totalFrames * scale}px;
          height: ${frameHeight * scale}px;
          background-image: url('${spriteUrl}');
          background-size: ${frameWidth * totalFrames * scale}px ${frameHeight * scale}px;
          background-position: -${currentFrame * frameWidth * scale}px 0px;
          background-repeat: no-repeat;
          image-rendering: pixelated;
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
