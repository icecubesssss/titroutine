-- ────────────────────────────────────────────────────────────────────────────
-- MIGRATION 15: Neighbour habit logs + Feedback chat
-- ────────────────────────────────────────────────────────────────────────────

-- 1. Hàng xóm xem được lịch sử hoàn thành của thói quen CÔNG KHAI (để hiện
--    "hôm nay đã làm" + streak từng thói quen). Thói quen riêng tư vẫn ẩn.
DROP POLICY IF EXISTS "Users can view logs of public habits" ON public.habit_logs;
CREATE POLICY "Users can view logs of public habits" ON public.habit_logs
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.habits h
      WHERE h.id = habit_logs.habit_id AND h.is_private = FALSE
    )
  );

-- 2. Admin (người nhận feedback). Kiểm tra qua hàm SECURITY DEFINER để policy
--    không phải tự đọc bảng app_admins (bảng này không ai đọc được ngoài chính mình).
CREATE TABLE IF NOT EXISTS public.app_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);
ALTER TABLE public.app_admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can see own row" ON public.app_admins;
CREATE POLICY "Admins can see own row" ON public.app_admins
  FOR SELECT USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.is_app_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.app_admins WHERE user_id = auth.uid());
$$;

-- Tài khoản nhận feedback. Đổi email ở đây nếu muốn admin khác.
INSERT INTO public.app_admins (user_id)
SELECT id FROM auth.users WHERE email = 'thaitd.mathtech@gmail.com'
ON CONFLICT (user_id) DO NOTHING;

-- 3. Tin nhắn feedback: mỗi người dùng có đúng 1 cuộc hội thoại với admin
--    (thread_user_id = người dùng đó). from_admin = tin admin trả lời.
CREATE TABLE IF NOT EXISTS public.feedback_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  from_admin BOOLEAN NOT NULL DEFAULT FALSE,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS feedback_messages_thread_idx
  ON public.feedback_messages (thread_user_id, created_at);

ALTER TABLE public.feedback_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read own feedback thread" ON public.feedback_messages;
CREATE POLICY "Read own feedback thread" ON public.feedback_messages
  FOR SELECT USING (auth.uid() = thread_user_id OR public.is_app_admin());

DROP POLICY IF EXISTS "Send feedback" ON public.feedback_messages;
CREATE POLICY "Send feedback" ON public.feedback_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
    AND (
      (from_admin = FALSE AND auth.uid() = thread_user_id)
      OR (from_admin = TRUE AND public.is_app_admin())
    )
  );

DROP POLICY IF EXISTS "Mark feedback read" ON public.feedback_messages;
CREATE POLICY "Mark feedback read" ON public.feedback_messages
  FOR UPDATE USING (auth.uid() = thread_user_id OR public.is_app_admin());

-- Chỉ cho phép sửa cột read_at (không sửa nội dung tin nhắn).
REVOKE UPDATE ON public.feedback_messages FROM authenticated, anon;
GRANT UPDATE (read_at) ON public.feedback_messages TO authenticated;

-- 4. Realtime để chat cập nhật ngay (bỏ qua nếu đã có trong publication).
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.feedback_messages;
EXCEPTION WHEN duplicate_object OR undefined_object THEN NULL;
END $$;
