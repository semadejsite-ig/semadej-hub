'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Edit2,
    Trash2,
    Calendar,
    Users,
    MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import styles from './page.module.css';

export default function EvangelismHistoryPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [records, setRecords] = useState<any[]>([]);

    useEffect(() => {
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // Fetch records for the current user
            // We use a separate count or join to get leads count
            const { data, error } = await supabase
                .from('evangelism_records')
                .select(`
                    *,
                    evangelism_leads (id)
                `)
                .eq('agent_id', user.id)
                .order('event_date', { ascending: false });

            if (error) throw error;

            if (data) {
                // Process to get count of leads
                const processed = data.map(r => ({
                    ...r,
                    leadsCount: r.evangelism_leads?.length || 0
                }));
                setRecords(processed);
            }
        } catch (error) {
            console.error('Error fetching records:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Deseja realmente excluir este registro? Isso também removerá todos os contatos associados.")) return;

        try {
            const { error } = await supabase
                .from('evangelism_records')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setRecords(prev => prev.filter(r => r.id !== id));
        } catch (error) {
            console.error(error);
            alert("Erro ao excluir registro.");
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/dashboard/evangelism')}
                        style={{ marginBottom: '1rem', paddingLeft: 0 }}
                    >
                        <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} /> Voltar para Registro
                    </Button>
                    <h1 className={styles.title}>Histórico de Evangelismo</h1>
                    <p className={styles.subtitle}>Gerencie suas atividades e contatos registrados.</p>
                </div>
            </div>

            <div className={styles.tableCard}>
                <div className={styles.tableContent}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Título da Ação</th>
                                <th>Alcance</th>
                                <th>Contatos</th>
                                <th style={{ textAlign: 'right' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Carregando histórico...</td>
                                </tr>
                            ) : records.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                                        Nenhum registro encontrado. Comece registrando uma nova ação!
                                    </td>
                                </tr>
                            ) : records.map((record) => (
                                <tr key={record.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
                                            <Calendar size={14} className="text-slate-400" />
                                            {new Date(record.event_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{record.title}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {record.description || 'Sem descrição'}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <Users size={14} style={{ color: '#94a3b8' }} />
                                            <span style={{ fontWeight: 600 }}>{record.people_reached}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={styles.badge}>
                                            <MessageSquare size={12} style={{ marginRight: '0.3rem' }} />
                                            {record.leadsCount}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                            <button
                                                className={styles.btnEdit}
                                                title="Editar"
                                                onClick={() => router.push(`/dashboard/evangelism/${record.id}/edit`)}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                className={styles.btnDelete}
                                                title="Excluir"
                                                onClick={() => handleDelete(record.id)}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
