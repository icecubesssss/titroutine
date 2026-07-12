// Shared union of every full-screen overlay HomeView can show. Extracted so the
// overlay components (QuickMenuSheet, MindfulnessMenuSheet, MobileSidebar, …) and
// HomeView agree on the exact set of overlay keys without a circular import.
export type ActiveOverlay =
  | null
  | "settings"
  | "shop"
  | "album"
  | "neighbor"
  | "timer"
  | "mood_checkin"
  | "breathing"
  | "first_aid"
  | "pet_profile"
  | "add_habit"
  | "edit_habit"
  | "feed"
  | "celebration"
  | "friendships"
  | "adventure_story"
  | "vibe_inbox"
  | "mindfulness_menu"
  | "quick_menu";
