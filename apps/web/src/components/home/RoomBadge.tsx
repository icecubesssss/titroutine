"use client";

import React, { useRef, useState } from "react";
import type { RefObject } from "react";
import type { OwnedBadge } from "@/lib/types";

interface RoomBadgeProps {
  badge: OwnedBadge;
  emoji: string;
  title: string;
  /** The room canvas the badge can be dragged within (percentages are relative to this). */
  boundsRef: RefObject<HTMLElement | null>;
  /** Fired once, on drag release, with the new position as a % of the bounds. */
  onMove: (x: number, y: number) => void;
  /** Fired on a plain tap (not a drag) — always means "hide me". */
  onHide: () => void;
}

/**
 * One purchased streak badge hanging in the room. Each instance owns its own
 * pointer-drag state (same technique as the companion drag in HomeView, just
 * scoped per-badge since React state is naturally per-component-instance —
 * no shared ref juggling needed for N badges).
 */
export const RoomBadge: React.FC<RoomBadgeProps> = ({ badge, emoji, title, boundsRef, onMove, onHide }) => {
  const elRef = useRef<HTMLButtonElement>(null);
  const [dragPx, setDragPx] = useState({ x: 0, y: 0 });
  const drag = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    minDx: number;
    maxDx: number;
    minDy: number;
    maxDy: number;
    boundsWidth: number;
    boundsHeight: number;
  } | null>(null);
  const wasDragged = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    const el = elRef.current;
    const bounds = boundsRef.current;
    if (!el || !bounds) return;
    const elRect = el.getBoundingClientRect();
    const boundsRect = bounds.getBoundingClientRect();
    el.setPointerCapture(e.pointerId);
    wasDragged.current = false;
    drag.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      minDx: boundsRect.left - elRect.left,
      maxDx: boundsRect.right - elRect.right,
      minDy: boundsRect.top - elRect.top,
      maxDy: boundsRect.bottom - elRect.bottom,
      boundsWidth: boundsRect.width,
      boundsHeight: boundsRect.height,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.pointerId) return;
    const rawDx = e.clientX - d.startX;
    const rawDy = e.clientY - d.startY;
    if (Math.abs(rawDx) > 4 || Math.abs(rawDy) > 4) wasDragged.current = true;
    setDragPx({
      x: Math.min(Math.max(rawDx, d.minDx), d.maxDx),
      y: Math.min(Math.max(rawDy, d.minDy), d.maxDy),
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || e.pointerId !== d.pointerId) return;
    drag.current = null;
    if (wasDragged.current && d.boundsWidth > 0 && d.boundsHeight > 0) {
      const nextX = badge.x + (dragPx.x / d.boundsWidth) * 100;
      const nextY = badge.y + (dragPx.y / d.boundsHeight) * 100;
      onMove(Math.min(100, Math.max(0, nextX)), Math.min(100, Math.max(0, nextY)));
    }
    setDragPx({ x: 0, y: 0 });
  };

  const handleClick = () => {
    if (wasDragged.current) {
      wasDragged.current = false;
      return;
    }
    onHide();
  };

  return (
    <button
      ref={elRef}
      type="button"
      title={title}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={handleClick}
      style={{
        left: `${badge.x}%`,
        top: `${badge.y}%`,
        transform: `translate(-50%, -50%) translate(${dragPx.x}px, ${dragPx.y}px)`,
        touchAction: "none",
      }}
      className="absolute z-20 flex items-center justify-center w-11 h-11 rounded-full bg-white/90 backdrop-blur-md border border-amber-200 shadow-md text-2xl leading-none cursor-grab active:cursor-grabbing hover:scale-110 transition-transform pointer-events-auto"
    >
      {emoji}
    </button>
  );
};
