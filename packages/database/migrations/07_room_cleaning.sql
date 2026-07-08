-- ────────────────────────────────────────────────────────────────────────────
-- MIGRATION 07: Habit-Rabbit-style Messy Room Cleaning
-- Completing habits earns cleaning energy; spending it clears mess spots in
-- the pet's rooms (permanently, per user). Clearing a whole room pays a coin
-- bonus and gifts one furniture item (inventory.unlocked_items).
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cleaning_energy INTEGER DEFAULT 0;
-- Map of mess-spot id -> true once cleaned, e.g. {"bedroom_socks": true}
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cleaned_spots JSONB DEFAULT '{}'::jsonb;
