'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Header } from '@/components/layout/Header';
import styles from './page.module.css';
import { maskPhone } from '@/utils/masks';
import { AlertTriangle } from 'lucide-react';

export default function CompleteProfilePage() {
    const router = useRouter();
    const [congregations, setCongregations] = useState<{ id: string, name: string }[]>([]);
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        congregationId: '',
        role: 'agent'
    });
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        // Check if user is logged in
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            // Pre-fill name/email if available
            setFormData(prev => ({
                ...prev,
                fullName: user.user_metadata.full_name || '',
            }));
        };
        checkUser();

        // Load congregations
        const fetchCongregations = async () => {
            const { data } = await supabase.from('congregations').select('id, name').order('name');
            if (data) setCongregations(data);
        };
        fetchCongregations();
    }, [router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        let value = e.target.value;
        if (e.target.id === 'phone') value = maskPhone(value);
        setFormData(prev => ({ ...prev, [e.target.id]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuário não autenticado.");

            // Insert Profile
            const { error } = await supabase.from('profiles').insert([
                {
                    id: user.id,
                    full_name: formData.fullName,
                    phone: formData.phone,
                    congregation_id: formData.congregationId,
                    role: formData.role,
                    status: 'pending' // Still needs approval
                }
            ]);

            if (error) throw error;

            // Force refresh/redirect
            router.push('/dashboard');
            router.refresh();

        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message || 'Erro ao salvar perfil.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.wrapper}>
            <Header />
            <main className={styles.main}>
                <div className={`glass-card ${styles.card}`}>
                    <div className={styles.header}>
                        <h1 className={styles.title}>Concluir Cadastro</h1>
                        <p className={styles.subtitle}>
                            Falta pouco! Precisamos de algumas informações para liberar seu acesso.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <Input
                            id="fullName"
                            label="Nome Completo"
                            placeholder="Seu nome"
                            required
                            value={formData.fullName}
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
                            <label htmlFor="role" className={styles.label}>Perfil <span className="text-red-500">*</span></label>
                            <select
                                id="role"
                                required
                                className={styles.select}
                                value={formData.role}
                                onChange={handleChange}
                            >
                                <option value="agent">Agente Missionário</option>
                                <option value="coordinator">Coordenador</option>
                                <option value="pastor">Pastor</option>
                                <option value="admin">Administrador</option>
                            </select>
                        </div>

                        <div className={styles.fieldGroup}>
                            <label htmlFor="congregationId" className={styles.label}>Congregação <span className="text-red-500">*</span></label>
                            <select
                                id="congregationId"
                                required
                                className={styles.select}
                                value={formData.congregationId}
                                onChange={handleChange}
                            >
                                <option value="">Selecione a congregação...</option>
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

                        <Button type="submit" size="lg" isLoading={loading}>
                            Salvar e Continuar
                        </Button>
                    </form>
                </div>
            </main>
        </div>
    );
}
