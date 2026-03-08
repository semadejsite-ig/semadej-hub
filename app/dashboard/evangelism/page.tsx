'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from './page.module.css';
import {
    Plus,
    Minus,
    Save,
    MapPin,
    Users,
    CheckCircle,
    ArrowLeft,
    Trophy,
    History,
    Clock
} from 'lucide-react';

interface Lead {
    full_name: string;
    contact_info: string;
    consent_verbal: boolean;
    notes: string;
}

export default function EvangelismPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [userProfile, setUserProfile] = useState<any>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        event_date: new Date().toISOString().split('T')[0],
        people_reached: ''
    });

    const [leads, setLeads] = useState<Lead[]>([]);

    useEffect(() => {
        const loadUser = async () => {
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
        };
        loadUser();
    }, [router]);

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

        setLoading(true);
        try {
            // 1. Insert Record
            const { data: record, error: recordError } = await supabase
                .from('evangelism_records')
                .insert({
                    agent_id: userProfile.id,
                    congregation_id: userProfile.congregation_id,
                    title: formData.title,
                    description: formData.description,
                    event_date: formData.event_date,
                    people_reached: parseInt(formData.people_reached) || 0
                })
                .select()
                .single();

            if (recordError) throw recordError;

            // 2. Insert Leads (if any)
            if (leads.length > 0 && record) {
                const leadsToInsert = leads
                    .filter(l => l.full_name.trim() !== '')
                    .map(l => ({
                        record_id: record.id,
                        ...l
                    }));

                if (leadsToInsert.length > 0) {
                    const { error: leadsError } = await supabase
                        .from('evangelism_leads')
                        .insert(leadsToInsert);

                    if (leadsError) throw leadsError;
                }
            }

            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setFormData({
                    title: '',
                    description: '',
                    event_date: new Date().toISOString().split('T')[0],
                    people_reached: ''
                });
                setLeads([]);
            }, 3000);

        } catch (error) {
            console.error('Error saving records:', error);
            alert('Erro ao salvar registro. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1>Registro Concluído!</h1>
                    <p>Obrigado por registrar o evangelismo. Sua contribuição faz a diferença!</p>
                </div>
                <div className={styles.card} style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <CheckCircle size={80} color="#10b981" style={{ margin: '0 auto 2rem' }} />
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Salvo com Sucesso!</h2>
                    <p style={{ color: '#64748b', marginBottom: '2rem' }}>
                        Os dados foram registrados e o ranking será atualizado em breve.
                    </p>
                    <Button onClick={() => setSuccess(false)}>Novo Registro</Button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <MapPin size={24} />
                        <h1 style={{ margin: 0 }}>Registro de Evangelismo</h1>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/dashboard/evangelism/history')}
                        style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}
                    >
                        <History size={16} style={{ marginRight: '0.5rem' }} /> Ver Histórico
                    </Button>
                </div>
                <p>Registre as atividades de campo e o impacto na sua congregação.</p>
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
                            Nenhum contato registrado ainda.
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
                        onClick={() => router.back()}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Salvando...' : (
                            <>
                                <Save size={18} style={{ marginRight: '0.5rem' }} /> Salvar Registro
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
