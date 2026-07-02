"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { FOOD_TIERS } from "@/lib/game";

/**
 * Bottom-sheet food picker. Each tier restores satiety and (when the pet is
 * hungry) grants nurture EXP; disabled when the user can't afford it.
 */
export function FeedPicker({
  isOpen,
  coins,
  onClose,
  onFeed,
}: {
  isOpen: boolean;
  coins: number;
  onClose: () => void;
  onFeed: (tierId: string) => void;
}) {
  const t = useTranslations("Pet");
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-3xl bg-earth-bg p-5 shadow-2xl animate-sheet-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-black text-earth-brown">{t("feedTitle")}</h3>
          <span className="flex items-center gap-1 rounded-full bg-white px-3 py-1 text-sm font-bold text-yellow-600 shadow-sm">
            <Image src="/assets/ui/icon_coin.png" alt="" width={16} height={16} className="h-4 w-4 object-contain" />
            {coins}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {FOOD_TIERS.map((tier) => {
            const affordable = coins >= tier.cost;
            return (
              <button
                key={tier.id}
                type="button"
                disabled={!affordable}
                onClick={() => {
                  onFeed(tier.id);
                  onClose();
                }}
                className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 border-b-4 bg-white p-3 transition-all ${
                  affordable
                    ? "border-gray-200 hover:border-orange-300 active:translate-y-0.5 active:border-b-2"
                    : "border-gray-100 opacity-50"
                }`}
              >
                <Image
                  src={`/assets/ui/food/food_${tier.id}.png`}
                  alt=""
                  width={56}
                  height={56}
                  className="h-14 w-14 object-contain drop-shadow-sm"
                />
                <span className="text-xs font-bold text-earth-text">{t(`food_${tier.id}`)}</span>
                <span className="flex items-center gap-0.5 text-[11px] font-black text-yellow-600">
                  <Image src="/assets/ui/icon_coin.png" alt="" width={13} height={13} className="h-[13px] w-[13px] object-contain" />
                  {tier.cost}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
