'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
    ShieldAlert
} from 'lucide-react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState<any>(null);

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
                setUser(session.user);
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
        <div className={styles.wrapper}>
            {/* Mobile Header */}
            <header className={styles.mobileHeader}>
                <button onClick={() => setSidebarOpen(true)} className={styles.menuBtn}>
                    <Menu size={24} />
                </button>
                <span className={styles.brand}>SEMADEJ Hub</span>
            </header>

            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
                <div className={styles.sidebarHeader}>
                    <span className={styles.logo}>✝ SEMADEJ</span>
                    <button onClick={() => setSidebarOpen(false)} className={styles.closeBtn}>
                        <X size={24} />
                    </button>
                </div>

                <nav className={styles.nav}>
                    <Link href="/dashboard" className={styles.navItem} onClick={() => setSidebarOpen(false)}>
                        <BarChart3 size={20} />
                        Visão Geral
                    </Link>
                    <Link href="/dashboard/report" className={styles.navItem} onClick={() => setSidebarOpen(false)}>
                        <FileText size={20} />
                        Relatório Financeiro
                    </Link>
                    <Link href="/dashboard/congregation" className={styles.navItem} onClick={() => setSidebarOpen(false)}>
                        <Users size={20} />
                        Dados da Congregação
                    </Link>
                    <Link href="/dashboard/vacancies" className={styles.navItem} onClick={() => setSidebarOpen(false)}>
                        <Map size={20} />
                        Vagas e Congregações
                    </Link>
                    <Link href="/dashboard/admin/users" className={styles.navItem} onClick={() => setSidebarOpen(false)}>
                        <ShieldAlert size={20} />
                        Gestão de Usuários
                    </Link>
                </nav>

                <div className={styles.userSection}>
                    <div className={styles.userInfo}>
                        <User size={16} />
                        <span className={styles.userEmail}>{user.email}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleLogout} className={styles.logoutBtn}>
                        <LogOut size={16} />
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
