-- ==============================================================================
-- Schema: Fundo Operacional de Apoio da Secretaria (R$ 30/mês por Congregação)
-- Sustentabilidade e Infraestrutura de Missões (84 Congregações)
-- ==============================================================================

create table if not exists operational_fund_payments (
  id uuid primary key default uuid_generate_v4(),
  congregation_id uuid references congregations(id) on delete cascade not null,
  payment_month integer not null check (payment_month between 1 and 12),
  payment_year integer not null,
  amount numeric(10,2) not null default 30.00,
  status text not null default 'pending' check (status in ('pending', 'paid', 'confirmed')),
  payment_method text not null default 'pix' check (payment_method in ('pix', 'cash', 'transfer')),
  receipt_url text,
  notes text,
  paid_at timestamp with time zone,
  confirmed_by uuid references profiles(id) on delete set null,
  confirmed_at timestamp with time zone,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_congregation_month_year unique (congregation_id, payment_month, payment_year)
);

-- Índices de consulta
create index if not exists idx_fund_congregation on operational_fund_payments(congregation_id);
create index if not exists idx_fund_month_year on operational_fund_payments(payment_month, payment_year);
create index if not exists idx_fund_status on operational_fund_payments(status);

-- RLS
alter table operational_fund_payments enable row level security;

drop policy if exists "Permitir leitura do fundo operacional" on operational_fund_payments;
create policy "Permitir leitura do fundo operacional"
  on operational_fund_payments for select
  using (true);

drop policy if exists "Permitir gerenciamento do fundo operacional" on operational_fund_payments;
create policy "Permitir gerenciamento do fundo operacional"
  on operational_fund_payments for all
  using (true);

