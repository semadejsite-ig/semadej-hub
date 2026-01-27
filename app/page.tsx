import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import styles from "./page.module.css";
import { BookOpen, Users, ArrowRight, HandMetal } from "lucide-react";

export default function Home() {
  return (
    <div className={styles.wrapper}>
      <Header />

      <main className={styles.main}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <div className={styles.badge}>Secretaria de Missões</div>
            <h1 className={styles.title}>
              Capacitando para a <span className="text-gradient">Grande Comissão</span>
            </h1>
            <p className={styles.subtitle}>
              Plataforma oficial da AD Belém SJC. Inscreva-se nos cursos do PAM, LIBRAS
              ou acesse a área administrativa.
            </p>
            <div className={styles.heroActions}>
              <Link href="/register/pam">
                <Button size="lg" className={styles.ctaButton}>
                  Matrícula PAM <ArrowRight size={18} />
                </Button>
              </Link>
              <Link href="/libras">
                <Button variant="outline" size="lg">
                  Curso de LIBRAS
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features/Cards */}
        <section className={styles.grid}>
          {/* PAM CARD */}
          <div className="glass-card" style={{ padding: '2rem', borderRadius: '1rem' }}>
            <div className={styles.cardIcon}>
              <BookOpen size={24} color="var(--primary)" />
            </div>
            <h3 className={styles.cardTitle}>PAM</h3>
            <p className={styles.cardText}>
              Programa de Aprofundamento Missionário. Formação teológica e prática para o campo.
            </p>
            <Link href="/pam" className={styles.link}>
              Saiba mais →
            </Link>
          </div>

          {/* LIBRAS CARD */}
          <div className="glass-card" style={{ padding: '2rem', borderRadius: '1rem' }}>
            <div className={styles.cardIcon}>
              <HandMetal size={24} color="#0891b2" />
            </div>
            <h3 className={styles.cardTitle}>LIBRAS</h3>
            <p className={styles.cardText}>
              Curso de Língua Brasileira de Sinais. Inclusão e acessibilidade para o Reino de Deus.
            </p>
            <Link href="/libras" className={styles.link} style={{ color: '#0891b2' }}>
              Saiba mais →
            </Link>
          </div>

          {/* AGENTS CARD */}
          <div className="glass-card" style={{ padding: '2rem', borderRadius: '1rem' }}>
            <div className={styles.cardIcon}>
              <Users size={24} color="var(--secondary)" />
            </div>
            <h3 className={styles.cardTitle}>Agentes Missionários</h3>
            <p className={styles.cardText}>
              Área restrita para agentes enviarem relatórios mensais e gerirem suas congregações.
            </p>
            <Link href="/login" className={styles.link}>
              Acessar Área →
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
