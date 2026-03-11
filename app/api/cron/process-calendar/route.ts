import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase instance using Service Role for server-side CRON execution
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Must use service role to bypass RLS when acting as a system cron
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
    try {
        console.log('🤖 [CRON] Starting Automated Secretary Check...');

        // Ensure authentication from Vercel Cron (Optional security measure, but highly recommended)
        const authHeader = request.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const now = new Date();

        // 1. Fetch all ACTIVE scheduled messages
        const { data: events, error } = await supabase
            .from('calendar_events')
            .select('*')
            .eq('status', 'active');

        if (error) {
            console.error('Database Error fetching events:', error);
            throw error;
        }

        if (!events || events.length === 0) {
            return NextResponse.json({ message: 'No active events found.' });
        }

        let sentCount = 0;

        // 2. Process each event
        for (const event of events) {
            const startTime = new Date(event.start_time);
            const endTime = event.end_time ? new Date(event.end_time) : null;

            // Start time date component
            const startDayStart = new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate());
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            // If the start time's day is in the future, ignore it for now.
            if (startDayStart > todayStart) continue;

            // If the event has an end_time that is now in the past, deactivate it and skip.
            if (endTime && now > endTime) {
                console.log(`Event passed end time, deactivating: ${event.title}`);
                await supabase
                    .from('calendar_events')
                    .update({ status: 'inactive' })
                    .eq('id', event.id);
                continue;
            }

            const lastRun = event.last_run ? new Date(event.last_run) : null;
            let shouldSendNow = false;

            // 3. Determine if it should send based on recurrence and last_run
            // For a daily Cron (runs 1x a day), we check calendar days, not arbitrary hours.
            if (!lastRun) {
                // Never run before, and start_time day is today or past. Send it.
                shouldSendNow = true;
            } else {
                // Has run before. Check recurrence rules based on dates.
                const lastRunDateStart = new Date(lastRun.getFullYear(), lastRun.getMonth(), lastRun.getDate());

                // If it already ran today, never send again today.
                if (lastRunDateStart.getTime() === todayStart.getTime()) {
                    continue;
                }

                if (event.recurrence === 'none') {
                    // Already ran once and recurrence is 'none', handled by status='inactive' updates, but safeguard.
                    continue;
                } else if (event.recurrence === 'daily') {
                    // It's a new day!
                    shouldSendNow = true;
                } else if (event.recurrence === 'weekly') {
                    // Check if it's the same day of the week as the start_time
                    if (now.getDay() === startTime.getDay()) {
                        shouldSendNow = true;
                    }
                } else if (event.recurrence === 'monthly') {
                    // Check if it's the exact day of the month as start_time (or last day of month if start was 31st)
                    const targetDay = startTime.getDate();
                    const currentDay = now.getDate();

                    // Basic exact day match.
                    if (currentDay === targetDay) {
                        shouldSendNow = true;
                    } else if (targetDay > 28) {
                        // Edge case: if scheduled for 31st, but month has 30 days, send on the last day of the month.
                        const lastDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                        if (currentDay === lastDayOfCurrentMonth && targetDay > lastDayOfCurrentMonth) {
                            shouldSendNow = true;
                        }
                    }
                }
            }

            // 4. Dispatch Telegram if deemed schedule matches
            if (shouldSendNow) {
                console.log(`Processing event: ${event.title} (Type: ${event.event_type})`);

                let messageToSend = event.message;

                try {
                    if (event.event_type === 'vacancies_report') {
                        const reportData = await generateVacanciesReport();
                        if (!reportData) {
                            console.log('No vacancies pending, skipping dispatch.');
                            await updateLastRun(event, now);
                            continue;
                        }
                        messageToSend = reportData;
                    } else if (event.event_type === 'treasury_report') {
                        const reportData = await generateTreasuryReport();
                        if (!reportData) {
                            console.log('No treasury pending, skipping dispatch.');
                            await updateLastRun(event, now);
                            continue;
                        }
                        messageToSend = reportData;
                    }

                    if (!messageToSend) {
                        console.log('Message is empty, skipping.');
                        await updateLastRun(event, now);
                        continue;
                    }

                    const sent = await dispatchTelegramMessage(messageToSend, event.target_bot);

                    if (sent) {
                        await updateLastRun(event, now);
                        sentCount++;
                    }
                } catch (reportError) {
                    console.error('Error generating/sending report for event:', event.title, reportError);
                    // Do NOT update last_run on crash so it tries again or at least alerts logs.
                }
            }
        }

        // --- 5. Sweep Inactive Users (3 Months Rule) ---
        let deactivatedCount = 0;
        try {
            deactivatedCount = await sweepInactiveUsers(now);
        } catch (sweepErr) {
            console.error('Error sweeping inactive users:', sweepErr);
        }

        return NextResponse.json({ success: true, processed: events.length, sent: sentCount, deactivated: deactivatedCount });

    } catch (error: any) {
        console.error('CRON Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function updateLastRun(event: any, now: Date) {
    await supabase
        .from('calendar_events')
        .update({
            last_run: now.toISOString(),
            status: event.recurrence === 'none' ? 'inactive' : 'active'
        })
        .eq('id', event.id);
}

const escapeHtml = (text: string) => {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
};

async function generateVacanciesReport(): Promise<string | null> {
    // 1. Fetch congregations
    const { data: congData, error: congError } = await supabase
        .from('congregations')
        .select('id, name, sector')
        .order('name');

    if (congError) throw congError;

    // 2. Fetch profiles
    const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, phone, role, congregation_id')
        .neq('access_status', 'inactive');

    if (profileError) throw profileError;

    // 3. Find pending
    const pendingList: any[] = [];
    congData.forEach(cong => {
        const profilesInCong = profileData.filter(p => p.congregation_id === cong.id);
        const agentCount = profilesInCong.filter(p => p.role === 'agent' || p.role === 'sector_agent').length;
        if (agentCount === 0) {
            pendingList.push(cong);
        }
    });

    if (pendingList.length === 0) return null;

    // Group by sector
    const sectors: Record<string, any[]> = {};
    pendingList.forEach((cong: any) => {
        const s = cong.sector || 'Não Informado';
        if (!sectors[s]) sectors[s] = [];
        sectors[s].push(cong);
    });

    const sortedSectors = Object.keys(sectors).sort((a, b) => {
        if (a === 'Não Informado') return 1;
        if (b === 'Não Informado') return -1;
        return Number(a) - Number(b);
    });

    let pendingText = '';
    let totalPending = 0;
    sortedSectors.forEach(sector => {
        pendingText += `\n<b>Setor ${sector}:</b>\n`;
        sectors[sector].forEach((cong: any) => {
            totalPending++;
            pendingText += `- ${escapeHtml(cong.name)}\n`;
        });
    });

    const message = `
<b>🚨 Alerta de Alocação de Agentes</b>
<i>Congregações sem Agente Missionário associado</i>

⚠️ <b>Total:</b> ${totalPending} congregação(ões)
${pendingText}

---
<i>Gestão de Missões - SEMADEJ</i>
    `.trim();

    return message;
}

async function generateTreasuryReport(): Promise<string | null> {
    // Reference month is last month
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const monthName = monthNames[month - 1];

    // Get all congs
    const { data: allCongs, error: congError } = await supabase
        .from('congregations')
        .select('id, name, sector')
        .order('name');
    if (congError) throw congError;

    // Get profiles
    const { data: allProfiles, error: profError } = await supabase
        .from('profiles')
        .select('full_name, role, congregation_id')
        .or('role.eq.agent,role.eq.sector_agent');
    if (profError) throw profError;

    // Get reports
    const { data: reports, error } = await supabase
        .from('monthly_reports')
        .select('congregation_id')
        .eq('report_month', month)
        .eq('report_year', year);
    if (error) throw error;

    const submittedIds = new Set(reports?.map(r => r.congregation_id));

    const pendingList: any[] = [];
    allCongs.forEach(cong => {
        if (!submittedIds.has(cong.id)) {
            pendingList.push({
                ...cong,
                profiles: allProfiles?.filter(p => p.congregation_id === cong.id) || []
            });
        }
    });

    if (pendingList.length === 0) return null;

    // Group by sector
    const sectors: Record<string, any[]> = {};
    pendingList.forEach((cong: any) => {
        const s = cong.sector || 'Não Informado';
        if (!sectors[s]) sectors[s] = [];
        sectors[s].push(cong);
    });

    const sortedSectors = Object.keys(sectors).sort((a, b) => {
        if (a === 'Não Informado') return 1;
        if (b === 'Não Informado') return -1;
        return Number(a) - Number(b);
    });

    let pendingText = '';
    sortedSectors.forEach(sector => {
        pendingText += `\n<b>Setor ${sector}:</b>\n`;
        sectors[sector].forEach((cong: any) => {
            const agents = cong.profiles && cong.profiles.length > 0
                ? cong.profiles.map((p: any) => p.full_name).join(', ')
                : 'Sem agente vinculado';
            pendingText += `- ${escapeHtml(cong.name)} (<i>${escapeHtml(agents)}</i>)\n`;
        });
    });

    const message = `
<b>📊 Auditoria de Relatórios Financeiros</b>
<b>📅 Referência:</b> ${monthName} / ${year}

⚠️ <b>Congregações Pendentes:</b>
${pendingText}

---
<i>Gentileza regularizar os envios no sistema.</i>
<i>Equipe SEMADEJ</i>
    `.trim();

    return message;
}

async function dispatchTelegramMessage(messageText: string, targetBot: string): Promise<boolean> {
    const isTreasury = targetBot === 'treasury';
    const botToken = isTreasury ? process.env.TELEGRAM_TREASURY_BOT_TOKEN : process.env.TELEGRAM_BOT_TOKEN;
    const chatId = isTreasury ? process.env.TELEGRAM_TREASURY_CHAT_ID : process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
        console.error(`Missing Telegram credentials for targeting bot: ${targetBot}`);
        return false;
    }

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

    try {
        const response = await fetch(telegramUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: messageText,
                parse_mode: 'HTML',
            }),
        });

        const data = await response.json();
        if (!data.ok) {
            console.error('Failed to send Telegram message:', data);
            return false;
        }
        return true;
    } catch (err) {
        console.error('Exception requesting Telegram API:', err);
        return false;
    }
}

async function sweepInactiveUsers(now: Date): Promise<number> {
    const cutoffDate = new Date(now);
    cutoffDate.setMonth(cutoffDate.getMonth() - 3);
    const cutoffIso = cutoffDate.toISOString();

    // Find users to deactivate
    // PostgREST OR syntax: last_access.lt.DATE,and(last_access.is.null,created_at.lt.DATE)
    const { data: usersToDeactivate, error } = await supabase
        .from('profiles')
        .select('id')
        .neq('role', 'admin')
        .neq('access_status', 'inactive')
        .or(`last_access.lt.${cutoffIso},and(last_access.is.null,created_at.lt.${cutoffIso})`);

    if (error) {
        throw error;
    }

    if (!usersToDeactivate || usersToDeactivate.length === 0) {
        return 0;
    }

    const idsToDeactivate = usersToDeactivate.map(u => u.id);

    // Bulk update
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ access_status: 'inactive' })
        .in('id', idsToDeactivate);

    if (updateError) {
        throw updateError;
    }

    console.log(`[CRON] Swept and deactivated ${idsToDeactivate.length} inactive users.`);
    return idsToDeactivate.length;
}
