'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/utils/supabase/client';
import styles from './page.module.css';
import { QRCodeSVG } from 'qrcode.react';
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
  CreditCard
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

const PIX_KEY = 'missoesadbelemsjc@gmail.com';
const PIX_PAYLOAD = '00020101021126490014br.gov.bcb.pix0127missoesadbelemsjc@gmail.com5204520453039865802BR5904SEDE6015SAO JOSE DOS CA62290525SEDE000000SEMADEJ0122MNF363042D5E';

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
      if (isMock) {
        setCurrentUser({ id: 'mock-admin', role: 'admin', congregation_id: null, full_name: 'Administrador', phone: null });
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, role, congregation_id, full_name, phone')
            .eq('id', user.id)
            .single();
          if (profile) setCurrentUser(profile);
        }
      }

      // 1. Fetch congregations
      const { data: congData } = await supabase
        .from('congregations')
        .select('id, name, sector')
        .order('sector', { ascending: true })
        .order('name', { ascending: true });
      if (congData) setCongregations(congData);

      // 2. Fetch profiles for contacts
      const { data: profData } = await supabase
        .from('profiles')
        .select('id, full_name, phone, congregation_id, role');
      if (profData) setProfiles(profData);

      // 3. Fetch payments for selected year
      const { data: payData, error } = await supabase
        .from('operational_fund_payments')
        .select('*, congregations(name, sector)')
        .eq('payment_year', selectedYear);

      if (payData && !error) {
        setPayments(payData);
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
    navigator.clipboard.writeText(PIX_KEY);
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
          setPayments(prev => [...prev.filter(p => !(p.congregation_id === reportingCongregation.id && p.payment_month === selectedMonth)), inserted]);
        }
      } else if (saved) {
        setPayments(prev => [...prev.filter(p => !(p.congregation_id === reportingCongregation.id && p.payment_month === selectedMonth)), saved]);
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
          confirmed
        ]);
      }
    } catch (err) {
      console.error('Erro ao confirmar:', err);
      alert('Erro ao confirmar recebimento.');
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

  // Overall Statistics for current month
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

  const getWhatsAppRemindLink = (cong: Congregation, agentPhone?: string | null) => {
    const message = encodeURIComponent(
      `Paz do Senhor, amado(a) pastor/agente da congregação *${cong.name}*!\n\nLembramos sobre o repasse mensal da contribuição operacional da SEMADEJ (*R$ 30,00*) referente a *${MONTH_NAMES[selectedMonth - 1]} de ${selectedYear}*.\n\nEsse valor apoia diretamente a impressão de fichas, materiais de treinamento nos polos e suporte missionário.\n\n🔑 *Chave PIX:* ${PIX_KEY}`
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
      {/* HEADER */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Fundo Operacional das 84 Congregações</h1>
          <p className={styles.subtitle}>
            Apoio operacional de R$ 30/mês para infraestrutura, materiais e logística da Secretaria de Missões.
          </p>
        </div>
      </header>

      {/* PIX BANNER INFORMATIVO */}
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
            <span className="text-xs text-gray-500 font-bold uppercase">Chave PIX:</span>
            <span className={styles.pixKey}>{PIX_KEY}</span>
            <button onClick={handleCopyPix} className={styles.copyBtn}>
              {copiedPix ? <Check size={14} /> : <Copy size={14} />}
              {copiedPix ? 'Copiado!' : 'Copiar'}
            </button>
            <button onClick={() => setShowQrModal(true)} className={`${styles.copyBtn} bg-slate-800`}>
              <QrCode size={14} /> QR Code
            </button>
          </div>
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

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className={styles.selectInput}
            >
              <option value="ALL">Todos os Status</option>
              <option value="paid">Adimplentes / Pagos (🟢)</option>
              <option value="pending">Pendentes (🔴)</option>
            </select>

            <div className={styles.searchBox}>
              <Search size={16} />
              <input
                type="text"
                placeholder="Buscar congregação..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
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
                {canConfirm && <th className={styles.th}>Tesouraria</th>}
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
                        <span className="text-xs text-gray-500">Repasse registrado</span>
                      )}
                    </td>
                    {canConfirm && (
                      <td className={styles.td}>
                        {pay?.status !== 'confirmed' ? (
                          <button onClick={() => handleConfirmPayment(cong.id)} className={styles.confirmBtn}>
                            <CheckCircle2 size={13} /> Confirmar PIX
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-600 font-bold">OK</span>
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

      {/* MODAL QR CODE PIX */}
      {showQrModal && (
        <div className={styles.modalOverlay} onClick={() => setShowQrModal(false)}>
          <div className={styles.modalContent} style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>QR Code PIX - Secretaria SEMADEJ</h2>
              <button onClick={() => setShowQrModal(false)} className={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>
            <div className="p-4 flex flex-col items-center justify-center">
              <QRCodeSVG value={PIX_PAYLOAD} size={220} level="M" />
              <div className="mt-4 font-mono text-sm text-gray-700 bg-gray-100 p-2 rounded w-full break-all">
                {PIX_KEY}
              </div>
            </div>
            <div className="mt-4">
              <button onClick={handleCopyPix} className={styles.submitBtn}>
                <Copy size={16} /> Copiar Chave PIX
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

