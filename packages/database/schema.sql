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
  total_exp INTEGER DEFAULT 0, -- Dùng để tính Level cho Pet
  pet_stage INTEGER DEFAULT 0, -- 0: Trứng, 1: Thỏ con, v.v.
  affection_level INTEGER DEFAULT 0, -- Mức độ tình cảm với thú ảo
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
