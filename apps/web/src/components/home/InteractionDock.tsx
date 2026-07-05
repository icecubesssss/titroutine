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
    <div className="flex items-center justify-center gap-2.5">
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
            className="group flex flex-col items-center gap-1.5 p-2.5 w-[72px] rounded-[24px] border border-white/40 bg-white/50 shadow-sm backdrop-blur-md transition-all duration-150 hover:-translate-y-0.5 hover:bg-white/75 hover:shadow-md active:translate-y-0 active:scale-95 disabled:opacity-50"
          >
            <div className="flex h-[36px] w-[36px] items-center justify-center">
              {meta.icon ? (
                <Image
                  src={meta.icon}
                  alt=""
                  width={34}
                  height={34}
                  className="h-[34px] w-[34px] object-contain drop-shadow transition-transform duration-150 group-hover:scale-105"
                />
              ) : (
                <span className="text-xl">{meta.emoji}</span>
              )}
            </div>
            <span className="text-[10px] font-extrabold text-theme-text leading-none">
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
