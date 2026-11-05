import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import styles from './page.module.css';
import {
    ArrowRight,
    Compass,
    Globe2,
    BookOpen,
    Church,
    History,
    Languages,
    Users,
    Sparkles,
    Flame,
    GraduationCap,
    Award,
    CalendarCheck,
    Video
} from 'lucide-react';

export default function EMADPage() {
    const modules = [
        {
            id: 1,
            title: 'Introdução a Missões',
            icon: Compass,
            color: '#38BDF8',
            lessons: [
                'O que é Missões',
                'Para que Missões',
                'Onde fazer Missões',
                'Como fazer Missões',
                'Quem deve fazer Missões',
                'Avaliação de Fixação 1 (Quiz)',
            ],
        },
        {
            id: 2,
            title: 'Desafios da Evangelização Mundial',
            icon: Globe2,
            color: '#60A5FA',
            lessons: [
                'Panorama Mundial Contemporâneo',
                'A Situação Religiosa Global',
                'Principais Desafios do Século XXI',
                'Sua Atitude Diante dos Desafios',
                'Avaliação de Fixação 2 (Quiz)',
            ],
        },
        {
            id: 3,
            title: 'Bases Bíblicas de Missões',
            icon: BookOpen,
            color: '#818CF8',
            lessons: [
                'O Início: A Resposta de Deus',
                'A Chamada de um Homem & A Tipificação de Um Povo',
                'A Aprovação: O Nascimento de Jesus',
                'O Amor Missionário em Ação',
                'A Prática nos Atos dos Apóstolos',
                'Quadro Final da Ação Missionária & Avaliação 3',
            ],
        },
        {
            id: 4,
            title: 'A Igreja Local e Missões',
            icon: Church,
            color: '#34D399',
            lessons: [
                'O que Significa Igreja Local',
                'Destruindo os Mitos da Igreja Local',
                'O Envolvimento da Igreja com a Obra Missionária',
                'A Responsabilidade da Secretaria de Missões',
                'Avaliação de Fixação 4 (Quiz)',
            ],
        },
        {
            id: 5,
            title: 'História de Missões',
            icon: History,
            color: '#FBBF24',
            lessons: [
                'Cristianismo Primitivo e Missões',
                'O Avanço Missionário e os Primeiros Programas',
                'A Igreja e o Acordo de Constantino',
                'O Segundo e o Terceiro Despertamento Missionário',
                'Avaliação de Fixação 5 (Quiz)',
            ],
        },
        {
            id: 6,
            title: 'Missões Transculturais',
            icon: Languages,
            color: '#F472B6',
            lessons: [
                'Definindo Missões Transculturais',
                'A Visão Teológica Transcultural da Bíblia',
                'O Preparo do Missionário Transcultural',
                'Avaliação de Fixação 6 (Quiz)',
            ],
        },
        {
            id: 7,
            title: 'Missões por Faixa Etária',
            icon: Users,
            color: '#FB923C',
            lessons: [
                'Definindo Estratégias por Faixas Etárias',
                'Primeira e Segunda Faixas (0 a 4 anos e 5 a 8 anos)',
                'Terceira e Quarta Faixas (9 a 11 anos e 12 a 14 anos)',
                'Quinta Faixa (15 a 17 anos) e 18 anos em diante',
                'Avaliação de Fixação 7 (Quiz)',
            ],
        },
        {
            id: 8,
            title: 'Antropologia Missionária',
            icon: Sparkles,
            color: '#A78BFA',
            lessons: [
                'Definição do Termo, Cultura e Sociedade',
                'Cosmovisões e Diferenças Culturais',
                'O Missionário e o Choque Cultural',
                'A Importância da Etnografia e Contextualização',
                'Avaliação de Fixação 8 (Quiz)',
            ],
        },
        {
            id: 9,
            title: 'Povos Não Alcançados & Janela 10/40',
            icon: Flame,
            color: '#F87171',
            lessons: [
                'Janela 10/40: O Último e Grande Desafio Missionário',
                'A Importância de se Conhecer um "Povo"',
                'Povos Inalcançados, mas Não Inalcançáveis',
                'Estratégias de Envio e Identificação Cultural',
                'A Importância da Oração no Alcance Global & Avaliação 9',
            ],
        },
        {
            id: 10,
            title: 'Discipulado Bíblico',
            icon: GraduationCap,
            color: '#2DD4BF',
            lessons: [
                'O Perfil do Discípulo',
                'O Papel do Discipulador',
                'O Método Bíblico de Formação de Líderes',
                'Avaliação de Fixação 10 (Quiz Final)',
            ],
        },
    ];

    return (
        <div className={styles.wrapper}>
            <Header />

            <main className={styles.container}>
                {/* HERO */}
                <section className={styles.hero}>
                    <div className={styles.heroContent}>
                        <div className={styles.badge}>EMAD • Escola de Missões Online</div>
                        <h1 className={styles.title}>
                            Curso Básico de <br />
                            <span className={styles.titleHighlight}>Missões</span>
                        </h1>
                        <p className={styles.subtitle}>
                            Você que procura ampliar o conhecimento e se preparar para o desenvolvimento de seu ministério, seja ele local ou transcultural, encontrará na <strong>EMAD</strong> as matérias e ferramentas fundamentais para cumprir a Grande Comissão.
                        </p>

                        <div className={styles.highlightPills}>
                            <span className={styles.pillFeature}>
                                <Video size={16} color="#38BDF8" /> 100% Online
                            </span>
                            <span className={styles.pillFeature}>
                                <Award size={16} color="#34D399" /> Certificado Incluso
                            </span>
                            <span className={styles.pillFeature}>
                                <CalendarCheck size={16} color="#FBBF24" /> Bônus: Planner Anual
                            </span>
                        </div>

                        <div className="flex justify-center">
                            <Link href="/register/pam" className={styles.primaryCta}>
                                <span>Quero me Matricular na EMAD</span>
                                <ArrowRight size={18} />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* CURRICULUM GRID */}
                <section className={styles.modulesSection}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>Grade Curricular Completa</h2>
                        <p className={styles.sectionSubtitle}>
                            Uma formação estruturada em 10 módulos essenciais com vídeo-aulas, avaliações práticas de fixação e materiais bônus de planejamento.
                        </p>
                    </div>

                    <div className={styles.grid}>
                        {modules.map((m) => {
                            const IconComponent = m.icon;
                            return (
                                <div key={m.id} className={styles.card}>
                                    <div>
                                        <div className={styles.cardTop}>
                                            <span className={styles.cardNumber}>
                                                {String(m.id).padStart(2, '0')}
                                            </span>
                                            <div className={styles.cardIconBox} style={{ color: m.color }}>
                                                <IconComponent size={22} />
                                            </div>
                                        </div>
                                        <h3 className={styles.cardTitle}>{m.title}</h3>
                                        <ul className={styles.cardLessons}>
                                            {m.lessons.map((lesson, idx) => (
                                                <li key={idx} className={styles.lessonItem}>
                                                    <span className={styles.lessonBullet}>▸</span>
                                                    <span>{lesson}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            );
                        })}

                        {/* BONUS & MÓDULO EXTRA CARD */}
                        <div className={`${styles.card} ${styles.cardBonus}`}>
                            <div>
                                <div className={styles.cardTop}>
                                    <span className={styles.cardNumber}>★</span>
                                    <div className={styles.cardIconBox} style={{ color: '#F59E0B' }}>
                                        <Award size={22} />
                                    </div>
                                </div>
                                <h3 className={styles.cardTitle}>Módulo Extra & Bônus</h3>
                                <ul className={styles.cardLessons}>
                                    <li className={styles.lessonItem}>
                                        <span className={styles.lessonBullet}>★</span>
                                        <strong>Módulo Extra: Janela 4/14</strong> (Alcance de Crianças e Adolescentes)
                                    </li>
                                    <li className={styles.lessonItem}>
                                        <span className={styles.lessonBullet}>★</span>
                                        <strong>Bônus Especial: Planner Anual Missionário</strong>
                                    </li>
                                    <li className={styles.lessonItem}>
                                        <span className={styles.lessonBullet}>★</span>
                                        <strong>Certificado Oficial de Conclusão da EMAD</strong>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FINAL CTA */}
                <section className={styles.ctaSection}>
                    <div className="max-w-2xl mx-auto px-4">
                        <h2 className={styles.ctaTitle}>Pronto para Desenvolver seu Ministério?</h2>
                        <p className={styles.ctaText}>
                            Garanta sua vaga na EMAD e faça parte da nova geração de homens e mulheres capacitados para alcançar vidas na igreja local e nos confins da terra.
                        </p>
                        <Link href="/register/pam" className={styles.primaryCta}>
                            <span>FAZER MINHA INSCRIÇÃO NA EMAD</span>
                            <ArrowRight size={18} />
                        </Link>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
