-- Migration: Fix Registration and Constraints
-- Run this in Supabase SQL Editor

-- 1. Ensure Role Constraint is correct (Just in case)
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check 
  check (role in ('agent', 'coordinator', 'pastor', 'admin', 'sector_agent', 'sector_pastor'));

-- 2. Create a SECURITY DEFINER function to handle profile creation
-- This bypasses RLS issues during signup when the session might not be fully established
create or replace function public.create_profile_entry(
  _id uuid,
  _full_name text,
  _phone text,
  _congregation_id uuid,
  _role text
)
returns void
language plpgsql
security definer -- EXECUTES AS SUPERUSER/ADMIN
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, congregation_id, role, status)
  values (_id, _full_name, _phone, _congregation_id, _role, 'pending');
end;
$$;

-- 3. Grant execute permission
grant execute on function public.create_profile_entry to anon, authenticated, service_role;
