-- Migration: Add Stats to Congregations & Fix RLS
-- Run this in Supabase SQL Editor

-- 1. Add Stats Columns to Congregations
alter table congregations 
add column if not exists members_count integer default 0,
add column if not exists carnets_count integer default 0;

-- 2. Allow Agents to Update their Congregation Stats
-- We need a policy that allows an update ONLY if the user is an agent of that congregation.

-- First, enable RLS for congregations (it was already enabled, but let's be sure)
alter table congregations enable row level security;

-- Drop simple "read-only" policy if conflicting (we want more granular control now)
drop policy if exists "Public can view congregations" on congregations;
-- Re-create Public Read
create policy "Public can view congregations" on congregations for select using (true);

-- Create Agent Update Policy
create policy "Agents can update own congregation" on congregations
  for update
  using (
    id in (
      select congregation_id from profiles 
      where id = auth.uid()
    )
  )
  with check (
    id in (
      select congregation_id from profiles 
      where id = auth.uid()
    )
  );
