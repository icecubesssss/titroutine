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
