'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Button } from '@/components/ui/Button';
import styles from './page.module.css';
import { Search, Users, Phone, MessageCircle } from 'lucide-react';

type Profile = {
    id: string;
    full_name: string;
    phone: string;
    role: string;
    congregation_id: string;
};

type CongregationStatus = {
    id: string;
    name: string;
    sector: string;
    agent_count: number;
    profiles: Profile[]; // Store all profiles to filtering later
};

export default function VacanciesPage() {
    const [congregations, setCongregations] = useState<CongregationStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Contact Modal State
    const [selectedCongregation, setSelectedCongregation] = useState<CongregationStatus | null>(null);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);

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

            // 2. Fetch ALL profiles for these congregations
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('id, full_name, phone, role, congregation_id');

            if (profileError) throw profileError;

            // 3. Map Data
            const stats = congData.map(cong => {
                const profilesInCong = profileData.filter(p => p.congregation_id === cong.id);
                // Filter only AGENTS for the counter/status
                const agentCount = profilesInCong.filter(p => p.role === 'agent').length;

                return {
                    ...cong,
                    agent_count: agentCount,
                    profiles: profilesInCong // Keep all for the contact modal (pastors included)
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

    const sortedSectors = Object.keys(groupedData).sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.replace(/\D/g, '')) || 0;
        return numA - numB;
    });

    // History State
    const [history, setHistory] = useState<any[]>([]);
    const [historyError, setHistoryError] = useState<string | null>(null);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const openContactModal = async (cong: CongregationStatus) => {
        setSelectedCongregation(cong);
        setIsContactModalOpen(true);
        setLoadingHistory(true);
        setHistory([]);
        setHistoryError(null);

        try {
            const { data, error } = await supabase
                .from('agent_assignments')
                .select(`
                    id,
                    start_date,
                    end_date,
                    reason,
                    agent:agent_id (full_name)
                `)
                .eq('congregation_id', cong.id)
                .order('start_date', { ascending: false });

            if (error) throw error;
            setHistory(data || []);
        } catch (error: any) {
            console.error(error);
            setHistoryError(error.message || 'Erro desconhecido');
        } finally {
            setLoadingHistory(false);
        }
    };

    // Helper to format WhatsApp Link
    const getWhatsAppLink = (phone: string) => {
        if (!phone) return '#';
        const cleanPhone = phone.replace(/\D/g, '');
        return `https://wa.me/55${cleanPhone}`;
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    };

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

                <Button
                    variant="outline"
                    size="sm"
                    className={styles.actionBtn}
                    onClick={() => openContactModal(cong)}
                >
                    Ver Contatos
                    <Phone size={14} className="ml-2" />
                </Button>
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

            {/* CONTACT MODAL */}
            {isContactModalOpen && selectedCongregation && (
                <div className={styles.modalOverlay} onClick={() => setIsContactModalOpen(false)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Contatos - {selectedCongregation.name}</h2>
                            <button onClick={() => setIsContactModalOpen(false)} className={styles.closeBtn}>&times;</button>
                        </div>

                        {/* Pastors Section */}
                        <div className={styles.contactSection}>
                            <h3 className={styles.contactTitle}>Liderança (Pastores)</h3>
                            <div className={styles.contactList}>
                                {selectedCongregation.profiles.filter(p => p.role.includes('pastor')).length > 0 ? (
                                    selectedCongregation.profiles
                                        .filter(p => p.role.includes('pastor'))
                                        .map(pastor => (
                                            <div key={pastor.id} className={styles.contactCard}>
                                                <div className={styles.contactInfo}>
                                                    <span className={styles.contactName}>{pastor.full_name}</span>
                                                    <span className={styles.contactRole}>
                                                        {pastor.role === 'sector_pastor' ? 'Pastor Setorial' : 'Pastor Local'}
                                                    </span>
                                                </div>
                                                {pastor.phone && (
                                                    <a
                                                        href={getWhatsAppLink(pastor.phone)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={styles.whatsappBtn}
                                                    >
                                                        <MessageCircle size={16} />
                                                        WhatsApp
                                                    </a>
                                                )}
                                            </div>
                                        ))
                                ) : (
                                    <p className="text-sm text-gray-500 italic">Nenhum pastor cadastrado nesta congregação.</p>
                                )}
                            </div>
                        </div>

                        {/* Agents Section */}
                        <div className={styles.contactSection}>
                            <h3 className={styles.contactTitle}>Agentes Missionários</h3>
                            <div className={styles.contactList}>
                                {selectedCongregation.profiles.filter(p => p.role === 'agent').length > 0 ? (
                                    selectedCongregation.profiles
                                        .filter(p => p.role === 'agent')
                                        .map(agent => (
                                            <div key={agent.id} className={styles.contactCard}>
                                                <div className={styles.contactInfo}>
                                                    <span className={styles.contactName}>{agent.full_name}</span>
                                                    <span className={styles.contactRole}>Agente Missionário</span>
                                                </div>
                                                {agent.phone && (
                                                    <a
                                                        href={getWhatsAppLink(agent.phone)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={styles.whatsappBtn}
                                                    >
                                                        <MessageCircle size={16} />
                                                        WhatsApp
                                                    </a>
                                                )}
                                            </div>
                                        ))
                                ) : (
                                    <p className="text-sm text-gray-500 italic">Nenhum agente alocado.</p>
                                )}
                            </div>
                        </div>

                        {/* HISTORY SECTION */}
                        <div className={styles.historySection}>
                            <h3 className={styles.contactTitle}>Histórico de Alocação</h3>
                            {loadingHistory ? (
                                <p className="text-sm text-gray-500">Carregando histórico...</p>
                            ) : history.length > 0 ? (
                                <div className={styles.historyList}>
                                    {history.map((record, idx) => {
                                        const isActive = record.end_date === null;
                                        return (
                                            <div key={record.id} className={`${styles.historyItem} ${isActive ? styles.historyActive : ''}`}>
                                                <div className={styles.historyDot}></div>
                                                <div className={styles.historyContent}>
                                                    <span className={styles.historyName}>
                                                        {record.agent?.full_name || 'Usuário Removido'}
                                                        {isActive && <span className={styles.currentBadge}>Atual</span>}
                                                    </span>
                                                    <span className={styles.historyDate}>
                                                        {formatDate(record.start_date)}
                                                        {' → '}
                                                        {record.end_date ? formatDate(record.end_date) : 'Atualmente'}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 italic">Nenhum histórico registrado.</p>
                            )}
                        </div>

                        <div className={styles.modalActions}>
                            <Button onClick={() => setIsContactModalOpen(false)}>
                                Fechar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
