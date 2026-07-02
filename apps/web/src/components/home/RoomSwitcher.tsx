"use client";

import { useTranslations } from "next-intl";
import { Lock } from "lucide-react";
import { ROOMS, type RoomId } from "@/lib/rooms";

/**
 * Floating glass segmented control for the pet's house. Rooms unlock as the
 * nurture level grows; locked ones show a padlock + the level required. A
 * "neighbourhood" tab appears once every room is unlocked.
 *
 * Rendered as one translucent bar (rather than many separate shadowed pills) so
 * it reads as a single quiet control and doesn't compete with the pet.
 */
export function RoomSwitcher({
  current,
  unlocked,
  allUnlocked,
  onSelect,
  onOpenNeighbors,
}: {
  current: RoomId;
  unlocked: RoomId[];
  allUnlocked: boolean;
  onSelect: (id: RoomId) => void;
  onOpenNeighbors: () => void;
}) {
  const t = useTranslations("Rooms");
  const unlockedSet = new Set(unlocked);

  return (
    <div className="flex max-w-full items-center gap-0.5 overflow-x-auto no-scrollbar rounded-full border border-white/50 bg-white/55 p-1 shadow-[0_2px_10px_rgba(0,0,0,0.06)] backdrop-blur-md">
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
            className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-bold transition-all ${
              isActive
                ? "bg-earth-brown text-white shadow-sm"
                : isUnlocked
                ? "text-earth-brown/80 hover:bg-black/[0.05]"
                : "text-earth-brown/35"
            }`}
          >
            <span aria-hidden>{room.icon}</span>
            {isActive ? (
              <span className="whitespace-nowrap">{t(room.id)}</span>
            ) : !isUnlocked ? (
              <span className="flex items-center gap-0.5 whitespace-nowrap">
                <Lock className="h-3 w-3" /> {room.unlockLevel}
              </span>
            ) : null}
          </button>
        );
      })}

      {/* Neighbourhood — unlocked after the whole house is. */}
      <button
        type="button"
        disabled={!allUnlocked}
        onClick={onOpenNeighbors}
        title={allUnlocked ? t("neighbors") : t("neighborsLocked")}
        className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-bold transition-all ${
          allUnlocked ? "text-amber-600 hover:bg-amber-500/10" : "text-earth-brown/35"
        }`}
      >
        <span aria-hidden>🏘️</span>
        {!allUnlocked && <Lock className="h-3 w-3" />}
      </button>
    </div>
  );
}
