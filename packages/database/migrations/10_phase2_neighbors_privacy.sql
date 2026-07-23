-- ────────────────────────────────────────────────────────────────────────────
-- MIGRATION 10: Phase 2 Neighbors Privacy & Shared Public Tasks/Habits
-- ────────────────────────────────────────────────────────────────────────────

-- Add is_private column to tasks and habits (default false = public to friends)
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE;
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE;

-- Allow authenticated users to view public tasks & habits of other users
DROP POLICY IF EXISTS "Users can view public tasks" ON public.tasks;
CREATE POLICY "Users can view public tasks" ON public.tasks
  FOR SELECT USING (auth.uid() = user_id OR is_private = FALSE);

DROP POLICY IF EXISTS "Users can view public habits" ON public.habits;
CREATE POLICY "Users can view public habits" ON public.habits
  FOR SELECT USING (auth.uid() = user_id OR is_private = FALSE);
