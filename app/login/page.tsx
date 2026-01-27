'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { supabase } from '@/utils/supabase/client';
import styles from './page.module.css';
import Link from 'next/link';
import { maskPhone } from '@/utils/masks'; // Keep logic if any

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // MOCK LOGIN BYPASS
            if (email === 'admin@mock.com' && password === '123456') {
                localStorage.setItem('mock_session', 'true');
                router.push('/dashboard');
                router.refresh(); // Important to trigger layout re-render
                return;
            }

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                throw error;
            }

            if (!data.user) throw new Error('Erro no login.');

            // Successful auth, now check profile status
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('approved, role')
                .eq('id', data.user.id)
                .single();

            if (profileError) {
                // Handle case where profile doesn't exist yet (shouldn't happen if registered properly)
                console.warn('Profile missing', profileError);
            }

            if (profile) {
                // Check if user is approved (unless admin)
                // Note: 'approved' column is boolean. 'status' column is legacy/text.
                if (profile.role !== 'admin' && !profile.approved) {
                    await supabase.auth.signOut();
                    throw new Error('Sua conta ainda está em análise pelo administrador.');
                }
            }

            // Successful login (Real)
            localStorage.removeItem('mock_session'); // clear mock if real login successful
            router.push('/dashboard');
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Erro ao realizar login');
            await supabase.auth.signOut();
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
                        <h1 className={styles.title}>Acesso Restrito</h1>
                        <p className={styles.subtitle}>
                            Área exclusiva para Agentes Missionários, Pastores e Coordenadores.
                        </p>
                    </div>


                    <form onSubmit={handleLogin} className={styles.form}>
                        <Input
                            id="email"
                            type="email"
                            label="E-mail"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <div className="flex flex-col gap-1">
                            <Input
                                id="password"
                                type="password"
                                label="Senha"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <div className="text-right">
                                <Link href="/forgot-password" className={styles.smallLink}>
                                    Esqueceu a senha?
                                </Link>
                            </div>
                        </div>

                        {error && <div className={styles.error}>{error}</div>}

                        <Button type="submit" size="lg" className={styles.submitBtn} isLoading={loading}>
                            Entrar
                        </Button>

                        <p className={styles.footerText}>
                            Ainda não tem acesso? <Link href="/register/agent" className={styles.link}>Cadastre-se aqui</Link>
                        </p>



                        <Link href="/" className={styles.link} style={{ fontSize: '0.8rem', marginTop: '1rem', display: 'block' }}>
                            Voltar para o início
                        </Link>
                    </form>
                </div>
            </main >
        </div >
    );
}
