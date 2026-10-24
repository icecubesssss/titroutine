import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { isScheduledDay, weeklyTarget } from "./habit_schedule";
import type { HabitFrequency } from "./types";

// Per-habit statistics that are kinder than a raw streak (Loop Habit Tracker
// style). Pure functions shared by the dashboard and the analytics page. They
// are display-only: pet stage still comes from the profile streak (ratchetStage).

export interface HabitHistory {
  /** Dates (YYYY-MM-DD) with is_completed = true. For "negative" habits that means a slip. */
  completed: Set<string>;
  frequency: HabitFrequency;
  isNegative: boolean;
  /** YYYY-MM-DD in the user's timezone; days before it are ignored. */
  createdAt?: string;
}

/**
 * Value (0..1) a single day contributes, or null when the day doesn't count:
 * not scheduled, or today before anything has happened yet (an unfinished day
 * is not a miss). Negative habits score the clean days.
 */
function dayValue(h: HabitHistory, day: Date, key: string, today: string, target: number): number | null {
  const done = h.completed.has(key);
  if (key === today && !done) return null;
  if (h.isNegative) return done ? 0 : 1;
  if (target > 0) {
    // Weekly quota: how much of the target the last 7 days cover.
    let rolling = 0;
    for (let i = 0; i < 7; i++) {
      if (h.completed.has(format(addDays(day, -i), "yyyy-MM-dd"))) rolling++;
    }
    return Math.min(1, rolling / target);
  }
  if (!isScheduledDay(day, h.frequency)) return null;
  return done ? 1 : 0;
}

function firstCountedDay(h: HabitHistory, from: string): string {
  return h.createdAt && h.createdAt > from ? h.createdAt : from;
}

/**
 * Habit strength 0..100: an exponential moving average over the past year, so a
 * missed day dents it instead of wiping it out. Same decay as Loop:
 * multiplier = 0.5^(√freq / 13), i.e. ~13-day half-life for a daily habit.
 */
export function habitStrength(h: HabitHistory, today: string): number {
  const target = weeklyTarget(h.frequency);
  const freq = target > 0 ? target / 7 : 1;
  const multiplier = Math.pow(0.5, Math.sqrt(freq) / 13);

  const start = firstCountedDay(h, format(addDays(parseISO(today), -364), "yyyy-MM-dd"));
  const days = differenceInCalendarDays(parseISO(today), parseISO(start));
  let score = 0;
  for (let i = 0; i <= days; i++) {
    const day = addDays(parseISO(start), i);
    const value = dayValue(h, day, format(day, "yyyy-MM-dd"), today, target);
    if (value === null) continue;
    score = score * multiplier + value * (1 - multiplier);
  }
  return Math.round(score * 100);
}

/**
 * Completion rate 0..100 over [from, today], or null when no day counted yet.
 * Weekly-quota habits are measured against target × weeks (capped at 100).
 */
export function completionRate(h: HabitHistory, from: string, today: string): number | null {
  const start = firstCountedDay(h, from);
  if (start > today) return null;
  const target = weeklyTarget(h.frequency);
  const days = differenceInCalendarDays(parseISO(today), parseISO(start)) + 1;

  if (target > 0 && !h.isNegative) {
    let done = 0;
    for (let i = 0; i < days; i++) {
      if (h.completed.has(format(addDays(parseISO(start), i), "yyyy-MM-dd"))) done++;
    }
    return Math.min(100, Math.round((done / ((target * days) / 7)) * 100));
  }

  let good = 0;
  let counted = 0;
  for (let i = 0; i < days; i++) {
    const day = addDays(parseISO(start), i);
    const value = dayValue(h, day, format(day, "yyyy-MM-dd"), today, 0);
    if (value === null) continue;
    counted++;
    good += value;
  }
  return counted > 0 ? Math.round((good / counted) * 100) : null;
}
