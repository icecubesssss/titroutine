"use client";

import { useTranslations } from "next-intl";
import type { PetMood } from "@/lib/game";

const MOOD_EMOJI: Record<PetMood, string> = {
  hungry: "😿",
  content: "🙂",
  happy: "😸",
};

function Chip({ children, tone = "" }: { children: React.ReactNode; tone?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-bold shadow-[0_1px_3px_rgba(0,0,0,0.05)] backdrop-blur-md ${tone || "text-earth-brown/80"}`}
    >
      {children}
    </span>
  );
}

/**
 * Status read-out shown as small chips *below* the pet (not a side dashboard), so
 * nothing sits beside the character competing for attention — the pet stays the
 * focal point and the stats are a quiet, glanceable strip.
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
  const clamped = Math.max(0, Math.min(100, levelProgress * 100));
  return (
    <div className="flex max-w-full flex-wrap items-center justify-center gap-1.5">
      {/* Mood first — it's the pet's headline state. */}
      <Chip>
        <span className="text-sm leading-none" aria-hidden>
          {MOOD_EMOJI[mood]}
        </span>
        {t(`mood_${mood}`)}
      </Chip>

      {/* Level + a tiny EXP bar (width set via ref → no inline style). */}
      <Chip tone="text-purple-600">
        <span aria-hidden>⭐</span>
        {t("level", { level })}
        <span className="ml-0.5 h-1.5 w-8 overflow-hidden rounded-full bg-black/[0.08]">
          <span
            ref={(el) => {
              if (el) el.style.width = `${clamped}%`;
            }}
            className="block h-full w-0 rounded-full bg-gradient-to-r from-fuchsia-400 to-purple-500 transition-[width] duration-500"
          />
        </span>
      </Chip>

      <Chip tone={satiety < 25 ? "text-orange-600" : "text-earth-brown/80"}>
        <span aria-hidden>🍗</span>
        <span className="tabular-nums">{Math.round(satiety)}</span>
      </Chip>

      <Chip tone="text-rose-500">
        <span aria-hidden>❤️</span>
        <span className="tabular-nums">{Math.round(affection)}</span>
      </Chip>
    </div>
  );
}
