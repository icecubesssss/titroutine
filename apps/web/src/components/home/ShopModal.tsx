"use client";

import React, { useState, useTransition, useMemo } from "react";
import { X, ShoppingBag, CheckCircle, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { SHOP_ITEMS } from "@/lib/items";
import { buyItemAction, equipItemAction, buyConsumableAction, buyFocusItemAction } from "@/app/[locale]/actions";

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  coins: number;
  focusTokens?: number; // Add focusTokens
  unlockedItems: string[];
  equippedItems: Record<string, string>;
  consumables?: Record<string, number>; // new prop containing count
  onSpend?: (amount: number) => void;
  onEquipped?: (slot: string, itemId: string | null) => void;
}

const FOCUS_ITEMS_CATALOGUE = [
  { id: "matcha_tea", price: 50, name: "Trà Matcha Tĩnh Tâm 🍵", desc: "Trà ấm thanh tịnh (+15 Thân thiết)" },
  { id: "magic_book", price: 120, name: "Sách Cổ Thần Kỳ 📖", desc: "Sách phép thuật cổ xưa (+40 Thân thiết)" },
  { id: "focus_cushion", price: 80, name: "Đệm Ngồi Thiền Định 🧘", desc: "Đệm êm ái tăng sức dẻo dai (+25 Thân thiết)" },
];

const CONSUMABLES_CATALOGUE = [
  { id: "carrot", price: 15, name: "Cà rốt tươi ngon 🥕", desc: "Đồ ăn lý tưởng (+15 No)" },
  { id: "cake", price: 35, name: "Bánh kem ngọt 🍰", desc: "Bánh kem bơ thơm ngọt (+30 No)" },
  { id: "feast", price: 60, name: "Đại tiệc thịnh soạn 🍲", desc: "Mâm cỗ đầy ắp (+60 No)" },
  { id: "toy_ball", price: 25, name: "Bóng cao su ⚽", desc: "Chạy nhảy năng động (+6 Thân thiết)" },
  { id: "toy_bear", price: 45, name: "Gấu bông ấm áp 🧸", desc: "Gấu mềm dễ thương (+10 Thân thiết)" },
];

