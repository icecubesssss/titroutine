"use server";

import { getUserId, type Supabase } from "./_shared";
import type { FeedbackMessage, FeedbackThreadSummary } from "@/lib/types";

// Feedback chat (migration 15). Every user has exactly one conversation with the
// app admins, keyed by `thread_user_id`. Admins (rows in `app_admins`) see every
// thread and reply with `from_admin = true`. RLS does the real gating; the checks
// here only pick which shape of data to return.
//
// No revalidatePath: the chat is self-contained client state (it refetches on
// realtime events), nothing on the server-rendered dashboard depends on it.

const MAX_LENGTH = 2000;

async function isAdmin(supabase: Supabase): Promise<boolean> {
  const { data } = await supabase.rpc("is_app_admin");
  return data === true;
}

/** Whether the current user is an admin + how many messages they haven't read. */
export async function getFeedbackStatusAction(): Promise<{ error?: string; isAdmin?: boolean; unread?: number }> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const admin = await isAdmin(supabase);
  // Admin: user messages anywhere still unread. User: admin replies in own thread.
  let query = supabase
    .from("feedback_messages")
    .select("id", { count: "exact", head: true })
    .is("read_at", null)
    .eq("from_admin", !admin);
  if (!admin) query = query.eq("thread_user_id", userId);

  const { count, error } = await query;
  if (error) return { error: error.message };
  return { isAdmin: admin, unread: count ?? 0 };
}

/** Admin inbox: one row per user who has written, newest activity first. */
export async function getFeedbackInboxAction(): Promise<{ error?: string; threads?: FeedbackThreadSummary[] }> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };
  if (!(await isAdmin(supabase))) return { error: "forbidden" };

  const { data, error } = await supabase
    .from("feedback_messages")
    .select("thread_user_id, from_admin, body, created_at, read_at, profiles!feedback_messages_thread_user_id_fkey(username)")
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) return { error: error.message };

  const threads = new Map<string, FeedbackThreadSummary>();
  for (const row of data ?? []) {
    const owner = (row as unknown as { profiles: { username: string | null } | null }).profiles;
    let thread = threads.get(row.thread_user_id);
    if (!thread) {
      // Rows are newest first, so the first one seen is the latest message.
      thread = {
        userId: row.thread_user_id,
        username: owner?.username ?? null,
        lastBody: row.body,
        lastAt: row.created_at,
        unread: 0,
      };
      threads.set(row.thread_user_id, thread);
    }
    if (!row.from_admin && !row.read_at) thread.unread += 1;
  }
  return { threads: [...threads.values()] };
}

/**
 * Messages of one thread, oldest first. Users always get their own thread;
 * admins pass the user whose thread they opened.
 */
export async function getFeedbackThreadAction(
  threadUserId?: string
): Promise<{ error?: string; messages?: FeedbackMessage[] }> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const { data, error } = await supabase
    .from("feedback_messages")
    .select("id, from_admin, body, created_at")
    .eq("thread_user_id", threadUserId || userId)
    .order("created_at", { ascending: true })
    .limit(500);
  if (error) return { error: error.message };

  return {
    messages: (data ?? []).map((m) => ({
      id: m.id,
      fromAdmin: m.from_admin,
      body: m.body,
      createdAt: m.created_at,
    })),
  };
}

/** Send a message. An admin replying passes the thread owner's id. */
export async function sendFeedbackAction(body: string, threadUserId?: string): Promise<{ error?: string }> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const text = body.trim();
  if (!text) return { error: "empty" };
  if (text.length > MAX_LENGTH) return { error: "too_long" };

  const replying = Boolean(threadUserId && threadUserId !== userId);
  if (replying && !(await isAdmin(supabase))) return { error: "forbidden" };

  const { error } = await supabase.from("feedback_messages").insert({
    thread_user_id: replying ? threadUserId : userId,
    sender_id: userId,
    from_admin: replying,
    body: text,
  });
  if (error) return { error: error.message };
  return {};
}

/** Mark the other side's messages in a thread as read. */
export async function markFeedbackReadAction(threadUserId?: string): Promise<{ error?: string }> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const readingAsAdmin = Boolean(threadUserId && threadUserId !== userId);
  const { error } = await supabase
    .from("feedback_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("thread_user_id", threadUserId || userId)
    .eq("from_admin", !readingAsAdmin)
    .is("read_at", null);
  if (error) return { error: error.message };
  return {};
}
