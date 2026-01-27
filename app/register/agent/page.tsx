'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Header } from '@/components/layout/Header';
import styles from './page.module.css';
import Link from 'next/link';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { maskPhone } from '@/utils/masks';

export default function AgentRegisterPage() {
    const router = useRouter();
    const [congregations, setCongregations] = useState<{ id: string, name: string }[]>([]);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        phone: '',
        congregationId: '',
        role: 'agent' // Default
    });
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const fetchCongregations = async () => {
            const { data } = await supabase.from('congregations').select('id, name').order('name');
            if (data) setCongregations(data);
        };
        fetchCongregations();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        let value = e.target.value;

        if (e.target.id === 'phone') {
            value = maskPhone(value);
        }

        setFormData(prev => ({ ...prev, [e.target.id]: value }));
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMsg('');

        try {
            // 1. Sign Up in Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error("Erro ao criar usuário.");

            // 2. Create Profile using RPC (Bypass RLS issues)
            // We use a secure RPC function because sometimes the session isn't fully ready 
            // for RLS policies immediately after signUp, causing 42501 errors.
            const { error: profileError } = await supabase.rpc('create_profile_entry', {
                _id: authData.user.id,
                _full_name: formData.fullName,
                _phone: formData.phone,
                _congregation_id: formData.congregationId,
                _role: formData.role
            });

            if (profileError) throw profileError;

            setStatus('success');
        } catch (err: any) {
            console.error('Registration Error Details:', JSON.stringify(err, null, 2));

            let msg = err.message || "Erro desconhecido ao realizar cadastro.";

            // Handle common Supabase/Postgres errors
            if (err.status === 429 || err.code === 'over_email_send_rate_limit') {
                msg = "Muitas tentativas recentes. Por favor, aguarde alguns minutos ou use outro e-mail.";
            } else if (err.code === '23514') { // Check constraint violation
                msg = "Erro: O perfil selecionado não é permitido ou incompatível.";
            } else if (err.code === '42703') { // Undefined column
                msg = "Erro: O banco de dados está desatualizado (coluna ausente).";
            } else if (err.details) {
                msg += ` (${err.details})`;
            }

            setErrorMsg(msg);
            setStatus('error');
        }
    };

    if (status === 'success') {
        return (
            <div className={styles.wrapper}>
                <Header />
                <main className={styles.main}>
                    <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', maxWidth: '500px' }}>
                        <CheckCircle size={64} className="text-green-500 mx-auto mb-4" color="var(--success)" />
                        <h2 className={styles.title}>Cadastro Realizado!</h2>
                        <p className={styles.subtitle} style={{ marginTop: '1rem', color: 'var(--foreground)' }}>
                            Sua conta foi criada, mas precisa de <strong>aprovação do administrador</strong>.
                        </p>
                        <p className="text-gray-500 mt-2 mb-6">
                            Você será notificado assim que seu acesso for liberado para o perfil de <strong>{formData.role.toUpperCase()}</strong>.
                        </p>
                        <Link href="/login">
                            <Button>Voltar para Login</Button>
                        </Link>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className={styles.wrapper}>
            <Header />
            <main className={styles.main}>
                <div className={`glass-card ${styles.card}`}>
                    <div className={styles.header}>
                        <h1 className={styles.title}>Cadastro de Usuário</h1>
                        <p className={styles.subtitle}>Crie sua conta para acessar o sistema.</p>
                    </div>

                    <form onSubmit={handleRegister} className={styles.form}>
                        <Input
                            id="fullName"
                            label="Nome Completo"
                            placeholder="Seu nome"
                            required
                            value={formData.fullName}
                            onChange={handleChange}
                        />

                        <Input
                            id="email"
                            type="email"
                            label="E-mail"
                            placeholder="seu@email.com"
                            required
                            value={formData.email}
                            onChange={handleChange}
                        />

                        <div className={styles.fieldGroup}>
                            <label htmlFor="role" className={styles.label}>Perfil de Acesso <span className="text-red-500">*</span></label>
                            <select
                                id="role"
                                required
                                className={styles.select}
                                value={formData.role}
                                onChange={handleChange}
                            >
                                <option value="agent">Agente Missionário</option>
                                <option value="coordinator">Coordenador</option>
                                <option value="sector_agent">Agente Setorial</option>
                                <option value="sector_pastor">Pastor Setorial</option>
                                <option value="pastor">Pastor</option>
                                <option value="admin">Administrador</option>
                            </select>
                        </div>

                        <Input
                            id="password"
                            type="password"
                            label="Senha"
                            placeholder="Mínimo 6 caracteres"
                            required
                            minLength={6}
                            value={formData.password}
                            onChange={handleChange}
                        />

                        <Input
                            id="phone"
                            type="tel"
                            label="Celular / WhatsApp"
                            placeholder="(12) 99999-9999"
                            required
                            value={formData.phone}
                            onChange={handleChange}
                        />

                        <div className={styles.fieldGroup}>
                            <label htmlFor="congregationId" className={styles.label}>Congregação <span className="text-red-500">*</span></label>
                            <select
                                id="congregationId"
                                required
                                className={styles.select}
                                value={formData.congregationId}
                                onChange={handleChange}
                            >
                                <option value="">Selecione sua congregação...</option>
                                {congregations.map(cong => (
                                    <option key={cong.id} value={cong.id}>{cong.name}</option>
                                ))}
                            </select>
                        </div>

                        {errorMsg && (
                            <div className={styles.errorBanner}>
                                <AlertTriangle size={18} />
                                {errorMsg}
                            </div>
                        )}

                        <Button type="submit" size="lg" className={styles.submitBtn} isLoading={status === 'loading'}>
                            Cadastrar
                        </Button>

                        <p className={styles.footerText}>
                            Já tem conta? <Link href="/login" className={styles.link}>Faça login</Link>
                        </p>
                    </form>
                </div>
            </main>
        </div>
    );
}
