-- ────────────────────────────────────────────────────────────────────────────
-- MIGRATION 11: Phase 3 — Characters, Neighbour Visits & Co-op Interactions
-- ────────────────────────────────────────────────────────────────────────────
-- Adds:
--   1. Swappable companion character (Panda Girl → Tiger Boy) + custom name.
--   2. Visit sessions: a neighbour's character standing in someone's room,
--      persisted so it survives the other person being offline.
--   3. Co-op interactions (study/sleep/play/hug/kiss…) as claimable rows, so
--      rewards reach the other user without needing SECURITY DEFINER writes to
--      their profile (same pattern as social_vibes).
--   4. Auto-friendship between every user (this deployment is a 2-person app),
--      which lets the tasks/habits SELECT policies be tightened to friends-only.

-- ── 1. Companion character ──────────────────────────────────────────────────
-- Which sprite set renders this user's companion. Values must match a key in
-- apps/web/src/lib/characters.ts (CHARACTERS).
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS character_id TEXT DEFAULT 'pandagirl';
-- User-chosen companion name. NULL = fall back to the character's default name.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS character_name TEXT;
-- Who may drop by: 'friends' (default) or 'nobody'.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS visit_privacy TEXT DEFAULT 'friends';

-- ── 2. Visit sessions ───────────────────────────────────────────────────────
-- The rendered room is ALWAYS the host's room:
--   "I go to X"      → visitor_id = me,  host_id = X   (I see X's room)
--   "I invite X over" → visitor_id = X,  host_id = me  (I see my room + X)
CREATE TABLE IF NOT EXISTS public.visit_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  visitor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  host_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  -- Who started it; lets the UI say "you went over" vs "you were invited".
  initiated_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'active' NOT NULL, -- 'active' | 'ended'
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ended_at TIMESTAMPTZ,
  -- FALSE until the host has actually seen the visit (drives the guest-book badge).
  seen_by_host BOOLEAN DEFAULT FALSE NOT NULL,
  CONSTRAINT visit_sessions_no_self CHECK (visitor_id <> host_id)
);

-- A guest can only be in one place at a time.
CREATE UNIQUE INDEX IF NOT EXISTS visit_sessions_one_active_per_visitor
  ON public.visit_sessions (visitor_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS visit_sessions_host_active_idx
  ON public.visit_sessions (host_id, status);
CREATE INDEX IF NOT EXISTS visit_sessions_host_recent_idx
  ON public.visit_sessions (host_id, started_at DESC);

ALTER TABLE public.visit_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can view visits" ON public.visit_sessions;
CREATE POLICY "Participants can view visits" ON public.visit_sessions
  FOR SELECT USING (auth.uid() = visitor_id OR auth.uid() = host_id);

-- Either side may open a session (go over / invite over), but only as themselves
-- and only with someone they are friends with.
DROP POLICY IF EXISTS "Participants can start visits" ON public.visit_sessions;
CREATE POLICY "Participants can start visits" ON public.visit_sessions
  FOR INSERT WITH CHECK (
    auth.uid() = initiated_by
    AND (auth.uid() = visitor_id OR auth.uid() = host_id)
    AND EXISTS (
      SELECT 1 FROM public.friendships f
      WHERE f.user_id = auth.uid()
        AND f.friend_id = CASE WHEN auth.uid() = visitor_id THEN host_id ELSE visitor_id END
    )
  );

-- Either side may end it, and the host may flip seen_by_host.
DROP POLICY IF EXISTS "Participants can update visits" ON public.visit_sessions;
CREATE POLICY "Participants can update visits" ON public.visit_sessions
  FOR UPDATE USING (auth.uid() = visitor_id OR auth.uid() = host_id);

-- ── 3. Co-op interactions ───────────────────────────────────────────────────
-- Free-play: the actor's animation + reward happen immediately; the target's
-- reward waits in this table until they open the app and claim it.
CREATE TABLE IF NOT EXISTS public.coop_interactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES public.visit_sessions(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  target_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  -- 'study_together' | 'sleep_together' | 'play_together' | 'hug' | 'kiss' | 'hold_hands' | 'greet'
  kind TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  claimed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS coop_interactions_target_unclaimed_idx
  ON public.coop_interactions (target_id, claimed_at);
CREATE INDEX IF NOT EXISTS coop_interactions_actor_day_idx
  ON public.coop_interactions (actor_id, kind, created_at DESC);

ALTER TABLE public.coop_interactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can view coop interactions" ON public.coop_interactions;
CREATE POLICY "Participants can view coop interactions" ON public.coop_interactions
  FOR SELECT USING (auth.uid() = actor_id OR auth.uid() = target_id);

DROP POLICY IF EXISTS "Actors can send coop interactions" ON public.coop_interactions;
CREATE POLICY "Actors can send coop interactions" ON public.coop_interactions
  FOR INSERT WITH CHECK (auth.uid() = actor_id AND actor_id <> target_id);

DROP POLICY IF EXISTS "Targets can claim coop interactions" ON public.coop_interactions;
CREATE POLICY "Targets can claim coop interactions" ON public.coop_interactions
  FOR UPDATE USING (auth.uid() = target_id);

-- ── 4. Auto-friendship ──────────────────────────────────────────────────────
-- This deployment is a small private app, so everyone is a neighbour by default:
-- a new profile is mutually befriended with every existing profile. Runs as
-- SECURITY DEFINER because the friendships INSERT policy only allows a user to
-- create their own side of the pair.
CREATE OR REPLACE FUNCTION public.auto_befriend_everyone()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- New user → everyone else
  INSERT INTO public.friendships (user_id, friend_id)
  SELECT NEW.id, p.id FROM public.profiles p WHERE p.id <> NEW.id
  ON CONFLICT (user_id, friend_id) DO NOTHING;

  -- Everyone else → new user
  INSERT INTO public.friendships (user_id, friend_id)
  SELECT p.id, NEW.id FROM public.profiles p WHERE p.id <> NEW.id
  ON CONFLICT (user_id, friend_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_profile_created_auto_befriend ON public.profiles;
CREATE TRIGGER on_profile_created_auto_befriend
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.auto_befriend_everyone();

-- Backfill every existing pair (idempotent).
INSERT INTO public.friendships (user_id, friend_id)
SELECT a.id, b.id
FROM public.profiles a
CROSS JOIN public.profiles b
WHERE a.id <> b.id
ON CONFLICT (user_id, friend_id) DO NOTHING;

-- ── 5. Tighten public task/habit visibility to friends ──────────────────────
-- Migration 10 exposed every non-private task/habit to ANY authenticated user.
-- With auto-friendship in place this is equivalent in practice but no longer
-- leaks to strangers if the app ever opens up.
DROP POLICY IF EXISTS "Users can view public tasks" ON public.tasks;
CREATE POLICY "Users can view public tasks" ON public.tasks
  FOR SELECT USING (
    auth.uid() = user_id
    OR (
      is_private = FALSE
      AND EXISTS (
        SELECT 1 FROM public.friendships f
        WHERE f.user_id = auth.uid() AND f.friend_id = tasks.user_id
      )
    )
  );

DROP POLICY IF EXISTS "Users can view public habits" ON public.habits;
CREATE POLICY "Users can view public habits" ON public.habits
  FOR SELECT USING (
    auth.uid() = user_id
    OR (
      is_private = FALSE
      AND EXISTS (
        SELECT 1 FROM public.friendships f
        WHERE f.user_id = auth.uid() AND f.friend_id = habits.user_id
      )
    )
  );
