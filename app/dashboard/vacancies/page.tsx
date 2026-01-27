'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from './page.module.css';
import { Search, AlertTriangle, CheckCircle, UserPlus, Users } from 'lucide-react';

type CongregationStatus = {
    id: string;
    name: string;
    sector: string;
    agent_count: number;
};

export default function VacanciesPage() {
    const [congregations, setCongregations] = useState<CongregationStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchCongregations();
    }, []);

    const fetchCongregations = async () => {
        try {
            // 1. Fetch congregations
            const { data: congData, error: congError } = await supabase
                .from('congregations')
                .select('id, name, sector')
                .order('name');

            if (congError) throw congError;

            // 2. Fetch profiles (agents) to count them
            // In a real production app with thousands of rows, we'd use a server-side count or view.
            // For 84 congregations, client-side mapping is fine.
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('congregation_id');

            if (profileError) throw profileError;

            // 3. Calculate status
            const stats = congData.map(cong => {
                const count = profileData.filter(p => p.congregation_id === cong.id).length;
                return {
                    ...cong,
                    agent_count: count
                };
            });

            setCongregations(stats);
        } catch (error) {
            console.error('Error fetching vacancies:', error);
        } finally {
            setLoading(false);
        }
    };

    /* State for grouping */
    const [groupBySector, setGroupBySector] = useState(true);

    const filteredCongregations = congregations.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.sector?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (count: number) => {
        if (count >= 2) return styles.statusGreen;
        if (count === 1) return styles.statusYellow;
        return styles.statusRed;
    };

    // Grouping logic
    const groupedData = filteredCongregations.reduce((acc, cong) => {
        const sector = cong.sector || 'Sem Setor';
        if (!acc[sector]) acc[sector] = [];
        acc[sector].push(cong);
        return acc;
    }, {} as Record<string, CongregationStatus[]>);

    // Sort sectors numerically if possible (Setor 1, Setor 2...)
    const sortedSectors = Object.keys(groupedData).sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.replace(/\D/g, '')) || 0;
        return numA - numB;
    });

    const renderCard = (cong: CongregationStatus) => (
        <div key={cong.id} className={`${styles.card} ${getStatusColor(cong.agent_count)}`}>
            <div className={styles.cardHeader}>
                <h3 className={styles.congName}>{cong.name}</h3>
                {!groupBySector && <span className={styles.sectorBadge}>Setor {cong.sector}</span>}
            </div>

            <div className={styles.cardBody}>
                <div className={styles.agentInfo}>
                    <Users size={16} />
                    <span>{cong.agent_count} / 2 Agentes</span>
                </div>

                {cong.agent_count < 2 && (
                    <Button variant="outline" size="sm" className={styles.actionBtn}>
                        Abrir Vaga
                    </Button>
                )}
            </div>
        </div>
    );

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Mapa de Vagas</h1>
                    <p className={styles.subtitle}>Gerencie a alocação de agentes nas 84 congregações.</p>
                </div>
                <Button>
                    <UserPlus size={20} />
                    Convidar Novo Agente
                </Button>
            </header>

            <div className={styles.filters}>
                <div className={styles.filterLeft}>
                    <div className={styles.searchWrapper}>
                        <Search className={styles.searchIcon} size={20} />
                        <input
                            type="text"
                            placeholder="Buscar congregação..."
                            className={styles.searchInput}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className={styles.toggleWrapper}>
                        <label className={styles.toggleLabel}>
                            <input
                                type="checkbox"
                                checked={groupBySector}
                                onChange={(e) => setGroupBySector(e.target.checked)}
                            />
                            Agrupar por Setor
                        </label>
                    </div>
                </div>

                <div className={styles.legend}>
                    <span className={styles.legendItem}><span className={`${styles.dot} ${styles.bgGreen}`} /> Completo</span>
                    <span className={styles.legendItem}><span className={`${styles.dot} ${styles.bgYellow}`} /> 1 Vaga</span>
                    <span className={styles.legendItem}><span className={`${styles.dot} ${styles.bgRed}`} /> Crítico</span>
                </div>
            </div>

            {loading ? (
                <div className={styles.loading}>Carregando dados...</div>
            ) : (
                <>
                    {filteredCongregations.length === 0 ? (
                        <div className={styles.emptyState}>
                            <Users size={48} />
                            <p>Nenhuma congregação encontrada.</p>
                            {congregations.length === 0 && (
                                <p className={styles.hint}>Cadastre as congregações no banco de dados para ver o status aqui.</p>
                            )}
                        </div>
                    ) : (
                        groupBySector ? (
                            <div className={styles.groupedWrapper}>
                                {sortedSectors.map(sector => (
                                    <section key={sector} className={styles.sectorSection}>
                                        <h2 className={styles.sectorTitle}>Setor {sector}</h2>
                                        <div className={styles.grid}>
                                            {groupedData[sector].map(cong => renderCard(cong))}
                                        </div>
                                    </section>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.grid}>
                                {filteredCongregations.map(cong => renderCard(cong))}
                            </div>
                        )
                    )}
                </>
            )}
        </div>
    );
}
