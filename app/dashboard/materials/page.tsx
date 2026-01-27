'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Button } from '@/components/ui/Button';
import { AlertCircle, CheckCircle, Package, Clock, XCircle, Search } from 'lucide-react';
import styles from './page.module.css';

interface Request {
    id: string;
    item_type: string;
    quantity: number;
    desired_date: string;
    reason: string;
    status: 'pending' | 'approved' | 'delivered' | 'rejected';
    created_at: string;
    profile?: { full_name: string; role: string; phone?: string };
}

export default function MaterialsPage() {
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState<Request[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);

    // Form State
    const [newItem, setNewItem] = useState({
        item_type: 'Folhetos',
        quantity: 100,
        desired_date: '',
        reason: ''
    });

    useEffect(() => {
        checkUser();
        fetchRequests();
    }, []);

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
            setIsAdmin(profile?.role === 'admin');
        }
    };

    // Helper for Role Translation
    const getRoleLabel = (role?: string) => {
        switch (role) {
            case 'admin': return 'Administrador';
            case 'agent': return 'Agente Missionário';
            case 'sector_agent': return 'Agente Setorial';
            case 'pastor': return 'Pastor';
            case 'sector_pastor': return 'Pastor Setorial';
            default: return role || '-';
        }
    };

    const fetchRequests = async () => {
        setLoading(true);
        // Admin sees all (with profile info), User sees own
        const { data, error } = await supabase
            .from('material_requests')
            .select('*, profile:profiles(full_name, role, phone)')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setRequests(data);
        }
        setLoading(false);
    };

    // ... (keep handleCreate and handleStatusUpdate as is) ...


    const handleCreate = async () => {
        // 1. Validate Date (Must be >= 30 days from today)
        const today = new Date();
        const minDate = new Date();
        minDate.setDate(today.getDate() + 29); // 30 days including today roughly, let's be strict

        const selectedDate = new Date(newItem.desired_date);

        if (selectedDate < minDate) {
            alert('A data desejada deve ser com no mínimo 30 dias de antecedência.');
            return;
        }

        if (newItem.quantity <= 0) {
            alert('Quantidade inválida.');
            return;
        }

        const { error } = await supabase.from('material_requests').insert([{
            item_type: newItem.item_type,
            quantity: newItem.quantity,
            desired_date: newItem.desired_date,
            reason: newItem.reason
        }]);

        if (!error) {
            alert('Solicitação enviada com sucesso!');
            setNewItem({ item_type: 'Folhetos', quantity: 100, desired_date: '', reason: '' });
            fetchRequests();
        } else {
            alert('Erro ao enviar: ' + error.message);
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        if (!confirm(`Confirmar alteração para: ${newStatus}?`)) return;

        const { error } = await supabase
            .from('material_requests')
            .update({ status: newStatus })
            .eq('id', id);

        if (!error) {
            fetchRequests();
        } else {
            alert('Erro ao atualizar status.');
        }
    };

    // Calculate Min Date for Input
    const getMinDateStr = () => {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        return d.toISOString().split('T')[0];
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>📦 Solicitação de Materiais</h1>
                    <p className={styles.subtitle}>Folhetos, Envelopes e Insumos para Evangelismo</p>
                </div>
            </header>

            {/* --- REQUEST FORM --- */}
            <div className={styles.formCard}>
                <div className={styles.formTitle}>
                    <Package className="text-indigo-600" />
                    Nova Solicitação
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 text-sm text-blue-800 flex items-start gap-3">
                    <Clock size={18} className="shrink-0 mt-0.5" />
                    <p>
                        <strong>Regra de Antecedência:</strong> Solicitações de insumos devem ser feitas com no mínimo
                        <strong> 30 dias de antecedência</strong> para garantir a disponibilidade e entrega.
                    </p>
                </div>

                <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Tipo de Material</label>
                        <select
                            className={styles.select}
                            value={newItem.item_type}
                            onChange={e => setNewItem({ ...newItem, item_type: e.target.value })}
                        >
                            <option>Folhetos</option>
                            <option>Envelopes</option>
                            <option>Bíblias (Doação)</option>
                            <option>Outros</option>
                        </select>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Quantidade</label>
                        <input
                            type="number"
                            className={styles.input}
                            value={newItem.quantity}
                            onChange={e => setNewItem({ ...newItem, quantity: parseInt(e.target.value) })}
                            min={1}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Para quando precisa?</label>
                        <input
                            type="date"
                            className={styles.input}
                            value={newItem.desired_date}
                            min={getMinDateStr()}
                            onChange={e => setNewItem({ ...newItem, desired_date: e.target.value })}
                        />
                    </div>

                    <div className="md:col-span-3">
                        <Button onClick={handleCreate} className="w-full md:w-auto">
                            Enviar Solicitação
                        </Button>
                    </div>
                </div>
            </div>

            {/* --- REQUESTS LIST (ADMIN View vs USER View) --- */}
            <div>
                <div className={styles.listHeader}>
                    <h2 className={styles.listTitle}>Histórico de Solicitações</h2>
                </div>

                <div className={styles.tableContainer}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Data Pedido</th>
                                {isAdmin && <th>Solicitante</th>}
                                <th>Item</th>
                                <th>Qtd.</th>
                                <th>Para Quando</th>
                                <th>Status</th>
                                {isAdmin && <th>Ações</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map(req => (
                                <tr key={req.id}>
                                    <td>{new Date(req.created_at).toLocaleDateString('pt-BR')}</td>
                                    {isAdmin && (
                                        <td>
                                            <div className="font-medium text-slate-700">{req.profile?.full_name}</div>
                                            <div className="text-xs text-slate-400 mb-1">{getRoleLabel(req.profile?.role)}</div>
                                            {req.profile?.phone && (
                                                <a
                                                    href={`https://wa.me/55${req.profile.phone.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-200 hover:bg-green-100 transition-colors"
                                                >
                                                    WhatsApp
                                                </a>
                                            )}
                                        </td>
                                    )}
                                    <td className="font-semibold text-slate-700">{req.item_type}</td>
                                    <td>{req.quantity}</td>
                                    <td>{new Date(req.desired_date).toLocaleDateString('pt-BR')}</td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${styles[req.status]}`}>
                                            {req.status === 'pending' ? 'Pendente' :
                                                req.status === 'approved' ? 'Aprovado' :
                                                    req.status === 'delivered' ? 'Entregue' : 'Recusado'}
                                        </span>
                                    </td>
                                    {isAdmin && req.status === 'pending' && (
                                        <td>
                                            <div className="flex gap-2">
                                                <button
                                                    className={`${styles.actionBtn} ${styles.approveBtn}`}
                                                    title="Aprovar"
                                                    onClick={() => handleStatusUpdate(req.id, 'approved')}
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                                <button
                                                    className={`${styles.actionBtn} ${styles.rejectBtn}`}
                                                    title="Recusar"
                                                    onClick={() => handleStatusUpdate(req.id, 'rejected')}
                                                >
                                                    <XCircle size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                    {isAdmin && req.status === 'approved' && (
                                        <td>
                                            <button
                                                className={`${styles.actionBtn} ${styles.approveBtn}`}
                                                title="Marcar como Entregue"
                                                onClick={() => handleStatusUpdate(req.id, 'delivered')}
                                            >
                                                Marca como Entregue
                                            </button>
                                        </td>
                                    )}
                                    {(!isAdmin || (req.status !== 'pending' && req.status !== 'approved')) && (
                                        <td>-</td>
                                    )}
                                </tr>
                            ))}
                            {requests.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center p-8 text-slate-400">Nenhuma solicitação encontrada.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
