'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Button } from '@/components/ui/Button';
import { Phone, MapPin, HeartHandshake, CheckCircle2 } from 'lucide-react';
import styles from './page.module.css';

type PrayerRequest = {
    id: string;
    name: string;
    whatsapp: string;
    address: string | null;
    request: string;
    status: 'pending' | 'prayed';
    created_at: string;
};

export default function GestaoPedidos() {
    const [requests, setRequests] = useState<PrayerRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('prayer_requests')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRequests(data || []);
        } catch (error) {
            console.error('Error fetching prayer requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsPrayed = async (id: string) => {
        setUpdating(id);
        try {
            const { error } = await supabase
                .from('prayer_requests')
                .update({ status: 'prayed' })
                .eq('id', id);

            if (error) throw error;

            // Update local state
            setRequests((prev) =>
                prev.map((req) => (req.id === id ? { ...req, status: 'prayed' } : req))
            );
        } catch (error) {
            console.error('Error updating prayer request status:', error);
            alert('Erro ao atualizar o status do pedido.');
        } finally {
            setUpdating(null);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Pedidos de Oração</h1>
                </div>
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--primary)]"></div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Pedidos de Oração</h1>
                <div className="text-sm text-foreground/70">
                    Total: {requests.length} | Pendentes: {requests.filter(r => r.status === 'pending').length}
                </div>
            </div>

            {requests.length === 0 ? (
                <div className={styles.emptyState}>
                    <HeartHandshake size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Nenhum pedido de oração recebido ainda.</p>
                </div>
            ) : (
                <div className={styles.grid}>
                    {requests.map((req) => (
                        <div key={req.id} className={styles.card}>
                            <div className={styles.cardHeader}>
                                <div className={styles.requesterInfo}>
                                    <span className={styles.name}>{req.name}</span>
                                    <span className={styles.date}>{formatDate(req.created_at)}</span>
                                </div>
                                <div className={`${styles.badge} ${req.status === 'pending' ? styles.badgePending : styles.badgePrayed}`}>
                                    {req.status === 'pending' ? 'Pendente' : 'Orado'}
                                </div>
                            </div>

                            <div className={styles.contactInfo}>
                                <div className={styles.contactItem}>
                                    <Phone size={16} className={styles.contactIcon} />
                                    {req.whatsapp}
                                </div>
                                {req.address && (
                                    <div className={styles.contactItem}>
                                        <MapPin size={16} className={styles.contactIcon} />
                                        {req.address}
                                    </div>
                                )}
                            </div>

                            <div className={styles.requestBody}>
                                <p className="whitespace-pre-wrap">{req.request}</p>
                            </div>

                            <div className={styles.actions}>
                                {req.whatsapp && (
                                    <a
                                        href={`https://wa.me/55${req.whatsapp.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-muted h-9 px-4 py-2"
                                    >
                                        WhatsApp
                                    </a>
                                )}
                                {req.status === 'pending' && (
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => markAsPrayed(req.id)}
                                        disabled={updating === req.id}
                                        className="gap-2"
                                    >
                                        <CheckCircle2 size={16} />
                                        {updating === req.id ? 'Atualizando...' : 'Marcar como Orado'}
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
