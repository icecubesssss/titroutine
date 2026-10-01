-- ────────────────────────────────────────────────────────────────────────────
-- MIGRATION 14: Habit Fail (Đánh dấu thói quen "thất bại" trong ngày)
-- ────────────────────────────────────────────────────────────────────────────
-- Một ngày của thói quen giờ có 3 trạng thái: chưa làm / hoàn thành / fail.
-- Fail chỉ là ghi nhận (không trừ xu, không động vào streak); không bao giờ
-- đồng thời is_completed = TRUE.
ALTER TABLE public.habit_logs
  ADD COLUMN IF NOT EXISTS is_failed BOOLEAN DEFAULT FALSE;
