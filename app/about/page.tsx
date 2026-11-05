import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import styles from './page.module.css';
import { Target, Heart, Globe } from 'lucide-react';

export default function AboutPage() {
    return (
        <div className={styles.wrapper}>
            <Header />

            <div className={styles.container}>
                {/* HERO */}
                <section className={styles.hero}>
                    <div className={styles.badge}>SEMADEJ • História & Visão</div>
                    <h1 className={styles.title}>
                        Nossa História & <span className={styles.titleHighlight}>Propósito</span>
                    </h1>
                    <p className={styles.subtitle}>
                        Conheça a trajetória da SEMADEJ e o coração que pulsa por missões na Assembleia de Deus Belém em São José dos Campos.
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
                                Nosso compromisso vai além de sustentar missionários locais, nacionais e transculturais. Nós investimos na capacitação estratégica, no auxílio a trabalhos sociais e na realização de eventos que despertam a consciência missionária em nossa cidade e pelo mundo.
                            </p>
                        </div>
                        <div className={styles.cardList}>
                            <div className={styles.featureCard}>
                                <div className={styles.featureIconBox} style={{ color: '#60A5FA' }}>
                                    <Target size={22} />
                                </div>
                                <div>
                                    <h4>Estratégia</h4>
                                    <p>Planejamento e operacionalização de projetos missionários e capacitações.</p>
                                </div>
                            </div>
                            <div className={styles.featureCard}>
                                <div className={styles.featureIconBox} style={{ color: '#FB7185' }}>
                                    <Heart size={22} />
                                </div>
                                <div>
                                    <h4>Ação Social</h4>
                                    <p>Auxílio humanitário e incentivo a trabalhos de misericórdia nas frentes de missão.</p>
                                </div>
                            </div>
                            <div className={styles.featureCard}>
                                <div className={styles.featureIconBox} style={{ color: '#2DD4BF' }}>
                                    <Globe size={22} />
                                </div>
                                <div>
                                    <h4>Sustento</h4>
                                    <p>Suporte contínuo a obreiros e famílias missionárias em diversos campos.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* LEADERSHIP WORDS SECTION */}
                    <div className={styles.leadershipWords}>
                        {/* PRESIDENT'S WORD */}
                        <section className={styles.presidentSection}>
                            <div className={styles.presidentContent}>
                                <h3>Palavra do Pastor Presidente</h3>
                                <blockquote className={styles.quote}>
                                    &ldquo;Não posso deixar de crer no Senhor Deus que, mesmo tendo um único Filho, fez dele um missionário e não o poupou por amor às nossas almas. Como, então, poderia eu... deixar de cumprir com o Grande chamado de Deus? Rogo ao Senhor que juntos possamos cumprir o desejo do coração de Deus e continuar alcançando as almas perdidas, até aos confins da Terra.&rdquo;
                                </blockquote>
                                <div className={styles.author}>
                                    Pr. Emanuel Barbosa Martins
                                    <span className={styles.authorRole}>Presidente da AD Belém SJC</span>
                                </div>
                            </div>
                        </section>

                        {/* DIRECTOR'S WORD */}
                        <section className={styles.directorSection}>
                            <div className={styles.presidentContent}>
                                <h3>Palavra do Diretor de Missões</h3>
                                <blockquote className={styles.quote}>
                                    &ldquo;A jornada que você inicia aqui está centralizada em uma verdade imutável: para realizar a Missão de Deus, primeiro precisamos ser transformados por Ele. Por isso, a nossa formação começa nos fundamentos... lembrando que somos &lsquo;Salvos pela Graça&rsquo; para então sermos &lsquo;Curados para Curar&rsquo;. Não há como edificar o Reino sem primeiro entendermos nossa posição e nossa cura em Cristo.&rdquo;
                                </blockquote>
                                <div className={styles.author}>
                                    Pb. Wilkinson dos Santos Martins
                                    <span className={styles.authorRole}>Diretor de Missões - SEMADEJ</span>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* HISTORY TIMELINE SECTION */}
                    <section className={styles.textBlock}>
                        <h2>Nossa Trajetória</h2>
                        <p>
                            Desde 2005, a SEMADEJ tem sido um farol missionário, crescendo e se adaptando para servir melhor ao Reino. Reescrevemos nossa história a cada vida alcançada.
                        </p>

                        <div className={styles.timeline}>
                            <div className={styles.timelineItem}>
                                <span className={styles.timelineYear}>2005 • O Início</span>
                                <p className={styles.timelineText}>
                                    Sob a liderança do Pr. Francisco Sales Ferreira, iniciamos nossas atividades em 22 de maio. Em julho, realizamos nosso primeiro culto de missões histórico na Rua Dolzani Ricardo.
                                </p>
                            </div>
                            <div className={styles.timelineItem}>
                                <span className={styles.timelineYear}>2007 a 2009 • Tempo de Expansão</span>
                                <p className={styles.timelineText}>
                                    Período de crescimento que fortaleceu nossa estrutura administrativa para suportar o avanço da obra e a assistência a congregações e campos de missões.
                                </p>
                            </div>
                            <div className={styles.timelineItem}>
                                <span className={styles.timelineYear}>2011 • Nova Liderança</span>
                                <p className={styles.timelineText}>
                                    O Pr. Emanuel Barbosa Martins assume a presidência, trazendo uma visão renovada e impulsionando os projetos missionários e a expansão do Reino.
                                </p>
                            </div>
                            <div className={styles.timelineItem}>
                                <span className={styles.timelineYear}>Hoje</span>
                                <p className={styles.timelineText}>
                                    Continuamos avançando, integrando formação, suporte a pontos de pregação, intercessão e apoio contínuo a centenas de obreiros, conscientes de que o coração de Deus é totalmente missionário.
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
