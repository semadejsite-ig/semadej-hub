'use client';

import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { supabase } from '@/utils/supabase/client';
import styles from './RegistrationForm.module.css';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { maskPhone } from '@/utils/masks';

interface RegistrationFormProps {
    courseType: 'PAM' | 'LIBRAS';
    title: string;
    subtitle: string;
}

export function RegistrationForm({ courseType, title, subtitle }: RegistrationFormProps) {
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        email: '',
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

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
                        course_type: courseType,
                        status: 'pending' // Default status
                    }
                ]);

            if (error) throw error;

            setStatus('success');
            setFormData({ full_name: '', phone: '', email: '' });
        } catch (error: any) {
            console.error('Error submitting registration:', error);
            setStatus('error');
            setErrorMessage('Erro ao realizar inscrição. Tente novamente.');
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
                <CheckCircle size={64} className={styles.successIcon} />
                <h2 className={styles.successTitle}>Inscrição Recebida!</h2>
                <p className={styles.successText}>
                    Sua pré-matrícula para o curso de {courseType} foi enviada com sucesso.
                    Entraremos em contato em breve pelo WhatsApp.
                </p>
                <Button onClick={() => setStatus('idle')} variant="outline">
                    Fazer outra inscrição
                </Button>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.header}>
                <h1 className={styles.title}>{title}</h1>
                <p className={styles.subtitle}>{subtitle}</p>
            </div>

            <div className={styles.fields}>
                <Input
                    id="full_name"
                    label="Nome Completo"
                    placeholder="Ex: João da Silva"
                    required
                    value={formData.full_name}
                    onChange={handleChange}
                />

                <Input
                    id="phone"
                    label="WhatsApp"
                    placeholder="(12) 99999-9999"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                />

                <Input
                    id="email"
                    label="E-mail (Opcional)"
                    placeholder="joao@email.com"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                />
            </div>

            {status === 'error' && (
                <div className={styles.errorBanner}>
                    <AlertCircle size={20} />
                    <span>{errorMessage}</span>
                </div>
            )}

            <Button type="submit" size="lg" className={styles.submitButton} isLoading={loading}>
                Confirmar Pré-Matrícula
            </Button>
        </form>
    );
}
