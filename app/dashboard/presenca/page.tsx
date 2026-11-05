'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/utils/supabase/client';
import styles from './page.module.css';
import { QRCodeSVG } from 'qrcode.react';
import {
  Users,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Search,
  RefreshCw,
  QrCode,
  Calendar,
  MessageCircle,
  AlertTriangle,
  X,
  ExternalLink,
  Copy,
  Check
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
  role: string;
}

interface MeetingSession {
  id: string;
  title: string;
  meeting_date: string;
  status: 'scheduled' | 'open' | 'closed';
}

interface AttendanceRecord {
  id: string;
  meeting_id: string;
  congregation_id: string;
  agent_id: string | null;
  agent_name: string;
  agent_phone: string | null;
  status: 'present' | 'justified' | 'absent';
  justification_reason: string | null;
  checkin_type: 'self_service' | 'manual_admin';
  created_at: string;
}

export default function PresencaDashboardPage() {
  const [sessions, setSessions] = useState<MeetingSession[]>([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>('');
  const [congregations, setCongregations] = useState<Congregation[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [allHistoricalAttendances, setAllHistoricalAttendances] = useState<AttendanceRecord[]>([]);
  
  // Filters & State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSectorFilter, setSelectedSectorFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Modal Justificativa Manual
  const [manualModalCongregation, setManualModalCongregation] = useState<Congregation | null>(null);
  const [manualReason, setManualReason] = useState('');

  const publicCheckinUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/presenca` 
    : 'https://semadej.org/presenca';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // 1. Fetch sessions
      const { data: sessData } = await supabase
        .from('meeting_sessions')
        .select('*')
        .order('meeting_date', { ascending: false });

      let currentMeetingId = '';
      if (sessData && sessData.length > 0) {
        setSessions(sessData);
        currentMeetingId = sessData[0].id;
        setSelectedMeetingId(currentMeetingId);
      } else {
        // Auto-provision first session if empty
        const now = new Date();
        const firstSunday = new Date(now.getFullYear(), now.getMonth(), 1);
        const day = firstSunday.getDay();
        firstSunday.setDate(firstSunday.getDate() + (day === 0 ? 0 : 7 - day));
        const iso = firstSunday.toISOString().split('T')[0];

        const { data: newSess } = await supabase
          .from('meeting_sessions')
          .insert({
            title: `Reunião Mensal - ${firstSunday.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
            meeting_date: iso,
            status: 'open'
          })
          .select()
          .single();

        if (newSess) {
          setSessions([newSess]);
          currentMeetingId = newSess.id;
          setSelectedMeetingId(currentMeetingId);
        }
      }

      // 2. Fetch congregations
      const { data: congData } = await supabase
        .from('congregations')
        .select('id, name, sector')
        .order('sector', { ascending: true })
        .order('name', { ascending: true });

      if (congData) setCongregations(congData);

      // 3. Fetch profiles
      const { data: profData } = await supabase
        .from('profiles')
        .select('id, full_name, phone, congregation_id, role')
        .order('full_name');

      if (profData) setProfiles(profData);

      // 4. Fetch Attendances for current meeting and history
      if (currentMeetingId) {
        await fetchAttendances(currentMeetingId);
      }

      // 5. Fetch all historical attendances for 3-absence rule calculation
      const { data: allAtt } = await supabase
        .from('meeting_attendances')
        .select('*');
      if (allAtt) setAllHistoricalAttendances(allAtt);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendances = async (meetingId: string) => {
    if (!meetingId) return;
    try {
      setRefreshing(true);
      const { data: attData } = await supabase
        .from('meeting_attendances')
        .select('*')
        .eq('meeting_id', meetingId);

      if (attData) {
        setAttendances(attData);
      }

      const { data: allAtt } = await supabase
        .from('meeting_attendances')
        .select('*');
      if (allAtt) {
        setAllHistoricalAttendances(allAtt);
      }
    } catch (err) {
      console.error('Erro ao buscar presenças:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleMeetingChange = (newMeetingId: string) => {
    setSelectedMeetingId(newMeetingId);
    fetchAttendances(newMeetingId);
  };

  // Resgate Manual: Alternar Status
  const handleUpdateStatusManual = async (
    congregation: Congregation,
    newStatus: 'present' | 'absent' | 'justified',
    reason: string = ''
  ) => {
    if (!selectedMeetingId) return;

    const existingAgent = profiles.find(p => p.congregation_id === congregation.id);
    const agentName = existingAgent ? existingAgent.full_name : 'Representante Local';

    try {
      const payload = {
        meeting_id: selectedMeetingId,
        congregation_id: congregation.id,
        agent_id: existingAgent?.id || null,
        agent_name: agentName,
        agent_phone: existingAgent?.phone || null,
        status: newStatus,
        justification_reason: newStatus === 'justified' ? reason : null,
        checkin_type: 'manual_admin',
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('meeting_attendances')
        .upsert(payload, { onConflict: 'meeting_id,congregation_id,agent_name' });

      if (error) {
        await supabase.from('meeting_attendances').insert(payload);
      }

      await fetchAttendances(selectedMeetingId);
      setManualModalCongregation(null);
      setManualReason('');
    } catch (err) {
      console.error('Falha ao atualizar presença manual:', err);
    }
  };

  // Sectors list
  const sectors = useMemo(() => {
    return Array.from(new Set(congregations.map(c => c.sector).filter(Boolean))).sort();
  }, [congregations]);

  // Map attendances by congregation ID for quick lookup
  const attendanceMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    attendances.forEach(att => {
      map.set(att.congregation_id, att);
    });
    return map;
  }, [attendances]);

  // Regra das 3 faltas: analisa reuniões anteriores fechadas ou passadas
  const absenceRiskMap = useMemo(() => {
    const map = new Map<string, { consecutiveAbsences: number; riskLevel: 'regular' | 'warning' | 'critical' | 'dismissal' }>();

    const pastSessions = [...sessions]
      .filter(s => s.status === 'closed' || new Date(`${s.meeting_date}T23:59:59`).getTime() < Date.now())
      .sort((a, b) => new Date(b.meeting_date).getTime() - new Date(a.meeting_date).getTime())
      .slice(0, 3);

    congregations.forEach(cong => {
      let consecutive = 0;
      for (const sess of pastSessions) {
        const att = allHistoricalAttendances.find(a => a.meeting_id === sess.id && a.congregation_id === cong.id);
        if (!att || att.status === 'absent') {
          consecutive++;
        } else {
          break;
        }
      }

      let riskLevel: 'regular' | 'warning' | 'critical' | 'dismissal' = 'regular';
      if (consecutive === 1) riskLevel = 'warning';
      else if (consecutive === 2) riskLevel = 'critical';
      else if (consecutive >= 3) riskLevel = 'dismissal';

      map.set(cong.id, { consecutiveAbsences: consecutive, riskLevel });
    });

    return map;
  }, [sessions, congregations, allHistoricalAttendances]);

  const dismissalCount = useMemo(() => {
    let count = 0;
    absenceRiskMap.forEach(v => {
      if (v.riskLevel === 'dismissal') count++;
    });
    return count;
  }, [absenceRiskMap]);

  // Overall statistics
  const stats = useMemo(() => {
    const totalCongregations = congregations.length;
    let presentCount = 0;
    let justifiedCount = 0;

    congregations.forEach(c => {
      const att = attendanceMap.get(c.id);
      if (att?.status === 'present') presentCount++;
      else if (att?.status === 'justified') justifiedCount++;
    });

    const pendingCount = totalCongregations - presentCount - justifiedCount;
    const rate = totalCongregations > 0 
      ? Math.round((presentCount / totalCongregations) * 100) 
      : 0;

    return { totalCongregations, presentCount, justifiedCount, pendingCount, rate };
  }, [congregations, attendanceMap]);

  // Filtered Congregations grouped by Sector
  const groupedBySector = useMemo(() => {
    const groups: { [key: string]: Congregation[] } = {};

    congregations.forEach(c => {
      // Sector filter
      if (selectedSectorFilter !== 'ALL' && c.sector !== selectedSectorFilter) return;

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const congNameMatch = c.name.toLowerCase().includes(searchLower);
        const sectorMatch = (c.sector || '').toLowerCase().includes(searchLower);
        const agentMatch = profiles
          .filter(p => p.congregation_id === c.id)
          .some(p => p.full_name.toLowerCase().includes(searchLower));

        if (!congNameMatch && !sectorMatch && !agentMatch) return;
      }

      // Status filter
      const att = attendanceMap.get(c.id);
      const currentStatus = att?.status || 'absent';
      const risk = absenceRiskMap.get(c.id);

      if (statusFilter === 'critical' && risk?.riskLevel !== 'critical') return;
      if (statusFilter === 'dismissal' && risk?.riskLevel !== 'dismissal') return;
      if (statusFilter !== 'ALL' && statusFilter !== 'critical' && statusFilter !== 'dismissal' && currentStatus !== statusFilter) return;

      const sec = c.sector || 'Sem Setor';
      if (!groups[sec]) groups[sec] = [];
      groups[sec].push(c);
    });

    return groups;
  }, [congregations, selectedSectorFilter, searchTerm, statusFilter, attendanceMap, profiles, absenceRiskMap]);

  const activeMeeting = sessions.find(s => s.id === selectedMeetingId);

  // Generate WhatsApp message for a missing congregation
  const getWhatsAppLink = (
    cong: Congregation,
    agentPhone?: string | null,
    riskLevel?: 'regular' | 'warning' | 'critical' | 'dismissal',
    consecutive?: number
  ) => {
    let messageText = `Paz do Senhor, amado(a)! Estamos na Reunião Mensal de Agentes da SEMADEJ hoje e notamos que a congregação *${cong.name}* (${cong.sector}) ainda não registrou presença.\n\nVocê já está no templo ou precisará justificar ausência? Registre aqui: ${publicCheckinUrl}`;

    if (riskLevel === 'dismissal') {
      messageText = `🚨 *NOTIFICAÇÃO OFICIAL SEMADEJ (REGRA DAS 3 FALTAS)* 🚨\n\nPaz do Senhor, pastor/líder da congregação *${cong.name}*!\n\nInformamos que o agente missionário registrou *${consecutive || 3} ausências consecutivas* sem justificativa nas reuniões mensais.\n\nConforme a diretriz de 2027 aprovada pela Diretoria, foi atingido o limite para desligamento formal da função. Solicitamos alinhamento com a Secretaria para definição de novo representante.`;
    } else if (riskLevel === 'critical') {
      messageText = `⚠️ *ALERTA DE FREQUÊNCIA SEMADEJ*\n\nPaz do Senhor, pastor/líder da congregação *${cong.name}*!\n\nNotamos que o agente missionário já acumula *2 ausências consecutivas* sem justificativa. Lembramos que a 3ª ausência consecutiva acarreta desligamento formal da função conforme as novas diretrizes de 2027.`;
    }

    const message = encodeURIComponent(messageText);

    if (agentPhone) {
      const cleanPhone = agentPhone.replace(/\D/g, '');
      const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
      return `https://wa.me/${fullPhone}?text=${message}`;
    }

    return `https://wa.me/?text=${message}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicCheckinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className={styles.container}>
      {/* Top Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.headerTitle}>
            <Users size={32} /> Presença nas Reuniões Mensais
          </h1>
          <p className={styles.headerSubtitle}>
            Acompanhamento ao vivo dos agentes missionários todo 1º domingo do mês
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            onClick={() => setShowQrModal(true)}
            className={`${styles.actionBtn} ${styles.primaryBtn}`}
          >
            <QrCode size={18} /> Projetar QR Code
          </button>

          <button
            onClick={() => selectedMeetingId && fetchAttendances(selectedMeetingId)}
            className={styles.actionBtn}
            disabled={refreshing}
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
            <Calendar size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.totalCongregations}</span>
            <span className={styles.statLabel}>Total de Congregações</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
            <CheckCircle2 size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.presentCount} ({stats.rate}%)</span>
            <span className={styles.statLabel}>Presentes Confirmados</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconAmber}`}>
            <HelpCircle size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.justifiedCount}</span>
            <span className={styles.statLabel}>Faltas Justificadas</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconRed}`}>
            <AlertCircle size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{stats.pendingCount}</span>
            <span className={styles.statLabel}>Pendentes / Ausentes</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.statIconCritical}`}>
            <AlertTriangle size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{dismissalCount}</span>
            <span className={styles.statLabel}>Risco Desligamento (3 Faltas)</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Selector & Filters */}
      <div className={styles.controlsBar}>
        <div className={styles.filterGroup}>
          <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
            Reunião:
          </label>
          <select
            className={styles.select}
            value={selectedMeetingId}
            onChange={(e) => handleMeetingChange(e.target.value)}
          >
            {sessions.map(s => (
              <option key={s.id} value={s.id}>
                {s.title} ({new Date(`${s.meeting_date}T00:00:00`).toLocaleDateString('pt-BR')})
              </option>
            ))}
          </select>
        </div>

        <div className={styles.searchBox}>
          <Search size={18} color="#94a3b8" />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar por congregação, setor ou agente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <select
            className={styles.select}
            value={selectedSectorFilter}
            onChange={(e) => setSelectedSectorFilter(e.target.value)}
          >
            <option value="ALL">Todos os Setores</option>
            {sectors.map(sec => (
              <option key={sec} value={sec}>{sec}</option>
            ))}
          </select>

          <select
            className={styles.select}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Todos os Status</option>
            <option value="present">Apenas Presentes (🟢)</option>
            <option value="justified">Apenas Justificados (🟡)</option>
            <option value="absent">Apenas Pendentes (🔴)</option>
            <option value="critical">Alerta 2 Faltas (🟠)</option>
            <option value="dismissal">Risco Desligamento 3 Faltas (🚨)</option>
          </select>
        </div>
      </div>

      {/* Sectors & Attendance List */}
      <div className={styles.sectorsContainer}>
        {Object.keys(groupedBySector).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <p style={{ color: '#64748b', fontSize: '1rem', margin: 0 }}>
              Nenhuma congregação encontrada com os filtros selecionados.
            </p>
          </div>
        ) : (
          Object.keys(groupedBySector).sort().map(sectorName => {
            const list = groupedBySector[sectorName];
            const sectorPresent = list.filter(c => attendanceMap.get(c.id)?.status === 'present').length;
            const sectorTotal = list.length;
            const sectorPercent = sectorTotal > 0 ? Math.round((sectorPresent / sectorTotal) * 100) : 0;

            return (
              <div key={sectorName} className={styles.sectorCard}>
                <div className={styles.sectorHeader}>
                  <div className={styles.sectorTitleWrapper}>
                    <h2 className={styles.sectorTitle}>{sectorName}</h2>
                    <span className={styles.sectorBadge}>{sectorTotal} congregações</span>
                  </div>

                  <div className={styles.sectorRate}>
                    <span>Presença: {sectorPresent}/{sectorTotal} ({sectorPercent}%)</span>
                  </div>
                </div>

                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th className={styles.th}>Congregação</th>
                        <th className={styles.th}>Agente(s) Cadastrado(s)</th>
                        <th className={styles.th}>Status da Chamada</th>
                        <th className={styles.th}>Regra 3 Faltas</th>
                        <th className={styles.th}>Resgate Manual</th>
                        <th className={styles.th} style={{ textAlign: 'right' }}>Cobrança Rápida</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map(cong => {
                        const att = attendanceMap.get(cong.id);
                        const congAgents = profiles.filter(p => p.congregation_id === cong.id);
                        const hasNoAgent = congAgents.length === 0;
                        const risk = absenceRiskMap.get(cong.id);

                        return (
                          <tr key={cong.id} className={styles.tr}>
                            <td className={styles.td}>
                              <strong style={{ color: '#0f172a' }}>{cong.name}</strong>
                            </td>

                            <td className={styles.td}>
                              {hasNoAgent ? (
                                <span className={styles.emptyAgentWarning}>
                                  <AlertTriangle size={14} /> Sem agente cadastrado
                                </span>
                              ) : (
                                <div>
                                  {congAgents.map(a => (
                                    <div key={a.id} style={{ fontSize: '0.85rem', color: '#334155' }}>
                                      {a.full_name}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>

                            <td className={styles.td}>
                              {att?.status === 'present' ? (
                                <span className={styles.badgePresent}>
                                  <CheckCircle2 size={14} /> Presente
                                </span>
                              ) : att?.status === 'justified' ? (
                                <div>
                                  <span className={styles.badgeJustified}>
                                    <HelpCircle size={14} /> Justificado
                                  </span>
                                  {att.justification_reason && (
                                    <div style={{ fontSize: '0.75rem', color: '#b45309', marginTop: 4 }}>
                                      "{att.justification_reason}"
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className={styles.badgeAbsent}>
                                  <AlertCircle size={14} /> Ausente / Pendente
                                </span>
                              )}
                            </td>

                            {/* Regra 3 Faltas Column */}
                            <td className={styles.td}>
                              {risk?.riskLevel === 'dismissal' ? (
                                <span className={`${styles.riskBadge} ${styles.riskDismissal}`}>
                                  <AlertCircle size={13} /> {risk.consecutiveAbsences} Faltas (Desligamento)
                                </span>
                              ) : risk?.riskLevel === 'critical' ? (
                                <span className={`${styles.riskBadge} ${styles.riskCritical}`}>
                                  <AlertTriangle size={13} /> 2 Faltas (Alerta)
                                </span>
                              ) : risk?.riskLevel === 'warning' ? (
                                <span className={`${styles.riskBadge} ${styles.riskWarning}`}>
                                  <HelpCircle size={13} /> 1 Falta
                                </span>
                              ) : (
                                <span className={`${styles.riskBadge} ${styles.riskRegular}`}>
                                  <CheckCircle2 size={13} /> Regular
                                </span>
                              )}
                            </td>

                            <td className={styles.td}>
                              <div className={styles.rowActions}>
                                <button
                                  onClick={() => handleUpdateStatusManual(cong, 'present')}
                                  className={`${styles.btnSmall} ${styles.btnSmallCheck}`}
                                  title="Marcar como presente"
                                >
                                  Presente
                                </button>
                                <button
                                  onClick={() => {
                                    setManualModalCongregation(cong);
                                    setManualReason('');
                                  }}
                                  className={styles.btnSmall}
                                  title="Registrar justificativa"
                                >
                                  Justificar
                                </button>
                                {att && (
                                  <button
                                    onClick={() => handleUpdateStatusManual(cong, 'absent')}
                                    className={styles.btnSmall}
                                    style={{ color: '#ef4444' }}
                                    title="Desmarcar / Falta"
                                  >
                                    Limpar
                                  </button>
                                )}
                              </div>
                            </td>

                            <td className={styles.td} style={{ textAlign: 'right' }}>
                              {att?.status !== 'present' && (
                                <a
                                  href={getWhatsAppLink(cong, congAgents[0]?.phone, risk?.riskLevel, risk?.consecutiveAbsences)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={styles.whatsappBtn}
                                >
                                  <MessageCircle size={16} /> Cobrar WhatsApp
                                </a>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal QR Code Projetor */}
      {showQrModal && (
        <div className={styles.modalOverlay} onClick={() => setShowQrModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalCloseBtn} onClick={() => setShowQrModal(false)}>
              <X size={20} />
            </button>

            <h3 className={styles.modalTitle}>Chamada ao Vivo via QR Code</h3>
            <p className={styles.modalText}>
              Projete esta tela no telão da igreja ou compartilhe com os agentes para registro imediato no celular.
            </p>

            <div className={styles.qrWrapper}>
              <QRCodeSVG
                value={publicCheckinUrl}
                size={220}
                level="H"
                includeMargin={true}
              />
            </div>

            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.5rem 0' }}>
              Aponte a câmera do celular para abrir a página de presença
            </p>

            <div className={styles.copyLinkBox}>
              <input
                type="text"
                readOnly
                value={publicCheckinUrl}
                className={styles.linkInput}
              />
              <button onClick={handleCopyLink} className={styles.actionBtn}>
                {copiedLink ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                {copiedLink ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Justificativa Rápida Manual */}
      {manualModalCongregation && (
        <div className={styles.modalOverlay} onClick={() => setManualModalCongregation(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.modalCloseBtn} onClick={() => setManualModalCongregation(null)}>
              <X size={20} />
            </button>

            <h3 className={styles.modalTitle}>Registrar Justificativa</h3>
            <p className={styles.modalText}>
              Congregação: <strong>{manualModalCongregation.name}</strong> ({manualModalCongregation.sector})
            </p>

            <div style={{ textAlign: 'left', margin: '1.25rem 0' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: 6, color: '#334155' }}>
                Motivo informado pelo agente:
              </label>
              <textarea
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  fontSize: '0.875rem',
                  minHeight: 90,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                placeholder="Ex: Escala de culto local, trabalho ou enfermidade..."
                value={manualReason}
                onChange={(e) => setManualReason(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setManualModalCongregation(null)}
                className={styles.actionBtn}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleUpdateStatusManual(manualModalCongregation, 'justified', manualReason)}
                className={`${styles.actionBtn} ${styles.primaryBtn}`}
              >
                Salvar Justificativa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

