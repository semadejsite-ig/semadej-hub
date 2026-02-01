'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Users, Save, CheckCircle } from 'lucide-react';
import styles from './page.module.css';

export default function CongregationStatsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [success, setSuccess] = useState(false);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [schoolName, setSchoolName] = useState('');

    const [formData, setFormData] = useState({
        members_count: '',
        carnets_count: ''
    });

    useEffect(() => {
        const getData = async () => {
            // Mock Bypass
            const isMock = localStorage.getItem('mock_session');
            if (isMock) {
                setUserProfile({ id: 'mock', congregation_id: 'mock' });
                setSchoolName("Congregação Exemplo");
                setFormData({ members_count: '150', carnets_count: '80' });
                setFetching(false);
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            // 1. Get Profile
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (!profile || !profile.congregation_id) {
                alert("Perfil incompleto.");
                return;
            }
            setUserProfile(profile);

            // 2. Get Congregation Data
            const { data: cong } = await supabase
                .from('congregations')
                .select('name, members_count, carnets_count')
                .eq('id', profile.congregation_id)
                .single();

            if (cong) {
                setSchoolName(cong.name);
                setFormData({
                    members_count: cong.members_count?.toString() || '',
                    carnets_count: cong.carnets_count?.toString() || ''
                });
            }
            setFetching(false);
        };
        getData();
    }, [router]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Mock Bypass
            const isMock = localStorage.getItem('mock_session');
            if (isMock) {
                await new Promise(r => setTimeout(r, 1000));
                setSuccess(true);
                return;
            }

            const { error } = await supabase
                .from('congregations')
                .update({
                    members_count: parseInt(formData.members_count) || 0,
                    carnets_count: parseInt(formData.carnets_count) || 0
                })
                .eq('id', userProfile.congregation_id);

            if (error) throw error;
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000); // Reset success after 3s

        } catch (error) {
            console.error(error);
            alert("Erro ao atualizar dados.");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="p-8 text-center">Carregando dados...</div>;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Dados da Congregação</h1>
                <p className={styles.subtitle}>{schoolName}</p>
            </header>

            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <Users size={32} />
                    <h3 className={styles.cardTitle}>Atualizar Estatísticas</h3>
                </div>

                <form onSubmit={handleUpdate} className={styles.form}>
                    <Input
                        id="members_count"
                        label="Quantos membros possui a sua congregação?"
                        type="number"
                        placeholder="0"
                        value={formData.members_count}
                        onChange={e => setFormData({ ...formData, members_count: e.target.value })}
                    />

                    <Input
                        id="carnets_count"
                        label="Quantos membros possuem o Carnê Missionário?"
                        type="number"
                        placeholder="0"
                        value={formData.carnets_count}
                        onChange={e => setFormData({ ...formData, carnets_count: e.target.value })}
                    />

                    <div className={styles.actions}>
                        {success ? (
                            <Button className={styles.successBtn} type="button">
                                <CheckCircle size={18} className="mr-2" /> Salvo com Sucesso!
                            </Button>
                        ) : (
                            <Button type="submit" size="lg" isLoading={loading} className="w-full">
                                <Save size={18} className="mr-2" /> Salvar Informações
                            </Button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
