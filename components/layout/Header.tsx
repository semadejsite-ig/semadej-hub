import Link from 'next/link';
import { Button } from '../ui/Button';
import styles from './Header.module.css';

export function Header() {
    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <Link href="/" className={styles.logo}>
                    <span className={styles.logoIcon}>✝</span>
                    <span className={styles.logoText}>SEMADEJ Hub</span>
                </Link>

                <nav className={styles.nav}>
                    <Link href="/login">
                        <Button variant="outline" size="sm">
                            Espaço do Agente
                        </Button>
                    </Link>
                </nav>
            </div>
        </header>
    );
}
