import type { PetMood } from "./game";
import type { RoomId } from "./rooms";

export type FrequencyType = "daily" | "specific_days" | "x_times_a_week";

export type HabitType = "boolean" | "timer" | "counter" | "negative";
export type TimeOfDay = "morning" | "afternoon" | "evening" | "anytime";

export interface HabitFrequency {
  type: FrequencyType;
  days?: number[]; // 0=Sun, 1=Mon... Used for specific_days
}

export interface HabitConfig {
  target_time?: number; // seconds, for timer habits
  target_count?: number; // for counter habits
}

export interface HabitWithLog {
  id: string;
  title: string;
  type: HabitType;
  config: HabitConfig;
  frequency: HabitFrequency;
  timeOfDay: TimeOfDay;
  isCompleted: boolean;
  value: number | null;
  weeklyLogs?: Record<string, boolean>; // map of date YYYY-MM-DD to completion status
}

export interface ProfileSummary {
  coins: number;
  currentStreak: number;
  /** Streak-driven appearance stage (egg → … → woman). Unchanged by feeding. */
  petStage: number;
  totalExp: number;
  timezone: string;
  username: string | null;
  lastCheckinDate: string | null;
  streakFreezes: number;
  // ── Nurture axis (feeding) ──────────────────────────────────────────────
  /** Cumulative feeding EXP. */
  petExp: number;
  /** Nurture level derived from petExp (gates rooms/interactions). */
  petLevel: number;
  /** Progress into the current level, 0..1. */
  petLevelProgress: number;
  /** Effective satiety right now (0..100), after daily decay. */
  satiety: number;
  /** Bond points with the pet (0..100). */
  affection: number;
  /** Derived mood from satiety + affection. */
  mood: PetMood;
  /** Rooms currently unlocked at petLevel. */
  unlockedRooms: RoomId[];
  /** True once all rooms are unlocked (neighbours available). */
  allRoomsUnlocked: boolean;
  /** Whether the daily neighbour gift can be claimed today. */
  canClaimNeighborGift: boolean;
  // ── Finch Upgrade Connected Loop axis ─────────────────────────
  personalityCuriosity: number;
  personalityCompassion: number;
  personalityResilience: number;
  personalityEnergy: number;
  petLikes: string[];
  petDislikes: string[];
  adventureEnergy: number;
  adventureStatus: "idle" | "adventuring" | "returned";
  adventureStartAt: string | null;
  adventureStoryId: string | null;
}

export interface InventorySummary {
  equippedItems: Record<string, string>;
  unlockedItems: string[];
  consumables: Record<string, number>; // e.g., { "carrot": 3, "cake": 0 }
}

export interface SocialVibe {
  id: string;
  senderId: string;
  senderUsername: string;
  vibeType: string;
}

export interface DashboardData {
  profile: ProfileSummary;
  habits: HabitWithLog[];
  inventory: InventorySummary;
  /** Memory-album keys the user has permanently earned (survives streak resets). */
  unlockedMemories: string[];
  today: string; // YYYY-MM-DD in the user's timezone
  email: string | null;
  currentDate: string;
  isToday: boolean;
  weekDates?: string[]; // Array of YYYY-MM-DD for the current week (Mon-Sun)
  pendingVibes: SocialVibe[];
}
