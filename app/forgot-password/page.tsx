'use client';

import { useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Header } from '@/components/layout/Header';
import styles from './page.module.css';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [msg, setMsg] = useState('');

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/update-password`,
        });

        if (error) {
            setMsg('Erro ao enviar e-mail. Verifique o endereço.');
            setStatus('error');
        } else {
            setMsg('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
            setStatus('success');
        }
    };

    return (
        <div className={styles.wrapper}>
            <Header />
            <main className={styles.main}>
                <div className={`glass-card ${styles.card}`}>
                    <div className={styles.header}>
                        <h1 className={styles.title}>Recuperar Senha</h1>
                        <p className={styles.subtitle}>Digite seu e-mail para receber o link de redefinição.</p>
                    </div>

                    {status === 'success' ? (
                        <div className={styles.success}>
                            <p>{msg}</p>
                            <Link href="/login">
                                <Button variant="outline" className="mt-4 w-full">Voltar ao Login</Button>
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleReset} className={styles.form}>
                            <Input
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />

                            {status === 'error' && <p className={styles.error}>{msg}</p>}

                            <Button type="submit" isLoading={status === 'loading'}>
                                Enviar Link
                            </Button>

                            <Link href="/login" className={styles.backLink}>
                                Voltar
                            </Link>
                        </form>
                    )}
                </div>
            </main>
        </div>
    );
}
