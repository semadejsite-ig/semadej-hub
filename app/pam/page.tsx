import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import styles from './page.module.css';
import { ArrowRight, BookOpen, Heart, Globe, GraduationCap, Users } from 'lucide-react';

export default function PAMPage() {
    return (
        <div className="min-h-screen bg-white">
            <Header />

            <main className={styles.container}>
                {/* HERO */}
                <section className={styles.hero}>
                    <div className={styles.heroContent}>
                        <div className={styles.badge}>Inscrições Abertas 2026</div>
                        <h1 className={styles.title}>
                            Curados para <br />
                            <span className="text-blue-600">Curar</span>
                        </h1>
                        <p className={styles.subtitle}>
                            O Programa de Aprofundamento Missionário (PAM) não é apenas um curso.
                            É um convite radical para redescobrir o fundamento da fé e levar o Evangelho ao mundo.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Link href="/register/pam">
                                <Button size="lg" className="shadow-xl shadow-blue-500/20">
                                    Quero me Matricular <ArrowRight className="ml-2" size={18} />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* PREFACE QUOTE */}
                <section className={styles.quoteBox}>
                    <p className={styles.quoteText}>
                        "A jornada que você inicia aqui está centralizada em uma verdade imutável: para realizar a Missão de Deus, primeiro precisamos ser transformados por Ele. Por isso, a nossa formação começa nos fundamentos... lembrando que somos 'Salvos pela Graça' para então sermos 'Curados para Curar'. Não há como edificar o Reino sem primeiro entendermos nossa posição e nossa cura em Cristo."
                    </p>
                    <div className={styles.quoteAuthor}>
                        Pb. Wilkinson dos Santos Martins
                        <div className={styles.quoteRole}>Diretor de Missões - SEMADEJ</div>
                    </div>
                </section>

                {/* FOUNDER TESTIMONY */}
                <section className={styles.quoteBox} style={{ borderLeftColor: '#f97316' }}> {/* Orange border for distinction */}
                    <h3 className="text-xl font-bold text-slate-800 mb-4">Um Chamado para as Nações</h3>
                    <div className="space-y-4">
                        <p className={styles.quoteText}>
                            "Minha jornada com missões abrange mais de 30 anos, período em que realizei trabalhos em campo em mais de 15 países... Descobri bem jovem que o propósito de Deus para mim era adorá-l'O com a minha própria vida, mas foi em Cuba que compreendi que meu maior desejo era doar a minha vida e desgastá-la completamente para proclamar o Reino de Deus."
                        </p>
                        <p className={styles.quoteText}>
                            "A vocação missionária exige a disposição de doar a vida pelo anúncio de Jesus Cristo. Não se trata apenas de dizer que temos vocação, mas de transformá-la em entrega e serviço aos nossos irmãos... É por essa razão — unindo a experiência de campo com a urgência do chamado — que desenvolvi o Programa de Aprofundamento Missionário (PAM)."
                        </p>
                    </div>

                    <div className={styles.quoteAuthor}>
                        Pastor e Missionário Edson Reynaldo Crespi Vianna
                        <div className={styles.quoteRole}>Fundador do PAM</div>
                    </div>
                </section>

                {/* MODULES */}
                <section className={styles.modulesSection}>
                    <h2 className={styles.sectionTitle}>Sua Jornada em 10 Módulos</h2>
                    <div className={styles.grid}>
                        {[
                            { id: 1, title: 'Salvos pela Graça', desc: 'O fundamento de tudo. Entenda a profundidade da graça que nos alcançou para que possamos alcançar outros.', icon: Heart, color: 'text-rose-500' },
                            { id: 2, title: 'Curados para Curar', desc: 'Não há como edificar o Reino sem antes sermos transformados. A cura interior como pré-requisito para a missão.', icon: Heart, color: 'text-rose-500' },
                            { id: 3, title: 'Identidade & Paternidade', desc: 'Aprofundando a teologia pessoal. Reconhecendo quem somos em Deus para servir com segurança.', icon: BookOpen, color: 'text-blue-500' },
                            { id: 4, title: 'Vida no Espírito', desc: 'O poder capacitador para a obra. Sem o Espírito, a missão é impossível. Uma vida de dependência total.', icon: BookOpen, color: 'text-blue-500' },
                            { id: 5, title: 'Cosmovisão Missiológica', desc: 'Expandindo o olhar. Deixando de olhar apenas para si para enxergar o plano global de Deus.', icon: Globe, color: 'text-teal-500' },
                            { id: 6, title: 'O Que Creio', desc: 'Doutrina sólida para tempos líquidos. A importância de saber exatamente em quem e no que cremos.', icon: BookOpen, color: 'text-teal-500' },
                            { id: 7, title: 'Cristão por Convicção', desc: 'Fé inabalável. Transformando conhecimento teológico em certeza de vida prática e testemunho.', icon: BookOpen, color: 'text-teal-500' },
                            { id: 8, title: 'O Missionário', desc: 'O perfil, o caráter e a preparação daquele que é enviado. A vida do obreiro no campo.', icon: Users, color: 'text-orange-500' },
                            { id: 9, title: 'Ministério Infantil', desc: 'Evangelização em todas as idades. Alcançando o futuro da igreja e transformando gerações.', icon: Users, color: 'text-orange-500' },
                            { id: 10, title: 'Projeto de Conclusão', desc: 'O ápice: Desenvolvimento Missionário. Saindo da teoria para plantar sementes reais do Reino.', icon: GraduationCap, color: 'text-amber-500' },
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
                        <h2 className={styles.ctaTitle}>Pronto para o Chamado?</h2>
                        <p className={styles.ctaText}>
                            Que este curso seja o catalisador de um novo fogo missionário em seu coração.
                            As vagas são limitadas para a turma de 2026.
                        </p>
                        <Link href="/register/pam">
                            <Button size="lg" variant="secondary" className="font-bold text-lg px-8 py-6 h-auto">
                                FAZER MINHA INSCRIÇÃO AGORA
                            </Button>
                        </Link>
                    </div>
                </section>
            </main>
        </div>
    );
}
