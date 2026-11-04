"use server";

import { revalidatePath } from "next/cache";
import { format, addDays, parseISO } from "date-fns";
import {
  STREAK_FREEZE_COST,
  todayInTimezone,
  currentSatiety,
} from "@/lib/game";
import { getUserId, type ActionResult } from "./_shared";

/**
 * Persist the user's real IANA timezone so "today" and streaks are computed in
 * their local day rather than UTC. Called once from the client on load.
 */
export async function updateTimezoneAction(timezone: string): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };
  if (!timezone || timezone.length > 64) return { error: "invalid_timezone" };

  const { error } = await supabase
    .from("profiles")
    .update({ timezone })
    .eq("id", userId);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}

/**
 * Bật/tắt Chế độ đi nghỉ (vacation mode). Khi bật: đóng băng độ no + streak.
 * Cả hai chiều đều "chốt sổ" trạng thái hiện tại: lưu satiety hiệu dụng rồi mới
 * dời mốc last_fed_date (nếu không, satiety sẽ hồi ngược về giá trị cũ), và kéo
 * last_active_date lên hôm qua để streak sống sót qua ranh giới chuyến nghỉ.
 */
export async function setVacationModeAction(enabled: boolean): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("timezone, satiety, last_fed_date, last_active_date")
    .eq("id", userId)
    .maybeSingle();
  if (profileError) return { error: profileError.message };

  const timezone = profile?.timezone || "UTC";
  const today = todayInTimezone(timezone);
  const yesterday = format(addDays(parseISO(today), -1), "yyyy-MM-dd");

  const patch: Record<string, unknown> = {
    vacation_mode: enabled,
    updated_at: new Date().toISOString(),
  };
  if (profile?.last_fed_date && profile.last_fed_date < today) {
    patch.satiety = currentSatiety(profile.satiety, profile.last_fed_date, today);
    patch.last_fed_date = today;
  }
  if (profile?.last_active_date && profile.last_active_date < yesterday) {
    patch.last_active_date = yesterday;
  }

  const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}

/** Remember that the user closed the "what's new" popup for this version. */
export async function acknowledgeWhatsNewAction(version: string): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };
  if (!version || version.length > 32) return { error: "invalid_version" };

  const { error } = await supabase
    .from("profiles")
    .update({ whats_new_seen: version })
    .eq("id", userId);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}

export async function claimDailyCheckinAction(): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("timezone, coins, last_checkin_date")
    .eq("id", userId)
    .maybeSingle();
  
  if (profileError) return { error: profileError.message };

  const timezone = profile?.timezone || "UTC";
  const today = todayInTimezone(timezone);

  if (profile?.last_checkin_date === today) {
    return { error: "already_checked_in" };
  }

  // Daily check-in reward: 15 coins
  const newCoins = (profile?.coins ?? 0) + 15;

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ 
      coins: newCoins,
      last_checkin_date: today 
    })
    .eq("id", userId);
    
  if (updateError) return { error: updateError.message };

  revalidatePath("/", "layout");
  return {};
}

export async function buyFreezeAction(): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("coins, streak_freezes")
    .eq("id", userId)
    .maybeSingle();
    
  if (profileError) return { error: profileError.message };

  const currentCoins = profile?.coins ?? 0;

  if (currentCoins < STREAK_FREEZE_COST) {
    return { error: "not_enough_coins" };
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ 
      coins: currentCoins - STREAK_FREEZE_COST,
      streak_freezes: (profile?.streak_freezes ?? 0) + 1 
    })
    .eq("id", userId);
    
  if (updateError) return { error: updateError.message };

  revalidatePath("/", "layout");
  return {};
}

/**
 * Update user preferences (calendar view: "week" | "month" | "year", task view: "kanban" | "calendar").
 */
export async function updateUserPreferencesAction(
  newPreferences: Partial<{
    calendarView: "week" | "month" | "year";
    taskView: "kanban" | "calendar";
    claimedFreezeMilestones: number[];
  }>
): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("preferences")
    .eq("id", userId)
    .maybeSingle();

  const currentPrefs = (profile?.preferences as Record<string, unknown>) || {};
  const updatedPrefs: Record<string, unknown> = { ...currentPrefs };

  if (newPreferences.calendarView !== undefined) {
    updatedPrefs.calendar_view = newPreferences.calendarView;
  }
  if (newPreferences.taskView !== undefined) {
    updatedPrefs.task_view = newPreferences.taskView;
  }
  if (newPreferences.claimedFreezeMilestones !== undefined) {
    updatedPrefs.claimed_freeze_milestones = newPreferences.claimedFreezeMilestones;
  }

  const { error } = await supabase
    .from("profiles")
    .update({ preferences: updatedPrefs, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}

/**
 * Update the user's display username.
 */
export async function updateUsernameAction(username: string): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const trimmed = username.trim();
  if (!trimmed) return { error: "Username cannot be empty" };
  if (trimmed.length > 50) return { error: "Username too long" };

  const { error } = await supabase
    .from("profiles")
    .update({ username: trimmed, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}

