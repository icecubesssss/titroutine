"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
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
import { allRoomsUnlocked, type InteractionKind } from "@/lib/rooms";
import { eligibleMemoryKeys } from "@/lib/memories";
import type { HabitType } from "@/lib/types";

type ActionResult = { error?: string };

async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

type Supabase = Awaited<ReturnType<typeof getUserId>>["supabase"];

/**
 * Persist any newly-earned memory keepsakes. Idempotent: existing rows are ignored
 * thanks to the UNIQUE(user_id, memory_key) constraint, so this is safe to call on
 * every completion. Keeps memories from vanishing when a streak later resets.
 */
async function reconcileMemories(supabase: Supabase, userId: string, streak: number) {
  const keys = eligibleMemoryKeys(streak);
  if (keys.length === 0) return;
  await supabase
    .from("memories")
    .upsert(
      keys.map((memory_key) => ({ user_id: userId, memory_key })),
      { onConflict: "user_id,memory_key", ignoreDuplicates: true }
    );
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
    .select("timezone, coins, total_exp, current_streak, last_active_date, streak_freezes, last_checkin_date, pet_stage")
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

  const patch: Record<string, unknown> = {
    coins,
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
    .select("timezone, coins, total_exp, current_streak, last_active_date, streak_freezes, pet_stage")
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

    await supabase.from("profiles").update({
      coins,
      current_streak: streakResult.newStreak,
      streak_freezes: profile?.streak_freezes ? profile.streak_freezes - streakResult.freezesUsed : 0,
      pet_stage: ratchetStage(profile?.pet_stage, streakResult.newStreak),
      last_active_date: today,
      updated_at: new Date().toISOString(),
    }).eq("id", userId);

    await reconcileMemories(supabase, userId, streakResult.newStreak);
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

// ─────────────────────────────────────────────────────────────────────────────
// Pet care: feeding (grows nurture EXP) + interactions (bond) + neighbour visits.
// All economy/eligibility is re-validated server-side against a fresh profile read
// so a crafted client call can't cheat coins, EXP, or gate conditions.
// ─────────────────────────────────────────────────────────────────────────────

type FeedResult = ActionResult & {
  expGain?: number;
  satietyGain?: number;
  leveledUp?: boolean;
  newLevel?: number;
};

/**
 * Feed the pet a food tier bought with coins. Grows `pet_exp` proportional to the
 * satiety *actually* restored (feeding a full pet ≈ 0 EXP), plus a once-daily
 * bonus — so total nurture EXP per day is capped by decay, not by coins.
 */
export async function feedPetAction(foodId: string): Promise<FeedResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const tier = foodTier(foodId);
  if (!tier) return { error: "invalid_food" };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("timezone, coins, pet_exp, satiety, last_fed_date, affection_level")
    .eq("id", userId)
    .maybeSingle();
  if (profileError) return { error: profileError.message };

  const currentCoins = profile?.coins ?? 0;
  if (currentCoins < tier.cost) return { error: "not_enough_coins" };

  const timezone = profile?.timezone || "UTC";
  const today = todayInTimezone(timezone);

  // Effective satiety BEFORE feeding (decayed since the last feed). EXP + the new
  // stored satiety are both computed from this, and last_fed_date is reset to today
  // — keeping the (value, anchor) pair consistent so decay never double-counts.
  const eff = currentSatiety(profile?.satiety, profile?.last_fed_date ?? null, today);
  const newSatiety = Math.min(SATIETY_MAX, eff + tier.satiety);
  const satietyGain = newSatiety - eff;

  const isFirstFeedToday = profile?.last_fed_date !== today;
  const expGain = feedExpGain(eff, tier) + (isFirstFeedToday ? DAILY_FEED_BONUS_EXP : 0);
  const oldExp = profile?.pet_exp ?? 0;
  const newExp = oldExp + expGain;

  const newAffection = Math.min(AFFECTION_MAX, (profile?.affection_level ?? 0) + AFFECTION_PER_FEED);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      coins: currentCoins - tier.cost,
      satiety: newSatiety,
      pet_exp: newExp,
      affection_level: newAffection,
      last_fed_date: today,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (updateError) return { error: updateError.message };

  revalidatePath("/", "layout");
  const newLevel = levelFromExp(newExp);
  return {
    expGain,
    satietyGain,
    newLevel,
    leveledUp: newLevel > levelFromExp(oldExp),
  };
}

/**
 * A tactile interaction (pat/play/clean/sleep). Always succeeds so the client can
 * play the animation; affection is only granted when off cooldown AND under the
 * daily cap. Satiety is intentionally untouched here — it is a feed-only stat so
 * its decay anchor (last_fed_date) stays valid.
 */
const INTERACTION_KINDS: InteractionKind[] = ["feed", "pat", "play", "clean", "sleep"];

export async function petInteractAction(kind: InteractionKind): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };
  if (!INTERACTION_KINDS.includes(kind)) return { error: "invalid_interaction" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone, affection_level, affection_today, last_interact_at")
    .eq("id", userId)
    .maybeSingle();

  const timezone = profile?.timezone || "UTC";
  const today = todayInTimezone(timezone);
  const nowMs = Date.now();

  const lastMs = profile?.last_interact_at ? Date.parse(profile.last_interact_at) : 0;
  const withinCooldown = nowMs - lastMs < INTERACT_COOLDOWN_MS;

  // Daily affection budget resets when the last interaction fell on a prior day.
  const lastInteractDate = profile?.last_interact_at
    ? new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date(profile.last_interact_at))
    : null;
  const affectionToday = lastInteractDate === today ? (profile?.affection_today ?? 0) : 0;

  const patch: Record<string, unknown> = {
    last_interact_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (!withinCooldown && affectionToday < AFFECTION_DAILY_CAP) {
    const grant = Math.min(AFFECTION_PER_INTERACT, AFFECTION_DAILY_CAP - affectionToday);
    patch.affection_level = Math.min(AFFECTION_MAX, (profile?.affection_level ?? 0) + grant);
    patch.affection_today = affectionToday + grant;
  } else {
    // Keep the (possibly reset) daily counter coherent even when nothing is granted.
    patch.affection_today = affectionToday;
  }

  const { error: updateError } = await supabase.from("profiles").update(patch).eq("id", userId);
  if (updateError) return { error: updateError.message };

  revalidatePath("/", "layout");
  return {};
}

/**
 * Claim the once-per-day gift from visiting the NPC neighbourhood. Requires every
 * room unlocked (verified server-side from pet_exp) and not already claimed today.
 */
export async function claimNeighborGiftAction(): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("timezone, coins, pet_exp, affection_level, last_neighbor_gift_date")
    .eq("id", userId)
    .maybeSingle();
  if (profileError) return { error: profileError.message };

  if (!allRoomsUnlocked(levelFromExp(profile?.pet_exp ?? 0))) return { error: "rooms_locked" };

  const timezone = profile?.timezone || "UTC";
  const today = todayInTimezone(timezone);
  if (profile?.last_neighbor_gift_date === today) return { error: "already_claimed" };

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      coins: (profile?.coins ?? 0) + NEIGHBOR_GIFT_COINS,
      affection_level: Math.min(AFFECTION_MAX, (profile?.affection_level ?? 0) + NEIGHBOR_GIFT_AFFECTION),
      last_neighbor_gift_date: today,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (updateError) return { error: updateError.message };

  revalidatePath("/", "layout");
  return {};
}
