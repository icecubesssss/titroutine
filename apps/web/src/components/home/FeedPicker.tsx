"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { FOOD_TIERS } from "@/lib/game";

/**
 * Balo vật phẩm chăm sóc: chứa thức ăn & đồ chơi tiêu dùng của người dùng.
 * Hiển thị số lượng thực tế trong kho và khóa các nút nếu số lượng bằng 0.
 */
export function FeedPicker({
  isOpen,
  consumables,
  onClose,
  onFeed,
  onPlay,
}: {
  isOpen: boolean;
  consumables: Record<string, number>;
  onClose: () => void;
  onFeed: (tierId: string) => void;
  onPlay: (toyId: string) => void;
}) {
  const t = useTranslations("Pet");
  if (!isOpen) return null;

  const toyItems = [
    { id: "toy_ball", label: "Bóng cao su", emoji: "⚽", desc: "Hao 5 no, tăng 6 thân thiết" },
    { id: "toy_bear", label: "Gấu bông lớn", emoji: "🧸", desc: "Hao 5 no, tăng 10 thân thiết" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-3xl bg-[#fdfaf6] p-6 shadow-2xl border border-[#efe9dc] animate-sheet-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between border-b border-orange-100 pb-3">
          <h3 className="text-lg font-black text-[#5c4033] flex items-center gap-2">
            🎒 Balo Vật Phẩm Chăm Sóc
          </h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 font-bold h-8 w-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Section 1: Thức ăn */}
        <div className="mb-6">
          <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1">
            🥕 Đồ ăn dinh dưỡng
          </h4>
          <div className="grid grid-cols-3 gap-3">
            {FOOD_TIERS.map((tier) => {
              const count = consumables[tier.id] ?? 0;
              const hasItem = count > 0;
              return (
                <button
                  key={tier.id}
                  type="button"
                  disabled={!hasItem}
                  onClick={() => {
                    onFeed(tier.id);
                    onClose();
                  }}
                  className={`relative flex flex-col items-center gap-1.5 rounded-2xl border-2 border-b-4 bg-white p-3 transition-all ${
                    hasItem
                      ? "border-[#ebdcc5] hover:border-orange-300 active:translate-y-0.5 active:border-b-2"
                      : "border-gray-100 opacity-40 cursor-not-allowed"
                  }`}
                >
                  <span className={`absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black border shadow-sm ${
                    hasItem ? "bg-orange-500 text-white border-orange-600" : "bg-gray-200 text-gray-500 border-gray-300"
                  }`}>
                    {count}
                  </span>
                  <Image
                    src={`/assets/ui/food/food_${tier.id}.png`}
                    alt=""
                    width={48}
                    height={48}
                    className="h-12 w-12 object-contain drop-shadow-sm"
                  />
                  <span className="text-[11px] font-bold text-[#5c4033]">{t(`food_${tier.id}`)}</span>
                  <span className="text-[9px] font-medium text-gray-400">+{tier.satiety} No</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Đồ chơi */}
        <div>
          <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1">
            🧸 Đồ chơi cho thỏ
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {toyItems.map((toy) => {
              const count = consumables[toy.id] ?? 0;
              const hasItem = count > 0;
              return (
                <button
                  key={toy.id}
                  type="button"
                  disabled={!hasItem}
                  onClick={() => {
                    onPlay(toy.id);
                    onClose();
                  }}
                  className={`relative flex items-center gap-3 rounded-2xl border-2 border-b-4 bg-white p-3 transition-all ${
                    hasItem
                      ? "border-[#ebdcc5] hover:border-orange-300 active:translate-y-0.5 active:border-b-2"
                      : "border-gray-100 opacity-40 cursor-not-allowed"
                  }`}
                >
                  <span className={`absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black border shadow-sm ${
                    hasItem ? "bg-orange-500 text-white border-orange-600" : "bg-gray-200 text-gray-500 border-gray-300"
                  }`}>
                    {count}
                  </span>
                  <span className="text-3xl select-none">{toy.emoji}</span>
                  <div className="text-left flex flex-col">
                    <span className="text-[11px] font-bold text-[#5c4033]">{toy.label}</span>
                    <span className="text-[9px] text-gray-400 leading-tight">{toy.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
