-- Titroutine Supabase Schema
-- Phase 2: Dữ liệu & Xác thực (Cập nhật Hoàn chỉnh cho Gamification)

-- 1. Profiles (Tài khoản User và thông tin cơ bản)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  timezone TEXT DEFAULT 'UTC',
  coins INTEGER DEFAULT 0,
  streak_freezes INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  total_exp INTEGER DEFAULT 0, -- (Đóng băng) EXP habit cũ; giữ cho tương thích, không còn tăng
  pet_stage INTEGER DEFAULT 0, -- 0: Trứng, 1: Thỏ con, v.v. (tiến hóa theo STREAK)
  affection_level INTEGER DEFAULT 0, -- Độ thân thiết với thú (từ vuốt ve/chơi/cho ăn), 0-100
  pet_exp INTEGER DEFAULT 0, -- EXP NUÔI (chỉ từ việc cho ăn) → tính pet level → mở khóa phòng
  satiety INTEGER DEFAULT 100, -- Thanh No (0-100), giảm dần mỗi ngày, hồi khi cho ăn
  last_fed_date DATE, -- Ngày cho ăn gần nhất: tính giảm No + thưởng nuôi mỗi ngày
  last_interact_at TIMESTAMPTZ, -- Lần tương tác gần nhất (cooldown chống spam vuốt ve/chơi)
  affection_today INTEGER DEFAULT 0, -- Affection đã nhận trong ngày (daily cap; reset khi qua ngày)
  last_neighbor_gift_date DATE, -- Ngày nhận quà thăm hàng xóm gần nhất (1 lần/ngày)
  last_active_date DATE, -- Dùng để tự động reset/kiểm tra streak
  last_checkin_date DATE, -- Dùng để ghi nhận điểm danh mỗi ngày và thưởng xu
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bật RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Habits (Các thói quen cần theo dõi)
CREATE TABLE public.habits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  type TEXT DEFAULT 'boolean', -- boolean, timer, counter
  config JSONB DEFAULT '{}'::jsonb, -- e.g., { "target_time": 1800, "target_count": 5 }
  frequency JSONB DEFAULT '{"type": "daily"}'::jsonb, -- e.g., { "type": "weekly", "days": [1, 3, 5] }
  time_of_day TEXT DEFAULT 'anytime', -- morning, afternoon, evening, anytime
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  archived_at TIMESTAMPTZ
);

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own habits" ON public.habits FOR ALL USING (auth.uid() = user_id);

-- 3. Habit Logs (Lịch sử check-in hàng ngày)
CREATE TABLE public.habit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL, -- Ngày theo timezone của user
  is_completed BOOLEAN DEFAULT FALSE,
  value INTEGER, -- Cho dạng timer/counter (e.g., số phút, số lần)
  used_freeze BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(habit_id, date)
);

ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own habit logs" ON public.habit_logs FOR ALL USING (auth.uid() = user_id);

-- 4. Inventory & Room (Đồ đạc trong phòng Pet)
CREATE TABLE public.inventory (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  equipped_items JSONB DEFAULT '{}'::jsonb, -- e.g., { "bed": "bed_wood", "wallpaper": "wall_yellow" }
  unlocked_items JSONB DEFAULT '[]'::jsonb, -- Array các item ID đã mua/mở khóa
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can CRUD own inventory" ON public.inventory FOR ALL USING (auth.uid() = user_id);

-- 5. Memories (Sổ tay kỷ niệm/Album ảnh đã mở khóa)
CREATE TABLE public.memories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  memory_key TEXT NOT NULL, -- Ví dụ: 'memory_day_1', 'memory_day_30'
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, memory_key)
);

ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own memories" ON public.memories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own memories" ON public.memories FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger auto-create profile on auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  
  INSERT INTO public.inventory (user_id)
  VALUES (new.id);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ────────────────────────────────────────────────────────────────────────────
-- MIGRATION: Pet nurture (feeding) + rooms + neighbours.
-- Run once on an existing Supabase database. Idempotent (IF NOT EXISTS). The
-- DEFAULTs backfill existing rows, so no one starts "starving" after rollout
-- (satiety = 100, and NULL last_fed_date is treated as full in game.ts).
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pet_exp INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS satiety INTEGER DEFAULT 100;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_fed_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_interact_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS affection_today INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_neighbor_gift_date DATE;

-- ────────────────────────────────────────────────────────────────────────────
-- MIGRATION 04: Finch-level Cozy Connected Loop Upgrade
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS personality_curiosity INTEGER DEFAULT 10;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS personality_compassion INTEGER DEFAULT 10;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS personality_resilience INTEGER DEFAULT 10;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS personality_energy INTEGER DEFAULT 10;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pet_likes TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pet_dislikes TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS adventure_energy INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS adventure_status TEXT DEFAULT 'idle';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS adventure_start_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS adventure_story_id TEXT;

ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS consumables JSONB DEFAULT '{"carrot": 0, "cake": 0, "feast": 0, "toy_ball": 0, "toy_bear": 0}'::jsonb;

CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own friendships" ON public.friendships FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Users can manage own friendships" ON public.friendships FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.social_vibes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  vibe_type TEXT NOT NULL,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.social_vibes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own received vibes" ON public.social_vibes FOR SELECT USING (auth.uid() = receiver_id);
CREATE POLICY "Users can send vibes" ON public.social_vibes FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update own received vibes" ON public.social_vibes FOR UPDATE USING (auth.uid() = receiver_id);

-- ────────────────────────────────────────────────────────────────────────────
-- MIGRATION 06: Tasks Management and Focus Tokens Currency
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS focus_tokens INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'todo' NOT NULL, -- 'todo', 'in_progress', 'done'
  priority TEXT DEFAULT 'medium' NOT NULL, -- 'low', 'medium', 'high'
  assignee_type TEXT DEFAULT 'self' NOT NULL, -- 'self', 'pet'
  focus_duration INTEGER DEFAULT 25 NOT NULL, -- in minutes
  is_private BOOLEAN DEFAULT FALSE,
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own tasks" ON public.tasks;
CREATE POLICY "Users can manage own tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- MIGRATION 07: Habit-Rabbit-style Messy Room Cleaning
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cleaning_energy INTEGER DEFAULT 0;
-- Map of mess-spot id -> true once cleaned, e.g. {"bedroom_socks": true}
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cleaned_spots JSONB DEFAULT '{}'::jsonb;

-- ────────────────────────────────────────────────────────────────────────────
-- MIGRATION 08: Vacation Mode + Neglect Consequence
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS vacation_mode BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_neglect_date DATE;

-- ────────────────────────────────────────────────────────────────────────────
-- MIGRATION 09: Draggable Room Decor
-- ────────────────────────────────────────────────────────────────────────────
-- { "<roomId>": { "x": 12.5, "y": 80 } } — % of room viewport; missing = legacy corner
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS decor_positions JSONB DEFAULT '{}'::jsonb;


