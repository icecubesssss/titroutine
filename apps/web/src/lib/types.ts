
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
  petStage: number;
  totalExp: number;
  timezone: string;
  username: string | null;
  lastCheckinDate: string | null;
  streakFreezes: number;
}

export interface InventorySummary {
  equippedItems: Record<string, string>;
  unlockedItems: string[];
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
}
