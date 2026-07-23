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
  NEGLECT_PENALTY_COINS,
  NEGLECT_PENALTY_AFFECTION,
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

function isScheduledDay(dateObj: Date, frequency: HabitFrequency): boolean {
  if (frequency.type === "specific_days" && Array.isArray(frequency.days)) {
    const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday, etc.
    return frequency.days.includes(dayOfWeek);
  }
  return true; // daily or other types are scheduled every day
}

function calculateStreak(completedDates: Set<string>, todayStr: string, frequency: HabitFrequency): number {
  let streak = 0;
  let currentDateObj = parseISO(todayStr);
  
  for (let i = 0; i < 365; i++) {
    const dateStr = format(currentDateObj, "yyyy-MM-dd");
    const isToday = dateStr === todayStr;
    const completed = completedDates.has(dateStr);
    const scheduled = isScheduledDay(currentDateObj, frequency);
    
    if (isToday) {
      if (completed) {
        streak++;
      }
    } else {
      if (scheduled) {
        if (completed) {
          streak++;
        } else {
          break;
        }
      }
    }
    
    currentDateObj = addDays(currentDateObj, -1);
  }
  
  return streak;
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
      "username, timezone, coins, current_streak, total_exp, pet_stage, last_checkin_date, streak_freezes, pet_exp, satiety, last_fed_date, last_active_date, affection_level, last_neighbor_gift_date, personality_curiosity, personality_compassion, personality_resilience, personality_energy, pet_likes, pet_dislikes, adventure_energy, adventure_status, adventure_start_at, adventure_story_id, focus_tokens, cleaning_energy, cleaned_spots, vacation_mode, last_neglect_date"
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
  // ── Vacation mode / neglect consequence (Habit-Rabbit health loop) ────────
  // Vacation: freeze the pet lazily by persisting the effective satiety and
  // bumping the decay/streak anchors forward — no cron needed, the first load
  // after (or during) the trip repairs everything before anything is computed.
  const vacationMode = Boolean(profile?.vacation_mode);
  const satiety = currentSatiety(profile?.satiety, profile?.last_fed_date ?? null, today);
  let coinsBalance = profile?.coins ?? 0;
  let affection = profile?.affection_level ?? 0;

  if (profile && vacationMode) {
    const yesterday = format(addDays(parseISO(today), -1), "yyyy-MM-dd");
    const freezePatch: Record<string, unknown> = {};
    if (!profile.last_fed_date || profile.last_fed_date < today) {
      freezePatch.satiety = satiety; // persist the already-decayed value first
      freezePatch.last_fed_date = today;
    }
    // Keep the streak gap closed, but never move the anchor backwards past a
    // completion that already happened today.
    if (profile.last_active_date && profile.last_active_date < yesterday) {
      freezePatch.last_active_date = yesterday;
    }
    if (Object.keys(freezePatch).length > 0) {
      await supabase.from("profiles").update(freezePatch).eq("id", user.id);
    }
  } else if (
    profile &&
    profile.last_fed_date && // brand-new users (never fed) are exempt
    satiety <= 0 &&
    profile.last_neglect_date !== today
  ) {
    // Starving pet: gentle once-per-day penalty. Streak/stage/rooms untouched.
    coinsBalance = Math.max(0, coinsBalance - NEGLECT_PENALTY_COINS);
    affection = Math.max(0, affection - NEGLECT_PENALTY_AFFECTION);
    await supabase
      .from("profiles")
      .update({ coins: coinsBalance, affection_level: affection, last_neglect_date: today })
      .eq("id", user.id);
  }

  const mood = moodFromStats(satiety, affection);
  const rooms = unlockedRooms(petLevel);
  const roomsAllUnlocked = allRoomsUnlocked(petLevel);

  const targetDateObj = parseISO(targetDate);
  const weekStart = startOfWeek(targetDateObj, { weekStartsOn: 1 });
  const weekDates = Array.from({ length: 7 }).map((_, i) => format(addDays(weekStart, i), "yyyy-MM-dd"));

  const [
    { data: habitRows },
    { data: logRows },
    { data: inventoryData },
    { data: memoryRows },
    { data: vibeRows },
    { data: beanRows },
    { data: taskRows },
    { data: allCompletedLogs }
  ] = await Promise.all([
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
      .select("equipped_items, unlocked_items, consumables, decor_positions")
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
      .lte("logged_date", weekDates[6]),
    supabase
      .from("tasks")
      .select("id, user_id, title, notes, status, priority, assignee_type, focus_duration, deadline, created_at, updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("habit_logs")
      .select("habit_id, date")
      .eq("user_id", user.id)
      .eq("is_completed", true)
      .order("date", { ascending: false })
  ]);

  // Grant a starter kit ONLY to genuinely new users (never fed before).
  // Users who consumed all items must buy more from the Shop.
  let consumables = (inventoryData?.consumables as Record<string, number>) || {};
  const totalConsumables = Object.keys(consumables).reduce((acc, key) => acc + (consumables[key] || 0), 0);
  if (totalConsumables === 0 && !profile?.last_fed_date) {
    const starterKit = {
      carrot: 3,
      cake: 0,
      feast: 0,
      toy_ball: 2,
      toy_bear: 0,
    };
    consumables = starterKit;

    // Await the write: feed/play/buy actions validate counts against the DB,
    // so a fire-and-forget grant lets a brand-new user see 3 carrots yet get
    // "out of food" (or have the kit overwritten by a purchase) on first use.
    if (inventoryData) {
      await supabase
        .from("inventory")
        .update({ consumables: starterKit })
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("inventory")
        .insert({ user_id: user.id, consumables: starterKit, equipped_items: {}, unlocked_items: [] });
    }
  }

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

  // Group completed log dates by habit
  const completedDatesByHabit = new Map<string, Set<string>>();
  if (allCompletedLogs) {
    for (const log of allCompletedLogs as { habit_id: string; date: string }[]) {
      let dates = completedDatesByHabit.get(log.habit_id);
      if (!dates) {
        dates = new Set<string>();
        completedDatesByHabit.set(log.habit_id, dates);
      }
      dates.add(log.date);
    }
  }

  // Calculate day of week safely (0 = Sunday, 1 = Monday, etc.)
  // We append T00:00:00 to avoid timezone shift in new Date() parsing
  const dayOfWeek = new Date(`${today}T00:00:00`).getDay();

  const habits: HabitWithLog[] = ((habitRows ?? []) as HabitRow[])
    .map((h) => {
      const log = logByHabit.get(h.id);
      const freq = h.frequency ?? { type: "daily" };
      return {
        id: h.id,
        title: h.title,
        type: h.type ?? "boolean",
        config: h.config ?? {},
        frequency: freq,
        timeOfDay: h.time_of_day ?? "anytime",
        isCompleted: Boolean(log?.is_completed),
        value: log?.value ?? null,
        weeklyLogs: weeklyLogsByHabit.get(h.id) || {},
        streak: calculateStreak(completedDatesByHabit.get(h.id) || new Set<string>(), today, freq),
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
      id: user.id,
      coins: coinsBalance,
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
      focusTokens: profile?.focus_tokens ?? 0,
      cleaningEnergy: profile?.cleaning_energy ?? 0,
      cleanedSpots: (profile?.cleaned_spots as Record<string, boolean>) ?? {},
      vacationMode,
    },
    inventory: {
      equippedItems: (inventoryData?.equipped_items as Record<string, string>) || {},
      unlockedItems: (inventoryData?.unlocked_items as string[]) || [],
      consumables,
      decorPositions: (inventoryData?.decor_positions as Record<string, { x: number; y: number }>) || {},
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
    tasks: (taskRows ?? []).map((t) => ({
      id: t.id,
      userId: t.user_id,
      title: t.title,
      notes: t.notes,
      status: t.status as "todo" | "in_progress" | "done",
      priority: t.priority as "low" | "medium" | "high",
      assigneeType: t.assignee_type as "self" | "pet",
      focusDuration: t.focus_duration,
      deadline: t.deadline,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    })),
  };
}
