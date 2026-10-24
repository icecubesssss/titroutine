import { addDays, format, parseISO, startOfWeek } from "date-fns";
import type { HabitFrequency } from "./types";

// Pure schedule rules shared by the server (streaks in data.ts, actions) and the
// client (HabitModal, HabitMonthView), so both agree on when a habit is due.

export const MIN_TIMES_PER_WEEK = 1;
export const MAX_TIMES_PER_WEEK = 6;

/** Whether the habit is due on this day. Daily and weekly-quota habits are due every day. */
export function isScheduledDay(dateObj: Date, frequency: HabitFrequency): boolean {
  if (frequency.type === "specific_days" && Array.isArray(frequency.days)) {
    const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday, etc.
    return frequency.days.includes(dayOfWeek);
  }
  return true; // daily or other types are scheduled every day
}

/** Completions per week a weekly-quota habit asks for (clamped); 0 for other types. */
export function weeklyTarget(frequency: HabitFrequency): number {
  if (frequency.type !== "x_times_a_week") return 0;
  const n = Math.round(Number(frequency.timesPerWeek) || MIN_TIMES_PER_WEEK);
  return Math.min(MAX_TIMES_PER_WEEK, Math.max(MIN_TIMES_PER_WEEK, n));
}

/**
 * Validates a frequency coming from the client before it is stored, so the JSONB
 * column only ever holds the shapes the rest of the app understands.
 */
export function sanitizeFrequency(raw: unknown): HabitFrequency {
  const input = (raw ?? {}) as Record<string, unknown>;
  if (input.type === "specific_days" && Array.isArray(input.days)) {
    const days = Array.from(
      new Set(input.days.filter((d): d is number => Number.isInteger(d) && d >= 0 && d <= 6))
    );
    if (days.length > 0) return { type: "specific_days", days };
  }
  if (input.type === "x_times_a_week") {
    return {
      type: "x_times_a_week",
      timesPerWeek: weeklyTarget({ type: "x_times_a_week", timesPerWeek: Number(input.timesPerWeek) }),
    };
  }
  return { type: "daily" };
}

/**
 * Streak of a weekly-quota habit, in weeks: consecutive Monday-first weeks that
 * met the target. The current week counts once met, but never breaks the run
 * while it is still in progress.
 */
export function weeklyQuotaStreak(completedDates: Set<string>, todayStr: string, target: number): number {
  let weekStart = startOfWeek(parseISO(todayStr), { weekStartsOn: 1 });
  let streak = 0;
  for (let w = 0; w < 53; w++) {
    let count = 0;
    for (let d = 0; d < 7; d++) {
      if (completedDates.has(format(addDays(weekStart, d), "yyyy-MM-dd"))) count++;
    }
    if (count >= target) streak++;
    else if (w > 0) break;
    weekStart = addDays(weekStart, -7);
  }
  return streak;
}
