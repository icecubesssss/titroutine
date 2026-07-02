// NPC neighbours — static, pre-authored companions the user can "visit" once every
// room in their own house is unlocked. Purely local (no real users / no social
// backend). Reuses the existing pet sprites via `stage` (STAGES_CONFIG index).
// Display names live in i18n (`Neighbors.<id>`).

export interface Neighbor {
  id: string;
  /** i18n key under `Neighbors`. */
  nameKey: string;
  /** STAGES_CONFIG stage index whose sprite represents this neighbour. */
  stage: number;
  /** Idle action for the neighbour's sprite. */
  emoji: string;
  /** Tailwind classes for the neighbour's house backdrop. */
  houseBg: string;
}

export const NEIGHBORS: readonly Neighbor[] = [
  { id: "mochi", nameKey: "mochi", stage: 2, emoji: "🍡", houseBg: "bg-gradient-to-b from-pink-100 via-rose-50 to-rose-200" },
  { id: "biscuit", nameKey: "biscuit", stage: 6, emoji: "🍪", houseBg: "bg-gradient-to-b from-amber-100 via-yellow-50 to-orange-200" },
  { id: "luna", nameKey: "luna", stage: 3, emoji: "🌙", houseBg: "bg-gradient-to-b from-indigo-200 via-purple-100 to-indigo-300" },
] as const;
