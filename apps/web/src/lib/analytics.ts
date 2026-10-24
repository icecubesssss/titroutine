import "server-only";

import { addDays, format, getDay, parseISO, startOfWeek } from "date-fns";
import { createClient } from "@/utils/supabase/server";
import { todayInTimezone } from "./game";
import { calculateStreak, calendarDateIn } from "./data";
import { isScheduledDay, weeklyTarget } from "./habit_schedule";
import { completionRate, habitStrength, type HabitHistory } from "./habit_strength";
import type { HabitFrequency, HabitType } from "./types";

export interface HabitStat {
  id: string;
  title: string;
  isNegative: boolean;
  /** Streak counts weeks instead of days. */
  isWeekly: boolean;
  /** Completion (or clean-day) rate over the last 30 days, null when nothing counted yet. */
  rate30: number | null;
  strength: number;
  /** Null for negative habits (their completions are slips, not a run). */
  streak: number | null;
}

export interface MoodInsight {
  title: string;
  isNegative: boolean;
  /** Average mood (1..5) on done days minus on not-done days. */
  diff: number;
}

export interface WeekRecap {
  /** Completions Monday → today. */
  thisWeek: number;
  /** Completions over the same weekdays last week, for a fair comparison. */
  lastWeekSamePeriod: number;
  bestHabit: string | null;
  topMood: string | null;
}

export interface AnalyticsData {
  totalCompletedAllTime: number;
  totalExp: number;
  currentStreak: number;
  bestStreak: number;
  heatmapData: Record<string, number>; // "YYYY-MM-DD" -> count
  startDate: string;
  endDate: string;
  totalTasksCompleted: number;
  totalFocusMinutes: number;
  pendingTasksCount: number;
  /** Daily mood check-ins for the mood calendar, "YYYY-MM-DD" -> entry. */
  moodLogs: Record<string, { mood: string; activities: string[]; note: string | null }>;
  habitStats: HabitStat[];
  /** Completion rate per weekday over the last 12 weeks, Monday first; null = no data. */
  weekdayRates: (number | null)[];
  moodInsights: MoodInsight[];
  weekRecap: WeekRecap;
}

const MOOD_SCORE: Record<string, number> = { awful: 1, bad: 2, neutral: 3, good: 4, awesome: 5 };
const PAGE_SIZE = 1000; // PostgREST's default max rows per request

