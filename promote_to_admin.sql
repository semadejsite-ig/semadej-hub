-- Promote a user to Admin by Email
-- 1. First, sign up a new user manually in the App (e.g. at /register/agent)
-- 2. Then, run this script in the Supabase SQL Editor to make them an Admin

UPDATE profiles
SET 
  role = 'admin',
  approved = true
FROM auth.users
WHERE profiles.id = auth.users.id
AND auth.users.email = 'admin@semadej.com'; -- <--- REPLACE WITH YOUR EMAIL

-- Verify the change
SELECT p.full_name, p.role, p.approved, u.email 
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'admin@semadej.com';
