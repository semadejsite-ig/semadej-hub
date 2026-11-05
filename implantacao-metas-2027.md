# PRD & Plano de Implementação: Metas Estratégicas SEMADEJ 2027

> **Task Slug:** `implantacao-metas-2027`  
> **Papel:** Product Owner (`@[product-owner]`) + Brainstorming (`@[brainstorming]`)  
> **Objetivo:** Implementar o MVP integrado que atende às diretrizes apresentadas na Reunião de Agentes Missionários de Novembro/2026:
> 1. **Expansão Territorial:** Mapeamento e Validação dos Pontos de Pregação (Meta: 4 no 1º Tri / 84 no ciclo).
> 2. **Engajamento & Presença:** Alerta das 3 Faltas Injustificadas com risco de desligamento formal.
> 3. **Sustentabilidade Operacional:** Gestão e prestação de contas do Repasse Mensal de R$ 30 por congregação via PIX.

---

## 🏛️ Pilar 1: Pontos de Pregação (Expansão Territorial)

### 1.1 Objetivo & Critérios de Negócio
- Permitir que os agentes missionários mapeiem e registrem novos pontos de pregação para suas congregações.
- **Fluxo de Governança Definido:**
  1. **Cadastro:** Agente missionário cadastra o ponto (`pending_approval`).
  2. **Validação:** Dirigente/Pastor da congregação valida o ponto (`approved` / `active`). *Obs: Administrador e Líder Setorial também possuem permissão de validação imediata.*
  3. **Escopo MVP:** Foco na localização, responsável e cumprimento da meta trimestral (sem métricas de conversão/frequência neste primeiro momento).

### 1.2 Modelagem de Dados (`preaching_points_schema.sql`)
```sql
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
  validated_by uuid references profiles(id) on delete set null,
  validated_at timestamp with time zone,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
```

### 1.3 Interfaces do Usuário
- **Rota `/dashboard/pontos`:**
  - Card de Metas da Região (ex: Meta Q1: 4 novos pontos mapeados).
  - Formulário modal: Nome do Ponto, Endereço/Bairro, Responsável, Telefone, Trimestre.
  - Tabela/Cards com badges de status (`🟡 Aguardando Validação`, `🟢 Homologado pelo Pastor`, `🔵 Ativo`).
  - Botão de validação com 1 clique (para Pastor, Líder Setorial e Admin).

---

## ⚠️ Pilar 2: Alerta das 3 Faltas (Presença & Desligamento)

### 2.1 Regra de Negócio
- A presença é apurada nas reuniões mensais oficiais (1º domingo).
- **Escala de Risco:**
  - `0 Faltas:` 🟢 Regular
  - `1 Falta Injustificada:` 🟡 Atenção
  - `2 Faltas Consecutivas:` 🟠 Alerta Crítico (Notificação preventiva ao Líder Setorial)
  - `3 Faltas Consecutivas Sem Justificativa:` 🔴 **Desligamento Formal Recomendado**

### 2.2 Implementação no Painel `/dashboard/presenca`
- Consulta analítica que avalia o histórico das últimas 3 sessões fechadas para cada congregação/agente.
- Aba de destaque: **"Gestão de Compromisso / Faltas Consecutivas"**.
- Ações rápidas via WhatsApp com templates prontos:
  - Mensagem de Alerta (2 faltas) para o Pastor Local / Dirigente.
  - Notificação de Desligamento/Substituição (3 faltas) para a Diretoria Executiva.

---

## 💰 Pilar 3: Sustentabilidade Operacional (R$ 30 / Mês por Congregação)

### 3.1 Objetivo & Critérios de Negócio
- Garantir a infraestrutura operacional da secretaria (impressão de fichas, materiais de treinamento nos polos e suporte logístico).
- Chave PIX oficial centralizada: `missoesadbelemsjc@gmail.com`.
- Valor fixo: **R$ 30,00 mensais** por congregação (totalizando R$ 2.520/mês para 84 congregações).

### 3.2 Modelagem de Dados (`operational_fund_schema.sql`)
```sql
create table if not exists operational_fund_payments (
  id uuid primary key default uuid_generate_v4(),
  congregation_id uuid references congregations(id) on delete cascade not null,
  payment_month integer not null check (payment_month between 1 and 12),
  payment_year integer not null,
  amount numeric(10,2) not null default 30.00,
  status text not null default 'pending' check (status in ('pending', 'paid', 'confirmed')),
  receipt_url text,
  paid_at timestamp with time zone,
  confirmed_by uuid references profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_congregation_month_year unique (congregation_id, payment_month, payment_year)
);
```

### 3.3 Interfaces do Usuário
- **Visão do Agente (`/dashboard/congregation` ou aba no `/dashboard/report`):**
  - Card informativo do Fundo Operacional com botão "Copiar Chave PIX" e QR Code.
  - Botão "Informar Pagamento do Mês" (com ou sem upload de comprovante).
- **Visão da Tesouraria / Coordenação (`/dashboard/treasury/fundo`):**
  - Matriz visual: 84 congregações nas linhas × 12 meses nas colunas.
  - Indicadores em tempo real: `% de Adesão das 84 congregações`, `Total Arrecadado no Mês` e botão WhatsApp para solicitar repasse pendente ao pastor local.

---

## 📋 Plano de Execução em Fases

### Fase 1: Banco de Dados & Scripts SQL (Backend)
- [x] Criar `preaching_points_schema.sql` (tabela de pontos + RLS + índices).
- [x] Criar `operational_fund_schema.sql` (tabela de repasse mensal de R$ 30 + RLS + índices).

### Fase 2: Módulo de Pontos de Pregação (Expansão Territorial)
- [x] Criar rota `app/dashboard/pontos/page.tsx` e `page.module.css`.
- [x] Implementar fluxo de cadastro pelo Agente (`pending_approval`).
- [x] Implementar validação pelo Dirigente/Pastor, Líder Setorial e Admin.
- [x] Incluir barra de progresso da meta trimestral (Meta Q1: 4 novos pontos rumo a 84).

### Fase 3: Monitor de Faltas & Risco de Desligamento
- [x] Atualizar `app/dashboard/presenca/page.tsx` com painel de risco de 2 e 3 faltas consecutivas.
- [x] Adicionar botão WhatsApp com mensagem de advertência e notificação formal de desligamento para o dirigente congregacional / líder setorial.

### Fase 4: Gestão do Fundo Operacional de R$ 30
- [x] Criar tela de repasse para o Agente com Chave PIX e confirmação de pagamento (`app/dashboard/fundo-operacional/page.tsx` e CSS).
- [x] Criar visão administrativa na Tesouraria com matriz anual das 84 congregações e cobrança WhatsApp.
- [x] Atualizar menu lateral em `app/dashboard/layout.tsx`.
- [x] Validar tipagem e compilação do TypeScript (0 erros).

