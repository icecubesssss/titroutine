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
