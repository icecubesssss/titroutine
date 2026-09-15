-- ────────────────────────────────────────────────────────────────────────────
-- MIGRATION 13: Open Neighborhood (Tự động kết nối mọi cư dân)
-- ────────────────────────────────────────────────────────────────────────────
-- 1. Cho phép authenticated user xem toàn bộ danh sách profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- 2. Cho phép xem tasks & habits công khai (is_private = FALSE) cho mọi authenticated user
DROP POLICY IF EXISTS "Users can view public tasks" ON public.tasks;
CREATE POLICY "Users can view public tasks" ON public.tasks
  FOR SELECT USING (auth.uid() = user_id OR is_private = FALSE);

DROP POLICY IF EXISTS "Users can view public habits" ON public.habits;
CREATE POLICY "Users can view public habits" ON public.habits
  FOR SELECT USING (auth.uid() = user_id OR is_private = FALSE);

-- 3. Cho phép authenticated user mở phiên ghé thăm (visit_sessions) với bất kỳ ai
DROP POLICY IF EXISTS "Participants can start visits" ON public.visit_sessions;
CREATE POLICY "Participants can start visits" ON public.visit_sessions
  FOR INSERT WITH CHECK (
    auth.uid() = initiated_by
    AND (auth.uid() = visitor_id OR auth.uid() = host_id)
  );

-- 4. Tự động đồng bộ hóa bảng friendships cho mọi cặp người dùng (để tương thích ngược)
INSERT INTO public.friendships (user_id, friend_id)
SELECT a.id, b.id
FROM public.profiles a
CROSS JOIN public.profiles b
WHERE a.id <> b.id
ON CONFLICT (user_id, friend_id) DO NOTHING;
