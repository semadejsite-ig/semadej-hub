'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/utils/supabase/client';
import styles from './page.module.css';
import {
  DollarSign,
  Copy,
  Check,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageCircle,
  QrCode,
  Building,
  Upload,
  X,
  CreditCard,
  RotateCcw,
  Download
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
  congregation_id: string | null;
  role: string;
  congregations?: {
    name: string;
    sector: string;
  } | null;
}

interface FundPayment {
  id: string;
  congregation_id: string;
  payment_month: number;
  payment_year: number;
  amount: number;
  status: 'pending' | 'paid' | 'confirmed';
  payment_method: string;
  receipt_url: string | null;
  notes: string | null;
  paid_at: string | null;
  confirmed_at: string | null;
  congregations?: {
    name: string;
    sector: string;
  };
}

// Chave PIX oficial (EMV Payload Copia e Cola)
const PIX_PAYLOAD = '00020101021126490014br.gov.bcb.pix0127missoesadbelemsjc@gmail.com5204520453039865802BR5904SEDE6015SAO JOSE DOS CA62290525SEDE000000SEMADEJ0122MNF363042D5E';
const PIX_EMAIL = 'missoesadbelemsjc@gmail.com';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function FundoOperacionalPage() {
  const [congregations, setCongregations] = useState<Congregation[]>([]);
  const [payments, setPayments] = useState<FundPayment[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedSector, setSelectedSector] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedPix, setCopiedPix] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Payment reporting modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportingCongregation, setReportingCongregation] = useState<Congregation | null>(null);
  const [reportNotes, setReportNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [selectedYear]);

  const loadData = async () => {
    try {
      setLoading(true);

      const isMock = typeof window !== 'undefined' && localStorage.getItem('mock_session') === 'true';
      let currentProf: Profile | null = null;

      if (isMock) {
        currentProf = { id: 'mock-admin', role: 'admin', congregation_id: null, full_name: 'Administrador', phone: null };
        setCurrentUser(currentProf);
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, role, congregation_id, full_name, phone, congregations(name, sector)')
            .eq('id', user.id)
            .single();
          if (profile) {
            currentProf = profile as unknown as Profile;
            setCurrentUser(currentProf);
          }
        }
      }

      // Regra de acesso baseada no Perfil:
      // - admin / treasurer: vê todas as 84 congregações
      // - sector_agent / sector_pastor: vê apenas congregações do seu setor
      // - agent / pastor: vê apenas a sua congregação
      const userRole = currentProf?.role || 'agent';
      const userSector = currentProf?.congregations?.sector;
      const userCongregationId = currentProf?.congregation_id;

      let congQuery = supabase
        .from('congregations')
        .select('id, name, sector')
        .order('sector', { ascending: true })
        .order('name', { ascending: true });

      if (['sector_agent', 'sector_pastor'].includes(userRole)) {
        if (userSector) {
          congQuery = congQuery.eq('sector', userSector);
          setSelectedSector(userSector);
        }
      } else if (userRole === 'agent' || userRole === 'pastor') {
        if (userCongregationId) {
          congQuery = congQuery.eq('id', userCongregationId);
        }
      }

      const { data: congData } = await congQuery;
      if (congData) setCongregations(congData);

      // Fetch profiles for contacts
      const { data: profData } = await supabase
        .from('profiles')
        .select('id, full_name, phone, congregation_id, role');
      if (profData) setProfiles(profData as unknown as Profile[]);

      // Fetch payments for selected year
      let payQuery = supabase
        .from('operational_fund_payments')
        .select('*, congregations(name, sector)')
        .eq('payment_year', selectedYear);

      if (userRole === 'agent' || userRole === 'pastor') {
        if (userCongregationId) {
          payQuery = payQuery.eq('congregation_id', userCongregationId);
        }
      }

      const { data: payData, error } = await payQuery;

      if (payData && !error) {
        setPayments(payData as unknown as FundPayment[]);
      } else {
        setPayments([]);
      }
    } catch (err) {
      console.error('Erro ao carregar fundo operacional:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(PIX_PAYLOAD);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
  };

  const handleOpenReportModal = (cong: Congregation) => {
    setReportingCongregation(cong);
    setReportNotes('');
    setIsModalOpen(true);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingCongregation) return;

    try {
      setSubmitting(true);
      const isPrivileged = ['admin', 'treasurer'].includes(currentUser?.role || '');
      const newStatus = isPrivileged ? 'confirmed' : 'paid';

      const payload = {
        congregation_id: reportingCongregation.id,
        payment_month: selectedMonth,
        payment_year: selectedYear,
        amount: 30.00,
        status: newStatus,
        payment_method: 'pix',
        notes: reportNotes || null,
        paid_at: new Date().toISOString(),
        confirmed_by: isPrivileged ? currentUser?.id : null,
        confirmed_at: isPrivileged ? new Date().toISOString() : null,
        created_by: currentUser?.id || null,
        updated_at: new Date().toISOString()
      };

      const { data: saved, error } = await supabase
        .from('operational_fund_payments')
        .upsert(payload, { onConflict: 'congregation_id,payment_month,payment_year' })
        .select('*, congregations(name, sector)')
        .single();

      if (error) {
        // Fallback simple insert
        const { data: inserted, error: insErr } = await supabase
          .from('operational_fund_payments')
          .insert(payload)
          .select('*, congregations(name, sector)')
          .single();
        if (insErr) throw insErr;
        if (inserted) {
          setPayments(prev => [
            ...prev.filter(p => !(p.congregation_id === reportingCongregation.id && p.payment_month === selectedMonth)),
            inserted as unknown as FundPayment
          ]);
        }
      } else if (saved) {
        setPayments(prev => [
          ...prev.filter(p => !(p.congregation_id === reportingCongregation.id && p.payment_month === selectedMonth)),
          saved as unknown as FundPayment
        ]);
      }

      setIsModalOpen(false);
      alert('Repasse informado com sucesso!');
    } catch (err) {
      console.error('Erro ao registrar repasse:', err);
      alert('Não foi possível registrar o repasse.');
    } finally {
      setSubmitting(false);
    }
  };

  // Confirmar recebimento (Tesouraria / Admin)
  const handleConfirmPayment = async (congId: string) => {
    try {
      const payload = {
        congregation_id: congId,
        payment_month: selectedMonth,
        payment_year: selectedYear,
        amount: 30.00,
        status: 'confirmed',
        payment_method: 'pix',
        confirmed_by: currentUser?.id || null,
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: confirmed, error } = await supabase
        .from('operational_fund_payments')
        .upsert(payload, { onConflict: 'congregation_id,payment_month,payment_year' })
        .select('*, congregations(name, sector)')
        .single();

      if (error) throw error;

      if (confirmed) {
        setPayments(prev => [
          ...prev.filter(p => !(p.congregation_id === congId && p.payment_month === selectedMonth)),
          confirmed as unknown as FundPayment
        ]);
      }
    } catch (err) {
      console.error('Erro ao confirmar:', err);
      alert('Erro ao confirmar recebimento.');
    }
  };

  // Desfazer confirmação (Rollback) - Tesouraria / Admin
  const handleRollbackPayment = async (congId: string) => {
    if (!confirm('Deseja desfazer a confirmação deste PIX? O status voltará para pendente/aguardando validação.')) {
      return;
    }

    try {
      const existing = currentMonthPaymentMap.get(congId);
      // Se o agente já havia informado, volta para 'paid'; se foi marcado direto, volta para 'pending'
      const newStatus = existing?.notes || existing?.receipt_url ? 'paid' : 'pending';

      const payload = {
        congregation_id: congId,
        payment_month: selectedMonth,
        payment_year: selectedYear,
        status: newStatus,
        confirmed_by: null,
        confirmed_at: null,
        updated_at: new Date().toISOString()
      };

      const { data: rolledBack, error } = await supabase
        .from('operational_fund_payments')
        .upsert(payload, { onConflict: 'congregation_id,payment_month,payment_year' })
        .select('*, congregations(name, sector)')
        .single();

      if (error) throw error;

      if (rolledBack) {
        setPayments(prev => [
          ...prev.filter(p => !(p.congregation_id === congId && p.payment_month === selectedMonth)),
          rolledBack as unknown as FundPayment
        ]);
      }
      alert('Confirmação revertida com sucesso!');
    } catch (err) {
      console.error('Erro ao desfazer confirmação:', err);
      alert('Erro ao desfazer a confirmação.');
    }
  };

  // Quick lookup of payments for the selected month
  const currentMonthPaymentMap = useMemo(() => {
    const map = new Map<string, FundPayment>();
    payments
      .filter(p => p.payment_month === selectedMonth && p.payment_year === selectedYear)
      .forEach(p => {
        map.set(p.congregation_id, p);
      });
    return map;
  }, [payments, selectedMonth, selectedYear]);

  // Overall Statistics for current month (scoped)
  const stats = useMemo(() => {
    const total = congregations.length;
    let paidCount = 0;
    let confirmedCount = 0;

    congregations.forEach(c => {
      const pay = currentMonthPaymentMap.get(c.id);
      if (pay?.status === 'confirmed') {
        confirmedCount++;
        paidCount++;
      } else if (pay?.status === 'paid') {
        paidCount++;
      }
    });

    const pendingCount = total - paidCount;
    const rate = total > 0 ? Math.round((paidCount / total) * 100) : 0;
    const totalCollected = paidCount * 30.0;

    return { total, paidCount, confirmedCount, pendingCount, rate, totalCollected };
  }, [congregations, currentMonthPaymentMap]);

  // Filtered Congregations
  const filteredCongregations = useMemo(() => {
    return congregations.filter(c => {
      const pay = currentMonthPaymentMap.get(c.id);
      const isPaid = pay?.status === 'paid' || pay?.status === 'confirmed';

      const matchesSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.sector.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSector = selectedSector === 'ALL' || c.sector === selectedSector;

      let matchesStatus = true;
      if (statusFilter === 'paid') matchesStatus = isPaid;
      else if (statusFilter === 'pending') matchesStatus = !isPaid;

      return matchesSearch && matchesSector && matchesStatus;
    });
  }, [congregations, currentMonthPaymentMap, searchTerm, selectedSector, statusFilter]);

  const sectors = useMemo(() => {
    const list = Array.from(new Set(congregations.map(c => c.sector))).filter(Boolean);
    return list.sort((a, b) => parseInt(a) - parseInt(b));
  }, [congregations]);

  const canConfirm = ['admin', 'treasurer'].includes(currentUser?.role || '');
  const userRole = currentUser?.role || 'agent';
  const userSector = currentUser?.congregations?.sector;

  const getWhatsAppRemindLink = (cong: Congregation, agentPhone?: string | null) => {
    const message = encodeURIComponent(
      `Paz do Senhor, amado(a) pastor/agente da congregação *${cong.name}*!\n\nLembramos sobre o repasse mensal da contribuição operacional da SEMADEJ (*R$ 30,00*) referente a *${MONTH_NAMES[selectedMonth - 1]} de ${selectedYear}*.\n\nEsse valor apoia diretamente a impressão de fichas de cadastro, materiais de treinamento nos polos e suporte missionário.\n\n🔑 *Código PIX Copia e Cola:* \n${PIX_PAYLOAD}`
    );

    if (agentPhone) {
      const cleanPhone = agentPhone.replace(/\D/g, '');
      const fullPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
      return `https://wa.me/${fullPhone}?text=${message}`;
    }

    return `https://wa.me/?text=${message}`;
  };

  return (
    <div className={styles.container}>
      {/* HEADER (Revisado com a cor e padrão consistente com os outros cabeçalhos) */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Fundo Operacional das Congregações</h1>
          <p className={styles.subtitle}>
            Apoio operacional de R$ 30/mês por congregação para impressão de materiais, fichas e logística de missões.
          </p>
        </div>
        <div>
          <span className={styles.scopeBadge}>
            {userRole === 'admin' || userRole === 'treasurer'
              ? '🌍 Visão Global (84 Congregações)'
              : ['sector_agent', 'sector_pastor'].includes(userRole)
              ? `Setor ${userSector || '?'}`
              : `Congregação ${currentUser?.congregations?.name || 'Local'}`}
          </span>
        </div>
      </header>

      {/* PIX BANNER INFORMATIVO (Com Chave Oficial e Thumbnail do QR Code Oficial) */}
      <div className={styles.pixBanner}>
        <div className={styles.pixInfo}>
          <div className={styles.pixTitle}>
            <CreditCard size={20} className="text-emerald-600" />
            Contribuição Mensal: R$ 30,00 por Congregação
          </div>
          <p className={styles.pixDesc}>
            O valor simbólico apoia a impressão de materiais, fichas de cadastro, suporte logístico e reuniões nos polos regionais.
          </p>
          <div className={styles.pixKeyBox}>
            <span className="text-xs text-gray-500 font-bold uppercase">PIX Copia e Cola:</span>
            <span className={styles.pixKey} title={PIX_PAYLOAD}>
              {PIX_PAYLOAD.slice(0, 36)}...{PIX_PAYLOAD.slice(-12)}
            </span>
            <button onClick={handleCopyPix} className={styles.copyBtn}>
              {copiedPix ? <Check size={14} /> : <Copy size={14} />}
              {copiedPix ? 'Código Copiado!' : 'Copiar Código'}
            </button>
            <button onClick={() => setShowQrModal(true)} className={`${styles.copyBtn} bg-slate-800`}>
              <QrCode size={14} /> Ver QR Code Oficial
            </button>
          </div>
        </div>

        <div className={styles.qrCodeThumbnail} onClick={() => setShowQrModal(true)} title="Clique para ampliar o QR Code">
          {/* Imagem do QR Code oficial anexado */}
          <img
            src="/pix-qrcode-semadej.png"
            alt="QR Code PIX Oficial"
            width={85}
            height={85}
            className="rounded-lg border shadow-sm hover:opacity-90 transition-opacity"
          />
          <span className="text-xs text-gray-500 font-semibold mt-1 flex items-center gap-1 justify-center">
            <QrCode size={12} /> Ampliar
          </span>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statTitle}>Adesão no Mês ({MONTH_NAMES[selectedMonth - 1]})</div>
          <div className={styles.statValue}>
            {stats.paidCount} <span className="text-sm font-semibold text-gray-500">/ {stats.total} congregações</span>
          </div>
          <div className={styles.statSub}>{stats.rate}% de cumprimento no período</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statTitle}>Total Arrecadado</div>
          <div className={`${styles.statValue} text-emerald-600`}>
            R$ {stats.totalCollected.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className={styles.statSub}>Fundo operacional disponível</div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statTitle}>Pendências do Mês</div>
          <div className={`${styles.statValue} text-red-600`}>{stats.pendingCount}</div>
          <div className={styles.statSub}>Congregações aguardando repasse</div>
        </div>
      </div>

      {/* TABELA DE CONTROLE MENSAL */}
      <div className={styles.matrixCard}>
        <div className={styles.matrixHeader}>
          <h2 className={styles.matrixTitle}>
            Acompanhamento: {MONTH_NAMES[selectedMonth - 1]} / {selectedYear}
          </h2>

          <div className={styles.matrixControls}>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(Number(e.target.value))}
              className={styles.selectInput}
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              className={styles.selectInput}
            >
              <option value={2026}>2026</option>
              <option value={2027}>2027</option>
            </select>

            {/* Filtro de setor só aparece se tiver mais de um setor disponível */}
            {sectors.length > 1 && (
              <select
                value={selectedSector}
                onChange={e => setSelectedSector(e.target.value)}
                className={styles.selectInput}
              >
                <option value="ALL">Todos os Setores</option>
                {sectors.map(s => (
                  <option key={s} value={s}>
                    Setor {s}
                  </option>
                ))}
              </select>
            )}

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className={styles.selectInput}
            >
              <option value="ALL">Todos os Status</option>
              <option value="paid">Adimplentes / Pagos (🟢)</option>
              <option value="pending">Pendentes (🔴)</option>
            </select>

            {congregations.length > 1 && (
              <div className={styles.searchBox}>
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Buscar congregação..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Congregação</th>
                <th className={styles.th}>Setor</th>
                <th className={styles.th}>Valor</th>
                <th className={styles.th}>Status ({MONTH_NAMES[selectedMonth - 1]})</th>
                <th className={styles.th}>Ação do Agente</th>
                {canConfirm && <th className={styles.th}>Tesouraria / Validação</th>}
                <th className={styles.th} style={{ textAlign: 'right' }}>Cobrança WhatsApp</th>
              </tr>
            </thead>
            <tbody>
              {filteredCongregations.map(cong => {
                const pay = currentMonthPaymentMap.get(cong.id);
                const isPaid = pay?.status === 'paid' || pay?.status === 'confirmed';
                const congAgents = profiles.filter(p => p.congregation_id === cong.id);

                return (
                  <tr key={cong.id}>
                    <td className={styles.td}>
                      <strong>{cong.name}</strong>
                    </td>
                    <td className={styles.td}>Setor {cong.sector}</td>
                    <td className={styles.td}>R$ 30,00</td>
                    <td className={styles.td}>
                      {pay?.status === 'confirmed' ? (
                        <span className={styles.statusPaid}>
                          <CheckCircle2 size={13} /> Confirmado
                        </span>
                      ) : pay?.status === 'paid' ? (
                        <span className={styles.statusPaid} style={{ background: '#fef3c7', color: '#b45309' }}>
                          <Clock size={13} /> Aguardando Validação
                        </span>
                      ) : (
                        <span className={styles.statusPending}>
                          <AlertCircle size={13} /> Pendente
                        </span>
                      )}
                    </td>
                    <td className={styles.td}>
                      {!isPaid ? (
                        <button
                          onClick={() => handleOpenReportModal(cong)}
                          className={styles.confirmBtn}
                          style={{ background: '#2563eb' }}
                        >
                          Informar Repasse
                        </button>
                      ) : (
                        <span className="text-xs text-gray-500 font-medium">Repasse registrado</span>
                      )}
                    </td>

                    {/* Coluna da Tesouraria com Ação de Confirmação e ROLLBACK */}
                    {canConfirm && (
                      <td className={styles.td}>
                        {pay?.status !== 'confirmed' ? (
                          <button onClick={() => handleConfirmPayment(cong.id)} className={styles.confirmBtn}>
                            <CheckCircle2 size={13} /> Confirmar PIX
                          </button>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                              <CheckCircle2 size={13} /> OK
                            </span>
                            <button
                              onClick={() => handleRollbackPayment(cong.id)}
                              className={styles.rollbackBtn}
                              title="Desfazer confirmação (Voltar para pendente/aguardando)"
                            >
                              <RotateCcw size={12} /> Desfazer
                            </button>
                          </div>
                        )}
                      </td>
                    )}

                    <td className={styles.td} style={{ textAlign: 'right' }}>
                      {!isPaid && (
                        <a
                          href={getWhatsAppRemindLink(cong, congAgents[0]?.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.whatsappRemindBtn}
                        >
                          <MessageCircle size={14} color="#25D366" /> Lembrar Repasse
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

      {/* MODAL INFORMAR REPASSE */}
      {isModalOpen && reportingCongregation && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Informar Repasse de R$ 30</h2>
              <button onClick={() => setIsModalOpen(false)} className={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment}>
              <div className="mb-4 text-sm text-gray-600">
                Congregação: <strong>{reportingCongregation.name} (Setor {reportingCongregation.sector})</strong>
                <br />
                Referência: <strong>{MONTH_NAMES[selectedMonth - 1]} / {selectedYear}</strong>
                <br />
                Valor: <strong>R$ 30,00 (PIX)</strong>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Observação / Código da Transação (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Pago via PIX pelo dirigente / comprovante enviado"
                  value={reportNotes}
                  onChange={e => setReportNotes(e.target.value)}
                  className={styles.formInput}
                />
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={styles.cancelBtn}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.submitBtn} disabled={submitting}>
                  {submitting ? 'Salvando...' : 'Confirmar Envio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL QR CODE PIX OFICIAL */}
      {showQrModal && (
        <div className={styles.modalOverlay} onClick={() => setShowQrModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>QR Code Oficial - Secretaria SEMADEJ</h2>
              <button onClick={() => setShowQrModal(false)} className={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col items-center justify-center">
              {/* Imagem oficial anexada */}
              <img
                src="/pix-qrcode-semadej.png"
                alt="QR Code Oficial SEMADEJ"
                className={styles.qrModalImage}
              />
            </div>

            {/* Caixa estruturada e elegante para copiar o código sem quebrar layout */}
            <div className={styles.pixCopyContainer}>
              <span className={styles.pixCopyLabel}>Código PIX Copia e Cola:</span>
              <div className={styles.pixCopyInputWrapper}>
                <input
                  type="text"
                  readOnly
                  value={PIX_PAYLOAD}
                  className={styles.pixCopyInput}
                  onClick={e => (e.target as HTMLInputElement).select()}
                />
                <button
                  type="button"
                  onClick={handleCopyPix}
                  className={styles.pixCopyActionBtn}
                >
                  {copiedPix ? <Check size={14} /> : <Copy size={14} />}
                  {copiedPix ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              <span className={styles.pixHelpText}>
                Chave e-mail alternativa: <strong>{PIX_EMAIL}</strong>
              </span>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <a
                href="/pix-qrcode-semadej.png"
                download="qrcode-pix-semadej.png"
                className={styles.submitBtn}
                style={{ background: '#2563eb', textDecoration: 'none' }}
              >
                <Download size={16} /> Baixar Imagem
              </a>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className={styles.cancelBtn}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
