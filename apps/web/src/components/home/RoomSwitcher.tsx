"use client";

import { useTranslations } from "next-intl";
import { Lock } from "lucide-react";
import { ROOMS, type RoomId } from "@/lib/rooms";

/**
 * Horizontal room tabs for the pet's house. Unlocked rooms are selectable; locked
 * ones show a padlock + the nurture level required. An extra "neighbourhood" tab
 * appears once every room is unlocked.
 */
export function RoomSwitcher({
  current,
  petLevel,
  unlocked,
  allUnlocked,
  onSelect,
  onOpenNeighbors,
}: {
  current: RoomId;
  petLevel: number;
  unlocked: RoomId[];
  allUnlocked: boolean;
  onSelect: (id: RoomId) => void;
  onOpenNeighbors: () => void;
}) {
  const t = useTranslations("Rooms");
  const unlockedSet = new Set(unlocked);

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar px-1 py-1">
      {ROOMS.map((room) => {
        const isUnlocked = unlockedSet.has(room.id);
        const isActive = current === room.id;
        return (
          <button
            key={room.id}
            type="button"
            disabled={!isUnlocked}
            onClick={() => isUnlocked && onSelect(room.id)}
            title={isUnlocked ? t(room.id) : t("lockedHint", { level: room.unlockLevel })}
            className={`relative flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
              isActive
                ? "bg-earth-brown text-white shadow-md scale-105"
                : isUnlocked
                ? "bg-white/80 text-earth-brown hover:bg-white"
                : "bg-black/10 text-earth-brown/40"
            }`}
          >
            <span aria-hidden>{room.icon}</span>
            {isUnlocked ? (
              <span className="whitespace-nowrap">{t(room.id)}</span>
            ) : (
              <span className="flex items-center gap-0.5 whitespace-nowrap">
                <Lock className="h-3 w-3" /> {room.unlockLevel}
              </span>
            )}
          </button>
        );
      })}

      {/* Neighbourhood — unlocked after the whole house is. */}
      <button
        type="button"
        disabled={!allUnlocked}
        onClick={onOpenNeighbors}
        title={allUnlocked ? t("neighbors") : t("neighborsLocked")}
        className={`flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${
          allUnlocked
            ? "bg-gradient-to-r from-amber-300 to-orange-400 text-white shadow-md hover:brightness-105"
            : "bg-black/10 text-earth-brown/40"
        }`}
      >
        <span aria-hidden>🏘️</span>
        {allUnlocked ? <span className="whitespace-nowrap">{t("neighbors")}</span> : <Lock className="h-3 w-3" />}
      </button>
    </div>
  );
}
