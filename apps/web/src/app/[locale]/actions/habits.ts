"use server";

import { revalidatePath } from "next/cache";
import { format, addDays, parseISO } from "date-fns";
import {
  COINS_PER_HABIT,
  nextStreak,
  ratchetStage,
  todayInTimezone,
  currentSatiety,
  foodTier,
  feedExpGain,
  levelFromExp,
  SATIETY_MAX,
  DAILY_FEED_BONUS_EXP,
  AFFECTION_MAX,
  AFFECTION_PER_FEED,
  AFFECTION_PER_INTERACT,
  AFFECTION_DAILY_CAP,
  INTERACT_COOLDOWN_MS,
  NEIGHBOR_GIFT_COINS,
  NEIGHBOR_GIFT_AFFECTION,
} from "@/lib/game";
import { allRoomsUnlocked, ROOMS, type InteractionKind } from "@/lib/rooms";
import {
  ENERGY_PER_HABIT,
  SPOT_CLEAN_COINS,
  ROOM_CLEAN_BONUS_COINS,
  ROOM_CLEAN_GIFTS,
  findMessSpot,
  isRoomFullyClean,
} from "@/lib/cleaning";
import type { HabitType } from "@/lib/types";
import { ADVENTURE_STORIES, getRandomStory } from "@/lib/adventure_stories";
import { getFeedFeedback, getPlayFeedback, getCleanFeedback, getSleepFeedback } from "@/lib/game_interactions";
import { getUserId, reconcileMemories, type ActionResult } from "./_shared";

export async function addHabitAction(input: {
  title: string;
  type: HabitType;
  durationMinutes?: number;
  targetCount?: number;
  frequency?: Record<string, unknown>;
  timeOfDay?: string;
}): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const title = input.title.trim();
  if (!title) return { error: "empty_title" };

  const config: Record<string, unknown> = {};
  if (input.type === "timer" && input.durationMinutes) {
    config.target_time = Math.max(1, Math.round(input.durationMinutes)) * 60;
  } else if (input.type === "counter" && input.targetCount) {
    config.target_count = Math.max(1, Math.round(input.targetCount));
  }

  const { error } = await supabase.from("habits").insert({
    user_id: userId,
    title,
    type: input.type,
    config,
    frequency: input.frequency || { type: "daily" },
    time_of_day: input.timeOfDay || "anytime",
  });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}

export async function updateHabitAction(input: {
  id: string;
  title: string;
  durationMinutes?: number;
  targetCount?: number;
  frequency?: Record<string, unknown>;
  timeOfDay?: string;
}): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const title = input.title.trim();
  if (!title) return { error: "empty_title" };

  const patch: Record<string, unknown> = { title };
  if (input.durationMinutes != null) {
    patch.config = { ...((patch.config as Record<string, unknown>) || {}), target_time: Math.max(1, Math.round(input.durationMinutes)) * 60 };
  }
  if (input.targetCount != null) {
    patch.config = { ...((patch.config as Record<string, unknown>) || {}), target_count: Math.max(1, Math.round(input.targetCount)) };
  }
  if (input.frequency != null) {
    patch.frequency = input.frequency;
  }
  if (input.timeOfDay != null) {
    patch.time_of_day = input.timeOfDay;
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
  date?: string;
}): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("timezone, coins, total_exp, current_streak, last_active_date, streak_freezes, last_checkin_date, pet_stage, adventure_energy, adventure_status, cleaning_energy")
    .eq("id", userId)
    .maybeSingle();
  if (profileError) return { error: profileError.message };

  const timezone = profile?.timezone || "UTC";
  const today = todayInTimezone(timezone);
  const targetDate = input.date || today;

  // Current state of targetDate's log for this habit.
  const { data: existing } = await supabase
    .from("habit_logs")
    .select("id, is_completed")
    .eq("habit_id", input.habitId)
    .eq("date", targetDate)
    .maybeSingle();

  const willComplete = !existing?.is_completed;

  // Fetch habit type to determine if it's a negative habit
  const { data: habitData } = await supabase
    .from("habits")
    .select("type")
    .eq("id", input.habitId)
    .single();
  const isNegative = habitData?.type === "negative";

  // Upsert today's log (UNIQUE(habit_id, date) makes this idempotent).
  const { error: logError } = await supabase.from("habit_logs").upsert(
    {
      habit_id: input.habitId,
      user_id: userId,
      date: targetDate,
      is_completed: willComplete,
      value: willComplete ? input.value ?? null : null,
    },
    { onConflict: "habit_id,date" }
  );
  if (logError) return { error: logError.message };

  // Reconcile profile economy + streak. Habits award COINS ONLY now — pet growth
  // EXP comes from feeding, not tasks. Coins are also only granted/removed for
  // *today's* completions, never backfilled past days (prevents coin farming by
  // toggling historical dates — those still log/display, just don't pay out).
  const sign = isNegative ? -1 : 1;
  const delta = (willComplete ? 1 : -1) * sign;
  const coins =
    targetDate === today
      ? Math.max(0, (profile?.coins ?? 0) + delta * COINS_PER_HABIT)
      : (profile?.coins ?? 0);

  // Streak only advances on the first completion of a new day; the pet stage is
  // derived from the streak so the stored value always matches what's shown.
  let newStreak = profile?.current_streak ?? 0;
  let remainingFreezes = profile?.streak_freezes ?? 0;

  if (targetDate === today) {
    if (willComplete && !isNegative) {
      const streakResult = nextStreak(
        profile?.current_streak ?? 0,
        profile?.last_active_date ?? null,
        today,
        profile?.streak_freezes ?? 0
      );
      newStreak = streakResult.newStreak;
      remainingFreezes -= streakResult.freezesUsed;
    } else if (willComplete && isNegative) {
      // Violated negative habit -> Reset streak
      newStreak = 0;
    }
  }

  // Tích lũy năng lượng thám hiểm: Mỗi habit thường hoàn thành +10 (tối đa 30) khi pet đang ở nhà
  let adventureEnergy = profile?.adventure_energy ?? 0;
  if (targetDate === today && !isNegative) {
    if (willComplete && profile?.adventure_status === "idle") {
      adventureEnergy = Math.min(30, adventureEnergy + 10);
    } else if (!willComplete && profile?.adventure_status === "idle") {
      adventureEnergy = Math.max(0, adventureEnergy - 10);
    }
  }

  // Năng lượng dọn dẹp (Habit-Rabbit style): chỉ hôm nay, habit thường; bỏ tick
  // thì rút lại để không farm bằng cách tick/bỏ tick liên tục.
  let cleaningEnergy = profile?.cleaning_energy ?? 0;
  if (targetDate === today && !isNegative) {
    cleaningEnergy = Math.max(0, cleaningEnergy + (willComplete ? ENERGY_PER_HABIT : -ENERGY_PER_HABIT));
  }

  const patch: Record<string, unknown> = {
    coins,
    adventure_energy: adventureEnergy,
    cleaning_energy: cleaningEnergy,
    // Evolution never reverses: a broken streak keeps the stage already reached.
    pet_stage: targetDate === today ? ratchetStage(profile?.pet_stage, newStreak) : profile?.pet_stage,
    updated_at: new Date().toISOString(),
  };

  if (willComplete && targetDate === today) {
    patch.current_streak = newStreak;
    if (!isNegative) {
      patch.last_active_date = today;
      patch.streak_freezes = remainingFreezes;
    }
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId);
  if (updateError) return { error: updateError.message };

  if (willComplete) await reconcileMemories(supabase, userId, newStreak);

  revalidatePath("/", "layout");
  return {};
}

