"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import type { PetMood } from "@/lib/game";

/** Small hand-drawn chip icon (Gemini). */
function ChipIcon({ src, size = 18 }: { src: string; size?: number }) {
  return (
    <Image
      src={src}
      alt=""
      width={size}
      height={size}
      className="shrink-0 object-contain drop-shadow-sm"
      aria-hidden
    />
  );
}

/** Mini progress gauge (width set via ref → no inline style). */
function Gauge({ value, barClass, pulse = false }: { value: number; barClass: string; pulse?: boolean }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <span className="h-1.5 w-9 shrink-0 overflow-hidden rounded-full bg-earth-brown/10 shadow-[inset_0_1px_1px_rgba(0,0,0,0.06)]">
      <span
        ref={(el) => {
          if (el) el.style.width = `${clamped}%`;
        }}
        className={`block h-full w-0 rounded-full transition-[width] duration-500 ${barClass} ${pulse ? "animate-pulse-low" : ""}`}
      />
    </span>
  );
}

function Divider() {
  return <span className="h-5 w-px shrink-0 bg-earth-brown/10" aria-hidden />;
}

/**
 * Status read-out shown as one frosted-glass bar *below* the pet (not a side
 * dashboard), so nothing sits beside the character competing for attention.
 * Satiety/bond read as tiny gauges instead of bare numbers — glanceable state,
 * exact values stay available via the title tooltips.
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
  const lowSatiety = satiety < 25;
  return (
    <div className="inline-flex max-w-full items-center gap-2.5 rounded-2xl border border-white/70 bg-white/65 px-3.5 py-2 shadow-[0_10px_28px_-10px_rgba(93,64,28,0.35),inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-xl">
      {/* Mood first — it's the pet's headline state. */}
      <span className="flex items-center gap-1.5 whitespace-nowrap text-[11px] font-bold text-earth-brown/85">
        <ChipIcon src={`/assets/ui/mood_${mood}.png`} />
        {t(`mood_${mood}`)}
      </span>

      <Divider />

      {/* Nurture level + EXP progress. */}
      <span
        className="flex items-center gap-1.5 whitespace-nowrap text-[11px] font-bold text-purple-600"
        title={t("level", { level })}
      >
        <ChipIcon src="/assets/ui/icon_level.png" size={16} />
        {t("level", { level })}
        <Gauge value={levelProgress * 100} barClass="bg-gradient-to-r from-fuchsia-400 to-purple-500" />
      </span>

      <Divider />

      {/* Satiety gauge — turns orange and pulses when the pet is getting hungry. */}
      <span
        className="flex items-center gap-1.5"
        title={`${t("satiety")}: ${Math.round(satiety)}/100`}
      >
        <ChipIcon src="/assets/ui/icon_satiety.png" size={16} />
        <Gauge
          value={satiety}
          pulse={lowSatiety}
          barClass={lowSatiety ? "bg-gradient-to-r from-orange-400 to-red-400" : "bg-gradient-to-r from-amber-300 to-orange-400"}
        />
      </span>

      <Divider />

      {/* Bond / affection gauge. */}
      <span className="flex items-center gap-1.5" title={`${t("affection")}: ${Math.round(affection)}/100`}>
        <ChipIcon src="/assets/ui/icon_bond.png" size={16} />
        <Gauge value={affection} barClass="bg-gradient-to-r from-rose-300 to-pink-500" />
      </span>
    </div>
  );
}
