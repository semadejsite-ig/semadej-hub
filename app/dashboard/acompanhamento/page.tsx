'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
    MessageCircle, 
    Heart, 
    Calendar, 
    Edit2, 
    AlertCircle, 
    ChevronDown, 
    ChevronUp,
    Search,
    CheckCircle2,
    Users
} from 'lucide-react';
import styles from './page.module.css';

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
    congregations?: {
        name: string;
    };
    congregation_id: string;
    volunteer_id: string | null;
    volunteer?: {
        full_name: string;
    } | null;
    
    // Acompanhamento fields
    first_contact_date?: string | null;
    first_contact_by?: string | null;
    first_visit_date?: string | null;
    first_visit_by?: string | null;
    discipleship_start_date?: string | null;
    discipleship_by?: string | null;
    current_situation?: string | null;
};

export default function AcompanhamentoPage() {
    const [myConverts, setMyConverts] = useState<NewConvert[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userRole, setUserRole] = useState<string | null>(null);
    const [volunteers, setVolunteers] = useState<{ id: string; full_name: string }[]>([]);

    // Toggle expanded card to view full details
    const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

    // Search and Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [alertFilter, setAlertFilter] = useState('all');

    // Edit Acompanhamento fields states
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    
    // Temp states for editing
    const [firstContactDate, setFirstContactDate] = useState('');
    const [firstContactBy, setFirstContactBy] = useState('');
    const [firstVisitDate, setFirstVisitDate] = useState('');
    const [firstVisitBy, setFirstVisitBy] = useState('');
    const [discipleshipStartDate, setDiscipleshipStartDate] = useState('');
    const [discipleshipBy, setDiscipleshipBy] = useState('');
    const [situationType, setSituationType] = useState('permanência');
    const [situationText, setSituationText] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        loadMyConverts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadMyConverts = async () => {
        setLoading(true);
        setError('');
        try {
            const isMock = localStorage.getItem('mock_session') === 'true';
            if (isMock) {
                mockData();
                return;
            }

            // 1. Get User
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

            setUserRole(profile.role);

            if (profile.role !== 'volunteer') {
                const { data: volunteerData } = await supabase
                    .from('profiles')
                    .select('id, full_name')
                    .eq('role', 'volunteer')
                    .order('full_name', { ascending: true });
                setVolunteers(volunteerData || []);
            }

            // 2. Fetch converts (Volunteers see only assigned, leaders see all permitted by RLS)
            let query = supabase
                .from('new_converts')
                .select('*, congregations(name), volunteer:volunteer_id(full_name)')
                .order('created_at', { ascending: false });

            if (profile.role === 'volunteer') {
                query = query.eq('volunteer_id', user.id);
            }

            const { data: converts, error: fetchErr } = await query;

            if (fetchErr) throw fetchErr;
            setMyConverts(converts || []);

        } catch (err) {
            console.error('Error loading follow-ups:', err);
            const msg = err instanceof Error ? err.message : 'Erro ao carregar dados.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const mockData = () => {
        setUserRole('admin');
        setVolunteers([
            { id: 'v1', full_name: 'Gabriel Fernandes (Mock)' },
            { id: 'v2', full_name: 'Sarah Carvalho (Mock)' },
            { id: 'v3', full_name: 'Mateus Oliveira (Mock)' }
        ]);
        setMyConverts([
            {
                id: 'c1',
                full_name: 'Maria Rodrigues',
                phone: '(12) 98888-7777',
                phone_home: '(12) 3333-4444',
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
                status: 'in_progress',
                created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
                congregation_id: '1',
                congregations: { name: 'Congregação Central' },
                volunteer_id: 'v1',
                volunteer: { full_name: 'Gabriel Fernandes (Mock)' },
                first_contact_date: '', // No contact logged -> will trigger contact alert
                first_contact_by: '',
                first_visit_date: '',
                first_visit_by: '',
                discipleship_start_date: '',
                discipleship_by: '',
                current_situation: 'permanência'
            },
            {
                id: 'c2',
                full_name: 'Thiago Silva Santos',
                phone: '(12) 97777-6666',
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
                notes: 'Reconciliação no culto doméstico.',
                registered_by: 'Obreiro Thiago',
                status: 'in_progress',
                created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
                congregation_id: '2',
                congregations: { name: 'Congregação Bairro Novo' },
                volunteer_id: 'v1',
                volunteer: { full_name: 'Gabriel Fernandes (Mock)' },
                first_contact_date: '2026-07-06', // Contact made 2 days after creation
                first_contact_by: 'Gabriel Fernandes',
                first_visit_date: '', // No visit logged yet -> more than 7 days since contact -> visit alert
                first_visit_by: '',
                discipleship_start_date: '',
                discipleship_by: '',
                current_situation: 'permanência'
            },
            {
                id: 'c3',
                full_name: 'Arthur Nogueira Prado',
                phone: '(12) 96666-5555',
                phone_home: null,
                email: 'arthur@email.com',
                gender: 'M',
                marital_status: 'Solteiro',
                birth_date: '2001-02-14',
                address: 'Rua das Oliveiras, 11',
                neighborhood: 'Satélite',
                reference_point: 'Frente à praça',
                city: 'São José dos Campos',
                state: 'SP',
                decision_location: 'Vias Públicas',
                decision_date: '2026-07-01',
                first_decision: true,
                invited_by: 'Mário Lopes',
                time_away: null,
                wants_visitation: false,
                notes: 'Decisão no evangelismo de rua.',
                registered_by: 'Gabriel Fernandes',
                status: 'integrated',
                created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
                congregation_id: '1',
                congregations: { name: 'Congregação Central' },
                volunteer_id: 'v1',
                volunteer: { full_name: 'Gabriel Fernandes (Mock)' },
                first_contact_date: '2026-07-02',
                first_contact_by: 'Gabriel Fernandes',
                first_visit_date: '2026-07-03',
                first_visit_by: 'Gabriel Fernandes',
                discipleship_start_date: '2026-07-04',
                discipleship_by: 'Gabriel Fernandes',
                current_situation: 'permanência'
            }
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
                    .update({ volunteer_id: vId })
                    .eq('id', convertId);
                
                if (updateErr) throw updateErr;
            }

            const matchedVolunteer = volunteers.find(v => v.id === volunteerId);
            
            setMyConverts(prev => prev.map(nc => {
                if (nc.id === convertId) {
                    return {
                        ...nc,
                        volunteer_id: vId,
                        volunteer: matchedVolunteer ? { full_name: matchedVolunteer.full_name } : null
                    };
                }
                return nc;
            }));

        } catch (err) {
            console.error('Error assigning volunteer:', err);
            alert('Erro ao associar voluntário.');
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

            setMyConverts(prev => prev.map(nc => {
                if (nc.id === convertId) {
                    return { ...nc, status: newStatus };
                }
                return nc;
            }));

        } catch (err) {
            console.error('Error updating status:', err);
            alert('Erro ao atualizar status.');
        }
    };

    const startEditing = (nc: NewConvert) => {
        setEditingId(nc.id);
        setFirstContactDate(nc.first_contact_date || '');
        setFirstContactBy(nc.first_contact_by || '');
        setFirstVisitDate(nc.first_visit_date || '');
        setFirstVisitBy(nc.first_visit_by || '');
        setDiscipleshipStartDate(nc.discipleship_start_date || '');
        setDiscipleshipBy(nc.discipleship_by || '');
        setNotes(nc.notes || '');

        const sit = nc.current_situation || '';
        if (sit.startsWith('transferência')) {
            setSituationType('transferência');
            setSituationText(sit.replace('transferência para ', ''));
        } else if (sit === 'desistência') {
            setSituationType('desistência');
            setSituationText('');
        } else {
            setSituationType('permanência');
            setSituationText('');
        }
    };

    const handleSaveAcompanhamento = async (convertId: string) => {
        setSaving(true);
        try {
            let finalSituation = situationType;
            if (situationType === 'transferência' && situationText) {
                finalSituation = `transferência para ${situationText}`;
            }

            const isMock = localStorage.getItem('mock_session') === 'true';
            if (!isMock) {
                const { error: updateErr } = await supabase
                    .from('new_converts')
                    .update({
                        first_contact_date: firstContactDate || null,
                        first_contact_by: firstContactBy || null,
                        first_visit_date: firstVisitDate || null,
                        first_visit_by: firstVisitBy || null,
                        discipleship_start_date: discipleshipStartDate || null,
                        discipleship_by: discipleshipBy || null,
                        current_situation: finalSituation || null,
                        notes: notes || null
                    })
                    .eq('id', convertId);
                
                if (updateErr) throw updateErr;
            }

            setMyConverts(prev => prev.map(nc => {
                if (nc.id === convertId) {
                    return {
                        ...nc,
                        first_contact_date: firstContactDate || null,
                        first_contact_by: firstContactBy || null,
                        first_visit_date: firstVisitDate || null,
                        first_visit_by: firstVisitBy || null,
                        discipleship_start_date: discipleshipStartDate || null,
                        discipleship_by: discipleshipBy || null,
                        current_situation: finalSituation || null,
                        notes: notes || null
                    };
                }
                return nc;
            }));

            setEditingId(null);
        } catch (err) {
            console.error('Error saving acompanhamento:', err);
            alert('Erro ao salvar ficha.');
        } finally {
            setSaving(false);
        }
    };

    const getWhatsAppLink = (phone: string) => {
        const cleanPhone = phone.replace(/\D/g, '');
        return `https://wa.me/55${cleanPhone}`;
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    // Calculate Alert Type for a Convert
    const getConvertAlert = (convert: NewConvert) => {
        if (!convert.volunteer_id) {
            return { type: 'unassigned', label: '🚨 Sem Voluntário Alocado', severity: 'error' };
        }

        if (!convert.first_contact_date) {
            // Compare creation date
            const created = new Date(convert.created_at).getTime();
            const elapsedDays = (Date.now() - created) / (1000 * 60 * 60 * 24);
            if (elapsedDays > 3) {
                return { type: 'contact_delay', label: '⚠️ Contato Atrasado (3+ dias)', severity: 'warning' };
            }
            return { type: 'contact_pending', label: '💬 Contato Pendente', severity: 'info' };
        }

        if (!convert.first_visit_date) {
            const contacted = new Date(convert.first_contact_date).getTime();
            const elapsedDays = (Date.now() - contacted) / (1000 * 60 * 60 * 24);
            if (elapsedDays > 7) {
                return { type: 'visit_delay', label: '⚠️ Visita Atrasada (7+ dias)', severity: 'warning' };
            }
            return { type: 'visit_pending', label: '🏡 Visita Pendente', severity: 'info' };
        }

        if (!convert.discipleship_start_date) {
            return { type: 'discipleship_pending', label: '📖 Discipulado Pendente', severity: 'info' };
        }

        return { type: 'integrated', label: '✅ Em Discipulado', severity: 'success' };
    };

    // Calculate progress step (0 to 4)
    const getProgressStep = (convert: NewConvert) => {
        let step = 0;
        if (convert.first_contact_date) step = 1;
        if (convert.first_visit_date) step = 2;
        if (convert.discipleship_start_date) step = 3;
        if (convert.status === 'integrated') step = 4;
        return step;
    };

    // Filters logic
    const filteredConverts = myConverts.filter(convert => {
        // 1. Search term (name, phone or volunteer)
        const matchSearch = convert.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            convert.phone.includes(searchTerm);
        
        // 2. Status filter
        const matchStatus = statusFilter === 'all' || convert.status === statusFilter;

        // 3. Alert filter
        const alertInfo = getConvertAlert(convert);
        const matchAlert = alertFilter === 'all' || 
            (alertFilter === 'delays' && (alertInfo.type === 'contact_delay' || alertInfo.type === 'visit_delay')) ||
            (alertFilter === 'unassigned' && alertInfo.type === 'unassigned') ||
            (alertFilter === 'in_progress' && (alertInfo.type === 'contact_pending' || alertInfo.type === 'visit_pending' || alertInfo.type === 'discipleship_pending')) ||
            (alertFilter === 'integrated' && alertInfo.type === 'integrated');

        return matchSearch && matchStatus && matchAlert;
    });

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Carregando listagem de vidas...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.errorContainer}>
                <AlertCircle size={40} className="text-red-500" />
                <p className="mt-4">{error}</p>
                <Button onClick={loadMyConverts} className="mt-4">Tentar Novamente</Button>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Acompanhamento Discipulado</h1>
                    <p className={styles.subtitle}>
                        Gerencie e registre o progresso de discipulado de cada novo convertido.
                    </p>
                </div>
            </header>

            {/* SEARCH AND FILTERS TOOLBAR */}
            <div className={`glass-card ${styles.filtersToolbar}`}>
                <div className={styles.searchWrapper}>
                    <Search size={18} className={styles.searchIcon} />
                    <input 
                        type="text" 
                        placeholder="Buscar por nome ou WhatsApp..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                </div>

                <div className={styles.filtersGroup}>
                    <div className={styles.filterField}>
                        <label>Status</label>
                        <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className={styles.filterSelect}
                        >
                            <option value="all">Todos os Status</option>
                            <option value="in_progress">Em Acompanhamento</option>
                            <option value="integrated">Consolidado (Membro)</option>
                            <option value="inactive">Afastado / Inativo</option>
                        </select>
                    </div>

                    <div className={styles.filterField}>
                        <label>Alertas</label>
                        <select 
                            value={alertFilter}
                            onChange={(e) => setAlertFilter(e.target.value)}
                            className={styles.filterSelect}
                        >
                            <option value="all">Todos os Acompanhamentos</option>
                            <option value="delays">⚠️ Contatos/Visitas Atrasados</option>
                            <option value="unassigned">🚨 Sem Voluntário</option>
                            <option value="in_progress">💬 Em Andamento</option>
                            <option value="integrated">✅ Discipulado Concluído</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* CARDS LISTING */}
            {filteredConverts.length === 0 ? (
                <div className={styles.emptyState}>
                    <Heart size={48} className={styles.heartIconEmpty} />
                    <h3 className="mt-4 font-bold text-slate-800 text-lg">Nenhum registro encontrado</h3>
                    <p className="text-slate-500 text-sm max-w-sm mt-1">
                        Experimente alterar os filtros de busca ou aguarde a chegada de novas decisões.
                    </p>
                </div>
            ) : (
                <div className={styles.cardsGrid}>
                    {filteredConverts.map(convert => {
                        const isExpanded = expandedCardId === convert.id;
                        const isEditing = editingId === convert.id;
                        const alertInfo = getConvertAlert(convert);
                        const progressStep = getProgressStep(convert);

                        return (
                            <div 
                                key={convert.id} 
                                className={`${styles.convertCard} ${styles[alertInfo.severity]}`}
                            >
                                {/* ALERT HEADER BADGE */}
                                <div className={`${styles.alertBadge} ${styles[alertInfo.severity]}`}>
                                    {alertInfo.label}
                                </div>

                                <div className={styles.cardHeader}>
                                    <div style={{ width: '100%' }}>
                                        <h2 className={styles.name}>{convert.full_name}</h2>
                                        
                                        <div className={styles.metaRow}>
                                            <span className={styles.congregationName}>
                                                <Users size={12} style={{ display: 'inline', marginRight: '4px' }} />
                                                {convert.congregations?.name || 'Congregação'}
                                            </span>
                                            <div className={styles.dateBadge}>
                                                <Calendar size={12} />
                                                <span>Decisão em {formatDate(convert.decision_date)}</span>
                                            </div>
                                        </div>

                                        <div className={styles.volunteerBadge}>
                                            <strong>Voluntário:</strong>{' '}
                                            {userRole !== 'volunteer' ? (
                                                <select
                                                    value={convert.volunteer_id || ''}
                                                    onChange={(e) => handleAssignVolunteer(convert.id, e.target.value)}
                                                    className={styles.volunteerSelect}
                                                >
                                                    <option value="">Nenhum (Não alocado)</option>
                                                    {volunteers.map(v => (
                                                        <option key={v.id} value={v.id}>
                                                            {v.full_name}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                convert.volunteer?.full_name || <span className="text-red-500 font-semibold">Não alocado</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* VISUAL STEPPER (INDICATOR OF LIFE PROGRESS) */}
                                <div className={styles.stepperContainer}>
                                    <div className={styles.stepper}>
                                        <div className={`${styles.step} ${progressStep >= 1 ? styles.stepActive : ''}`}>
                                            <span className={styles.stepNum}>1</span>
                                            <span className={styles.stepText}>Contato</span>
                                        </div>
                                        <div className={`${styles.stepLine} ${progressStep >= 2 ? styles.lineActive : ''}`}></div>
                                        
                                        <div className={`${styles.step} ${progressStep >= 2 ? styles.stepActive : ''}`}>
                                            <span className={styles.stepNum}>2</span>
                                            <span className={styles.stepText}>Visita</span>
                                        </div>
                                        <div className={`${styles.stepLine} ${progressStep >= 3 ? styles.lineActive : ''}`}></div>
                                        
                                        <div className={`${styles.step} ${progressStep >= 3 ? styles.stepActive : ''}`}>
                                            <span className={styles.stepNum}>3</span>
                                            <span className={styles.stepText}>Discipulado</span>
                                        </div>
                                        <div className={`${styles.stepLine} ${progressStep >= 4 ? styles.lineActive : ''}`}></div>
                                        
                                        <div className={`${styles.step} ${progressStep >= 4 ? styles.stepActive : ''}`}>
                                            <span className={styles.stepNum}>4</span>
                                            <span className={styles.stepText}>Membro</span>
                                        </div>
                                    </div>
                                </div>

                                {/* CONTACT & WHATSAPP ACTION */}
                                <div className={styles.contactSection}>
                                    <span className={styles.phoneText}>WhatsApp: <strong>{convert.phone}</strong></span>
                                    <a
                                        href={getWhatsAppLink(convert.phone)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={styles.whatsappBtn}
                                    >
                                        <MessageCircle size={16} /> Falar no WhatsApp
                                    </a>
                                </div>

                                {/* CONTROLS BAR */}
                                <div className={styles.cardControlButtons}>
                                    <button
                                        onClick={() => setExpandedCardId(isExpanded ? null : convert.id)}
                                        className={`${styles.btnAction} ${styles.btnExpand} ${isExpanded ? styles.btnExpandActive : ''}`}
                                    >
                                        {isExpanded ? (
                                            <>Ocultar Ficha <ChevronUp size={14} /></>
                                        ) : (
                                            <>Ver Ficha Completa <ChevronDown size={14} /></>
                                        )}
                                    </button>

                                    {!isEditing && (
                                        <button
                                            onClick={() => startEditing(convert)}
                                            className={`${styles.btnAction} ${styles.btnUpdate}`}
                                        >
                                            <Edit2 size={14} /> Atualizar Ficha
                                        </button>
                                    )}
                                </div>

                                {/* EXPANDED DETAILS */}
                                {isExpanded && (
                                    <div className={styles.expandedSection}>
                                        <h4 className={styles.subSectionTitle}>Dados Pessoais</h4>
                                        <div className={styles.detailGrid} style={{ marginBottom: '1.5rem' }}>
                                            <div><strong>Sexo:</strong> {convert.gender || 'Não informado'}</div>
                                            <div><strong>Estado Civil:</strong> {convert.marital_status || 'Não informado'}</div>
                                            <div><strong>Nascimento:</strong> {convert.birth_date ? formatDate(convert.birth_date) : 'Não informada'}</div>
                                            <div><strong>Fone Fixo:</strong> {convert.phone_home || '-'}</div>
                                            <div style={{ gridColumn: 'span 2' }}><strong>Endereço:</strong> {convert.address || 'Não informado'}</div>
                                            <div><strong>Bairro:</strong> {convert.neighborhood || '-'}</div>
                                            <div><strong>Ponto de Referência:</strong> {convert.reference_point || '-'}</div>
                                            <div><strong>Cidade:</strong> {convert.city || ''} - {convert.state || ''}</div>
                                            <div><strong>Local da Decisão:</strong> {convert.decision_location || 'Igreja'}</div>
                                            <div><strong>Primeira vez?</strong> {convert.first_decision === true ? 'Sim, nunca foi crente' : convert.first_decision === false ? 'Não, estava afastado' : 'Não informado'}</div>
                                            {convert.first_decision === false && (
                                                <div><strong>Tempo afastado:</strong> {convert.time_away || '-'}</div>
                                            )}
                                            <div><strong>Convidado por:</strong> {convert.invited_by || 'Ninguém'}</div>
                                            <div><strong>Deseja visitas?</strong> {convert.wants_visitation ? 'Sim' : 'Não'}</div>
                                            <div><strong>Anotado por:</strong> {convert.registered_by || '-'}</div>
                                        </div>

                                        <h4 className={styles.subSectionTitle}>Acompanhamento Físico</h4>
                                        <div className={styles.viewFlowGrid}>
                                            <div className={styles.flowStatusLine}>
                                                <span className={styles.flowLabel}>1º Contato:</span>
                                                <span className={styles.flowVal}>
                                                    {convert.first_contact_date ? (
                                                        <>
                                                            <CheckCircle2 size={12} className="inline text-green-500 mr-1" />
                                                            {formatDate(convert.first_contact_date)} {convert.first_contact_by && `(${convert.first_contact_by})`}
                                                        </>
                                                    ) : (
                                                        <span className="text-red-500 font-semibold">Pendente</span>
                                                    )}
                                                </span>
                                            </div>
                                            <div className={styles.flowStatusLine}>
                                                <span className={styles.flowLabel}>1ª Visita:</span>
                                                <span className={styles.flowVal}>
                                                    {convert.first_visit_date ? (
                                                        <>
                                                            <CheckCircle2 size={12} className="inline text-green-500 mr-1" />
                                                            {formatDate(convert.first_visit_date)} {convert.first_visit_by && `(${convert.first_visit_by})`}
                                                        </>
                                                    ) : (
                                                        <span className="text-gray-400">Não realizada</span>
                                                    )}
                                                </span>
                                            </div>
                                            <div className={styles.flowStatusLine}>
                                                <span className={styles.flowLabel}>Discipulado:</span>
                                                <span className={styles.flowVal}>
                                                    {convert.discipleship_start_date ? (
                                                        <>
                                                            <CheckCircle2 size={12} className="inline text-green-500 mr-1" />
                                                            {formatDate(convert.discipleship_start_date)} {convert.discipleship_by && `(${convert.discipleship_by})`}
                                                        </>
                                                    ) : (
                                                        <span className="text-gray-400">Não iniciado</span>
                                                    )}
                                                </span>
                                            </div>
                                            <div className={styles.flowStatusLine}>
                                                <span className={styles.flowLabel}>Situação:</span>
                                                <span className={`${styles.flowVal} font-bold text-emerald-600`}>
                                                    {convert.current_situation || 'permanência'}
                                                </span>
                                            </div>
                                            
                                            {convert.notes && (
                                                <div className={styles.notesBoxView}>
                                                    <strong>Histórico / Diário:</strong>
                                                    <p>{convert.notes}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* STATUS AND INTEGRATION FORM (STEPS UPDATER) */}
                                {isEditing && (
                                    <>
                                        <div className={styles.divider}></div>
                                        <div className={styles.discipuladoSection}>
                                            <div className={styles.discipuladoHeader}>
                                                <span className={styles.sectionLabel}>Lançamento de Acompanhamento:</span>
                                            </div>

                                            <div className={styles.editFlowContainer}>
                                                {/* Status de Integração */}
                                                <div className={styles.flowGroup}>
                                                    <h5>Situação do Acompanhamento</h5>
                                                    <div className={styles.grid2}>
                                                        <select
                                                            value={convert.status}
                                                            onChange={(e) => handleStatusChange(convert.id, e.target.value as NewConvert['status'])}
                                                            className={styles.select}
                                                        >
                                                            <option value="in_progress">Em Acompanhamento</option>
                                                            <option value="integrated">Consolidado (Membro)</option>
                                                            <option value="inactive">Afastado / Inativo</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* 1º Contato */}
                                                <div className={styles.flowGroup}>
                                                    <h5>1º Contato</h5>
                                                    <div className={styles.grid2}>
                                                        <Input
                                                            type="date"
                                                            value={firstContactDate}
                                                            onChange={(e) => setFirstContactDate(e.target.value)}
                                                        />
                                                        <Input
                                                            type="text"
                                                            placeholder="Responsável"
                                                            value={firstContactBy}
                                                            onChange={(e) => setFirstContactBy(e.target.value)}
                                                            autoCapitalize="words"
                                                        />
                                                    </div>
                                                </div>

                                                {/* 1ª Visita */}
                                                <div className={styles.flowGroup}>
                                                    <h5>1ª Visita</h5>
                                                    <div className={styles.grid2}>
                                                        <Input
                                                            type="date"
                                                            value={firstVisitDate}
                                                            onChange={(e) => setFirstVisitDate(e.target.value)}
                                                        />
                                                        <Input
                                                            type="text"
                                                            placeholder="Visitante"
                                                            value={firstVisitBy}
                                                            onChange={(e) => setFirstVisitBy(e.target.value)}
                                                            autoCapitalize="words"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Discipulado */}
                                                <div className={styles.flowGroup}>
                                                    <h5>Início do Discipulado</h5>
                                                    <div className={styles.grid2}>
                                                        <Input
                                                            type="date"
                                                            value={discipleshipStartDate}
                                                            onChange={(e) => setDiscipleshipStartDate(e.target.value)}
                                                        />
                                                        <Input
                                                            type="text"
                                                            placeholder="Discipulador"
                                                            value={discipleshipBy}
                                                            onChange={(e) => setDiscipleshipBy(e.target.value)}
                                                            autoCapitalize="words"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Situação Atual */}
                                                <div className={styles.flowGroup}>
                                                    <h5>Status Ficha Física</h5>
                                                    <div className={styles.grid2}>
                                                        <select
                                                            value={situationType}
                                                            onChange={(e) => setSituationType(e.target.value)}
                                                            className={styles.select}
                                                        >
                                                            <option value="permanência">Permanência</option>
                                                            <option value="desistência">Desistência</option>
                                                            <option value="transferência">Transferência para...</option>
                                                        </select>
                                                        {situationType === 'transferência' && (
                                                            <Input
                                                                type="text"
                                                                placeholder="Congregação destino"
                                                                value={situationText}
                                                                onChange={(e) => setSituationText(e.target.value)}
                                                                autoCapitalize="words"
                                                                required
                                                            />
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Observações */}
                                                <div className={styles.flowGroup}>
                                                    <h5>Diário de Acompanhamento</h5>
                                                    <textarea
                                                        className={styles.textarea}
                                                        rows={3}
                                                        placeholder="Comentários sobre contatos, visitas ou discipulado..."
                                                        value={notes}
                                                        onChange={(e) => setNotes(e.target.value)}
                                                        autoCapitalize="sentences"
                                                    />
                                                </div>

                                                <div className={styles.editActions}>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setEditingId(null)}
                                                        disabled={saving}
                                                    >
                                                        Cancelar
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleSaveAcompanhamento(convert.id)}
                                                        isLoading={saving}
                                                    >
                                                        Salvar Marcos
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
