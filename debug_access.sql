-- Debug Registrations and Roles
-- 1. Check Course Types
SELECT DISTINCT course_type FROM registrations;

-- 2. Check Profiles (Obfuscated emails for privacy if needed, but here simple list)
SELECT id, full_name, email, role, approved FROM profiles;

-- 3. Check Policies on relevant tables
SELECT schemaname, tablename, policyname, cmd, roles, qual 
FROM pg_policies 
WHERE tablename IN ('registrations', 'profiles');
