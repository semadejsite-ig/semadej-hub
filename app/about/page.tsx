import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import styles from './page.module.css';
import { Target, Heart, Globe, MapPin } from 'lucide-react';

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-white">
            <Header />

            <div className={styles.container}>
                {/* HERO */}
                <section className={styles.hero}>
                    <h1 className={styles.title}>Nossa História & <span className="text-blue-600">Propósito</span></h1>
                    <p className={styles.subtitle}>
                        Conheça a trajetória da SEMADEJ e o coração que pulsa por missões na AD Belém em São José dos Campos.
                    </p>
                </section>

                <div className={styles.contentSection}>

                    {/* MISSION SECTION */}
                    <section className={styles.gridTwo}>
                        <div className={styles.textBlock}>
                            <h2>Quem Somos</h2>
                            <p>
                                A <strong>SEMADEJ</strong> (Secretaria de Missões e Evangelismo da Assembleia de Deus Joseense) é o braço operacional da igreja responsável por pesquisar, planejar e executar a visão missionária do nosso ministério.
                            </p>
                            <p>
                                Nosso compromisso vai além de sustentar missionários locais, nacionais e transculturais. Nós investimos na capacitação estratégica, no auxílio a trabalhos sociais e na realização de eventos que despertam a consciência missionária em nossa cidade.
                            </p>
                        </div>
                        <div className={styles.cardList}>
                            <div className={styles.featureCard}>
                                <Target className="text-blue-500 mb-2" size={24} />
                                <h4 className="font-bold text-slate-800">Estratégia</h4>
                                <p className="text-sm text-slate-500 mt-1">Planejamento e operacionalização de projetos.</p>
                            </div>
                            <div className={styles.featureCard}>
                                <Heart className="text-rose-500 mb-2" size={24} />
                                <h4 className="font-bold text-slate-800">Ação Social</h4>
                                <p className="text-sm text-slate-500 mt-1">Auxílio e incentivo a trabalhos de misericórdia.</p>
                            </div>
                            <div className={styles.featureCard}>
                                <Globe className="text-teal-500 mb-2" size={24} />
                                <h4 className="font-bold text-slate-800">Sustento</h4>
                                <p className="text-sm text-slate-500 mt-1">Suporte vital a missionários em diversos campos.</p>
                            </div>
                        </div>
                    </section>

                    {/* PRESIDENT'S WORD SECTION */}
                    <section className={styles.presidentSection}>
                        <div className={styles.presidentContent}>
                            <h3 className="text-2xl font-bold text-white mb-6">Palavra do Pastor Presidente</h3>
                            <blockquote className={styles.quote}>
                                "Não posso deixar de crer no Senhor Deus que, mesmo tendo um único Filho, fez dele um missionário e não o poupou por amor às nossas almas. Como, então, poderia eu... deixar de cumprir com o Grande chamado de Deus? Rogo ao Senhor que juntos possamos cumprir o desejo do coração de Deus e continuar alcançando as almas perdidas, até aos confins da Terra."
                            </blockquote>
                            <div className={styles.author}>
                                Pr. Emanuel Barbosa Martins
                                <span className="block text-sm font-normal text-slate-400 mt-1">Presidente da AD Belém SJC</span>
                            </div>
                        </div>
                    </section>

                    {/* HISTORY TIMELINE SECTION */}
                    <section className={styles.textBlock}>
                        <h2>Nossa Trajetória</h2>
                        <p className="mb-8">
                            Desde 2005, a SEMADEJ tem sido um farol missionário, crescendo e se adaptando para servir melhor ao Reino. Reescrevemos nossa história a cada vida alcançada.
                        </p>

                        <div className={styles.timeline}>
                            <div className={styles.timelineItem}>
                                <span className={styles.timelineYear}>2005 - O Início</span>
                                <p className={styles.timelineText}>
                                    Sob a liderança do Pr. Francisco Sales Ferreira, iniciamos nossas atividades em 22 de maio. Em julho, realizamos nosso <strong>primeiro culto de missões</strong> histórico na Rua Dolzani Ricardo.
                                </p>
                            </div>
                            <div className={styles.timelineItem}>
                                <span className={styles.timelineYear}>2007 a 2009 - Tempo de Expansão</span>
                                <p className={styles.timelineText}>
                                    Período de crescimento que nos levou a transitar por sedes provisórias, como a Rua Coronel José Monteiro e o prédio da Igreja Batista, fortalecendo nossa estrutura administrativa para suportar o crescimento da obra.
                                </p>
                            </div>
                            <div className={styles.timelineItem}>
                                <span className={styles.timelineYear}>2011 - Nova Liderança</span>
                                <p className={styles.timelineText}>
                                    O Pr. Emanuel Barbosa Martins assume a presidência, trazendo uma visão renovada e impulsionando ainda mais os projetos missionários e a construção do Nosso Templo.
                                </p>
                            </div>
                            <div className={styles.timelineItem}>
                                <span className={styles.timelineYear}>Hoje</span>
                                <p className={styles.timelineText}>
                                    Continuamos avançando, segurando firmes as cordas da oração e da contribuição, conscientes de que "missões devem estar no nosso coração, pois o coração de Deus é totalmente missionário".
                                </p>
                            </div>
                        </div>
                    </section>

                </div>
            </div>

            <Footer />
        </div>
    );
}
