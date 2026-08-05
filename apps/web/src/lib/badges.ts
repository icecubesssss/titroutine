// Streak milestone badges — purchasable in the Shop once the streak reaches
// requiredStreak, then hung in the room (draggable, hideable). Shares its
// milestone numbers with STAGE_STREAK_THRESHOLDS (lib/game.ts) since both mark
// the same streak journey; kept as a separate list so pricing/copy can evolve
// independently of pet evolution.
export interface BadgeItem {
  key: string;
  requiredStreak: number;
  price: number;
  emoji: string;
}

export const BADGES: BadgeItem[] = [
  { key: "badge_streak_7", requiredStreak: 7, price: 50, emoji: "🥉" },
  { key: "badge_streak_21", requiredStreak: 21, price: 120, emoji: "🥈" },
  { key: "badge_streak_42", requiredStreak: 42, price: 220, emoji: "🥇" },
  { key: "badge_streak_70", requiredStreak: 70, price: 350, emoji: "🏅" },
  { key: "badge_streak_105", requiredStreak: 105, price: 500, emoji: "🎖️" },
  { key: "badge_streak_120", requiredStreak: 120, price: 650, emoji: "🏆" },
];

export function getBadge(key: string): BadgeItem | undefined {
  return BADGES.find((b) => b.key === key);
}

/** Keys of every badge the streak has earned the right to buy (owned or not). */
export function eligibleBadgeKeys(streak: number): string[] {
  return BADGES.filter((b) => streak >= b.requiredStreak).map((b) => b.key);
}

/**
 * The next milestone whose "you unlocked a badge!" celebration hasn't been
 * shown yet, or null if none is pending. `lastSeen` is `profiles.badge_milestone_seen`.
 */
export function nextUncelebratedBadge(streak: number, lastSeen: number): BadgeItem | null {
  return BADGES.find((b) => streak >= b.requiredStreak && b.requiredStreak > lastSeen) ?? null;
}
