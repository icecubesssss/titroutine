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
