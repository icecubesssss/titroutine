// Server-side co-op queries shared by the dashboard loader and the visit actions.
// Kept out of the "use server" module on purpose: it takes a Supabase client, so
// it must not become a callable server-action endpoint.

import type { createClient } from "@/utils/supabase/server";
import { todayInTimezone } from "./game";
import { dateInTimezone } from "./coop";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

/** How far back to scan when counting today's sends — covers every timezone offset. */
const COOP_LOOKBACK_MS = 48 * 60 * 60 * 1000;

/**
 * How many times the user already sent each co-op kind today, counted in their own
 * timezone. Drives both the server-side daily cap and the dock's disabled state,
 * so the UI never offers a button the action will reject.
 */
export async function countCoopsSentToday(
  supabase: SupabaseServerClient,
  userId: string,
  timezone: string
): Promise<Record<string, number>> {
  const since = new Date(Date.now() - COOP_LOOKBACK_MS).toISOString();
  const { data } = await supabase
    .from("coop_interactions")
    .select("kind, created_at")
    .eq("actor_id", userId)
    .gte("created_at", since);

  const today = todayInTimezone(timezone);
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    if (dateInTimezone(new Date(row.created_at), timezone) !== today) continue;
    counts[row.kind] = (counts[row.kind] ?? 0) + 1;
  }
  return counts;
}
