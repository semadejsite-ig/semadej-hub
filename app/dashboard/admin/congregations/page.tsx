'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import {
    Users,
    Building2,
    Search,
    BarChart3,
    ArrowUpRight,
    Target,
    Edit2
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import styles from './page.module.css';

interface CongregationStat {
    id: string;
    name: string;
    sector: string;
    address: string;
    members_count: number;
    carnets_count: number;
}

export default function AdminCongregationsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [congregations, setCongregations] = useState<CongregationStat[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [totals, setTotals] = useState({
        members: 0,
        carnets: 0,
        participation: 0
    });

    // Edit State
    const [editingCong, setEditingCong] = useState<CongregationStat | null>(null);
    const [editFormData, setEditFormData] = useState({
        name: '',
        sector: '',
        address: '',
        members_count: '',
        carnets_count: ''
    });
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, [router]);

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin' && localStorage.getItem('mock_session') !== 'true') {
            router.push('/dashboard');
            return;
        }

        const { data, error } = await supabase
            .from('congregations')
            .select('id, name, sector, address, members_count, carnets_count')
            .order('name');

        if (error) {
            console.error('Error fetching congregations:', error);
            if (error.code === '42703') {
                alert("Erro de Banco de Dados: Algumas colunas (como 'address') ainda não foram criadas. Por favor, execute o script SQL de atualização.");
            } else {
                alert("Erro ao carregar congregações: " + error.message);
            }
            setLoading(false);
            return;
        }

        if (data) {
            setCongregations(data);

            const tMembers = data.reduce((acc, curr) => acc + (curr.members_count || 0), 0);
            const tCarnets = data.reduce((acc, curr) => acc + (curr.carnets_count || 0), 0);
            const tParticipation = tMembers > 0 ? (tCarnets / tMembers) * 100 : 0;

            setTotals({
                members: tMembers,
                carnets: tCarnets,
                participation: tParticipation
            });
        }
        setLoading(false);
    };

    const filteredCongregations = congregations.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.sector?.toString().includes(searchTerm) ||
        c.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const openEditModal = (cong: CongregationStat) => {
        setEditingCong(cong);
        setEditFormData({
            name: cong.name,
            sector: cong.sector || '',
            address: cong.address || '',
            members_count: cong.members_count?.toString() || '0',
            carnets_count: cong.carnets_count?.toString() || '0'
        });
        setIsEditModalOpen(true);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCong) return;
        setSaving(true);

        try {
            const { error } = await supabase
                .from('congregations')
                .update({
                    name: editFormData.name,
                    sector: editFormData.sector,
                    address: editFormData.address,
                    members_count: parseInt(editFormData.members_count) || 0,
                    carnets_count: parseInt(editFormData.carnets_count) || 0
                })
                .eq('id', editingCong.id);

            if (error) throw error;

            await fetchData();
            setIsEditModalOpen(false);
        } catch (error) {
            console.error(error);
            alert("Erro ao atualizar congregação.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Carregando estatísticas...</div>;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Estatísticas Gerais</h1>
                <p className={styles.subtitle}>Visão consolidada de todas as congregações da SEMADEJ.</p>
            </header>

            {/* TOTALS GRID */}
            <div className={styles.grid}>
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <div>
                            <p className={styles.cardLabel}>Total de Membros</p>
                            <h3 className={styles.cardValue}>{totals.members}</h3>
                        </div>
                        <div className={styles.iconBox} style={{ background: '#eff6ff', color: '#2563eb' }}>
                            <Users size={24} />
                        </div>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <div>
                            <p className={styles.cardLabel}>Total de Carnês</p>
                            <h3 className={styles.cardValue}>{totals.carnets}</h3>
                        </div>
                        <div className={styles.iconBox} style={{ background: '#e0f2fe', color: '#0284c7' }}>
                            <Building2 size={24} />
                        </div>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <div>
                            <p className={styles.cardLabel}>Adesão Média</p>
                            <h3 className={styles.cardValue}>{totals.participation.toFixed(1)}%</h3>
                        </div>
                        <div className={styles.iconBox} style={{ background: '#ecfdf5', color: '#059669' }}>
                            <Target size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* LIST TABLE */}
            <div className={styles.tableCard}>
                <div className={styles.tableHeader}>
                    <div className="flex items-center gap-2">
                        <BarChart3 size={20} className="text-blue-600" />
                        <h3 style={{ fontWeight: 700 }}>Lista de Congregações</h3>
                    </div>
                    <div className={styles.searchContainer}>
                        <Search className={styles.searchIcon} size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou setor..."
                            className={styles.searchInput}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className={styles.tableContent}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Congregação</th>
                                <th>Setor</th>
                                <th style={{ textAlign: 'right' }}>Membros</th>
                                <th style={{ textAlign: 'right' }}>Carnês</th>
                                <th style={{ textAlign: 'center' }}>Adesão (%)</th>
                                <th style={{ textAlign: 'right' }}>Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCongregations.map((cong) => {
                                const rate = (cong.members_count || 0) > 0 ? ((cong.carnets_count || 0) / (cong.members_count || 0)) * 100 : 0;
                                return (
                                    <tr key={cong.id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{cong.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{cong.address || 'Sem endereço'}</div>
                                        </td>
                                        <td>Setor {cong.sector}</td>
                                        <td style={{ textAlign: 'right' }}>{cong.members_count || 0}</td>
                                        <td style={{ textAlign: 'right' }}>{cong.carnets_count || 0}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div className="flex items-center justify-center gap-2">
                                                <span style={{ fontSize: '0.8rem', fontWeight: 700, minWidth: '35px' }}>{rate.toFixed(0)}%</span>
                                                <div style={{ width: '60px', height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                                    <div style={{
                                                        width: `${rate}%`,
                                                        height: '100%',
                                                        background: rate > 50 ? '#10b981' : rate > 20 ? '#3b82f6' : '#f59e0b'
                                                    }}></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button
                                                className={styles.btnEdit}
                                                onClick={() => openEditModal(cong)}
                                                title="Editar Congregação"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredCongregations.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                                        Nenhuma congregação encontrada para "{searchTerm}".
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* EDIT MODAL */}
            {isEditModalOpen && editingCong && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Editar Congregação</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className={styles.closeBtn}>&times;</button>
                        </div>

                        <form onSubmit={handleUpdate}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Nome da Congregação</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={editFormData.name}
                                    onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Setor</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={editFormData.sector}
                                    onChange={e => setEditFormData({ ...editFormData, sector: e.target.value })}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Endereço</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    value={editFormData.address}
                                    onChange={e => setEditFormData({ ...editFormData, address: e.target.value })}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Qtd. Membros</label>
                                    <input
                                        type="number"
                                        className={styles.input}
                                        value={editFormData.members_count}
                                        onChange={e => setEditFormData({ ...editFormData, members_count: e.target.value })}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Qtd. Carnês</label>
                                    <input
                                        type="number"
                                        className={styles.input}
                                        value={editFormData.carnets_count}
                                        onChange={e => setEditFormData({ ...editFormData, carnets_count: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className={styles.modalActions}>
                                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit" isLoading={saving}>
                                    Salvar Alterações
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
