import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import styles from './page.module.css';
import { ArrowRight, HandMetal, History, Users, Puzzle, MessageCircle, Sparkles } from 'lucide-react';

export default function LIBRASPage() {
    return (
        <div className="min-h-screen bg-white">
            <Header />

            <main className={styles.container}>
                {/* HERO */}
                <section className={styles.hero}>
                    <div className={styles.heroContent}>
                        <div className={styles.badge}>Curso de LIBRAS - AD SEMADEJ</div>
                        <h1 className={styles.title}>
                            Mãos que Falam, <br />
                            <span className="text-cyan-600">Corações que Ouvem</span>
                        </h1>
                        <p className={styles.subtitle}>
                            O Evangelho é para todos. Aprenda a Língua Brasileira de Sinais e seja um instrumento de inclusão no Reino. Quebre a barreira do silêncio.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Link href="/register/libras">
                                <Button size="lg" className="shadow-xl shadow-cyan-500/20 bg-cyan-600 hover:bg-cyan-700 text-white border-0">
                                    Inscrever-se Agora <ArrowRight className="ml-2" size={18} />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* HIGHLIGHT BOX */}
                <section className={styles.quoteBox}>
                    <p className={styles.quoteText}>
                        "A acessibilidade não é apenas uma lei, é um princípio do Reino de Deus. Ao aprender Libras, você não está apenas aprendendo uma nova língua, mas abrindo as portas da igreja para uma comunidade que anseia por 'ouvir' a mensagem da Cruz."
                    </p>
                </section>

                {/* MODULES */}
                <section className={styles.modulesSection}>
                    <h2 className={styles.sectionTitle}>O Que Você Vai Aprender</h2>
                    <div className={styles.grid}>
                        {[
                            { id: 1, title: 'Acessibilidade & Inclusão', desc: 'Compreenda a importância da acessibilidade e como a igreja pode ser um ambiente acolhedor para surdos.', icon: Users, color: 'text-cyan-500' },
                            { id: 2, title: 'História & Cultura Surda', desc: 'Revisão histórica e imersão na cultura. Entenda a identidade surda para se comunicar com respeito e empatia.', icon: History, color: 'text-purple-500' },
                            { id: 3, title: 'Sistema Linguístico', desc: 'Modalidade e estrutura. A "gramática" visual: aprenda como a Libras organiza o pensamento e as frases.', icon: Puzzle, color: 'text-orange-500' },
                            { id: 4, title: 'Prática & Parâmetros', desc: 'Constituição da Libras. Mãos na massa: configuração de mãos, ponto de articulação e movimento.', icon: HandMetal, color: 'text-rose-500' },
                            { id: 5, title: 'Expressando Ideias', desc: 'Vocabulário e Contexto. Começando a formar frases, expressar conceitos bíblicos e cotidianos.', icon: MessageCircle, color: 'text-blue-500' },
                            { id: 6, title: 'Fluência & Curiosidades', desc: 'Prática avançada, revisão e avaliação. Refinando a comunicação para diálogos reais e interpretação.', icon: Sparkles, color: 'text-amber-500' },
                        ].map((m) => (
                            <div key={m.id} className={styles.card}>
                                <div className={styles.cardNumber}>{String(m.id).padStart(2, '0')}</div>
                                <h3 className={styles.cardTitle}>{m.title}</h3>
                                <p className={styles.cardDesc}>{m.desc}</p>
                                <m.icon className={`mt-4 ${m.color}`} size={24} />
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA */}
                <section className={styles.ctaSection}>
                    <div className="max-w-2xl mx-auto px-4">
                        <h2 className={styles.ctaTitle}>Seja a Voz de Quem Precisa</h2>
                        <p className={styles.ctaText}>
                            As inscrições para a nova turma estão abertas. Garanta sua vaga e comece essa jornada transformadora.
                        </p>
                        <Link href="/register/libras">
                            <Button size="lg" variant="secondary" className="font-bold text-lg px-8 py-6 h-auto text-cyan-800 bg-white hover:bg-cyan-50">
                                QUERO APRENDER LIBRAS
                            </Button>
                        </Link>
                    </div>
                </section>
            </main>
        </div>
    );
}
