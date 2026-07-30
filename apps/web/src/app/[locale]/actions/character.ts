"use server";

import { revalidatePath } from "next/cache";
import {
  getCharacter,
  isCharacterId,
  normalizeCharacterName,
} from "@/lib/characters";
import { getUserId, type ActionResult } from "./_shared";

/**
 * Swap the companion character (Panda Girl ↔ Tiger Boy). Refuses characters whose
 * sprite sheets haven't been drawn yet so the room can never end up empty.
 */
export async function setCharacterAction(characterId: string): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  if (!isCharacterId(characterId)) return { error: "unknown_character" };
  if (!getCharacter(characterId).available) return { error: "character_unavailable" };

  const { error } = await supabase
    .from("profiles")
    .update({ character_id: characterId, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}

/**
 * Rename the companion. An empty name clears the override, falling back to the
 * character's default name.
 */
export async function renameCharacterAction(name: string): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const { error } = await supabase
    .from("profiles")
    .update({
      character_name: normalizeCharacterName(name),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}

/** Control who may drop by: 'friends' (default) or 'nobody'. */
export async function setVisitPrivacyAction(mode: string): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  if (mode !== "friends" && mode !== "nobody") return { error: "invalid_mode" };

  const { error } = await supabase
    .from("profiles")
    .update({ visit_privacy: mode, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return {};
}
