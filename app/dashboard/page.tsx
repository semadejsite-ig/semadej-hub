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
    ArrowUpRight,
    Trophy,
    Target
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

interface EvangelismSectorStats {
    sector: string;
    total_reached: number;
}

export default function DashboardPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [detailedStats, setDetailedStats] = useState<CongregationStats[]>([]);
    const [monthlyHistory, setMonthlyHistory] = useState<MonthlyHistory[]>([]);
    const [evangelismHistory, setEvangelismHistory] = useState<MonthlyHistory[]>([]);
    const [sectorStats, setSectorStats] = useState<{ sector: string; total_raised: number }[]>([]);
    const [evangelismSectorStats, setEvangelismSectorStats] = useState<EvangelismSectorStats[]>([]);
    const [rpcError, setRpcError] = useState<any>(null);
    const [stats, setStats] = useState({
        totalMembers: 0,
        totalCarnets: 0,
        totalFinancial: 0,
        totalSouls: 0,
        highlightCong: { name: '', scope: '', value: 0 },
        scopeName: ''
    });

    useEffect(() => {
        const loadDashboard = async () => {
            // MOCK MODE CHECK
            if (typeof window !== 'undefined' && localStorage.getItem('mock_session') === 'true') {
                // ... mock ...
                // ...
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            // ... profile fetch ...
            const { data: profile } = await supabase
                .from('profiles')
                .select('*, congregations(name, sector)')
                .eq('id', user.id)
                .single();

            if (!profile) return;
            setUserProfile(profile);

            // Redirect Coordinator to their specific area
            if (profile.role === 'coordinator' || profile.role === 'coordenador') {
                router.replace('/dashboard/registrations/pam');
                return;
            }

            // Fetch Logic based on Role
            let query = supabase.from('congregations').select('id, name, sector, members_count, carnets_count');
            let reportsQuery = supabase.from('monthly_reports').select('congregation_id, report_month, report_year, carnet_value, service_offering_value, special_offering_value');

            // Fetch Sector Stats (Only for Admin/Leadership or Global view)
            if (['admin', 'sector_pastor', 'sector_agent'].includes(profile.role)) {
                try {
                    const { data: sectors, error } = await supabase.rpc('get_sector_financials', { target_year: new Date().getFullYear() });
                    if (error) {
                        console.error('Error fetching sector stats:', error);
                        setRpcError(error);
                    }
                    if (sectors) setSectorStats(sectors);
                } catch (err) {
                    console.error('RPC Call Failed:', err);
                    setRpcError(err);
                }
            }

            if (['sector_agent', 'sector_pastor'].includes(profile.role)) {
                // Filter by Sector
                const sector = profile.congregations?.sector;
                query = query.eq('sector', sector);
            } else if (profile.role === 'agent') {
                query = query.eq('id', profile.congregation_id);
                reportsQuery = reportsQuery.eq('congregation_id', profile.congregation_id);
            }

            const { data: congData } = await query;
            const { data: reports } = await reportsQuery;

            if (congData && reports) {
                // ... (existing processing logic) ...
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

                // 3. Process Evangelism Stats
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

                let evangelismQuery = supabase.from('evangelism_records')
                    .select('*, congregations(name, sector)')
                    .gte('event_date', startOfMonth)
                    .lte('event_date', endOfMonth);

                if (['sector_agent', 'sector_pastor'].includes(profile.role)) {
                    evangelismQuery = evangelismQuery.eq('congregations.sector', profile.congregations?.sector);
                } else if (profile.role === 'agent') {
                    evangelismQuery = evangelismQuery.eq('congregation_id', profile.congregation_id);
                }

                const { data: evangelismData } = await evangelismQuery;

                // Aggregate Souls and find Highlight
                let totalSoulsVal = 0;
                const congEvangelism: Record<string, { name: string, sector: string, total: number }> = {};

                evangelismData?.forEach(rec => {
                    totalSoulsVal += rec.people_reached || 0;
                    if (rec.congregation_id) {
                        if (!congEvangelism[rec.congregation_id]) {
                            congEvangelism[rec.congregation_id] = {
                                name: rec.congregations?.name || '?',
                                sector: rec.congregations?.sector || '?',
                                total: 0
                            };
                        }
                        congEvangelism[rec.congregation_id].total += rec.people_reached || 0;
                    }
                });

                const sortedCongs = Object.values(congEvangelism).sort((a, b) => b.total - a.total);
                const highlight = sortedCongs.length > 0 ? sortedCongs[0] : null;

                setStats({
                    totalMembers: tMembers,
                    totalCarnets: tCarnets,
                    totalFinancial: tMoney,
                    totalSouls: totalSoulsVal,
                    highlightCong: highlight ? { name: highlight.name, scope: `Setor ${highlight.sector}`, value: highlight.total } : { name: '---', scope: 'Nenhuma atividade no mês', value: 0 },
                    scopeName: profile.role === 'admin' ? 'Global' : `Setor ${profile.congregations?.sector || '?'}`
                });

                setDetailedStats(finalStats.sort((a, b) => b.total_raised - a.total_raised));

                // 2. Process Monthly History (Last 6 Months)
                const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
                const historyMap = new Map<string, number>();
                const evHistoryMap = new Map<string, number>();

                reports.forEach(r => {
                    const key = `${r.report_year}-${r.report_month}`;
                    const val = (r.carnet_value || 0) + (r.service_offering_value || 0) + (r.special_offering_value || 0);
                    historyMap.set(key, (historyMap.get(key) || 0) + val);
                });

                // Fetch ALL evangelism records for the last 6 months to build history
                const sixMonthsAgo = new Date();
                sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
                sixMonthsAgo.setDate(1);

                let evHistoryQuery = supabase.from('evangelism_records')
                    .select('event_date, people_reached, congregations(sector)')
                    .gte('event_date', sixMonthsAgo.toISOString().split('T')[0]);

                if (['sector_agent', 'sector_pastor'].includes(profile.role)) {
                    evHistoryQuery = evHistoryQuery.eq('congregations.sector', profile.congregations?.sector);
                } else if (profile.role === 'agent') {
                    evHistoryQuery = evHistoryQuery.eq('congregation_id', profile.congregation_id);
                }

                const { data: evHistoryData } = await evHistoryQuery;

                evHistoryData?.forEach(rec => {
                    const d = new Date(rec.event_date);
                    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
                    evHistoryMap.set(key, (evHistoryMap.get(key) || 0) + (rec.people_reached || 0));
                });

                const history: MonthlyHistory[] = [];
                const evHistory: MonthlyHistory[] = [];
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

                    evHistory.push({
                        month: m,
                        year: y,
                        label: monthNames[m - 1],
                        total: evHistoryMap.get(key) || 0
                    });
                }
                setMonthlyHistory(history);
                setEvangelismHistory(evHistory);

                // 4. Process Evangelism Sector Stats (Current Year)
                if (['admin', 'sector_pastor', 'sector_agent'].includes(profile.role)) {
                    const startOfYear = `${new Date().getFullYear()}-01-01`;
                    const { data: yearEvData } = await supabase.from('evangelism_records')
                        .select('people_reached, congregations(sector)')
                        .gte('event_date', startOfYear);

                    const sectorEvMap: Record<string, number> = {};
                    yearEvData?.forEach(rec => {
                        const congregations = rec.congregations as any;
                        const sec = Array.isArray(congregations) ? congregations[0]?.sector : congregations?.sector;
                        if (sec) {
                            sectorEvMap[sec] = (sectorEvMap[sec] || 0) + (rec.people_reached || 0);
                        }
                    });

                    const evSectors = Object.entries(sectorEvMap).map(([sector, total]) => ({
                        sector,
                        total_reached: total as number
                    })).sort((a, b) => parseInt(a.sector) - parseInt(b.sector));

                    setEvangelismSectorStats(evSectors);
                }
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
    const maxSector = Math.max(...sectorStats.map(s => s.total_raised), 1);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div style={{ zIndex: 2 }}>
                    <h1 className={styles.title}>Painel do Agente</h1>
                    <p className={styles.subtitle}>
                        {userProfile?.full_name?.split(' ')[0]}, aqui está o resumo do desempenho missionário.
                    </p>
                </div>
                <div className={styles.scopeBadge}>
                    {stats.scopeName === 'Global' ? '🌍 Visão Global' : stats.scopeName}
                </div>
            </header>

            <div className={styles.missionGrid}>
                {/* HIGHLIGHT CONGREGATION CARD */}
                <div className={styles.spotlightCard}>
                    <div style={{ zIndex: 2 }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', opacity: 0.8, letterSpacing: '0.05em' }}>
                            Congregação Destaque do Mês
                        </span>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.5rem 0' }}>{stats.highlightCong.name}</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.9 }}>
                            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '0.25rem 0.75rem', borderRadius: '99px', fontSize: '0.75rem' }}>
                                {stats.highlightCong.scope}
                            </span>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right', zIndex: 2 }}>
                        <Trophy size={60} color="#fbbf24" strokeWidth={1.5} />
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.5rem' }}>{stats.highlightCong.value} 🤝</div>
                    </div>
                </div>

                {/* SOULS CARD */}
                <div className={styles.soulCard}>
                    <div style={{ background: '#eff6ff', borderRadius: '12px', color: '#1e3a8a', marginBottom: '0.75rem', padding: '10px' }}>
                        <Target size={24} />
                    </div>
                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Vidas Alcançadas</span>
                    <div className={styles.soulValue}>{stats.totalSouls}</div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Neste período</span>
                </div>
            </div>

            <div className={styles.grid}>
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
                        <div className={`${styles.iconBox} bg-indigo-50 text-indigo-600`}>
                            <Building2 size={24} />
                        </div>
                    </div>
                    <div className="text-sm text-gray-500">
                        <strong>{stats.totalMembers > 0 ? ((stats.totalCarnets / stats.totalMembers) * 100).toFixed(1) : 0}%</strong> adesão
                    </div>
                </div>
            </div>



            {/* EVANGELISM EVOLUTION CHART */}
            <section className={`${styles.rankingSection} mb-8`}>
                <div className={styles.sectionHeader}>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
                            <Target size={24} />
                        </div>
                        <div>
                            <h2 className={styles.sectionTitle}>Evolução Pessoas Abordadas</h2>
                            <p className="text-sm text-gray-500">Últimos 6 meses</p>
                        </div>
                    </div>
                </div>

                <div className={styles.chartContainer}>
                    <div className={styles.chartGrid}>
                        <div className={styles.gridLine}></div>
                        <div className={styles.gridLine}></div>
                        <div className={styles.gridLine}></div>
                        <div className={styles.gridLine}></div>
                        <div className={styles.gridLine}></div>
                    </div>

                    {evangelismHistory.map((item, idx) => {
                        const maxEvHistory = Math.max(...evangelismHistory.map(h => h.total), 1);
                        const heightPercentage = Math.max((item.total / maxEvHistory) * 100, 4);
                        return (
                            <div key={idx} className={styles.chartColumn}>
                                <div className={styles.chartTooltip}>
                                    {item.total} pessoas
                                </div>
                                <div
                                    className={styles.chartBarBg}
                                    style={{ height: `${heightPercentage}%`, backgroundColor: '#dcfce7' }}
                                >
                                    <div className={styles.chartBarFill}
                                        style={{ height: '100%', backgroundColor: '#16a34a' }}>
                                    </div>
                                </div>
                                <div className={styles.chartLabel}>
                                    {item.label}
                                </div>
                                <div className={styles.chartSubLabel}>
                                    {item.year}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* EVANGELISM SECTOR CHART */}
            {evangelismSectorStats.length > 0 && (
                <section className={`${styles.rankingSection} mb-8`}>
                    <div className={styles.sectionHeader}>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                                <Users size={24} />
                            </div>
                            <div>
                                <h2 className={styles.sectionTitle}>Pessoas Abordadas por Setor</h2>
                                <p className="text-sm text-gray-500">Consolidado do Ano Atual</p>
                            </div>
                        </div>
                    </div>

                    <div className={styles.chartContainer}>
                        <div className={styles.chartGrid}>
                            <div className={styles.gridLine}></div>
                            <div className={styles.gridLine}></div>
                            <div className={styles.gridLine}></div>
                            <div className={styles.gridLine}></div>
                            <div className={styles.gridLine}></div>
                        </div>

                        {evangelismSectorStats.map((item, idx) => {
                            const maxEvSector = Math.max(...evangelismSectorStats.map(s => s.total_reached), 1);
                            const heightPercentage = Math.max((item.total_reached / maxEvSector) * 100, 4);
                            return (
                                <div key={idx} className={styles.chartColumn}>
                                    <div className={styles.chartTooltip}>
                                        {item.total_reached} pessoas
                                    </div>
                                    <div
                                        className={styles.chartBarBg}
                                        style={{ height: `${heightPercentage}%`, backgroundColor: '#e0f2fe' }}
                                    >
                                        <div className={styles.chartBarFill}
                                            style={{ height: '100%', background: 'linear-gradient(to top, #0284c7, #38bdf8)' }}>
                                        </div>
                                    </div>
                                    <div className={styles.chartLabel}>
                                        Setor {item.sector}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* MONTHLY FINANCIAL EVOLUTION CHART */}
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

                <div className={styles.chartContainer}>
                    <div className={styles.chartGrid}>
                        <div className={styles.gridLine}></div>
                        <div className={styles.gridLine}></div>
                        <div className={styles.gridLine}></div>
                        <div className={styles.gridLine}></div>
                        <div className={styles.gridLine}></div>
                    </div>

                    {monthlyHistory.map((item, idx) => {
                        const heightPercentage = Math.max((item.total / maxHistory) * 100, 4);
                        return (
                            <div key={idx} className={styles.chartColumn}>
                                <div className={styles.chartTooltip}>
                                    R$ {item.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </div>
                                <div
                                    className={styles.chartBarBg}
                                    style={{ height: `${heightPercentage}%` }}
                                >
                                    <div className={styles.chartBarFill}
                                        style={{ height: '100%' }}>
                                    </div>
                                </div>
                                <div className={styles.chartLabel}>
                                    {item.label}
                                </div>
                                <div className={styles.chartSubLabel}>
                                    {item.year}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* SECTOR FINANCIAL CHART */}
            {sectorStats.length > 0 && (
                <section className={`${styles.rankingSection} mb-8`}>
                    <div className={styles.sectionHeader}>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 text-orange-700 rounded-lg">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <h2 className={styles.sectionTitle}>Arrecadação por Setor</h2>
                                <p className="text-sm text-gray-500">Consolidado do Ano Atual</p>
                            </div>
                        </div>
                    </div>

                    <div className={styles.chartContainer}>
                        <div className={styles.chartGrid}>
                            <div className={styles.gridLine}></div>
                            <div className={styles.gridLine}></div>
                            <div className={styles.gridLine}></div>
                            <div className={styles.gridLine}></div>
                            <div className={styles.gridLine}></div>
                        </div>

                        {sectorStats.map((item, idx) => {
                            const heightPercentage = Math.max((item.total_raised / maxSector) * 100, 4);
                            return (
                                <div key={idx} className={styles.chartColumn}>
                                    <div className={styles.chartTooltip}>
                                        R$ {item.total_raised.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </div>
                                    <div
                                        className={styles.chartBarBg}
                                        style={{ height: `${heightPercentage}%` }}
                                    >
                                        {/* Orange Fill for Sectors */}
                                        <div className={styles.chartBarFill}
                                            style={{ height: '100%', background: 'linear-gradient(to top, #f97316, #fb923c)' }}>
                                        </div>
                                    </div>
                                    <div className={styles.chartLabel}>
                                        Setor {item.sector}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}
        </div>
    );
}
