"use client";

import React, { useState, useTransition } from "react";
import { X, ShoppingBag, CheckCircle, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { SHOP_ITEMS } from "@/lib/items";
import { buyItemAction, equipItemAction } from "@/app/[locale]/actions";

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  unlockedItems: string[];
  equippedItems: Record<string, string>;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  isOpen,
  onClose,
  coins,
  unlockedItems,
  equippedItems,
}) => {
  const [activeTab, setActiveTab] = useState<"shop" | "inventory">("shop");
  const [, startTransition] = useTransition();
  const router = useRouter();

  if (!isOpen) return null;

  const handleBuy = (itemId: string, price: number) => {
    if (coins < price) return;
    startTransition(async () => {
      await buyItemAction(itemId, price);
      router.refresh();
    });
  };

  const handleEquip = (slot: string, itemId: string) => {
    startTransition(async () => {
      await equipItemAction(slot, itemId);
      router.refresh();
    });
  };

  const handleUnequip = (slot: string) => {
    startTransition(async () => {
      await equipItemAction(slot, null);
      router.refresh();
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#fffaf0] rounded-3xl shadow-2xl overflow-hidden border-4 border-[#e8dcc7] flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="pt-6 pb-4 px-6 flex items-center justify-between border-b-2 border-[#e8dcc7] bg-white sticky top-0 z-10">
          <h2 className="text-2xl font-black text-amber-900 flex items-center gap-2">
            <ShoppingBag className="text-amber-600" /> Cửa Hàng
          </h2>
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 text-amber-900 px-3 py-1 rounded-full font-bold text-sm shadow-sm flex items-center gap-1">
              <span>💰</span> {coins} Xu
            </div>
            <button
              aria-label="Đóng"
              title="Đóng"
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
            onClick={() => setActiveTab("shop")}
            className={`pb-3 px-2 font-bold text-sm flex items-center gap-2 border-b-4 transition-colors ${
              activeTab === "shop"
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-stone-400 hover:text-stone-600"
            }`}
          >
            <ShoppingBag size={16} /> Mua Đồ
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`pb-3 px-2 font-bold text-sm flex items-center gap-2 border-b-4 transition-colors ${
              activeTab === "inventory"
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-stone-400 hover:text-stone-600"
            }`}
          >
            <Package size={16} /> Kho Đồ ({unlockedItems.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === "shop" && (
            <div className="grid grid-cols-2 gap-4">
              {SHOP_ITEMS.map((item) => {
                const isOwned = unlockedItems.includes(item.id);
                const canAfford = coins >= item.price;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border-2 border-[#f0e6d2] p-3 flex flex-col shadow-sm"
                  >
                    <div className="aspect-square bg-stone-50 rounded-xl mb-3 flex items-center justify-center border border-stone-100 relative overflow-hidden">
                      {/* Fake Image preview, real image would use next/image */}
                      <div className="text-4xl">
                        {item.slot === "wallpaper" ? "🖼️" : item.slot === "outfit" ? "👗" : "🧶"}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-stone-700 text-sm">{item.name}</h3>
                      <p className="text-xs text-stone-500 line-clamp-1">{item.description}</p>
                    </div>
                    <div className="mt-3">
                      {isOwned ? (
                        <div className="w-full text-center py-1.5 bg-stone-100 text-stone-500 rounded-lg text-xs font-bold flex items-center justify-center gap-1">
                          <CheckCircle size={14} /> Đã Sở Hữu
                        </div>
                      ) : (
                        <button
                          onClick={() => handleBuy(item.id, item.price)}
                          disabled={!canAfford}
                          className={`w-full py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            canAfford
                              ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                              : "bg-stone-100 text-stone-400 cursor-not-allowed"
                          }`}
                        >
                          💰 {item.price} Xu
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
                  Bạn chưa có đồ vật nào.
                </div>
              ) : (
                SHOP_ITEMS.filter((item) => unlockedItems.includes(item.id)).map((item) => {
                  const isEquipped = equippedItems[item.slot] === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`bg-white rounded-2xl border-2 p-3 flex flex-col shadow-sm transition-all ${
                        isEquipped ? "border-amber-400 bg-amber-50/30" : "border-[#f0e6d2]"
                      }`}
                    >
                      <div className="aspect-square bg-stone-50 rounded-xl mb-3 flex items-center justify-center border border-stone-100">
                        <div className="text-4xl">
                          {item.slot === "wallpaper" ? "🖼️" : item.slot === "outfit" ? "👗" : "🧶"}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-stone-700 text-sm">{item.name}</h3>
                        <p className="text-xs text-stone-400 uppercase font-bold mt-1">
                          {item.slot}
                        </p>
                      </div>
                      <div className="mt-3 flex gap-2">
                        {isEquipped ? (
                          <button
                            onClick={() => handleUnequip(item.slot)}
                            className="w-full py-1.5 rounded-lg text-xs font-bold border-2 border-stone-200 text-stone-500 hover:bg-stone-50 transition-colors"
                          >
                            Gỡ ra
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEquip(item.slot, item.id)}
                            className="w-full py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 shadow-sm shadow-amber-200 transition-colors"
                          >
                            Trang bị
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
