-- Database Migration: Novos Convertidos (Fichas de Decisão) e Acompanhamento
-- Execute este script no Supabase SQL Editor.

-- 1. Atualizar a Role de perfis para aceitar 'volunteer'
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check 
  check (role in ('agent', 'coordinator', 'pastor', 'admin', 'sector_agent', 'sector_pastor', 'treasurer', 'volunteer'));

-- 2. Adicionar o campo do Telegram nas congregações
alter table congregations add column if not exists telegram_chat_id text;

-- 3. Criar a tabela de Novos Convertidos (new_converts)
drop table if exists new_converts cascade;
create table if not exists new_converts (
  id uuid primary key default uuid_generate_v4(),
  congregation_id uuid references congregations(id) on delete cascade not null,
  full_name text not null,
  
  -- Contatos
  phone text not null, -- Celular (WhatsApp)
  phone_home text, -- Fone fixo
  email text,
  
  -- Perfil
  gender text check (gender in ('M', 'F')),
  marital_status text,
  birth_date date,
  
  -- Endereço
  address text,
  neighborhood text,
  reference_point text,
  city text,
  state text,
  
  -- Detalhes da Decisão
  decision_location text, -- Igreja, Residência, Vias Públicas, Outros
  decision_date date not null default current_date,
  first_decision boolean, -- true (sim), false (não - desviado)
  invited_by text,
  time_away text, -- Há quanto tempo estava afastado
  wants_visitation boolean default false,
  registered_by text, -- Anotado por
  
  -- Acompanhamento (Preenchido pelo Voluntário)
  first_contact_date date,
  first_contact_by text,
  first_visit_date date,
  first_visit_by text,
  discipleship_start_date date,
  discipleship_by text,
  current_situation text, -- permanência, desistência, transferência para...
  
  -- Controle de Fluxo
  notes text, -- Observações adicionais
  status text default 'pending' check (status in ('pending', 'in_progress', 'integrated', 'inactive')),
  volunteer_id uuid references profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Habilitar RLS (Row Level Security) na tabela new_converts
alter table new_converts enable row level security;

-- 5. Criar Políticas RLS
drop policy if exists "Public can insert decisions" on new_converts;
drop policy if exists "View Decisions Policy" on new_converts;
drop policy if exists "Update Decisions Policy" on new_converts;

-- 5.1 Permissão pública para inserção (o formulário público não requer login)
create policy "Public can insert decisions" on new_converts
  for insert
  with check (true);

-- 5.2 Permissão de visualização filtrada por papel
create policy "View Decisions Policy" on new_converts
  for select
  using (
    -- Admins têm acesso total
    exists (
      select 1 from profiles 
      where id = auth.uid() 
      and role = 'admin'
    )
    OR
    -- Agente Missionário ou Pastor Local vê da sua congregação
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role in ('agent', 'pastor')
      and p.congregation_id = new_converts.congregation_id
    )
    OR
    -- Agentes Setoriais ou Pastores Setoriais veem de congregações do mesmo setor
    exists (
      select 1 from get_my_claim() my
      join congregations target_cong on target_cong.id = new_converts.congregation_id
      where my.role in ('sector_agent', 'sector_pastor')
      and my.sector = target_cong.sector
    )
    OR
    -- Voluntário vê apenas as que está ativamente acompanhando
    volunteer_id = auth.uid()
  );

-- 5.3 Permissão de atualização
create policy "Update Decisions Policy" on new_converts
  for update
  using (
    -- Admins têm acesso total
    exists (
      select 1 from profiles 
      where id = auth.uid() 
      and role = 'admin'
    )
    OR
    -- Agente Missionário ou Pastor Local pode atualizar (ex: para designar voluntário)
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role in ('agent', 'pastor')
      and p.congregation_id = new_converts.congregation_id
    )
    OR
    -- Agentes Setoriais ou Pastores Setoriais podem atualizar congregações do seu setor
    exists (
      select 1 from get_my_claim() my
      join congregations target_cong on target_cong.id = new_converts.congregation_id
      where my.role in ('sector_agent', 'sector_pastor')
      and my.sector = target_cong.sector
    )
    OR
    -- Voluntário pode atualizar status/notas de quem ele está acompanhando
    volunteer_id = auth.uid()
  );
