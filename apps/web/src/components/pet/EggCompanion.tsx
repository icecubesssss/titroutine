"use client";

import React from "react";
import { clsx } from "clsx";
import type { CompanionAction } from "./RabbitCompanion";

/**
 * The egg stage (stage 0). Unlike the later stages it does NOT loop an idle
 * animation — it shows a single crack frame from `egg_hatch_sprite.png` that
 * advances as the streak grows toward the hatch threshold, so the user can *see*
 * their progress accreting day by day. It wiggles a little once it starts to
 * crack, and shakes harder for a moment right after a habit is completed.
 *
 * `egg_hatch_sprite.png` is a 3-column × 2-row grid of 6 stages:
 *   0 intact · 1 small crack · 2 more cracks · 3 heavy cracks · 4 bursting · 5 broken shell
 * Frame 5 means "already hatched", so while still an egg we only use frames 0–4.
 */
export const HATCH_THRESHOLD = 7; // streak at which the egg hatches into stage 1

/** Map the current streak (0..6 while still an egg) to a crack frame (0..4). */
export function eggCrackFrame(streak: number): number {
  if (streak <= 0) return 0; // intact
  if (streak <= 2) return 1; // first cracks
  if (streak <= 4) return 2; // spreading
  if (streak <= 5) return 3; // heavy
  return 4; // streak 6 — bursting, about to hatch
}

export const EggCompanion: React.FC<{
  streak: number;
  action: CompanionAction;
  className?: string;
}> = ({ streak, action, className }) => {
  const frame = eggCrackFrame(streak);
  const col = frame % 3;
  const row = Math.floor(frame / 3);

  // A freshly-completed habit makes the egg react ("happy"/"welcome"); it shakes
  // harder and faster. Also wiggles on care actions (eat, brush_hair, sleep, young_play, proud_smile).
  const reacting = ["happy", "welcome", "eat", "proud_smile", "young_play", "brush_hair", "sleep"].includes(action);
  const wig = reacting ? frame + 3 : frame; // unitless multiplier; 0 = perfectly still

  // Styles live in a scoped <style> block (not inline `style` attrs) so the dynamic
  // sprite frame + wiggle can vary per render without tripping no-inline-styles.
  const uid = React.useId().replace(/:/g, "");
  const wrap = `egg-${uid}`;

  return (
    <div className={clsx("inline-block relative", className)}>
      <style>{`
        @keyframes ${wrap}-wiggle {
          0%, 100% { transform: rotate(calc(-1deg * ${wig})); }
          25%      { transform: rotate(calc(1deg * ${wig})); }
          50%      { transform: rotate(calc(-0.6deg * ${wig})); }
          75%      { transform: rotate(calc(0.6deg * ${wig})); }
        }
        @keyframes ${wrap}-float {
          0% { transform: translateY(0px) scale(0.8); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(-45px) scale(1.1); opacity: 0; }
        }
        .${wrap}-outer {
          width: 150px;
          height: 225px; /* keeps the ~341:512 cell ratio of the sprite */
          transform-origin: 50% 92%;
          ${wig > 0 ? `animation: ${wrap}-wiggle ${reacting ? 0.4 : 1.7}s ease-in-out infinite;` : ""}
        }
        .${wrap}-sprite {
          width: 100%;
          height: 100%;
          background-image: url('/assets/egg_hatch_sprite.png');
          background-size: 300% 200%; /* 3 columns × 2 rows */
          background-position: ${col * 50}% ${row * 100}%;
          background-repeat: no-repeat;
          image-rendering: pixelated;
          image-rendering: -moz-crisp-edges;
          image-rendering: crisp-edges;
        }
        .${wrap}-bubble {
          position: absolute;
          font-size: 16px;
          animation: ${wrap}-float 1.5s ease-in-out infinite;
          pointer-events: none;
          z-index: 20;
        }
        .${wrap}-d0   { animation-delay: 0s; }
        .${wrap}-d04  { animation-delay: 0.4s; }
        .${wrap}-d05  { animation-delay: 0.5s; }
        .${wrap}-d08  { animation-delay: 0.8s; }
        .${wrap}-d1   { animation-delay: 1s; }
      `}</style>

      {/* Floating particles for Clean (brush_hair) */}
      {action === "brush_hair" && (
        <>
          <span className={`${wrap}-bubble ${wrap}-d0 left-4 top-10`}>🧼</span>
          <span className={`${wrap}-bubble ${wrap}-d04 right-4 top-16`}>🫧</span>
          <span className={`${wrap}-bubble ${wrap}-d08 left-12 top-20`}>💦</span>
        </>
      )}

      {/* Floating particles for Sleep */}
      {action === "sleep" && (
        <>
          <span className={`${wrap}-bubble ${wrap}-d0 right-6 top-8 font-black text-blue-500`}>Z</span>
          <span className={`${wrap}-bubble ${wrap}-d05 right-2 top-14 font-black text-blue-400 text-sm`}>z</span>
          <span className={`${wrap}-bubble ${wrap}-d1 right-10 top-20 font-black text-blue-300 text-xs`}>z</span>
        </>
      )}

      <div className={`${wrap}-outer`}>
        <div className={`${wrap}-sprite`} />
      </div>
    </div>
  );
};
