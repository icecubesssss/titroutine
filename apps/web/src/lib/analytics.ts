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

  // Fetch all completed logs for the last 60 days
  const { data: recentLogs } = await supabase
    .from("habit_logs")
    .select("date, is_completed")
    .eq("user_id", user.id)
    .gte("date", startDate)
    .lte("date", today)
    .eq("is_completed", true);

  const heatmapData: Record<string, number> = {};
  if (recentLogs) {
    for (const log of recentLogs) {
      heatmapData[log.date] = (heatmapData[log.date] || 0) + 1;
    }
  }

  // Count all-time completed logs
  const { count: totalCompletedAllTime } = await supabase
    .from("habit_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_completed", true);

  // Fetch completed tasks to calculate counts and focus minutes
  const { data: completedTasks } = await supabase
    .from("tasks")
    .select("focus_duration")
    .eq("user_id", user.id)
    .eq("status", "done");

  const totalTasksCompleted = completedTasks?.length ?? 0;
  const totalFocusMinutes = completedTasks?.reduce((acc, t) => acc + (t.focus_duration ?? 0), 0) ?? 0;

  // Count pending tasks (todo & in_progress)
  const { count: pendingTasksCount } = await supabase
    .from("tasks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .in("status", ["todo", "in_progress"]);

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
  };
}
