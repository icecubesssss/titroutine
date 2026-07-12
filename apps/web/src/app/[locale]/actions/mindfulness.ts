"use server";

import { revalidatePath } from "next/cache";
import { format, addDays, parseISO } from "date-fns";
import {
  COINS_PER_HABIT,
  nextStreak,
  ratchetStage,
  todayInTimezone,
  currentSatiety,
  foodTier,
  feedExpGain,
  levelFromExp,
  SATIETY_MAX,
  DAILY_FEED_BONUS_EXP,
  AFFECTION_MAX,
  AFFECTION_PER_FEED,
  AFFECTION_PER_INTERACT,
  AFFECTION_DAILY_CAP,
  INTERACT_COOLDOWN_MS,
  NEIGHBOR_GIFT_COINS,
  NEIGHBOR_GIFT_AFFECTION,
} from "@/lib/game";
import { allRoomsUnlocked, ROOMS, type InteractionKind } from "@/lib/rooms";
import {
  ENERGY_PER_HABIT,
  SPOT_CLEAN_COINS,
  ROOM_CLEAN_BONUS_COINS,
  ROOM_CLEAN_GIFTS,
  findMessSpot,
  isRoomFullyClean,
} from "@/lib/cleaning";
import type { HabitType } from "@/lib/types";
import { ADVENTURE_STORIES, getRandomStory } from "@/lib/adventure_stories";
import { getFeedFeedback, getPlayFeedback, getCleanFeedback, getSleepFeedback } from "@/lib/game_interactions";
import { getUserId, reconcileMemories, type ActionResult } from "./_shared";

export async function logMoodAction(mood: string, tags: string[], reflection: string, locale: string = "vi"): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("coins, satiety, affection_level, timezone")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) return { error: profileError.message };

  const timezone = profile?.timezone || "UTC";
  const today = todayInTimezone(timezone);

  const newCoins = (profile?.coins ?? 0) + 15;
  const newAffection = Math.min(AFFECTION_MAX, (profile?.affection_level ?? 0) + 10);

  // 1. Cập nhật profiles
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      coins: newCoins,
      affection_level: newAffection,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (updateError) return { error: updateError.message };

  // 2. Ghi thực tế vào daily_bean_logs
  const { error: logError } = await supabase
    .from("daily_bean_logs")
    .upsert({
      user_id: userId,
      logged_date: today,
      mood: mood,
      activities: tags,
      note: reflection,
      created_at: new Date().toISOString()
    }, { onConflict: "user_id,logged_date" });

  if (logError) return { error: logError.message };

  // 3. Gọi Gemini API (hoặc dùng fallback nếu không có key) để viết nhật ký dễ thương
  let diaryText = "";
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const prompt = `You are a super cute virtual pet bunny companion.
Your owner just checked in their mood: "${mood}"
Activities they did: ${tags.join(", ")}
Their reflection/notes: "${reflection || "No reflection written."}"

Write a very short, warm, cute diary entry (1-3 sentences) from the pet bunny's perspective.
Express empathy, encouragement, and love. Use cute expressions and emojis.
Write the diary entry in the following language: ${locale === "zh" ? "Chinese" : locale === "en" ? "English" : "Vietnamese"}.
Do not include any metadata, intro, or markdown wrapper. Just output the plain text diary content directly.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          }),
          signal: AbortSignal.timeout(5000),
        }
      );
      if (response.ok) {
        const result = await response.json();
        const generated = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (generated && generated.trim().length > 0) {
          diaryText = generated.trim();
        }
      }
    } catch (e) {
      console.warn("Gemini diary generation failed, falling back to rule-based: ", e);
    }
  }

  if (!diaryText) {
    const loc = locale || "vi";
    if (loc === "zh") {
      const dict: Record<string, string> = {
        awesome: "主人今天超开心！兔兔也跟着手舞足蹈啦，祝我们天天都有好心情！🐰✨",
        good: "今天是美好的一天！有主人陪伴，兔兔觉得心里暖洋洋的。我们要继续加油哦！🥕",
        neutral: "平平静静的一天。兔兔会一直在你身边，吃着胡萝卜听你倾诉。爱你！💕",
        bad: "主人今天有点累或者不开心吗？别担心，兔兔给你一个毛茸茸的温暖拥抱！🥺🌸",
        awful: "心疼主人……今天一定很不容易吧？兔兔抱抱你，已经为你准备了最甜的嫩草，我们一起休息吧。😭❤️",
      };
      diaryText = dict[mood] || dict.neutral;
    } else if (loc === "en") {
      const dict: Record<string, string> = {
        awesome: "My owner is super happy today! I'm so excited to share this joyful day with you. Keep shining! 🐰✨",
        good: "Today was a wonderful day! I feel so warm and cozy being by your side. Let's keep building great habits! 🥕",
        neutral: "A peaceful day passed by. I'll always be here to munch on carrots and listen to you. Love you! 💕",
        bad: "You seem a bit tired or down today... Don't worry, I'm sending you the biggest, softest bunny hug! 🥺🌸",
        awful: "Oh no, today was really tough for you... I'm right here with a warm hug and sweet fresh clover. You're doing your best! 😭❤️",
      };
      diaryText = dict[mood] || dict.neutral;
    } else {
      const dict: Record<string, string> = {
        awesome: "Hôm nay chủ nhân của tớ siêu siêu vui vẻ! Tớ đã cùng chủ nhân trải qua một ngày thật nhiều niềm vui. Cố lên nhé chủ nhân ơi! 🐰✨",
        good: "Chủ nhân của tớ hôm nay rất tuyệt! Tớ cảm thấy vô cùng ấm áp khi được ở bên cạnh bạn. Hãy cùng nhau xây dựng thói quen tốt mỗi ngày nha! 🥕",
        neutral: "Một ngày bình yên trôi qua. Tớ luôn ở đây để nhấm nháp cỏ và lắng nghe mọi chia sẻ của bạn. Thương chủ nhân nhiều! 💕",
        bad: "Hôm nay chủ nhân có vẻ mệt mỏi hoặc buồn một chút... Đừng lo lắng nhé, tớ sẽ ôm bạn thật chặt bằng đôi tai dài mềm mại này! 🥺🌸",
        awful: "Thương chủ nhân quá... Hôm nay chắc hẳn rất khó khăn với bạn đúng không? Tớ đã chuẩn bị một cái ôm thật ấm và cỏ tươi ngọt ngào cho bạn rồi đây. Thương thương! 😭❤️",
      };
      diaryText = dict[mood] || dict.neutral;
    }
  }

  // 4. Ghi nhật ký vào ai_pet_diaries
  const { error: diaryError } = await supabase
    .from("ai_pet_diaries")
    .upsert({
      user_id: userId,
      logged_date: today,
      diary_content: diaryText,
      created_at: new Date().toISOString()
    }, { onConflict: "user_id,logged_date" });

  if (diaryError) {
    console.error("Failed to save AI diary:", diaryError.message);
  }

  revalidatePath("/", "layout");
  return {};
}

export async function completeBreathingAction(): Promise<ActionResult> {
  const { supabase, userId } = await getUserId();
  if (!userId) return { error: "unauthorized" };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("coins, affection_level, satiety")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) return { error: profileError.message };

  const newCoins = (profile?.coins ?? 0) + 10;
  const newAffection = Math.min(AFFECTION_MAX, (profile?.affection_level ?? 0) + 10);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      coins: newCoins,
      affection_level: newAffection,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (updateError) return { error: updateError.message };

  revalidatePath("/", "layout");
  return {};
}
