# Plan: Redesign do Topo e Métricas do /dashboard

> **Objetivo:** Modernizar a seção superior do Dashboard (/dashboard), removendo excessos visuais (efeito template genérico/glow azul), unificando os 4 KPIs principais em grade harmoniosa (com grid 2x2 no mobile) e transformando a "Congregação Destaque" em um banner elegante e condicional.

---

## 1. Contexto & Diagnóstico
- **Header:** Atualmente possui gradiente azul elétrico com padrão de bolinhas SVG e sombra difusa pesada, além de empilhar de forma espaçosa no mobile.
- **Destaque do Mês:** Atualmente ocupa 2/3 da linha em um bloco escuro enorme, mesmo quando está vazio (`---`).
- **Vidas Alcançadas:** Atualmente isolado em um card branco ao lado do destaque, desalinhado das demais métricas financeiras e de membros.
- **Mobile UX:** 5 cartões empilhados verticalmente de forma desnecessária, gerando rolagem excessiva.

---

## 2. Solução Arquitetural & Design
1. **Header Refinado:**
   - Visual limpo, tipografia refinada e badge de escopo (Global/Setor) integrada com elegância.
   - Responsividade compacta para mobile.
2. **Banner Destaque do Mês (Condicional / Elegante):**
   - Se houver destaque: Banner horizontal com ícone dourado sutil, nome da congregação e dados de alcance.
   - Se não houver destaque: Exibição compacta e discreta, sem devorar a área nobre da tela.
3. **Grid Unificado de KPIs (Desktop 4 colunas / Mobile 2x2):**
   - 4 métricas essenciais alinhadas:
     1. **Arrecadação Total** (Moeda / Banknote)
     2. **Vidas Alcançadas** (Alvo / Target)
     3. **Total de Membros** (Pessoas / Users)
     4. **Carnês Ativos** (Prédio / Building2 + Taxa de Adesão)
   - Padronização de tamanhos de fonte, ícones em caixas semânticas, bordas com `var(--border)` e raios com `var(--radius)`.

---

## 3. Tarefas de Implementação
- [x] Atualizar [app/dashboard/page.module.css](file:///c:/Users/wilkinson/Desktop/semadej-hub/app/dashboard/page.module.css) com os novos estilos de Header, Banner de Destaque, Grid 4 colunas desktop e 2x2 mobile.
- [x] Atualizar o JSX em [app/dashboard/page.tsx](file:///c:/Users/wilkinson/Desktop/semadej-hub/app/dashboard/page.tsx), removendo estilos inline e reestruturando os componentes de topo.
- [x] Executar validações de sintaxe e testes de responsividade/lint (TypeScript: 0 erros).
