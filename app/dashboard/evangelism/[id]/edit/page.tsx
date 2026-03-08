'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from '../../page.module.css'; // Reusing parent styles
import {
    Plus,
    Minus,
    Save,
    MapPin,
    Users,
    CheckCircle,
    ArrowLeft,
    History
} from 'lucide-react';

interface Lead {
    full_name: string;
    contact_info: string;
    consent_verbal: boolean;
    notes: string;
}

export default function EditEvangelismPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [userProfile, setUserProfile] = useState<any>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        event_date: '',
        people_reached: ''
    });

    const [leads, setLeads] = useState<Lead[]>([]);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // 1. Get User
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push('/login');
                    return;
                }

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                setUserProfile(profile);

                // 2. Get Record
                const { data: record, error: recordError } = await supabase
                    .from('evangelism_records')
                    .select(`
                        *,
                        evangelism_leads (*)
                    `)
                    .eq('id', id)
                    .single();

                if (recordError) throw recordError;

                if (record) {
                    setFormData({
                        title: record.title,
                        description: record.description || '',
                        event_date: record.event_date,
                        people_reached: record.people_reached?.toString() || '0'
                    });
                    setLeads(record.evangelism_leads || []);
                }
            } catch (error) {
                console.error('Error loading record:', error);
                alert('Erro ao carregar registro.');
                router.push('/dashboard/evangelism/history');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [id, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const addLead = () => {
        setLeads(prev => [...prev, { full_name: '', contact_info: '', consent_verbal: false, notes: '' }]);
    };

    const removeLead = (index: number) => {
        setLeads(prev => prev.filter((_, i) => i !== index));
    };

    const handleLeadChange = (index: number, field: keyof Lead, value: any) => {
        setLeads(prev => {
            const newLeads = [...prev];
            newLeads[index] = { ...newLeads[index], [field]: value };
            return newLeads;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userProfile) return;

        setSaving(true);
        try {
            // 1. Update Record
            const { error: updateError } = await supabase
                .from('evangelism_records')
                .update({
                    title: formData.title,
                    description: formData.description,
                    event_date: formData.event_date,
                    people_reached: parseInt(formData.people_reached) || 0
                })
                .eq('id', id);

            if (updateError) throw updateError;

            // 2. Sync Leads (Delete then Re-insert)
            const { error: deleteLeadsError } = await supabase
                .from('evangelism_leads')
                .delete()
                .eq('record_id', id);

            if (deleteLeadsError) throw deleteLeadsError;

            if (leads.length > 0) {
                const leadsToInsert = leads
                    .filter(l => l.full_name.trim() !== '')
                    .map(l => ({
                        record_id: id,
                        full_name: l.full_name,
                        contact_info: l.contact_info,
                        consent_verbal: l.consent_verbal,
                        notes: l.notes || ''
                    }));

                if (leadsToInsert.length > 0) {
                    const { error: leadsInsertError } = await supabase
                        .from('evangelism_leads')
                        .insert(leadsToInsert);

                    if (leadsInsertError) throw leadsInsertError;
                }
            }

            setSuccess(true);
            setTimeout(() => {
                router.push('/dashboard/evangelism/history');
            }, 2000);

        } catch (error) {
            console.error('Error updating records:', error);
            alert('Erro ao atualizar registro. Tente novamente.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-12 text-center text-slate-500">Carregando dados do registro...</div>;
    }

    if (success) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>Registro Atualizado!</h1>
                    <p>As alterações foram salvas com sucesso.</p>
                </div>
                <div className={styles.card} style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <CheckCircle size={80} color="#10b981" style={{ margin: '0 auto 2rem' }} />
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Salvo com Sucesso!</h2>
                    <p style={{ color: '#64748b', marginBottom: '2rem' }}>
                        Redirecionando para o histórico...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <ArrowLeft
                            size={24}
                            style={{ cursor: 'pointer' }}
                            onClick={() => router.push('/dashboard/evangelism/history')}
                        />
                        <h1 style={{ margin: 0 }}>Editar Evangelismo</h1>
                    </div>
                </div>
                <p>Atualize as informações do registro e contatos coletados.</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.card}>
                <div className={styles.fieldGroup}>
                    <label htmlFor="title">Título da Ação</label>
                    <Input
                        id="title"
                        placeholder="Ex: Evangelismo na Praça Central"
                        value={formData.title}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className={styles.fieldGroup}>
                    <label htmlFor="description">Descrição / Resumo</label>
                    <textarea
                        id="description"
                        className={styles.card}
                        style={{ minHeight: '100px', width: '100%', padding: '1rem', marginTop: '0.5rem' }}
                        placeholder="Conte um pouco como foi a experiência..."
                        value={formData.description}
                        onChange={handleChange}
                    />
                </div>

                <div className={styles.row}>
                    <div className={styles.fieldGroup}>
                        <label htmlFor="event_date">Data</label>
                        <Input
                            id="event_date"
                            type="date"
                            value={formData.event_date}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className={styles.fieldGroup}>
                        <label htmlFor="people_reached">Pessoas Abordadas</label>
                        <Input
                            id="people_reached"
                            type="number"
                            placeholder="0"
                            value={formData.people_reached}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div className={styles.leadsSection}>
                    <div className={styles.leadsHeader}>
                        <h3 className={styles.leadsTitle}>
                            <Users size={20} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                            Contatos
                        </h3>
                        <Button type="button" variant="outline" size="sm" onClick={addLead}>
                            <Plus size={16} style={{ marginRight: '0.5rem' }} /> Adicionar
                        </Button>
                    </div>

                    {leads.length === 0 && (
                        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic', padding: '1rem' }}>
                            Nenhum contato registrado.
                        </p>
                    )}

                    {leads.map((lead, index) => (
                        <div key={index} className={styles.leadItem}>
                            <button type="button" className={styles.removeBtn} onClick={() => removeLead(index)}>
                                <Minus size={16} />
                            </button>
                            <div className={styles.row}>
                                <div className={styles.fieldGroup}>
                                    <label>Nome Completo</label>
                                    <Input
                                        value={lead.full_name}
                                        onChange={(e) => handleLeadChange(index, 'full_name', e.target.value)}
                                        placeholder="Nome da pessoa"
                                        required
                                    />
                                </div>
                                <div className={styles.fieldGroup}>
                                    <label>Contato (Tel/Email)</label>
                                    <Input
                                        value={lead.contact_info}
                                        onChange={(e) => handleLeadChange(index, 'contact_info', e.target.value)}
                                        placeholder="(00) 00000-0000"
                                    />
                                </div>
                            </div>
                            <div className={styles.consentRow}>
                                <input
                                    type="checkbox"
                                    id={`consent-${index}`}
                                    checked={lead.consent_verbal}
                                    onChange={(e) => handleLeadChange(index, 'consent_verbal', e.target.checked)}
                                />
                                <label htmlFor={`consent-${index}`}>
                                    Consentimento verbal para contato obtido (LGPD)
                                </label>
                            </div>
                        </div>
                    ))}
                </div>

                <div className={styles.actions}>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/dashboard/evangelism/history')}
                        disabled={saving}
                    >
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={saving}>
                        {saving ? 'Salvando...' : (
                            <>
                                <Save size={18} style={{ marginRight: '0.5rem' }} /> Salvar Alterações
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
