"use client";

import { useTranslations } from "next-intl";
import { Soup, Gamepad2, ShowerHead, Moon, Sparkles } from "lucide-react";
import type { InteractionKind } from "@/lib/rooms";

// Colored Lucide React icons mapping with beautiful background/border styles.
const META: Record<
  InteractionKind,
  { icon: React.ReactNode; labelKey: string; colorClass: string; bgClass: string }
> = {
  feed: {
    icon: <Soup className="w-5 h-5" />,
    labelKey: "feed",
    colorClass: "text-amber-600",
    bgClass: "bg-amber-50 border-amber-200/60"
  },
  play: {
    icon: <Gamepad2 className="w-5 h-5" />,
    labelKey: "play",
    colorClass: "text-emerald-600",
    bgClass: "bg-emerald-50 border-emerald-200/60"
  },
  clean: {
    icon: <ShowerHead className="w-5 h-5" />,
    labelKey: "clean",
    colorClass: "text-sky-600",
    bgClass: "bg-sky-50 border-sky-200/60"
  },
  sleep: {
    icon: <Moon className="w-5 h-5" />,
    labelKey: "sleep",
    colorClass: "text-indigo-600",
    bgClass: "bg-indigo-50 border-indigo-200/60"
  },
  pat: {
    icon: <Sparkles className="w-5 h-5" />,
    labelKey: "pat",
    colorClass: "text-rose-500",
    bgClass: "bg-rose-50 border-rose-200/60"
  },
};

/**
 * Row of chunky care buttons shown below the pet.
 * `feed` and `play` open the care item/toy picker; the rest fire onInteract immediately.
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
    <div className="flex items-center justify-center gap-3">
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
            className="group flex flex-col items-center gap-1.5 p-2.5 w-[76px] rounded-[24px] border border-white/40 bg-white/60 shadow-sm backdrop-blur-md transition-all duration-150 hover:-translate-y-0.5 hover:bg-white/85 hover:shadow-md active:translate-y-0 active:scale-95 disabled:opacity-50"
          >
            <div className={`flex h-[38px] w-[38px] items-center justify-center rounded-full border ${meta.bgClass} ${meta.colorClass} shadow-inner transition-all duration-150 group-hover:scale-105 group-active:scale-95`}>
              {meta.icon}
            </div>
            <span className="text-[10px] font-black text-theme-text/85 leading-none">
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
