'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { 
    Users, 
    UserCheck, 
    HeartHandshake, 
    AlertCircle, 
    TrendingUp, 
    MapPin, 
    MessageCircle,
    UserX
} from 'lucide-react';
import styles from './page.module.css';

type CongregationStats = {
    id: string;
    name: string;
    sector: string;
    total: number;
    pending: number;
    in_progress: number;
    integrated: number;
    unassigned: number;
};

type VolunteerStats = {
    id: string;
    full_name: string;
    phone: string;
    activeCount: number;
    integratedCount: number;
};

export default function DiscipuladoDashboard() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userProfile, setUserProfile] = useState<{ role: string; congregation_id: string } | null>(null);

    // Global counts
    const [stats, setStats] = useState({
        total: 0,
        inProgress: 0,
        integrated: 0,
        unassigned: 0,
        integrationRate: 0
    });

    // Sub-tables
    const [congregationsList, setCongregationsList] = useState<CongregationStats[]>([]);
    const [volunteersList, setVolunteersList] = useState<VolunteerStats[]>([]);

    useEffect(() => {
        loadDashboardData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        setError('');
        try {
            const isMock = localStorage.getItem('mock_session') === 'true';
            if (isMock) {
                loadMockData();
                return;
            }

            // 1. Get User Profile
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setError('Usuário não autenticado.');
                setLoading(false);
                return;
            }

            const { data: profile, error: profileErr } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileErr || !profile) {
                setError('Erro ao carregar perfil.');
                setLoading(false);
                return;
            }
            setUserProfile(profile);

            // 2. Fetch Congregations based on access
            let congQuery = supabase.from('congregations').select('id, name, sector').order('name');
            if (profile.role === 'agent' || profile.role === 'pastor') {
                congQuery = congQuery.eq('id', profile.congregation_id);
            } else if (profile.role === 'sector_agent' || profile.role === 'sector_pastor') {
                const { data: leadCong } = await supabase
                    .from('congregations')
                    .select('sector')
                    .eq('id', profile.congregation_id)
                    .single();
                if (leadCong) {
                    congQuery = congQuery.eq('sector', leadCong.sector);
                }
            } else if (profile.role !== 'admin' && profile.role !== 'coordinator') {
                setError('Você não tem permissão para visualizar esta página.');
                setLoading(false);
                return;
            }

            const { data: congs, error: congsErr } = await congQuery;
            if (congsErr) throw congsErr;
            const congregationIds = (congs || []).map(c => c.id);

            if (congregationIds.length === 0) {
                setLoading(false);
                return;
            }

            // 3. Fetch New Converts for scope congs
            const { data: converts, error: convertsErr } = await supabase
                .from('new_converts')
                .select('*')
                .in('congregation_id', congregationIds);

            if (convertsErr) throw convertsErr;
            const convertsData = converts || [];

            // 4. Fetch Volunteers
            const { data: vols, error: volsErr } = await supabase
                .from('profiles')
                .select('id, full_name, phone, congregation_id')
                .eq('role', 'volunteer')
                .in('congregation_id', congregationIds);

            if (volsErr) throw volsErr;
            const volunteersData = vols || [];

            // 5. Calculate Metrics
            const total = convertsData.length;
            const inProgress = convertsData.filter(c => c.status === 'in_progress').length;
            const integrated = convertsData.filter(c => c.status === 'integrated').length;
            const unassigned = convertsData.filter(c => !c.volunteer_id).length;
            const integrationRate = total > 0 ? Math.round((integrated / total) * 100) : 0;

            setStats({ total, inProgress, integrated, unassigned, integrationRate });

            // 6. Aggregate by Congregation (for admin/coordinators/setores)
            if (['admin', 'coordinator', 'sector_agent', 'sector_pastor'].includes(profile.role)) {
                const congStats: CongregationStats[] = (congs || []).map(cong => {
                    const cList = convertsData.filter(c => c.congregation_id === cong.id);
                    return {
                        id: cong.id,
                        name: cong.name,
                        sector: cong.sector,
                        total: cList.length,
                        pending: cList.filter(c => c.status === 'pending').length,
                        in_progress: cList.filter(c => c.status === 'in_progress').length,
                        integrated: cList.filter(c => c.status === 'integrated').length,
                        unassigned: cList.filter(c => !c.volunteer_id).length
                    };
                });
                setCongregationsList(congStats);
            }

            // 7. Aggregate by Volunteer (for local pastor/agent view)
            const volStats: VolunteerStats[] = volunteersData.map(vol => {
                const volConverts = convertsData.filter(c => c.volunteer_id === vol.id);
                return {
                    id: vol.id,
                    full_name: vol.full_name,
                    phone: vol.phone || '',
                    activeCount: volConverts.filter(c => c.status === 'in_progress').length,
                    integratedCount: volConverts.filter(c => c.status === 'integrated').length
                };
            });
            setVolunteersList(volStats);

        } catch (err) {
            console.error('Error loading discipulado dashboard:', err);
            setError('Erro ao carregar estatísticas do discipulado.');
        } finally {
            setLoading(false);
        }
    };

    const loadMockData = () => {
        setUserProfile({ role: 'admin', congregation_id: 'mock-cong' });
        setStats({
            total: 58,
            inProgress: 24,
            integrated: 28,
            unassigned: 6,
            integrationRate: 48
        });

        setCongregationsList([
            { id: '1', name: 'SEDE', sector: '1', total: 20, pending: 2, in_progress: 8, integrated: 10, unassigned: 1 },
            { id: '2', name: 'CH. DAS OLIVEIRAS', sector: '4', total: 15, pending: 1, in_progress: 6, integrated: 8, unassigned: 1 },
            { id: '3', name: 'JD. SATÉLITE I', sector: '14', total: 12, pending: 2, in_progress: 5, integrated: 5, unassigned: 2 },
            { id: '4', name: 'PQ. PLANALTO', sector: '2', total: 11, pending: 1, in_progress: 5, integrated: 5, unassigned: 2 }
        ]);

        setVolunteersList([
            { id: 'v1', full_name: 'Gabriel Fernandes (Mock)', phone: '11988887777', activeCount: 4, integratedCount: 6 },
            { id: 'v2', full_name: 'Luciana M. Silva (Mock)', phone: '11977776666', activeCount: 3, integratedCount: 8 },
            { id: 'v3', full_name: 'Thiago Almeida (Mock)', phone: '11966665555', activeCount: 5, integratedCount: 4 },
            { id: 'v4', full_name: 'Sarah Carvalho (Mock)', phone: '11955554444', activeCount: 2, integratedCount: 10 }
        ]);
        setLoading(false);
    };

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Carregando painel analítico...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.errorContainer}>
                <AlertCircle size={24} className="text-red-500" />
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Painel Geral do Discipulado</h1>
                <p className={styles.subtitle}>
                    Visão analítica de acolhimento e integração de novas decisões por Cristo.
                </p>
            </div>

            {/* METRICS CARDS */}
            <div className={styles.metricsGrid}>
                <div className={`${styles.metricCard} ${styles.total}`}>
                    <div className={styles.metricHeader}>
                        <span className={styles.metricTitle}>Novas Decisões</span>
                        <Users size={20} className={styles.metricIcon} />
                    </div>
                    <span className={styles.metricValue}>{stats.total}</span>
                    <span className={styles.metricDesc}>Vidas cadastradas</span>
                </div>

                <div className={`${styles.metricCard} ${styles.pending}`}>
                    <div className={styles.metricHeader}>
                        <span className={styles.metricTitle}>Sem Voluntário</span>
                        <UserX size={20} className={styles.metricIcon} />
                    </div>
                    <span className={styles.metricValue}>{stats.unassigned}</span>
                    <span className={styles.metricDesc}>Aguardando alocação</span>
                </div>

                <div className={`${styles.metricCard} ${styles.inProgress}`}>
                    <div className={styles.metricHeader}>
                        <span className={styles.metricTitle}>Em Acompanhamento</span>
                        <HeartHandshake size={20} className={styles.metricIcon} />
                    </div>
                    <span className={styles.metricValue}>{stats.inProgress}</span>
                    <span className={styles.metricDesc}>Contatos e visitas ativos</span>
                </div>

                <div className={`${styles.metricCard} ${styles.integrated}`}>
                    <div className={styles.metricHeader}>
                        <span className={styles.metricTitle}>Consolidados</span>
                        <UserCheck size={20} className={styles.metricIcon} />
                    </div>
                    <span className={styles.metricValue}>{stats.integrated}</span>
                    <span className={styles.metricDesc}>Integrados na igreja local</span>
                </div>
            </div>

            {/* INTEGRATION RATE CHART */}
            <div className={styles.chartAndGoalSection}>
                <div className={`glass-card ${styles.chartCard}`}>
                    <div className={styles.chartContent}>
                        <div className={styles.progressRingWrapper}>
                            <svg className={styles.progressRing} width="160" height="160">
                                <circle 
                                    className={styles.progressRingBg}
                                    stroke="var(--border)"
                                    strokeWidth="12"
                                    fill="transparent"
                                    r="65"
                                    cx="80"
                                    cy="80"
                                />
                                <circle 
                                    className={styles.progressRingIndicator}
                                    stroke="var(--success)"
                                    strokeWidth="12"
                                    strokeDasharray="408.4"
                                    strokeDashoffset={408.4 - (408.4 * stats.integrationRate) / 100}
                                    strokeLinecap="round"
                                    fill="transparent"
                                    r="65"
                                    cx="80"
                                    cy="80"
                                />
                            </svg>
                            <div className={styles.progressPercentage}>
                                <h2>{stats.integrationRate}%</h2>
                                <span>Integração</span>
                            </div>
                        </div>
                        <div className={styles.chartDetails}>
                            <div className={styles.chartDetailsHeader}>
                                <TrendingUp size={24} className="text-green-500" />
                                <h3>Taxa de Integração Espiritual</h3>
                            </div>
                            <p>
                                Representa a proporção de novas decisões que completaram com sucesso as etapas de contato, visita e consolidação, tornando-se membros ativos das congregações.
                            </p>
                            <div className={styles.legend}>
                                <span className={styles.dotSuccess}></span>
                                <span>{stats.integrated} de {stats.total} vidas consolidadas</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CONGREGATIONAL TABLE (Liderança setorial/geral) */}
            {userProfile && ['admin', 'coordinator', 'sector_agent', 'sector_pastor'].includes(userProfile.role) && (
                <div className={`glass-card ${styles.tableCard}`}>
                    <div className={styles.tableHeader}>
                        <MapPin size={18} />
                        <h3>Acompanhamento por Congregação</h3>
                    </div>
                    <div className={styles.tableResponsive}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Congregação</th>
                                    <th>Setor</th>
                                    <th className="text-center">Total</th>
                                    <th className="text-center text-red-500">Sem Voluntário</th>
                                    <th className="text-center text-blue-500">Em Andamento</th>
                                    <th className="text-center text-green-500">Consolidados</th>
                                </tr>
                            </thead>
                            <tbody>
                                {congregationsList.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center text-gray-500 py-4">
                                            Nenhuma decisão de fé cadastrada na sua jurisdição.
                                        </td>
                                    </tr>
                                ) : (
                                    congregationsList.map(cong => (
                                        <tr key={cong.id}>
                                            <td className="font-semibold">{cong.name}</td>
                                            <td>Setor {cong.sector}</td>
                                            <td className="text-center font-bold">{cong.total}</td>
                                            <td className="text-center font-semibold text-red-600">{cong.unassigned}</td>
                                            <td className="text-center font-semibold text-blue-600">{cong.in_progress}</td>
                                            <td className="text-center font-semibold text-green-600">{cong.integrated}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* VOLUNTEER LIST (Para pastores e liderança local ver os voluntários da sua igreja) */}
            <div className={`glass-card ${styles.tableCard}`}>
                <div className={styles.tableHeader}>
                    <HeartHandshake size={18} />
                    <h3>Equipe de Voluntários do Discipulado</h3>
                </div>
                <div className={styles.tableResponsive}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Nome do Voluntário</th>
                                <th>Telefone / Contato</th>
                                <th className="text-center">Vidas em Acompanhamento</th>
                                <th className="text-center">Vidas Consolidadas</th>
                                <th className="text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {volunteersList.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center text-gray-500 py-4">
                                        Nenhum voluntário de discipulado cadastrado na sua congregação.
                                    </td>
                                </tr>
                            ) : (
                                volunteersList.map(vol => (
                                    <tr key={vol.id}>
                                        <td className="font-semibold">{vol.full_name}</td>
                                        <td>{vol.phone || 'Sem fone'}</td>
                                        <td className="text-center font-bold text-blue-600">{vol.activeCount}</td>
                                        <td className="text-center font-bold text-green-600">{vol.integratedCount}</td>
                                        <td className="text-right">
                                            {vol.phone && (
                                                <a 
                                                    href={`https://wa.me/55${vol.phone.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={styles.whatsappBtn}
                                                >
                                                    <MessageCircle size={16} /> WhatsApp
                                                </a>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
