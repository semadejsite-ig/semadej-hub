'use client';

import { useState, useEffect, use } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Header } from '@/components/layout/Header';
import styles from './page.module.css';
import { CheckCircle2, AlertCircle, Heart, User, MapPin, Sparkles, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PublicDecisionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [congregationName, setCongregationName] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    // --- STEP NAVIGATION ---
    const [step, setStep] = useState(1);

    // --- FORM STATES (Physical Form Fields) ---
    const [decisionLocation, setDecisionLocation] = useState('Igreja');
    const [otherLocation, setOtherLocation] = useState('');
    const [decisionDate, setDecisionDate] = useState(new Date().toISOString().split('T')[0]);
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [phoneHome, setPhoneHome] = useState('');
    const [email, setEmail] = useState('');
    const [gender, setGender] = useState<'M' | 'F' | ''>('');
    const [maritalStatus, setMaritalStatus] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [address, setAddress] = useState('');
    const [neighborhood, setNeighborhood] = useState('');
    const [referencePoint, setReferencePoint] = useState('');
    const [city, setCity] = useState('São José dos Campos');
    const [state, setState] = useState('SP');
    
    // Spiritual history
    const [firstDecision, setFirstDecision] = useState<boolean | null>(null);
    const [invitedBy, setInvitedBy] = useState('');
    const [timeAway, setTimeAway] = useState('');
    const [wantsVisitation, setWantsVisitation] = useState<boolean>(true);
    const [notes, setNotes] = useState('');
    const [registeredBy, setRegisteredBy] = useState('');
    const [lgpdConsent, setLgpdConsent] = useState(false);

    const formatPhoneNumber = (value: string) => {
        const clean = value.replace(/\D/g, '');
        if (clean.length <= 2) return clean;
        if (clean.length <= 6) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
        if (clean.length <= 10) return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
        return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`;
    };

    const formatLandline = (value: string) => {
        const clean = value.replace(/\D/g, '');
        if (clean.length <= 2) return clean;
        if (clean.length <= 6) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
        return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6, 10)}`;
    };

    useEffect(() => {
        async function fetchCongregation() {
            try {
                if (id === 'mock' || id === 'test') {
                    setCongregationName('Congregação Central (Mock)');
                    setLoading(false);
                    return;
                }

                const { data, error: fetchErr } = await supabase
                    .from('congregations')
                    .select('name')
                    .eq('id', id)
                    .single();

                if (fetchErr || !data) {
                    const urlParams = new URLSearchParams(window.location.search);
                    const mockName = urlParams.get('mock_name');
                    if (mockName) {
                        setCongregationName(mockName);
                    } else {
                        setCongregationName('Congregação Local');
                    }
                } else {
                    setCongregationName(data.name);
                }
            } catch (err) {
                console.error(err);
                setCongregationName('Congregação Local');
            } finally {
                setLoading(false);
            }
        }
        fetchCongregation();
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fullName || !phone) {
            setError('Por favor, preencha os campos obrigatórios (Nome na Etapa 1 e Celular na Etapa 2).');
            return;
        }
        if (!lgpdConsent) {
            setError('Você precisa aceitar os termos de consentimento da LGPD para enviar.');
            return;
        }

        setSubmitting(true);
        setError('');

        const actualLocation = decisionLocation === 'Outros' ? otherLocation : decisionLocation;

        try {
            const isMock = localStorage.getItem('mock_session') === 'true' || id === 'mock' || id === 'test';
            if (isMock) {
                await new Promise((resolve) => setTimeout(resolve, 1000));
                setSuccess(true);
                return;
            }

            const { error: insertErr } = await supabase
                .from('new_converts')
                .insert([
                    {
                        congregation_id: id,
                        full_name: fullName,
                        phone,
                        phone_home: phoneHome || null,
                        email: email || null,
                        gender: gender || null,
                        marital_status: maritalStatus || null,
                        birth_date: birthDate || null,
                        address: address || null,
                        neighborhood: neighborhood || null,
                        reference_point: referencePoint || null,
                        city: city || null,
                        state: state || null,
                        decision_location: actualLocation,
                        decision_date: decisionDate,
                        first_decision: firstDecision,
                        invited_by: invitedBy || null,
                        time_away: timeAway || null,
                        wants_visitation: wantsVisitation,
                        notes: notes || null,
                        registered_by: registeredBy || null,
                        status: 'pending'
                    }
                ]);

            if (insertErr) throw insertErr;

            // Trigger telegram notification
            fetch('/api/notifications/decisao', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    congregationId: id,
                    congregationName,
                    fullName,
                    phone,
                    notes: `${notes || ''} [Local: ${actualLocation}, Convidado por: ${invitedBy || '-'}]`
                })
            }).catch((err) => console.error('Telegram notification error:', err));

            setSuccess(true);
        } catch (err) {
            console.error('Error details:', err);
            if (err && typeof err === 'object') {
                console.error('Serialized Error:', JSON.stringify(err, null, 2));
            }
            const msg = err instanceof Error ? err.message : 'Erro ao registrar decisão. Por favor, tente novamente.';
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const validateAndAdvance = () => {
        if (step === 1) {
            if (!fullName.trim()) {
                setError('O Nome Completo é obrigatório para continuar.');
                return;
            }
        }
        if (step === 2) {
            if (!phone.trim()) {
                setError('O Celular (WhatsApp) é obrigatório para continuar.');
                return;
            }
        }
        setError('');
        setStep(prev => prev + 1);
    };

    if (loading) {
        return (
            <div className={styles.loadingWrapper}>
                <div className={styles.spinner}></div>
                <p>Carregando formulário...</p>
            </div>
        );
    }

    return (
        <div className={styles.wrapper}>
            <Header />

            <main className={styles.main}>
                <div className={`glass-card ${styles.card}`}>
                    {success ? (
                        <div className={styles.successScreen}>
                            <CheckCircle2 size={64} className={styles.successIcon} />
                            <h2 className={styles.successTitle}>Decisão Registrada!</h2>
                            <p className={styles.successSubtitle}>
                                Glória a Deus por sua vida! O cadastro para a congregação <strong>{congregationName}</strong> foi realizado com sucesso.
                            </p>
                            <div className={styles.blessingBox}>
                                <Heart size={20} className={styles.heartIcon} />
                                <span>Em breve, os voluntários entrarão em contato para acompanhamento. Seja muito bem-vindo(a) à família da fé!</span>
                            </div>
                            <Button 
                                variant="outline" 
                                onClick={() => {
                                    setSuccess(false);
                                    setStep(1);
                                    setFullName('');
                                    setPhone('');
                                    setPhoneHome('');
                                    setEmail('');
                                    setGender('');
                                    setMaritalStatus('');
                                    setBirthDate('');
                                    setAddress('');
                                    setNeighborhood('');
                                    setReferencePoint('');
                                    setFirstDecision(null);
                                    setInvitedBy('');
                                    setTimeAway('');
                                    setNotes('');
                                    setRegisteredBy('');
                                    setLgpdConsent(false);
                                }}
                                className="mt-6"
                            >
                                Registrar Outra Decisão
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className={styles.header}>
                                <h1 className={styles.title}>Ficha de Decisão</h1>
                                <p className={styles.subtitle}>
                                    Registro de decisão por Cristo na congregação:
                                </p>
                                <span className={styles.congregationBadge}>{congregationName}</span>
                            </div>

                            {/* STEPPER INDICATOR */}
                            <div className={styles.stepper}>
                                <div className={`${styles.step} ${step >= 1 ? styles.active : ''}`}>1</div>
                                <div className={styles.line}></div>
                                <div className={`${styles.step} ${step >= 2 ? styles.active : ''}`}>2</div>
                                <div className={styles.line}></div>
                                <div className={`${styles.step} ${step >= 3 ? styles.active : ''}`}>3</div>
                                <div className={styles.line}></div>
                                <div className={`${styles.step} ${step >= 4 ? styles.active : ''}`}>4</div>
                            </div>

                            {error && (
                                <div className={styles.errorBox}>
                                    <AlertCircle size={18} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className={styles.form}>
                                
                                {/* ETAPA 1: IDENTIFICAÇÃO */}
                                {step === 1 && (
                                    <div className={styles.stepContent}>
                                        <div className={styles.sectionHeader}>
                                            <User size={16} className={styles.sectionIcon} />
                                            <h3 className={styles.sectionTitle}>1. Identificação</h3>
                                        </div>

                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>Nome Completo *</label>
                                            <Input
                                                type="text"
                                                placeholder="Digite o nome completo"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                autoCapitalize="words"
                                                autoComplete="name"
                                                autoCorrect="off"
                                                required
                                            />
                                        </div>

                                        <div className={styles.grid3}>
                                            <div className={styles.formGroup}>
                                                <label className={styles.label}>Sexo</label>
                                                <select
                                                    value={gender}
                                                    onChange={(e) => setGender(e.target.value as 'M' | 'F' | '')}
                                                    className={styles.select}
                                                >
                                                    <option value="">Selecione...</option>
                                                    <option value="M">Masculino</option>
                                                    <option value="F">Feminino</option>
                                                </select>
                                            </div>

                                            <div className={styles.formGroup}>
                                                <label className={styles.label}>Estado Civil</label>
                                                <select
                                                    value={maritalStatus}
                                                    onChange={(e) => setMaritalStatus(e.target.value)}
                                                    className={styles.select}
                                                >
                                                    <option value="">Selecione...</option>
                                                    <option value="Solteiro(a)">Solteiro(a)</option>
                                                    <option value="Casado(a)">Casado(a)</option>
                                                    <option value="Divorciado(a)">Divorciado(a)</option>
                                                    <option value="Viúvo(a)">Viúvo(a)</option>
                                                    <option value="União Estável">União Estável</option>
                                                    <option value="Outro">Outro</option>
                                                </select>
                                            </div>

                                            <div className={styles.formGroup}>
                                                <label className={styles.label}>Data de Nascimento</label>
                                                <Input
                                                    type="date"
                                                    value={birthDate}
                                                    onChange={(e) => setBirthDate(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ETAPA 2: CONTATOS & ENDEREÇO */}
                                {step === 2 && (
                                    <div className={styles.stepContent}>
                                        <div className={styles.sectionHeader}>
                                            <MapPin size={16} className={styles.sectionIcon} />
                                            <h3 className={styles.sectionTitle}>2. Contatos & Endereço</h3>
                                        </div>

                                        <div className={styles.grid3}>
                                            <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                                                <label className={styles.label}>Celular (WhatsApp) *</label>
                                                <Input
                                                    type="tel"
                                                    placeholder="(99) 99999-9999"
                                                    value={phone}
                                                    onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                                                    inputMode="tel"
                                                    autoComplete="tel"
                                                    required
                                                />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label className={styles.label}>Fone Residencial</label>
                                                <Input
                                                    type="tel"
                                                    placeholder="(99) 9999-9999"
                                                    value={phoneHome}
                                                    onChange={(e) => setPhoneHome(formatLandline(e.target.value))}
                                                    inputMode="tel"
                                                    autoComplete="tel"
                                                />
                                            </div>
                                        </div>

                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>E-mail</label>
                                            <Input
                                                type="email"
                                                placeholder="nome@exemplo.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                inputMode="email"
                                                autoCapitalize="none"
                                                autoComplete="email"
                                                autoCorrect="off"
                                                spellCheck={false}
                                            />
                                        </div>

                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>Endereço (Rua, Nº, Apto)</label>
                                            <Input
                                                type="text"
                                                placeholder="Rua das Oliveiras, 123"
                                                value={address}
                                                onChange={(e) => setAddress(e.target.value)}
                                                autoCapitalize="words"
                                                autoComplete="street-address"
                                            />
                                        </div>

                                        <div className={styles.grid2}>
                                            <div className={styles.formGroup}>
                                                <label className={styles.label}>Bairro</label>
                                                <Input
                                                    type="text"
                                                    placeholder="Bairro"
                                                    value={neighborhood}
                                                    onChange={(e) => setNeighborhood(e.target.value)}
                                                    autoCapitalize="words"
                                                />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label className={styles.label}>Ponto de Referência</label>
                                                <Input
                                                    type="text"
                                                    placeholder="Próximo ao mercado..."
                                                    value={referencePoint}
                                                    onChange={(e) => setReferencePoint(e.target.value)}
                                                    autoCapitalize="sentences"
                                                />
                                            </div>
                                        </div>

                                        <div className={styles.grid3}>
                                            <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                                                <label className={styles.label}>Cidade</label>
                                                <Input
                                                    type="text"
                                                    value={city}
                                                    onChange={(e) => setCity(e.target.value)}
                                                    autoCapitalize="words"
                                                    autoComplete="address-level2"
                                                />
                                            </div>
                                            <div className={styles.formGroup}>
                                                <label className={styles.label}>Estado</label>
                                                <Input
                                                    type="text"
                                                    maxLength={2}
                                                    value={state}
                                                    onChange={(e) => setState(e.target.value.toUpperCase())}
                                                    autoCapitalize="characters"
                                                    autoComplete="address-level1"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ETAPA 3: DETALHES DA DECISÃO */}
                                {step === 3 && (
                                    <div className={styles.stepContent}>
                                        <div className={styles.sectionHeader}>
                                            <Sparkles size={16} className={styles.sectionIcon} />
                                            <h3 className={styles.sectionTitle}>3. Local e Data da Decisão</h3>
                                        </div>

                                        <div className={styles.grid2}>
                                            <div className={styles.formGroup}>
                                                <label className={styles.label}>Local da Decisão</label>
                                                <select
                                                    value={decisionLocation}
                                                    onChange={(e) => setDecisionLocation(e.target.value)}
                                                    className={styles.select}
                                                >
                                                    <option value="Igreja">Igreja</option>
                                                    <option value="Residência">Residência</option>
                                                    <option value="Vias Públicas">Vias Públicas</option>
                                                    <option value="Outros">Outros</option>
                                                </select>
                                            </div>

                                            <div className={styles.formGroup}>
                                                <label className={styles.label}>Data da Decisão</label>
                                                <Input
                                                    type="date"
                                                    value={decisionDate}
                                                    onChange={(e) => setDecisionDate(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {decisionLocation === 'Outros' && (
                                            <div className={styles.formGroup}>
                                                <label className={styles.label}>Especifique o Local</label>
                                                <Input
                                                    type="text"
                                                    placeholder="Descreva o local"
                                                    value={otherLocation}
                                                    onChange={(e) => setOtherLocation(e.target.value)}
                                                    autoCapitalize="sentences"
                                                    required
                                                />
                                            </div>
                                        )}

                                        <div className={styles.formGroup} style={{ marginTop: '0.75rem' }}>
                                            <label className={styles.label}>É a primeira vez que aceita a Jesus?</label>
                                            <div className={styles.radioGroup}>
                                                <label className={styles.radioLabel}>
                                                    <input
                                                        type="radio"
                                                        name="firstDecision"
                                                        checked={firstDecision === true}
                                                        onChange={() => setFirstDecision(true)}
                                                        className={styles.radio}
                                                    />
                                                    Sim, nunca fui crente
                                                </label>
                                                <label className={styles.radioLabel}>
                                                    <input
                                                        type="radio"
                                                        name="firstDecision"
                                                        checked={firstDecision === false}
                                                        onChange={() => setFirstDecision(false)}
                                                        className={styles.radio}
                                                    />
                                                    Não, eu estava afastado(a)
                                                </label>
                                            </div>
                                        </div>

                                        {firstDecision === false && (
                                            <div className={styles.formGroup}>
                                                <label className={styles.label}>Há quanto tempo estava afastado(a)?</label>
                                                <Input
                                                    type="text"
                                                    placeholder="Ex: 2 anos"
                                                    value={timeAway}
                                                    onChange={(e) => setTimeAway(e.target.value)}
                                                    autoCapitalize="none"
                                                />
                                            </div>
                                        )}

                                        <div className={styles.grid2}>
                                            <div className={styles.formGroup}>
                                                <label className={styles.label}>Convidado por</label>
                                                <Input
                                                    type="text"
                                                    placeholder="Nome do convidante"
                                                    value={invitedBy}
                                                    onChange={(e) => setInvitedBy(e.target.value)}
                                                    autoCapitalize="words"
                                                />
                                            </div>

                                            <div className={styles.formGroup}>
                                                <label className={styles.label}>Deseja receber visitas?</label>
                                                <select
                                                    value={wantsVisitation ? 'Sim' : 'Não'}
                                                    onChange={(e) => setWantsVisitation(e.target.value === 'Sim')}
                                                    className={styles.select}
                                                >
                                                    <option value="Sim">Sim, desejo receber visitas</option>
                                                    <option value="Não">Não</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ETAPA 4: TERMOS E ENVIO */}
                                {step === 4 && (
                                    <div className={styles.stepContent}>
                                        <div className={styles.sectionHeader}>
                                            <BookOpen size={16} className={styles.sectionIcon} />
                                            <h3 className={styles.sectionTitle}>4. Observações & Envio</h3>
                                        </div>

                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>Anotado por (Nome de quem preenche)</label>
                                            <Input
                                                type="text"
                                                placeholder="Seu nome"
                                                value={registeredBy}
                                                onChange={(e) => setRegisteredBy(e.target.value)}
                                                autoCapitalize="words"
                                            />
                                        </div>

                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>Observações Adicionais</label>
                                            <textarea
                                                className={styles.textarea}
                                                placeholder="Detalhes adicionais relevantes..."
                                                rows={4}
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                autoCapitalize="sentences"
                                            />
                                        </div>

                                        <div className={styles.consentGroup}>
                                            <label className={styles.checkboxLabel}>
                                                <input
                                                    type="checkbox"
                                                    checked={lgpdConsent}
                                                    onChange={(e) => setLgpdConsent(e.target.checked)}
                                                    disabled={submitting}
                                                    className={styles.checkbox}
                                                />
                                                <span className={styles.consentText}>
                                                    Declaro que concordo em compartilhar meus dados pessoais para fins de acolhimento espiritual, discipulado e acompanhamento pela liderança da igreja local, em conformidade com a Lei Geral de Proteção de Dados (LGPD).
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                )}

                                {/* NAVIGATION BUTTONS */}
                                <div className={styles.navigationButtons}>
                                    {step > 1 && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setStep(prev => prev - 1)}
                                            disabled={submitting}
                                            className="flex items-center gap-1"
                                        >
                                            <ChevronLeft size={16} /> Voltar
                                        </Button>
                                    )}
                                    {step < 4 ? (
                                        <Button
                                            type="button"
                                            onClick={validateAndAdvance}
                                            className="ml-auto flex items-center gap-1"
                                        >
                                            Avançar <ChevronRight size={16} />
                                        </Button>
                                    ) : (
                                        <Button
                                            type="submit"
                                            className="ml-auto"
                                            isLoading={submitting}
                                        >
                                            Enviar Ficha de Decisão
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
