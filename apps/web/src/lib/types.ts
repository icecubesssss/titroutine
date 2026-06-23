export type HabitType = "boolean" | "timer" | "counter";

export type FrequencyType = "daily" | "specific_days" | "x_times_a_week";

export interface HabitFrequency {
  type: FrequencyType;
  days?: number[]; // 0 = Sunday, 1 = Monday, etc.
  timesPerWeek?: number;
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
  isCompleted: boolean;
  value: number | null;
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
  today: string; // YYYY-MM-DD in the user's timezone
  email: string | null;
}
