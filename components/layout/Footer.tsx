import Link from 'next/link';
import { Instagram } from 'lucide-react';
import styles from './Footer.module.css';

export function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.grid}>
                    {/* Brand */}
                    <div>
                        <h3 className={styles.brandTitle}>SEMADEJ Hub</h3>
                        <p className={styles.brandDesc}>
                            Plataforma oficial da Secretaria de Missões da Assembléia de Deus Ministério do Belém em São José dos Campos.
                        </p>
                    </div>

                    {/* Navigation */}
                    <div>
                        <h4 className={styles.sectionTitle}>Navegação</h4>
                        <ul className={styles.navList}>
                            <li><Link href="/pam" className={styles.navLink}>Curso PAM</Link></li>
                            <li><Link href="/libras" className={styles.navLink}>Curso de LIBRAS</Link></li>
                            <li><Link href="/login" className={styles.navLink}>Área do Agente</Link></li>
                        </ul>
                    </div>

                    {/* Socials */}
                    <div>
                        <h4 className={styles.sectionTitle}>Siga-nos</h4>
                        <div className={styles.socialWrapper}>
                            <a
                                href="https://www.instagram.com/semadej_sjc/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.socialLink}
                            >
                                <div className={styles.iconBox}>
                                    <Instagram size={16} />
                                </div>
                                <span className={styles.socialText}>@semadej_sjc</span>
                            </a>

                            <a
                                href="https://www.instagram.com/pam_sjc/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.socialLink}
                            >
                                <div className={styles.iconBox}>
                                    <Instagram size={16} />
                                </div>
                                <span className={styles.socialText}>@pam_sjc</span>
                            </a>

                            <a
                                href="https://www.instagram.com/libras_sjc/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.socialLink}
                            >
                                <div className={styles.iconBox}>
                                    <Instagram size={16} />
                                </div>
                                <span className={styles.socialText}>@libras_sjc</span>
                            </a>
                        </div>
                    </div>
                </div>

                <div className={styles.copyright}>
                    &copy; {new Date().getFullYear()} SEMADEJ - Secretaria de Missões da AD SJC. Todos os direitos reservados.
                </div>
            </div>
        </footer>
    );
}
