import "server-only";

import { createClient } from "@/utils/supabase/server";
import { todayInTimezone } from "./game";

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
}

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

  // Calculate 60 days ago
  const endDateObj = new Date(`${today}T00:00:00Z`);
  const startDateObj = new Date(endDateObj.getTime() - 60 * 24 * 60 * 60 * 1000);
  const startDate = startDateObj.toISOString().split("T")[0];

  const moodStartObj = new Date(endDateObj.getTime() - 180 * 24 * 60 * 60 * 1000);
  const moodStart = moodStartObj.toISOString().split("T")[0];

  // Fetch remaining data in parallel
  const [
    recentLogsResult,
    totalCompletedResult,
    completedTasksResult,
    pendingTasksResult,
    beanRowsResult,
  ] = await Promise.all([
    supabase
      .from("habit_logs")
      .select("date, is_completed")
      .eq("user_id", user.id)
      .gte("date", startDate)
      .lte("date", today)
      .eq("is_completed", true),
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

  const recentLogs = recentLogsResult.data;
  const totalCompletedAllTime = totalCompletedResult.count;
  const completedTasks = completedTasksResult.data;
  const pendingTasksCount = pendingTasksResult.count;
  const beanRows = beanRowsResult.data;

  const heatmapData: Record<string, number> = {};
  if (recentLogs) {
    for (const log of recentLogs) {
      heatmapData[log.date] = (heatmapData[log.date] || 0) + 1;
    }
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

  return {
    totalCompletedAllTime: totalCompletedAllTime ?? 0,
    totalExp: profile?.pet_exp ?? 0,
    currentStreak: profile?.current_streak ?? 0,
    bestStreak: Math.max(profile?.current_streak ?? 0, 0), // Basic for now, we'd need history to track real best streak
    heatmapData,
    startDate,
    endDate: today,
    totalTasksCompleted,
    totalFocusMinutes,
    pendingTasksCount: pendingTasksCount ?? 0,
    moodLogs,
  };
}
