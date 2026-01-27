'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from './page.module.css';
import {
    ChevronRight,
    ChevronLeft,
    Save,
    DollarSign,
    Users,
    FileText,
    CheckCircle
} from 'lucide-react';

export default function ReportPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [userProfile, setUserProfile] = useState<any>(null);

    // Initial State Logic (Previous Month)
    const getInitialDate = () => {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        return { month: d.getMonth() + 1, year: d.getFullYear() };
    };

    const initialDate = getInitialDate();

    const [formData, setFormData] = useState({
        // General
        month: initialDate.month,
        year: initialDate.year,

        // Financial
        carnet_value: '',
        service_offering_value: '',
        special_offering_value: '',

        // Final
        observations: ''
    });

    useEffect(() => {
        const getUser = async () => {
            // Mock or Real check
            const isMock = localStorage.getItem('mock_session');
            if (isMock) {
                setUserProfile({ id: 'mock-id', congregation_id: 'mock-congregation' });
                return;
            }

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
        getUser();
    }, [router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // If Mock
            const isMock = localStorage.getItem('mock_session');
            if (isMock) {
                await new Promise(r => setTimeout(r, 1000)); // Fake delay
                setSuccess(true);
                return;
            }

            if (!userProfile) throw new Error("Perfil não encontrado");

            const { error } = await supabase.from('monthly_reports').insert([{
                agent_id: userProfile.id,
                congregation_id: userProfile.congregation_id,
                report_month: Number(formData.month),
                report_year: Number(formData.year),

                // Fields
                carnet_value: parseFloat(formData.carnet_value) || 0,
                service_offering_value: parseFloat(formData.service_offering_value) || 0,
                special_offering_value: parseFloat(formData.special_offering_value) || 0,

                // Removed Stats from this report
                member_count: 0,
                carnet_count: 0,
                people_baptized: 0,

                observations: formData.observations
            }]);

            if (error) throw error;
            setSuccess(true);

        } catch (error) {
            console.error(error);
            alert("Erro ao enviar relatório.");
        } finally {
            setLoading(false);
        }
    };

    const monthNames = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    if (success) {
        return (
            <div className={`glass-card ${styles.successCard}`}>
                <CheckCircle size={64} className="text-green-500 mb-4" color="#10b981" />
                <h2>Relatório Enviado!</h2>
                <p>Os dados financeiros foram salvos com sucesso.</p>
                <Button onClick={() => router.push('/dashboard')}>Voltar ao Início</Button>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Relatório Financeiro Mensal</h1>
                <p>Preencha os dados financeiros da congregação.</p>
            </header>

            {/* Stepper */}
            <div className={styles.stepper}>
                <div className={`${styles.step} ${step >= 1 ? styles.active : ''}`}>1</div>
                <div className={styles.line}></div>
                <div className={`${styles.step} ${step >= 2 ? styles.active : ''}`}>2</div>
            </div>

            <div className={styles.stepTitle}>
                {step === 1 && "Financeiro"}
                {step === 2 && "Revisão & Envio"}
            </div>

            <div className={`glass-card ${styles.formCard}`}>

                {/* STEP 1: FINANCIAL */}
                {step === 1 && (
                    <div className={styles.stepContent}>
                        <div className={styles.iconHeader}>
                            <DollarSign size={32} />
                            <h3>Dados Financeiros</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className={styles.fieldGroup}>
                                <label>Mês de Referência</label>
                                <select id="month" value={formData.month} onChange={handleChange} className={styles.select}>
                                    {monthNames.map((name, index) => (
                                        <option key={index + 1} value={index + 1}>{name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.fieldGroup}>
                                <label>Ano</label>
                                <select id="year" value={formData.year} onChange={handleChange} className={styles.select}>
                                    <option value="2024">2024</option>
                                    <option value="2025">2025</option>
                                    <option value="2026">2026</option>
                                </select>
                            </div>
                        </div>

                        <Input
                            id="carnet_value"
                            label="Total Carnê Missionário (R$)"
                            type="number" step="0.01"
                            placeholder="0,00"
                            value={formData.carnet_value}
                            onChange={handleChange}
                        />

                        <Input
                            id="service_offering_value"
                            label="Oferta Culto de Missões (R$)"
                            type="number" step="0.01"
                            placeholder="0,00"
                            value={formData.service_offering_value}
                            onChange={handleChange}
                        />

                        <Input
                            id="special_offering_value"
                            label="Ofertas Especiais (R$)"
                            type="number" step="0.01"
                            placeholder="0,00"
                            value={formData.special_offering_value}
                            onChange={handleChange}
                        />
                    </div>
                )}

                {/* STEP 2: REVIEW */}
                {step === 2 && (
                    <div className={styles.stepContent}>
                        <div className={styles.iconHeader}>
                            <FileText size={32} />
                            <h3>Revisão e Observações</h3>
                        </div>

                        <div className={styles.summary}>
                            <p><strong>Mês/Ano:</strong> {monthNames[Number(formData.month) - 1]} / {formData.year}</p>
                            <p><strong>Total Arrecadado:</strong> R$ {(Number(formData.carnet_value) + Number(formData.service_offering_value) + Number(formData.special_offering_value)).toFixed(2)}</p>
                        </div>

                        <div className={styles.fieldGroup}>
                            <label htmlFor="observations">Observações (Opcional)</label>
                            <textarea
                                id="observations"
                                className={styles.textarea}
                                rows={4}
                                placeholder="Alguma observação importante sobre o mês..."
                                value={formData.observations}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                )}

                <div className={styles.actions}>
                    {step > 1 ? (
                        <Button variant="outline" onClick={prevStep}>
                            <ChevronLeft size={18} /> Voltar
                        </Button>
                    ) : (
                        <div></div>
                    )}

                    {step < 2 ? (
                        <Button onClick={nextStep}>
                            Próximo <ChevronRight size={18} />
                        </Button>
                    ) : (
                        <Button onClick={handleSubmit} isLoading={loading} className="bg-green-600 hover:bg-green-700">
                            <Save size={18} className="mr-2" /> Enviar Relatório
                        </Button>
                    )}
                </div>

            </div>
        </div>
    );
}
