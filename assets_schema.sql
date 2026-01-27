-- Asset Management Schema

-- 1. ASSETS TABLE
create table assets (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  code text unique, -- Patrimonio/Serial code
  category text, -- 'Flag', 'Eletronics', 'Toys', 'Furniture'
  description text,
  status text default 'available' check (status in ('available', 'loaned', 'maintenance', 'lost')),
  condition text default 'good' check (condition in ('new', 'good', 'fair', 'poor', 'broken')),
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. ASSET LOANS TABLE (The Log)
create table asset_loans (
  id uuid primary key default uuid_generate_v4(),
  asset_id uuid references assets(id) not null,
  agent_id uuid references profiles(id) not null, -- Who borrowed it
  loan_date timestamp with time zone default timezone('utc'::text, now()) not null,
  expected_return_date timestamp with time zone,
  return_date timestamp with time zone, -- If null, it's active
  status text default 'active' check (status in ('active', 'returned', 'overdue')),
  notes text,
  created_by uuid references profiles(id), -- Admin who authorized it
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. RLS POLICIES
alter table assets enable row level security;
alter table asset_loans enable row level security;

-- Admins: Full Access
create policy "Admins can manage assets" on assets for all using (auth.uid() in (select id from profiles where role = 'admin'));
create policy "Admins can manage loans" on asset_loans for all using (auth.uid() in (select id from profiles where role = 'admin'));

-- Others: No Access (Implicit deny, as per requirement "Admin Only")

-- 4. TRIGGER to update Asset Status on Loan/Return
-- Function to handle status changes
create or replace function handle_asset_loan_status() returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    -- When loan created, asset becomes 'loaned'
    update assets set status = 'loaned' where id = new.asset_id;
  elsif (TG_OP = 'UPDATE') then
    -- When returned (return_date set), asset becomes 'available'
    if (new.return_date is not null and old.return_date is null) then
      update assets set status = 'available' where id = new.asset_id;
      new.status = 'returned';
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger
create trigger on_asset_loan_change
  after insert or update on asset_loans
  for each row execute procedure handle_asset_loan_status();
