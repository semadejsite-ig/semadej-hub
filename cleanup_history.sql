-- CLEANUP & CONSTRAINT SCRIPT
-- Run this in Supabase SQL Editor

-- 1. Clean up "Test" and Duplicate records
-- Delete the manual debug records we created
DELETE FROM agent_assignments WHERE reason = 'Teste de Debug Manual';

-- 2. Smart Cleanup for Duplicates
-- Keep only the MOST RECENT open assignment for each agent, close or delete others.
WITH duplicates AS (
  SELECT id, agent_id,
  ROW_NUMBER() OVER (PARTITION BY agent_id ORDER BY start_date DESC) as rnk
  FROM agent_assignments
  WHERE end_date IS NULL
)
DELETE FROM agent_assignments
WHERE id IN (
  SELECT id FROM duplicates WHERE rnk > 1
);

-- 3. Add Constraint to prevent future duplicates
-- This ensures an agent can only have ONE "active" (end_date IS NULL) assignment at a time.
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_assignment 
ON agent_assignments (agent_id) 
WHERE end_date IS NULL;

-- 4. Verify
SELECT * FROM agent_assignments;
