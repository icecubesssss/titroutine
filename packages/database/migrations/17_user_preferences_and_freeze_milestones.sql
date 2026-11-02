-- ────────────────────────────────────────────────────────────────────────────
-- MIGRATION 17: User Preferences (Calendar & Task Views) + Freeze Milestones
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{"calendar_view": "week", "task_view": "kanban", "claimed_freeze_milestones": []}'::jsonb;
