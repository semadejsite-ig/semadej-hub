'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Header.module.css';

export function Header() {
    const pathname = usePathname();

    const isLinkActive = (href: string) => {
        if (href === '/' && pathname === '/') return true;
        if (href !== '/' && pathname?.startsWith(href)) return true;
        return false;
    };

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <Link href="/" className={styles.logoLink}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/semadej_logo_white.webp"
                        alt="SEMADEJ - Secretaria de Evangelismo e Missões"
                        className={styles.logoImage}
                    />
                </Link>

                    <nav className={styles.pillNav} aria-label="Menu Principal">
                        <Link
                            href="/pam"
                            className={`${styles.pillLink} ${isLinkActive('/pam') ? styles.pillLinkActive : ''}`}
                        >
                            Cursos (EMAD)
                        </Link>
                        <Link
                            href="/libras"
                            className={`${styles.pillLink} ${isLinkActive('/libras') ? styles.pillLinkActive : ''}`}
                        >
                            LIBRAS
                        </Link>
                        <Link
                            href="/pedidos"
                            className={`${styles.pillLink} ${isLinkActive('/pedidos') ? styles.pillLinkActive : ''}`}
                        >
                            Oração
                        </Link>
                        <Link
                            href="/about"
                            className={`${styles.pillLink} ${isLinkActive('/about') ? styles.pillLinkActive : ''}`}
                        >
                            Sobre
                        </Link>
                    </nav>

                    <div className={styles.navActions}>
                        <Link href="/login" className={styles.agentButton}>
                            Espaço do Agente
                        </Link>
                    </div>
                </div>
            </header>
    );
}
