"use server";

import { revalidatePath } from "next/cache";
import { getUserId, type ActionResult } from "./_shared";
import { levelFromExp } from "@/lib/game";
import type { NeighborSummary, NeighborData, Task, HabitWithLog } from "@/lib/types";

/**
 * Fetch list of friends / neighbors for the current user.
 */
export async function getNeighborsListAction(): Promise<{ error?: string; neighbors?: NeighborSummary[] }> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  // Fetch all registered user profiles in the web app except the current user
  const { data: profiles, error: pError } = await supabase
    .from("profiles")
    .select("id, username, pet_stage, pet_exp, current_streak")
    .neq("id", userId)
    .order("current_streak", { ascending: false });

  if (pError) return { error: pError.message };

  const neighbors: NeighborSummary[] = (profiles || []).map((p) => ({
    id: p.id,
    username: p.username || "Hàng xóm",
    petStage: p.pet_stage ?? 0,
    petLevel: levelFromExp(p.pet_exp ?? 0),
    currentStreak: p.current_streak ?? 0,
  }));

  return { neighbors };
}

/**
 * Fetch detailed public data of a specific neighbor.
 */
export async function getNeighborDataAction(neighborId: string): Promise<{ error?: string; data?: NeighborData }> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  // Profile summary
  const { data: profile, error: pError } = await supabase
    .from("profiles")
    .select("id, username, pet_stage, pet_exp, current_streak, affection_level")
    .eq("id", neighborId)
    .maybeSingle();

  if (pError || !profile) return { error: "neighbor_not_found" };

  // Inventory equipped items
  const { data: inventory } = await supabase
    .from("inventory")
    .select("equipped_items")
    .eq("user_id", neighborId)
    .maybeSingle();

  // Public tasks
  const { data: rawTasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", neighborId)
    .eq("is_private", false)
    .order("created_at", { ascending: false });

  const publicTasks: Task[] = (rawTasks || []).map((t) => ({
    id: t.id,
    userId: t.user_id,
    title: t.title,
    notes: t.notes,
    status: t.status as "todo" | "in_progress" | "done",
    priority: t.priority as "low" | "medium" | "high",
    assigneeType: t.assignee_type as "self" | "pet",
    focusDuration: t.focus_duration ?? 25,
    isPrivate: t.is_private ?? false,
    deadline: t.deadline,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  }));

  // Public habits
  const { data: rawHabits } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", neighborId)
    .eq("is_private", false)
    .is("archived_at", null);

  const publicHabits: HabitWithLog[] = (rawHabits || []).map((h) => ({
    id: h.id,
    title: h.title,
    type: h.type || "boolean",
    config: h.config || {},
    frequency: h.frequency || { type: "daily" },
    timeOfDay: h.time_of_day || "anytime",
    isCompleted: false,
    value: null,
    isPrivate: h.is_private ?? false,
  }));

  const data: NeighborData = {
    profile: {
      id: profile.id,
      username: profile.username || "Neighbor",
      petStage: profile.pet_stage ?? 0,
      petLevel: levelFromExp(profile.pet_exp ?? 0),
      currentStreak: profile.current_streak ?? 0,
      affection: profile.affection_level ?? 0,
    },
    equippedItems: (inventory?.equipped_items as Record<string, string>) || {},
    publicTasks,
    publicHabits,
  };

  return { data };
}

/**
 * Toggle privacy status of a Habit (public vs private).
 */
export async function toggleHabitPrivacyAction(habitId: string, isPrivate: boolean): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const { error } = await supabase
    .from("habits")
    .update({ is_private: isPrivate })
    .eq("id", habitId)
    .eq("user_id", userId);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}

/**
 * Toggle privacy status of a Task (public vs private).
 */
export async function toggleTaskPrivacyAction(taskId: string, isPrivate: boolean): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const { error } = await supabase
    .from("tasks")
    .update({ is_private: isPrivate })
    .eq("id", taskId)
    .eq("user_id", userId);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}

/**
 * Copy a public task from a neighbor to the current user's task board.
 */
export async function copyNeighborTaskAction(taskId: string): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const { data: targetTask, error: fetchError } = await supabase
    .from("tasks")
    .select("title, notes, priority, assignee_type, focus_duration")
    .eq("id", taskId)
    .eq("is_private", false)
    .maybeSingle();

  if (fetchError || !targetTask) return { error: "task_not_found" };

  const { error: insertError } = await supabase.from("tasks").insert({
    user_id: userId,
    title: targetTask.title,
    notes: targetTask.notes,
    status: "todo",
    priority: targetTask.priority,
    assignee_type: targetTask.assignee_type,
    focus_duration: targetTask.focus_duration,
    is_private: true, // copied tasks default to private
  });

  if (insertError) return { error: insertError.message };

  revalidatePath("/", "layout");
  return {};
}
