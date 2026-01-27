import { Header } from "@/components/layout/Header";
import styles from "./layout.module.css";

export default function RegisterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className={styles.wrapper}>
            <Header />
            <main className={styles.main}>
                <div className={`glass-card ${styles.card}`}>
                    {children}
                </div>
            </main>
        </div>
    );
}
