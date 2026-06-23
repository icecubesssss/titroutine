export type HabitType = "boolean" | "timer" | "counter";

export interface HabitConfig {
  target_time?: number; // seconds, for timer habits
  target_count?: number; // for counter habits
}

export interface HabitWithLog {
  id: string;
  title: string;
  type: HabitType;
  config: HabitConfig;
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

export interface DashboardData {
  profile: ProfileSummary;
  habits: HabitWithLog[];
  today: string; // YYYY-MM-DD in the user's timezone
  email: string | null;
}
