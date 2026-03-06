import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { name, whatsapp, request: prayerRequest, address } = await request.json();

        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (!botToken || !chatId) {
            console.error('Telegram config missing:', { botToken: !!botToken, chatId: !!chatId });
            return NextResponse.json({ error: 'Configuração do Telegram ausente' }, { status: 500 });
        }

        const escapeHtml = (text: string) => {
            return text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        };

        const message = `
<b>🙏 Novo Pedido de Oração Recebido!</b>

<b>👤 Nome:</b> ${escapeHtml(name)}
<b>📱 WhatsApp:</b> ${escapeHtml(whatsapp)}
<b>📍 Endereço/Congreg:</b> ${escapeHtml(address || 'Não informado')}

<b>💭 Pedido:</b>
${escapeHtml(prayerRequest)}

---
<i>Enviado pelo sistema SEMADEJ</i>
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
