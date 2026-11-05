# Plano de Implementação: Acompanhamento de Presença dos Agentes Missionários

> **Task Slug:** `presenca-agentes`  
> **Objetivo:** Registro ágil de presença e justificativas nas reuniões mensais (1º domingo), com painel ao vivo por setor para monitoramento e cobrança em tempo real.

---

## 🎯 Escopo Alinhado (Decisões Tomadas)

1. **Auto Check-in Rápido (Sem Senha):** Página pública `/presenca` onde o agente seleciona Setor > Congregação > Agente (ou valida por WhatsApp) e marca com 1 clique (Presença ou Justificativa).
2. **Alerta de Congregação Descoberta:** Se a congregação não possuir agente cadastrado no sistema, exibe um alerta visual claro na tela de seleção.
3. **Janela de Justificativa:** Aberta de 7 dias antes até 7 dias após a data da reunião oficial.
4. **Resgate Manual:** Coordenação pode marcar ou justificar presença diretamente na lista administrativa no dia do evento.
5. **Painel ao Vivo por Setor:** Tabela em tempo real agrupada por setor, com status visual (`Presente`, `Justificado`, `Pendente/Ausente`) e botão de ação rápida via WhatsApp para cobrar os agentes faltantes.

---

## 🏗️ Arquitetura e Modelagem de Dados

### 1. Novas Tabelas (Supabase SQL)

- **`meeting_sessions` (Sessões de Reunião Mensal):**
  - `id` (uuid, PK)
  - `meeting_date` (date, ex: `2026-11-01`)
  - `title` (text, ex: `Reunião Mensal - Novembro/2026`)
  - `status` (text: `scheduled`, `open`, `closed`)
  - `created_at` (timestamptz)

- **`meeting_attendances` (Registros de Presença / Justificativas):**
  - `id` (uuid, PK)
  - `meeting_id` (uuid, FK `meeting_sessions.id`)
  - `congregation_id` (uuid, FK `congregations.id`)
  - `agent_id` (uuid, nullable, FK `profiles.id`)
  - `status` (text: `present`, `justified`, `absent`)
  - `justification_reason` (text, nullable)
  - `checkin_type` (text: `self_service`, `manual_admin`)
  - `checked_in_at` (timestamptz)

---

## 📋 Lista de Tarefas (Ordem de Execução)

### Fase 1: Banco de Dados & Políticas RLS
- [x] **Tarefa 1: Script SQL da Estrutura**
  - Criar `meeting_attendance_schema.sql` com tabelas `meeting_sessions` e `meeting_attendances`.
  - Configurar permissões RLS (leitura/escrita anônima para check-in com restrição de data + controle total para admin/coordenador).
  - *Critério de Verificação:* Execução do SQL no Supabase sem erros de FK ou RLS.

### Fase 2: Check-in Rápido Público (`/presenca`)
- [x] **Tarefa 2: Interface de Auto Check-in & Justificativa**
  - Criar página `app/presenca/page.tsx` e `app/presenca/page.module.css`.
  - Fluxo: Selecionar Setor > Congregação > Agente (ou exibir aviso de congregação sem agente).
  - Ações: Botão "Confirmar Presença" e Botão "Enviar Justificativa" (com campo de texto simples para o motivo).
  - Validação de prazo: Bloquear se fora da janela de 7 dias antes/depois.
  - *Critério de Verificação:* Testar envio de presença e justificativa pelo navegador sem login.

### Fase 3: Painel Administrativo ao Vivo no Dashboard (`/dashboard/presenca`)
- [x] **Tarefa 3: Painel em Tempo Real por Setor**
  - Criar `app/dashboard/presenca/page.tsx` integrado ao layout existente do Dashboard.
  - Agrupamento em colunas/cards por Setor com métricas de presença (ex: `Setor 1: 8/10 presentes`).
  - Lista de congregações com status colorido (🟢 Presente, 🟡 Justificado, 🔴 Pendente).
  - Botão WhatsApp padronizado (`.whatsappBtn` do `DESIGN_SYSTEM.md`) para cobrar o agente ou líder setorial com mensagem pré-formatada.
  - *Critério de Verificação:* Mudança de status na tela `/presenca` refletir instantaneamente ou via refresh simples no painel.

### Fase 4: Integração no Menu & Resgate Manual
- [x] **Tarefa 4: Alternância Manual (Resgate) e Link no Menu**
  - Adicionar atalho "Presença nas Reuniões" no menu do Dashboard (`app/dashboard/layout.tsx`).
  - Permitir que o coordenador clique em qualquer congregação na tabela e altere o status manualmente ("Marcar Presente" ou "Registrar Falta").
  - *Critério de Verificação:* Coordenador conseguir marcar presença manual para agentes sem smartphone.

---

## 🔍 Scripts de Qualidade e Validação
- `python .agent/skills/lint-and-validate/scripts/lint_runner.py` (ou `npm run lint`)
- `python .agent/skills/frontend-design/scripts/ux_audit.py`

