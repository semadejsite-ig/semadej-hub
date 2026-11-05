'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/utils/supabase/client';
import { Button } from '@/components/ui/Button';
import styles from './layout.module.css';
import {
    BarChart3,
    FileText,
    Map,
    LogOut,
    User,
    Users,
    Menu,
    X,
    ShieldAlert,
    Package,
    DollarSign,
    HeartHandshake,
    Heart,
    MapPin,
    Calendar,
    CalendarCheck
} from 'lucide-react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState<{ email?: string | null; role: string } | null>(null);

    const isActive = (href: string) => {
        if (href === '/dashboard') return pathname === '/dashboard';
        return pathname.startsWith(href);
    };

    useEffect(() => {
        // Check active session (Real or Mock)
        const checkSession = async () => {
            // 1. Check Mock Session (Local Storage) - Bypasses Supabase
            const isMock = localStorage.getItem('mock_session');
            if (isMock === 'true') {
                setUser({ email: 'admin@mock.com', role: 'admin' });
                return;
            }

            // 2. Check Real Session (Supabase)
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
            } else {
                // Fetch Profile Role
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();

                setUser({ ...session.user, role: profile?.role || 'agent' });
            }
        };
        checkSession();
    }, [router]);

    const handleLogout = async () => {
        localStorage.removeItem('mock_session');
        await supabase.auth.signOut();
        router.push('/login');
    };

    if (!user) return null; // Or a loading spinner

    return (
        <div className={`${styles.wrapper} genesisTheme`}>
            {/* Mobile Header */}
            <header className={styles.mobileHeader}>
                <button onClick={() => setSidebarOpen(true)} className={styles.menuBtn}>
                    <Menu size={24} />
                </button>
                <span className={styles.brand}>SEMADEJ Online</span>
            </header>

            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
                <div className={styles.sidebarHeader}>
                    <span className={styles.logo}>
                        <span className={styles.logoCross}>✝</span> SEMADEJ Online
                    </span>
                    <button onClick={() => setSidebarOpen(false)} className={styles.closeBtn}>
                        <X size={24} />
                    </button>
                </div>

                <nav className={styles.nav}>
                    {/* 1. PRINCIPAL */}
                    {user.role !== 'coordinator' && user.role !== 'volunteer' && (
                        <Link 
                            href="/dashboard" 
                            className={`${styles.navItem} ${isActive('/dashboard') ? styles.active : ''}`} 
                            onClick={() => setSidebarOpen(false)}
                        >
                            <BarChart3 size={18} />
                            Visão Geral
                        </Link>
                    )}

                    {/* 2. MISSIONÁRIO (Operacional) */}
                    {user.role !== 'coordinator' && user.role !== 'volunteer' && (
                        <>
                            <div className={styles.navDivider}></div>
                            <span className={styles.navSectionTitle}>Missionário</span>

                            <Link 
                                href="/dashboard/report" 
                                className={`${styles.navItem} ${isActive('/dashboard/report') ? styles.active : ''}`} 
                                onClick={() => setSidebarOpen(false)}
                            >
                                <FileText size={18} />
                                Relatório Financeiro
                            </Link>
                            <Link 
                                href="/dashboard/congregation" 
                                className={`${styles.navItem} ${isActive('/dashboard/congregation') ? styles.active : ''}`} 
                                onClick={() => setSidebarOpen(false)}
                            >
                                <Users size={18} />
                                Minha Congregação
                            </Link>
                            <Link 
                                href="/dashboard/materials" 
                                className={`${styles.navItem} ${isActive('/dashboard/materials') ? styles.active : ''}`} 
                                onClick={() => setSidebarOpen(false)}
                            >
                                <Package size={18} />
                                Solicitações
                            </Link>
                            <Link 
                                href="/dashboard/vacancies" 
                                className={`${styles.navItem} ${isActive('/dashboard/vacancies') ? styles.active : ''}`} 
                                onClick={() => setSidebarOpen(false)}
                            >
                                <Map size={18} />
                                Alocação de Agentes
                            </Link>
                            <Link 
                                href="/dashboard/evangelism" 
                                className={`${styles.navItem} ${isActive('/dashboard/evangelism') ? styles.active : ''}`} 
                                onClick={() => setSidebarOpen(false)}
                            >
                                <MapPin size={18} />
                                Evangelismo
                            </Link>
                            <Link 
                                href="/dashboard/pontos" 
                                className={`${styles.navItem} ${isActive('/dashboard/pontos') ? styles.active : ''}`} 
                                onClick={() => setSidebarOpen(false)}
                            >
                                <Map size={18} />
                                Pontos de Pregação
                            </Link>
                            <Link 
                                href="/dashboard/fundo-operacional" 
                                className={`${styles.navItem} ${isActive('/dashboard/fundo-operacional') ? styles.active : ''}`} 
                                onClick={() => setSidebarOpen(false)}
                            >
                                <DollarSign size={18} />
                                Fundo Operacional (R$ 30)
                            </Link>
                        </>
                    )}

                    {/* 3. ADMINISTRATIVO (Gestão) */}
                    {['admin', 'treasurer'].includes(user.role) && (
                        <>
                            <div className={styles.navDivider}></div>
                            <span className={styles.navSectionTitle}>Administrativo</span>

                            <Link 
                                href="/dashboard/treasury" 
                                className={`${styles.navItem} ${isActive('/dashboard/treasury') ? styles.active : ''}`} 
                                onClick={() => setSidebarOpen(false)}
                            >
                                <DollarSign size={18} />
                                Tesouraria
                            </Link>
                            <Link 
                                href="/dashboard/evangelism/audit" 
                                className={`${styles.navItem} ${isActive('/dashboard/evangelism/audit') ? styles.active : ''}`} 
                                onClick={() => setSidebarOpen(false)}
                            >
                                <FileText size={18} />
                                Auditoria de Evangelismo
                            </Link>

                            {user.role === 'admin' && (
                                <>
                                    <Link 
                                        href="/dashboard/admin/users" 
                                        className={`${styles.navItem} ${isActive('/dashboard/admin/users') ? styles.active : ''}`} 
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <ShieldAlert size={18} />
                                        Gestão de Usuários
                                    </Link>
                                    <Link 
                                        key="assets-link" 
                                        href="/dashboard/assets" 
                                        className={`${styles.navItem} ${isActive('/dashboard/assets') ? styles.active : ''}`} 
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <Package size={18} />
                                        Patrimônio
                                    </Link>
                                    <Link 
                                        href="/dashboard/admin/congregations" 
                                        className={`${styles.navItem} ${isActive('/dashboard/admin/congregations') ? styles.active : ''}`} 
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <BarChart3 size={18} />
                                        Estatísticas Gerais
                                    </Link>
                                    <Link 
                                        href="/dashboard/admin/agenda" 
                                        className={`${styles.navItem} ${isActive('/dashboard/admin/agenda') ? styles.active : ''}`} 
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <Calendar size={18} />
                                        Agenda Automática
                                    </Link>
                                </>
                            )}
                        </>
                    )}

                    {/* 4. PROCESSOS SELETIVOS */}
                    {['admin', 'coordinator'].includes(user.role) && (
                        <>
                            <div className={styles.navDivider}></div>
                            <span className={styles.navSectionTitle}>Processos Seletivos</span>
                            <Link 
                                href="/dashboard/registrations/pam" 
                                className={`${styles.navItem} ${isActive('/dashboard/registrations/pam') ? styles.active : ''}`} 
                                onClick={() => setSidebarOpen(false)}
                            >
                                <User size={18} />
                                Candidatos PAM
                            </Link>
                            <Link 
                                href="/dashboard/registrations/libras" 
                                className={`${styles.navItem} ${isActive('/dashboard/registrations/libras') ? styles.active : ''}`} 
                                onClick={() => setSidebarOpen(false)}
                            >
                                <User size={18} />
                                Candidatos LIBRAS
                            </Link>
                        </>
                    )}

                    {/* 5. GERAL (Sem restrição) */}
                    {user.role !== 'volunteer' && (
                        <>
                            <div className={styles.navDivider}></div>
                            <span className={styles.navSectionTitle}>Geral</span>
                            <Link 
                                href="/dashboard/presenca" 
                                className={`${styles.navItem} ${isActive('/dashboard/presenca') ? styles.active : ''}`} 
                                onClick={() => setSidebarOpen(false)}
                            >
                                <CalendarCheck size={18} />
                                Presença nas Reuniões
                            </Link>
                            <Link 
                                href="/dashboard/pedidos" 
                                className={`${styles.navItem} ${isActive('/dashboard/pedidos') ? styles.active : ''}`} 
                                onClick={() => setSidebarOpen(false)}
                            >
                                <HeartHandshake size={18} />
                                Pedidos de Oração
                            </Link>
                        </>
                    )}

                    {/* 6. DISCIPULADO */}
                    {['volunteer', 'admin', 'coordinator', 'pastor', 'sector_agent', 'sector_pastor', 'agent'].includes(user.role) && (
                        <>
                            <div className={styles.navDivider}></div>
                            <span className={styles.navSectionTitle}>Discipulado</span>
                            {user.role !== 'volunteer' && (
                                <>
                                    <Link 
                                        href="/dashboard/decisoes" 
                                        className={`${styles.navItem} ${isActive('/dashboard/decisoes') ? styles.active : ''}`} 
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <FileText size={18} />
                                        Fichas de Decisão
                                    </Link>
                                    <Link 
                                        href="/dashboard/discipulado" 
                                        className={`${styles.navItem} ${isActive('/dashboard/discipulado') ? styles.active : ''}`} 
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <BarChart3 size={18} />
                                        Painel Geral
                                    </Link>
                                </>
                            )}
                            <Link 
                                href="/dashboard/acompanhamento" 
                                className={`${styles.navItem} ${isActive('/dashboard/acompanhamento') ? styles.active : ''}`} 
                                onClick={() => setSidebarOpen(false)}
                            >
                                <Heart size={18} />
                                Acompanhamento
                            </Link>
                        </>
                    )}
                </nav>

                <div className={styles.userSection}>
                    <div className={styles.userInfo}>
                        <User size={15} />
                        <span className={styles.userEmail}>{user.email}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleLogout} className={styles.logoutBtn}>
                        <LogOut size={15} />
                        Sair
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={styles.main}>
                {children}
            </main>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
            )}
        </div>
    );
}
