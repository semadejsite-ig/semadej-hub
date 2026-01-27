-- Migration: Add Approved Status to Profiles
-- Run this in Supabase SQL Editor

-- 1. Add approved column (Default false for security, true for existing setup if needed)
alter table profiles add column approved boolean default false;

-- 2. Validate existing admins (Ensure they are approved)
update profiles set approved = true where role = 'admin';

-- 3. Policy Update: Only approved users can sign in? 
-- (Actually supabase auth handles sign in, but we block data access)

-- Update "View profiles" policy to allow Admins to see unapproved users
-- (The existing policy "View profiles" allows "authenticated", which is fine)

-- 4. RPC to Approve User (Optional, or just use Update)
