'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Button } from '@/components/ui/Button';
import styles from './page.module.css';
import { Calendar as CalendarIcon, Clock, MessageCircle, Send, Trash2, Repeat } from 'lucide-react';

interface ScheduledEvent {
    id: string;
    title: string;
    message: string | null;
    event_type: 'text' | 'vacancies_report' | 'treasury_report';
    start_time: string;
    recurrence: 'none' | 'daily' | 'weekly' | 'monthly';
    end_time: string | null;
    target_bot: 'general' | 'treasury';
    status: 'active' | 'inactive';
    last_run: string | null;
}

export default function AdminAgendaPage() {
    const [events, setEvents] = useState<ScheduledEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [eventType, setEventType] = useState<'text' | 'vacancies_report' | 'treasury_report'>('text');
    const [message, setMessage] = useState('');
    const [date, setDate] = useState('');
    const [recurrence, setRecurrence] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
    const [endDate, setEndDate] = useState('');
    const [targetBot, setTargetBot] = useState<'general' | 'treasury'>('general');

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const { data, error } = await supabase
                .from('calendar_events')
                .select('*')
                .order('start_time', { ascending: true });

            if (error) {
                if (error.code === '42P01') {
                    // Table doesn't exist yet, we handle gracefully
                    console.warn('calendar_events table not created yet.');
                } else {
                    throw error;
                }
            } else {
                setEvents(data || []);
            }
        } catch (error) {
            console.error('Error fetching calendar events:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            // Combine Date and Time (Fixed to 09:00 BRT implicitly since CRON runs at 12:00 UTC)
            // 09:00 BRT is 12:00 UTC. So we set the start time strictly to 12:00 UTC to match the engine.
            const combinedDate = new Date(`${date}T12:00:00Z`);

            // Assuming the timezone is handled correctly by the browser/server natively, toISOString sets to UTC.
            const isoString = combinedDate.toISOString();

            // Handle Recurrence limit (end_time - End of Day implicitly)
            let endIsoString = null;
            if (recurrence !== 'none' && endDate) {
                const combinedEndDate = new Date(`${endDate}T23:59:59`);
                endIsoString = combinedEndDate.toISOString();
            }

            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;

            const { error } = await supabase
                .from('calendar_events')
                .insert({
                    title,
                    event_type: eventType,
                    message: eventType === 'text' ? message : null,
                    start_time: isoString,
                    recurrence,
                    end_time: endIsoString,
                    target_bot: targetBot,
                    status: 'active',
                    created_by: userId
                });

            if (error) throw error;

            alert('Aviso programado com sucesso!');
            // Reset Form
            setTitle('');
            setEventType('text');
            setMessage('');
            setDate('');
            setRecurrence('none');
            setEndDate('');
            setTargetBot('general');

            fetchEvents();
        } catch (error: any) {
            console.error('Error creating event:', error);
            alert('Falha ao agendar: ' + (error.message || 'Erro de banco de dados.'));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Tem certeza que deseja apagar o agendamento "${title}"?`)) return;

        try {
            const { error } = await supabase
                .from('calendar_events')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchEvents();
        } catch (error) {
            console.error('Error deleting event:', error);
            alert('Erro ao apagar evento.');
        }
    }

    const formatDateTime = (isoString: string) => {
        const d = new Date(isoString);
        return d.toLocaleDateString('pt-BR'); // Removed time since logic is now solely daily
    };

    const getRecurrenceLabel = (rec: string) => {
        switch (rec) {
            case 'daily': return 'Diariamente';
            case 'weekly': return 'Semanalmente';
            case 'monthly': return 'Mensalmente';
            default: return 'Apenas 1 vez';
        }
    }

    const getEventTypeLabel = (type: string) => {
        switch (type) {
            case 'vacancies_report': return 'Relatório de Vagas';
            case 'treasury_report': return 'Relatório de Tesouraria';
            default: return 'Texto Original';
        }
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Agenda de Avisos (Bot)</h1>
                    <p className={styles.subtitle}>Crie alertas que o Secretário Automático enviará sozinho no Telegram.</p>
                </div>
            </header>

            <div className={styles.mainLayout}>
                {/* Form Col */}
                <div className={styles.newCard}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <CalendarIcon size={20} className="text-blue-600" />
                        Novo Agendamento
                    </h3>
                    <form onSubmit={handleCreateEvent}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Título (Para Controle Interno)</label>
                            <input
                                type="text"
                                className={styles.input}
                                placeholder="Ex: Lembrete Relatório Mensal"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>O que este evento enviará?</label>
                            <select
                                className={styles.select}
                                value={eventType}
                                onChange={e => setEventType(e.target.value as any)}
                            >
                                <option value="text">Mensagem de Texto Customizada</option>
                                <option value="vacancies_report">Relatório Automático: Vagas</option>
                                <option value="treasury_report">Relatório Automático: Tesouraria</option>
                            </select>
                        </div>

                        {eventType === 'text' && (
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Mensagem que vai pro Telegram</label>
                                <textarea
                                    className={styles.textarea}
                                    placeholder="Escreva a mensagem aqui..."
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    required
                                />
                                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>Dica: Você pode pular linhas normalmente. Evite links gigantes.</p>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Data do Envio</label>
                                <input
                                    type="date"
                                    className={styles.input}
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    required
                                />
                                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>Os eventos desta agenda são processados uma vez ao dia (às 09:00 da manhã).</p>
                            </div>

                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Repetição / Recorrência</label>
                            <select
                                className={styles.select}
                                value={recurrence}
                                onChange={e => setRecurrence(e.target.value as any)}
                            >
                                <option value="none">Apenas essa vez</option>
                                <option value="daily">Todos os dias (Diário)</option>
                                <option value="weekly">Semanal (Mesmo dia da semana)</option>
                                <option value="monthly">Mensal (Mesmo dia do mês)</option>
                            </select>
                        </div>

                        {/* Fim da Recorrência (Data Limite) */}
                        {recurrence !== 'none' && (
                            <div className={styles.formGroup} style={{ marginTop: '1rem' }}>
                                <label className={styles.label}>Repetir ATÉ (Data Limite)</label>
                                <input
                                    type="date"
                                    className={styles.input}
                                    value={endDate}
                                    onChange={e => setEndDate(e.target.value)}
                                    required
                                />
                                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>Considera até as 23:59h deste dia.</p>
                            </div>
                        )}

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Qual Grupo/Bot Enviar?</label>
                            <select
                                className={styles.select}
                                value={targetBot}
                                onChange={e => setTargetBot(e.target.value as any)}
                            >
                                <option value="general">Grupo Agentes Missionários</option>
                                <option value="treasury">Grupo de Oração</option>
                            </select>
                        </div>

                        <Button type="submit" isLoading={saving} className="w-full mt-4" style={{ gap: '0.5rem' }}>
                            <Send size={18} />
                            Salvar Programação
                        </Button>
                    </form>
                </div>

                {/* List Col */}
                <div className={styles.listCard}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={20} className="text-emerald-600" />
                        Próximos Envios
                    </h3>

                    {loading ? (
                        <p className={styles.emptyState}>Carregando agenda...</p>
                    ) : events.length === 0 ? (
                        <p className={styles.emptyState}>Nenhuma mensagem na fila.</p>
                    ) : (
                        <div className={styles.calendarList}>
                            {events.map(ev => (
                                <div key={ev.id} className={styles.eventItem}>
                                    <button className={styles.deleteBtn} onClick={() => handleDelete(ev.id, ev.title)} title="Excluir Agendamento">
                                        <Trash2 size={16} />
                                    </button>
                                    <div className={styles.eventTitle}>
                                        {ev.title}
                                        {ev.status === 'inactive' && <span className={`${styles.badge}`} style={{ background: '#fee2e2', color: '#991b1b' }}>Inativo</span>}
                                    </div>
                                    <div className={styles.eventMeta}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <CalendarIcon size={14} /> {formatDateTime(ev.start_time)}
                                        </span>
                                        <span className={`${styles.badge} ${ev.target_bot === 'general' ? styles.badgeGeneral : styles.badgeTreasury}`}>
                                            Destino: {ev.target_bot === 'general' ? 'Agentes Missionários' : 'Grupo de Oração'}
                                        </span>
                                        {ev.event_type !== 'text' && (
                                            <span className={`${styles.badge}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#dbeafe', color: '#1e40af' }}>
                                                {getEventTypeLabel(ev.event_type)}
                                            </span>
                                        )}
                                        {ev.recurrence !== 'none' && (
                                            <span className={`${styles.badge} ${styles.badgeRecurrence}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Repeat size={12} /> {getRecurrenceLabel(ev.recurrence)}
                                            </span>
                                        )}
                                        {ev.end_time && (
                                            <span className={`${styles.badge} ${styles.badgeRecurrence}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fef08a', color: '#854d0e' }}>
                                                Até: {formatDateTime(ev.end_time)}
                                            </span>
                                        )}
                                    </div>
                                    <div className={styles.eventMessage}>
                                        {ev.event_type === 'text' ? ev.message : <span style={{ fontStyle: 'italic', color: '#64748b' }}>(Gerado automaticamente pelo sistema no momento do envio)</span>}
                                    </div>
                                    {ev.last_run && (
                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.5rem', textAlign: 'right' }}>
                                            Último disparo: {formatDateTime(ev.last_run)}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
