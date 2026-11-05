-- ==============================================================================
-- Schema: Gestão de Pontos de Pregação (Expansão Territorial SEMADEJ)
-- Meta: 4 novos pontos no 1º trimestre rumo a 84 no ciclo
-- ==============================================================================

create table if not exists preaching_points (
  id uuid primary key default uuid_generate_v4(),
  congregation_id uuid references congregations(id) on delete cascade not null,
  name text not null,
  address text not null,
  neighborhood text,
  target_quarter text default 'Q1-2027',
  responsible_name text not null,
  responsible_phone text,
  status text not null default 'pending_approval' check (status in ('pending_approval', 'approved', 'active', 'paused')),
  notes text,
  validated_by uuid references profiles(id) on delete set null,
  validated_at timestamp with time zone,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Índices de consulta
create index if not exists idx_preaching_points_congregation on preaching_points(congregation_id);
create index if not exists idx_preaching_points_status on preaching_points(status);
create index if not exists idx_preaching_points_quarter on preaching_points(target_quarter);

-- RLS
alter table preaching_points enable row level security;

drop policy if exists "Permitir leitura de pontos de pregação para todos autenticados" on preaching_points;
create policy "Permitir leitura de pontos de pregação para todos autenticados"
  on preaching_points for select
  using (true);

drop policy if exists "Permitir inserção de pontos de pregação" on preaching_points;
create policy "Permitir inserção de pontos de pregação"
  on preaching_points for insert
  with check (true);

drop policy if exists "Permitir atualização de pontos de pregação" on preaching_points;
create policy "Permitir atualização de pontos de pregação"
  on preaching_points for update
  using (true);

drop policy if exists "Permitir exclusão de pontos de pregação" on preaching_points;
create policy "Permitir exclusão de pontos de pregação"
  on preaching_points for delete
  using (true);

