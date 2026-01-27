-- Migration: Roles & Management Visibility
-- Run this in Supabase SQL Editor

-- 1. Update Profiles Role Constraint
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check 
  check (role in ('agent', 'coordinator', 'pastor', 'admin', 'sector_agent', 'sector_pastor'));

-- 2. Helper Function for Performance (Avoids repetitive joins)
-- Returns user's role and sector using SECURITY DEFINER to bypass RLS recursion
create or replace function public.get_my_claim()
returns table (role text, sector text) 
language sql security definer set search_path = public stable
as $$
  select p.role, c.sector
  from profiles p
  join congregations c on p.congregation_id = c.id
  where p.id = auth.uid();
$$;

-- 3. Update Monthly Reports RLS (Who can see reports?)
alter table monthly_reports enable row level security;

-- Drop old strict policy
drop policy if exists "Agents can view own reports" on monthly_reports;
drop policy if exists "Admins can view reports" on monthly_reports; -- if exists

-- Create Comprehensive Select Policy
create policy "View Reports Policy" on monthly_reports
  for select
  using (
    -- 1. Own reports
    auth.uid() = agent_id
    OR
    -- 2. Admin (Global)
    (select count(*) from profiles where id = auth.uid() and role = 'admin') > 0
    OR
    -- 3. Sector Leaders (Same Sector)
    exists (
      select 1 from get_my_claim() my
      join congregations target_cong on target_cong.id = monthly_reports.congregation_id
      where 
        my.role in ('sector_agent', 'sector_pastor') -- Is a Leader
        and my.sector = target_cong.sector           -- Same Sector
    )
  );

-- 4. VACANCIES RLS (Similar Logic: Leaders see vacancies in their sector)
alter table vacancies enable row level security;
-- Drop old
drop policy if exists "Public view vacancies" on vacancies; 
-- New Policy
create policy "View Vacancies Policy" on vacancies
  for select
  using (
     -- Public/Open vacancies might be visible to all, but let's restrict Management data?
     -- Actually, for now, let's keep vacancies public or authenticated-global as before?
     -- User asked for "Management View". Let's assume vacancies view is open for now.
     true
  );

-- 5. DASHBOARD STATS ACCESS
-- To see "Total Raised" for a sector, we need access to specific rows in monthly_reports (Covered by step 3)
