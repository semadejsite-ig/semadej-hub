-- Migration: Agent History and Approvals
-- Run this in Supabase SQL Editor

-- 1. Add 'approved' column to profiles if not exists
alter table profiles add column if not exists approved boolean default false;

-- 2. Ensure existing admins and agents are approved (optional, for backward compatibility)
update profiles set approved = true where role in ('admin', 'pastor', 'sector_pastor');
-- Ideally we might want to manually approve existing agents, or auto-approve them:
update profiles set approved = true where role = 'agent'; 

-- 3. Create Agent Assignments History Table
create table if not exists agent_assignments (
  id uuid primary key default uuid_generate_v4(),
  agent_id uuid references profiles(id) on delete cascade not null,
  congregation_id uuid references congregations(id) on delete cascade not null,
  start_date date default current_date not null,
  end_date date, -- null means current assignment
  reason text, -- e.g. "Initial Assignment", "Transfer", "Resignation"
  created_by uuid references profiles(id), -- Admin who performed the action
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Enable RLS
alter table agent_assignments enable row level security;

-- 5. Policies for Agent Assignments
-- Admins can view all history
create policy "Admins can view all assignments" on agent_assignments
  for select using ( 
    exists (select 1 from profiles where id = auth.uid() and role = 'admin') 
  );

-- Agents can view their own history
create policy "Agents can view own assignments" on agent_assignments
  for select using ( auth.uid() = agent_id );

-- Admins can insert/update
create policy "Admins can manage assignments" on agent_assignments
  for all using ( 
    exists (select 1 from profiles where id = auth.uid() and role = 'admin') 
  );
