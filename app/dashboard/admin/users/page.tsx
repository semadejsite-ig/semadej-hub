'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Button } from '@/components/ui/Button';
import styles from './page.module.css';
import { Check, Edit2, ShieldAlert, UserCheck, Users } from 'lucide-react';

type UserProfile = {
    id: string;
    full_name: string;
    role: string;
    congregation_id: string;
    phone: string;
    approved: boolean;
    congregations?: { name: string; sector: string };
};

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [congregations, setCongregations] = useState<{ id: string, name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'pending' | 'approved'>('pending');

    // Edit Modal State
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
    const [editFormData, setEditFormData] = useState({ role: '', congregation_id: '' });
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchUsers();
        fetchCongregations();
    }, []);

    const fetchCongregations = async () => {
        const { data } = await supabase.from('congregations').select('id, name').order('name');
        if (data) setCongregations(data);
    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select(`
                    *,
                    congregations (name, sector)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
            alert('Erro ao carregar usuários.');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (userId: string) => {
        const confirmApprove = window.confirm("Deseja aprovar este usuário?");
        if (!confirmApprove) return;

        try {
            // MOCK MODE
            if (localStorage.getItem('mock_session')) {
                setUsers(prev => prev.map(u => u.id === userId ? { ...u, approved: true } : u));
                alert("Usuário aprovado! (Mock)");
                return;
            }

            const { error } = await supabase
                .from('profiles')
                .update({ approved: true })
                .eq('id', userId);

            if (error) throw error;

            // Update local state
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, approved: true } : u));
            alert("Usuário aprovado com sucesso!");

        } catch (error) {
            console.error(error);
            alert("Erro ao aprovar usuário.");
        }
    };

    const openEditModal = (user: UserProfile) => {
        setEditingUser(user);
        setEditFormData({
            role: user.role,
            congregation_id: user.congregation_id
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        setSaving(true);

        try {
            // MOCK MODE
            if (localStorage.getItem('mock_session')) {
                await new Promise(r => setTimeout(r, 1000));
                setUsers(prev => prev.map(u => u.id === editingUser.id ? {
                    ...u,
                    role: editFormData.role,
                    congregation_id: editFormData.congregation_id,
                    // Mock update of joined data for immediate feedback
                    congregations: {
                        name: congregations.find(c => c.id === editFormData.congregation_id)?.name || 'N/A',
                        sector: '?' // Can't easily mock sector update without full fetch
                    }
                } : u));
                setIsEditModalOpen(false);
                alert("Usuário atualizado (Mock)");
                return;
            }

            const { error } = await supabase
                .from('profiles')
                .update({
                    role: editFormData.role,
                    congregation_id: editFormData.congregation_id
                })
                .eq('id', editingUser.id);

            if (error) throw error;

            await fetchUsers(); // Refresh to get updated joined data (Sector/Name)
            setIsEditModalOpen(false);
            alert("Usuário atualizado com sucesso!");

        } catch (error) {
            console.error(error);
            alert("Erro ao atualizar usuário.");
        } finally {
            setSaving(false);
        }
    };

    const filteredUsers = users.filter(u => {
        if (filter === 'pending') return !u.approved;
        return u.approved;
    });

    const pendingCount = users.filter(u => !u.approved).length;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Gestão de Usuários</h1>
                    <p className={styles.subtitle}>Aprove novos cadastros e gerencie a equipe.</p>
                </div>
                <Button variant="outline" onClick={fetchUsers}>
                    Atualizar
                </Button>
            </div>

            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${filter === 'pending' ? styles.activeTab : ''}`}
                    onClick={() => setFilter('pending')}
                >
                    Pendentes
                    {pendingCount > 0 && <span className={`${styles.badge} ${filter === 'pending' ? styles.badgeActive : ''}`}>{pendingCount}</span>}
                </button>
                <button
                    className={`${styles.tab} ${filter === 'approved' ? styles.activeTab : ''}`}
                    onClick={() => setFilter('approved')}
                >
                    Aprovados
                </button>
            </div>

            <div className={styles.card}>
                {loading ? (
                    <div className={styles.loading}>Carregando...</div>
                ) : (
                    <div className={styles.tableContainer}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Usuário</th>
                                    <th>Congregação</th>
                                    <th>Setor</th>
                                    <th>Perfil</th>
                                    <th>Contato</th>
                                    <th style={{ textAlign: 'right' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className={styles.emptyState}>
                                            {filter === 'pending' ? (
                                                <>
                                                    <UserCheck size={48} className="mx-auto mb-2 text-slate-300" />
                                                    <p>Nenhuma aprovação pendente.</p>
                                                </>
                                            ) : (
                                                <p>Nenhum usuário encontrado.</p>
                                            )}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map(user => (
                                        <tr key={user.id}>
                                            <td>
                                                <div className={styles.userInfo}>
                                                    <span className={styles.userName}>{user.full_name}</span>
                                                    {/* In a real app we would join with auth.users to get email, 
                                                        or store email in profiles. For now assuming full_name/phone is primary identity 
                                                    */}
                                                </div>
                                            </td>
                                            <td>
                                                <span className="font-medium text-slate-700">{user.congregations?.name || 'N/A'}</span>
                                            </td>
                                            <td>
                                                <span className="text-sm text-slate-500">Setor {user.congregations?.sector || '-'}</span>
                                            </td>
                                            <td>
                                                <span className={`${styles.roleBadge} ${styles[`role_${user.role}`]}`}>
                                                    {user.role === 'sector_pastor' ? 'Pastor Setorial' :
                                                        user.role === 'sector_agent' ? 'Agente Setorial' :
                                                            user.role}
                                                </span>
                                            </td>
                                            <td>{user.phone}</td>
                                            <td>
                                                <div className={styles.actions}>
                                                    {!user.approved && (
                                                        <button
                                                            className={styles.btnApprove}
                                                            onClick={() => handleApprove(user.id)}
                                                            title="Aprovar Usuário"
                                                        >
                                                            <Check size={14} /> Aprovar
                                                        </button>
                                                    )}
                                                    <button
                                                        className={styles.btnEdit}
                                                        title="Editar Cadastro"
                                                        onClick={() => openEditModal(user)}
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* EDIT MODAL */}
            {isEditModalOpen && editingUser && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Editar Usuário</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className={styles.closeBtn}>&times;</button>
                        </div>

                        <p className="text-sm text-gray-500 mb-4">Editando: <strong>{editingUser.full_name}</strong></p>

                        <form onSubmit={handleUpdateUser}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Perfil de Acesso</label>
                                <select
                                    className={styles.select}
                                    value={editFormData.role}
                                    onChange={e => setEditFormData({ ...editFormData, role: e.target.value })}
                                >
                                    <option value="agent">Agente Missionário</option>
                                    <option value="coordinator">Coordenador</option>
                                    <option value="sector_agent">Agente Setorial</option>
                                    <option value="sector_pastor">Pastor Setorial</option>
                                    <option value="pastor">Pastor</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Congregação</label>
                                <select
                                    className={styles.select}
                                    value={editFormData.congregation_id}
                                    onChange={e => setEditFormData({ ...editFormData, congregation_id: e.target.value })}
                                >
                                    <option value="">Selecione...</option>
                                    {congregations.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
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
