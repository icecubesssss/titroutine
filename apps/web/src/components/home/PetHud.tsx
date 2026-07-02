"use client";

import { useTranslations } from "next-intl";
import type { PetMood } from "@/lib/game";

const MOOD_EMOJI: Record<PetMood, string> = {
  hungry: "😿",
  content: "🙂",
  happy: "😸",
};

function StatBar({
  icon,
  label,
  value,
  colorClass,
  low = false,
}: {
  icon: string;
  label: string;
  value: number; // 0..100
  colorClass: string;
  low?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm w-5 text-center shrink-0" aria-hidden>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between text-[9px] font-bold text-earth-brown/70 leading-none mb-0.5">
          <span>{label}</span>
          <span className="tabular-nums">{Math.round(value)}</span>
        </div>
        <div className="h-2 rounded-full bg-black/10 overflow-hidden">
          <div
            className={`h-full rounded-full transition-[width] duration-500 ${colorClass} ${low ? "animate-pulse-low" : ""}`}
            style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Compact "care" HUD overlaid on the pet room: nurture level (+ EXP progress),
 * satiety, bond and mood. Streak/coins stay in the top bar.
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
    <div className="w-40 rounded-2xl bg-white/75 backdrop-blur-md p-2.5 shadow-sm flex flex-col gap-2 border border-white/60">
      {/* Level + EXP */}
      <div>
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[10px] font-black uppercase tracking-wide text-purple-600">
            {t("level", { level })}
          </span>
          <span className="text-sm" aria-hidden>
            ⭐
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-black/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-fuchsia-400 to-purple-500 transition-[width] duration-500"
            style={{ width: `${Math.round(levelProgress * 100)}%` }}
          />
        </div>
      </div>

      <StatBar icon="🍗" label={t("satiety")} value={satiety} colorClass="bg-orange-400" low={satiety < 25} />
      <StatBar icon="❤️" label={t("affection")} value={affection} colorClass="bg-rose-400" />

      {/* Mood */}
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-earth-brown/80">
        <span className="text-base" aria-hidden>
          {MOOD_EMOJI[mood]}
        </span>
        <span>{t(`mood_${mood}`)}</span>
      </div>
    </div>
  );
}
