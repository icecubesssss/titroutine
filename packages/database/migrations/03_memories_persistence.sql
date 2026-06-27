-- Migration 03: Lưu Kỷ Niệm (Memories) vĩnh viễn
-- Ngày tạo: 2026-06-27
-- Mục đích: Đảm bảo bảng `memories` + RLS tồn tại để Sổ Tay Kỷ Niệm được lưu
--           VĨNH VIỄN (không biến mất khi đứt streak). Toàn bộ migration này
--           an toàn để chạy lại nhiều lần (idempotent) trên DB đang chạy.
--
-- Cách chạy: dán toàn bộ file vào Supabase Dashboard → SQL Editor → Run.

-- 1. Bảng memories (tạo nếu chưa có) ----------------------------------------
CREATE TABLE IF NOT EXISTS public.memories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  memory_key TEXT NOT NULL, -- ví dụ: 'memory_day_1', 'memory_day_30'
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, memory_key)
);

-- Phòng trường hợp bảng đã tồn tại từ trước nhưng thiếu ràng buộc duy nhất
-- (cần cho upsert ON CONFLICT trong reconcileMemories / backfill bên dưới).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.memories'::regclass AND contype = 'u'
  ) THEN
    ALTER TABLE public.memories
      ADD CONSTRAINT memories_user_key_uniq UNIQUE (user_id, memory_key);
  END IF;
END $$;

-- 2. Bật RLS + chính sách (DROP trước rồi CREATE để chạy lại không lỗi) ------
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own memories" ON public.memories;
CREATE POLICY "Users can view own memories" ON public.memories
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own memories" ON public.memories;
CREATE POLICY "Users can insert own memories" ON public.memories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. (An toàn) Đảm bảo các cột gamification mà code hiện tại cần đều tồn tại --
--    Hầu hết DB đã có sẵn; các lệnh dưới chỉ thêm khi còn thiếu.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pet_stage INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS streak_freezes INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_checkin_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS affection_level INTEGER DEFAULT 0;

-- 4. Backfill: ghi lại các kỷ niệm mà streak hiện tại của user đã đạt, để user
--    cũ nhìn thấy ngay mà không phải chờ lần hoàn thành tiếp theo.
--    (Ngưỡng phải khớp với MEMORIES trong apps/web/src/lib/memories.ts)
INSERT INTO public.memories (user_id, memory_key)
SELECT p.id, m.key
FROM public.profiles p
CROSS JOIN (VALUES
  ('memory_day_1', 1),
  ('memory_day_30', 30),
  ('memory_day_100', 100),
  ('memory_day_365', 365),
  ('memory_day_1000', 1000)
) AS m(key, req)
WHERE p.current_streak >= m.req
ON CONFLICT (user_id, memory_key) DO NOTHING;
