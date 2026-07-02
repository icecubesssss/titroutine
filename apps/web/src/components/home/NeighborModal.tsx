"use client";

import { useTranslations } from "next-intl";
import { X, Gift } from "lucide-react";
import { NEIGHBORS } from "@/lib/neighbors";
import { RabbitCompanion } from "@/components/pet/RabbitCompanion";
import { NEIGHBOR_GIFT_COINS } from "@/lib/game";

/**
 * The NPC neighbourhood. Visiting a neighbour ("chơi cùng") claims a once-per-day
 * gift. All neighbours share the same daily gift, so once claimed every card shows
 * the claimed state.
 */
export function NeighborModal({
  isOpen,
  canClaim,
  onClose,
  onVisit,
}: {
  isOpen: boolean;
  canClaim: boolean;
  onClose: () => void;
  onVisit: () => void;
}) {
  const t = useTranslations("Neighbors");
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-3xl bg-earth-bg p-5 shadow-2xl animate-sheet-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-lg font-black text-earth-brown">🏘️ {t("title")}</h3>
          <button type="button" aria-label={t("close")} onClick={onClose} className="rounded-full p-1 hover:bg-black/5">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <p className="mb-4 text-xs text-gray-500">
          {canClaim ? t("giftHint", { coins: NEIGHBOR_GIFT_COINS }) : t("giftClaimed")}
        </p>

        <div className="grid grid-cols-3 gap-3">
          {NEIGHBORS.map((n) => (
            <button
              key={n.id}
              type="button"
              disabled={!canClaim}
              onClick={onVisit}
              className={`flex flex-col items-center gap-1 rounded-2xl border-2 border-b-4 p-2 transition-all ${
                n.houseBg
              } ${
                canClaim
                  ? "border-white/60 hover:brightness-105 active:translate-y-0.5 active:border-b-2"
                  : "border-white/40 opacity-60"
              }`}
            >
              <div className="h-16 w-full overflow-hidden flex items-end justify-center pointer-events-none">
                <RabbitCompanion stage={n.stage} action="welcome" className="scale-[0.35] origin-bottom" />
              </div>
              <span className="text-xs font-bold text-earth-brown">
                {n.emoji} {t(n.nameKey)}
              </span>
              <span
                className={`flex items-center gap-0.5 text-[10px] font-black ${
                  canClaim ? "text-orange-500" : "text-gray-400"
                }`}
              >
                <Gift className="h-3 w-3" /> {canClaim ? t("visit") : t("done")}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
