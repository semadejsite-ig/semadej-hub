-- Widen RLS for Agent Assignments
-- Run this in Supabase SQL Editor

-- 1. Drop existing read policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can view all assignments" ON agent_assignments;
DROP POLICY IF EXISTS "Agents can view own assignments" ON agent_assignments;

-- 2. Create a broader policy: ANY authenticated user can view history
-- (Since this is a dashboard feature, it's generally safe for logged-in users to see who was where)
CREATE POLICY "Authenticated users can view assignments"
ON agent_assignments
FOR SELECT
TO authenticated
USING (true);

-- 3. Verify policies
SELECT * FROM pg_policies WHERE tablename = 'agent_assignments';
