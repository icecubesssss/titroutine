// Pure, framework-agnostic game rules. Safe to import from server or client so
// the UI and the server actions always agree on derived state.

export const COINS_PER_HABIT = 10;
/**
 * @deprecated Habits no longer grant pet EXP — completing a habit awards *coins
 * only*. The pet's growth EXP (`pet_exp`) now comes exclusively from feeding
 * (see {@link feedExpGain}). Kept for reference; do not reintroduce into habit
 * mutations.
 */
export const EXP_PER_HABIT = 10;

/**
 * Minimum streak (≈ days together) required to *unlock* each pet stage
 * (index === stage, 0..6). Mirrors the age-based evolution in the design bible.
 *
 * Pacing ("vừa phải", ~4 months): the egg hatches on day 7 — long enough that a
 * 3-day fluke no longer pops a rabbit — and the final form lands around day 120.
 */
export const STAGE_STREAK_THRESHOLDS = [0, 7, 21, 42, 70, 105, 120] as const;

/**
 * Highest stage a given streak alone unlocks. This is the *floor* for the real
 * pet stage; the stored stage may be higher because evolution never reverses
 * (see {@link ratchetStage}).
 */
export function stageFromStreak(streak: number): number {
  let stage = 0;
  for (let i = 0; i < STAGE_STREAK_THRESHOLDS.length; i++) {
    if (streak >= STAGE_STREAK_THRESHOLDS[i]) stage = i;
  }
  return stage;
}

/**
 * The pet's real stage. Evolution is a permanent milestone, not a fragile mirror
 * of the current streak: once a stage is reached it is kept even if the streak
 * later breaks. Reaching the *next* stage still requires building the streak back
 * up to its threshold. This is the single source of truth for `pet_stage`.
 */
export function ratchetStage(storedStage: number | null | undefined, streak: number): number {
  return Math.max(storedStage ?? 0, stageFromStreak(streak));
}

/** Streak still needed to reach the next stage (0 when already at the max). */
export function streakToNextStage(streak: number): number {
  const stage = stageFromStreak(streak);
  const next = STAGE_STREAK_THRESHOLDS[stage + 1];
  return next === undefined ? 0 : next - streak;
}

/** Current date as YYYY-MM-DD in the given IANA timezone. */
export function todayInTimezone(timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: timezone || "UTC" }).format(new Date());
  } catch {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "UTC" }).format(new Date());
  }
}

/** Whole-day difference between two YYYY-MM-DD strings (to - from). */
export function daysBetween(fromISO: string, toISO: string): number {
  const from = Date.parse(`${fromISO}T00:00:00Z`);
  const to = Date.parse(`${toISO}T00:00:00Z`);
  if (Number.isNaN(from) || Number.isNaN(to)) return Number.POSITIVE_INFINITY;
  return Math.round((to - from) / 86_400_000);
}

/**
 * Given the previous streak + last active date, compute the streak after the
 * user is active again on `today`. Activity on a day already counted is a no-op.
 */
export function nextStreak(
  previousStreak: number,
  lastActiveDate: string | null,
  today: string,
  availableFreezes: number = 0
): { newStreak: number; freezesUsed: number } {
  if (!lastActiveDate) return { newStreak: 1, freezesUsed: 0 };
  const diff = daysBetween(lastActiveDate, today);
  if (diff <= 0) return { newStreak: previousStreak, freezesUsed: 0 }; // same day (or clock skew) — already counted
  if (diff === 1) return { newStreak: previousStreak + 1, freezesUsed: 0 }; // consecutive day
  
  // A gap broke the streak. Check if we have enough freezes to cover the gap.
  // E.g., if lastActive is Monday and today is Wednesday, diff is 2. The missed day is Tuesday (gap = 1).
  const gap = diff - 1;
  if (availableFreezes >= gap) {
    // Used freezes to keep the streak alive. The completion today increments the streak.
    return { newStreak: previousStreak + 1, freezesUsed: gap };
  }
  
  return { newStreak: 1, freezesUsed: 0 }; // Not enough freezes, streak resets
}

// ───────────────────────────────────────────────────────────────────────────
// Pet NURTURE axis (feeding). Independent from the streak-driven *appearance*
// stage (see ratchetStage). Feeding raises `pet_exp`, which derives a "nurture
// level" that gates room unlocks + interactions. This axis is monotonic (feeding
// only ever adds EXP), so it never needs a ratchet and rooms never re-lock.
// ───────────────────────────────────────────────────────────────────────────

export const SATIETY_MAX = 100;
/** Satiety lost per whole day since the pet was last fed. ~4 days from full→empty. */
export const SATIETY_DECAY_PER_DAY = 25;
/** Pet EXP earned per point of satiety *actually* restored by a feed. */
export const EXP_PER_SATIETY = 1;
/** One-off bonus EXP for the first feed of the day (rewards showing up daily). */
export const DAILY_FEED_BONUS_EXP = 15;

