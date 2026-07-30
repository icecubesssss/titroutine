// Companion characters — the single place that knows which sprite sheet belongs
// to which character + action. Adding a new character (e.g. Tiger Boy) means
// dropping sheets into `public/assets/characters/<id>/` and adding one entry to
// CHARACTERS; no component needs to change, and the user can swap with one tap.
//
// Sheet convention (same as the original Panda Girl idle sheet):
//   frame 563.2 × 768 · 5 cols × 2 rows = 10 frames · sheet 2816 × 1536 · transparent PNG
// Duo sheets (two characters drawn together) use the same grid; set `duo: true`
// so the renderer knows not to also draw a partner sprite next to it.

/** Registry keys. Persisted in `profiles.character_id`. */
export type CharacterId = "pandagirl" | "tigerboy";

export const DEFAULT_CHARACTER_ID: CharacterId = "pandagirl";

/**
 * Every action a character sheet can provide. Solo actions render one character;
 * `duo_*` actions are single sheets containing BOTH characters, used by the
 * neighbour co-op interactions.
 */
export type CharacterAction =
  // solo
  | "idle"
  | "working"
  | "walk"
  | "sit"
  | "wave"
  | "sleep"
  // duo (co-op with a visiting neighbour)
  | "duo_greet"
  | "duo_study"
  | "duo_sleep"
  | "duo_play"
  | "duo_hug"
  | "duo_kiss"
  | "duo_hold_hands";

export interface SpriteSheetConfig {
  spriteUrl: string;
  frameWidth: number;
  frameHeight: number;
  cols: number;
  rows: number;
  /** Defaults to cols × rows. Set lower when the last cells of the sheet are blank. */
  totalFrames?: number;
  fps?: number;
  /** Sheet already contains both characters — don't render a partner sprite. */
  duo?: boolean;
}

export interface CharacterConfig {
  id: CharacterId;
  /** Fallback companion name when the user hasn't renamed it. */
  defaultName: string;
  emoji: string;
  /** Base scale for a solo sprite in the pet room. */
  defaultScale: number;
  /** Duo sheets fit two characters in one frame, so they need a larger scale. */
  duoScale: number;
  /**
   * False while the sprite sheets haven't been drawn yet — the picker shows the
   * character as "coming soon" and the server refuses to switch to it.
   */
  available: boolean;
  /** Action used whenever the requested one has no sheet. */
  fallbackAction: CharacterAction;
  actions: Partial<Record<CharacterAction, SpriteSheetConfig>>;
}

/** Standard sheet geometry — one place to change if the export size ever moves. */
const SHEET_W = 2816;
const SHEET_H = 1536;
const COLS = 5;
const ROWS = 2;
const FRAME_W = SHEET_W / COLS; // 563.2
const FRAME_H = SHEET_H / ROWS; // 768

/** Build a standard-geometry sheet config from a character folder + file name. */
function sheet(
  characterId: CharacterId,
  file: string,
  overrides: Partial<SpriteSheetConfig> = {}
): SpriteSheetConfig {
  return {
    spriteUrl: `/assets/characters/${characterId}/${file}`,
    frameWidth: FRAME_W,
    frameHeight: FRAME_H,
    cols: COLS,
    rows: ROWS,
    fps: 6,
    ...overrides,
  };
}

export const CHARACTERS: Record<CharacterId, CharacterConfig> = {
  pandagirl: {
    id: "pandagirl",
    defaultName: "Panda Girl",
    emoji: "🐼",
    defaultScale: 0.16,
    duoScale: 0.26,
    available: true,
    fallbackAction: "idle",
    actions: {
      idle: sheet("pandagirl", "idle.png"),
      working: sheet("pandagirl", "working.png"),
      // Sheets still to be drawn (see the asset list). Uncomment as they land:
      // walk: sheet("pandagirl", "walk_side.png"),
      // sit: sheet("pandagirl", "sit_floor.png"),
      // wave: sheet("pandagirl", "wave.png"),
      // duo_greet: sheet("pandagirl", "duo_greet.png", { duo: true }),
      // duo_study: sheet("pandagirl", "duo_study.png", { duo: true }),
      // duo_sleep: sheet("pandagirl", "duo_sleep.png", { duo: true, fps: 4 }),
      // duo_play: sheet("pandagirl", "duo_play.png", { duo: true }),
      // duo_hug: sheet("pandagirl", "duo_hug.png", { duo: true }),
      // duo_kiss: sheet("pandagirl", "duo_kiss.png", { duo: true }),
      // duo_hold_hands: sheet("pandagirl", "duo_hold_hands.png", { duo: true }),
    },
  },
  tigerboy: {
    id: "tigerboy",
    defaultName: "Tiger Boy",
    emoji: "🐯",
    defaultScale: 0.16,
    duoScale: 0.26,
    // Flip to true once /assets/characters/tigerboy/idle.png exists, and add the
    // action entries below — that is the whole integration.
    available: false,
    fallbackAction: "idle",
    actions: {},
  },
};

export const CHARACTER_IDS = Object.keys(CHARACTERS) as CharacterId[];

export function isCharacterId(value: unknown): value is CharacterId {
  return typeof value === "string" && value in CHARACTERS;
}

/** Never throws — unknown/legacy values fall back to the default character. */
export function getCharacter(id: string | null | undefined): CharacterConfig {
  return isCharacterId(id) ? CHARACTERS[id] : CHARACTERS[DEFAULT_CHARACTER_ID];
}

/**
 * Resolve the sheet for an action, falling back to the character's idle sheet so
 * a missing asset degrades to a still-animating companion instead of a hole.
 */
export function resolveSheet(
  id: string | null | undefined,
  action: CharacterAction
): { sheet: SpriteSheetConfig; resolvedAction: CharacterAction } | null {
  const character = getCharacter(id);
  const direct = character.actions[action];
  if (direct) return { sheet: direct, resolvedAction: action };

  const fallback = character.actions[character.fallbackAction];
  if (fallback) return { sheet: fallback, resolvedAction: character.fallbackAction };

  // Character has no drawn sheets at all (e.g. Tiger Boy before its assets land).
  const base = CHARACTERS[DEFAULT_CHARACTER_ID];
  const baseSheet = base.actions[action] ?? base.actions[base.fallbackAction];
  return baseSheet ? { sheet: baseSheet, resolvedAction: base.fallbackAction } : null;
}

/** The companion's display name: the user's custom name, else the default. */
export function characterDisplayName(
  id: string | null | undefined,
  customName?: string | null
): string {
  const trimmed = customName?.trim();
  return trimmed ? trimmed : getCharacter(id).defaultName;
}

export const CHARACTER_NAME_MAX_LENGTH = 24;

/** Shared by the rename form and the server action so both agree on what's valid. */
export function normalizeCharacterName(raw: string): string | null {
  const trimmed = raw.trim().replace(/\s+/g, " ");
  if (!trimmed) return null; // empty = reset to the character's default name
  return trimmed.slice(0, CHARACTER_NAME_MAX_LENGTH);
}