export async function getAnalyticsData(): Promise<AnalyticsData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    // "EXP" now means the pet's nurture EXP (from feeding); habits no longer
    // grant EXP so total_exp is frozen. Show the live pet_exp instead.
    .select("timezone, pet_exp, current_streak")
    .eq("id", user.id)
    .maybeSingle();

  const timezone = profile?.timezone || "UTC";
  const today = todayInTimezone(timezone);
  const todayObj = parseISO(today);
  const dateAgo = (n: number) => format(addDays(todayObj, -n), "yyyy-MM-dd");

  const startDate = dateAgo(60);
  const moodStart = dateAgo(180);
  const yearStart = dateAgo(365);

  // A year of completions can exceed one page (habits × 365 rows), so page through it.
  const fetchYearLogs = async () => {
    const rows: { habit_id: string; date: string }[] = [];
    for (let from = 0; ; from += PAGE_SIZE) {
      const { data } = await supabase
        .from("habit_logs")
        .select("habit_id, date")
        .eq("user_id", user.id)
        .eq("is_completed", true)
        .gte("date", yearStart)
        .lte("date", today)
        .order("date", { ascending: false })
        .range(from, from + PAGE_SIZE - 1);
      rows.push(...((data ?? []) as { habit_id: string; date: string }[]));
      if (!data || data.length < PAGE_SIZE) return rows;
    }
  };

  const [
    yearLogs,
    habitsResult,
    totalCompletedResult,
    completedTasksResult,
    pendingTasksResult,
    beanRowsResult,
  ] = await Promise.all([
    fetchYearLogs(),
    supabase
      .from("habits")
      .select("id, title, type, frequency, created_at")
      .eq("user_id", user.id)
      .is("archived_at", null)
      .order("created_at", { ascending: true }),
    supabase
      .from("habit_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_completed", true),
    supabase
      .from("tasks")
      .select("focus_duration")
      .eq("user_id", user.id)
      .eq("status", "done"),
    supabase
      .from("tasks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("status", ["todo", "in_progress"]),
    supabase
      .from("daily_bean_logs")
      .select("logged_date, mood, activities, note")
      .eq("user_id", user.id)
      .gte("logged_date", moodStart)
      .lte("logged_date", today),
  ]);

  const totalCompletedAllTime = totalCompletedResult.count;
  const completedTasks = completedTasksResult.data;
  const pendingTasksCount = pendingTasksResult.count;
  const beanRows = beanRowsResult.data;

  const heatmapData: Record<string, number> = {};
  const completedByHabit = new Map<string, Set<string>>();
  for (const log of yearLogs) {
    if (log.date >= startDate) heatmapData[log.date] = (heatmapData[log.date] || 0) + 1;
    let set = completedByHabit.get(log.habit_id);
    if (!set) completedByHabit.set(log.habit_id, (set = new Set()));
    set.add(log.date);
  }

  const totalTasksCompleted = completedTasks?.length ?? 0;
  const totalFocusMinutes = completedTasks?.reduce((acc, t) => acc + (t.focus_duration ?? 0), 0) ?? 0;

  const moodLogs: Record<string, { mood: string; activities: string[]; note: string | null }> = {};
  for (const row of (beanRows ?? []) as { logged_date: string; mood: string; activities: string[] | null; note: string | null }[]) {
    moodLogs[row.logged_date] = {
      mood: row.mood,
      activities: row.activities ?? [],
      note: row.note || null,
    };
  }

  // ── Per-habit history ───────────────────────────────────────────────────────
  const habits = ((habitsResult.data ?? []) as {
    id: string;
    title: string;
    type: HabitType | null;
    frequency: HabitFrequency | null;
    created_at: string | null;
  }[]).map((h) => {
    const history: HabitHistory = {
      completed: completedByHabit.get(h.id) ?? new Set(),
      frequency: h.frequency ?? { type: "daily" },
      isNegative: h.type === "negative",
      createdAt: h.created_at ? calendarDateIn(timezone, h.created_at) : undefined,
    };
    return { id: h.id, title: h.title, history };
  });

  const habitStats: HabitStat[] = habits.map(({ id, title, history }) => ({
    id,
    title,
    isNegative: history.isNegative,
    isWeekly: weeklyTarget(history.frequency) > 0,
    rate30: completionRate(history, dateAgo(29), today),
    strength: habitStrength(history, today),
    streak: history.isNegative ? null : calculateStreak(history.completed, today, history.frequency),
  }));

  // Best streak: longest run of days with at least one positive habit done.
  // Freezes aren't replayed here, so never report less than the live streak.
  const positiveDays = new Set<string>();
  for (const { history } of habits) {
    if (!history.isNegative) history.completed.forEach((d) => positiveDays.add(d));
  }
  let bestRun = 0;
  let run = 0;
  for (let i = 365; i >= 0; i--) {
    if (positiveDays.has(dateAgo(i))) bestRun = Math.max(bestRun, ++run);
    else run = 0;
  }
  const currentStreak = profile?.current_streak ?? 0;

  // Weekday rhythm: scheduled day-based habits over the last 12 full weeks (today excluded).
  const opportunities = Array(7).fill(0);
  const completions = Array(7).fill(0);
  for (let i = 1; i <= 84; i++) {
    const day = addDays(todayObj, -i);
    const key = format(day, "yyyy-MM-dd");
    const wd = (getDay(day) + 6) % 7; // Monday = 0
    for (const { history } of habits) {
      if (history.isNegative || weeklyTarget(history.frequency) > 0) continue;
      if (history.createdAt && key < history.createdAt) continue;
      if (!isScheduledDay(day, history.frequency)) continue;
      opportunities[wd]++;
      if (history.completed.has(key)) completions[wd]++;
    }
  }
  const weekdayRates = opportunities.map((o, i) => (o > 0 ? Math.round((completions[i] / o) * 100) : null));

  // Mood ↔ habit: average mood on done vs not-done days. Correlation only.
  const moodInsights: MoodInsight[] = [];
  for (const { title, history } of habits) {
    const done: number[] = [];
    const notDone: number[] = [];
    for (const [date, entry] of Object.entries(moodLogs)) {
      const score = MOOD_SCORE[entry.mood];
      if (!score || (history.createdAt && date < history.createdAt)) continue;
      if (!isScheduledDay(parseISO(date), history.frequency)) continue;
      (history.completed.has(date) ? done : notDone).push(score);
    }
    if (done.length < 5 || notDone.length < 5) continue;
    const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    const diff = Math.round((avg(done) - avg(notDone)) * 10) / 10;
    if (Math.abs(diff) >= 0.5) moodInsights.push({ title, isNegative: history.isNegative, diff });
  }
  moodInsights.sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

  // This week so far vs the same weekdays last week.
  const weekStart = startOfWeek(todayObj, { weekStartsOn: 1 });
  const weekDays: string[] = [];
  for (let d = weekStart; format(d, "yyyy-MM-dd") <= today; d = addDays(d, 1)) {
    weekDays.push(format(d, "yyyy-MM-dd"));
  }
  const lastWeekDays = weekDays.map((d) => format(addDays(parseISO(d), -7), "yyyy-MM-dd"));
  let thisWeek = 0;
  let lastWeekSamePeriod = 0;
  let bestHabit: string | null = null;
  let bestCount = 0;
  for (const { title, history } of habits) {
    if (history.isNegative) continue;
    const count = weekDays.filter((d) => history.completed.has(d)).length;
    thisWeek += count;
    lastWeekSamePeriod += lastWeekDays.filter((d) => history.completed.has(d)).length;
    if (count > bestCount) {
      bestCount = count;
      bestHabit = title;
    }
  }
  const moodCounts = new Map<string, number>();
  for (const d of weekDays) {
    const mood = moodLogs[d]?.mood;
    if (mood) moodCounts.set(mood, (moodCounts.get(mood) ?? 0) + 1);
  }
  const topMood = [...moodCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return {
    totalCompletedAllTime: totalCompletedAllTime ?? 0,
    totalExp: profile?.pet_exp ?? 0,
    currentStreak,
    bestStreak: Math.max(bestRun, currentStreak),
    heatmapData,
    startDate,
    endDate: today,
    totalTasksCompleted,
    totalFocusMinutes,
    pendingTasksCount: pendingTasksCount ?? 0,
    moodLogs,
    habitStats,
    weekdayRates,
    moodInsights: moodInsights.slice(0, 3),
    weekRecap: { thisWeek, lastWeekSamePeriod, bestHabit, topMood },
  };
}
