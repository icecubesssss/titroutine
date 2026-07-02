// The pet's house. Rooms unlock as the pet's NURTURE level grows (levelFromExp in
// game.ts). Pure, client-safe data — imported by the server (data.ts / actions.ts)
// and the UI. Display names live in i18n (`Rooms.<id>`), not here.
//
// Each interaction maps to a CompanionAction that already exists in STAGES_CONFIG;
// missing poses fall back gracefully (see ACTION_FALLBACKS in RabbitCompanion), so
// no new art is required for the first version.
import type { CompanionAction } from "@/components/pet/RabbitCompanion";

export type RoomId = "bedroom" | "kitchen" | "living" | "garden" | "bathroom";
export type InteractionKind = "feed" | "pat" | "play" | "clean" | "sleep";

export interface RoomDef {
  id: RoomId;
  /** Nurture level required to unlock. Bedroom is always available. */
  unlockLevel: number;
  /** Emoji shown on the room tab / lock card. */
  icon: string;
  /** Tailwind classes for the room backdrop (walls + ambient tone). */
  bgClass: string;
  /** Interaction buttons offered while in this room. */
  interactions: InteractionKind[];
  /** Companion action the pet idles with in this room (before ambient/overrides). */
  idleAction: CompanionAction;
}

export const ROOMS: readonly RoomDef[] = [
  {
    id: "bedroom",
    unlockLevel: 1,
    icon: "🛏️",
    bgClass: "bg-gradient-to-b from-indigo-100 via-purple-50 to-rose-100",
    interactions: ["pat", "sleep"],
    idleAction: "idle",
  },
  {
    id: "kitchen",
    unlockLevel: 3,
    icon: "🍳",
    bgClass: "bg-gradient-to-b from-amber-100 via-orange-50 to-yellow-100",
    interactions: ["feed", "pat"],
    idleAction: "eat",
  },
  {
    id: "living",
    unlockLevel: 5,
    icon: "🛋️",
    bgClass: "bg-gradient-to-b from-emerald-100 via-teal-50 to-green-100",
    interactions: ["pat", "play"],
    idleAction: "relax_music",
  },
  {
    id: "garden",
    unlockLevel: 8,
    icon: "🌷",
    bgClass: "bg-gradient-to-b from-sky-200 via-lime-50 to-green-200",
    interactions: ["play", "pat"],
    idleAction: "young_play",
  },
  {
    id: "bathroom",
    unlockLevel: 11,
    icon: "🛁",
    bgClass: "bg-gradient-to-b from-cyan-100 via-blue-50 to-sky-100",
    interactions: ["clean", "pat"],
    idleAction: "brush_hair",
  },
] as const;

/** Interaction → the companion animation it triggers. */
export const INTERACTION_ACTION: Record<InteractionKind, CompanionAction> = {
  feed: "eat",
  pat: "proud_smile",
  play: "young_play",
  clean: "brush_hair",
  sleep: "sleep",
};

export function roomDef(id: RoomId): RoomDef {
  return ROOMS.find((r) => r.id === id) ?? ROOMS[0];
}

/** Room ids unlocked at the given nurture level (always includes bedroom). */
export function unlockedRooms(level: number): RoomId[] {
  return ROOMS.filter((r) => level >= r.unlockLevel).map((r) => r.id);
}

export function isRoomUnlocked(id: RoomId, level: number): boolean {
  return level >= roomDef(id).unlockLevel;
}

/** True once every room is unlocked — the gate for visiting NPC neighbours. */
export function allRoomsUnlocked(level: number): boolean {
  return unlockedRooms(level).length === ROOMS.length;
}
