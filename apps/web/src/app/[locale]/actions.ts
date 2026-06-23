"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  COINS_PER_HABIT,
  EXP_PER_HABIT,
  nextStreak,
  stageFromStreak,
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
    .select("timezone, coins, total_exp, current_streak, last_active_date, streak_freezes, last_checkin_date")
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
      date: today,
      is_completed: willComplete,
      value: willComplete ? input.value ?? null : null,
    },
    { onConflict: "habit_id,date" }
  );
  if (logError) return { error: logError.message };

  // Reconcile profile economy + streak.
  const sign = isNegative ? -1 : 1;
  const delta = (willComplete ? 1 : -1) * sign;
  const coins = Math.max(0, (profile?.coins ?? 0) + delta * COINS_PER_HABIT);
  const totalExp = Math.max(0, (profile?.total_exp ?? 0) + delta * EXP_PER_HABIT);

  // Streak only advances on the first completion of a new day; the pet stage is
  // derived from the streak so the stored value always matches what's shown.
  let newStreak = profile?.current_streak ?? 0;
  let remainingFreezes = profile?.streak_freezes ?? 0;

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

  const patch: Record<string, unknown> = {
    coins,
    total_exp: totalExp,
    pet_stage: stageFromStreak(newStreak),
    updated_at: new Date().toISOString(),
  };

  if (willComplete) {
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
    .select("timezone, coins, total_exp, current_streak, last_active_date, streak_freezes")
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
    const coins = Math.max(0, (profile?.coins ?? 0) + COINS_PER_HABIT);
    const totalExp = Math.max(0, (profile?.total_exp ?? 0) + EXP_PER_HABIT);
    
    const streakResult = nextStreak(
      profile?.current_streak ?? 0,
      profile?.last_active_date ?? null,
      today,
      profile?.streak_freezes ?? 0
    );
    
    await supabase.from("profiles").update({
      coins,
      total_exp: totalExp,
      current_streak: streakResult.newStreak,
      streak_freezes: profile?.streak_freezes ? profile.streak_freezes - streakResult.freezesUsed : 0,
      pet_stage: stageFromStreak(streakResult.newStreak),
      last_active_date: today,
      updated_at: new Date().toISOString(),
    }).eq("id", userId);
  }

  revalidatePath("/", "layout");
  return {};
}

export async function claimDailyCheckinAction(): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("timezone, coins, last_checkin_date")
    .eq("id", userId)
    .maybeSingle();
  
  if (profileError) return { error: profileError.message };

  const timezone = profile?.timezone || "UTC";
  const today = todayInTimezone(timezone);

  if (profile?.last_checkin_date === today) {
    return { error: "already_checked_in" };
  }

  // Daily check-in reward: 15 coins
  const newCoins = (profile?.coins ?? 0) + 15;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ 
      coins: newCoins,
      last_checkin_date: today 
    })
    .eq("id", userId);
    
  if (updateError) return { error: updateError.message };

  revalidatePath("/", "layout");
  return {};
}

export async function buyFreezeAction(): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("coins, streak_freezes")
    .eq("id", userId)
    .maybeSingle();
    
  if (profileError) return { error: profileError.message };

  const FREEZE_COST = 50;
  const currentCoins = profile?.coins ?? 0;

  if (currentCoins < FREEZE_COST) {
    return { error: "not_enough_coins" };
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ 
      coins: currentCoins - FREEZE_COST,
      streak_freezes: (profile?.streak_freezes ?? 0) + 1 
    })
    .eq("id", userId);
    
  if (updateError) return { error: updateError.message };

  revalidatePath("/", "layout");
  return {};
}

export async function buyItemAction(itemId: string, price: number): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("coins")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) return { error: profileError.message };
  const currentCoins = profile?.coins ?? 0;

  if (currentCoins < price) {
    return { error: "not_enough_coins" };
  }

  // Lấy inventory hiện tại
  const { data: inventory, error: invError } = await supabase
    .from("inventory")
    .select("unlocked_items")
    .eq("user_id", userId)
    .maybeSingle();

  if (invError && invError.code !== 'PGRST116') return { error: invError.message };

  const unlocked = new Set((inventory?.unlocked_items as string[]) || []);
  if (unlocked.has(itemId)) {
    return { error: "already_owned" };
  }

  unlocked.add(itemId);

  // Trừ tiền
  const { error: updateProfileError } = await supabase
    .from("profiles")
    .update({ coins: currentCoins - price })
    .eq("id", userId);

  if (updateProfileError) return { error: updateProfileError.message };

  // Cập nhật inventory (upsert)
  const { error: updateInvError } = await supabase
    .from("inventory")
    .upsert({
      user_id: userId,
      unlocked_items: Array.from(unlocked),
      updated_at: new Date().toISOString(),
    });

  if (updateInvError) return { error: updateInvError.message };

  revalidatePath("/", "layout");
  return {};
}

export async function equipItemAction(slot: string, itemId: string | null): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const { data: inventory, error: invError } = await supabase
    .from("inventory")
    .select("equipped_items, unlocked_items")
    .eq("user_id", userId)
    .maybeSingle();

  if (invError && invError.code !== 'PGRST116') return { error: invError.message };

  // Kiểm tra xem đã sở hữu chưa (nếu không phải gỡ đồ)
  if (itemId !== null) {
    const unlocked = (inventory?.unlocked_items as string[]) || [];
    if (!unlocked.includes(itemId)) {
      return { error: "item_not_owned" };
    }
  }

  const equipped = { ...((inventory?.equipped_items as Record<string, string>) || {}) };
  
  if (itemId === null) {
    delete equipped[slot];
  } else {
    equipped[slot] = itemId;
  }

  const { error: updateInvError } = await supabase
    .from("inventory")
    .upsert({
      user_id: userId,
      equipped_items: equipped,
      updated_at: new Date().toISOString(),
    });

  if (updateInvError) return { error: updateInvError.message };

  revalidatePath("/", "layout");
  return {};
}