export const ShopModal: React.FC<ShopModalProps> = ({
  isOpen,
  onClose,
  coins,
  focusTokens = 0,
  unlockedItems,
  equippedItems,
  consumables = { carrot: 0, cake: 0, feast: 0, toy_ball: 0, toy_bear: 0 },
  onSpend,
  onEquipped,
}) => {
  const t = useTranslations("Shop");
  const [activeTab, setActiveTab] = useState<"shop" | "focus_shop" | "inventory">("shop");
  const [, startTransition] = useTransition();
  const [justBought, setJustBought] = useState<Set<string>>(() => new Set());
  const [localEquipped, setLocalEquipped] = useState<Record<string, string | null>>({});
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // 1. Quản lý trạng thái xem thử phòng (Room Preview)
  const [previewWallpaper, setPreviewWallpaper] = useState<string | null>(equippedItems["wallpaper"] || null);
  const [previewRug, setPreviewRug] = useState<string | null>(equippedItems["rug"] || null);
  const [previewObject, setPreviewObject] = useState<string | null>(equippedItems["object"] || null);

  const previewWallpaperItem = useMemo(() => SHOP_ITEMS.find(item => item.id === previewWallpaper), [previewWallpaper]);
  const previewRugItem = useMemo(() => SHOP_ITEMS.find(item => item.id === previewRug), [previewRug]);
  const previewObjectItem = useMemo(() => SHOP_ITEMS.find(item => item.id === previewObject), [previewObject]);

  // Reset xem thử về trạng thái thực tế
  const handleResetPreview = () => {
    setPreviewWallpaper(equippedItems["wallpaper"] || null);
    setPreviewRug(equippedItems["rug"] || null);
    setPreviewObject(equippedItems["object"] || null);
  };

  // 2. Thuật toán xoay tua 4 món đồ nội thất ngẫu nhiên cố định theo ngày
  const rotatedPermanentItems = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0] || "2026-07-04";
    let hash = 0;
    for (let i = 0; i < todayStr.length; i++) {
      hash = todayStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const shuffle = [...SHOP_ITEMS];
    for (let i = shuffle.length - 1; i > 0; i--) {
      const rand = Math.abs((hash + i) % (i + 1));
      const temp = shuffle[i]!;
      shuffle[i] = shuffle[rand]!;
      shuffle[rand] = temp;
    }
    return shuffle.slice(0, 4);
  }, []);

  if (!isOpen) return null;

  const equippedFor = (slot: string): string | null =>
    slot in localEquipped ? localEquipped[slot] : equippedItems[slot] ?? null;

  // Xử lý mua đồ nội thất vĩnh viễn
  const handleBuy = (itemId: string, price: number) => {
    if (pendingId) return;
    setError(null);
    if (coins < price) {
      setError(t("notEnough"));
      return;
    }
    setPendingId(itemId);
    setJustBought((prev) => new Set(prev).add(itemId));
    onSpend?.(price);
    startTransition(async () => {
      const res = await buyItemAction(itemId, price);
      if (res?.error) {
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

  // Xử lý mua đồ ăn / đồ chơi tiêu dùng
  const handleBuyConsumable = (itemId: string, price: number) => {
    if (pendingId) return;
    setError(null);
    if (coins < price) {
      setError(t("notEnough"));
      return;
    }
    setPendingId(itemId);
    onSpend?.(price);
    startTransition(async () => {
      const res = await buyConsumableAction(itemId, price);
      if (res?.error) {
        onSpend?.(-price);
        setError(t("buyFailed"));
      }
      setPendingId(null);
      router.refresh();
    });
  };

  const handleBuyFocusItem = (itemId: string, price: number) => {
    if (pendingId) return;
    setError(null);
    if (focusTokens < price) {
      setError("Không đủ Focus Tokens! Hãy tập trung hoàn thành công việc.");
      return;
    }
    setPendingId(itemId);
    startTransition(async () => {
      const res = await buyFocusItemAction(itemId, price);
      if (res?.error) {
        setError(res.error === "not_enough_tokens" ? "Không đủ Focus Tokens!" : "Mua thất bại");
      }
      setPendingId(null);
      router.refresh();
    });
  };

  // Trang bị nội thất
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
      <div className="w-full max-w-md bg-[#fdfaf6] rounded-3xl shadow-2xl overflow-hidden border-4 border-[#ebdcc5] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="pt-6 pb-4 px-6 flex items-center justify-between border-b-2 border-[#ebdcc5] bg-white sticky top-0 z-10">
          <h2 className="text-xl font-black text-[#5c4033] flex items-center gap-2">
            🛒 Cửa Hàng Cozy
          </h2>
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 text-amber-900 px-3 py-1 rounded-full font-black text-sm shadow-sm flex items-center gap-1">
              <Image src="/assets/ui/icon_coin.png" alt="" width={16} height={16} className="h-4 w-4 object-contain" />
              <span>{coins}</span>
            </div>
            <div className="bg-orange-100 text-orange-950 px-3 py-1 rounded-full font-black text-xs shadow-sm flex items-center gap-1" title="Focus Tokens">
              <span>🎯</span>
              <span>{focusTokens}</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng"
              className="p-1.5 rounded-full bg-stone-100 hover:bg-stone-200 transition-colors text-stone-500"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex px-6 pt-3 gap-4 border-b border-stone-100 bg-white shadow-sm overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("shop")}
            className={`pb-2.5 px-1 font-bold text-sm flex items-center gap-1.5 border-b-4 transition-colors shrink-0 ${
              activeTab === "shop"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-stone-400 hover:text-stone-600"
            }`}
          >
            <ShoppingBag size={15} /> Mua sắm
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("focus_shop")}
            className={`pb-2.5 px-1 font-bold text-sm flex items-center gap-1.5 border-b-4 transition-colors shrink-0 ${
              activeTab === "focus_shop"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-stone-400 hover:text-stone-600"
            }`}
          >
            🎯 Đồ tập trung
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("inventory");
              handleResetPreview();
            }}
            className={`pb-2.5 px-1 font-bold text-sm flex items-center gap-1.5 border-b-4 transition-colors shrink-0 ${
              activeTab === "inventory"
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-stone-400 hover:text-stone-600"
            }`}
          >
            <Package size={15} /> Kho đồ nội thất
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-[#fdfaf6]">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-500">
              {error}
            </div>
          )}

          {/* 1. ROOM PREVIEW CONTAINER: Hiển thị khi ở tab Shop */}
          {(activeTab === "shop" || activeTab === "focus_shop") && (
            <div className="relative w-full h-36 bg-[#f0e6d2]/50 rounded-2xl overflow-hidden border-2 border-[#ebdcc5] shadow-inner flex items-center justify-center">
              {/* Preview Wallpaper */}
              {previewWallpaperItem ? (
                <Image src={previewWallpaperItem.imageUrl} alt="" fill className="object-cover pointer-events-none" />
              ) : (
                <div className="absolute inset-0 bg-[#e3d3b7] opacity-80" />
              )}
              
              {/* Preview Rug */}
              {previewRugItem && (
                <Image
                  src={previewRugItem.imageUrl}
                  alt=""
                  width={140}
                  height={70}
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 object-contain pointer-events-none drop-shadow-sm"
                />
              )}

              {/* Preview Object */}
              {previewObjectItem && (
                <Image
                  src={previewObjectItem.imageUrl}
                  alt=""
                  width={60}
                  height={60}
                  className="absolute bottom-2 left-4 w-12 h-12 object-contain pointer-events-none drop-shadow-sm"
                />
              )}

              <div className="absolute bottom-2 right-2 text-[9px] bg-black/60 text-white rounded-full px-2 py-0.5 font-bold z-10">
                🐰 Phòng Thử Đồ
              </div>

              {(previewWallpaper !== equippedItems["wallpaper"] ||
                previewRug !== equippedItems["rug"] ||
                previewObject !== equippedItems["object"]) && (
                <button
                  onClick={handleResetPreview}
                  className="absolute top-2 right-2 text-[9px] bg-orange-500 hover:bg-orange-600 text-white rounded-full px-2 py-0.5 font-bold z-10 transition-colors"
                >
                  Đặt lại
                </button>
              )}
            </div>
          )}

          {activeTab === "shop" && (
            <div className="space-y-6">
              {/* Bánh kẹo & Đồ chơi */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1">
                  🍭 Quầy đồ ăn & đồ chơi tiêu dùng
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {CONSUMABLES_CATALOGUE.map((item) => {
                    const canAfford = coins >= item.price;
                    const countInInv = consumables[item.id] ?? 0;
                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-2xl border-2 border-[#ebdcc5] p-3 flex flex-col justify-between shadow-sm"
                      >
                        <div className="flex gap-2.5 items-start">
                          <span className="text-3xl select-none pt-0.5 w-12 h-12 flex items-center justify-center">
                            {item.id === "carrot" ? (
                              <Image src="/assets/ui/food/food_carrot.png" alt="Carrot" width={40} height={40} className="object-contain" />
                            ) : item.id === "cake" ? (
                              <Image src="/assets/ui/food/food_cake.png" alt="Cake" width={40} height={40} className="object-contain" />
                            ) : item.id === "feast" ? (
                              <Image src="/assets/ui/food/food_feast.png" alt="Feast" width={40} height={40} className="object-contain" />
                            ) : item.id === "toy_ball" ? (
                              "⚽"
                            ) : (
                              "🧸"
                            )}
                          </span>
                          <div className="flex-1">
                            <h4 className="font-bold text-[#5c4033] text-[11px] leading-tight">{item.name}</h4>
                            <p className="text-[9px] text-[#8b7355] mt-0.5 leading-tight">{item.desc}</p>
                            <span className="inline-block mt-1 text-[8px] bg-stone-100 text-stone-500 px-1 rounded font-bold">
                              Trong kho: {countInInv}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleBuyConsumable(item.id, item.price)}
                          disabled={!canAfford || pendingId === item.id}
                          className={`w-full mt-3 py-1.5 rounded-xl text-[10px] font-black flex items-center justify-center gap-0.5 transition-colors ${
                            canAfford
                              ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                              : "bg-stone-100 text-stone-400 cursor-not-allowed"
                          }`}
                        >
                          <Image src="/assets/ui/icon_coin.png" alt="" width={12} height={12} className="h-3 w-3 object-contain" />
                          {item.price}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Kệ nội thất xoay tua ngày */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                  <span>🪵 Quầy nội thất xoay tua hôm nay</span>
                  <span className="text-[9px] font-normal text-orange-500 italic">Làm mới sau 00:00</span>
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {rotatedPermanentItems.map((item) => {
                    const isOwned = unlockedItems.includes(item.id) || justBought.has(item.id);
                    const canAfford = coins >= item.price;

                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (item.slot === "wallpaper") setPreviewWallpaper(item.id);
                          if (item.slot === "rug") setPreviewRug(item.id);
                          if (item.slot === "object") setPreviewObject(item.id);
                        }}
                        className={`bg-white rounded-2xl border-2 p-3 flex flex-col justify-between shadow-sm cursor-pointer transition-all hover:scale-[1.02] ${
                          previewWallpaper === item.id || previewRug === item.id || previewObject === item.id
                            ? "border-orange-400 ring-2 ring-orange-200"
                            : "border-[#ebdcc5]"
                        }`}
                      >
                        <div className="aspect-square bg-stone-50 rounded-xl mb-2 flex items-center justify-center border border-stone-100 relative overflow-hidden">
                          <Image src={item.imageUrl} alt={t(`item_${item.id}_name`)} fill className="object-cover" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-[#5c4033] text-[11px] leading-tight">{t(`item_${item.id}_name`)}</h4>
                          <span className="text-[8px] text-gray-400 uppercase font-black tracking-wider block mt-0.5">
                            {t(`slot_${item.slot}`)}
                          </span>
                        </div>
                        <div className="mt-2.5">
                          {isOwned ? (
                            <div className="w-full text-center py-1 bg-stone-100 text-stone-500 rounded-lg text-[9px] font-bold flex items-center justify-center gap-0.5">
                              <CheckCircle size={10} /> Đã có
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleBuy(item.id, item.price);
                              }}
                              disabled={!canAfford || pendingId === item.id}
                              className={`w-full py-1 rounded-lg text-[9px] font-black flex items-center justify-center gap-0.5 transition-colors ${
                                canAfford
                                  ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                  : "bg-stone-100 text-stone-400 cursor-not-allowed"
                              }`}
                            >
                              <Image src="/assets/ui/icon_coin.png" alt="" width={12} height={12} className="h-3 w-3 object-contain" />
                              {item.price}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === "focus_shop" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1">
                  🎯 Quầy đồ tập trung (Focus Tokens)
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {FOCUS_ITEMS_CATALOGUE.map((item) => {
                    const canAfford = focusTokens >= item.price;
                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-2xl border-2 border-[#ebdcc5] p-3 flex flex-col justify-between shadow-sm"
                      >
                        <div className="flex gap-2.5 items-start">
                          <span className="text-3xl select-none pt-0.5">
                            {item.id === "matcha_tea" ? "🍵" : item.id === "magic_book" ? "📖" : "🧘"}
                          </span>
                          <div className="flex-1">
                            <h4 className="font-bold text-[#5c4033] text-[11px] leading-tight">{item.name}</h4>
                            <p className="text-[9px] text-[#8b7355] mt-0.5 leading-tight">{item.desc}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleBuyFocusItem(item.id, item.price)}
                          disabled={!canAfford || pendingId === item.id}
                          className={`w-full mt-3 py-1.5 rounded-xl text-[10px] font-black flex items-center justify-center gap-1 transition-colors ${
                            canAfford
                              ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                              : "bg-stone-100 text-stone-400 cursor-not-allowed"
                          }`}
                        >
                          <span>🎯</span>
                          {item.price} Tokens
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === "inventory" && (
            <div className="grid grid-cols-2 gap-4">
              {unlockedItems.length === 0 ? (
                <div className="col-span-2 py-12 text-center text-stone-400 font-medium flex flex-col items-center gap-2">
                  <Package className="w-10 h-10 text-stone-300" />
                  Bạn chưa sở hữu món nội thất nào.
                </div>
              ) : (
                SHOP_ITEMS.filter((item) => unlockedItems.includes(item.id)).map((item) => {
                  const isEquipped = equippedFor(item.slot) === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`bg-white rounded-2xl border-2 p-3 flex flex-col shadow-sm transition-all ${
                        isEquipped ? "border-amber-400 bg-amber-50/20" : "border-[#ebdcc5]"
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
                            Tháo
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleEquip(item.slot, item.id)}
                            className="w-full py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 shadow-sm shadow-amber-200 transition-colors"
                          >
                            Dùng
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
