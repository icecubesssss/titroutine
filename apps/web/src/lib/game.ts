// Pure, framework-agnostic game rules. Safe to import from server or client so
// the UI and the server actions always agree on derived state.

export const COINS_PER_HABIT = 10;
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
