"use client";

import { useTranslations } from "next-intl";
import { Lock, X } from "lucide-react";
import { ROOMS, type RoomId } from "@/lib/rooms";
import { spotsForRoom, ROOM_CLEAN_GIFTS } from "@/lib/cleaning";
import { levelFromExp } from "@/lib/game";

// "Explore the house" modal: lists every room with its unlock state, cleaning
// progress and the free furniture gift for fully cleaning it. Unlock is derived
// from the pet level (or the dev level override) vs the persisted unlocked list.
export function RoomSwitcherModal({
  open,
  onClose,
  onVisitRoom,
  currentRoomId,
  petExp,
  devLevelOverride,
  unlockedRooms,
  cleanedSpots,
}: {
  open: boolean;
  onClose: () => void;
  onVisitRoom: (id: RoomId) => void;
  currentRoomId: RoomId;
  petExp: number;
  devLevelOverride: number | null;
  unlockedRooms: RoomId[];
  cleanedSpots: Record<string, boolean>;
}) {
  const t = useTranslations("Home");
  const tRooms = useTranslations("Rooms");
  const tShop = useTranslations("Shop");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-md bg-theme-bg rounded-3xl overflow-hidden shadow-2xl relative border border-theme-card-border animate-scale-up text-theme-text p-6" onClick={(e) => e.stopPropagation()}>

        <div className="flex justify-between items-center mb-4 pb-3 border-b border-theme-card-border">
          <h3 className="text-base font-black flex items-center gap-2 text-amber-900">
            🏡 {tRooms("title") || "Khám Phá Ngôi Nhà"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            title={t("close")}
            aria-label={t("close")}
            className="p-1 rounded-full hover:bg-stone-100 text-stone-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-[11px] text-theme-text/60 mb-5 leading-relaxed">
          Mở khoá phòng mới bằng cách nâng cấp level thỏ cưng (cho thỏ ăn để tăng EXP) và dọn sạch các đống bừa bộn để nhận nội thất miễn phí!
        </p>

        <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1 no-scrollbar">
          {ROOMS.map((room) => {
            const unlocked = devLevelOverride !== null ? levelFromExp(petExp) >= room.unlockLevel : unlockedRooms.includes(room.id);
            const spots = spotsForRoom(room.id);
            const cleanedCount = spots.filter(s => cleanedSpots[s.id]).length;
            const totalSpots = spots.length;
            const isCurrent = currentRoomId === room.id;
            const cleanProgressPercent = totalSpots > 0 ? Math.round((cleanedCount / totalSpots) * 100) : 100;
            const isFullyClean = cleanedCount === totalSpots;

            // Gift item display name
            const giftItemId = ROOM_CLEAN_GIFTS[room.id];
            const giftName = giftItemId ? tShop(`item_${giftItemId}_name`) : "";

            return (
              <div
                key={room.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isCurrent
                    ? "border-amber-500 bg-amber-50/20 ring-1 ring-amber-500/30"
                    : "border-theme-card-border bg-theme-card-bg hover:border-amber-300"
                }`}
              >
                <div className="flex justify-between items-start mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{room.icon}</span>
                    <div>
                      <h4 className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                        {tRooms(room.id)}
                        {isCurrent && (
                          <span className="text-[8px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-extrabold tracking-wide uppercase">
                            Đang ở
                          </span>
                        )}
                      </h4>
                      {!unlocked && (
                        <span className="text-[9px] text-orange-655 bg-orange-50 border border-orange-100 px-1.5 rounded flex items-center gap-0.5 mt-0.5">
                          <Lock size={8} className="inline" /> {tRooms("lockedHint", { level: room.unlockLevel })}
                        </span>
                      )}
                    </div>
                  </div>

                  {unlocked && (
                    <button
                      type="button"
                      disabled={isCurrent}
                      onClick={() => onVisitRoom(room.id)}
                      className={`text-[10px] font-black px-3 py-1.5 rounded-xl shadow-sm transition-all ${
                        isCurrent
                          ? "bg-stone-100 text-stone-400 cursor-default"
                          : "bg-gradient-to-r from-orange-400 to-amber-500 hover:from-orange-500 hover:to-amber-600 text-white active:scale-95"
                      }`}
                    >
                      Ghé thăm
                    </button>
                  )}
                </div>

                {unlocked && (
                  <div className="space-y-2 border-t border-black/[0.03] pt-2 mt-2">
                    {/* Progress Bar */}
                    <div className="flex items-center justify-between text-[9px] text-theme-text/50 font-bold">
                      <span className="flex items-center gap-0.5">
                        🧹 Sạch sẽ: {cleanedCount}/{totalSpots} ({cleanProgressPercent}%)
                      </span>
                      {isFullyClean && (
                        <span className="text-emerald-600 flex items-center gap-0.5 font-extrabold">
                          ✨ Sạch bóng!
                        </span>
                      )}
                    </div>
                    <div className="h-1.5 w-full bg-black/[0.04] rounded-full overflow-hidden">
                      <div
                        ref={(el) => {
                          if (el) el.style.width = `${cleanProgressPercent}%`;
                        }}
                        className={`h-full w-0 rounded-full transition-all duration-500 ${
                          isFullyClean ? "bg-gradient-to-r from-emerald-400 to-teal-500" : "bg-gradient-to-r from-amber-400 to-orange-500"
                        }`}
                      />
                    </div>

                    {/* Gift Info */}
                    {giftName && (
                      <div className="text-[9px] text-amber-900/60 bg-amber-50/50 border border-amber-900/5 p-1.5 rounded-lg flex items-center justify-between font-bold">
                        <span>🎁 Quà dọn dẹp:</span>
                        <span className="text-amber-950 font-extrabold">{giftName}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