export async function incrementCounterHabitAction(input: {
  habitId: string;
  incrementAmount: number;
  targetCount: number;
  date?: string;
}): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone, coins, total_exp, current_streak, last_active_date, streak_freezes, pet_stage, adventure_energy, adventure_status, cleaning_energy")
    .eq("id", userId)
    .maybeSingle();

  const timezone = profile?.timezone || "UTC";
  const today = todayInTimezone(timezone);
  const targetDate = input.date || today;

  const { data: existing } = await supabase
    .from("habit_logs")
    .select("id, is_completed, value")
    .eq("habit_id", input.habitId)
    .eq("date", targetDate)
    .maybeSingle();

  if (existing?.is_completed) return {}; // already done

  const currentValue = existing?.value ?? 0;
  const newValue = Math.max(0, currentValue + input.incrementAmount);
  const willComplete = newValue >= input.targetCount;

  const { error: logError } = await supabase.from("habit_logs").upsert(
    {
      habit_id: input.habitId,
      user_id: userId,
      date: today,
      is_completed: willComplete,
      value: newValue,
    },
    { onConflict: "habit_id,date" }
  );
  if (logError) return { error: logError.message };

  if (willComplete) {
    // Coins only — pet EXP now comes from feeding, not habits.
    const coins = Math.max(0, (profile?.coins ?? 0) + COINS_PER_HABIT);

    const streakResult = nextStreak(
      profile?.current_streak ?? 0,
      profile?.last_active_date ?? null,
      today,
      profile?.streak_freezes ?? 0
    );

    let adventureEnergy = profile?.adventure_energy ?? 0;
    if (profile?.adventure_status === "idle") {
      adventureEnergy = Math.min(30, adventureEnergy + 10);
    }

    await supabase.from("profiles").update({
      coins,
      current_streak: streakResult.newStreak,
      streak_freezes: profile?.streak_freezes ? profile.streak_freezes - streakResult.freezesUsed : 0,
      pet_stage: ratchetStage(profile?.pet_stage, streakResult.newStreak),
      last_active_date: today,
      adventure_energy: adventureEnergy,
      cleaning_energy: (profile?.cleaning_energy ?? 0) + ENERGY_PER_HABIT,
      updated_at: new Date().toISOString(),
    }).eq("id", userId);

    await reconcileMemories(supabase, userId, streakResult.newStreak);
  }

  revalidatePath("/", "layout");
  return {};
}
