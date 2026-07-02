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
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/60 bg-white/70 shadow-[0_2px_8px_rgba(0,0,0,0.08)] backdrop-blur-md transition-transform active:translate-y-1 group-hover:scale-105 group-active:scale-95">
              {meta.icon ? (
                <Image src={meta.icon} alt="" width={52} height={52} className="h-[52px] w-[52px] object-contain drop-shadow-sm" />
              ) : (
                <span className="text-2xl">{meta.emoji}</span>
              )}
            </span>
            <span className="text-[10px] font-bold text-earth-brown/80">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
