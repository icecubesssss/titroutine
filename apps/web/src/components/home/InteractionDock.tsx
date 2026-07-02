"use client";

import { useTranslations } from "next-intl";
import type { InteractionKind } from "@/lib/rooms";

const META: Record<InteractionKind, { emoji: string; labelKey: string; ring: string }> = {
  feed: { emoji: "🍽️", labelKey: "feed", ring: "from-orange-300 to-amber-400" },
  pat: { emoji: "✋", labelKey: "pat", ring: "from-rose-300 to-pink-400" },
  play: { emoji: "🎾", labelKey: "play", ring: "from-lime-300 to-green-400" },
  clean: { emoji: "🛁", labelKey: "clean", ring: "from-sky-300 to-cyan-400" },
  sleep: { emoji: "😴", labelKey: "sleep", ring: "from-indigo-300 to-violet-400" },
};

/**
 * My-Talking-Tom-style row of chunky action buttons for the current room. `feed`
 * opens the food picker (onFeed); the rest fire onInteract with the kind.
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
        return (
          <button
            key={kind}
            type="button"
            disabled={disabled}
            aria-label={t(`action_${meta.labelKey}`)}
            onClick={() => (kind === "feed" ? onFeed() : onInteract(kind))}
            className="group flex flex-col items-center gap-1 disabled:opacity-50"
          >
            <span
              className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-b ${meta.ring} text-2xl shadow-md border-b-4 border-black/10 transition-transform active:translate-y-1 active:border-b-0 group-hover:scale-105`}
            >
              {meta.emoji}
            </span>
            <span className="text-[10px] font-bold text-earth-brown/80">{t(`action_${meta.labelKey}`)}</span>
          </button>
        );
      })}
    </div>
  );
}
