"use server";

import { revalidatePath } from "next/cache";
import { AFFECTION_MAX } from "@/lib/game";
import { COOP_KINDS, coopBlockReason, isCoopKind } from "@/lib/coop";
import { countCoopsSentToday } from "@/lib/coop_server";
import { getUserId, type ActionResult, type Supabase } from "./_shared";

/**
 * End every active session the user is part of, on either side. Starting a visit
 * supersedes whatever was in progress, and the DB only allows one active session
 * per visitor anyway (`visit_sessions_one_active_per_visitor`).
 */
async function endActiveSessionsFor(supabase: Supabase, userId: string) {
  await supabase
    .from("visit_sessions")
    .update({ status: "ended", ended_at: new Date().toISOString() })
    .eq("status", "active")
    .or(`visitor_id.eq.${userId},host_id.eq.${userId}`);
}

/**
 * Open a visit session with a neighbour.
 *
 *   "go_over"     → my companion stands in THEIR room  (visitor = me)
 *   "invite_over" → their companion stands in MY room  (visitor = them)
 *
 * A neighbour whose `visit_privacy` is 'nobody' is unavailable in both directions:
 * the setting means "leave me out of visits", not just "don't enter my room".
 * Friendship itself is enforced by the INSERT policy on `visit_sessions`.
 */
export async function startVisitAction(
  neighborId: string,
  mode: "go_over" | "invite_over"
): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };
  if (!neighborId || neighborId === userId) return { error: "invalid_neighbor" };
  if (mode !== "go_over" && mode !== "invite_over") return { error: "invalid_mode" };

  const { data: neighbor } = await supabase
    .from("profiles")
    .select("id, visit_privacy")
    .eq("id", neighborId)
    .maybeSingle();

  if (!neighbor) return { error: "neighbor_not_found" };
  if (neighbor.visit_privacy === "nobody") return { error: "visits_closed" };

  await endActiveSessionsFor(supabase, userId);
  // The guest also can't be in two rooms at once — free up their side too. RLS
  // only lets us close sessions we are part of, so a guest who is off visiting a
  // third person stays put and the insert below trips the one-active-visit index.
  await endActiveSessionsFor(supabase, neighborId);

  const { error } = await supabase.from("visit_sessions").insert({
    visitor_id: mode === "go_over" ? userId : neighborId,
    host_id: mode === "go_over" ? neighborId : userId,
    initiated_by: userId,
    status: "active",
    // Our own arrival needs no badge; an invite is news to the guest, not to us.
    seen_by_host: mode === "invite_over",
  });
  if (error) {
    // 23505 = unique violation on visit_sessions_one_active_per_visitor.
    if (error.code === "23505") return { error: "neighbor_busy" };
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  return {};
}

/** Close the visit the user is currently in, from either side. */
export async function endVisitAction(): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  await endActiveSessionsFor(supabase, userId);

  revalidatePath("/", "layout");
  return {};
}

/** Clear the "someone came over" badge once the host has actually seen the room. */
export async function markVisitSeenAction(sessionId: string): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const { error } = await supabase
    .from("visit_sessions")
    .update({ seen_by_host: true })
    .eq("id", sessionId)
    .eq("host_id", userId);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}

/**
 * Do something together with whoever is currently in the room. The actor's reward
 * lands immediately; the partner's waits as an unclaimed `coop_interactions` row
 * so we never have to write to another user's profile (same pattern as vibes).
 */
export async function sendCoopAction(kind: string): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };
  if (!isCoopKind(kind)) return { error: "unknown_kind" };

  const { data: session } = await supabase
    .from("visit_sessions")
    .select("id, visitor_id, host_id")
    .eq("status", "active")
    .or(`visitor_id.eq.${userId},host_id.eq.${userId}`)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!session) return { error: "no_active_visit" };
  const targetId = session.visitor_id === userId ? session.host_id : session.visitor_id;

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone, affection_level")
    .eq("id", userId)
    .maybeSingle();

  const timezone = profile?.timezone || "UTC";
  const affection = profile?.affection_level ?? 0;
  const usedToday = (await countCoopsSentToday(supabase, userId, timezone))[kind] ?? 0;

  const blocked = coopBlockReason(kind, affection, usedToday);
  if (blocked) return { error: blocked };

  const { error: insertError } = await supabase.from("coop_interactions").insert({
    session_id: session.id,
    actor_id: userId,
    target_id: targetId,
    kind,
  });
  if (insertError) return { error: insertError.message };

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      affection_level: Math.min(AFFECTION_MAX, affection + COOP_KINDS[kind].affection),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (profileError) return { error: profileError.message };

  revalidatePath("/", "layout");
  return {};
}

/**
 * Collect every co-op reward sent to us while we were away. Idempotent: rows are
 * only counted while `claimed_at` is null, so a double-tap can't double-pay.
 */
export async function claimCoopsAction(): Promise<
  ActionResult & { claimed?: number; affectionGained?: number }
> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const { data: pending, error: fetchError } = await supabase
    .from("coop_interactions")
    .select("id, kind")
    .eq("target_id", userId)
    .is("claimed_at", null);

  if (fetchError) return { error: fetchError.message };
  if (!pending || pending.length === 0) return { claimed: 0, affectionGained: 0 };

  const { error: claimError } = await supabase
    .from("coop_interactions")
    .update({ claimed_at: new Date().toISOString() })
    .in(
      "id",
      pending.map((row) => row.id)
    )
    .is("claimed_at", null);
  if (claimError) return { error: claimError.message };

  const { data: profile } = await supabase
    .from("profiles")
    .select("affection_level")
    .eq("id", userId)
    .maybeSingle();

  const before = profile?.affection_level ?? 0;
  const reward = pending.reduce(
    (sum, row) => sum + (isCoopKind(row.kind) ? COOP_KINDS[row.kind].affection : 0),
    0
  );
  const after = Math.min(AFFECTION_MAX, before + reward);

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ affection_level: after, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (profileError) return { error: profileError.message };

  revalidatePath("/", "layout");
  return { claimed: pending.length, affectionGained: after - before };
}
