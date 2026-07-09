# SEMADEJ-Hub - Design System & UI Guide

Este documento estabelece as diretrizes de design, cores, tipografia e componentes para manter a consistência e o profissionalismo visual em todas as telas do **SEMADEJ-Hub**.

---

## 🎨 1. Paleta de Cores e Variáveis Globais

Utilizamos um sistema de variáveis CSS baseadas nos estilos do Next.js e Tailwind, configuradas no arquivo global do sistema.

| Categoria | Variável | Cor Real | Aplicação |
| :--- | :--- | :--- | :--- |
| **Primary** | `var(--primary)` | `#0f172a` (Slate 900) | Títulos principais, botões primários |
| **Secondary** | `var(--secondary)` | `#f1f5f9` (Slate 100) | Fundos secundários, botões alternativos |
| **Accent** | `var(--accent)` | `#2563eb` (Blue 600) | Links importantes, indicadores ativos |
| **Success** | `var(--success)` | `#10b981` (Emerald 500) | Integrações concluídas, status positivo |
| **Destructive**| `var(--destructive)` | `#ef4444` (Red 500) | Alertas de atraso crítico, ações de exclusão |
| **Warning** | `var(--warning)` | `#f59e0b` (Amber 500) | Alertas de atenção, pendências médias |
| **Muted** | `var(--muted)` | `#f8fafc` (Slate 50) | Fundo de cards, campos desabilitados |
| **Borders** | `var(--border)` | `#e2e8f0` (Slate 200) | Divisórias e bordas de inputs |

---

## 📱 2. Tipografia

*   **Fonte Principal:** `Plus Jakarta Sans` ou `Inter` (Sans-serif)
*   **Fonte de Títulos:** `Outfit` (Visual premium e corporativo)
*   **Escalas:**
    *   Títulos de Página: `1.75rem` (Bold / 800)
    *   Títulos de Cards: `1.1rem` a `1.2rem` (Extra Bold / 800)
    *   Textos de Metadados: `0.75rem` a `0.8rem` (Semi Bold / 600)
    *   Textos de Botões: `0.8rem` a `0.85rem` (Bold / 700)

---

## 🟢 3. Padronização do Botão do WhatsApp (`.whatsappBtn`)

Para garantir uma interface profissional e consistente, o botão de contato via WhatsApp deve seguir a mesma assinatura visual em **todas** as telas do sistema.

### Especificações CSS Padronizadas:
```css
.whatsappBtn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
    color: white !important;
    border: none;
    border-radius: var(--radius, 8px);
    text-decoration: none;
    font-weight: 700;
    font-size: 0.85rem;
    box-shadow: 0 4px 6px -1px rgba(37, 211, 102, 0.15), 0 2px 4px -1px rgba(37, 211, 102, 0.1);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
}

.whatsappBtn:hover {
    opacity: 0.95;
    transform: translateY(-1px);
    box-shadow: 0 10px 15px -3px rgba(37, 211, 102, 0.25), 0 4px 6px -2px rgba(37, 211, 102, 0.15);
}

.whatsappBtn:active {
    transform: translateY(0);
    box-shadow: 0 4px 6px -1px rgba(37, 211, 102, 0.15);
}

.whatsappBtn.disabled {
    background: #e2e8f0;
    color: #94a3b8 !important;
    box-shadow: none;
    cursor: not-allowed;
    pointer-events: none;
}
```

### Componente React (Padrão):
```tsx
import { MessageCircle } from 'lucide-react';

<a
    href={getWhatsAppLink(phone)}
    target="_blank"
    rel="noopener noreferrer"
    className={styles.whatsappBtn}
>
    <MessageCircle size={16} /> Falar no WhatsApp
</a>
```

---

## 🎛️ 4. Formulários e Inputs

Todos os `<input>`, `<select>` e `<textarea>` devem compartilhar do mesmo estilo premium de foco e bordas arredondadas.

```css
.input, .select, .textarea {
    width: 100%;
    padding: 0.625rem;
    border-radius: var(--radius, 8px);
    border: 1px solid var(--border);
    background: white;
    font-size: 16px; /* Evita zoom automático em dispositivos iOS */
    color: var(--foreground);
    outline: none;
    transition: border-color 0.2s;
}

.input:focus, .select:focus, .textarea:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.05);
}
```

---

## 🪪 5. Cabeçalhos de Cards e Metadados (`.metaRow`)

Para evitar cortes em textos informativos e badges dentro dos cards, use sempre um container flex-wrap:

```tsx
<div className={styles.metaRow}>
    <span className={styles.congregationBadge}>
        <Users size={12} />
        {congregationName}
    </span>
    <span className={styles.dateBadge}>
        <Calendar size={12} />
        Decisão em {date}
    </span>
</div>
```

```css
.metaRow {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.35rem;
}
```

---

## 🖲️ 6. Botões de Ação Comuns

Diferenciamos os botões por finalidade para hierarquizar a ação do usuário de forma clara.

