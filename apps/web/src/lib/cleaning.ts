// Habit-Rabbit-style messy rooms. Every room starts with clutter spots; each
// completed habit earns cleaning energy (ENERGY_PER_HABIT) and spending it on
// a spot clears it permanently. Clearing every spot in a room pays a coin
// bonus and gifts one furniture item from the shop catalogue.
//
// Pure, client-safe data — imported by the server (actions.ts) and the UI.
// NOTE: positionClass values must stay literal Tailwind classes (arbitrary
// values included) so the compiler generates them — never assemble at runtime.
import type { RoomId } from "./rooms";

/** Cleaning energy granted per habit completed today (mirrors adventure energy). */
export const ENERGY_PER_HABIT = 5;

/** Coins paid immediately for each cleared spot. */
export const SPOT_CLEAN_COINS = 5;

/** Bonus coins when the last spot of a room is cleared. */
export const ROOM_CLEAN_BONUS_COINS = 40;

export interface MessSpot {
  id: string;
  roomId: RoomId;
  /** Emoji rendered as the clutter pile (no art assets needed). */
  emoji: string;
  /** Cleaning energy required to clear this spot. */
  cost: number;
  /** Literal Tailwind positioning inside the room viewport. */
  positionClass: string;
}

export const MESS_SPOTS: readonly MessSpot[] = [
  // Bedroom — unlocked from level 1, cheapest spots teach the mechanic.
  { id: "bedroom_socks", roomId: "bedroom", emoji: "🧦", cost: 15, positionClass: "bottom-[9%] left-[32%]" },
  { id: "bedroom_laundry", roomId: "bedroom", emoji: "🧺", cost: 20, positionClass: "bottom-[16%] right-[12%]" },
  { id: "bedroom_papers", roomId: "bedroom", emoji: "📄", cost: 25, positionClass: "bottom-[26%] left-[16%]" },
  { id: "bedroom_cobweb", roomId: "bedroom", emoji: "🕸️", cost: 30, positionClass: "top-[22%] right-[8%]" },
  // Kitchen
  { id: "kitchen_dishes", roomId: "kitchen", emoji: "🍽️", cost: 15, positionClass: "bottom-[9%] left-[30%]" },
  { id: "kitchen_peels", roomId: "kitchen", emoji: "🍌", cost: 20, positionClass: "bottom-[18%] right-[14%]" },
  { id: "kitchen_trash", roomId: "kitchen", emoji: "🗑️", cost: 25, positionClass: "bottom-[26%] left-[14%]" },
  { id: "kitchen_spill", roomId: "kitchen", emoji: "🥤", cost: 30, positionClass: "bottom-[12%] right-[34%]" },
  // Living room
  { id: "living_pillows", roomId: "living", emoji: "🛋️", cost: 15, positionClass: "bottom-[10%] right-[14%]" },
  { id: "living_books", roomId: "living", emoji: "📚", cost: 20, positionClass: "bottom-[20%] left-[16%]" },
  { id: "living_crumbs", roomId: "living", emoji: "🍿", cost: 25, positionClass: "bottom-[8%] left-[36%]" },
  { id: "living_dust", roomId: "living", emoji: "💨", cost: 30, positionClass: "top-[26%] left-[10%]" },
  // Garden
  { id: "garden_leaves", roomId: "garden", emoji: "🍂", cost: 15, positionClass: "bottom-[9%] left-[30%]" },
  { id: "garden_weeds", roomId: "garden", emoji: "🌿", cost: 20, positionClass: "bottom-[18%] right-[12%]" },
  { id: "garden_branches", roomId: "garden", emoji: "🪵", cost: 25, positionClass: "bottom-[26%] left-[14%]" },
  { id: "garden_snail_trail", roomId: "garden", emoji: "🐌", cost: 30, positionClass: "bottom-[12%] right-[32%]" },
  // Bathroom
  { id: "bathroom_towels", roomId: "bathroom", emoji: "🧻", cost: 15, positionClass: "bottom-[10%] left-[30%]" },
  { id: "bathroom_puddle", roomId: "bathroom", emoji: "💧", cost: 20, positionClass: "bottom-[16%] right-[16%]" },
  { id: "bathroom_soap", roomId: "bathroom", emoji: "🧼", cost: 25, positionClass: "bottom-[26%] left-[14%]" },
  { id: "bathroom_mirror", roomId: "bathroom", emoji: "🪞", cost: 30, positionClass: "top-[24%] right-[10%]" },
];

/** Furniture gifted (added to inventory.unlocked_items) when a room is fully clean. */
export const ROOM_CLEAN_GIFTS: Record<RoomId, string> = {
  bedroom: "object_lamp_warm",
  kitchen: "object_bowl_carrot",
  living: "object_frame_photo",
  garden: "object_plant_pot",
  bathroom: "rug_cloud",
};

export function spotsForRoom(roomId: RoomId): MessSpot[] {
  return MESS_SPOTS.filter((s) => s.roomId === roomId);
}

export function findMessSpot(spotId: string): MessSpot | undefined {
  return MESS_SPOTS.find((s) => s.id === spotId);
}

export function isRoomFullyClean(roomId: RoomId, cleaned: Record<string, boolean>): boolean {
  return spotsForRoom(roomId).every((s) => cleaned[s.id]);
}

/** House-wide progress, e.g. { cleaned: 13, total: 20 }. */
export function cleaningProgress(cleaned: Record<string, boolean>): { cleaned: number; total: number } {
  const done = MESS_SPOTS.filter((s) => cleaned[s.id]).length;
  return { cleaned: done, total: MESS_SPOTS.length };
}
