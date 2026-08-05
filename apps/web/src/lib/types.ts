import type { PetMood } from "./game";
import type { RoomId } from "./rooms";
import type { CharacterId } from "./characters";
import type { CoopKind } from "./coop";

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
  focus_mode?: "strict" | "normal"; // focus mode for timer habits
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
  isPrivate?: boolean;
  weeklyLogs?: Record<string, boolean>; // map of date YYYY-MM-DD to completion status
  streak?: number;
}

export interface ProfileSummary {
  id: string;
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
  focusTokens: number;
  // ── Messy-room cleaning (Habit Rabbit loop) ─────────────────────────────
  /** Energy earned from completing habits, spent clearing mess spots. */
  cleaningEnergy: number;
  /** Mess-spot id -> true once permanently cleaned (see lib/cleaning.ts). */
  cleanedSpots: Record<string, boolean>;
  /** Vacation mode: freezes satiety decay, streak gaps and neglect penalties. */
  vacationMode: boolean;
  // ── Companion character ─────────────────────────────────────────────────
  /** Which sprite set renders the companion (see lib/characters.ts). */
  characterId: CharacterId;
  /** Resolved display name: the user's custom name, else the character default. */
  characterName: string;
  /** True when the user has set a custom name (so the form can show/clear it). */
  hasCustomCharacterName: boolean;
  /** Who may drop by. */
  visitPrivacy: VisitPrivacy;
  /** Highest streak milestone the badge-unlock celebration has already shown for. */
  badgeMilestoneSeen: number;
}

export type VisitPrivacy = "friends" | "nobody";

// ── Neighbour visits & co-op (migration 11) ───────────────────────────────────

/** One side of a visit, with everything needed to draw their companion. */
export interface VisitParticipant {
  id: string;
  username: string | null;
  characterId: CharacterId;
  characterName: string;
}

/**
 * The visit the current user is currently part of, on either side. The room being
 * rendered is ALWAYS the host's room, so `isHost` decides whether the user is
 * looking at their own place with a guest in it, or at someone else's.
 */
export interface ActiveVisit {
  id: string;
  host: VisitParticipant;
  visitor: VisitParticipant;
  /** True when the current user is the host. */
  isHost: boolean;
  /** True when the current user opened the session ("I went over" / "I invited"). */
  initiatedByMe: boolean;
  startedAt: string;
  /** The other person — whichever side the current user is not. */
  partner: VisitParticipant;
}

/** A co-op interaction someone sent us whose reward is still waiting. */
export interface PendingCoop {
  id: string;
  kind: CoopKind;
  actorUsername: string | null;
  actorCharacterName: string;
  createdAt: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  notes: string | null;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  assigneeType: "self" | "pet";
  focusDuration: number; // in minutes
  isPrivate?: boolean;
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InventorySummary {
  equippedItems: Record<string, string>;
  unlockedItems: string[];
  consumables: Record<string, number>; // e.g., { "carrot": 3, "cake": 0 }
  /** Per-room position (%) of the equipped object; missing = legacy corner. */
  decorPositions: Record<string, { x: number; y: number }>;
}

/** A purchased streak-milestone badge hanging in the room (see lib/badges.ts). */
export interface OwnedBadge {
  key: string;
  visible: boolean;
  x: number;
  y: number;
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
  moodLogs?: Record<string, { mood: string; activities: string[]; note: string | null }>;
  tasks: Task[];
  /** The visit in progress on either side, or null when nobody is over. */
  activeVisit: ActiveVisit | null;
  /** Co-op rewards sent to us while we were away, waiting to be claimed. */
  pendingCoops: PendingCoop[];
  /** How many times we already sent each co-op kind today (drives the daily cap). */
  coopUsedToday: Partial<Record<CoopKind, number>>;
  /** Streak-milestone badges the user has purchased. */
  badges: OwnedBadge[];
}

export interface NeighborSummary {
  id: string;
  username: string | null;
  petStage: number;
  petLevel: number;
  currentStreak: number;
  /** Their chosen character, so their companion renders correctly in our room. */
  characterId: CharacterId;
  characterName: string;
}

export interface NeighborData {
  profile: {
    id: string;
    username: string | null;
    petStage: number;
    petLevel: number;
    currentStreak: number;
    affection: number;
    characterId: CharacterId;
    characterName: string;
  };
  equippedItems: Record<string, string>;
  publicTasks: Task[];
  publicHabits: HabitWithLog[];
}

