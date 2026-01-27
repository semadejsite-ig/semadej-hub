'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import styles from './page.module.css';
import {
    Users,
    Banknote,
    TrendingUp,
    Building2,
    AlertCircle,
    BarChart2,
    CalendarDays,
    ArrowUpRight
} from 'lucide-react';

interface CongregationStats {
    id: string;
    name: string;
    sector: string;
    members_count: number;
    carnets_count: number;
    total_raised: number;
    participation_rate: number;
}

interface MonthlyHistory {
    month: number;
    year: number;
    total: number;
    label: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [detailedStats, setDetailedStats] = useState<CongregationStats[]>([]);
    const [monthlyHistory, setMonthlyHistory] = useState<MonthlyHistory[]>([]);
    const [stats, setStats] = useState({
        totalMembers: 0,
        totalCarnets: 0,
        totalFinancial: 0,
        scopeName: ''
    });

    useEffect(() => {
        const loadDashboard = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('*, congregations(name, sector)')
                .eq('id', user.id)
                .single();

            if (!profile) return;
            setUserProfile(profile);

            // Fetch Logic based on Role
            let query = supabase.from('congregations').select('id, name, sector, members_count, carnets_count');
            let reportsQuery = supabase.from('monthly_reports').select('congregation_id, report_month, report_year, carnet_value, service_offering_value, special_offering_value');

            if (['sector_agent', 'sector_pastor'].includes(profile.role)) {
                // Filter by Sector
                const sector = profile.congregations?.sector;
                query = query.eq('sector', sector);
            } else if (profile.role === 'agent') {
                query = query.eq('id', profile.congregation_id);
                // Reports query is naturally filtered by RLS, but we can be explicit
                reportsQuery = reportsQuery.eq('congregation_id', profile.congregation_id);
            }

            const { data: congData } = await query;
            const { data: reports } = await reportsQuery;

            if (congData && reports) {
                const finalStats: CongregationStats[] = [];
                let tMembers = 0, tCarnets = 0, tMoney = 0;

                // 1. Process Congregations & Totals
                for (const cong of congData) {
                    const congReports = reports.filter(r => r.congregation_id === cong.id);
                    const moneyRaised = congReports.reduce((sum, r) => sum + (r.carnet_value || 0) + (r.service_offering_value || 0) + (r.special_offering_value || 0), 0);

                    finalStats.push({
                        id: cong.id,
                        name: cong.name,
                        sector: cong.sector,
                        members_count: cong.members_count || 0,
                        carnets_count: cong.carnets_count || 0,
                        total_raised: moneyRaised,
                        participation_rate: (cong.members_count > 0) ? ((cong.carnets_count || 0) / cong.members_count) * 100 : 0
                    });

                    tMembers += cong.members_count || 0;
                    tCarnets += cong.carnets_count || 0;
                    tMoney += moneyRaised;
                }

                setStats({
                    totalMembers: tMembers,
                    totalCarnets: tCarnets,
                    totalFinancial: tMoney,
                    scopeName: profile.role === 'admin' ? 'Global' : `Setor ${profile.congregations?.sector || '?'}`
                });

                setDetailedStats(finalStats.sort((a, b) => b.total_raised - a.total_raised));

                // 2. Process Monthly History (Last 6 Months)
                const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
                const historyMap = new Map<string, number>();

                reports.forEach(r => {
                    const key = `${r.report_year}-${r.report_month}`;
                    const val = (r.carnet_value || 0) + (r.service_offering_value || 0) + (r.special_offering_value || 0);
                    historyMap.set(key, (historyMap.get(key) || 0) + val);
                });

                const history: MonthlyHistory[] = [];
                const today = new Date();
                for (let i = 5; i >= 0; i--) {
                    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                    const m = d.getMonth() + 1;
                    const y = d.getFullYear();
                    const key = `${y}-${m}`;

                    history.push({
                        month: m,
                        year: y,
                        label: monthNames[m - 1],
                        total: historyMap.get(key) || 0
                    });
                }
                setMonthlyHistory(history);
            }
            setLoading(false);
        };
        loadDashboard();
    }, [router]);

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen text-blue-600 font-medium">Carregando painel...</div>;
    }

    const maxRaised = detailedStats.length > 0 ? detailedStats[0].total_raised : 1;
    const maxHistory = Math.max(...monthlyHistory.map(h => h.total), 1);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div style={{ zIndex: 2 }}>
                    <h1 className={styles.title}>Painel de Controle</h1>
                    <p className={styles.subtitle}>
                        {userProfile?.full_name?.split(' ')[0]}, aqui está o resumo do desempenho missionário.
                    </p>
                </div>
                <div className={styles.scopeBadge}>
                    {stats.scopeName === 'Global' ? '🌍 Visão Global' : stats.scopeName}
                </div>
            </header>

            <div className={styles.grid}>
                {/* MEMBER CARD */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <div>
                            <span className={styles.cardTitle}>Total de Membros</span>
                            <div className={styles.cardValue}>{stats.totalMembers}</div>
                        </div>
                        <div className={`${styles.iconBox} bg-blue-50 text-blue-600`}>
                            <Users size={24} />
                        </div>
                    </div>
                </div>

                {/* CARNET CARD */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <div>
                            <span className={styles.cardTitle}>Carnês Ativos</span>
                            <div className={styles.cardValue}>{stats.totalCarnets}</div>
                        </div>
                        <div className={`${styles.iconBox} bg-purple-50 text-purple-600`}>
                            <Building2 size={24} />
                        </div>
                    </div>
                    <div className="text-sm text-gray-500">
                        <strong>{stats.totalMembers > 0 ? ((stats.totalCarnets / stats.totalMembers) * 100).toFixed(1) : 0}%</strong> de taxa de adesão
                    </div>
                </div>

                {/* FINANCIAL CARD */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <div>
                            <span className={styles.cardTitle}>Arrecadação Total</span>
                            <div className={`${styles.cardValue} text-green-600`}>
                                R$ {stats.totalFinancial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                        <div className={`${styles.iconBox} bg-green-50 text-green-600`}>
                            <Banknote size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* MONTHLY EVOLUTION CHART */}
            <section className={`${styles.rankingSection} mb-8`}>
                <div className={styles.sectionHeader}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 text-green-700 rounded-lg">
                            <CalendarDays size={24} />
                        </div>
                        <div>
                            <h2 className={styles.sectionTitle}>Evolução de Ofertas</h2>
                            <p className="text-sm text-gray-500">Últimos 6 meses</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-end justify-between h-64 mt-8 gap-4 px-4 bg-white rounded-lg p-4">
                    {monthlyHistory.map((item, idx) => (
                        <div key={idx} className="flex flex-col items-center w-full group relative h-full justify-end">
                            {/* Tooltip */}
                            <div className="absolute -top-8 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>

                            {/* Bar */}
                            <div
                                className="w-full bg-green-100 rounded-t-lg relative group-hover:bg-green-200 transition-all duration-500 overflow-hidden"
                                style={{ height: `${(item.total / maxHistory) * 100}%`, minHeight: '4px' }}
                            >
                                <div
                                    className="absolute bottom-0 left-0 right-0 bg-green-500 rounded-t-lg opacity-80 group-hover:opacity-100 transition-opacity"
                                    style={{ height: '100%' }}
                                ></div>
                            </div>

                            {/* Label */}
                            <div className="mt-3 text-sm font-medium text-gray-600">{item.label}</div>
                            <div className="text-xs text-gray-400">{item.year}</div>
                        </div>
                    ))}
                </div>
            </section>

            {['admin', 'sector_agent', 'sector_pastor'].includes(userProfile?.role || 'none') && (
                <section className={styles.rankingSection}>
                    <div className={styles.sectionHeader}>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                                <BarChart2 size={24} />
                            </div>
                            <div>
                                <h2 className={styles.sectionTitle}>Ranking de Desempenho</h2>
                                <p className="text-sm text-gray-500">Ordenado por arrecadação total</p>
                            </div>
                        </div>
                    </div>

                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th className={styles.th}>Congregação</th>
                                    <th className={styles.th}>Setor</th>
                                    <th className={styles.th}>Adesão ao Carnê</th>
                                    <th className={styles.th}>Membros</th>
                                    <th className={styles.th} style={{ textAlign: 'right' }}>Arrecadação</th>
                                </tr>
                            </thead>
                            <tbody>
                                {detailedStats.map((cong) => (
                                    <tr key={cong.id} className={styles.tr}>
                                        <td className={styles.td}>
                                            {cong.name}
                                        </td>
                                        <td className={styles.td}>
                                            <span className="px-2 py-1 bg-gray-100 rounded text-xs font-semibold text-gray-600">
                                                Setor {cong.sector}
                                            </span>
                                        </td>
                                        <td className={styles.td}>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs font-bold w-8">{cong.participation_rate.toFixed(0)}%</span>
                                                <div className={styles.progressBarBg}>
                                                    <div
                                                        className={styles.progressBarFill}
                                                        style={{
                                                            width: `${cong.participation_rate}%`,
                                                            background: cong.participation_rate > 50 ? '#10b981' : '#f59e0b'
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className={styles.td}>{cong.members_count}</td>
                                        <td className={styles.td} style={{ textAlign: 'right' }}>
                                            R$ {cong.total_raised.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            {/* Visual Bar relative to Max */}
                                            <div style={{
                                                height: '4px',
                                                background: '#3b82f6',
                                                opacity: 0.3,
                                                width: `${(cong.total_raised / maxRaised) * 100}%`,
                                                marginLeft: 'auto',
                                                marginTop: '4px',
                                                borderRadius: '2px'
                                            }}></div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
        </div>
    );
}
