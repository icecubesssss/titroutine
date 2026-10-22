-- ────────────────────────────────────────────────────────────────────────────
-- MIGRATION 16: "Có gì mới" — popup thông báo cập nhật chỉ hiện 1 lần
-- ────────────────────────────────────────────────────────────────────────────
-- Lưu phiên bản thông báo (WHATS_NEW_VERSION trong lib/announcements.ts) mà
-- người dùng đã đóng, để không hiện lại — kể cả khi đổi thiết bị.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whats_new_seen TEXT;
