"use client";

import { useTranslations } from "next-intl";
import { Lock, X, Home } from "lucide-react";
import { ROOMS, type RoomId } from "@/lib/rooms";
import { spotsForRoom, ROOM_CLEAN_GIFTS } from "@/lib/cleaning";
import { levelFromExp } from "@/lib/game";

// "Explore the house" modal: lists every room with its unlock state, cleaning
// progress and the free furniture gift for fully cleaning it. Unlock is derived
// from the pet level (or the dev level override) vs the persisted unlocked list.
// Features a gorgeous 3D Isometric Dollhouse Map at the top.
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

  const currentLevel = devLevelOverride !== null ? devLevelOverride : levelFromExp(petExp);

  // Screen coordinates for the 3D Dollhouse map buttons
  const getRoomMapPos = (id: RoomId) => {
    switch (id) {
      case "bedroom":
        return { left: "calc(50% - 78px)", top: "32px", zIndex: 10 };
      case "bathroom":
        return { left: "calc(50% + 8px)", top: "32px", zIndex: 10 };
      case "living":
        return { left: "calc(50% - 78px)", top: "94px", zIndex: 10 };
      case "kitchen":
        return { left: "calc(50% + 8px)", top: "94px", zIndex: 10 };
      case "garden":
      default:
        return { left: "calc(50% - 35px)", top: "144px", zIndex: 15 };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-md bg-theme-bg rounded-3xl overflow-hidden shadow-2xl relative border border-theme-card-border animate-scale-up text-theme-text p-6 max-h-[95vh] flex flex-col" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex justify-between items-center mb-3 pb-2.5 border-b border-theme-card-border shrink-0">
          <h3 className="text-sm font-black flex items-center gap-2 text-amber-900">
            <Home className="w-4 h-4 text-amber-800" />
            {tRooms("title") || "Khám Phá Ngôi Nhà 3D"}
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

        {/* 3D Isometric Dollhouse Map Section */}
        <div className="relative w-full h-[225px] bg-amber-500/[0.03] border border-amber-900/5 rounded-2xl overflow-hidden flex items-center justify-center shrink-0 mb-4 shadow-inner">
          {/* Sky background backdrop */}
          <div className="absolute inset-0 bg-gradient-to-b from-sky-100/30 to-amber-50/20 pointer-events-none" />

          {/* Roof silhouette */}
          <div 
            className="absolute w-0 h-0 border-l-[82px] border-l-transparent border-r-[82px] border-r-transparent border-b-[24px] border-b-amber-800/10 pointer-events-none"
            style={{ left: "calc(50% - 82px)", top: "8px" }}
          />

          {/* Grass lawn at bottom */}
          <div 
            className="absolute w-[190px] h-[36px] bg-emerald-500/10 rounded-full blur-[1px] pointer-events-none"
            style={{ left: "calc(50% - 95px)", top: "156px" }}
          />

          {/* Render rooms on map */}
          {ROOMS.map((room) => {
            const unlocked = devLevelOverride !== null ? currentLevel >= room.unlockLevel : unlockedRooms.includes(room.id);
            const isCurrent = currentRoomId === room.id;
            const { left, top, zIndex } = getRoomMapPos(room.id);

            return (
              <button
                key={`map-${room.id}`}
                type="button"
                disabled={!unlocked || isCurrent}
                onClick={() => {
                  onVisitRoom(room.id);
                  onClose();
                }}
                title={unlocked ? tRooms(room.id) : tRooms("lockedHint", { level: room.unlockLevel })}
                className={`absolute w-[70px] h-[52px] rounded-xl flex flex-col items-center justify-center text-center transition-all ${
                  isCurrent
                    ? "bg-amber-150 border-2 border-amber-500 shadow-none translate-y-0.5 cursor-default text-amber-950 font-black"
                    : unlocked
                    ? "bg-white border border-stone-200 hover:border-amber-400 hover:-translate-y-0.5 active:translate-y-0.5 shadow-[0_3px_0_rgba(180,83,9,0.15)] hover:shadow-[0_4px_0_rgba(180,83,9,0.2)] active:shadow-none text-theme-text"
                    : "bg-stone-50/80 border border-stone-200 text-stone-400/70 opacity-60 cursor-not-allowed"
                }`}
                style={{ left, top, zIndex }}
              >
                {/* Active current room glow indicator */}
                {isCurrent && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
                )}
                
                <span className="text-base leading-none mb-0.5">{room.icon}</span>
                <span className="text-[8px] font-black uppercase tracking-wider leading-none">
                  {tRooms(room.id)}
                </span>
                
                {isCurrent ? (
                  <span className="text-[6px] text-amber-700 font-extrabold uppercase mt-0.5 leading-none">Ở đây</span>
                ) : !unlocked ? (
                  <span className="text-[6px] text-stone-400 font-bold mt-0.5 leading-none">Lv{room.unlockLevel} 🔒</span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Detailed Room List */}
        <div className="flex-1 overflow-y-auto pr-1 no-scrollbar space-y-3.5">
          {ROOMS.map((room) => {
            const unlocked = devLevelOverride !== null ? currentLevel >= room.unlockLevel : unlockedRooms.includes(room.id);
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
                      onClick={() => {
                        onVisitRoom(room.id);
                        onClose();
                      }}
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
                        style={{ width: `${cleanProgressPercent}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${
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
