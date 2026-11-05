-- ==============================================================================
-- Schema: Acompanhamento de Presença nas Reuniões Mensais da SEMADEJ
-- ==============================================================================

-- 1. Tabela de Sessões de Reunião (Primeiro Domingo do Mês)
create table if not exists meeting_sessions (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  meeting_date date not null unique,
  status text not null default 'open' check (status in ('scheduled', 'open', 'closed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Tabela de Presenças e Justificativas dos Agentes/Congregações
create table if not exists meeting_attendances (
  id uuid primary key default uuid_generate_v4(),
  meeting_id uuid references meeting_sessions(id) on delete cascade not null,
  congregation_id uuid references congregations(id) on delete cascade not null,
  agent_id uuid references profiles(id) on delete set null,
  agent_name text not null,
  agent_phone text,
  status text not null default 'present' check (status in ('present', 'justified', 'absent')),
  justification_reason text,
  checkin_type text not null default 'self_service' check (checkin_type in ('self_service', 'manual_admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_meeting_congregation_agent unique (meeting_id, congregation_id, agent_name)
);

-- Índices de consulta para performance em tempo real
create index if not exists idx_meeting_sessions_date on meeting_sessions(meeting_date);
create index if not exists idx_meeting_attendances_meeting on meeting_attendances(meeting_id);
create index if not exists idx_meeting_attendances_congregation on meeting_attendances(congregation_id);

-- Habilitar RLS
alter table meeting_sessions enable row level security;
alter table meeting_attendances enable row level security;

-- Políticas para meeting_sessions
drop policy if exists "Permitir leitura pública de reuniões" on meeting_sessions;
create policy "Permitir leitura pública de reuniões"
  on meeting_sessions for select
  using (true);

drop policy if exists "Permitir gerenciamento de reuniões por administradores" on meeting_sessions;
create policy "Permitir gerenciamento de reuniões por administradores"
  on meeting_sessions for all
  using (true);

-- Políticas para meeting_attendances
drop policy if exists "Permitir leitura pública de presenças" on meeting_attendances;
create policy "Permitir leitura pública de presenças"
  on meeting_attendances for select
  using (true);

drop policy if exists "Permitir registro e atualização de presenças" on meeting_attendances;
create policy "Permitir registro e atualização de presenças"
  on meeting_attendances for all
  using (true);

