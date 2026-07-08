-- ────────────────────────────────────────────────────────────────────────────
-- MIGRATION 09: Draggable Room Decor (Habit-Rabbit draggable items)
-- Where the equipped "object" furniture sits in each room, as percentages of
-- the room viewport: { "<roomId>": { "x": 12.5, "y": 80 } }. Missing entry =
-- the legacy bottom-left corner.
-- ────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS decor_positions JSONB DEFAULT '{}'::jsonb;
