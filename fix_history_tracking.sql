-- Fix History Tracking & Backfill
-- Run this in Supabase SQL Editor

-- 1. Force Re-create Trigger (Just in case)
CREATE OR REPLACE FUNCTION public.handle_agent_assignment_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.congregation_id IS DISTINCT FROM NEW.congregation_id) THEN
    -- Close OLD
    IF OLD.congregation_id IS NOT NULL THEN
      UPDATE public.agent_assignments
      SET end_date = CURRENT_DATE
      WHERE agent_id = NEW.id
      AND congregation_id = OLD.congregation_id
      AND end_date IS NULL;
    END IF;

    -- Open NEW
    IF NEW.congregation_id IS NOT NULL THEN
      INSERT INTO public.agent_assignments (agent_id, congregation_id, start_date)
      VALUES (NEW.id, NEW.congregation_id, CURRENT_DATE);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_agent_assignment_change ON profiles;
CREATE TRIGGER on_agent_assignment_change
AFTER UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_agent_assignment_change();

-- 2. SMART BACKFILL (The important part!)
-- Find users who are in a congregation BUT have no "Open" history record there.
-- This creates the initial record so the trigger has something to "close" next time.
INSERT INTO public.agent_assignments (agent_id, congregation_id, start_date, reason)
SELECT 
  p.id, 
  p.congregation_id, 
  p.created_at::date, 
  'Carga Inicial (Correção)'
FROM profiles p
WHERE p.congregation_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 
  FROM public.agent_assignments aa 
  WHERE aa.agent_id = p.id 
  AND aa.congregation_id = p.congregation_id 
  AND aa.end_date IS NULL
);

-- 3. Check Result
SELECT count(*) as initial_histories_created FROM agent_assignments WHERE reason = 'Carga Inicial (Correção)';
