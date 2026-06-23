// Pure, framework-agnostic game rules. Safe to import from server or client so
// the UI and the server actions always agree on derived state.

export const COINS_PER_HABIT = 10;
export const EXP_PER_HABIT = 10;

/**
 * Minimum streak (≈ days together) required to reach each pet stage
 * (index === stage, 0..6). Mirrors the age-based evolution in the design bible.
 */
export const STAGE_STREAK_THRESHOLDS = [0, 3, 7, 15, 30, 60, 100] as const;

/** The single source of truth for which pet stage to show / store. */
export function stageFromStreak(streak: number): number {
  let stage = 0;
  for (let i = 0; i < STAGE_STREAK_THRESHOLDS.length; i++) {
    if (streak >= STAGE_STREAK_THRESHOLDS[i]) stage = i;
  }
  return stage;
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
