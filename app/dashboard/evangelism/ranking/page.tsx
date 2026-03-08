'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Trophy, Users, MapPin, ChevronRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import styles from '../page.module.css'; // Reusing base styles

interface RankingItem {
    congregation_id: string;
    congregation_name: string;
    total_reached: number;
    activity_count: number;
}

export default function EvangelismRankingPage() {
    const [ranking, setRanking] = useState<RankingItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRanking = async () => {
            setLoading(true);
            try {
                // 1. Fetch all records and congregations to aggregate
                // In a production app, this would be a database view or a stored procedure
                const { data: records, error: recordsError } = await supabase
                    .from('evangelism_records')
                    .select('people_reached, congregation_id, congregations(name)');

                if (recordsError) throw recordsError;

                // 2. Aggregate by congregação
                const aggregation: Record<string, RankingItem> = {};

                records.forEach((rec: any) => {
                    const id = rec.congregation_id;
                    if (!aggregation[id]) {
                        aggregation[id] = {
                            congregation_id: id,
                            congregation_name: rec.congregations?.name || 'Congregação Desconhecida',
                            total_reached: 0,
                            activity_count: 0
                        };
                    }
                    aggregation[id].total_reached += rec.people_reached || 0;
                    aggregation[id].activity_count += 1;
                });

                // 3. Sort by total_reached
                const sortedRanking = Object.values(aggregation).sort((a, b) => b.total_reached - a.total_reached);
                setRanking(sortedRanking);

            } catch (error) {
                console.error('Error fetching ranking:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRanking();
    }, []);

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 0.5rem 4rem 0.5rem' }}>
            <div style={{
                textAlign: 'center',
                marginBottom: '2rem',
                padding: '3rem 1rem',
                background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                borderRadius: '1.5rem',
                color: 'white',
                boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.5)'
            }}>
                <Trophy size={48} style={{ margin: '0 auto 1rem', color: '#fbbf24' }} />
                <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Ranking Missionário</h1>
                <p style={{ opacity: 0.9 }}>Congregações que mais impactaram vidas através do evangelismo.</p>
            </div>

            <div style={{ background: 'white', borderRadius: '1.25rem', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>Líderes de Impacto</h2>
                    <Link href="/dashboard/evangelism">
                        <span style={{ fontSize: '0.9rem', color: '#3b82f6', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            Registrar Minha Ação <ChevronRight size={16} />
                        </span>
                    </Link>
                </div>

                {loading ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>Carregando ranking...</div>
                ) : ranking.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
                        Nenhum evangelismo registrado ainda. Seja o primeiro!
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {ranking.map((item, index) => (
                            <div key={item.congregation_id} style={{
                                padding: '1.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1.5rem',
                                borderBottom: index === ranking.length - 1 ? 'none' : '1px solid #f1f5f9',
                                backgroundColor: index === 0 ? 'rgba(251, 191, 36, 0.05)' : 'transparent'
                            }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: index === 0 ? '#fbbf24' : index === 1 ? '#94a3b8' : index === 2 ? '#b45309' : '#f1f5f9',
                                    color: index < 3 ? 'white' : '#64748b',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.1rem',
                                    fontWeight: 800
                                }}>
                                    {index + 1}
                                </div>

                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.25rem' }}>
                                        {item.congregation_name}
                                    </h3>
                                    <div style={{ display: 'flex', gap: '1rem', color: '#64748b', fontSize: '0.85rem' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <MapPin size={14} /> {item.activity_count} {item.activity_count === 1 ? 'ação' : 'ações'}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e3a8a' }}>
                                        {item.total_reached}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                                        Pessoas Impactadas
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <Link href="/dashboard" style={{ color: '#64748b', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <ArrowLeft size={16} /> Voltar ao Início
                </Link>
            </div>
        </div >
    );
}
