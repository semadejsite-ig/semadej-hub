'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import {
    Search,
    Calendar,
    Users,
    AlertTriangle,
    CheckCircle2,
    Send,
    Trophy,
    Filter
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import styles from './page.module.css';

export default function EvangelismAuditPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalCongregations: 0,
        activeThisMonth: 0,
        inactiveThisMonth: 0,
        totalPeopleReached: 0
    });

    const [auditList, setAuditList] = useState<any[]>([]);
    const [selectedDate, setSelectedDate] = useState(() => {
        const d = new Date();
        return { month: d.getMonth() + 1, year: d.getFullYear() };
    });

    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

    useEffect(() => {
        loadAuditData(selectedDate.month, selectedDate.year);
    }, [selectedDate]);

    const loadAuditData = async (month: number, year: number) => {
        setLoading(true);
        try {
            // 1. Get ALL Congregations and Profiles
            const { data: allCongs } = await supabase.from('congregations').select('id, name, sector').order('name');
            const { data: allProfiles } = await supabase.from('profiles').select('id, full_name, congregation_id');

            // 2. Get Records for the selected month/year
            // Since we use 'date' column in records, we need to filter by range
            const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
            const endDate = new Date(year, month, 0).toISOString().split('T')[0];

            const { data: records } = await supabase
                .from('evangelism_records')
                .select('congregation_id, people_reached')
                .gte('event_date', startDate)
                .lte('event_date', endDate);

            // 3. Process Data
            const activeIds = new Set(records?.map(r => r.congregation_id));
            const outreachMap: Record<string, number> = {};
            records?.forEach(r => {
                outreachMap[r.congregation_id] = (outreachMap[r.congregation_id] || 0) + (r.people_reached || 0);
            });

            const processedList = allCongs?.map(cong => ({
                ...cong,
                isActive: activeIds.has(cong.id),
                peopleReached: outreachMap[cong.id] || 0,
                agent: allProfiles?.find(p => p.congregation_id === cong.id)?.full_name || 'Sem Agente'
            })) || [];

            const activeCount = processedList.filter(c => c.isActive).length;
            const totalReached = records?.reduce((acc, curr) => acc + (curr.people_reached || 0), 0) || 0;

            setStats({
                totalCongregations: allCongs?.length || 0,
                activeThisMonth: activeCount,
                inactiveThisMonth: (allCongs?.length || 0) - activeCount,
                totalPeopleReached: totalReached
            });

            setAuditList(processedList);

        } catch (error) {
            console.error('Error loading audit data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Auditoria de Evangelismo</h1>
                    <p className={styles.subtitle}>Gestão de atividades Missionárias - {monthNames[selectedDate.month - 1]} / {selectedDate.year}</p>
                </div>

                <div className={styles.headerControls}>
                    <select
                        className={styles.select}
                        value={selectedDate.month}
                        onChange={(e) => setSelectedDate(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                    >
                        {monthNames.map((name, i) => (
                            <option key={i} value={i + 1}>{name}</option>
                        ))}
                    </select>
                    <select
                        className={styles.select}
                        value={selectedDate.year}
                        onChange={(e) => setSelectedDate(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                    >
                        <option value={2026}>2026</option>
                        <option value={2025}>2025</option>
                    </select>
                </div>
            </div>

            <div className={styles.grid}>
                <div className={styles.card}>
                    <div className={`${styles.cardIcon}`} style={{ backgroundColor: '#eff6ff', color: '#1d4ed8' }}>
                        <CheckCircle2 size={24} />
                    </div>
                    <div className={styles.cardInfo}>
                        <h3>Ativas</h3>
                        <div className={styles.cardValue}>{stats.activeThisMonth}</div>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={`${styles.cardIcon}`} style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
                        <AlertTriangle size={24} />
                    </div>
                    <div className={styles.cardInfo}>
                        <h3>Inativas</h3>
                        <div className={styles.cardValue}>{stats.inactiveThisMonth}</div>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={`${styles.cardIcon}`} style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                        <Users size={24} />
                    </div>
                    <div className={styles.cardInfo}>
                        <h3>Total Alcance</h3>
                        <div className={styles.cardValue}>{stats.totalPeopleReached}</div>
                    </div>
                </div>
            </div>

            <div className={styles.tableContainer}>
                <div className={styles.tableHeader}>
                    <h2 className={styles.tableTitle}>Status por Congregação</h2>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button variant="outline" size="sm" onClick={() => loadAuditData(selectedDate.month, selectedDate.year)}>
                            Atualizar Dados
                        </Button>
                        <Button size="sm" disabled={stats.inactiveThisMonth === 0}>
                            <Send size={16} style={{ marginRight: '0.5rem' }} /> Notificar Inativas
                        </Button>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Congregação</th>
                                <th>Setor</th>
                                <th>Agente Responsável</th>
                                <th>Impacto</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Carregando dados...</td>
                                </tr>
                            ) : auditList.map((cong) => (
                                <tr key={cong.id}>
                                    <td style={{ fontWeight: 600 }}>{cong.name}</td>
                                    <td>{cong.sector}</td>
                                    <td>{cong.agent}</td>
                                    <td style={{ fontWeight: 700 }}>{cong.peopleReached} pessoas</td>
                                    <td>
                                        <span className={`${styles.badge} ${cong.isActive ? styles.activeBadge : styles.inactiveBadge}`}>
                                            {cong.isActive ? 'Ativa' : 'Inativa'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
