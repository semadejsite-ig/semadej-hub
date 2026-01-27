-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Table: Congregations (84 locations)
create table congregations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  sector text,
  region text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: Registrations (Public Pre-enrollment for PAM/LIBRAS)
create table registrations (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  email text,
  phone text not null,
  course_type text not null check (course_type in ('PAM', 'LIBRAS')),
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: Profiles (Extends Supabase Auth for Agents)
-- This table should be linked to auth.users via triggers normally, 
-- but for simplicity we define the structure here.
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text default 'agent' check (role in ('agent', 'coordinator', 'admin')),
  congregation_id uuid references congregations(id),
  is_first_agent boolean default false, -- Agent 1
  is_second_agent boolean default false, -- Agent 2
  phone text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: Monthly Reports (Relatórios Mensais)
create table monthly_reports (
  id uuid primary key default uuid_generate_v4(),
  agent_id uuid references profiles(id) not null,
  congregation_id uuid references congregations(id) not null,
  report_month integer not null check (report_month between 1 and 12),
  report_year integer not null,
  offering_value decimal(10, 2) default 0.00,
  people_baptized integer default 0,
  observations text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table: Vacancies (For Turnover Management)
create table vacancies (
  id uuid primary key default uuid_generate_v4(),
  congregation_id uuid references congregations(id) not null,
  position_type text not null check (position_type in ('first_agent', 'second_agent')),
  status text default 'open' check (status in ('open', 'filled', 'urgent')),
  open_date timestamp with time zone default timezone('utc'::text, now()) not null,
  filled_date timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Security Policies (RLS) - Basic Setup (To be refined)
alter table registrations enable row level security;
alter table congregations enable row level security;
alter table profiles enable row level security;
alter table monthly_reports enable row level security;
alter table vacancies enable row level security;

-- Policies
-- Registrations: Public insert, Admin view
create policy "Public can insert registrations" on registrations for insert with check (true);
create policy "Admins can view registrations" on registrations for select using (auth.uid() in (select id from profiles where role = 'admin'));

-- Congregations: Public read (for selection)
create policy "Public can view congregations" on congregations for select using (true);

-- Monthly Reports: Agents can insert, Admins view
create policy "Agents can insert reports" on monthly_reports for insert with check (auth.uid() = agent_id);
create policy "Agents can view own reports" on monthly_reports for select using (auth.uid() = agent_id);
