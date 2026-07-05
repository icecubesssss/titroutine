import "server-only";

import { createClient } from "@/utils/supabase/server";
import { format, parseISO, startOfWeek, addDays } from "date-fns";
import {
  ratchetStage,
  todayInTimezone,
  currentSatiety,
  levelFromExp,
  expToNextLevel,
  moodFromStats,
} from "./game";
import { unlockedRooms, allRoomsUnlocked } from "./rooms";
import { eligibleMemoryKeys } from "./memories";
import type { DashboardData, HabitConfig, HabitType, HabitWithLog, HabitFrequency, TimeOfDay } from "./types";

interface HabitRow {
  id: string;
  title: string;
  type: HabitType | null;
  config: HabitConfig | null;
  frequency: HabitFrequency | null;
  time_of_day: TimeOfDay | null;
}

interface LogRow {
  habit_id: string;
  is_completed: boolean | null;
  value: number | null;
  date: string;
}

/**
 * Loads everything the home screen needs for the signed-in user, scoped to
 * "today" in their own timezone. Returns null when there is no session.
 */
export async function getDashboard(targetDateStr?: string): Promise<DashboardData | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "username, timezone, coins, current_streak, total_exp, pet_stage, last_checkin_date, streak_freezes, pet_exp, satiety, last_fed_date, affection_level, last_neighbor_gift_date, personality_curiosity, personality_compassion, personality_resilience, personality_energy, pet_likes, pet_dislikes, adventure_energy, adventure_status, adventure_start_at, adventure_story_id"
    )
    .eq("id", user.id)
    .maybeSingle();

  const timezone = profile?.timezone || "UTC";
  const today = todayInTimezone(timezone);
  const targetDate = targetDateStr || today;
  const isToday = targetDate === today;
  const totalExp = profile?.total_exp ?? 0;
  const currentStreak = profile?.current_streak ?? 0;

  // Nurture axis (feeding) — independent from the streak-driven appearance stage.
  const petExp = profile?.pet_exp ?? 0;
  const petLevel = levelFromExp(petExp);
  const petLevelProgress = expToNextLevel(petExp).ratio;
  const satiety = currentSatiety(profile?.satiety, profile?.last_fed_date ?? null, today);
  const affection = profile?.affection_level ?? 0;
  const mood = moodFromStats(satiety, affection);
  const rooms = unlockedRooms(petLevel);
  const roomsAllUnlocked = allRoomsUnlocked(petLevel);

  const targetDateObj = parseISO(targetDate);
  const weekStart = startOfWeek(targetDateObj, { weekStartsOn: 1 });
  const weekDates = Array.from({ length: 7 }).map((_, i) => format(addDays(weekStart, i), "yyyy-MM-dd"));

  const [{ data: habitRows }, { data: logRows }, { data: inventoryData }, { data: memoryRows }, { data: vibeRows }, { data: beanRows }] = await Promise.all([
    supabase
      .from("habits")
      .select("id, title, type, config, frequency, time_of_day")
      .eq("user_id", user.id)
      .is("archived_at", null)
      .order("created_at", { ascending: true }),
    supabase
      .from("habit_logs")
      .select("habit_id, is_completed, value, date")
      .eq("user_id", user.id)
      .gte("date", weekDates[0])
      .lte("date", weekDates[6]),
    supabase
      .from("inventory")
      .select("equipped_items, unlocked_items, consumables")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("memories")
      .select("memory_key")
      .eq("user_id", user.id),
    supabase
      .from("social_vibes")
      .select("id, sender_id, vibe_type, profiles!social_vibes_sender_id_fkey(username)")
      .eq("receiver_id", user.id)
      .is("claimed_at", null),
    supabase
      .from("daily_bean_logs")
      .select("logged_date, mood, activities, note")
      .eq("user_id", user.id)
      .gte("logged_date", weekDates[0])
      .lte("logged_date", weekDates[6])
  ]);

  // Map mood logs by date
  const moodLogs: Record<string, { mood: string; activities: string[]; note: string | null }> = {};
  for (const row of (beanRows ?? []) as { logged_date: string; mood: string; activities: string[] | null; note: string | null }[]) {
    moodLogs[row.logged_date] = {
      mood: row.mood,
      activities: row.activities ?? [],
      note: row.note || null
    };
  }

  // Persisted keepsakes plus anything the *current* streak earns right now, so a
  // memory shows the moment it's reached even before the next mutation writes it.
  const unlockedMemories = Array.from(
    new Set([
      ...((memoryRows ?? []) as { memory_key: string }[]).map((m) => m.memory_key),
      ...eligibleMemoryKeys(currentStreak),
    ])
  );

  const logByHabit = new Map<string, LogRow>();
  const weeklyLogsByHabit = new Map<string, Record<string, boolean>>();

  for (const log of (logRows ?? []) as LogRow[]) {
    if (log.date === targetDate) {
      logByHabit.set(log.habit_id, log);
    }
    let weekly = weeklyLogsByHabit.get(log.habit_id);
    if (!weekly) {
      weekly = {};
      weeklyLogsByHabit.set(log.habit_id, weekly);
    }
    weekly[log.date] = Boolean(log.is_completed);
  }

  // Calculate day of week safely (0 = Sunday, 1 = Monday, etc.)
  // We append T00:00:00 to avoid timezone shift in new Date() parsing
  const dayOfWeek = new Date(`${today}T00:00:00`).getDay();

  const habits: HabitWithLog[] = ((habitRows ?? []) as HabitRow[])
    .map((h) => {
      const log = logByHabit.get(h.id);
      return {
        id: h.id,
        title: h.title,
        type: h.type ?? "boolean",
        config: h.config ?? {},
        frequency: h.frequency ?? { type: "daily" },
        timeOfDay: h.time_of_day ?? "anytime",
        isCompleted: Boolean(log?.is_completed),
        value: log?.value ?? null,
        weeklyLogs: weeklyLogsByHabit.get(h.id) || {},
      };
    })
    .filter((h) => {
      // Filter out habits that are not due today based on specific_days frequency
      if (h.frequency.type === "specific_days" && Array.isArray(h.frequency.days)) {
        return h.frequency.days.includes(dayOfWeek);
      }
      return true; // daily and x_times_a_week show up every day
    });

  return {
    profile: {
      coins: profile?.coins ?? 0,
      currentStreak,
      // Stage = highest reached. The streak sets a floor; the stored value can be
      // higher because evolution never reverses (see ratchetStage in game.ts).
      petStage: ratchetStage(profile?.pet_stage, currentStreak),
      totalExp,
      timezone,
      username: profile?.username ?? null,
      lastCheckinDate: profile?.last_checkin_date ?? null,
      streakFreezes: profile?.streak_freezes ?? 0,
      petExp,
      petLevel,
      petLevelProgress,
      satiety,
      affection,
      mood,
      unlockedRooms: rooms,
      allRoomsUnlocked: roomsAllUnlocked,
      canClaimNeighborGift: roomsAllUnlocked && profile?.last_neighbor_gift_date !== today,
      personalityCuriosity: profile?.personality_curiosity ?? 10,
      personalityCompassion: profile?.personality_compassion ?? 10,
      personalityResilience: profile?.personality_resilience ?? 10,
      personalityEnergy: profile?.personality_energy ?? 10,
      petLikes: profile?.pet_likes ?? [],
      petDislikes: profile?.pet_dislikes ?? [],
      adventureEnergy: profile?.adventure_energy ?? 0,
      adventureStatus: (profile?.adventure_status as "idle" | "adventuring" | "returned") ?? "idle",
      adventureStartAt: profile?.adventure_start_at ?? null,
      adventureStoryId: profile?.adventure_story_id ?? null,
    },
    inventory: {
      equippedItems: (inventoryData?.equipped_items as Record<string, string>) || {},
      unlockedItems: (inventoryData?.unlocked_items as string[]) || [],
      consumables: (inventoryData?.consumables as Record<string, number>) || {
        carrot: 0,
        cake: 0,
        feast: 0,
        toy_ball: 0,
        toy_bear: 0,
      },
    },
    unlockedMemories,
    habits,
    today,
    currentDate: targetDate,
    isToday,
    email: user.email ?? null,
    weekDates,
    moodLogs,
    pendingVibes: (vibeRows ?? []).map((v) => {
      const senderProfile = (v as unknown as { profiles: { username: string } | null }).profiles;
      return {
        id: v.id,
        senderId: v.sender_id,
        senderUsername: senderProfile?.username || "Một người bạn",
        vibeType: v.vibe_type,
      };
    }),
  };
}
