"use client";

import React, { useEffect, useState } from "react";
import { clsx } from "clsx";
import { useTranslations } from "next-intl";

/**
 * A small speech bubble the hatched companion shows to cheer the user on. The
 * message pool depends on the day's progress (nothing added yet / still some to
 * do / all done) and rotates every few seconds. Pops in again whenever the state
 * (and therefore the pool) changes.
 */
export const PetSpeechBubble: React.FC<{
  remaining: number;
  total: number;
  className?: string;
}> = ({ remaining, total, className }) => {
  const t = useTranslations("Pet");

  const pool = total === 0 ? ["empty"] : remaining === 0 ? ["allDone1", "allDone2"] : ["go1", "go2", "go3"];
  const poolKey = pool.join(); // identity of the current pool, for re-pop on change

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 7000);
    return () => clearInterval(id);
  }, []);

  const message = t(pool[tick % pool.length], { count: remaining });

  return (
    <div
      key={poolKey}
      style={{ animation: "bubble-pop 0.45s ease-out" }}
      className={clsx(
        "relative max-w-[210px] rounded-2xl border border-black/5 bg-white/95 px-3 py-2 text-center text-xs font-bold text-earth-text shadow-lg",
        className
      )}
    >
      {message}
      <span className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-black/5 bg-white/95" />
    </div>
  );
};
