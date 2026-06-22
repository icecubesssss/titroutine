"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  COINS_PER_HABIT,
  EXP_PER_HABIT,
  nextStreak,
  petStageFromExp,
  todayInTimezone,
} from "@/lib/game";
import type { HabitType } from "@/lib/types";

type ActionResult = { error?: string };

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

/**
 * Persist the user's real IANA timezone so "today" and streaks are computed in
 * their local day rather than UTC. Called once from the client on load.
 */
export async function updateTimezoneAction(timezone: string): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };
  if (!timezone || timezone.length > 64) return { error: "invalid_timezone" };

  const { error } = await supabase
    .from("profiles")
    .update({ timezone })
    .eq("id", userId);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}

export async function addHabitAction(input: {
  title: string;
  type: Extract<HabitType, "boolean" | "timer">;
  durationMinutes?: number;
}): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const title = input.title.trim();
  if (!title) return { error: "empty_title" };

  const config =
    input.type === "timer" && input.durationMinutes
      ? { target_time: Math.max(1, Math.round(input.durationMinutes)) * 60 }
      : {};

  const { error } = await supabase.from("habits").insert({
    user_id: userId,
    title,
    type: input.type,
    config,
  });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}

export async function updateHabitAction(input: {
  id: string;
  title: string;
  durationMinutes?: number;
}): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const title = input.title.trim();
  if (!title) return { error: "empty_title" };

  const patch: Record<string, unknown> = { title };
  if (input.durationMinutes != null) {
    patch.config = { target_time: Math.max(1, Math.round(input.durationMinutes)) * 60 };
  }

  const { error } = await supabase
    .from("habits")
    .update(patch)
    .eq("id", input.id)
    .eq("user_id", userId);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}

export async function archiveHabitAction(id: string): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const { error } = await supabase
    .from("habits")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}

/**
 * Toggle today's completion for a habit and reconcile all derived gamification
 * state: coins, EXP, pet stage and the daily streak.
 */
export async function toggleHabitAction(input: {
  habitId: string;
  value?: number;
}): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("timezone, coins, total_exp, current_streak, last_active_date")
    .eq("id", userId)
    .maybeSingle();
  if (profileError) return { error: profileError.message };

  const timezone = profile?.timezone || "UTC";
  const today = todayInTimezone(timezone);

  // Current state of today's log for this habit.
  const { data: existing } = await supabase
    .from("habit_logs")
    .select("id, is_completed")
    .eq("habit_id", input.habitId)
    .eq("date", today)
    .maybeSingle();

  const willComplete = !existing?.is_completed;

  // Upsert today's log (UNIQUE(habit_id, date) makes this idempotent).
  const { error: logError } = await supabase.from("habit_logs").upsert(
    {
      habit_id: input.habitId,
      user_id: userId,
      date: today,
      is_completed: willComplete,
      value: willComplete ? input.value ?? null : null,
    },
    { onConflict: "habit_id,date" }
  );
  if (logError) return { error: logError.message };

  // Reconcile profile economy + streak.
  const delta = willComplete ? 1 : -1;
  const coins = Math.max(0, (profile?.coins ?? 0) + delta * COINS_PER_HABIT);
  const totalExp = Math.max(0, (profile?.total_exp ?? 0) + delta * EXP_PER_HABIT);
  const petStage = petStageFromExp(totalExp);

  const patch: Record<string, unknown> = {
    coins,
    total_exp: totalExp,
    pet_stage: petStage,
    updated_at: new Date().toISOString(),
  };

  // Streak only advances on the first completion of a new day.
  if (willComplete) {
    patch.current_streak = nextStreak(
      profile?.current_streak ?? 0,
      profile?.last_active_date ?? null,
      today
    );
    patch.last_active_date = today;
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId);
  if (updateError) return { error: updateError.message };

  revalidatePath("/", "layout");
  return {};
}
