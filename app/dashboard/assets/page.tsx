'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Search, Plus, Archive, History, CheckCircle, AlertTriangle } from 'lucide-react';
import styles from './page.module.css';

// Types
interface Asset {
    id: string;
    name: string;
    code: string;
    category: string;
    status: 'available' | 'loaned' | 'maintenance' | 'lost';
    condition: string;
}

interface Loan {
    id: string;
    asset: Asset;
    agent: { full_name: string; phone: string };
    loan_date: string;
    expected_return_date: string;
    return_date?: string;
    status: 'active' | 'returned' | 'overdue';
}

export default function AssetsPage() {
    // Tabs & Data State
    const [activeTab, setActiveTab] = useState<'inventory' | 'loans' | 'history'>('inventory');
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loans, setLoans] = useState<Loan[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals State
    const [showAssetModal, setShowAssetModal] = useState(false);
    const [showLoanModal, setShowLoanModal] = useState(false);

    // Forms State
    const [newAsset, setNewAsset] = useState({ name: '', code: '', category: 'Eletrônicos', condition: 'good' });
    const [newLoan, setNewLoan] = useState({ assetId: '', agentId: '', expectedReturn: '' });
    const [agents, setAgents] = useState<{ id: string, full_name: string }[]>([]);

    // Fetch Data
    useEffect(() => {
        fetchData();
        // Always ensure we have assets loaded for the dropdown (even if not on inventory tab)
        if (assets.length === 0) {
            supabase.from('assets').select('*').order('name').then(({ data }) => {
                if (data) setAssets(data);
            });
        }
        // Fetch Agents for dropdown (Only fetch once)
        if (agents.length === 0) {
            supabase.from('profiles').select('id, full_name').neq('full_name', null).order('full_name').then(({ data }) => {
                if (data) setAgents(data);
            });
        }
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'inventory') {
                const { data, error } = await supabase.from('assets').select('*').order('name');
                if (error) throw error;
                if (data) setAssets(data);
            } else if (activeTab === 'loans') {
                // Hint the foreign key using !agent_id to avoid ambiguity
                const { data, error } = await supabase
                    .from('asset_loans')
                    .select('*, asset:assets(*), agent:profiles!agent_id(full_name, phone)')
                    .eq('status', 'active')
                    .order('loan_date', { ascending: false });

                if (error) {
                    console.error('Error fetching loans:', error);
                    throw error;
                }
                if (data) setLoans(data);
            } else {
                // History
                const { data, error } = await supabase
                    .from('asset_loans')
                    .select('*, asset:assets(*), agent:profiles!agent_id(full_name, phone)')
                    .eq('status', 'returned')
                    .order('return_date', { ascending: false })
                    .limit(50);

                if (error) {
                    console.error('Error fetching history:', error);
                    throw error;
                }
                if (data) setLoans(data);
            }
        } catch (err: any) {
            console.error('Fetch error:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAsset = async () => {
        if (!newAsset.name) return alert('Nome é obrigatório');

        const { error } = await supabase.from('assets').insert([newAsset]);
        if (!error) {
            setShowAssetModal(false);
            setNewAsset({ name: '', code: '', category: 'Eletrônicos', condition: 'good' });
            fetchData();
            alert('Item cadastrado!');
        } else {
            alert('Erro ao cadastrar: ' + error.message);
        }
    };

    const handleCreateLoan = async () => {
        if (!newLoan.assetId || !newLoan.agentId) return alert('Selecione item e agente.');

        const { error } = await supabase.from('asset_loans').insert([{
            asset_id: newLoan.assetId,
            agent_id: newLoan.agentId,
            expected_return_date: newLoan.expectedReturn || null,
            status: 'active' // Explicitly set status to ensure visibility
        }]);

        if (!error) {
            setShowLoanModal(false);
            setNewLoan({ assetId: '', agentId: '', expectedReturn: '' });
            fetchData();
            alert('Empréstimo registrado!');
        } else {
            alert('Erro ao registrar empréstimo: ' + error.message);
        }
    };

    const handleReturn = async (loanId: string, assetId: string) => {
        const { error } = await supabase
            .from('asset_loans')
            .update({
                status: 'returned',
                return_date: new Date().toISOString()
            })
            .eq('id', loanId);

        if (!error) {
            fetchData();
            alert('Item devolvido com sucesso!');
        } else {
            alert('Erro na devolução: ' + error.message);
        }
    };

    const availableAssets = assets.filter(a => a.status === 'available');

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>📦 Controle de Patrimônio</h1>
                    <p className={styles.subtitle}>Gerencie inventário, empréstimos e devoluções</p>
                </div>

                {/* Custom Tabs */}
                <div className={styles.tabs}>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'inventory' ? styles.tabBtnActive : ''}`}
                        onClick={() => setActiveTab('inventory')}
                    >
                        Inventário
                    </button>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'loans' ? styles.tabBtnActive : ''}`}
                        onClick={() => setActiveTab('loans')}
                    >
                        Empréstimos Ativos
                    </button>
                    <button
                        className={`${styles.tabBtn} ${activeTab === 'history' ? styles.tabBtnActive : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        Histórico
                    </button>
                </div>
            </header>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className={styles.content}>

                    {/* --- INVENTORY TAB --- */}
                    {activeTab === 'inventory' && (
                        <>
                            <div className={styles.actionsBar}>
                                <div className="relative w-full max-w-sm">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <Input
                                        placeholder="Buscar por nome ou código..."
                                        className="pl-10 border-0 shadow-none focus-visible:ring-0"
                                    />
                                </div>
                                <Button onClick={() => setShowAssetModal(true)} className="gap-2">
                                    <Plus size={18} /> Novo Item
                                </Button>
                            </div>

                            <div className={styles.tableContainer}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Nome do Item</th>
                                            <th>Patrimônio</th>
                                            <th>Categoria</th>
                                            <th>Status</th>
                                            <th>Condição</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {assets.map(asset => (
                                            <tr key={asset.id}>
                                                <td className="font-semibold text-slate-700">{asset.name}</td>
                                                <td className="font-mono text-xs text-slate-500">{asset.code || 'S/N'}</td>
                                                <td>{asset.category}</td>
                                                <td>
                                                    <span className={`${styles.badge} ${asset.status === 'available' ? 'bg-emerald-100 text-emerald-700' :
                                                        asset.status === 'loaned' ? 'bg-indigo-100 text-indigo-700' : 'bg-rose-100 text-rose-700'
                                                        }`}>
                                                        {asset.status === 'available' ? 'Disponível' :
                                                            asset.status === 'loaned' ? 'Emprestado' : asset.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className={`w-2 h-2 rounded-full ${asset.condition === 'new' ? 'bg-green-500' : asset.condition === 'good' ? 'bg-blue-500' : 'bg-amber-500'}`} />
                                                        {asset.condition === 'new' ? 'Novo' : asset.condition === 'good' ? 'Bom' : asset.condition}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {assets.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="text-center p-8 text-slate-400">
                                                    <Archive className="mx-auto mb-2 opacity-50" size={32} />
                                                    Nenhum item cadastrado.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {/* --- LOANS TAB --- */}
                    {activeTab === 'loans' && (
                        <>
                            <div className={styles.actionsBar}>
                                <h3 className="font-bold text-slate-600 pl-2">
                                    <span className="text-primary">{loans.length}</span> Itens Emprestados
                                </h3>
                                <Button onClick={() => setShowLoanModal(true)} className="gap-2">
                                    <Plus size={18} /> Novo Empréstimo
                                </Button>
                            </div>

                            <div className={styles.cardGrid}>
                                {loans.map(loan => {
                                    const isOverdue = new Date(loan.expected_return_date) < new Date();
                                    const initials = loan.agent?.full_name
                                        ? loan.agent.full_name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
                                        : '??';

                                    return (
                                        <div key={loan.id} className={styles.card}>
                                            <div className={styles.cardHeader}>
                                                <div className={styles.cardTitle}>{loan.asset?.name}</div>
                                                <span className={styles.cardBadge}>
                                                    {loan.asset?.code || 'S/N'}
                                                </span>
                                            </div>

                                            <div className={styles.cardBody}>
                                                {/* Agent Info with Avatar */}
                                                <div className={styles.agentSection}>
                                                    <div className={styles.avatar}>{initials}</div>
                                                    <div className={styles.agentInfo}>
                                                        <span className={styles.agentName}>{loan.agent?.full_name}</span>
                                                        <span className={styles.agentRole}>{loan.agent?.phone || 'Sem telefone'}</span>
                                                    </div>
                                                </div>

                                                {/* Dates Timeline */}
                                                <div className={styles.timeline}>
                                                    <div className={styles.dateGroup}>
                                                        <span className={styles.dateLabel}>Retirada</span>
                                                        <span className={styles.dateValue}>
                                                            {new Date(loan.loan_date).toLocaleDateString('pt-BR')}
                                                        </span>
                                                    </div>
                                                    <div className={styles.timelineDivider} />
                                                    <div className={styles.dateGroup}>
                                                        <span className={styles.dateLabel}>Devolução</span>
                                                        <span className={`${styles.dateValue} ${isOverdue ? styles.overdue : ''}`}>
                                                            {new Date(loan.expected_return_date).toLocaleDateString('pt-BR')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className={styles.cardFooter}>
                                                <Button
                                                    variant="outline"
                                                    className={styles.returnBtn}
                                                    onClick={() => handleReturn(loan.id, loan.asset.id)}
                                                >
                                                    <CheckCircle size={16} className="mr-2" />
                                                    Confirmar Devolução
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {loans.length === 0 && (
                                    <div className="col-span-full text-center p-12 text-slate-400 bg-white rounded-xl border border-dashed">
                                        <CheckCircle className="mx-auto mb-3 opacity-50" size={40} />
                                        Todos os itens estão no estoque.
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* --- HISTORY TAB --- */}
                    {activeTab === 'history' && (
                        <div className={styles.tableContainer}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th>Quem usou</th>
                                        <th>Retirada</th>
                                        <th>Devolução</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loans.map(loan => (
                                        <tr key={loan.id}>
                                            <td className="font-medium text-slate-700">{loan.asset?.name}</td>
                                            <td>{loan.agent?.full_name}</td>
                                            <td className="text-slate-500">{new Date(loan.loan_date).toLocaleDateString('pt-BR')}</td>
                                            <td className="text-slate-500">{loan.return_date ? new Date(loan.return_date).toLocaleDateString('pt-BR') : '-'}</td>
                                            <td>
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    <History size={12} /> Devolvido
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* --- MODAL: NEW ASSET --- */}
            {showAssetModal && (
                <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && setShowAssetModal(false)}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Novo Item de Patrimônio</h2>
                            <button onClick={() => setShowAssetModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">
                                &times;
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Nome do Item</label>
                                <Input
                                    placeholder="Ex: Bandeira do Brasil, Projetor Epson..."
                                    value={newAsset.name}
                                    onChange={e => setNewAsset({ ...newAsset, name: e.target.value })}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Código / Patrimônio</label>
                                <Input
                                    placeholder="Ex: PAT-001"
                                    value={newAsset.code}
                                    onChange={e => setNewAsset({ ...newAsset, code: e.target.value })}
                                />
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Categoria</label>
                                    <select
                                        className={styles.select}
                                        value={newAsset.category}
                                        onChange={e => setNewAsset({ ...newAsset, category: e.target.value })}
                                    >
                                        <option>Eletrônicos</option>
                                        <option>Móveis</option>
                                        <option>Bandeiras</option>
                                        <option>Brinquedos</option>
                                        <option>Instrumentos</option>
                                        <option>Documentos</option>
                                        <option>Outros</option>
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Condição</label>
                                    <select
                                        className={styles.select}
                                        value={newAsset.condition}
                                        onChange={e => setNewAsset({ ...newAsset, condition: e.target.value })}
                                    >
                                        <option value="new">Novo</option>
                                        <option value="good">Bom</option>
                                        <option value="fair">Regular</option>
                                        <option value="poor">Ruim</option>
                                        <option value="broken">Manutenção</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <Button variant="ghost" onClick={() => setShowAssetModal(false)}>Cancelar</Button>
                            <Button onClick={handleCreateAsset}>Cadastrar Item</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL: NEW LOAN --- */}
            {showLoanModal && (
                <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && setShowLoanModal(false)}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Registrar Saída (Empréstimo)</h2>
                            <button onClick={() => setShowLoanModal(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">
                                &times;
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3">
                                <AlertTriangle className="text-blue-600 shrink-0 mt-0.5" size={18} />
                                <p className="text-sm text-blue-800">
                                    Ao confirmar, o item mudará o status para <strong>Emprestado</strong> e ficará associado ao agente até a devolução.
                                </p>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Selecione o Item (Disponíveis)</label>
                                <select
                                    className={styles.select}
                                    value={newLoan.assetId}
                                    onChange={e => setNewLoan({ ...newLoan, assetId: e.target.value })}
                                >
                                    <option value="">Selecione um item...</option>
                                    {availableAssets.length > 0 ? (
                                        availableAssets.map(a => <option key={a.id} value={a.id}>{a.name} ({a.code || 'S/N'})</option>)
                                    ) : (
                                        <option disabled>Nenhum item disponível</option>
                                    )}
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Agente Responsável</label>
                                <select
                                    className={styles.select}
                                    value={newLoan.agentId}
                                    onChange={e => setNewLoan({ ...newLoan, agentId: e.target.value })}
                                >
                                    <option value="">Selecione quem vai levar...</option>
                                    {agents.map(agent => (
                                        <option key={agent.id} value={agent.id}>{agent.full_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>Previsão de Devolução</label>
                                <Input
                                    type="date"
                                    value={newLoan.expectedReturn}
                                    onChange={e => setNewLoan({ ...newLoan, expectedReturn: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <Button variant="ghost" onClick={() => setShowLoanModal(false)}>Cancelar</Button>
                            <Button onClick={handleCreateLoan}>Confirmar Empréstimo</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
