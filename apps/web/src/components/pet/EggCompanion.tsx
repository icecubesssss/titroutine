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
  // harder and faster. Otherwise the wiggle amplitude just grows with the cracks.
  const reacting = action === "happy" || action === "welcome";
  const wig = reacting ? frame + 3 : frame; // unitless multiplier; 0 = perfectly still

  return (
    <div className={clsx("inline-block", className)}>
      <style>{`
        @keyframes egg-wiggle {
          0%, 100% { transform: rotate(calc(-1deg * var(--wig))); }
          25%      { transform: rotate(calc(1deg * var(--wig))); }
          50%      { transform: rotate(calc(-0.6deg * var(--wig))); }
          75%      { transform: rotate(calc(0.6deg * var(--wig))); }
        }
      `}</style>
      <div
        style={{
          width: 150,
          height: 225, // keeps the ~341:512 cell ratio of the sprite
          transformOrigin: "50% 92%",
          ["--wig" as string]: String(wig),
          animation: wig > 0 ? `egg-wiggle ${reacting ? 0.4 : 1.7}s ease-in-out infinite` : undefined,
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            backgroundImage: "url('/assets/egg_hatch_sprite.png')",
            backgroundSize: "300% 200%", // 3 columns × 2 rows
            backgroundPosition: `${col * 50}% ${row * 100}%`,
            backgroundRepeat: "no-repeat",
          }}
        />
      </div>
    </div>
  );
};
