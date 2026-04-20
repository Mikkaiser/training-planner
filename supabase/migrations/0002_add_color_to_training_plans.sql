-- Adds color theming to training plans.
-- Stored as a named token (e.g. 'blue') rather than a hex so the UI can pick
-- palettes (border, chip, accent, glow) per plan color.

ALTER TABLE training_plans
  ADD COLUMN IF NOT EXISTS color text DEFAULT 'blue';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'training_plans_color_check'
  ) THEN
    ALTER TABLE training_plans
      ADD CONSTRAINT training_plans_color_check
      CHECK (color IN ('red','blue','yellow','green','purple','orange'));
  END IF;
END $$;

UPDATE training_plans SET color = 'blue' WHERE color IS NULL;
