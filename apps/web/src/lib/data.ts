import "server-only";

import { createClient } from "@/utils/supabase/server";
import { stageFromStreak, todayInTimezone } from "./game";
import type { DashboardData, HabitConfig, HabitType, HabitWithLog } from "./types";

interface HabitRow {
  id: string;
  title: string;
  type: HabitType | null;
  config: HabitConfig | null;
}

interface LogRow {
  habit_id: string;
  is_completed: boolean | null;
  value: number | null;
}

/**
 * Loads everything the home screen needs for the signed-in user, scoped to
 * "today" in their own timezone. Returns null when there is no session.
 */
export async function getDashboard(): Promise<DashboardData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, timezone, coins, current_streak, total_exp, pet_stage, last_checkin_date, streak_freezes")
    .eq("id", user.id)
    .maybeSingle();

  const timezone = profile?.timezone || "UTC";
  const today = todayInTimezone(timezone);
  const totalExp = profile?.total_exp ?? 0;
  const currentStreak = profile?.current_streak ?? 0;

  const [{ data: habitRows }, { data: logRows }] = await Promise.all([
    supabase
      .from("habits")
      .select("id, title, type, config")
      .eq("user_id", user.id)
      .is("archived_at", null)
      .order("created_at", { ascending: true }),
    supabase
      .from("habit_logs")
      .select("habit_id, is_completed, value")
      .eq("user_id", user.id)
      .eq("date", today),
  ]);

  const logByHabit = new Map<string, LogRow>();
  for (const log of (logRows ?? []) as LogRow[]) {
    logByHabit.set(log.habit_id, log);
  }

  const habits: HabitWithLog[] = ((habitRows ?? []) as HabitRow[]).map((h) => {
    const log = logByHabit.get(h.id);
    return {
      id: h.id,
      title: h.title,
      type: (h.type as HabitType) ?? "boolean",
      config: h.config ?? {},
      isCompleted: Boolean(log?.is_completed),
      value: log?.value ?? null,
    };
  });

  return {
    profile: {
      coins: profile?.coins ?? 0,
      currentStreak,
      // Stage is derived from the streak (age-based evolution per the design bible).
      petStage: profile?.pet_stage ?? stageFromStreak(currentStreak),
      totalExp,
      timezone,
      username: profile?.username ?? null,
      lastCheckinDate: profile?.last_checkin_date ?? null,
      streakFreezes: profile?.streak_freezes ?? 0,
    },
    habits,
    today,
    email: user.email ?? null,
  };
}
