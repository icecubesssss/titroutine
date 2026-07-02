"use client";

import React, { useState, useTransition } from "react";
import { X, ShoppingBag, CheckCircle, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { SHOP_ITEMS } from "@/lib/items";
import { buyItemAction, equipItemAction } from "@/app/[locale]/actions";

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  unlockedItems: string[];
  equippedItems: Record<string, string>;
  /** Optimistically adjust the parent's coin balance (reconciled by refresh). */
  onSpend?: (amount: number) => void;
  /** Fired optimistically when an item is (un)equipped — itemId null = unequip. */
  onEquipped?: (slot: string, itemId: string | null) => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  isOpen,
  onClose,
  coins,
  unlockedItems,
  equippedItems,
  onSpend,
  onEquipped,
}) => {
  const t = useTranslations("Shop");
  const [activeTab, setActiveTab] = useState<"shop" | "inventory">("shop");
  const [, startTransition] = useTransition();
  // Optimistic "just bought" set + a purchase error so a buy never fails silently.
  const [justBought, setJustBought] = useState<Set<string>>(() => new Set());
  // Optimistic equip overrides (slot -> itemId | null) layered over server truth,
  // so the button flips instantly instead of waiting for router.refresh().
  const [localEquipped, setLocalEquipped] = useState<Record<string, string | null>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!isOpen) return null;

  const equippedFor = (slot: string): string | null =>
    slot in localEquipped ? localEquipped[slot] : equippedItems[slot] ?? null;

  const handleBuy = (itemId: string, price: number) => {
    if (pendingId) return;
    setError(null);
    if (coins < price) {
      setError(t("notEnough"));
      return;
    }
    // Optimistic: mark owned + deduct coins immediately for instant feedback.
    setPendingId(itemId);
    setJustBought((prev) => new Set(prev).add(itemId));
    onSpend?.(price);
    startTransition(async () => {
      const res = await buyItemAction(itemId, price);
      if (res?.error) {
        // Revert the optimistic changes and surface why it failed.
        setJustBought((prev) => {
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });
        onSpend?.(-price);
        setError(res.error === "not_enough_coins" ? t("notEnough") : t("buyFailed"));
      }
      setPendingId(null);
      router.refresh();
    });
  };

  // Optimistic (un)equip: flip the button + notify the parent immediately, then
  // reconcile with the server — reverting and surfacing the error if it failed.
  const commitEquip = (slot: string, itemId: string | null) => {
    setError(null);
    const previous = equippedFor(slot);
    setLocalEquipped((prev) => ({ ...prev, [slot]: itemId }));
    onEquipped?.(slot, itemId);
    startTransition(async () => {
      const res = await equipItemAction(slot, itemId);
      if (res?.error) {
        setLocalEquipped((prev) => ({ ...prev, [slot]: previous }));
        setError(t("equipFailed"));
        return;
      }
      router.refresh();
    });
  };

  const handleEquip = (slot: string, itemId: string) => commitEquip(slot, itemId);
  const handleUnequip = (slot: string) => commitEquip(slot, null);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#fffaf0] rounded-3xl shadow-2xl overflow-hidden border-4 border-[#e8dcc7] flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="pt-6 pb-4 px-6 flex items-center justify-between border-b-2 border-[#e8dcc7] bg-white sticky top-0 z-10">
          <h2 className="text-2xl font-black text-amber-900 flex items-center gap-2">
            <ShoppingBag className="text-amber-600" /> {t("title")}
          </h2>
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 text-amber-900 px-3 py-1 rounded-full font-bold text-sm shadow-sm flex items-center gap-1">
              <span>💰</span> {t("coins", { count: coins })}
            </div>
            <button
              type="button"
              aria-label={t("close")}
              title={t("close")}
              onClick={onClose}
              className="p-2 rounded-full bg-stone-100 hover:bg-stone-200 transition-colors text-stone-500"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-6 pt-4 gap-4 border-b-2 border-stone-100 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab("shop")}
            className={`pb-3 px-2 font-bold text-sm flex items-center gap-2 border-b-4 transition-colors ${
              activeTab === "shop"
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-stone-400 hover:text-stone-600"
            }`}
          >
            <ShoppingBag size={16} /> {t("tabShop")}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("inventory")}
            className={`pb-3 px-2 font-bold text-sm flex items-center gap-2 border-b-4 transition-colors ${
              activeTab === "inventory"
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-stone-400 hover:text-stone-600"
            }`}
          >
            <Package size={16} /> {t("tabInventory")} ({unlockedItems.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="rounded-xl border-2 border-red-100 bg-red-50 px-3 py-2 text-sm font-bold text-red-500">
              {error}
            </div>
          )}
          {activeTab === "shop" && (
            <div className="grid grid-cols-2 gap-4">
              {SHOP_ITEMS.map((item) => {
                const isOwned = unlockedItems.includes(item.id) || justBought.has(item.id);
                const canAfford = coins >= item.price;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border-2 border-[#f0e6d2] p-3 flex flex-col shadow-sm"
                  >
                    <div className="aspect-square bg-stone-50 rounded-xl mb-3 flex items-center justify-center border border-stone-100 relative overflow-hidden">
                      <Image src={item.imageUrl} alt={t(`item_${item.id}_name`)} fill className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-stone-700 text-sm">{t(`item_${item.id}_name`)}</h3>
                      <p className="text-xs text-stone-500 line-clamp-1">{t(`item_${item.id}_desc`)}</p>
                    </div>
                    <div className="mt-3">
                      {isOwned ? (
                        <div className="w-full text-center py-1.5 bg-stone-100 text-stone-500 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
                          <CheckCircle size={14} /> {t("owned")}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleBuy(item.id, item.price)}
                          disabled={!canAfford || pendingId === item.id}
                          className={`w-full py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            canAfford
                              ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                              : "bg-stone-100 text-stone-400 cursor-not-allowed"
                          }`}
                        >
                          💰 {t("price", { price: item.price })}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "inventory" && (
            <div className="grid grid-cols-2 gap-4">
              {unlockedItems.length === 0 ? (
                <div className="col-span-2 py-12 text-center text-stone-400 font-medium flex flex-col items-center gap-2">
                  <Package className="w-12 h-12 text-stone-300" />
                  {t("emptyInventory")}
                </div>
              ) : (
                SHOP_ITEMS.filter((item) => unlockedItems.includes(item.id)).map((item) => {
                  const isEquipped = equippedFor(item.slot) === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`bg-white rounded-2xl border-2 p-3 flex flex-col shadow-sm transition-all ${
                        isEquipped ? "border-amber-400 bg-amber-50/30" : "border-[#f0e6d2]"
                      }`}
                    >
                      <div className="aspect-square bg-stone-50 rounded-xl mb-3 flex items-center justify-center border border-stone-100 relative overflow-hidden">
                        <Image src={item.imageUrl} alt={t(`item_${item.id}_name`)} fill className="object-cover" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-stone-700 text-sm">{t(`item_${item.id}_name`)}</h3>
                        <p className="text-xs text-stone-400 uppercase font-bold mt-1">
                          {t(`slot_${item.slot}`)}
                        </p>
                      </div>
                      <div className="mt-3 flex gap-2">
                        {isEquipped ? (
                          <button
                            type="button"
                            onClick={() => handleUnequip(item.slot)}
                            className="w-full py-1.5 rounded-lg text-xs font-bold border-2 border-stone-200 text-stone-500 hover:bg-stone-50 transition-colors"
                          >
                            {t("unequip")}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleEquip(item.slot, item.id)}
                            className="w-full py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 shadow-sm shadow-amber-200 transition-colors"
                          >
                            {t("equip")}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
