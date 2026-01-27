-- Migration: Fix RLS Recursion (Final)
-- Run this in Supabase SQL Editor

-- 1. Create a secure function to check admin status
-- This bypasses RLS on the profiles table to avoid infinite recursion
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
    and role = 'admin'
  );
$$;

-- 2. Drop problematic policies
drop policy if exists "Admins can update everything" on profiles;
drop policy if exists "Admins can do everything" on profiles; -- potential name var
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "Public can insert profile" on profiles;
drop policy if exists "Public can view congregations" on congregations;

-- 3. Re-create Policies

-- Congregations: Public Read
create policy "Public can view congregations" on congregations for select using (true);

-- Profiles: Admin Full Access (Uses the secure function!)
create policy "Admins can do everything" on profiles
  for all
  using ( is_admin() );

-- Profiles: Public Insert (Sign Up)
create policy "Public can insert profile" on profiles
  for insert
  with check ( auth.uid() = id );

-- Profiles: User Update Own
create policy "Users can update own profile" on profiles
  for update
  using ( auth.uid() = id );

-- Profiles: View Access
-- Allow all authenticated users to read profiles (needed for lists/counts)
-- Or restrict if privacy is paramount, but for now we need it for the logic.
create policy "Authenticated can view profiles" on profiles
  for select
  to authenticated
  using ( true );

-- 4. Constraint Update (Just in case)
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check 
  check (role in ('agent', 'coordinator', 'pastor', 'admin'));
