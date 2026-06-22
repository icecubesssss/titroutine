// Pure, framework-agnostic game rules. Safe to import from server or client.

export const COINS_PER_HABIT = 10;
export const EXP_PER_HABIT = 10;

/**
 * Total-EXP required to reach each pet stage (index === stage, 0..6).
 * Higher-stage art is still being produced; the thresholds exist so progression
 * keeps advancing in the database in the meantime.
 */
export const STAGE_EXP_THRESHOLDS = [0, 50, 200, 500, 1500, 4000, 9000] as const;

export function petStageFromExp(totalExp: number): number {
  let stage = 0;
  for (let i = 0; i < STAGE_EXP_THRESHOLDS.length; i++) {
    if (totalExp >= STAGE_EXP_THRESHOLDS[i]) stage = i;
  }
  return stage;
}

/** EXP still needed to reach the next stage (0 when already at the max stage). */
export function expToNextStage(totalExp: number): number {
  const stage = petStageFromExp(totalExp);
  const next = STAGE_EXP_THRESHOLDS[stage + 1];
  return next === undefined ? 0 : next - totalExp;
}

/** Current date as YYYY-MM-DD in the given IANA timezone. */
export function todayInTimezone(timezone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: timezone || 'UTC' }).format(new Date());
  } catch {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC' }).format(new Date());
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
  today: string
): number {
  if (!lastActiveDate) return 1;
  const diff = daysBetween(lastActiveDate, today);
  if (diff <= 0) return previousStreak; // same day (or clock skew) — already counted
  if (diff === 1) return previousStreak + 1; // consecutive day
  return 1; // a gap broke the streak
}
