-- Migration 01: Thêm Daily Checkin
-- Ngày tạo: 2026-06-23
-- Mục đích: Hỗ trợ tính năng điểm danh hàng ngày và bảo vệ chuỗi.

ALTER TABLE public.profiles
ADD COLUMN last_checkin_date DATE;

-- Chú ý: Cột streak_freezes INTEGER DEFAULT 0 đã có sẵn trong schema.sql từ trước.
