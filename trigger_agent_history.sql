-- Trigger: Auto-track Agent Assignments
-- Run this in Supabase SQL Editor

-- 1. Create the Trigger Function
CREATE OR REPLACE FUNCTION public.handle_agent_assignment_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only run if congregation_id changed and it's not null (or logic as needed)
  IF (OLD.congregation_id IS DISTINCT FROM NEW.congregation_id) THEN
    
    -- A. Close previous active assignment (if any)
    IF OLD.congregation_id IS NOT NULL THEN
      UPDATE public.agent_assignments
      SET end_date = CURRENT_DATE
      WHERE agent_id = NEW.id
      AND congregation_id = OLD.congregation_id
      AND end_date IS NULL;
    END IF;

    -- B. Create new assignment entry (if new congregation is valid)
    IF NEW.congregation_id IS NOT NULL THEN
      INSERT INTO public.agent_assignments (agent_id, congregation_id, start_date)
      VALUES (NEW.id, NEW.congregation_id, CURRENT_DATE);
    END IF;
    
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the Trigger
DROP TRIGGER IF EXISTS on_agent_assignment_change ON profiles;

CREATE TRIGGER on_agent_assignment_change
AFTER UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_agent_assignment_change();

-- 3. Backfill Trigger (Optional: Create initial history for current state)
-- Only run this ONCE. It creates a history entry for everyone currently assigned.
INSERT INTO agent_assignments (agent_id, congregation_id, start_date, reason)
SELECT id, congregation_id, created_at::date, 'Importação Inicial'
FROM profiles
WHERE congregation_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM agent_assignments WHERE agent_id = profiles.id);
