'use client';

import { useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import styles from './RegistrationForm.module.css';
import { Check, AlertCircle, Send, ArrowRight } from 'lucide-react';
import { maskPhone } from '@/utils/masks';

interface RegistrationFormProps {
    courseType: 'PAM' | 'LIBRAS';
    badge?: string;
    title: string;
    subtitle: string;
    courseDisplayName?: string;
}

export function RegistrationForm({
    courseType,
    badge,
    title,
    subtitle,
    courseDisplayName
}: RegistrationFormProps) {
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        email: '',
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const displayName = courseDisplayName || (courseType === 'PAM' ? 'EMAD (Curso Básico de Missões)' : 'Curso de LIBRAS');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStatus('idle');
        setErrorMessage('');

        try {
            const { error } = await supabase
                .from('registrations')
                .insert([
                    {
                        full_name: formData.full_name,
                        phone: formData.phone,
                        email: formData.email,
                        course_type: courseType, // Retains DB CHECK constraint ('PAM' | 'LIBRAS')
                        status: 'pending'
                    }
                ]);

            if (error) throw error;

            setStatus('success');
            setFormData({ full_name: '', phone: '', email: '' });
        } catch (error: unknown) {
            console.error('Error submitting registration:', error);
            setStatus('error');
            setErrorMessage('Erro ao realizar inscrição. Tente novamente ou entre em contato pelo WhatsApp.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;

        if (e.target.id === 'phone') {
            value = maskPhone(value);
        }

        setFormData(prev => ({
            ...prev,
            [e.target.id]: value
        }));
    };

    if (status === 'success') {
        return (
            <div className={styles.successWrapper}>
                <div className={styles.successIcon}>
                    <Check size={36} />
                </div>
                <h2 className={styles.successTitle}>Inscrição Recebida com Sucesso!</h2>
                <p className={styles.successText}>
                    Sua pré-matrícula para <strong>{displayName}</strong> foi registrada no sistema.
                    Nossa equipe entrará em contato em breve pelo WhatsApp para confirmação e orientações de início.
                </p>
                <button onClick={() => setStatus('idle')} className={styles.resetBtn}>
                    Fazer outra inscrição
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.header}>
                {badge && <span className={styles.badge}>{badge}</span>}
                <h1 className={styles.title}>{title}</h1>
                <p className={styles.subtitle}>{subtitle}</p>
            </div>

            <div className={styles.fields}>
                <div className={styles.inputGroup}>
                    <label htmlFor="full_name" className={styles.inputLabel}>
                        Nome Completo
                    </label>
                    <input
                        id="full_name"
                        type="text"
                        required
                        placeholder="Ex: João da Silva"
                        value={formData.full_name}
                        onChange={handleChange}
                        className={styles.textInput}
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label htmlFor="phone" className={styles.inputLabel}>
                        WhatsApp (com DDD)
                    </label>
                    <input
                        id="phone"
                        type="tel"
                        required
                        placeholder="(12) 99999-9999"
                        value={formData.phone}
                        onChange={handleChange}
                        className={styles.textInput}
                    />
                </div>

                <div className={styles.inputGroup}>
                    <label htmlFor="email" className={styles.inputLabel}>
                        E-mail (Opcional)
                    </label>
                    <input
                        id="email"
                        type="email"
                        placeholder="joao@email.com"
                        value={formData.email}
                        onChange={handleChange}
                        className={styles.textInput}
                    />
                </div>
            </div>

            {status === 'error' && (
                <div className={styles.errorBanner}>
                    <AlertCircle size={20} />
                    <span>{errorMessage}</span>
                </div>
            )}

            <button type="submit" disabled={loading} className={styles.submitButton}>
                {loading ? (
                    'Enviando pré-matrícula...'
                ) : (
                    <>
                        <span>Confirmar Pré-Matrícula</span>
                        <ArrowRight size={18} />
                    </>
                )}
            </button>
        </form>
    );
}
