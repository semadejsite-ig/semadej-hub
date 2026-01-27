-- FIX COORDINATOR ACCESS (V2)
-- Please run this entire script in the Supabase SQL Editor

-- 1. Ensure PROFILES are readable (Critical for RLS subqueries to work)
-- This allows any logged-in user to read profile data (needed to check roles)
DROP POLICY IF EXISTS "Authenticated can view profiles" ON profiles;
CREATE POLICY "Authenticated can view profiles" 
ON profiles 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- 2. Fix REGISTRATIONS Policy
-- We drop all potential conflicting policies first
DROP POLICY IF EXISTS "Admins can view registrations" ON registrations;
DROP POLICY IF EXISTS "Admins and Coordinators can view registrations" ON registrations;
DROP POLICY IF EXISTS "Admins can update registrations" ON registrations;
DROP POLICY IF EXISTS "Admins and Coordinators can update registrations" ON registrations;

-- Create a robust View Policy (Case insensitive check)
CREATE POLICY "Staff can view registrations" 
ON registrations 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT id FROM profiles 
    WHERE lower(role) IN ('admin', 'coordinator', 'coordenador')
  )
);

-- Create a robust Update Policy (Approve/Reject)
CREATE POLICY "Staff can update registrations" 
ON registrations 
FOR UPDATE 
USING (
  auth.uid() IN (
    SELECT id FROM profiles 
    WHERE lower(role) IN ('admin', 'coordinator', 'coordenador')
  )
);

-- 3. Double Check: Grant explicit permissions (sometimes needed if defaults are strict)
GRANT SELECT, UPDATE ON registrations TO authenticated;
GRANT SELECT ON profiles TO authenticated;

-- Confirmation
SELECT 'Permissions updated successfully' as status;
