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
            className="group flex flex-col items-center gap-1 disabled:opacity-50"
          >
            {/* Sleek, neat glassmorphic button matching Astryx aesthetics */}
            <span className="flex h-[56px] w-[56px] items-center justify-center rounded-[20px] border border-white/40 bg-white/50 shadow-sm backdrop-blur-md transition-all duration-150 group-hover:-translate-y-0.5 group-hover:bg-white/75 group-hover:shadow-md group-active:translate-y-0 group-active:scale-95">
              {meta.icon ? (
                <Image src={meta.icon} alt="" width={38} height={38} className="h-[38px] w-[38px] object-contain drop-shadow transition-transform duration-150 group-hover:scale-105" />
              ) : (
                <span className="text-xl">{meta.emoji}</span>
              )}
            </span>
            <span className="rounded-full bg-white/60 px-2 py-0.5 text-[9px] font-bold text-theme-text shadow-[0_1px_3px_rgba(0,0,0,0.05)] backdrop-blur-sm">
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
