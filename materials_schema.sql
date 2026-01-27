-- Material Requests Schema

-- 1. MATERIAL REQUESTS TABLE
create table material_requests (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references profiles(id) not null default auth.uid(),
  item_type text not null, -- 'Folhetos', 'Envelopes', 'Bíblias', 'Outros'
  quantity integer not null check (quantity > 0),
  desired_date date not null, -- Must be >= 30 days from created_at (enforced in UI, trusted in backend for now or via trigger if strict)
  reason text, -- Optional justification
  status text default 'pending' check (status in ('pending', 'approved', 'delivered', 'rejected')),
  admin_notes text, -- For admin feedback
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. RLS POLICIES
alter table material_requests enable row level security;

-- Policy: Who can CREATE requests?
-- Allowed: admin, agent, sector_agent, pastor, sector_pastor
-- Excluded: coordinator
create policy "Allowed roles can create requests" on material_requests
  for insert with check (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role in ('admin', 'agent', 'sector_agent', 'pastor', 'sector_pastor')
    )
  );

-- Policy: Who can VIEW requests?
-- Admins: View ALL
-- Others: View OWN
create policy "Admins view all requests" on material_requests
  for select using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

create policy "Users view own requests" on material_requests
  for select using (
    auth.uid() = user_id
  );

-- Policy: Who can UPDATE requests?
-- Admins: Can update everything (Status, Notes)
-- Users: Can update own if pending? (Let's stick to Admin only for status updates for simplicity initially, maybe user can edit details if pending)
create policy "Admins can update requests" on material_requests
  for update using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role = 'admin'
    )
  );

-- 3. INDEXES
create index material_requests_user_id_idx on material_requests(user_id);
create index material_requests_status_idx on material_requests(status);