// Neglect consequence (Habit-Rabbit "health" loop): while the pet is fully
// starved (effective satiety 0) and NOT on vacation, a small once-per-day
// penalty applies on dashboard load. Gentle by design — never touches streak,
// pet stage or rooms (evolution/rooms never reverse).
export const NEGLECT_PENALTY_COINS = 10;
export const NEGLECT_PENALTY_AFFECTION = 5;

/**
 * Cumulative `pet_exp` needed to reach each nurture level (index === level-1).
 * Paced against ~25 EXP/day feeding: Lv3 ≈ 4d, Lv5 ≈ 11d, Lv8 ≈ 30d, Lv11 ≈ 68d
 * — matching the "vừa phải" (~4 month) evolution cadence in the design bible.
 */
export const PET_LEVEL_THRESHOLDS = [
  0, 60, 150, 280, 450, 680, 960, 1300, 1700, 2180, 2720, 3320, 4000, 4760, 5600,
] as const;

/** Nurture level (starts at 1) for a given cumulative feeding EXP. */
export function levelFromExp(exp: number): number {
  let level = 1;
  for (let i = 0; i < PET_LEVEL_THRESHOLDS.length; i++) {
    if (exp >= PET_LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  return level;
}

/** Progress within the current level: EXP into it, EXP span, and 0..1 ratio. */
export function expToNextLevel(exp: number): { current: number; needed: number; ratio: number } {
  const level = levelFromExp(exp);
  const base = PET_LEVEL_THRESHOLDS[level - 1] ?? 0;
  const next = PET_LEVEL_THRESHOLDS[level]; // threshold for level+1
  if (next === undefined) return { current: 0, needed: 0, ratio: 1 }; // maxed
  const current = exp - base;
  const needed = next - base;
  return { current, needed, ratio: needed > 0 ? Math.min(1, current / needed) : 1 };
}

export interface FoodTier {
  id: string;
  cost: number; // coins
  satiety: number; // satiety points restored (before capping at SATIETY_MAX)
}

/** Shop food. Bigger tiers restore more satiety (⇒ more EXP on a hungry pet) but cost more. */
export const FOOD_TIERS: readonly FoodTier[] = [
  { id: "carrot", cost: 10, satiety: 20 },
  { id: "cake", cost: 30, satiety: 50 },
  { id: "feast", cost: 60, satiety: 100 },
] as const;

export function foodTier(id: string): FoodTier | undefined {
  return FOOD_TIERS.find((f) => f.id === id);
}

/**
 * Effective satiety right now: the value stored at the last feed, minus daily
 * decay since. A never-fed pet (no `lastFedDate`) is treated as full so new pets
 * and freshly-migrated accounts don't start "starving".
 */
export function currentSatiety(
  storedSatiety: number | null | undefined,
  lastFedDate: string | null | undefined,
  today: string
): number {
  if (!lastFedDate) return SATIETY_MAX;
  const stored = storedSatiety ?? SATIETY_MAX;
  const days = Math.max(0, daysBetween(lastFedDate, today));
  return Math.max(0, Math.min(SATIETY_MAX, stored - days * SATIETY_DECAY_PER_DAY));
}

/**
 * EXP a feed grants — proportional to the satiety *actually* restored (capped at
 * the current deficit). Feeding an already-full pet yields ~0. This is the core
 * anti-exploit: total nurture EXP per day is bounded by the decay rate, so coins
 * can't be dumped into instant leveling — growth is paced by real days.
 */
export function feedExpGain(currentSat: number, tier: FoodTier): number {
  const actualRestored = Math.max(0, Math.min(tier.satiety, SATIETY_MAX - currentSat));
  return Math.round(EXP_PER_SATIETY * actualRestored);
}

export type PetMood = "hungry" | "content" | "happy";

/** Derived mood from care stats. Drives ambient animation + the mood widget. */
export function moodFromStats(satiety: number, affection: number): PetMood {
  if (satiety < 25) return "hungry";
  if (satiety >= 60 && affection >= 40) return "happy";
  return "content";
}

// ── Interactions (pat / play / clean) — bond (affection_level) tuning ──────────
export const AFFECTION_MAX = 100;
export const AFFECTION_PER_FEED = 3;
export const AFFECTION_PER_INTERACT = 4;
/** Max affection an interaction spree can add in a single day (paces the bond). */
export const AFFECTION_DAILY_CAP = 40;
/** Min gap between affection-granting interactions (anti-spam). Animation still plays. */
export const INTERACT_COOLDOWN_MS = 30_000;
/** Playing burns a little satiety. */
export const PLAY_SATIETY_COST = 5;

// ── NPC neighbours — daily visit gift ─────────────────────────────────────────
export const NEIGHBOR_GIFT_COINS = 20;
export const NEIGHBOR_GIFT_AFFECTION = 5;
