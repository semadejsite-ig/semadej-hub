import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { pendingList, monthName, year } = await request.json();

        const botToken = process.env.TELEGRAM_TREASURY_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_TREASURY_CHAT_ID;

        if (!botToken || !chatId) {
            console.error('Treasury Telegram config missing:', { botToken: !!botToken, chatId: !!chatId });
            return NextResponse.json({ error: 'Configuração do Telegram de Tesouraria ausente' }, { status: 500 });
        }

        if (!pendingList || pendingList.length === 0) {
            return NextResponse.json({ error: 'Nenhuma pendência para reportar' }, { status: 400 });
        }

        const escapeHtml = (text: string) => {
            return text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
        };

        const pendingText = pendingList
            .map((cong: any, index: number) => `${index + 1}. <b>${escapeHtml(cong.name)}</b> (Setor ${escapeHtml(cong.sector || '-')})`)
            .join('\n');

        const message = `
<b>📊 Auditoria de Relatórios Financeiros</b>
<b>📅 Referência:</b> ${monthName} / ${year}

⚠️ <b>Congregações com Relatórios Pendentes:</b>
${pendingText}

---
<i>Gentileza regularizar os envios no sistema.</i>
<i>Equipe SEMADEJ</i>
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
        console.error('Treasury summary error:', error);
        return NextResponse.json({ error: 'Erro interno ao processar notificação' }, { status: 500 });
    }
}