```css
/* 1. Botão Primário (Solid slate/blue) */
.btnPrimary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    background-color: var(--primary);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 700;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s;
}
.btnPrimary:hover {
    opacity: 0.9;
    transform: translateY(-1px);
}

/* 2. Botão Secundário (Outline ou Muted Slate) */
.btnSecondary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    background-color: transparent;
    border: 1px solid var(--border);
    color: var(--primary);
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s;
}
.btnSecondary:hover {
    background-color: var(--secondary);
}

/* 3. Botão Premium / Glassmorphic (Estilo "Atualizar Ficha") */
.btnPremium {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.625rem 1.25rem;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    font-weight: 700;
    font-size: 0.85rem;
    box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.15);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
}
.btnPremium:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.25);
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
}
```

---

## 🏷️ 7. Badges de Status e Severidade

Badges pequenos para rotular o estado de convertidos, turmas, permissões de usuários ou prazos.

```css
.badge {
    font-size: 0.75rem;
    font-weight: 700;
    padding: 0.35rem 0.75rem;
    border-radius: 9999px;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    border: 1px solid transparent;
}

/* Status: Sucesso / Concluído (Verde) */
.badgeSuccess {
    background-color: rgba(16, 185, 129, 0.08);
    color: var(--success);
    border-color: rgba(16, 185, 129, 0.15);
}

/* Status: Atenção / Pendência Média (Laranja) */
.badgeWarning {
    background-color: rgba(245, 158, 11, 0.08);
    color: var(--warning);
    border-color: rgba(245, 158, 11, 0.15);
}

/* Status: Crítico / Sem Alocação (Vermelho) */
.badgeDestructive {
    background-color: rgba(239, 68, 68, 0.08);
    color: var(--destructive);
    border-color: rgba(239, 68, 68, 0.15);
}

/* Status: Informativo / Neutro (Azul/Slate) */
.badgeInfo {
    background-color: rgba(59, 130, 246, 0.08);
    color: var(--accent);
    border-color: rgba(59, 130, 246, 0.15);
}
```

---

## 🪟 8. Modais e Diálogos de Confirmação

Para garantir foco absoluto nas ações de modais, usamos sobreposição translúcida com desfoque de fundo (Relação Figura/Fundo).

```tsx
<div className={styles.modalOverlay}>
    <div className={styles.modal}>
        <h3>Confirmar Ação</h3>
        <p>Você tem certeza de que deseja realizar esta operação?</p>
        <div className={styles.modalActions}>
            <button className={styles.btnSecondary} onClick={onClose}>Cancelar</button>
            <button className={styles.btnPrimary} onClick={onConfirm}>Confirmar</button>
        </div>
    </div>
</div>
```

```css
.modalOverlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(15, 23, 42, 0.4);
    backdrop-filter: blur(4px); /* Suave desfoque de fundo */
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.2s ease-out;
}

.modal {
    background: white;
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.75rem;
    max-width: 480px;
    width: 90%;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    animation: scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.modalActions {
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    margin-top: 1.5rem;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
@keyframes scaleUp {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
}
```

---

## 📊 9. Tabelas de Dados (`.dataTable`)

As tabelas de relatórios e de voluntários devem ser limpas, espaçosas e interativas ao passar o mouse.

```css
.tableContainer {
    width: 100%;
    overflow-x: auto; /* Garante rolagem em celulares */
    border: 1px solid var(--border);
    border-radius: 8px;
    background: white;
}

.table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
}

.table th {
    background-color: var(--muted);
    padding: 0.75rem 1rem;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--muted-foreground);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid var(--border);
}

.table td {
    padding: 1rem;
    font-size: 0.875rem;
    border-bottom: 1px solid var(--border);
    color: var(--foreground);
    transition: background-color 0.15s;
}

/* Zebra Striping (Linhas alternadas) */
.table tr:nth-child(even) td {
    background-color: rgba(248, 250, 252, 0.4);
}

/* Interação visual no hover da linha */
.table tr:hover td {
    background-color: rgba(241, 245, 249, 0.6);
}
```

---

## 🕳️ 10. Telas de Estado Vazio (`.emptyState`)

Sempre forneça contexto amigável caso não existam dados a serem exibidos.

```tsx
<div className={styles.emptyState}>
    <FolderOpen size={48} className={styles.emptyIcon} />
    <h3>Nenhum registro encontrado</h3>
    <p>Experimente alterar os filtros de busca ou aguarde novos dados.</p>
</div>
```

```css
.emptyState {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 3.5rem 1.5rem;
    background: var(--card);
    border: 1px dashed var(--border);
    border-radius: 12px;
    margin: 2rem 0;
}

.emptyIcon {
    color: var(--muted-foreground);
    opacity: 0.4;
    margin-bottom: 1rem;
}

.emptyState h3 {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--foreground);
    margin-bottom: 0.25rem;
}

.emptyState p {
    font-size: 0.875rem;
    color: var(--muted-foreground);
    max-width: 320px;
    margin: 0;
}
```
