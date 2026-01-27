-- Migration: Fix policies and update roles (Final Version - Idempotent)
-- Run this entire script in Supabase SQL Editor

-- 1. Fix Policy for Congregations
-- Drop first to avoid "policy already exists" error
drop policy if exists "Public can view congregations" on congregations;
create policy "Public can view congregations" on congregations for select using (true);

-- 2. Update Profiles status
-- This does not error if column exists
alter table profiles 
add column if not exists status text default 'pending' check (status in ('pending', 'approved', 'rejected'));

-- 3. Update Roles Check Constraint
-- Drop constraint first to ensure we can update it
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check 
  check (role in ('agent', 'coordinator', 'pastor', 'admin'));

-- 4. Policies for Profiles
-- Drop all related policies first to ensure clean creation
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "Public can insert profile" on profiles;
drop policy if exists "Admins can update everything" on profiles;

-- Re-create policies
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

create policy "Public can insert profile" on profiles for insert with check (auth.uid() = id);

create policy "Admins can update everything" on profiles for all using (
  auth.uid() in (select id from profiles where role = 'admin')
);
