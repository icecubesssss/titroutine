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
