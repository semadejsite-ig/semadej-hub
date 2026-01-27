-- Confirm Email and Promote to Admin
-- Run this in Supabase SQL Editor

UPDATE auth.users
SET email_confirmed_at = now()
WHERE email = 'admin@semadej.com'; -- <--- REPLACE WITH YOUR EMAIL if different

-- Re-run promotion just in case
UPDATE profiles
SET role = 'admin', approved = true
FROM auth.users
WHERE profiles.id = auth.users.id
AND auth.users.email = 'admin@semadej.com'; -- <--- REPLACE WITH YOUR EMAIL
