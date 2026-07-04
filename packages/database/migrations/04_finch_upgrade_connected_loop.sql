-- Migration 04: Finch-level Cozy Connected Loop Upgrade
-- Ngày tạo: 2026-07-04
-- Mục đích: Bổ sung cấu trúc dữ liệu cho tính cách pet, sở thích, kho đồ tiêu dùng,
--           hệ thống thám hiểm, bạn bè (friendships) và rung cảm tích cực (social_vibes).
--           An toàn để chạy lại nhiều lần (idempotent).

-- 1. Cập nhật profiles với tính cách thỏ, danh sách thích/ghét và trạng thái thám hiểm --
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS personality_curiosity INTEGER DEFAULT 10;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS personality_compassion INTEGER DEFAULT 10;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS personality_resilience INTEGER DEFAULT 10;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS personality_energy INTEGER DEFAULT 10;

-- Cột lưu trữ Likes & Dislikes dạng Array Text
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pet_likes TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pet_dislikes TEXT[] DEFAULT '{}';

-- Trạng thái thám hiểm
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS adventure_energy INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS adventure_status TEXT DEFAULT 'idle'; -- 'idle', 'adventuring', 'returned'
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS adventure_start_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS adventure_story_id TEXT;

-- 2. Cập nhật inventory với consumables (kho đồ ăn & chơi tiêu dùng) --
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS consumables JSONB DEFAULT '{"carrot": 0, "cake": 0, "feast": 0, "toy_ball": 0, "toy_bear": 0}'::jsonb;

-- 3. Tạo bảng kết bạn friendships (nếu chưa có) --
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  friend_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own friendships" ON public.friendships;
CREATE POLICY "Users can view own friendships" ON public.friendships
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

DROP POLICY IF EXISTS "Users can manage own friendships" ON public.friendships;
CREATE POLICY "Users can manage own friendships" ON public.friendships
  FOR ALL USING (auth.uid() = user_id);

-- 4. Tạo bảng social_vibes (Hộp thư gửi vibes tích cực) --
CREATE TABLE IF NOT EXISTS public.social_vibes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  vibe_type TEXT NOT NULL, -- 'hug', 'water', 'cheer'
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.social_vibes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own received vibes" ON public.social_vibes;
CREATE POLICY "Users can view own received vibes" ON public.social_vibes
  FOR SELECT USING (auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can send vibes" ON public.social_vibes;
CREATE POLICY "Users can send vibes" ON public.social_vibes
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update own received vibes" ON public.social_vibes;
CREATE POLICY "Users can update own received vibes" ON public.social_vibes
  FOR UPDATE USING (auth.uid() = receiver_id);
