// Co-op interactions — the pure rules for what two companions can do together
// while one is visiting the other (migration 11, `coop_interactions`).
//
// Same shape as the rest of the game rules: no I/O, no Supabase, so the server
// action and the UI can both import it and agree on rewards, caps and gates.

import type { CharacterAction } from "./characters";

/** Persisted in `coop_interactions.kind`. */
export type CoopKind =
  | "greet"
  | "study_together"
  | "play_together"
  | "hold_hands"
  | "hug"
  | "kiss"
  | "sleep_together";

export interface CoopKindConfig {
  kind: CoopKind;
  emoji: string;
  /** Duo sprite sheet to play — one image containing BOTH companions. */
  action: CharacterAction;
  /**
   * Solo action both companions play in sync when no duo sheet exists yet.
   * Two characters waving at each other reads almost as well as a drawn duo
   * frame, and costs one solo sheet per character instead of one sheet per pair.
   * Left undefined for the kinds that only make sense as a single drawn image
   * (you cannot mime a hug with two separate sprites).
   */
  soloAction?: CharacterAction;
  /** Affection granted to each side (actor immediately, target on claim). */
  affection: number;
  /** How many times the actor may send this kind per day. */
  dailyLimit: number;
  /**
   * Bond required before the kind unlocks, measured on the actor's own affection.
   * Keeps the intimate interactions as something you grow into.
   */
  minAffection: number;
}

export const COOP_KINDS: Record<CoopKind, CoopKindConfig> = {
  greet: {
    kind: "greet",
    emoji: "👋",
    action: "duo_greet",
    soloAction: "wave",
    affection: 2,
    dailyLimit: 5,
    minAffection: 0,
  },
  study_together: {
    kind: "study_together",
    emoji: "📚",
    action: "duo_study",
    soloAction: "working",
    affection: 5,
    dailyLimit: 3,
    minAffection: 0,
  },
  play_together: {
    kind: "play_together",
    emoji: "🎲",
    action: "duo_play",
    affection: 4,
    dailyLimit: 3,
    minAffection: 10,
  },
  hold_hands: {
    kind: "hold_hands",
    emoji: "🤝",
    action: "duo_hold_hands",
    affection: 3,
    dailyLimit: 3,
    minAffection: 20,
  },
  hug: {
    kind: "hug",
    emoji: "🤗",
    action: "duo_hug",
    affection: 5,
    dailyLimit: 2,
    minAffection: 35,
  },
  kiss: {
    kind: "kiss",
    emoji: "💋",
    action: "duo_kiss",
    affection: 8,
    dailyLimit: 1,
    minAffection: 60,
  },
  sleep_together: {
    kind: "sleep_together",
    emoji: "🌙",
    action: "duo_sleep",
    affection: 6,
    dailyLimit: 1,
    minAffection: 50,
  },
};

/** Display/menu order — gentlest first, so the dock reads as a progression. */
export const COOP_KIND_ORDER: CoopKind[] = [
  "greet",
  "study_together",
  "play_together",
  "hold_hands",
  "hug",
  "sleep_together",
  "kiss",
];

export function isCoopKind(value: unknown): value is CoopKind {
  return typeof value === "string" && value in COOP_KINDS;
}

/** Never throws — unknown kinds degrade to a plain greeting. */
export function getCoopKind(kind: string | null | undefined): CoopKindConfig {
  return isCoopKind(kind) ? COOP_KINDS[kind] : COOP_KINDS.greet;
}

/** YYYY-MM-DD for an arbitrary instant in the given IANA zone. */
export function dateInTimezone(date: Date, timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: timezone || "UTC" }).format(date);
  } catch {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "UTC" }).format(date);
  }
}

export type CoopBlockReason = "locked" | "daily_limit";

/**
 * Whether the actor may send `kind` right now. `usedToday` is how many times they
 * already sent this same kind today; `affection` is their own bond level.
 * Shared by the server action (enforcement) and the dock (disabled state), so the
 * UI never offers a button the server will reject.
 */
export function coopBlockReason(
  kind: CoopKind,
  affection: number,
  usedToday: number
): CoopBlockReason | null {
  const config = COOP_KINDS[kind];
  if (affection < config.minAffection) return "locked";
  if (usedToday >= config.dailyLimit) return "daily_limit";
  return null;
}
