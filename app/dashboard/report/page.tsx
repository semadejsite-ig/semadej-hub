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

    // History State
    const [history, setHistory] = useState<any[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Initial State Logic
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

    // 1. Fetch User & History
    useEffect(() => {
        const loadData = async () => {
            // MOCK MODE
            const isMock = localStorage.getItem('mock_session');
            if (isMock) {
                setUserProfile({ id: 'mock-id', congregation_id: 'mock-congregation' });
                setHistory([
                    { id: '1', report_month: 2, report_year: 2026, carnet_value: 350.00, service_offering_value: 120.00, special_offering_value: 50.00, observations: 'Mock data' },
                    { id: '2', report_month: 1, report_year: 2026, carnet_value: 300.00, service_offering_value: 100.00, special_offering_value: 0.00, observations: 'Mock data' }
                ]);
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

            if (profile?.congregation_id) {
                fetchHistory(profile.congregation_id);
            }
        };
        loadData();
    }, [router]);

    const fetchHistory = async (congregationId: string) => {
        const { data } = await supabase
            .from('monthly_reports')
            .select('*')
            .eq('congregation_id', congregationId)
            .order('report_year', { ascending: false })
            .order('report_month', { ascending: false });

        if (data) setHistory(data);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);

    const handleEdit = (report: any) => {
        setEditingId(report.id);
        setFormData({
            month: report.report_month,
            year: report.report_year,
            carnet_value: report.carnet_value?.toString() || '',
            service_offering_value: report.service_offering_value?.toString() || '',
            special_offering_value: report.special_offering_value?.toString() || '',
            observations: report.observations || ''
        });
        setStep(1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este relatório?')) return;

        try {
            const { error } = await supabase.from('monthly_reports').delete().eq('id', id);
            if (error) throw error;

            // Refresh
            if (userProfile?.congregation_id) fetchHistory(userProfile.congregation_id);
            alert('Relatório excluído.');
        } catch (err) {
            console.error(err);
            alert('Erro ao excluir.');
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setFormData({
            month: initialDate.month,
            year: initialDate.year,
            carnet_value: '',
            service_offering_value: '',
            special_offering_value: '',
            observations: ''
        });
        setStep(1);
    }

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Mock Submit
            if (localStorage.getItem('mock_session')) {
                await new Promise(r => setTimeout(r, 1000));
                setSuccess(true);
                return;
            }

            if (!userProfile) throw new Error("Perfil não encontrado");

            const payload = {
                agent_id: userProfile.id,
                congregation_id: userProfile.congregation_id,
                report_month: Number(formData.month),
                report_year: Number(formData.year),
                carnet_value: parseFloat(formData.carnet_value) || 0,
                service_offering_value: parseFloat(formData.service_offering_value) || 0,
                special_offering_value: parseFloat(formData.special_offering_value) || 0,
                member_count: 0,
                carnet_count: 0,
                people_baptized: 0,
                observations: formData.observations
            };

            if (editingId) {
                // UPDATE
                const { error } = await supabase
                    .from('monthly_reports')
                    .update(payload)
                    .eq('id', editingId);
                if (error) throw error;
            } else {
                // INSERT
                const { error } = await supabase.from('monthly_reports').insert([payload]);
                if (error) throw error;
            }

            setSuccess(true);
            if (userProfile.congregation_id) fetchHistory(userProfile.congregation_id);

        } catch (error) {
            console.error(error);
            alert("Erro ao salvar relatório.");
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
                <h2>{editingId ? 'Relatório Atualizado!' : 'Relatório Enviado!'}</h2>
                <p>Os dados foram salvos com sucesso.</p>
                <div className="flex gap-4 mt-6">
                    <Button onClick={() => { setSuccess(false); cancelEdit(); }}>Lançar Novo</Button>
                    <Button variant="outline" onClick={() => router.push('/dashboard')}>Voltar ao Dashboard</Button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>{editingId ? 'Editar Relatório' : 'Relatório Financeiro Mensal'}</h1>
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
                        <div className="flex justify-between items-center mb-6">
                            <div className={styles.iconHeader}>
                                <DollarSign size={32} />
                                <h3>Dados Financeiros</h3>
                            </div>
                            {editingId && (
                                <button onClick={cancelEdit} className="text-sm text-red-500 hover:underline">
                                    Cancelar Edição
                                </button>
                            )}
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
                            <Save size={18} className="mr-2" /> {editingId ? 'Atualizar' : 'Enviar'}
                        </Button>
                    )}
                </div>

            </div>

            {/* HISTORY SECTION */}
            <div className={styles.historySection}>
                <h3 className={styles.historyTitle}>Histórico de Envios</h3>
                <div className={styles.historyCard}>
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Período</th>
                                    <th>Total (R$)</th>
                                    <th>Observações</th>
                                    <th style={{ textAlign: 'right' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className={styles.emptyState}>
                                            Nenhum relatório encontrado.
                                        </td>
                                    </tr>
                                ) : (
                                    history.map((report) => {
                                        const total = (report.carnet_value || 0) + (report.service_offering_value || 0) + (report.special_offering_value || 0);
                                        return (
                                            <tr key={report.id}>
                                                <td>
                                                    <span className={styles.dateText}>
                                                        {monthNames[report.report_month - 1]} / {report.report_year}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={styles.valueBadge}>
                                                        R$ {total.toFixed(2)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className={styles.obsText}>
                                                        {report.observations || '-'}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className={styles.actionCell}>
                                                        <button
                                                            onClick={() => handleEdit(report)}
                                                            className={styles.editBtn}
                                                        >
                                                            Editar
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(report.id)}
                                                            className={styles.deleteBtn}
                                                        >
                                                            Excluir
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
