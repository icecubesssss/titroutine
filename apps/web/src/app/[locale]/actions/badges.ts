"use server";

import { revalidatePath } from "next/cache";
import { getUserId, type ActionResult } from "./_shared";
import { BADGES, getBadge } from "@/lib/badges";

/**
 * Buy a streak-milestone badge. Eligibility (streak) and price are re-checked
 * against a fresh profile read, same pattern as buyItemAction — never trust
 * the client's price/streak.
 */
export async function buyBadgeAction(badgeKey: string): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const badge = getBadge(badgeKey);
  if (!badge) return { error: "unknown_badge" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("coins, current_streak")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) return { error: "profile_not_found" };

  if ((profile.current_streak ?? 0) < badge.requiredStreak) return { error: "streak_too_low" };
  if ((profile.coins ?? 0) < badge.price) return { error: "not_enough_coins" };

  const { error: insertError } = await supabase.from("badges").insert({
    user_id: userId,
    badge_key: badgeKey,
  });
  // 23505 = unique violation — already owned (badges_user_id_badge_key_key).
  if (insertError) {
    return { error: insertError.code === "23505" ? "already_owned" : insertError.message };
  }

  const { error: coinsError } = await supabase
    .from("profiles")
    .update({ coins: profile.coins - badge.price })
    .eq("id", userId);
  if (coinsError) return { error: coinsError.message };

  revalidatePath("/", "layout");
  return {};
}

/** Drag-to-reposition a hung badge, same % coordinate scheme as moveDecorAction. */
export async function moveBadgeAction(badgeKey: string, x: number, y: number): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };
  if (!Number.isFinite(x) || !Number.isFinite(y)) return { error: "invalid_position" };

  const clampedX = Math.min(100, Math.max(0, Math.round(x * 10) / 10));
  const clampedY = Math.min(100, Math.max(0, Math.round(y * 10) / 10));

  const { error } = await supabase
    .from("badges")
    .update({ pos_x: clampedX, pos_y: clampedY })
    .eq("user_id", userId)
    .eq("badge_key", badgeKey);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}

/** Tap-to-hide/show — the client already knows the current state, so it just sends the next one. */
export async function setBadgeVisibilityAction(badgeKey: string, visible: boolean): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const { error } = await supabase
    .from("badges")
    .update({ visible })
    .eq("user_id", userId)
    .eq("badge_key", badgeKey);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}

/**
 * Mark the "you unlocked a badge!" celebration as shown, so it doesn't fire
 * again on the next page load. Recomputes from a fresh streak read rather than
 * trusting the client, and only ever moves forward.
 */
export async function acknowledgeBadgeMilestoneAction(): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("current_streak, badge_milestone_seen")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) return { error: "profile_not_found" };

  const streak = profile.current_streak ?? 0;
  const seen = profile.badge_milestone_seen ?? 0;
  const highestReached = BADGES.filter((b) => streak >= b.requiredStreak).reduce(
    (max, b) => Math.max(max, b.requiredStreak),
    seen
  );
  if (highestReached <= seen) return {};

  const { error } = await supabase
    .from("profiles")
    .update({ badge_milestone_seen: highestReached })
    .eq("id", userId);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}
