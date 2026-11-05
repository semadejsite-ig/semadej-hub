# Plano de Migração: Design System Genesis — SEMADEJ Online

Este documento registra a estratégia e o progresso da migração visual do Espaço do Agente (rotas `/dashboard/*`) para a especificação **Genesis** (`genesis-DESIGN.md`).

---

## 🎯 Escopo & Decisões
- **Escopo**: Restrito às páginas internas do painel (`/dashboard` e todos os seus submódulos). Telas públicas de login/cadastro permanecem como estão nesta etapa.
- **Branding**: Transição planejada do nome de **SEMADEJ Hub** para **SEMADEJ Online** (maior acessibilidade e familiaridade para membros e voluntários).
- **Branch**: Trabalho e validação direta na branch ativa junto com o usuário.
- **Identidade Genesis**:
  - Primária: Indigo `#6366F1` (hover `#4F46E5`)
  - Secundária de marca: `#20970B`
  - Fundo: `#FAFAFA` | Superfície: `#FFFFFF`
  - Textos: `#0A0A0A` (Principal) | `#6B6B6B` (Secundário)
  - Bordas: `#E8E8EC`
  - Tipografia: General Sans (Display / Títulos) + DM Sans (Corpo / UI) + JetBrains Mono (Código / Números)
  - Raio de Borda: 6px para botões/inputs, 12px para cards, 4px para tags/badges, 9999px para pills

---

## 📅 Fases de Execução

- [x] **Fase 0: Planejamento & Alinhamento Socrático** (Concluído)
- [x] **Fase 1: Fundação, Tipografia & Primitivos de UI** (Concluído)
  - [x] Fontes configuradas (`General Sans` via Fontshare CDN, `DM Sans` e `JetBrains Mono` via `next/font/google`)
  - [x] Mapeamento dos design tokens Genesis em `app/globals.css` escopados pela classe `.genesisTheme`
  - [x] Atualização de componentes primitivos (`Button`, `Input`) com raio de 6px, foco indigo e sombras táteis
- [x] **Fase 2: Shell do Dashboard (Layout & Sidebar)** (Concluído)
  - [x] Atualizado `app/dashboard/layout.tsx` e `app/dashboard/layout.module.css`
  - [x] Nova assinatura "SEMADEJ Online" na sidebar e no cabeçalho mobile
  - [x] Itens de navegação refinados com indicador ativo em Indigo Genesis (`#6366F1`)
  - [x] Divisores e seções com escala de 11px/12px e bordas `#E8E8EC`
- [x] **Fase 3: Piloto da Página Principal (`/dashboard`)** (Concluído)
  - [x] Header editorial limpo em superfície branca com raio de 12px e tipografia General Sans
  - [x] Cards de métricas (`12px` radius, hover lift de `-2px`, sombra difusa de 30px e bordas `#E8E8EC`)
  - [x] Gráficos de barras harmonizados com Indigo Primário (`#6366F1`) e Verde Secundário (`#20970B`)
- [ ] **Fase 4: Expansão Modular para Subpáginas**
  - [ ] Presença (`/dashboard/presenca`)
  - [ ] Fundo Operacional (`/dashboard/fundo-operacional`)
  - [ ] Pontos de Pregação (`/dashboard/pontos`)
  - [ ] Relatórios (`/dashboard/report`), Tesouraria (`/dashboard/treasury`) e demais submódulos
