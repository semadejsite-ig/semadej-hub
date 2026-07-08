'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Button } from '@/components/ui/Button';
import { Search, QrCode, User, AlertCircle, Copy, X, FileText } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import styles from './page.module.css';

type Congregation = {
    id: string;
    name: string;
    sector: string;
};

type Profile = {
    id: string;
    full_name: string;
    role: string;
    phone: string;
};

type NewConvert = {
    id: string;
    full_name: string;
    phone: string;
    phone_home: string | null;
    email: string | null;
    gender: 'M' | 'F' | null;
    marital_status: string | null;
    birth_date: string | null;
    address: string | null;
    neighborhood: string | null;
    reference_point: string | null;
    city: string | null;
    state: string | null;
    decision_location: string | null;
    decision_date: string;
    first_decision: boolean | null;
    invited_by: string | null;
    time_away: string | null;
    wants_visitation: boolean;
    notes: string | null;
    registered_by: string | null;
    status: 'pending' | 'in_progress' | 'integrated' | 'inactive';
    created_at: string;
    congregation_id: string;
    congregations?: {
        name: string;
        sector: string;
    };
    volunteer_id: string | null;
    volunteer?: {
        full_name: string;
    };
    
    // Acompanhamento fields
    first_contact_date?: string | null;
    first_contact_by?: string | null;
    first_visit_date?: string | null;
    first_visit_by?: string | null;
    discipleship_start_date?: string | null;
    discipleship_by?: string | null;
    current_situation?: string | null;
};

