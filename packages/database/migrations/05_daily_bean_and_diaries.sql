-- ────────────────────────────────────────────────────────────────────────────
-- MIGRATION 05: Daily Bean Mood Logs & AI Diaries
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.daily_bean_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  logged_date DATE NOT NULL,
  mood TEXT NOT NULL, -- Great, Peaceful, Sad, Tired, Anxious (or awful, bad, neutral, good, awesome)
  activities TEXT[] DEFAULT '{}', -- ['work', 'family', 'sleep', etc.]
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, logged_date)
);

CREATE TABLE IF NOT EXISTS public.ai_pet_diaries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  logged_date DATE NOT NULL,
  diary_content TEXT NOT NULL,
  unlocked_photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, logged_date)
);

-- Enable RLS
ALTER TABLE public.daily_bean_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_pet_diaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own bean logs" ON public.daily_bean_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own AI diaries" ON public.ai_pet_diaries FOR ALL USING (auth.uid() = user_id);
