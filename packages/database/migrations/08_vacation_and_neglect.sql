-- ────────────────────────────────────────────────────────────────────────────
-- MIGRATION 08: Vacation Mode + Neglect Consequence (Habit-Rabbit health loop)
-- vacation_mode freezes satiety decay and streak gaps (anchors are bumped
-- lazily on dashboard load). last_neglect_date makes the once-per-day starving
-- penalty (-coins/-affection) idempotent.
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS vacation_mode BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_neglect_date DATE;
