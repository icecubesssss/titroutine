"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import type { InteractionKind } from "@/lib/rooms";

// Custom hand-drawn icons (Gemini). Emoji fallback stays for any kind without art.
const META: Record<InteractionKind, { icon: string | null; emoji: string; labelKey: string }> = {
  feed: { icon: "/assets/ui/action_feed.png", emoji: "🍖", labelKey: "feed" },
  play: { icon: "/assets/ui/action_play.png", emoji: "🧸", labelKey: "play" },
  clean: { icon: "/assets/ui/action_clean.png", emoji: "🚿", labelKey: "clean" },
  sleep: { icon: "/assets/ui/action_sleep.png", emoji: "💤", labelKey: "sleep" },
  pat: { icon: null, emoji: "✋", labelKey: "pat" },
};

/**
 * My-Talking-Tom-style row of chunky care buttons. `feed` opens the food picker
 * (onFeed); the rest fire onInteract with the kind. The icons are full-colour
 * illustrations, so each sits on a soft neutral badge rather than a coloured
 * gradient (which would fight the artwork).
 */
export function InteractionDock({
  interactions,
  onFeed,
  onInteract,
  disabled = false,
}: {
  interactions: InteractionKind[];
  onFeed: () => void;
  onInteract: (kind: InteractionKind) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("Pet");
  return (
    <div className="flex items-end justify-center gap-3">
      {interactions.map((kind) => {
        const meta = META[kind];
        const label = t(`action_${meta.labelKey}`);
        return (
          <button
            key={kind}
            type="button"
            disabled={disabled}
            aria-label={label}
            onClick={() => (kind === "feed" ? onFeed() : onInteract(kind))}
            className="group flex flex-col items-center gap-1.5 disabled:opacity-50"
          >
            {/* Chunky "toy button": glass face + solid base edge that collapses on
                press, so tapping physically pushes the button down. */}
            <span className="flex h-[68px] w-[68px] items-center justify-center rounded-[22px] border border-white/80 bg-gradient-to-b from-white/95 via-white/75 to-white/55 shadow-[0_5px_0_rgba(139,69,19,0.18),0_14px_24px_-10px_rgba(80,50,10,0.35),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl transition-all duration-150 group-hover:-translate-y-0.5 group-hover:shadow-[0_6px_0_rgba(139,69,19,0.18),0_18px_28px_-10px_rgba(80,50,10,0.4),inset_0_1px_0_rgba(255,255,255,0.9)] group-active:translate-y-[5px] group-active:shadow-[0_0_0_rgba(139,69,19,0.18),0_4px_10px_-6px_rgba(80,50,10,0.3),inset_0_1px_0_rgba(255,255,255,0.9)]">
              {meta.icon ? (
                <Image src={meta.icon} alt="" width={52} height={52} className="h-[52px] w-[52px] object-contain drop-shadow transition-transform duration-150 group-hover:scale-105 group-active:scale-95" />
              ) : (
                <span className="text-2xl">{meta.emoji}</span>
              )}
            </span>
            <span className="rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-bold text-earth-brown/85 shadow-[0_1px_3px_rgba(0,0,0,0.06)] backdrop-blur-md">
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
