-- Migration: Add status to profiles and Admin cleanup
-- Run in Supabase SQL Editor

-- 1. Add status column to profiles if it doesn't exist
alter table profiles 
add column if not exists status text default 'pending' check (status in ('pending', 'approved', 'rejected'));

-- 2. Allow public to read congregations (already done, but reinforcing)
create policy "Public can view congregations" on congregations for select using (true);
drop policy if exists "Public can view congregations" on congregations; -- Re-create to be safe or ignore if error
create policy "Public can view congregations" on congregations for select right (true); -- Actually enable true

-- 3. Policy: Agents can update their own profile (e.g. phone)
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- 4. Policy: Admins can update any profile (to approve)
create policy "Admins can update everything" on profiles for all using (
  auth.uid() in (select id from profiles where role = 'admin')
);

-- 5. Policy: Public can insert into profiles (during signup)
create policy "Public can insert profile" on profiles for insert with check (auth.uid() = id);
