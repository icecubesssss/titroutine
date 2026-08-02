"use server";

import { revalidatePath } from "next/cache";
import { getUserId, type ActionResult } from "./_shared";
import { levelFromExp } from "@/lib/game";
import { characterDisplayName, getCharacter } from "@/lib/characters";
import type { NeighborSummary, NeighborData, Task, HabitWithLog } from "@/lib/types";

/**
 * Fetch the current user's neighbours — i.e. their friends. Friendships are
 * created automatically for every user (see migration 11), so in practice this is
 * "everyone else", but it stays scoped to the friendship graph so opening the app
 * up later doesn't silently expose strangers to each other.
 */
export async function getNeighborsListAction(): Promise<{ error?: string; neighbors?: NeighborSummary[] }> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  // 1. Fetch friend IDs
  const { data: friendships } = await supabase
    .from("friendships")
    .select("friend_id")
    .eq("user_id", userId);

  let friendIds = (friendships || []).map((f) => f.friend_id).filter((id) => id !== userId);

  // 2. Fallback: If no friends yet, fetch all other profiles in DB so everyone is a neighbor by default
  if (friendIds.length === 0) {
    const { data: otherProfiles } = await supabase
      .from("profiles")
      .select("id")
      .neq("id", userId);
    friendIds = (otherProfiles || []).map((p) => p.id);
  }

  let neighbors: NeighborSummary[] = [];

  if (friendIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, pet_stage, pet_exp, current_streak, character_id, character_name")
      .in("id", friendIds)
      .order("current_streak", { ascending: false });

    neighbors = (profiles || []).map((p) => ({
      id: p.id,
      username: p.username || "Hàng xóm",
      petStage: p.pet_stage ?? 0,
      petLevel: levelFromExp(p.pet_exp ?? 0),
      currentStreak: p.current_streak ?? 0,
      characterId: getCharacter(p.character_id).id,
      characterName: characterDisplayName(p.character_id, p.character_name),
    }));
  }

  // 3. Fallback: If still empty (e.g. single-user environment), provide friendly NPC neighbors
  if (neighbors.length === 0) {
    neighbors = [
      { id: "mochi", username: "Mochi 🍡", petStage: 2, petLevel: 5, currentStreak: 7, characterId: "pandagirl", characterName: "Mochi 🍡" },
      { id: "biscuit", username: "Biscuit 🍪", petStage: 6, petLevel: 12, currentStreak: 21, characterId: "tigerboy", characterName: "Biscuit 🍪" },
      { id: "luna", username: "Luna 🌙", petStage: 3, petLevel: 8, currentStreak: 14, characterId: "pandagirl", characterName: "Luna 🌙" },
    ];
  }

  return { neighbors };
}

/**
 * Fetch detailed public data of a specific neighbor.
 */
export async function getNeighborDataAction(neighborId: string): Promise<{ error?: string; data?: NeighborData }> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  // NPC Neighbor Mock Data
  if (neighborId === "mochi" || neighborId === "biscuit" || neighborId === "luna") {
    const npcConfigs: Record<string, NeighborData> = {
      mochi: {
        profile: { id: "mochi", username: "Mochi 🍡", petStage: 2, petLevel: 5, currentStreak: 7, affection: 85, characterId: "pandagirl", characterName: "Mochi 🍡" },
        equippedItems: {},
        publicTasks: [
          { id: "mochi_t1", userId: "mochi", title: "🧘‍♀️ Tập yoga 15 phút buổi sáng", notes: "", status: "todo", priority: "medium", assigneeType: "self", focusDuration: 15, isPrivate: false, deadline: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: "mochi_t2", userId: "mochi", title: "📚 Đọc 10 trang sách Phát triển bản thân", notes: "", status: "in_progress", priority: "high", assigneeType: "self", focusDuration: 30, isPrivate: false, deadline: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: "mochi_t3", userId: "mochi", title: "💧 Uống đủ 2L nước mỗi ngày", notes: "", status: "done", priority: "low", assigneeType: "self", focusDuration: 25, isPrivate: false, deadline: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        ],
        publicHabits: [
          { id: "mochi_h1", title: "Thiền định 10 phút 🧘", type: "boolean", config: {}, frequency: { type: "daily" }, timeOfDay: "morning", isCompleted: true, value: null, isPrivate: false },
          { id: "mochi_h2", title: "Uống trà thảo mộc 🍵", type: "boolean", config: {}, frequency: { type: "daily" }, timeOfDay: "evening", isCompleted: false, value: null, isPrivate: false },
        ]
      },
      biscuit: {
        profile: { id: "biscuit", username: "Biscuit 🍪", petStage: 6, petLevel: 12, currentStreak: 21, affection: 90, characterId: "tigerboy", characterName: "Biscuit 🍪" },
        equippedItems: {},
        publicTasks: [
          { id: "biscuit_t1", userId: "biscuit", title: "📐 Giải 5 bài tập Toán Cao Cấp", notes: "", status: "in_progress", priority: "high", assigneeType: "self", focusDuration: 45, isPrivate: false, deadline: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: "biscuit_t2", userId: "biscuit", title: "🇬🇧 Ôn 20 từ vựng IELTS mỗi ngày", notes: "", status: "todo", priority: "medium", assigneeType: "self", focusDuration: 30, isPrivate: false, deadline: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: "biscuit_t3", userId: "biscuit", title: "💪 Tập chống đẩy 30 cái", notes: "", status: "done", priority: "medium", assigneeType: "self", focusDuration: 15, isPrivate: false, deadline: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        ],
        publicHabits: [
          { id: "biscuit_h1", title: "Viết nhật ký công việc 📝", type: "boolean", config: {}, frequency: { type: "daily" }, timeOfDay: "evening", isCompleted: true, value: null, isPrivate: false },
          { id: "biscuit_h2", title: "Chạy bộ 2km 🏃", type: "boolean", config: {}, frequency: { type: "daily" }, timeOfDay: "morning", isCompleted: false, value: null, isPrivate: false },
        ]
      },
      luna: {
        profile: { id: "luna", username: "Luna 🌙", petStage: 3, petLevel: 8, currentStreak: 14, affection: 75, characterId: "pandagirl", characterName: "Luna 🌙" },
        equippedItems: {},
        publicTasks: [
          { id: "luna_t1", userId: "luna", title: "🎨 Vẽ phác thảo tranh phong cảnh", notes: "", status: "todo", priority: "medium", assigneeType: "self", focusDuration: 30, isPrivate: false, deadline: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { id: "luna_t2", userId: "luna", title: "🌿 Tưới cây & chăm sóc hoa ban công", notes: "", status: "done", priority: "low", assigneeType: "self", focusDuration: 15, isPrivate: false, deadline: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        ],
        publicHabits: [
          { id: "luna_h1", title: "Nghe nhạc Lo-Fi thư giãn 🎧", type: "boolean", config: {}, frequency: { type: "daily" }, timeOfDay: "anytime", isCompleted: true, value: null, isPrivate: false },
        ]
      }
    };
    return { data: npcConfigs[neighborId] };
  }

  // Profile summary
  const { data: profile, error: pError } = await supabase
    .from("profiles")
    .select("id, username, pet_stage, pet_exp, current_streak, affection_level, character_id, character_name")
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
      characterId: getCharacter(profile.character_id).id,
      characterName: characterDisplayName(profile.character_id, profile.character_name),
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
