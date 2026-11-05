'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import styles from './page.module.css';
import { 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Send, 
  UserCheck, 
  AlertCircle,
  FileText
} from 'lucide-react';

interface Congregation {
  id: string;
  name: string;
  sector: string;
}

interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  congregation_id: string;
}

interface MeetingSession {
  id: string;
  title: string;
  meeting_date: string;
  status: 'scheduled' | 'open' | 'closed';
}

export default function PublicPresencaPage() {
  const [meeting, setMeeting] = useState<MeetingSession | null>(null);
  const [sectors, setSectors] = useState<string[]>([]);
  const [congregations, setCongregations] = useState<Congregation[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  
  // Form state
  const [selectedSector, setSelectedSector] = useState('');
  const [selectedCongregationId, setSelectedCongregationId] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [customAgentName, setCustomAgentName] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [actionType, setActionType] = useState<'present' | 'justified'>('present');
  const [justificationReason, setJustificationReason] = useState('');
  
  // UI status
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isWindowValid, setIsWindowValid] = useState(true);
  const [windowMessage, setWindowMessage] = useState('');
  const [successReceipt, setSuccessReceipt] = useState<{
    congregationName: string;
    agentName: string;
    status: 'present' | 'justified';
    date: string;
  } | null>(null);

  // Helper: Get First Sunday of a given month
  const getFirstSundayOfMonth = (year: number, monthIndex: number) => {
    const date = new Date(year, monthIndex, 1);
    const day = date.getDay();
    const diff = day === 0 ? 0 : 7 - day;
    date.setDate(date.getDate() + diff);
    return date;
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      // 1. Fetch or initialize active meeting session
      const now = new Date();
      let targetDate = getFirstSundayOfMonth(now.getFullYear(), now.getMonth());
      
      // If current first sunday is more than 7 days in the past, default to next month's 1st sunday
      const sevenDaysAfter = new Date(targetDate);
      sevenDaysAfter.setDate(sevenDaysAfter.getDate() + 7);
      if (now > sevenDaysAfter) {
        targetDate = getFirstSundayOfMonth(now.getFullYear(), now.getMonth() + 1);
      }

      const isoDate = targetDate.toISOString().split('T')[0];
      const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      const defaultTitle = `Reunião Mensal - ${monthNames[targetDate.getMonth()]}/${targetDate.getFullYear()}`;

      // Query database for session
      const { data: sessionData } = await supabase
        .from('meeting_sessions')
        .select('*')
        .eq('status', 'open')
        .order('meeting_date', { ascending: true })
        .limit(1);

      let currentMeeting: MeetingSession;

      if (sessionData && sessionData.length > 0) {
        currentMeeting = sessionData[0];
      } else {
        // Fallback / Auto-provision session in state
        currentMeeting = {
          id: 'temp-session',
          title: defaultTitle,
          meeting_date: isoDate,
          status: 'open'
        };

        // Try registering in DB if table exists
        try {
          const { data: insertedSession } = await supabase
            .from('meeting_sessions')
            .upsert({
              title: defaultTitle,
              meeting_date: isoDate,
              status: 'open'
            }, { onConflict: 'meeting_date' })
            .select()
            .single();

          if (insertedSession) {
            currentMeeting = insertedSession;
          }
        } catch {
          // If upsert fails gracefully keep fallback
        }
      }

      setMeeting(currentMeeting);

      // Validate 7-day window rule
      const meetingDateTime = new Date(`${currentMeeting.meeting_date}T00:00:00`);
      const minDate = new Date(meetingDateTime);
      minDate.setDate(minDate.getDate() - 7);
      const maxDate = new Date(meetingDateTime);
      maxDate.setDate(maxDate.getDate() + 7);
      maxDate.setHours(23, 59, 59, 999);

      if (now < minDate) {
        setIsWindowValid(false);
        setWindowMessage(`A chamada oficial para esta reunião será liberada a partir de ${minDate.toLocaleDateString('pt-BR')}.`);
      } else if (now > maxDate) {
        setIsWindowValid(false);
        setWindowMessage(`O prazo de 7 dias para envio de justificativa para esta reunião encerrou-se em ${maxDate.toLocaleDateString('pt-BR')}.`);
      } else {
        setIsWindowValid(true);
      }

      // 2. Fetch congregations
      const { data: congData, error: congErr } = await supabase
        .from('congregations')
        .select('id, name, sector')
        .order('name');

      if (congErr) throw congErr;
      if (congData) {
        setCongregations(congData);
        const uniqueSectors = Array.from(
          new Set(congData.map(c => c.sector).filter(Boolean))
        ).sort();
        setSectors(uniqueSectors as string[]);
      }

      // 3. Fetch profiles
      const { data: profData, error: profErr } = await supabase
        .from('profiles')
        .select('id, full_name, phone, congregation_id')
        .order('full_name');

      if (!profErr && profData) {
        setProfiles(profData);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar dados';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  // Filter congregations by chosen sector
  const filteredCongregations = congregations.filter(
    c => !selectedSector || c.sector === selectedSector
  );

  // Filter agents for selected congregation
  const congregationAgents = profiles.filter(
    p => p.congregation_id === selectedCongregationId
  );

  const selectedCongregation = congregations.find(c => c.id === selectedCongregationId);
  const isCongregationEmpty = selectedCongregationId && congregationAgents.length === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meeting) return;
    if (!selectedCongregationId) {
      setErrorMessage('Por favor, selecione uma congregação.');
      return;
    }

    let finalAgentName = '';
    let finalPhone = customPhone;

    if (selectedAgentId && selectedAgentId !== 'custom') {
      const agent = congregationAgents.find(a => a.id === selectedAgentId);
      finalAgentName = agent ? agent.full_name : '';
      finalPhone = agent?.phone || customPhone;
    } else {
      if (!customAgentName.trim()) {
        setErrorMessage('Por favor, informe seu nome completo.');
        return;
      }
      finalAgentName = customAgentName.trim();
    }

    if (actionType === 'justified' && !justificationReason.trim()) {
      setErrorMessage('Por favor, descreva brevemente o motivo da sua justificativa.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage('');

      // Insert or update attendance record
      const attendancePayload = {
        meeting_id: meeting.id,
        congregation_id: selectedCongregationId,
        agent_id: selectedAgentId !== 'custom' ? selectedAgentId : null,
        agent_name: finalAgentName,
        agent_phone: finalPhone || null,
        status: actionType,
        justification_reason: actionType === 'justified' ? justificationReason.trim() : null,
        checkin_type: 'self_service',
        updated_at: new Date().toISOString()
      };

      const { error: upsertErr } = await supabase
        .from('meeting_attendances')
        .upsert(attendancePayload, {
          onConflict: 'meeting_id,congregation_id,agent_name'
        });

      if (upsertErr) {
        // If conflict constraint varies, try standard insert
        const { error: insertErr } = await supabase
          .from('meeting_attendances')
          .insert(attendancePayload);
        if (insertErr) throw insertErr;
      }

      setSuccessReceipt({
        congregationName: selectedCongregation?.name || '',
        agentName: finalAgentName,
        status: actionType,
        date: new Date().toLocaleDateString('pt-BR')
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Falha ao registrar presença. Tente novamente.';
      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSuccessReceipt(null);
    setSelectedCongregationId('');
    setSelectedAgentId('');
    setCustomAgentName('');
    setCustomPhone('');
    setJustificationReason('');
    setActionType('present');
    setErrorMessage('');
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.badge}>
            <UserCheck size={14} /> SEMADEJ • 1º Domingo do Mês
          </span>
          <h1 className={styles.title}>Chamada & Justificativa</h1>
          <p className={styles.subtitle}>
            Confirmação de presença para os Agentes Missionários nas congregações
          </p>
        </div>

        {loading ? (
          <div className={styles.loadingSpinner}>
            <Clock className="animate-spin" size={32} />
          </div>
        ) : successReceipt ? (
          <div className={styles.successBox}>
            <div className={styles.successIconCircle}>
              <CheckCircle2 size={36} />
            </div>
            <h2 className={styles.successTitle}>
              {successReceipt.status === 'present' ? 'Presença Confirmada!' : 'Justificativa Registrada!'}
            </h2>
            <p className={styles.successDescription}>
              Seu registro foi recebido pela coordenação da SEMADEJ.
            </p>

            <div className={styles.successReceipt}>
              <div className={styles.receiptRow}>
                <span className={styles.receiptLabel}>Agente / Representante:</span>
                <span className={styles.receiptValue}>{successReceipt.agentName}</span>
              </div>
              <div className={styles.receiptRow}>
                <span className={styles.receiptLabel}>Congregação:</span>
                <span className={styles.receiptValue}>{successReceipt.congregationName}</span>
              </div>
              <div className={styles.receiptRow}>
                <span className={styles.receiptLabel}>Status:</span>
                <span className={styles.receiptValue}>
                  {successReceipt.status === 'present' ? '🟢 Presente' : '🟡 Falta Justificada'}
                </span>
              </div>
              <div className={styles.receiptRow}>
                <span className={styles.receiptLabel}>Data do Registro:</span>
                <span className={styles.receiptValue}>{successReceipt.date}</span>
              </div>
            </div>

            <button onClick={handleReset} className={styles.btnReset}>
              Fazer Novo Registro
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Banner da Reunião Atual */}
            {meeting && (
              <div className={styles.meetingBanner}>
                <div className={styles.calendarIconWrapper}>
                  <Calendar size={22} />
                </div>
                <div>
                  <h3 className={styles.meetingInfoTitle}>{meeting.title}</h3>
                  <p className={styles.meetingInfoDate}>
                    Data Oficial: {new Date(`${meeting.meeting_date}T00:00:00`).toLocaleDateString('pt-BR')} (Janela: ±7 dias)
                  </p>
                </div>
              </div>
            )}

            {!isWindowValid && windowMessage && (
              <div className={styles.emptyAlert}>
                <AlertCircle size={20} className={styles.emptyAlertIcon} />
                <span>{windowMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className={styles.errorBanner}>
                <AlertCircle size={18} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Alternância de Tipo de Registro */}
            <div className={styles.actionTabs}>
              <button
                type="button"
                onClick={() => setActionType('present')}
                className={`${styles.tabBtn} ${
                  actionType === 'present' 
                    ? styles.tabBtnPresentActive 
                    : styles.tabBtnPresentInactive
                }`}
              >
                <CheckCircle2 size={16} /> Estou Presente
              </button>
              <button
                type="button"
                onClick={() => setActionType('justified')}
                className={`${styles.tabBtn} ${
                  actionType === 'justified' 
                    ? styles.tabBtnJustifyActive 
                    : styles.tabBtnJustifyInactive
                }`}
              >
                <FileText size={16} /> Justificar Falta
              </button>
            </div>

            {/* Passo 1: Filtrar por Setor */}
            <div className={styles.formGroup}>
              <label className={styles.label}>1. Setor da Congregação</label>
              <select
                className={styles.select}
                value={selectedSector}
                onChange={(e) => {
                  setSelectedSector(e.target.value);
                  setSelectedCongregationId('');
                  setSelectedAgentId('');
                }}
              >
                <option value="">Selecione o Setor...</option>
                {sectors.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
              </select>
            </div>

            {/* Passo 2: Selecionar Congregação */}
            <div className={styles.formGroup}>
              <label className={styles.label}>2. Congregação</label>
              <select
                className={styles.select}
                value={selectedCongregationId}
                onChange={(e) => {
                  setSelectedCongregationId(e.target.value);
                  setSelectedAgentId('');
                }}
                disabled={!selectedSector && sectors.length > 0}
              >
                <option value="">
                  {!selectedSector && sectors.length > 0
                    ? 'Primeiro selecione o setor...'
                    : 'Selecione a sua congregação...'}
                </option>
                {filteredCongregations.map((cong) => (
                  <option key={cong.id} value={cong.id}>
                    {cong.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Alerta de Congregação Descoberta (Sem Agente Cadastrado) */}
            {isCongregationEmpty && (
              <div className={styles.emptyAlert}>
                <AlertTriangle size={22} className={styles.emptyAlertIcon} />
                <div>
                  <strong>Atenção:</strong> Esta congregação não possui nenhum agente missionário registrado no sistema. 
                  Informe seus dados abaixo para registrar sua presença como representante.
                </div>
              </div>
            )}

            {/* Passo 3: Identificação do Agente */}
            {selectedCongregationId && (
              <div className={styles.formGroup}>
                <label className={styles.label}>3. Identificação do Agente</label>
                {congregationAgents.length > 0 ? (
                  <select
                    className={styles.select}
                    value={selectedAgentId}
                    onChange={(e) => setSelectedAgentId(e.target.value)}
                  >
                    <option value="">Selecione seu nome na lista...</option>
                    {congregationAgents.map((ag) => (
                      <option key={ag.id} value={ag.id}>
                        {ag.full_name}
                      </option>
                    ))}
                    <option value="custom">Outro (Representante / Não estou na lista)</option>
                  </select>
                ) : (
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 0.5rem 0' }}>
                    Identifique-se como visitante/representante da congregação:
                  </p>
                )}
              </div>
            )}

            {/* Campos Manuais para Quem Não Está na Lista ou Congregação Vaga */}
            {selectedCongregationId && (selectedAgentId === 'custom' || isCongregationEmpty) && (
              <>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Seu Nome Completo</label>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Ex: João da Silva"
                    value={customAgentName}
                    onChange={(e) => setCustomAgentName(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Seu WhatsApp (Opcional)</label>
                  <input
                    type="tel"
                    className={styles.input}
                    placeholder="(99) 99999-9999"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Campo de Justificativa (se aplicável) */}
            {actionType === 'justified' && (
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Motivo da Ausência (Aviso à Coordenação)
                </label>
                <textarea
                  className={styles.textarea}
                  placeholder="Ex: Motivo de escala na igreja local / Trabalho / Enfermidade..."
                  value={justificationReason}
                  onChange={(e) => setJustificationReason(e.target.value)}
                />
              </div>
            )}

            {/* Botão de Envio */}
            <button
              type="submit"
              disabled={submitting || !selectedCongregationId}
              className={actionType === 'present' ? styles.submitBtnPresent : styles.submitBtnJustify}
            >
              <Send size={18} />
              {submitting
                ? 'Gravando...'
                : actionType === 'present'
                ? 'Confirmar Minha Presença'
                : 'Enviar Justificativa de Ausência'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

