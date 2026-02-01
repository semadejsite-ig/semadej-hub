'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import {
    DollarSign,
    AlertTriangle,
    CheckCircle2,
    TrendingUp,
    Search,
    FileText
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import styles from './page.module.css';

export default function TreasuryPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalRaised: 0,
        pendingReports: 0,
        totalCongregations: 0,
        reportsReceived: 0,
        monthName: ''
    });
    const [recentReports, setRecentReports] = useState<any[]>([]);
    const [pendingList, setPendingList] = useState<any[]>([]);
    const [printMode, setPrintMode] = useState<'general' | 'pending' | null>(null);
    const [selectedDate, setSelectedDate] = useState(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 1); // Default to previous month
        return { month: d.getMonth() + 1, year: d.getFullYear() };
    });

    const [selectedReport, setSelectedReport] = useState<any>(null);

    useEffect(() => {
        loadTreasuryData(selectedDate.month, selectedDate.year);
    }, [selectedDate]);

    useEffect(() => {
        if (printMode) {
            setTimeout(() => {
                window.print();
                setPrintMode(null);
            }, 500);
        }
    }, [printMode]);

    const loadTreasuryData = async (month: number, year: number) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }

        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

        try {
            // 1. Get ALL Congregations
            const { data: allCongs, error: congError } = await supabase
                .from('congregations')
                .select('id, name, sector')
                .order('name');

            if (congError) throw congError;

            // 2. Get Reports for SELECTED Month
            const { data: reports, error } = await supabase
                .from('monthly_reports')
                .select(`
                    *,
                    congregations (name, sector),
                    profiles (full_name)
                `)
                .eq('report_month', month)
                .eq('report_year', year)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Calculate Stats
            const total = reports?.reduce((acc, curr) =>
                acc + (curr.carnet_value || 0) + (curr.service_offering_value || 0) + (curr.special_offering_value || 0)
                , 0) || 0;

            const receivedCount = reports?.length || 0;
            const totalCongs = allCongs?.length || 0;
            const pendingCount = totalCongs - receivedCount;

            // Determine who is pending
            const submittedIds = new Set(reports?.map(r => r.congregation_id));
            const missing = allCongs?.filter(c => !submittedIds.has(c.id)) || [];

            setStats({
                totalRaised: total,
                pendingReports: pendingCount > 0 ? pendingCount : 0,
                totalCongregations: totalCongs,
                reportsReceived: receivedCount,
                monthName: monthNames[month - 1]
            });

            setPendingList(missing);
            setRecentReports(reports || []);

        } catch (err) {
            console.error('Error loading treasury data:', err);
            alert('Erro ao carregar dados da tesouraria.');
        } finally {
            setLoading(false);
        }
    };

    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedDate(prev => ({ ...prev, month: parseInt(e.target.value) }));
    };

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedDate(prev => ({ ...prev, year: parseInt(e.target.value) }));
    };

    const handlePrintGeneral = () => {
        setPrintMode('general');
    };

    const handlePrintPending = () => {
        setPrintMode('pending');
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Carregando painel financeiro...</div>;

    const hasPending = stats.pendingReports > 0;
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    return (
        <div className={`${styles.container} ${printMode ? styles.printing : ''} ${printMode === 'pending' ? styles.printPending : styles.printGeneral}`}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Painel do Tesoureiro</h1>
                    <p className={styles.subtitle}>
                        {printMode === 'pending' ? 'Relatório de Pendências' : 'Gestão financeira e auditoria'} - {stats.monthName} / {selectedDate.year}
                    </p>
                </div>

                {/* Date Filters - Hide on Print */}
                <div className={`${styles.headerControls} ${styles.noPrint}`}>
                    <select
                        value={selectedDate.month}
                        onChange={handleMonthChange}
                        className={styles.select}
                    >
                        {monthNames.map((name, index) => (
                            <option key={index} value={index + 1}>{name}</option>
                        ))}
                    </select>
                    <select
                        value={selectedDate.year}
                        onChange={handleYearChange}
                        className={styles.select}
                    >
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                    </select>
                </div>
            </header>

            {/* KPI CARDS */}
            <div className={styles.grid}>
                {/* PENDING ALERT - Hide on General Print */}
                <div
                    className={`${styles.card} ${styles.pendingCard} ${styles.hideOnGeneralPrint}`}
                    data-status={hasPending ? 'alert' : 'ok'}
                >
                    <div>
                        <div className={styles.cardHeader}>
                            <div>
                                <p className={styles.cardLabel}>Pendências</p>
                                <h3 className={`${styles.cardValue} ${hasPending ? styles.pendingValue : styles.okValue}`}>
                                    {stats.pendingReports}
                                </h3>
                            </div>
                            <div className={styles.iconBox} style={{ background: hasPending ? '#ffedd5' : '#dcfce7', color: hasPending ? '#ea580c' : '#16a34a' }}>
                                {hasPending ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
                            </div>
                        </div>
                        <p className={styles.subtitle}>
                            Congregações pendentes em <strong>{stats.monthName}</strong>.
                        </p>

                        {/* Print Pending Button */}
                        <div className={styles.noPrint} style={{ marginTop: '1.5rem' }}>
                            <Button
                                variant="outline"
                                style={{ width: '100%', border: '1px solid var(--border)', background: 'white' }}
                                onClick={handlePrintPending}
                                disabled={!hasPending}
                            >
                                Imprimir Lista de Pendências
                            </Button>
                        </div>
                    </div>
                </div>

                {/* TOTAL RAISED - Keep on General Print */}
                <div className={`${styles.card} ${styles.hideOnPendingPrint}`}>
                    <div className={styles.cardHeader}>
                        <div>
                            <p className={styles.cardLabel}>Arrecadação Total</p>
                            <h3 className={styles.cardValue}>
                                R$ {stats.totalRaised.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </h3>
                        </div>
                        <div className={styles.iconBox} style={{ background: '#eff6ff', color: '#2563eb' }}>
                            <DollarSign size={24} />
                        </div>
                    </div>
                    <p style={{ color: '#16a34a', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <TrendingUp size={16} /> Acumulado do mês
                    </p>
                </div>

                {/* AUDIT STATUS - Hide on All Prints */}
                <div className={`${styles.card} ${styles.auditCard} ${styles.noPrint}`}>
                    <div className={styles.auditIcon}>
                        <FileText size={32} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>Central de Auditoria</h3>
                        <p className={styles.subtitle} style={{ marginBottom: '1.5rem' }}>Verifique detalhes e imprima relatórios.</p>
                        <Button
                            variant="outline"
                            style={{ border: '1px solid var(--border)' }}
                            onClick={handlePrintGeneral}
                        >
                            Imprimir Relatório Geral
                        </Button>
                    </div>
                </div>
            </div>

            {/* PENDING LIST TABLE (Hidden unless printMode === pending) */}
            <div className={`${styles.tableCard} ${printMode === 'pending' ? styles.showOnAvailable : styles.hidden}`}>
                <div className={styles.tableHeader}>
                    <h3 className={styles.tableTitle}>Congregações Pendentes</h3>
                </div>
                <div className={styles.tableContent}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Congregação</th>
                                <th>Setor</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingList.map(cong => (
                                <tr key={cong.id}>
                                    <td style={{ fontWeight: 600 }}>{cong.name}</td>
                                    <td>Setor {cong.sector}</td>
                                    <td style={{ color: '#ea580c', fontWeight: 600 }}>Pendente</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* RECENT REPORTS TABLE (Hide on Pending Print) */}
            <div className={`${styles.tableCard} ${styles.hideOnPendingPrint}`}>
                <div className={`${styles.tableHeader} ${styles.noPrint}`}>
                    <h3 className={styles.tableTitle}>Últimos Envios</h3>
                    <div className={styles.searchContainer}>
                        <Search className={styles.searchIcon} size={18} />
                        <input
                            type="text"
                            placeholder="Buscar congregação..."
                            className={styles.searchInput}
                        />
                    </div>
                </div>

                <div className={styles.tableContent}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Congregação</th>
                                <th>Setor</th>
                                <th>Data Envio</th>
                                <th style={{ textAlign: 'right' }}>Total (R$)</th>
                                <th style={{ textAlign: 'center' }}>Status</th>
                                <th style={{ textAlign: 'right' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentReports.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--muted-foreground)' }}>
                                        Nenhum relatório recebido neste mês ainda.
                                    </td>
                                </tr>
                            ) : (
                                recentReports.map((report) => {
                                    const total = (report.carnet_value || 0) + (report.service_offering_value || 0) + (report.special_offering_value || 0);
                                    return (
                                        <tr key={report.id}>
                                            <td style={{ fontWeight: 600 }}>
                                                {report.congregations?.name || 'Desconhecida'}
                                            </td>
                                            <td>
                                                Setor {report.congregations?.sector || '-'}
                                            </td>
                                            <td>
                                                {new Date(report.created_at).toLocaleDateString('pt-BR')}
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 700 }}>
                                                R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span className={`${styles.statusBadge} ${styles.received}`}>
                                                    Recebido
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <button
                                                    className={styles.actionBtn}
                                                    onClick={() => setSelectedReport(report)}
                                                >
                                                    Detalhes
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* DETAILS MODAL */}
            {selectedReport && (
                <div className={styles.modalOverlay} onClick={() => setSelectedReport(null)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <button className={styles.modalClose} onClick={() => setSelectedReport(null)}>✕</button>

                        <h3 className={styles.title} style={{ fontSize: '1.5rem', marginBottom: '0.2rem' }}>
                            {selectedReport.congregations?.name}
                        </h3>
                        <p className={styles.subtitle} style={{ marginBottom: '1.5rem' }}>
                            Relatório de {monthNames[selectedReport.report_month - 1]} / {selectedReport.report_year}
                        </p>

                        <div className="space-y-4">
                            <div className={styles.modalRow}>
                                <span className={styles.modalLabel}>Carnê Missionário</span>
                                <span className={styles.modalValue}>R$ {selectedReport.carnet_value?.toFixed(2)}</span>
                            </div>
                            <div className={styles.modalRow}>
                                <span className={styles.modalLabel}>Oferta de Missões</span>
                                <span className={styles.modalValue}>R$ {selectedReport.service_offering_value?.toFixed(2)}</span>
                            </div>
                            <div className={styles.modalRow}>
                                <span className={styles.modalLabel}>Ofertas Especiais</span>
                                <span className={styles.modalValue}>R$ {selectedReport.special_offering_value?.toFixed(2)}</span>
                            </div>
                            <div className={styles.modalRow} style={{ borderTop: '2px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                                <span className={styles.modalLabel} style={{ fontWeight: 700, color: 'var(--foreground)' }}>TOTAL ARRECADADO</span>
                                <span className={styles.modalValue} style={{ fontSize: '1.2rem', color: '#16a34a' }}>
                                    R$ {((selectedReport.carnet_value || 0) + (selectedReport.service_offering_value || 0) + (selectedReport.special_offering_value || 0)).toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {selectedReport.observations && (
                            <div className="mt-6 p-4 bg-slate-50 rounded-lg text-sm text-slate-600 italic">
                                "{selectedReport.observations}"
                            </div>
                        )}

                        <div className="mt-8 flex justify-end">
                            <Button onClick={() => setSelectedReport(null)}>Fechar</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
