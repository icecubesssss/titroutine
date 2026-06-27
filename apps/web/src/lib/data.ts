import "server-only";

import { createClient } from "@/utils/supabase/server";
import { ratchetStage, todayInTimezone } from "./game";
import { eligibleMemoryKeys } from "./memories";
import type { DashboardData, HabitConfig, HabitType, HabitWithLog, HabitFrequency, TimeOfDay } from "./types";

interface HabitRow {
  id: string;
  title: string;
  type: HabitType | null;
  config: HabitConfig | null;
  frequency: HabitFrequency | null;
  time_of_day: TimeOfDay | null;
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
export async function getDashboard(targetDateStr?: string): Promise<DashboardData | null> {
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
  const targetDate = targetDateStr || today;
  const isToday = targetDate === today;
  const totalExp = profile?.total_exp ?? 0;
  const currentStreak = profile?.current_streak ?? 0;

  const [{ data: habitRows }, { data: logRows }, { data: inventoryData }, { data: memoryRows }] = await Promise.all([
    supabase
      .from("habits")
      .select("id, title, type, config, frequency, time_of_day")
      .eq("user_id", user.id)
      .is("archived_at", null)
      .order("created_at", { ascending: true }),
    supabase
      .from("habit_logs")
      .select("habit_id, is_completed, value")
      .eq("user_id", user.id)
      .eq("date", targetDate),
    supabase
      .from("inventory")
      .select("equipped_items, unlocked_items")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("memories")
      .select("memory_key")
      .eq("user_id", user.id),
  ]);

  // Persisted keepsakes plus anything the *current* streak earns right now, so a
  // memory shows the moment it's reached even before the next mutation writes it.
  const unlockedMemories = Array.from(
    new Set([
      ...((memoryRows ?? []) as { memory_key: string }[]).map((m) => m.memory_key),
      ...eligibleMemoryKeys(currentStreak),
    ])
  );

  const logByHabit = new Map<string, LogRow>();
  for (const log of (logRows ?? []) as LogRow[]) {
    logByHabit.set(log.habit_id, log);
  }

  // Calculate day of week safely (0 = Sunday, 1 = Monday, etc.)
  // We append T00:00:00 to avoid timezone shift in new Date() parsing
  const dayOfWeek = new Date(`${today}T00:00:00`).getDay();

  const habits: HabitWithLog[] = ((habitRows ?? []) as HabitRow[])
    .map((h) => {
      const log = logByHabit.get(h.id);
      return {
        id: h.id,
        title: h.title,
        type: h.type ?? "boolean",
        config: h.config ?? {},
        frequency: h.frequency ?? { type: "daily" },
        timeOfDay: h.time_of_day ?? "anytime",
        isCompleted: Boolean(log?.is_completed),
        value: log?.value ?? null,
      };
    })
    .filter((h) => {
      // Filter out habits that are not due today based on specific_days frequency
      if (h.frequency.type === "specific_days" && Array.isArray(h.frequency.days)) {
        return h.frequency.days.includes(dayOfWeek);
      }
      return true; // daily and x_times_a_week show up every day
    });

  return {
    profile: {
      coins: profile?.coins ?? 0,
      currentStreak,
      // Stage = highest reached. The streak sets a floor; the stored value can be
      // higher because evolution never reverses (see ratchetStage in game.ts).
      petStage: ratchetStage(profile?.pet_stage, currentStreak),
      totalExp,
      timezone,
      username: profile?.username ?? null,
      lastCheckinDate: profile?.last_checkin_date ?? null,
      streakFreezes: profile?.streak_freezes ?? 0,
    },
    inventory: {
      equippedItems: (inventoryData?.equipped_items as Record<string, string>) || {},
      unlockedItems: (inventoryData?.unlocked_items as string[]) || [],
    },
    unlockedMemories,
    habits,
    today,
    currentDate: targetDate,
    isToday,
    email: user.email ?? null,
  };
}
