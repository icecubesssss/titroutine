// "What's new" popup (WhatsNewModal), shown once per user per version. Bump
// WHATS_NEW_VERSION and replace the items whenever there's a new batch of
// changes to announce; the text lives in i18n under `WhatsNew.items.<key>`.

export const WHATS_NEW_VERSION = "2026-10-22";

export interface WhatsNewItem {
  /** i18n key under `WhatsNew.items` (has `title` + `body`). */
  key: string;
  emoji: string;
}

export const WHATS_NEW_ITEMS: readonly WhatsNewItem[] = [
  { key: "feedback", emoji: "💬" },
  { key: "freeze", emoji: "❄️" },
  { key: "neighborHabits", emoji: "🏡" },
  { key: "mobileForms", emoji: "📱" },
  { key: "habitFail", emoji: "✕" },
  { key: "maximize", emoji: "🔍" },
  { key: "taskFilter", emoji: "📋" },
  { key: "badges", emoji: "🏅" },
];
