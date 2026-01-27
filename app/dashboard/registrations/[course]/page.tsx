'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import {
    User,
    Mail,
    Phone,
    Calendar,
    Search,
    Filter,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import styles from './page.module.css'; // We'll assume a shared CSS or create one

interface Registration {
    id: string;
    full_name: string;
    email: string;
    phone: string;
    course_type: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
}

export default function RegistrationListPage() {
    const params = useParams();
    const router = useRouter();
    const courseType = typeof params.course === 'string' ? params.course.toUpperCase() : 'PAM';

    const [loading, setLoading] = useState(true);
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            // 1. Mock Mode Check
            if (typeof window !== 'undefined' && localStorage.getItem('mock_session') === 'true') {
                // Mock Data
                setRegistrations([
                    { id: '1', full_name: 'João Silva', email: 'joao@email.com', phone: '11999999999', course_type: courseType, status: 'pending', created_at: new Date().toISOString() },
                    { id: '2', full_name: 'Maria Oliveira', email: 'maria@email.com', phone: '11988888888', course_type: courseType, status: 'approved', created_at: new Date(Date.now() - 86400000).toISOString() },
                    { id: '3', full_name: 'Carlos Souza', email: 'carlos@email.com', phone: '11977777777', course_type: courseType, status: 'rejected', created_at: new Date(Date.now() - 172800000).toISOString() },
                ]);
                setLoading(false);
                return;
            }

            // Security check: Only Admin/Coordinator
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

            if (!['admin', 'coordinator'].includes(profile?.role || '')) {
                router.push('/dashboard'); // Unauthorized
                return;
            }

            // Fetch Registrations
            let query = supabase
                .from('registrations')
                .select('*')
                .eq('course_type', courseType)
                .order('created_at', { ascending: false });

            const { data, error } = await query;
            if (error) console.error(error);
            setRegistrations(data || []);
            setLoading(false);
        };

        fetchData();
    }, [courseType, router]);

    const handleUpdateStatus = async (id: string, newStatus: 'approved' | 'rejected' | 'pending') => {
        const { error } = await supabase
            .from('registrations')
            .update({ status: newStatus })
            .eq('id', id);

        if (!error) {
            setRegistrations(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
        }
    };

    const filteredList = registrations.filter(r => {
        const matchesSearch = r.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.email || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === 'all' || r.status === filterStatus;
        return matchesSearch && matchesFilter;
    });

    const getStatusColor = (status: string) => {
        if (status === 'approved') return 'bg-green-100 text-green-700 border-green-200';
        if (status === 'rejected') return 'bg-red-100 text-red-700 border-red-200';
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'; // pending
    };

    const getStatusLabel = (status: string) => {
        if (status === 'approved') return 'Aprovado';
        if (status === 'rejected') return 'Rejeitado';
        return 'Pendente';
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen text-blue-600 font-medium">Carregando candidatos...</div>;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>
                    <User size={32} className="text-blue-600" />
                    Candidatos {courseType}
                </h1>
                <p className={styles.subtitle}>Gerencie as pré-inscrições para o curso.</p>
            </header>

            {/* Controls */}
            <div className={styles.controls}>
                <div className={styles.searchBox}>
                    <Search className={styles.searchIcon} size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou email..."
                        className={styles.searchInput}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className={styles.filterGroup}>
                    <Filter className="text-gray-400" size={20} />
                    <select
                        className={styles.filterSelect}
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                    >
                        <option value="all">Todos os Status</option>
                        <option value="pending">Pendentes</option>
                        <option value="approved">Aprovados</option>
                        <option value="rejected">Rejeitados</option>
                    </select>
                </div>
            </div>

            {/* List */}
            <div className={styles.grid}>
                {filteredList.length === 0 ? (
                    <div className={styles.emptyState}>
                        <User className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                        <h3 className={styles.emptyTitle}>Nenhum candidato encontrado</h3>
                        <p className={styles.emptyText}>Não há registros com os filtros atuais.</p>
                    </div>
                ) : (
                    filteredList.map(item => (
                        <div key={item.id} className={styles.card}>
                            {/* Info */}
                            <div className={styles.cardInfo}>
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className={styles.name}>{item.full_name}</h3>
                                    <span className={`${styles.badge} ${item.status === 'approved' ? styles.statusApproved :
                                        item.status === 'rejected' ? styles.statusRejected :
                                            styles.statusPending
                                        }`}>
                                        {getStatusLabel(item.status)}
                                    </span>
                                </div>
                                <div className={styles.details}>
                                    <div className={styles.detailItem}>
                                        <Mail size={16} />
                                        {item.email || 'Não informado'}
                                    </div>
                                    <div className={styles.detailItem}>
                                        <Phone size={16} />
                                        {item.phone}
                                    </div>
                                    <div className={styles.detailItem}>
                                        <Calendar size={16} />
                                        {new Date(item.created_at).toLocaleDateString('pt-BR')}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className={styles.actions}>
                                {item.status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => handleUpdateStatus(item.id, 'rejected')}
                                            className={`${styles.btn} ${styles.btnReject}`}
                                        >
                                            <XCircle size={16} />
                                            Rejeitar
                                        </button>
                                        <button
                                            onClick={() => handleUpdateStatus(item.id, 'approved')}
                                            className={`${styles.btn} ${styles.btnApprove}`}
                                        >
                                            <CheckCircle2 size={16} />
                                            Aprovar
                                        </button>
                                    </>
                                )}
                                {item.status !== 'pending' && (
                                    <button
                                        onClick={() => handleUpdateStatus(item.id, 'pending')}
                                        className={`${styles.btn} ${styles.btnReset}`}
                                    >
                                        Mudar Status
                                    </button>
                                )}

                                {item.phone && (
                                    <a
                                        href={`https://wa.me/55${item.phone.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={`${styles.btn} ${styles.btnWhatsapp}`}
                                    >
                                        WhatsApp
                                    </a>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
