'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/utils/supabase/client';
import { ArrowLeft, Check, HeartHandshake } from 'lucide-react';
import Link from 'next/link';
import styles from './page.module.css';

export default function PedidosOracao() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        whatsapp: '',
        address: '',
        request: '',
        consent_lgpd: false,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.consent_lgpd) {
            setError('Você precisa aceitar os termos de privacidade.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const { error: insertError } = await supabase.from('prayer_requests').insert([
                {
                    name: formData.name,
                    whatsapp: formData.whatsapp,
                    address: formData.address,
                    request: formData.request,
                    consent_lgpd: formData.consent_lgpd,
                },
            ]);

            if (insertError) throw insertError;

            setSuccess(true);
            setFormData({
                name: '',
                whatsapp: '',
                address: '',
                request: '',
                consent_lgpd: false,
            });
        } catch (err: any) {
            console.error('Error inserting prayer request:', err);
            setError('Houve um erro ao enviar seu pedido. Tente novamente mais tarde.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    return (
        <div className={styles.wrapper}>
            <Header />

            <main className={styles.main}>
                <div className={styles.header}>
                    <div className="flex justify-center mb-8">
                        <div className="p-6 rounded-full bg-pink-500/10 text-pink-500">
                            <HeartHandshake size={64} />
                        </div>
                    </div>
                    <h1 className={styles.title}>
                        Pedidos de Oração
                    </h1>
                    <p className={styles.subtitle}>
                        "E tudo o que pedirem em oração, se crerem, vocês receberão." - Mateus 21:22.
                        <br />
                        Deixe seu pedido e nossa equipe de intercessores estará orando por você.
                    </p>
                </div>

                <div className={styles.formContainer}>
                    {success ? (
                        <div className={styles.successMessage}>
                            <div className={styles.successIcon}>
                                <Check size={32} />
                            </div>
                            <h2 className={styles.successTitle}>Pedido Enviado!</h2>
                            <p className={styles.successText}>
                                Recebemos o seu pedido de oração com sucesso. Nossa equipe de intercessão estará orando por você. Que Deus te abençoe!
                            </p>
                            <Button onClick={() => setSuccess(false)} variant="outline" className="mt-4">
                                Enviar outro pedido
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <div className={styles.formGroup}>
                                <label htmlFor="name" className={styles.label}>Nome Completo</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    required
                                    className={styles.input}
                                    placeholder="Seu nome completo"
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="whatsapp" className={styles.label}>WhatsApp / Telefone</label>
                                <input
                                    type="tel"
                                    id="whatsapp"
                                    name="whatsapp"
                                    required
                                    className={styles.input}
                                    placeholder="(00) 00000-0000"
                                    value={formData.whatsapp}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="address" className={styles.label}>Endereço (Opcional)</label>
                                <input
                                    type="text"
                                    id="address"
                                    name="address"
                                    className={styles.input}
                                    placeholder="Seu endereço ou congregação"
                                    value={formData.address}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="request" className={styles.label}>Seu Pedido de Oração</label>
                                <textarea
                                    id="request"
                                    name="request"
                                    required
                                    className={styles.textarea}
                                    placeholder="Como podemos orar por você hoje?"
                                    value={formData.request}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className={styles.checkboxGroup}>
                                <input
                                    type="checkbox"
                                    id="consent_lgpd"
                                    name="consent_lgpd"
                                    className={styles.checkbox}
                                    checked={formData.consent_lgpd}
                                    onChange={handleChange}
                                />
                                <label htmlFor="consent_lgpd" className={styles.checkboxLabel}>
                                    Eu concordo em compartilhar meus dados de contato (Nome, WhatsApp e Endereço) com a Secretaria de Missões para fins de acompanhamento e suporte espiritual, conforme a Lei Geral de Proteção de Dados (LGPD).
                                </label>
                            </div>

                            {error && (
                                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
                                    {error}
                                </div>
                            )}

                            <Button type="submit" size="lg" className={styles.submitBtn} disabled={loading}>
                                {loading ? 'Enviando...' : 'Enviar Pedido de Oração'}
                            </Button>
                        </form>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
