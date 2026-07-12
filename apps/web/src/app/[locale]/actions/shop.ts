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
