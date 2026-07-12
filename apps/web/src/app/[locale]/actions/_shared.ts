import { createClient } from "@/utils/supabase/server";
import { eligibleMemoryKeys } from "@/lib/memories";

export type ActionResult = { error?: string };

export async function getUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, userId: user?.id ?? null };
}

export type Supabase = Awaited<ReturnType<typeof getUserId>>["supabase"];

/**
 * Persist any newly-earned memory keepsakes. Idempotent: existing rows are ignored
 * thanks to the UNIQUE(user_id, memory_key) constraint, so this is safe to call on
 * every completion. Keeps memories from vanishing when a streak later resets.
 */
export async function reconcileMemories(supabase: Supabase, userId: string, streak: number) {
  const keys = eligibleMemoryKeys(streak);
  if (keys.length === 0) return;
  await supabase
    .from("memories")
    .upsert(
      keys.map((memory_key) => ({ user_id: userId, memory_key })),
      { onConflict: "user_id,memory_key", ignoreDuplicates: true }
    );
}
