-- Migration: Fix RLS Recursion by Splitting Policies (v4)
-- Run this in Supabase SQL Editor

-- 1. Secure Admin Check Function (Keep it)
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

-- 2. Drop OLD policies (Clean slate)
drop policy if exists "Admins can do everything" on profiles;
drop policy if exists "Admins can update everything" on profiles;
drop policy if exists "Users can update own profile" on profiles;
drop policy if exists "Public can insert profile" on profiles;
drop policy if exists "Authenticated can view profiles" on profiles;

-- 3. Create Granular Policies (Avoids FOR ALL recursion)

-- SELECT: Everyone authenticated can view profiles
-- This is necessary for the dashboard and for is_admin() to work properly without recursion
create policy "View profiles" on profiles
  for select
  to authenticated
  using ( true );

-- INSERT: Public/Auth can insert their own profile (Migration/Signup)
create policy "Insert own profile" on profiles
  for insert
  with check ( auth.uid() = id );

-- UPDATE: Users can update own, Admins can update any
create policy "Update own profile" on profiles
  for update
  using ( auth.uid() = id );

create policy "Admins update any" on profiles
  for update
  using ( is_admin() );

-- DELETE: Only Admins can delete
create policy "Admins delete any" on profiles
  for delete
  using ( is_admin() );

-- CONGREGATIONS Policies (Ensure they exist)
drop policy if exists "Public can view congregations" on congregations;
create policy "Public can view congregations" on congregations for select using (true);
