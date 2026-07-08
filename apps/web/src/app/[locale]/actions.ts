"use server";

import { revalidatePath } from "next/cache";
import { format, addDays, parseISO } from "date-fns";
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
import { allRoomsUnlocked, ROOMS, type InteractionKind } from "@/lib/rooms";
import { eligibleMemoryKeys } from "@/lib/memories";
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

/**
 * Bật/tắt Chế độ đi nghỉ (vacation mode). Khi bật: đóng băng độ no + streak.
 * Cả hai chiều đều "chốt sổ" trạng thái hiện tại: lưu satiety hiệu dụng rồi mới
 * dời mốc last_fed_date (nếu không, satiety sẽ hồi ngược về giá trị cũ), và kéo
 * last_active_date lên hôm qua để streak sống sót qua ranh giới chuyến nghỉ.
 */
export async function setVacationModeAction(enabled: boolean): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("timezone, satiety, last_fed_date, last_active_date")
    .eq("id", userId)
    .maybeSingle();
  if (profileError) return { error: profileError.message };

  const timezone = profile?.timezone || "UTC";
  const today = todayInTimezone(timezone);
  const yesterday = format(addDays(parseISO(today), -1), "yyyy-MM-dd");

  const patch: Record<string, unknown> = {
    vacation_mode: enabled,
    updated_at: new Date().toISOString(),
  };
  if (profile?.last_fed_date && profile.last_fed_date < today) {
    patch.satiety = currentSatiety(profile.satiety, profile.last_fed_date, today);
    patch.last_fed_date = today;
  }
  if (profile?.last_active_date && profile.last_active_date < yesterday) {
    patch.last_active_date = yesterday;
  }

  const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
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

  // Cập nhật inventory (update)
  const { error: updateInvError } = await supabase
    .from("inventory")
    .update({
      unlocked_items: Array.from(unlocked),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

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
    .update({
      equipped_items: equipped,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (updateInvError) return { error: updateInvError.message };

  revalidatePath("/", "layout");
  return {};
}

/**
 * Lưu vị trí món nội thất (slot object) trong một phòng — kéo-thả kiểu Habit
 * Rabbit. Toạ độ là % của khung phòng, lưu theo từng phòng nên mỗi phòng nhớ
 * chỗ đặt riêng.
 */
export async function moveDecorAction(roomId: string, x: number, y: number): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  if (!ROOMS.some((r) => r.id === roomId)) return { error: "invalid_room" };
  if (!Number.isFinite(x) || !Number.isFinite(y)) return { error: "invalid_position" };
  const clampedX = Math.min(100, Math.max(0, Math.round(x * 10) / 10));
  const clampedY = Math.min(100, Math.max(0, Math.round(y * 10) / 10));

  const { data: inventory, error: invError } = await supabase
    .from("inventory")
    .select("decor_positions")
    .eq("user_id", userId)
    .maybeSingle();
  if (invError) return { error: invError.message };

  const positions = { ...((inventory?.decor_positions as Record<string, { x: number; y: number }>) || {}) };
  positions[roomId] = { x: clampedX, y: clampedY };

  const { error: updateError } = await supabase
    .from("inventory")
    .update({
      decor_positions: positions,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
  if (updateError) return { error: updateError.message };

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
  dialogue?: string;
};

/**
 * Cho thỏ ăn từ kho đồ tiêu dùng (không trừ tiền trực tiếp nữa).
 * Kiểm tra xem có thức ăn trong kho không và thỏ có bị no quá không.
 */
export async function feedPetAction(foodId: string): Promise<FeedResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const tier = foodTier(foodId);
  if (!tier) return { error: "invalid_food" };

  // 1. Lấy thông tin profile và kho đồ tiêu dùng
  const [{ data: profile, error: profileError }, { data: inventory, error: invError }] = await Promise.all([
    supabase
      .from("profiles")
      .select("timezone, coins, pet_exp, satiety, last_fed_date, affection_level, last_interact_at")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("inventory")
      .select("consumables")
      .eq("user_id", userId)
      .maybeSingle()
  ]);

  if (profileError) return { error: profileError.message };
  if (invError) return { error: invError.message };

  const consumables = (inventory?.consumables as Record<string, number>) || {};
  const currentCount = consumables[foodId] ?? 0;

  if (currentCount <= 0) {
    return { error: "no_food_in_inventory", dialogue: `Hết ${foodId === "carrot" ? "Cà rốt" : foodId === "cake" ? "Bánh ngọt" : "Đại tiệc"} rồi! Bạn hãy ghé cửa hàng để mua thêm nhé! 🛒` };
  }

  const timezone = profile?.timezone || "UTC";
  const today = todayInTimezone(timezone);

  // Tính độ no hiệu dụng trước khi cho ăn
  const eff = currentSatiety(profile?.satiety, profile?.last_fed_date ?? null, today);

  // 2. Kiểm tra giới hạn no chống spam (Satiety >= 95)
  const feedback = getFeedFeedback(foodId, eff);
  if (!feedback.canProceed) {
    return { error: "too_full", dialogue: feedback.message };
  }

  // 3. Tiến hành cho ăn: cộng chỉ số và giảm thức ăn trong kho
  const newSatiety = Math.min(SATIETY_MAX, eff + tier.satiety);
  const satietyGain = newSatiety - eff;

  const isFirstFeedToday = profile?.last_fed_date !== today;
  const expGain = feedExpGain(eff, tier) + (isFirstFeedToday ? DAILY_FEED_BONUS_EXP : 0);
  const oldExp = profile?.pet_exp ?? 0;
  const newExp = oldExp + expGain;

  const newAffection = Math.min(AFFECTION_MAX, (profile?.affection_level ?? 0) + AFFECTION_PER_FEED);

  // Cập nhật profile
  const { error: updateProfileError } = await supabase
    .from("profiles")
    .update({
      satiety: newSatiety,
      pet_exp: newExp,
      affection_level: newAffection,
      last_fed_date: today,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (updateProfileError) return { error: updateProfileError.message };

  // Giảm vật phẩm tiêu dùng trong kho
  const updatedConsumables = { ...consumables, [foodId]: currentCount - 1 };
  const { error: updateInvError } = await supabase
    .from("inventory")
    .update({
      consumables: updatedConsumables,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (updateInvError) return { error: updateInvError.message };

  revalidatePath("/", "layout");
  const newLevel = levelFromExp(newExp);
  return {
    expGain,
    satietyGain,
    newLevel,
    leveledUp: newLevel > levelFromExp(oldExp),
    dialogue: feedback.message,
  };
}

/**
 * Tương tác với thỏ (pat/play/clean/sleep).
 * Cho phép chỉ định đồ chơi khi chơi đùa và kiểm tra đói/no/cooldown để kích hoạt phản hồi tương ứng.
 */
type InteractResult = ActionResult & {
  dialogue?: string;
};

export async function petInteractAction(kind: InteractionKind, itemId?: string): Promise<InteractResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };
  const interactionKinds: InteractionKind[] = ["feed", "pat", "play", "clean", "sleep"];
  if (!interactionKinds.includes(kind)) return { error: "invalid_interaction" };

  // 1. Load profile và inventory
  const [{ data: profile, error: profileError }, { data: inventory, error: invError }] = await Promise.all([
    supabase
      .from("profiles")
      .select("timezone, affection_level, affection_today, last_interact_at, satiety, last_fed_date")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("inventory")
      .select("consumables")
      .eq("user_id", userId)
      .maybeSingle()
  ]);

  if (profileError) return { error: profileError.message };
  if (invError) return { error: invError.message };

  const timezone = profile?.timezone || "UTC";
  const today = todayInTimezone(timezone);
  const nowMs = Date.now();
  const effSatiety = currentSatiety(profile?.satiety, profile?.last_fed_date ?? null, today);

  const consumables = (inventory?.consumables as Record<string, number>) || {};
  const updatedConsumables = { ...consumables };

  let dialogueMessage = "🐰 *Bạn xoa đầu bé thỏ, thỏ cọ cọ tay mừng rỡ!*";
  
  // 2. Xử lý logic cụ thể từng loại tương tác
  if (kind === "play") {
    const toyId = itemId || "toy_ball";
    const currentToyCount = consumables[toyId] ?? 0;
    
    if (currentToyCount <= 0) {
      return { 
        error: "no_toy_in_inventory", 
        dialogue: `Bạn không có món đồ chơi ${toyId === "toy_ball" ? "Bóng cao su" : "Gấu bông"} nào cả! Hãy vào quầy mua trước nhé! 🧸` 
      };
    }

    const feedback = getPlayFeedback(toyId, effSatiety);
    if (!feedback.canProceed) {
      return { error: "too_hungry", dialogue: feedback.message };
    }

    dialogueMessage = feedback.message;
    updatedConsumables[toyId] = currentToyCount - 1;
  } else if (kind === "clean") {
    const feedback = getCleanFeedback(profile?.last_interact_at ?? null);
    if (!feedback.canProceed) {
      return { error: "too_clean", dialogue: feedback.message };
    }
    dialogueMessage = feedback.message;
  } else if (kind === "sleep") {
    const currentHour = new Date(nowMs).toLocaleString("en-US", { timeZone: timezone, hour: "numeric", hour12: false });
    const feedback = getSleepFeedback(parseInt(currentHour, 10));
    if (!feedback.canProceed) {
      return { error: "not_sleepy", dialogue: feedback.message };
    }
    dialogueMessage = feedback.message;
  }

  // 3. Tính toán cộng Affection (chỉ số thân thiết)
  const lastMs = profile?.last_interact_at ? Date.parse(profile.last_interact_at) : 0;
  const withinCooldown = nowMs - lastMs < INTERACT_COOLDOWN_MS;

  const lastInteractDate = profile?.last_interact_at
    ? new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date(profile.last_interact_at))
    : null;
  const affectionToday = lastInteractDate === today ? (profile?.affection_today ?? 0) : 0;

  const patch: Record<string, unknown> = {
    last_interact_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Nếu chơi đùa, độ no satiety bị giảm đi 5 (chạy nhảy hao năng lượng!)
  if (kind === "play") {
    patch.satiety = Math.max(0, effSatiety - 5);
    patch.last_fed_date = today; // reset decay anchor
  }

  if (!withinCooldown && affectionToday < AFFECTION_DAILY_CAP) {
    const grant = Math.min(AFFECTION_PER_INTERACT, AFFECTION_DAILY_CAP - affectionToday);
    patch.affection_level = Math.min(AFFECTION_MAX, (profile?.affection_level ?? 0) + grant);
    patch.affection_today = affectionToday + grant;
  } else {
    patch.affection_today = affectionToday;
  }

  // Cập nhật profile
  const { error: updateProfileError } = await supabase.from("profiles").update(patch).eq("id", userId);
  if (updateProfileError) return { error: updateProfileError.message };

  // Cập nhật kho đồ nếu có tiêu hao
  if (kind === "play") {
    const { error: updateInvError } = await supabase.from("inventory").update({
      consumables: updatedConsumables,
      updated_at: new Date().toISOString(),
    }).eq("user_id", userId);
    if (updateInvError) return { error: updateInvError.message };
  }

  revalidatePath("/", "layout");
  return { dialogue: dialogueMessage };
}

/**
 * Dọn một điểm bừa bộn trong phòng (Habit-Rabbit style). Tiêu cleaning_energy
 * tích từ việc hoàn thành habit; điểm đã dọn là vĩnh viễn. Dọn sạch cả phòng
 * thưởng thêm xu + tặng một món nội thất vào inventory.
 */
type CleanSpotResult = ActionResult & {
  roomCleaned?: boolean;
  giftItemId?: string;
  coinsGained?: number;
};

export async function cleanMessSpotAction(spotId: string): Promise<CleanSpotResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const spot = findMessSpot(spotId);
  if (!spot) return { error: "invalid_spot" };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("cleaning_energy, cleaned_spots, coins")
    .eq("id", userId)
    .maybeSingle();
  if (profileError) return { error: profileError.message };

  const cleaned = (profile?.cleaned_spots as Record<string, boolean>) || {};
  if (cleaned[spotId]) return {}; // đã dọn rồi — idempotent

  const energy = profile?.cleaning_energy ?? 0;
  if (energy < spot.cost) return { error: "not_enough_energy" };

  const newCleaned = { ...cleaned, [spotId]: true };
  const roomCleaned = isRoomFullyClean(spot.roomId, newCleaned);
  const coinsGained = SPOT_CLEAN_COINS + (roomCleaned ? ROOM_CLEAN_BONUS_COINS : 0);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      cleaning_energy: energy - spot.cost,
      cleaned_spots: newCleaned,
      coins: (profile?.coins ?? 0) + coinsGained,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (updateError) return { error: updateError.message };

  // Quà nội thất khi phòng sạch bóng (bỏ qua nếu đã sở hữu).
  let giftItemId: string | undefined;
  if (roomCleaned) {
    const candidate = ROOM_CLEAN_GIFTS[spot.roomId];
    const { data: inventory } = await supabase
      .from("inventory")
      .select("unlocked_items")
      .eq("user_id", userId)
      .maybeSingle();
    const unlocked = (inventory?.unlocked_items as string[]) || [];
    if (candidate && !unlocked.includes(candidate)) {
      const { error: invError } = await supabase
        .from("inventory")
        .update({
          unlocked_items: [...unlocked, candidate],
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
      if (!invError) giftItemId = candidate;
    }
  }

  revalidatePath("/", "layout");
  return { roomCleaned, giftItemId, coinsGained };
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

export async function buyConsumableAction(itemId: string, price: number): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("coins")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) return { error: profileError.message };
  const currentCoins = profile?.coins ?? 0;

  if (currentCoins < price) return { error: "not_enough_coins" };

  const { data: inventory, error: invError } = await supabase
    .from("inventory")
    .select("consumables")
    .eq("user_id", userId)
    .maybeSingle();

  if (invError) return { error: invError.message };

  const consumables = (inventory?.consumables as Record<string, number>) || {};
  const newCount = (consumables[itemId] ?? 0) + 1;
  const updatedConsumables = { ...consumables, [itemId]: newCount };

  const { error: updateProfileError } = await supabase
    .from("profiles")
    .update({ coins: currentCoins - price })
    .eq("id", userId);

  if (updateProfileError) return { error: updateProfileError.message };

  const { error: updateInvError } = await supabase
    .from("inventory")
    .update({
      consumables: updatedConsumables,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (updateInvError) return { error: updateInvError.message };

  revalidatePath("/", "layout");
  return {};
}

export async function startAdventureAction(): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("adventure_energy, adventure_status")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) return { error: profileError.message };
  if ((profile?.adventure_energy ?? 0) < 30) return { error: "not_enough_energy" };
  if (profile?.adventure_status !== "idle") return { error: "already_adventuring" };

  const story = getRandomStory();

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      adventure_status: "adventuring",
      adventure_energy: 0,
      adventure_start_at: new Date().toISOString(),
      adventure_story_id: story.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (updateError) return { error: updateError.message };

  revalidatePath("/", "layout");
  return {};
}

export async function completeAdventureAction(choiceIndex: "A" | "B"): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("adventure_status, adventure_story_id, personality_curiosity, personality_compassion, personality_resilience, personality_energy, pet_likes, pet_dislikes, coins")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) return { error: profileError.message };
  if (profile?.adventure_status !== "adventuring") return { error: "not_adventuring" };

  const storyId = profile?.adventure_story_id;
  if (!storyId) return { error: "no_story_active" };

  const story = ADVENTURE_STORIES.find((s) => s.id === storyId);
  if (!story) return { error: "story_not_found" };

  const choice = choiceIndex === "A" ? story.choiceA : story.choiceB;

  const currentCuriosity = profile?.personality_curiosity ?? 10;
  const currentCompassion = profile?.personality_compassion ?? 10;
  const currentResilience = profile?.personality_resilience ?? 10;
  const currentEnergy = profile?.personality_energy ?? 10;

  const patch: Record<string, unknown> = {
    adventure_status: "idle",
    adventure_story_id: null,
    adventure_start_at: null,
    coins: (profile?.coins ?? 0) + 15,
    updated_at: new Date().toISOString(),
  };

  if (choice.trait === "curiosity") patch.personality_curiosity = currentCuriosity + choice.value;
  if (choice.trait === "compassion") patch.personality_compassion = currentCompassion + choice.value;
  if (choice.trait === "resilience") patch.personality_resilience = currentResilience + choice.value;
  if (choice.trait === "energy") patch.personality_energy = currentEnergy + choice.value;

  const currentLikes = profile?.pet_likes || [];
  const currentDislikes = profile?.pet_dislikes || [];

  if (choice.like && !currentLikes.includes(choice.like)) {
    patch.pet_likes = [...currentLikes, choice.like];
  }
  if (choice.dislike && !currentDislikes.includes(choice.dislike)) {
    patch.pet_dislikes = [...currentDislikes, choice.dislike];
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", userId);

  if (updateError) return { error: updateError.message };

  await supabase
    .from("memories")
    .upsert({
      user_id: userId,
      memory_key: `adventure_${storyId}`,
    }, { onConflict: "user_id,memory_key", ignoreDuplicates: true });

  revalidatePath("/", "layout");
  return {};
}

export async function logMoodAction(mood: string, tags: string[], reflection: string, locale: string = "vi"): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("coins, satiety, affection_level, timezone")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) return { error: profileError.message };

  const timezone = profile?.timezone || "UTC";
  const today = todayInTimezone(timezone);

  const newCoins = (profile?.coins ?? 0) + 15;
  const newAffection = Math.min(AFFECTION_MAX, (profile?.affection_level ?? 0) + 10);

  // 1. Cập nhật profiles
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      coins: newCoins,
      affection_level: newAffection,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (updateError) return { error: updateError.message };

  // 2. Ghi thực tế vào daily_bean_logs
  const { error: logError } = await supabase
    .from("daily_bean_logs")
    .upsert({
      user_id: userId,
      logged_date: today,
      mood: mood,
      activities: tags,
      note: reflection,
      created_at: new Date().toISOString()
    }, { onConflict: "user_id,logged_date" });

  if (logError) return { error: logError.message };

  // 3. Gọi Gemini API (hoặc dùng fallback nếu không có key) để viết nhật ký dễ thương
  let diaryText = "";
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const prompt = `You are a super cute virtual pet bunny companion.
Your owner just checked in their mood: "${mood}"
Activities they did: ${tags.join(", ")}
Their reflection/notes: "${reflection || "No reflection written."}"

Write a very short, warm, cute diary entry (1-3 sentences) from the pet bunny's perspective.
Express empathy, encouragement, and love. Use cute expressions and emojis.
Write the diary entry in the following language: ${locale === "zh" ? "Chinese" : locale === "en" ? "English" : "Vietnamese"}.
Do not include any metadata, intro, or markdown wrapper. Just output the plain text diary content directly.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          }),
          signal: AbortSignal.timeout(5000),
        }
      );
      if (response.ok) {
        const result = await response.json();
        const generated = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (generated && generated.trim().length > 0) {
          diaryText = generated.trim();
        }
      }
    } catch (e) {
      console.warn("Gemini diary generation failed, falling back to rule-based: ", e);
    }
  }

  if (!diaryText) {
    const loc = locale || "vi";
    if (loc === "zh") {
      const dict: Record<string, string> = {
        awesome: "主人今天超开心！兔兔也跟着手舞足蹈啦，祝我们天天都有好心情！🐰✨",
        good: "今天是美好的一天！有主人陪伴，兔兔觉得心里暖洋洋的。我们要继续加油哦！🥕",
        neutral: "平平静静的一天。兔兔会一直在你身边，吃着胡萝卜听你倾诉。爱你！💕",
        bad: "主人今天有点累或者不开心吗？别担心，兔兔给你一个毛茸茸的温暖拥抱！🥺🌸",
        awful: "心疼主人……今天一定很不容易吧？兔兔抱抱你，已经为你准备了最甜的嫩草，我们一起休息吧。😭❤️",
      };
      diaryText = dict[mood] || dict.neutral;
    } else if (loc === "en") {
      const dict: Record<string, string> = {
        awesome: "My owner is super happy today! I'm so excited to share this joyful day with you. Keep shining! 🐰✨",
        good: "Today was a wonderful day! I feel so warm and cozy being by your side. Let's keep building great habits! 🥕",
        neutral: "A peaceful day passed by. I'll always be here to munch on carrots and listen to you. Love you! 💕",
        bad: "You seem a bit tired or down today... Don't worry, I'm sending you the biggest, softest bunny hug! 🥺🌸",
        awful: "Oh no, today was really tough for you... I'm right here with a warm hug and sweet fresh clover. You're doing your best! 😭❤️",
      };
      diaryText = dict[mood] || dict.neutral;
    } else {
      const dict: Record<string, string> = {
        awesome: "Hôm nay chủ nhân của tớ siêu siêu vui vẻ! Tớ đã cùng chủ nhân trải qua một ngày thật nhiều niềm vui. Cố lên nhé chủ nhân ơi! 🐰✨",
        good: "Chủ nhân của tớ hôm nay rất tuyệt! Tớ cảm thấy vô cùng ấm áp khi được ở bên cạnh bạn. Hãy cùng nhau xây dựng thói quen tốt mỗi ngày nha! 🥕",
        neutral: "Một ngày bình yên trôi qua. Tớ luôn ở đây để nhấm nháp cỏ và lắng nghe mọi chia sẻ của bạn. Thương chủ nhân nhiều! 💕",
        bad: "Hôm nay chủ nhân có vẻ mệt mỏi hoặc buồn một chút... Đừng lo lắng nhé, tớ sẽ ôm bạn thật chặt bằng đôi tai dài mềm mại này! 🥺🌸",
        awful: "Thương chủ nhân quá... Hôm nay chắc hẳn rất khó khăn với bạn đúng không? Tớ đã chuẩn bị một cái ôm thật ấm và cỏ tươi ngọt ngào cho bạn rồi đây. Thương thương! 😭❤️",
      };
      diaryText = dict[mood] || dict.neutral;
    }
  }

  // 4. Ghi nhật ký vào ai_pet_diaries
  const { error: diaryError } = await supabase
    .from("ai_pet_diaries")
    .upsert({
      user_id: userId,
      logged_date: today,
      diary_content: diaryText,
      created_at: new Date().toISOString()
    }, { onConflict: "user_id,logged_date" });

  if (diaryError) {
    console.error("Failed to save AI diary:", diaryError.message);
  }

  revalidatePath("/", "layout");
  return {};
}

export async function completeBreathingAction(): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("coins, affection_level, satiety")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) return { error: profileError.message };

  const newCoins = (profile?.coins ?? 0) + 10;
  const newAffection = Math.min(AFFECTION_MAX, (profile?.affection_level ?? 0) + 10);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      coins: newCoins,
      affection_level: newAffection,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (updateError) return { error: updateError.message };

  revalidatePath("/", "layout");
  return {};
}

export async function addFriendAction(friendCode: string): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const fCode = friendCode.trim();
  if (!fCode) return { error: "empty_code" };

  const { data: friendProfile, error: friendError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", fCode)
    .maybeSingle();

  if (friendError || !friendProfile) {
    return { error: "friend_not_found" };
  }

  if (friendProfile.id === userId) {
    return { error: "cannot_add_self" };
  }

  const { error: fError } = await supabase
    .from("friendships")
    .insert([
      { user_id: userId, friend_id: friendProfile.id },
      { user_id: friendProfile.id, friend_id: userId }
    ]);

  // friendships unique constraint may trigger conflict which is fine
  if (fError && !fError.message.includes("unique")) return { error: fError.message };

  revalidatePath("/", "layout");
  return {};
}

export async function sendVibeAction(friendId: string, vibeType: string): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const { error } = await supabase
    .from("social_vibes")
    .insert({
      sender_id: userId,
      receiver_id: friendId,
      vibe_type: vibeType,
    });

  if (error) return { error: error.message };
  return {};
}

export async function claimVibeAction(vibeId: string): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const { data: vibe, error: vibeError } = await supabase
    .from("social_vibes")
    .select("sender_id, claimed_at")
    .eq("id", vibeId)
    .eq("receiver_id", userId)
    .maybeSingle();

  if (vibeError || !vibe) return { error: "vibe_not_found" };
  if (vibe.claimed_at) return { error: "already_claimed" };

  const { error: updateVibeError } = await supabase
    .from("social_vibes")
    .update({ claimed_at: new Date().toISOString() })
    .eq("id", vibeId);

  if (updateVibeError) return { error: updateVibeError.message };

  const { data: profile } = await supabase
    .from("profiles")
    .select("affection_level")
    .eq("id", userId)
    .maybeSingle();

  const newAffection = Math.min(100, (profile?.affection_level ?? 0) + 5);
  await supabase
    .from("profiles")
    .update({ affection_level: newAffection })
    .eq("id", userId);

  revalidatePath("/", "layout");
  return {};
}

export async function getAiDiariesAction() {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const { data, error } = await supabase
    .from("ai_pet_diaries")
    .select("logged_date, diary_content, unlocked_photo_url")
    .eq("user_id", userId)
    .order("logged_date", { ascending: false });

  if (error) return { error: error.message };
  return { diaries: data || [] };
}

export async function claimKeepsakeAction(keepsakeId: string): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  // Get current inventory
  const { data: inventory, error: fetchErr } = await supabase
    .from("inventory")
    .select("unlocked_items")
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchErr) return { error: fetchErr.message };

  const unlocked = inventory?.unlocked_items || [];
  if (unlocked.includes(keepsakeId)) {
    return {}; // already unlocked
  }

  const { error: updateErr } = await supabase
    .from("inventory")
    .update({
      unlocked_items: [...unlocked, keepsakeId]
    })
    .eq("user_id", userId);

  if (updateErr) return { error: updateErr.message };

  revalidatePath("/", "layout");
  return {};
}

// Focus duration is also the focus-token reward on completion — never trust
// the client-provided value beyond the range the UI offers (1 phút..1 ngày).
function clampFocusDuration(minutes: number): number {
  if (!Number.isFinite(minutes)) return 25;
  return Math.min(1440, Math.max(1, Math.round(minutes)));
}

export async function createTaskAction(input: {
  title: string;
  notes?: string;
  priority: "low" | "medium" | "high";
  assigneeType: "self" | "pet";
  focusDuration: number;
  deadline?: string | null;
}): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };
  if (!input.title) return { error: "title_required" };

  const { error } = await supabase.from("tasks").insert({
    user_id: userId,
    title: input.title,
    notes: input.notes || null,
    priority: input.priority,
    assignee_type: input.assigneeType,
    focus_duration: clampFocusDuration(input.focusDuration),
    deadline: input.deadline || null,
    status: "todo",
  });

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}

export async function deleteTaskAction(taskId: string): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", userId);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}

export async function updateTaskDetailsAction(
  taskId: string,
  input: {
    title?: string;
    notes?: string;
    priority?: "low" | "medium" | "high";
    assigneeType?: "self" | "pet";
    focusDuration?: number;
    deadline?: string | null;
  }
): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const updateData: Record<string, unknown> = {};
  if (input.title !== undefined) updateData.title = input.title;
  if (input.notes !== undefined) updateData.notes = input.notes;
  if (input.priority !== undefined) updateData.priority = input.priority;
  if (input.assigneeType !== undefined) updateData.assignee_type = input.assigneeType;
  if (input.focusDuration !== undefined) updateData.focus_duration = clampFocusDuration(input.focusDuration);
  if (input.deadline !== undefined) updateData.deadline = input.deadline;
  updateData.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from("tasks")
    .update(updateData)
    .eq("id", taskId)
    .eq("user_id", userId);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}

export async function updateTaskStatusAction(
  taskId: string,
  status: "todo" | "in_progress" | "done"
): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  // Fetch the existing task to verify status change
  const { data: task, error: fetchTaskErr } = await supabase
    .from("tasks")
    .select("status, focus_duration, deadline")
    .eq("id", taskId)
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchTaskErr) return { error: fetchTaskErr.message };
  if (!task) return { error: "task_not_found" };

  const oldStatus = task.status;
  
  // Update task status
  const { error: updateTaskErr } = await supabase
    .from("tasks")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", taskId)
    .eq("user_id", userId);

  if (updateTaskErr) return { error: updateTaskErr.message };

  // If transitioning to "done" for the first time in this change
  if (status === "done" && oldStatus !== "done") {
    // 1. Reward Focus Tokens and check overdue penalty in profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("focus_tokens, affection_level")
      .eq("id", userId)
      .maybeSingle();

    if (profile) {
      const currentTokens = profile.focus_tokens ?? 0;
      const currentAffection = profile.affection_level ?? 0;
      const rewardTokens = task.focus_duration ?? 25;
      
      let newAffection = currentAffection;
      
      // Check overdue: deadline present and in the past
      if (task.deadline) {
        const deadlineDate = new Date(task.deadline);
        if (deadlineDate < new Date()) {
          // Overdue penalty: reduce affection by 5 (clamped to 0)
          newAffection = Math.max(0, currentAffection - 5);
        }
      }

      await supabase
        .from("profiles")
        .update({
          focus_tokens: currentTokens + rewardTokens,
          affection_level: newAffection
        })
        .eq("id", userId);
    }

    // 2. Add carrot to inventory consumables
    const { data: inventory } = await supabase
      .from("inventory")
      .select("consumables")
      .eq("user_id", userId)
      .maybeSingle();

    const consumables = (inventory?.consumables as Record<string, number>) || {};
    const newCarrotCount = (consumables["carrot"] ?? 0) + 1; // reward 1 carrot
    const updatedConsumables = { ...consumables, carrot: newCarrotCount };

    await supabase
      .from("inventory")
      .update({ consumables: updatedConsumables })
      .eq("user_id", userId);
  }

  revalidatePath("/", "layout");
  return {};
}

export async function buyFocusItemAction(itemId: string, price: number): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("focus_tokens, affection_level")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) return { error: "profile_not_found" };
  const currentTokens = profile.focus_tokens ?? 0;
  if (currentTokens < price) return { error: "not_enough_tokens" };

  const currentAffection = profile.affection_level ?? 0;
  
  let affectionGain = 0;
  if (itemId === "matcha_tea") affectionGain = 15;
  else if (itemId === "magic_book") affectionGain = 40;
  else if (itemId === "focus_cushion") affectionGain = 25;

  const newAffection = Math.min(100, currentAffection + affectionGain);

  const { error } = await supabase
    .from("profiles")
    .update({
      focus_tokens: currentTokens - price,
      affection_level: newAffection
    })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}


