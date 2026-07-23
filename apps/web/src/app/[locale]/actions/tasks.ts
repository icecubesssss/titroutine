"use server";

import { revalidatePath } from "next/cache";
import { getUserId, type ActionResult } from "./_shared";

function clampFocusDuration(minutes: number): number {
  if (!Number.isFinite(minutes)) return 25;
  return Math.min(1440, Math.max(1, Math.round(minutes)));
}

export async function createTaskAction(input: {
  title: string;
  notes?: string;
  priority: "low" | "medium" | "high";
  assigneeType: "self" | "pet";
  focusDuration: number;
  deadline?: string | null;
}): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };
  if (!input.title) return { error: "title_required" };

  const { error } = await supabase.from("tasks").insert({
    user_id: userId,
    title: input.title,
    notes: input.notes || null,
    priority: input.priority,
    assignee_type: input.assigneeType,
    focus_duration: clampFocusDuration(input.focusDuration),
    deadline: input.deadline || null,
    status: "todo",
  });

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}

export async function deleteTaskAction(taskId: string): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", userId);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}

export async function updateTaskDetailsAction(
  taskId: string,
  input: {
    title?: string;
    notes?: string;
    priority?: "low" | "medium" | "high";
    assigneeType?: "self" | "pet";
    focusDuration?: number;
    deadline?: string | null;
  }
): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const updateData: Record<string, unknown> = {};
  if (input.title !== undefined) updateData.title = input.title;
  if (input.notes !== undefined) updateData.notes = input.notes;
  if (input.priority !== undefined) updateData.priority = input.priority;
  if (input.assigneeType !== undefined) updateData.assignee_type = input.assigneeType;
  if (input.focusDuration !== undefined) updateData.focus_duration = clampFocusDuration(input.focusDuration);
  if (input.deadline !== undefined) updateData.deadline = input.deadline;
  updateData.updated_at = new Date().toISOString();

  const { error } = await supabase
    .from("tasks")
    .update(updateData)
    .eq("id", taskId)
    .eq("user_id", userId);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}

export async function updateTaskStatusAction(
  taskId: string,
  status: "todo" | "in_progress" | "done"
): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  // Fetch the existing task to verify status change
  const { data: task, error: fetchTaskErr } = await supabase
    .from("tasks")
    .select("status, focus_duration, deadline")
    .eq("id", taskId)
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchTaskErr) return { error: fetchTaskErr.message };
  if (!task) return { error: "task_not_found" };

  const oldStatus = task.status;
  
  // If setting to in_progress, revert any existing in_progress task for this user back to todo
  if (status === "in_progress") {
    await supabase
      .from("tasks")
      .update({ status: "todo", updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("status", "in_progress")
      .neq("id", taskId);
  }

  // Update task status
  const { error: updateTaskErr } = await supabase
    .from("tasks")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", taskId)
    .eq("user_id", userId);

  if (updateTaskErr) return { error: updateTaskErr.message };

  // If transitioning to "done" for the first time in this change
  if (status === "done" && oldStatus !== "done") {
    // 1. Reward Focus Tokens and check overdue penalty in profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("focus_tokens, affection_level")
      .eq("id", userId)
      .maybeSingle();

    if (profile) {
      const currentTokens = profile.focus_tokens ?? 0;
      const currentAffection = profile.affection_level ?? 0;
      const rewardTokens = task.focus_duration ?? 25;
      
      let newAffection = currentAffection;
      
      // Check overdue: deadline present and in the past
      if (task.deadline) {
        const deadlineDate = new Date(task.deadline);
        if (deadlineDate < new Date()) {
          // Overdue penalty: reduce affection by 5 (clamped to 0)
          newAffection = Math.max(0, currentAffection - 5);
        }
      }

      await supabase
        .from("profiles")
        .update({
          focus_tokens: currentTokens + rewardTokens,
          affection_level: newAffection
        })
        .eq("id", userId);
    }

    // 2. Add carrot to inventory consumables
    const { data: inventory } = await supabase
      .from("inventory")
      .select("consumables")
      .eq("user_id", userId)
      .maybeSingle();

    const consumables = (inventory?.consumables as Record<string, number>) || {};
    const newCarrotCount = (consumables["carrot"] ?? 0) + 1; // reward 1 carrot
    const updatedConsumables = { ...consumables, carrot: newCarrotCount };

    await supabase
      .from("inventory")
      .update({ consumables: updatedConsumables })
      .eq("user_id", userId);
  }

  revalidatePath("/", "layout");
  return {};
}
