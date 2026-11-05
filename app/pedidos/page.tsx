'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { supabase } from '@/utils/supabase/client';
import { Check, HeartHandshake, Send } from 'lucide-react';
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

            // Send telegram alert (fire and forget)
            fetch('/api/notifications/telegram', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    whatsapp: formData.whatsapp,
                    address: formData.address,
                    request: formData.request
                })
            }).catch(err => console.error('Telegram notification failed:', err));

            setSuccess(true);
            setFormData({
                name: '',
                whatsapp: '',
                address: '',
                request: '',
                consent_lgpd: false,
            });
        } catch (err: unknown) {
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
                    <div className={styles.iconWrapper}>
                        <HeartHandshake size={40} />
                    </div>
                    <h1 className={styles.title}>
                        Pedidos de Oração
                    </h1>
                    <p className={styles.subtitle}>
                        <span className={styles.verseQuote}>
                            &ldquo;E tudo o que pedirem em oração, se crerem, vocês receberão.&rdquo; — Mateus 21:22
                        </span>
                        Deixe seu pedido de intercessão e nossa equipe missionária estará orando por você e por sua família.
                    </p>
                </div>

                <div className={styles.formContainer}>
                    {success ? (
                        <div className={styles.successMessage}>
                            <div className={styles.successIcon}>
                                <Check size={36} />
                            </div>
                            <h2 className={styles.successTitle}>Pedido Enviado com Sucesso!</h2>
                            <p className={styles.successText}>
                                Recebemos o seu clamor. Nossa equipe de intercessores já está com seu pedido de oração diante do Senhor. Que a paz de Deus reine em sua vida!
                            </p>
                            <button onClick={() => setSuccess(false)} className={styles.resetBtn}>
                                Enviar outro pedido
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            {error && (
                                <div className={styles.errorAlert}>
                                    {error}
                                </div>
                            )}

                            <div className={styles.formGroup}>
                                <label htmlFor="name" className={styles.label}>
                                    Seu Nome Completo
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    required
                                    placeholder="Ex: João Silva"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={styles.input}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="whatsapp" className={styles.label}>
                                    WhatsApp (com DDD)
                                </label>
                                <input
                                    type="tel"
                                    id="whatsapp"
                                    name="whatsapp"
                                    required
                                    placeholder="(12) 99999-9999"
                                    value={formData.whatsapp}
                                    onChange={handleChange}
                                    className={styles.input}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="address" className={styles.label}>
                                    Bairro / Cidade
                                </label>
                                <input
                                    type="text"
                                    id="address"
                                    name="address"
                                    required
                                    placeholder="Ex: Jardim Satélite, São José dos Campos"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className={styles.input}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="request" className={styles.label}>
                                    Seu Motivo de Oração
                                </label>
                                <textarea
                                    id="request"
                                    name="request"
                                    required
                                    rows={4}
                                    placeholder="Escreva aqui pelo que deseja que oremos (saúde, família, libertação, causas espirituais...)"
                                    value={formData.request}
                                    onChange={handleChange}
                                    className={styles.textarea}
                                />
                            </div>

                            <div className={styles.checkboxGroup}>
                                <input
                                    type="checkbox"
                                    id="consent_lgpd"
                                    name="consent_lgpd"
                                    required
                                    checked={formData.consent_lgpd}
                                    onChange={handleChange}
                                    className={styles.checkbox}
                                />
                                <label htmlFor="consent_lgpd" className={styles.checkboxLabel}>
                                    Concordo com a utilização dos meus dados exclusivamente para fins de intercessão e apoio espiritual pela SEMADEJ, em conformidade com a LGPD.
                                </label>
                            </div>

                            <button type="submit" disabled={loading} className={styles.submitBtn}>
                                {loading ? (
                                    'Enviando pedido...'
                                ) : (
                                    <>
                                        <span>Enviar Pedido de Oração</span>
                                        <Send size={18} />
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
