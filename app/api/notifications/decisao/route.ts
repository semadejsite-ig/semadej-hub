import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase/client';

export async function POST(request: Request) {
    try {
        const { congregationId, congregationName, fullName, phone, notes } = await request.json();

        // 1. Fetch congregation telegram chat ID
        // Note: Using client side supabase here is fine, but in Next.js backend, 
        // to bypass RLS for reading congregations' telegram_chat_id, 
        // we can fetch it (it's authenticated or we can fetch it directly).
        const { data: congregation, error: dbError } = await supabase
            .from('congregations')
            .select('telegram_chat_id')
            .eq('id', congregationId)
            .single();

        if (dbError) {
            console.error('Error fetching congregation chat ID:', dbError);
        }

        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        // Fallback to global chat ID if congregation specific is not set
        const chatId = congregation?.telegram_chat_id || process.env.TELEGRAM_CHAT_ID;

        if (!botToken || !chatId) {
            console.warn('Telegram credentials missing, skipping notification. Chat ID:', chatId);
            return NextResponse.json({ success: false, message: 'Configuração do Telegram ausente.' });
        }

        const escapeHtml = (text: string) => {
            return text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        };

        const message = `
<b>🆕 Nova Decisão de Fé!</b>

<b>📌 Congregação:</b> ${escapeHtml(congregationName || 'Não especificada')}
<b>👤 Nome:</b> ${escapeHtml(fullName)}
<b>📞 Contato:</b> ${escapeHtml(phone)}

<b>💭 Observações:</b>
${escapeHtml(notes || 'Nenhuma observação informada')}

---
<i>Ficha de Decisão enviada pelo portal SEMADEJ</i>
`.trim();

        const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

        const response = await fetch(telegramUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML',
            }),
        });

        const data = await response.json();

        if (!data.ok) {
            console.error('Telegram API error:', data);
            return NextResponse.json({ error: 'Erro ao enviar para o Telegram' }, { status: 502 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Telegram notification error:', error);
        return NextResponse.json({ error: 'Erro interno ao processar notificação' }, { status: 500 });
    }
}
