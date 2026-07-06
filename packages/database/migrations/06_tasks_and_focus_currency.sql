-- ────────────────────────────────────────────────────────────────────────────
-- MIGRATION 06: Tasks Management and Focus Tokens Currency
-- ────────────────────────────────────────────────────────────────────────────

-- Add focus_tokens to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS focus_tokens INTEGER DEFAULT 0;

-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'todo' NOT NULL, -- 'todo', 'in_progress', 'done'
  priority TEXT DEFAULT 'medium' NOT NULL, -- 'low', 'medium', 'high'
  assignee_type TEXT DEFAULT 'self' NOT NULL, -- 'self', 'pet'
  focus_duration INTEGER DEFAULT 25 NOT NULL, -- in minutes
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Create Policies
DROP POLICY IF EXISTS "Users can manage own tasks" ON public.tasks;
CREATE POLICY "Users can manage own tasks" ON public.tasks
  FOR ALL USING (auth.uid() = user_id);
