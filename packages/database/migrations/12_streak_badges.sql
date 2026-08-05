-- ────────────────────────────────────────────────────────────────────────────
-- MIGRATION 12: Streak Milestone Badges
-- Purchasable once a streak crosses its threshold (catalogue in lib/badges.ts).
-- Unlike decor (one "object" per room), a user can own many badges at once —
-- each hangs in the room independently, so it needs its own row + position.
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.badges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  badge_key TEXT NOT NULL, -- e.g. 'badge_streak_7' — must match lib/badges.ts
  purchased_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  visible BOOLEAN DEFAULT TRUE NOT NULL, -- tap-to-hide in the room
  pos_x REAL DEFAULT 50 NOT NULL, -- % of the room canvas, like decor_positions
  pos_y REAL DEFAULT 40 NOT NULL,
  UNIQUE(user_id, badge_key)
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own badges" ON public.badges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own badges" ON public.badges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own badges" ON public.badges FOR UPDATE USING (auth.uid() = user_id);

-- Highest streak milestone the "you unlocked a badge!" celebration has already
-- been shown for, so it fires once per milestone instead of every page load.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS badge_milestone_seen INTEGER DEFAULT 0 NOT NULL;
