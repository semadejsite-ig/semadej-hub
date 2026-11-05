import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import styles from "./page.module.css";
import {
  BookOpen,
  HandMetal,
  Globe,
  Flame,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

// World map coordinates (col, row) on a 72x36 grid for the halftone dot matrix
const WORLD_DOTS: [number, number, "warm" | "cool"][] = [
  // North America (warm)
  [8, 6, "warm"], [9, 6, "warm"], [10, 6, "warm"], [11, 6, "warm"],
  [7, 7, "warm"], [8, 7, "warm"], [9, 7, "warm"], [10, 7, "warm"], [11, 7, "warm"], [12, 7, "warm"], [13, 7, "warm"],
  [6, 8, "warm"], [7, 8, "warm"], [8, 8, "warm"], [9, 8, "warm"], [10, 8, "warm"], [11, 8, "warm"], [12, 8, "warm"], [13, 8, "warm"], [14, 8, "warm"], [15, 8, "warm"],
  [8, 9, "warm"], [9, 9, "warm"], [10, 9, "warm"], [11, 9, "warm"], [12, 9, "warm"], [13, 9, "warm"], [14, 9, "warm"], [15, 9, "warm"], [16, 9, "warm"],
  [9, 10, "warm"], [10, 10, "warm"], [11, 10, "warm"], [12, 10, "warm"], [13, 10, "warm"], [14, 10, "warm"], [15, 10, "warm"], [16, 10, "warm"],
  [10, 11, "warm"], [11, 11, "warm"], [12, 11, "warm"], [13, 11, "warm"], [14, 11, "warm"], [15, 11, "warm"], [16, 11, "warm"],
  [11, 12, "warm"], [12, 12, "warm"], [13, 12, "warm"], [14, 12, "warm"], [15, 12, "warm"],
  [12, 13, "warm"], [13, 13, "warm"], [14, 13, "warm"], [15, 13, "warm"],
  [13, 14, "warm"], [14, 14, "warm"], [15, 14, "warm"],
  [14, 15, "warm"], [15, 15, "warm"], [16, 15, "warm"],
  [16, 16, "warm"], [17, 16, "warm"],
  // Greenland
  [21, 4, "warm"], [22, 4, "warm"], [23, 4, "warm"],
  [20, 5, "warm"], [21, 5, "warm"], [22, 5, "warm"], [23, 5, "warm"], [24, 5, "warm"],
  [21, 6, "warm"], [22, 6, "warm"], [23, 6, "warm"],
  // South America (warm)
  [18, 18, "warm"], [19, 18, "warm"], [20, 18, "warm"], [21, 18, "warm"],
  [18, 19, "warm"], [19, 19, "warm"], [20, 19, "warm"], [21, 19, "warm"], [22, 19, "warm"],
  [18, 20, "warm"], [19, 20, "warm"], [20, 20, "warm"], [21, 20, "warm"], [22, 20, "warm"], [23, 20, "warm"],
  [19, 21, "warm"], [20, 21, "warm"], [21, 21, "warm"], [22, 21, "warm"], [23, 21, "warm"], [24, 21, "warm"],
  [19, 22, "warm"], [20, 22, "warm"], [21, 22, "warm"], [22, 22, "warm"], [23, 22, "warm"], [24, 22, "warm"],
  [20, 23, "warm"], [21, 23, "warm"], [22, 23, "warm"], [23, 23, "warm"], [24, 23, "warm"],
  [20, 24, "warm"], [21, 24, "warm"], [22, 24, "warm"], [23, 24, "warm"],
  [20, 25, "warm"], [21, 25, "warm"], [22, 25, "warm"], [23, 25, "warm"],
  [20, 26, "warm"], [21, 26, "warm"], [22, 26, "warm"],
  [20, 27, "warm"], [21, 27, "warm"],
  [20, 28, "warm"], [21, 28, "warm"],
  [20, 29, "warm"],
  // Europe (cool)
  [33, 7, "cool"], [34, 7, "cool"], [35, 7, "cool"], [36, 7, "cool"],
  [31, 8, "cool"], [32, 8, "cool"], [33, 8, "cool"], [34, 8, "cool"], [35, 8, "cool"], [36, 8, "cool"], [37, 8, "cool"], [38, 8, "cool"],
  [30, 9, "cool"], [31, 9, "cool"], [32, 9, "cool"], [33, 9, "cool"], [34, 9, "cool"], [35, 9, "cool"], [36, 9, "cool"], [37, 9, "cool"], [38, 9, "cool"],
  [31, 10, "cool"], [32, 10, "cool"], [33, 10, "cool"], [34, 10, "cool"], [35, 10, "cool"], [36, 10, "cool"], [37, 10, "cool"], [38, 10, "cool"],
  [30, 11, "cool"], [31, 11, "cool"], [32, 11, "cool"], [33, 11, "cool"], [34, 11, "cool"], [35, 11, "cool"], [36, 11, "cool"], [37, 11, "cool"],
  [31, 12, "cool"], [33, 12, "cool"], [35, 12, "cool"], [36, 12, "cool"], [37, 12, "cool"],
  // Africa (cool & warm blend)
  [30, 14, "cool"], [31, 14, "cool"], [32, 14, "cool"], [33, 14, "cool"], [34, 14, "cool"], [35, 14, "cool"], [36, 14, "cool"], [37, 14, "cool"],
  [29, 15, "cool"], [30, 15, "cool"], [31, 15, "cool"], [32, 15, "cool"], [33, 15, "cool"], [34, 15, "cool"], [35, 15, "cool"], [36, 15, "cool"], [37, 15, "cool"], [38, 15, "cool"],
  [29, 16, "cool"], [30, 16, "cool"], [31, 16, "cool"], [32, 16, "cool"], [33, 16, "cool"], [34, 16, "cool"], [35, 16, "cool"], [36, 16, "cool"], [37, 16, "cool"], [38, 16, "cool"], [39, 16, "cool"],
  [30, 17, "cool"], [31, 17, "cool"], [32, 17, "cool"], [33, 17, "cool"], [34, 17, "cool"], [35, 17, "cool"], [36, 17, "cool"], [37, 17, "cool"], [38, 17, "cool"], [39, 17, "cool"], [40, 17, "cool"],
  [31, 18, "cool"], [32, 18, "cool"], [33, 18, "cool"], [34, 18, "cool"], [35, 18, "cool"], [36, 18, "cool"], [37, 18, "cool"], [38, 18, "cool"], [39, 18, "cool"], [40, 18, "cool"],
  [33, 19, "cool"], [34, 19, "cool"], [35, 19, "cool"], [36, 19, "cool"], [37, 19, "cool"], [38, 19, "cool"], [39, 19, "cool"],
  [33, 20, "cool"], [34, 20, "cool"], [35, 20, "cool"], [36, 20, "cool"], [37, 20, "cool"], [38, 20, "cool"],
  [34, 21, "cool"], [35, 21, "cool"], [36, 21, "cool"], [37, 21, "cool"], [38, 21, "cool"],
  [34, 22, "cool"], [35, 22, "cool"], [36, 22, "cool"], [37, 22, "cool"], [38, 22, "cool"],
  [35, 23, "cool"], [36, 23, "cool"], [37, 23, "cool"], [38, 23, "cool"], [40, 23, "cool"],
  [35, 24, "cool"], [36, 24, "cool"], [37, 24, "cool"], [40, 24, "cool"],
  [35, 25, "cool"], [36, 25, "cool"], [37, 25, "cool"],
  [36, 26, "cool"],
  // Asia (cool)
  [39, 7, "cool"], [40, 7, "cool"], [41, 7, "cool"], [42, 7, "cool"], [43, 7, "cool"], [44, 7, "cool"], [45, 7, "cool"], [46, 7, "cool"], [47, 7, "cool"], [48, 7, "cool"], [49, 7, "cool"], [50, 7, "cool"], [51, 7, "cool"], [52, 7, "cool"], [53, 7, "cool"], [54, 7, "cool"], [55, 7, "cool"],
  [39, 8, "cool"], [40, 8, "cool"], [41, 8, "cool"], [42, 8, "cool"], [43, 8, "cool"], [44, 8, "cool"], [45, 8, "cool"], [46, 8, "cool"], [47, 8, "cool"], [48, 8, "cool"], [49, 8, "cool"], [50, 8, "cool"], [51, 8, "cool"], [52, 8, "cool"], [53, 8, "cool"], [54, 8, "cool"], [55, 8, "cool"], [56, 8, "cool"], [57, 8, "cool"],
  [39, 9, "cool"], [40, 9, "cool"], [41, 9, "cool"], [42, 9, "cool"], [43, 9, "cool"], [44, 9, "cool"], [45, 9, "cool"], [46, 9, "cool"], [47, 9, "cool"], [48, 9, "cool"], [49, 9, "cool"], [50, 9, "cool"], [51, 9, "cool"], [52, 9, "cool"], [53, 9, "cool"], [54, 9, "cool"], [55, 9, "cool"], [56, 9, "cool"],
  [39, 10, "cool"], [40, 10, "cool"], [41, 10, "cool"], [42, 10, "cool"], [43, 10, "cool"], [44, 10, "cool"], [45, 10, "cool"], [46, 10, "cool"], [47, 10, "cool"], [48, 10, "cool"], [49, 10, "cool"], [50, 10, "cool"], [51, 10, "cool"], [52, 10, "cool"], [53, 10, "cool"], [54, 10, "cool"], [55, 10, "cool"],
  [39, 11, "cool"], [40, 11, "cool"], [41, 11, "cool"], [42, 11, "cool"], [43, 11, "cool"], [44, 11, "cool"], [45, 11, "cool"], [46, 11, "cool"], [47, 11, "cool"], [48, 11, "cool"], [49, 11, "cool"], [50, 11, "cool"], [51, 11, "cool"], [52, 11, "cool"], [53, 11, "cool"], [54, 11, "cool"], [56, 11, "cool"],
  [39, 12, "cool"], [40, 12, "cool"], [41, 12, "cool"], [42, 12, "cool"], [43, 12, "cool"], [44, 12, "cool"], [45, 12, "cool"], [46, 12, "cool"], [47, 12, "cool"], [48, 12, "cool"], [49, 12, "cool"], [50, 12, "cool"], [51, 12, "cool"], [52, 12, "cool"], [53, 12, "cool"], [54, 12, "cool"], [56, 12, "cool"],
  [39, 13, "cool"], [40, 13, "cool"], [41, 13, "cool"], [42, 13, "cool"], [44, 13, "cool"], [45, 13, "cool"], [46, 13, "cool"], [47, 13, "cool"], [48, 13, "cool"], [49, 13, "cool"], [50, 13, "cool"], [51, 13, "cool"], [52, 13, "cool"], [53, 13, "cool"], [55, 13, "cool"],
  [40, 14, "cool"], [41, 14, "cool"], [45, 14, "cool"], [46, 14, "cool"], [47, 14, "cool"], [49, 14, "cool"], [50, 14, "cool"], [51, 14, "cool"], [52, 14, "cool"],
  [45, 15, "cool"], [46, 15, "cool"], [47, 15, "cool"], [50, 15, "cool"], [51, 15, "cool"], [52, 15, "cool"], [54, 15, "cool"],
  [46, 16, "cool"], [50, 16, "cool"], [51, 16, "cool"], [53, 16, "cool"], [54, 16, "cool"],
  [50, 17, "cool"], [51, 17, "cool"], [52, 17, "cool"], [54, 17, "cool"], [55, 17, "cool"],
  [51, 18, "cool"], [52, 18, "cool"], [53, 18, "cool"], [55, 18, "cool"],
  // Oceania / Australia (cool)
  [53, 22, "cool"], [54, 22, "cool"], [55, 22, "cool"], [56, 22, "cool"], [57, 22, "cool"],
  [52, 23, "cool"], [53, 23, "cool"], [54, 23, "cool"], [55, 23, "cool"], [56, 23, "cool"], [57, 23, "cool"], [58, 23, "cool"],
  [52, 24, "cool"], [53, 24, "cool"], [54, 24, "cool"], [55, 24, "cool"], [56, 24, "cool"], [57, 24, "cool"], [58, 24, "cool"],
  [53, 25, "cool"], [54, 25, "cool"], [55, 25, "cool"], [56, 25, "cool"], [57, 25, "cool"],
  [56, 26, "cool"], [57, 26, "cool"], [61, 27, "cool"], [62, 26, "cool"],
];

export default function Home() {
  return (
    <div className={styles.wrapper}>
      <Header />

      <main className={styles.main}>
        {/* Hero Section with Halftone World Map */}
        <section className={styles.heroSection} id="missoes">
          <div className={styles.heroGrid}>
            {/* Left Copy & CTAs */}
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>
                Capacitando Vidas para a Grande Comissão
              </h1>
              <p className={styles.heroSubtitle}>
                Formação missionária, alcance transcultural e o chamado de ir por todo o mundo.
              </p>

              <div className={styles.heroActions}>
                <Link href="/register/pam" className={styles.primaryCta}>
                  Matrícula EMAD
                </Link>
                <Link href="/libras" className={styles.secondaryCta}>
                  Curso de LIBRAS
                </Link>
              </div>
            </div>

            {/* Right Interactive Halftone World Map */}
            <div className={styles.mapWrapper} aria-hidden="true">
              <div className={styles.mapGlowWarm} />
              <div className={styles.mapGlowCool} />
              <svg
                viewBox="0 0 650 340"
                className={styles.worldMapSvg}
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="arcWarmToCool" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.95" />
                    <stop offset="50%" stopColor="#FDE68A" stopOpacity="0.85" />
                    <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.95" />
                  </linearGradient>
                  <linearGradient id="arcWarm" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#F97316" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#FBBF24" stopOpacity="0.9" />
                  </linearGradient>
                  <linearGradient id="arcCool" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.85" />
                  </linearGradient>
                  <radialGradient id="nodeGlowWarm" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FBBF24" stopOpacity="1" />
                    <stop offset="40%" stopColor="#F97316" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
                  </radialGradient>
                  <radialGradient id="nodeGlowCool" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#93C5FD" stopOpacity="1" />
                    <stop offset="40%" stopColor="#3B82F6" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Halftone World Dots */}
                {WORLD_DOTS.map(([col, row, tone], idx) => (
                  <circle
                    key={idx}
                    cx={col * 9.5}
                    cy={row * 9.5}
                    r={2.1}
                    fill={tone === "warm" ? "#F59E0B" : "#3B82F6"}
                    fillOpacity={tone === "warm" ? 0.55 : 0.5}
                  />
                ))}

                {/* Missionary Connection Arcs from Brazil (SJC: 215, 228) & Global Hubs */}
                <path
                  d="M 215 228 Q 160 150 135 105"
                  stroke="url(#arcWarm)"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
                <path
                  d="M 135 105 Q 110 95 95 112"
                  stroke="url(#arcWarm)"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
                <path
                  d="M 135 105 Q 230 55 332 98"
                  stroke="url(#arcWarmToCool)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path
                  d="M 215 228 Q 260 140 332 98"
                  stroke="url(#arcWarmToCool)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <path
                  d="M 215 228 Q 290 195 365 205"
                  stroke="url(#arcWarmToCool)"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
                <path
                  d="M 332 98 Q 395 75 450 86"
                  stroke="url(#arcCool)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <path
                  d="M 332 98 Q 410 120 475 142"
                  stroke="url(#arcCool)"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
                <path
                  d="M 332 98 Q 450 105 535 135"
                  stroke="url(#arcCool)"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
                <path
                  d="M 475 142 Q 520 180 555 228"
                  stroke="url(#arcCool)"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />

                {/* Warm Nodes (Americas / SJC Origin) */}
                {[
                  [215, 228, 18],
                  [135, 105, 16],
                  [95, 112, 12],
                ].map(([cx, cy, r], i) => (
                  <g key={`warm-${i}`}>
                    <circle cx={cx} cy={cy} r={r} fill="url(#nodeGlowWarm)" />
                    <circle cx={cx} cy={cy} r={3.5} fill="#FEF3C7" />
                  </g>
                ))}

                {/* Cool Nodes (Europe, Africa, Asia, Oceania) */}
                {[
                  [332, 98, 16],
                  [365, 205, 14],
                  [450, 86, 13],
                  [475, 142, 14],
                  [535, 135, 13],
                  [555, 228, 13],
                ].map(([cx, cy, r], i) => (
                  <g key={`cool-${i}`}>
                    <circle cx={cx} cy={cy} r={r} fill="url(#nodeGlowCool)" />
                    <circle cx={cx} cy={cy} r={3.2} fill="#E0F2FE" />
                  </g>
                ))}
              </svg>
            </div>
          </div>
        </section>

        {/* 5 Architectural Dark-Glass Cards Section */}
        <section className={styles.cardsSection} id="cursos">
          <div className={styles.cardsGrid}>
            {/* 1. EMAD */}
            <article className={styles.featureCard}>
              <div className={styles.cardTop}>
                <div className={`${styles.iconWrapper} ${styles.iconGreen}`}>
                  <BookOpen size={20} />
                </div>
                <span className={`${styles.statusBadge} ${styles.badgeGreen}`}>
                  Inscrições Abertas
                </span>
              </div>
              <div className={styles.cardBody}>
                <h2 className={styles.cardTitle}>EMAD</h2>
                <p className={styles.cardDescription}>
                  Escola de Missões. Formação teológica e prática para o campo missionário.
                </p>
              </div>
              <Link href="/pam" className={styles.cardAction}>
                <span>Inscrever-se</span>
                <ArrowRight size={15} />
              </Link>
            </article>

            {/* 2. Curso de LIBRAS */}
            <article className={styles.featureCard}>
              <div className={styles.cardTop}>
                <div className={`${styles.iconWrapper} ${styles.iconBlue}`}>
                  <HandMetal size={20} />
                </div>
                <span className={`${styles.statusBadge} ${styles.badgeBlue}`}>
                  Inclusão
                </span>
              </div>
              <div className={styles.cardBody}>
                <h2 className={styles.cardTitle}>Curso de LIBRAS</h2>
                <p className={styles.cardDescription}>
                  Língua Brasileira de Sinais. Evangelismo e acessibilidade no Reino.
                </p>
              </div>
              <Link href="/libras" className={styles.cardAction}>
                <span>Saiba mais</span>
                <ArrowRight size={15} />
              </Link>
            </article>

            {/* 3. Curso de Espanhol (Em breve) */}
            <article className={styles.featureCard}>
              <div className={styles.cardTop}>
                <div className={`${styles.iconWrapper} ${styles.iconAmber}`}>
                  <Globe size={20} />
                </div>
                <span className={`${styles.statusBadge} ${styles.badgeAmber}`}>
                  Em breve
                </span>
              </div>
              <div className={styles.cardBody}>
                <h2 className={styles.cardTitle}>Curso de Espanhol</h2>
                <p className={styles.cardDescription}>
                  Capacitação linguística para missões transculturais na América Latina.
                </p>
              </div>
              <span className={`${styles.cardAction} ${styles.cardActionMuted}`}>
                <span>Lista de espera</span>
                <ArrowRight size={15} />
              </span>
            </article>

            {/* 4. Pedidos de Oração */}
            <article className={styles.featureCard}>
              <div className={styles.cardTop}>
                <div className={`${styles.iconWrapper} ${styles.iconOrange}`}>
                  <Flame size={20} />
                </div>
                <span className={`${styles.statusBadge} ${styles.badgeOrange}`}>
                  Intercessão
                </span>
              </div>
              <div className={styles.cardBody}>
                <h2 className={styles.cardTitle}>Pedidos de Oração</h2>
                <p className={styles.cardDescription}>
                  Deixe seu clamor. Nossa equipe de intercessores ora por você.
                </p>
              </div>
              <Link href="/pedidos" className={styles.cardAction}>
                <span>Enviar pedido</span>
                <ArrowRight size={15} />
              </Link>
            </article>

            {/* 5. Portal do Agente */}
            <article className={styles.featureCard}>
              <div className={styles.cardTop}>
                <div className={`${styles.iconWrapper} ${styles.iconSlate}`}>
                  <ShieldCheck size={20} />
                </div>
                <span className={`${styles.statusBadge} ${styles.badgeSlate}`}>
                  Área Restrita
                </span>
              </div>
              <div className={styles.cardBody}>
                <h2 className={styles.cardTitle}>Portal do Agente</h2>
                <p className={styles.cardDescription}>
                  Gestão de relatórios, presença e acompanhamento das congregações.
                </p>
              </div>
              <Link href="/login" className={styles.cardAction}>
                <span>Acessar painel</span>
                <ArrowRight size={15} />
              </Link>
            </article>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
