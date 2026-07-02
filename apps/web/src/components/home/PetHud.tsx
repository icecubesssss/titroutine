"use client";

import { useTranslations } from "next-intl";
import type { PetMood } from "@/lib/game";

const MOOD_EMOJI: Record<PetMood, string> = {
  hungry: "😿",
  content: "🙂",
  happy: "😸",
};

/**
 * A progress fill whose width is applied via a callback ref rather than an inline
 * `style` attribute — keeping the JSX free of inline styles. Starts at 0 (w-0) and
 * animates to the real value on mount, so bars pleasantly fill in on load.
 */
function Fill({ pct, className }: { pct: number; className: string }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-black/[0.07]">
      <div
        ref={(el) => {
          if (el) el.style.width = `${clamped}%`;
        }}
        className={`h-full w-0 rounded-full bg-gradient-to-r transition-[width] duration-500 ${className}`}
      />
    </div>
  );
}

function StatBar({
  icon,
  label,
  value,
  fillClass,
  low = false,
}: {
  icon: string;
  label: string;
  value: number; // 0..100
  fillClass: string;
  low?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-4 text-center text-xs leading-none shrink-0" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex justify-between text-[9px] font-semibold leading-none text-earth-brown/60">
          <span>{label}</span>
          <span className="tabular-nums">{Math.round(value)}</span>
        </div>
        <Fill pct={value} className={`${fillClass} ${low ? "animate-pulse-low" : ""}`} />
      </div>
    </div>
  );
}

/**
 * Compact "care" HUD overlaid on the pet room. Kept deliberately small and quiet
 * (light fill, no drop shadow) so it informs without competing with the pet for
 * attention — the pet is the focal point, this is a glanceable status readout.
 */
export function PetHud({
  level,
  levelProgress,
  satiety,
  affection,
  mood,
}: {
  level: number;
  levelProgress: number; // 0..1
  satiety: number;
  affection: number;
  mood: PetMood;
}) {
  const t = useTranslations("Pet");
  return (
    <div className="w-[9.25rem] rounded-2xl border border-white/70 bg-white/65 p-2.5 backdrop-blur-md flex flex-col gap-1.5 ring-1 ring-black/[0.02]">
      {/* Level + EXP */}
      <div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wide text-purple-600">
            {t("level", { level })}
          </span>
          <span className="text-xs leading-none" aria-hidden>
            ⭐
          </span>
        </div>
        <Fill pct={levelProgress * 100} className="from-fuchsia-400 to-purple-500" />
      </div>

      <StatBar icon="🍗" label={t("satiety")} value={satiety} fillClass="from-amber-400 to-orange-400" low={satiety < 25} />
      <StatBar icon="❤️" label={t("affection")} value={affection} fillClass="from-rose-400 to-pink-500" />

      {/* Mood */}
      <div className="flex items-center gap-1.5 pt-0.5 text-[11px] font-semibold text-earth-brown/75">
        <span className="text-sm leading-none" aria-hidden>
          {MOOD_EMOJI[mood]}
        </span>
        <span>{t(`mood_${mood}`)}</span>
      </div>
    </div>
  );
}
