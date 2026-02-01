-- Migration: Add Treasurer Role and Permissions

-- 1. Update Profiles Check Constraint to include 'treasurer' and 'tesoureiro' (just in case)
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check 
  check (role in ('agent', 'coordinator', 'pastor', 'admin', 'sector_agent', 'sector_pastor', 'treasurer'));

-- 2. Update RLS for Monthly Reports to allow Treasurer to VIEW ALL
-- We drop the policy created in roles_management_migration.sql and recreate it with 'treasurer' added.

drop policy if exists "View Reports Policy" on monthly_reports;

create policy "View Reports Policy" on monthly_reports
  for select
  using (
    -- 1. Own reports
    auth.uid() = agent_id
    OR
    -- 2. Admin & Treasurer (Global Access)
    exists (
      select 1 from profiles 
      where id = auth.uid() 
      and role in ('admin', 'treasurer')
    )
    OR
    -- 3. Sector Leaders (Same Sector)
    exists (
      select 1 from get_my_claim() my
      join congregations target_cong on target_cong.id = monthly_reports.congregation_id
      where 
        my.role in ('sector_agent', 'sector_pastor') 
        and my.sector = target_cong.sector
    )
  );
