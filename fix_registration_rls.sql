-- Fix RLS for Registrations to allow Coordinators
-- Previous policy was only for admins

BEGIN;

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Admins can view registrations" ON registrations;
DROP POLICY IF EXISTS "Admins and Coordinators can view registrations" ON registrations; -- Drop if exists to avoid error on rerun

-- Create new inclusive policy
CREATE POLICY "Admins and Coordinators can view registrations" 
ON registrations 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT id FROM profiles 
    WHERE role IN ('admin', 'coordinator')
  )
);

-- Ensure they can also UPDATE (for Approve/Reject)
-- Previous policy might not have covered update properly for admins either, or relied on service_role
DROP POLICY IF EXISTS "Admins can update registrations" ON registrations;
DROP POLICY IF EXISTS "Admins and Coordinators can update registrations" ON registrations;

CREATE POLICY "Admins and Coordinators can update registrations" 
ON registrations 
FOR UPDATE 
USING (
  auth.uid() IN (
    SELECT id FROM profiles 
    WHERE role IN ('admin', 'coordinator')
  )
);

COMMIT;
