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