export default function DecisoesPage() {
    const [congregations, setCongregations] = useState<Congregation[]>([]);
    const [newConverts, setNewConverts] = useState<NewConvert[]>([]);
    const [volunteers, setVolunteers] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    
    // UI state
    const [selectedQrCong, setSelectedQrCong] = useState<Congregation | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [selectedConvertDetails, setSelectedConvertDetails] = useState<NewConvert | null>(null);

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError('');
        try {
            // Check mock session
            const isMock = localStorage.getItem('mock_session') === 'true';
            if (isMock) {
                mockData();
                return;
            }

            // 1. Get User Profile and Role details
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setError('Usuário não autenticado.');
                setLoading(false);
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (!profile) {
                setError('Perfil não encontrado.');
                setLoading(false);
                return;
            }

            // 2. Fetch Congregations based on Role access
            let congQuery = supabase.from('congregations').select('id, name, sector').order('name');

            if (profile.role === 'agent' || profile.role === 'pastor') {
                // local view
                congQuery = congQuery.eq('id', profile.congregation_id);
            } else if (profile.role === 'sector_agent' || profile.role === 'sector_pastor') {
                // sector view
                const { data: leadCong } = await supabase
                    .from('congregations')
                    .select('sector')
                    .eq('id', profile.congregation_id)
                    .single();
                if (leadCong) {
                    congQuery = congQuery.eq('sector', leadCong.sector);
                }
            } else if (profile.role !== 'admin') {
                setError('Você não tem permissão para visualizar esta página.');
                setLoading(false);
                return;
            }

            const { data: congData, error: congErr } = await congQuery;
            if (congErr) throw congErr;
            setCongregations(congData || []);

            // 3. Fetch New Converts (RLS will filter automatically, but we apply explicit order)
            const convertsQuery = supabase
                .from('new_converts')
                .select('*, congregations(name, sector), volunteer:volunteer_id(full_name)')
                .order('created_at', { ascending: false });

            const { data: convertsData, error: convertsErr } = await convertsQuery;
            if (convertsErr) throw convertsErr;
            setNewConverts(convertsData || []);

            // 4. Fetch volunteers
            const { data: volunteerData, error: volunteerErr } = await supabase
                .from('profiles')
                .select('id, full_name, role, phone')
                .eq('role', 'volunteer')
                .order('full_name');

            if (volunteerErr) throw volunteerErr;
            setVolunteers(volunteerData || []);

        } catch (err) {
            console.error('Error loading decisions page:', err);
            const msg = err instanceof Error ? err.message : 'Erro ao carregar dados.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const mockData = () => {
        const mockCongs = [
            { id: '1', name: 'Congregação Central', sector: '1' },
            { id: '2', name: 'Congregação Bairro Novo', sector: '1' },
            { id: '3', name: 'Congregação Vila Esperança', sector: '2' }
        ];
        setCongregations(mockCongs);

        setNewConverts([
            {
                id: 'c1',
                full_name: 'Maria Rodrigues',
                phone: '11988887777',
                phone_home: '1133334444',
                email: 'maria@email.com',
                gender: 'F',
                marital_status: 'Casada',
                birth_date: '1985-05-12',
                address: 'Rua das Palmeiras, 45',
                neighborhood: 'Centro',
                reference_point: 'Ao lado da farmácia',
                city: 'São José dos Campos',
                state: 'SP',
                decision_location: 'Igreja',
                decision_date: '2026-07-07',
                first_decision: true,
                invited_by: 'Catarina Santos',
                time_away: null,
                wants_visitation: true,
                notes: 'Aceitou a Jesus no culto de jovens. Muito tocada pelo louvor.',
                registered_by: 'Diácono Paulo',
                status: 'pending',
                created_at: new Date().toISOString(),
                congregation_id: '1',
                congregations: { name: 'Congregação Central', sector: '1' },
                volunteer_id: null
            },
            {
                id: 'c2',
                full_name: 'Thiago Silva Santos',
                phone: '11977776666',
                phone_home: null,
                email: null,
                gender: 'M',
                marital_status: 'Solteiro',
                birth_date: '1998-10-25',
                address: 'Av das Flores, 880',
                neighborhood: 'Parque Industrial',
                reference_point: 'Atrás do posto Shell',
                city: 'São José dos Campos',
                state: 'SP',
                decision_location: 'Residência',
                decision_date: '2026-07-05',
                first_decision: false,
                invited_by: 'Presbítero João',
                time_away: '5 anos',
                wants_visitation: true,
                notes: 'Reconciliação no culto doméstico familiar.',
                registered_by: 'Obreiro Thiago',
                status: 'in_progress',
                created_at: new Date(Date.now() - 172800000).toISOString(),
                congregation_id: '2',
                congregations: { name: 'Congregação Bairro Novo', sector: '1' },
                volunteer_id: 'v1',
                volunteer: { full_name: 'Gabriel Fernandes' }
            }
        ]);

        setVolunteers([
            { id: 'v1', full_name: 'Gabriel Fernandes', role: 'volunteer', phone: '11911112222' },
            { id: 'v2', full_name: 'Sarah Carvalho', role: 'volunteer', phone: '11922223333' }
        ]);

        setLoading(false);
    };

    const handleAssignVolunteer = async (convertId: string, volunteerId: string) => {
        try {
            const vId = volunteerId || null;
            const isMock = localStorage.getItem('mock_session') === 'true';
            
            if (!isMock) {
                const { error: updateErr } = await supabase
                    .from('new_converts')
                    .update({ 
                        volunteer_id: vId,
                        status: vId ? 'in_progress' : 'pending'
                    })
                    .eq('id', convertId);
                
                if (updateErr) throw updateErr;
            }

            // Update UI state
            const matchedVolunteer = volunteers.find(v => v.id === volunteerId);
            setNewConverts(prev => prev.map(nc => {
                if (nc.id === convertId) {
                    return { 
                        ...nc,
                        volunteer_id: vId,
                        status: vId ? 'in_progress' : 'pending',
                        volunteer: matchedVolunteer ? { full_name: matchedVolunteer.full_name } : undefined
                    };
                }
                return nc;
            }));

        } catch (err) {
            console.error('Error assigning volunteer:', err);
            const msg = err instanceof Error ? err.message : 'Erro desconhecido';
            alert('Erro ao alocar voluntário: ' + msg);
        }
    };

    const handleStatusChange = async (convertId: string, newStatus: NewConvert['status']) => {
        try {
            const isMock = localStorage.getItem('mock_session') === 'true';
            if (!isMock) {
                const { error: updateErr } = await supabase
                    .from('new_converts')
                    .update({ status: newStatus })
                    .eq('id', convertId);
                
                if (updateErr) throw updateErr;
            }

            setNewConverts(prev => prev.map(nc => {
                if (nc.id === convertId) {
                    return { ...nc, status: newStatus };
                }
                return nc;
            }));

        } catch (err) {
            console.error('Error updating status:', err);
            const msg = err instanceof Error ? err.message : 'Erro desconhecido';
            alert('Erro ao atualizar status: ' + msg);
        }
    };

    const getQrUrl = (congId: string) => {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        return `${origin}/decisao/${congId}`;
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const filteredConverts = newConverts.filter(nc =>
        nc.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (nc.congregations?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className={styles.loading}>Carregando painel de decisões...</div>;
    }

    if (error) {
        return (
            <div className={styles.errorContainer}>
                <AlertCircle size={40} className="text-red-500" />
                <p className="mt-4">{error}</p>
                <Button onClick={loadData} className="mt-4">Recarregar</Button>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Fichas de Decisão</h1>
                    <p className={styles.subtitle}>
                        Gerencie os links de cadastros por congregação e aloque voluntários para novos convertidos.
                    </p>
                </div>
            </header>

            {/* SEÇÃO 1: LINKS E QR CODES POR CONGREGAÇÃO */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>1. Links e QRs de Fichas de Decisão</h2>
                <div className={styles.congsGrid}>
                    {congregations.map(cong => {
                        const formLink = getQrUrl(cong.id);
                        const isCopied = copiedId === cong.id;

                        return (
                            <div key={cong.id} className={styles.congCard}>
                                <div className={styles.congCardHeader}>
                                    <h3 className={styles.congName}>{cong.name}</h3>
                                    <span className={styles.sectorBadge}>Setor {cong.sector}</span>
                                </div>
                                <p className={styles.congDesc}>
                                    Divulgue o link ou exiba o QR code na recepção para preenchimento.
                                </p>
                                <div className={styles.congCardActions}>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => copyToClipboard(formLink, cong.id)}
                                        className={styles.actionBtn}
                                    >
                                        <Copy size={14} />
                                        {isCopied ? 'Copiado!' : 'Copiar Link'}
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => setSelectedQrCong(cong)}
                                        className={styles.actionBtn}
                                    >
                                        <QrCode size={14} />
                                        Ver QR Code
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* SEÇÃO 2: LISTAGEM DE DECISÕES */}
            <section className={styles.section}>
                <div className={styles.listHeader}>
                    <h2 className={styles.sectionTitle}>2. Novos Convertidos Cadastrados</h2>
                    <div className={styles.searchWrapper}>
                        <Search size={18} className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou congregação..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>
                </div>

                {filteredConverts.length === 0 ? (
                    <div className={styles.emptyState}>
                        <User size={32} className="text-slate-400" />
                        <p className="mt-2 text-slate-500 font-medium">Nenhum novo convertido encontrado.</p>
                    </div>
                ) : (
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Contato</th>
                                    <th>Congregação</th>
                                    <th>Data Decisão</th>
                                    <th>Status</th>
                                    <th>Voluntário / Discipulador</th>
                                    <th>Ficha Física</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredConverts.map(convert => (
                                    <tr key={convert.id}>
                                        <td>
                                            <span className="font-semibold text-slate-800">{convert.full_name}</span>
                                        </td>
                                        <td>
                                            <span className="text-slate-600 font-medium">{convert.phone}</span>
                                        </td>
                                        <td>
                                            <span className="font-medium text-slate-700">{convert.congregations?.name}</span>
                                        </td>
                                        <td>
                                            <span className="text-sm text-slate-500">{formatDate(convert.decision_date)}</span>
                                        </td>
                                        <td>
                                            <select
                                                value={convert.status}
                                                onChange={(e) => handleStatusChange(convert.id, e.target.value as NewConvert['status'])}
                                                className={`${styles.statusSelect} ${styles[`status_${convert.status}`]}`}
                                            >
                                                <option value="pending">Pendente</option>
                                                <option value="in_progress">Em Acompanhamento</option>
                                                <option value="integrated">Integrado (Membro)</option>
                                                <option value="inactive">Afastado</option>
                                            </select>
                                        </td>
                                        <td>
                                            <select
                                                value={convert.volunteer_id || ''}
                                                onChange={(e) => handleAssignVolunteer(convert.id, e.target.value)}
                                                className={styles.volunteerSelect}
                                            >
                                                <option value="">-- Sem Voluntário --</option>
                                                {volunteers.map(v => (
                                                    <option key={v.id} value={v.id}>
                                                        {v.full_name}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSelectedConvertDetails(convert)}
                                                className={styles.viewDetailsBtn}
                                            >
                                                <FileText size={14} /> Espelho
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* MODAL: EXIBIÇÃO DE QR CODE LOCAL */}
            {selectedQrCong && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>QR Code - {selectedQrCong.name}</h3>
                            <button onClick={() => setSelectedQrCong(null)} className={styles.closeBtn}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className={styles.modalBodyQr}>
                            <div className={styles.qrWrapper}>
                                <QRCodeSVG value={getQrUrl(selectedQrCong.id)} size={200} />
                            </div>
                            <p className="text-sm text-slate-500 text-center max-w-xs">
                                Imprima ou exiba na recepção. O leitor abrirá a <strong>Ficha de Decisão</strong> diretamente para esta congregação.
                            </p>
                            <span className={styles.qrLink}>{getQrUrl(selectedQrCong.id)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: DETALHES COMPLETOS DA FICHA DE DECISÃO */}
            {selectedConvertDetails && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContentDetails}>
                        <div className={styles.modalHeader}>
                            <div className="flex items-center gap-2">
                                <FileText className="text-sky-500" />
                                <h3 className={styles.modalTitle}>Ficha de Decisão - Espelho Físico</h3>
                            </div>
                            <button onClick={() => setSelectedConvertDetails(null)} className={styles.closeBtn}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className={styles.modalBodyDetails}>
                            {/* DADOS CADASTRAIS */}
                            <div className={styles.detailsGroup}>
                                <h4 className={styles.detailsGroupTitle}>Identificação</h4>
                                <div className={styles.detailsGrid}>
                                    <div><strong>Nome:</strong> {selectedConvertDetails.full_name}</div>
                                    <div><strong>Sexo:</strong> {selectedConvertDetails.gender || 'Não Informado'}</div>
                                    <div><strong>Estado Civil:</strong> {selectedConvertDetails.marital_status || 'Não Informado'}</div>
                                    <div><strong>Data Nascimento:</strong> {selectedConvertDetails.birth_date ? formatDate(selectedConvertDetails.birth_date) : 'Não Informada'}</div>
                                </div>
                            </div>

                            <div className={styles.detailsGroup}>
                                <h4 className={styles.detailsGroupTitle}>Contato & Endereço</h4>
                                <div className={styles.detailsGrid}>
                                    <div><strong>Celular (WhatsApp):</strong> {selectedConvertDetails.phone}</div>
                                    <div><strong>Fone Residencial:</strong> {selectedConvertDetails.phone_home || 'Não Informado'}</div>
                                    <div><strong>E-mail:</strong> {selectedConvertDetails.email || 'Não Informado'}</div>
                                    <div style={{ gridColumn: 'span 2' }}><strong>Endereço:</strong> {selectedConvertDetails.address || 'Não Informado'}</div>
                                    <div><strong>Bairro:</strong> {selectedConvertDetails.neighborhood || 'Não Informado'}</div>
                                    <div><strong>Ponto de Referência:</strong> {selectedConvertDetails.reference_point || 'Não Informado'}</div>
                                    <div><strong>Cidade:</strong> {selectedConvertDetails.city || 'Não Informada'} ({selectedConvertDetails.state || 'UF'})</div>
                                </div>
                            </div>

                            <div className={styles.detailsGroup}>
                                <h4 className={styles.detailsGroupTitle}>Detalhes da Decisão</h4>
                                <div className={styles.detailsGrid}>
                                    <div><strong>Data da Decisão:</strong> {formatDate(selectedConvertDetails.decision_date)}</div>
                                    <div><strong>Local da Decisão:</strong> {selectedConvertDetails.decision_location || 'Igreja'}</div>
                                    <div><strong>Primeira vez que aceita?</strong> {selectedConvertDetails.first_decision === true ? 'Sim, nunca foi crente' : selectedConvertDetails.first_decision === false ? 'Não, estava afastado' : 'Não Informado'}</div>
                                    {selectedConvertDetails.first_decision === false && (
                                        <div><strong>Tempo afastado:</strong> {selectedConvertDetails.time_away || '-'}</div>
                                    )}
                                    <div><strong>Convidado por:</strong> {selectedConvertDetails.invited_by || 'Ninguém'}</div>
                                    <div><strong>Deseja receber visitas?</strong> {selectedConvertDetails.wants_visitation ? 'Sim' : 'Não'}</div>
                                    <div><strong>Anotado por:</strong> {selectedConvertDetails.registered_by || '-'}</div>
                                </div>
                            </div>

                            {selectedConvertDetails.notes && (
                                <div className={styles.detailsGroup}>
                                    <h4 className={styles.detailsGroupTitle}>Observações</h4>
                                    <p className={styles.notesTextPrint}>{selectedConvertDetails.notes}</p>
                                </div>
                            )}

                            {/* DADOS DO ACOMPANHAMENTO DO VOLUNTÁRIO */}
                            <div className={styles.detailsGroup} style={{ borderLeft: '4px solid #10b981', paddingLeft: '0.75rem' }}>
                                <h4 className={styles.detailsGroupTitle} style={{ color: '#10b981' }}>Histórico do Acompanhamento Spiritual</h4>
                                <div className={styles.detailsGrid}>
                                    <div><strong>Status Atual:</strong> {convertStatusLabel(selectedConvertDetails.status)}</div>
                                    <div><strong>Voluntário Alocado:</strong> {selectedConvertDetails.volunteer?.full_name || 'Nenhum'}</div>
                                </div>
                                <div className={`${styles.detailsGrid} mt-2`}>
                                    <div><strong>1º Contato:</strong> {selectedConvertDetails.first_contact_date ? formatDate(selectedConvertDetails.first_contact_date) : '-'} ({selectedConvertDetails.first_contact_by || '-'})</div>
                                    <div><strong>1ª Visita:</strong> {selectedConvertDetails.first_visit_date ? formatDate(selectedConvertDetails.first_visit_date) : '-'} ({selectedConvertDetails.first_visit_by || '-'})</div>
                                    <div><strong>Início Discipulado:</strong> {selectedConvertDetails.discipleship_start_date ? formatDate(selectedConvertDetails.discipleship_start_date) : '-'} ({selectedConvertDetails.discipleship_by || '-'})</div>
                                    <div><strong>Situação:</strong> {selectedConvertDetails.current_situation || 'Pendente de Acompanhamento'}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function convertStatusLabel(status: string) {
    switch (status) {
        case 'pending': return 'Pendente';
        case 'in_progress': return 'Em Acompanhamento';
        case 'integrated': return 'Integrado (Membro)';
        case 'inactive': return 'Afastado';
        default: return status;
    }
}
