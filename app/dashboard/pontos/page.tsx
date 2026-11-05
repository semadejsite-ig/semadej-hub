'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/utils/supabase/client';
import styles from './page.module.css';
import {
  MapPin,
  Plus,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  User,
  Phone,
  Building,
  Target,
  Trophy,
  MessageCircle,
  X,
  AlertCircle
} from 'lucide-react';

interface Congregation {
  id: string;
  name: string;
  sector: string;
  region: string | null;
}

interface PreachingPoint {
  id: string;
  congregation_id: string;
  name: string;
  address: string;
  neighborhood: string | null;
  target_quarter: string;
  responsible_name: string;
  responsible_phone: string | null;
  status: 'pending_approval' | 'approved' | 'active' | 'paused';
  notes: string | null;
  validated_by: string | null;
  validated_at: string | null;
  created_at: string;
  congregations?: {
    name: string;
    sector: string;
  };
}

interface UserProfile {
  id: string;
  role: string;
  congregation_id: string | null;
  full_name: string;
}

export default function PontosPregacaoPage() {
  const [points, setPoints] = useState<PreachingPoint[]>([]);
  const [congregations, setCongregations] = useState<Congregation[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Point Form
  const [formData, setFormData] = useState({
    congregation_id: '',
    name: '',
    address: '',
    neighborhood: '',
    responsible_name: '',
    responsible_phone: '',
    target_quarter: 'Q1-2027',
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Check current user
      const isMock = typeof window !== 'undefined' && localStorage.getItem('mock_session') === 'true';
      if (isMock) {
        setCurrentUser({ id: 'mock-admin', role: 'admin', congregation_id: null, full_name: 'Administrador' });
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, role, congregation_id, full_name')
            .eq('id', user.id)
            .single();
          if (profile) setCurrentUser(profile);
        }
      }

      // Fetch congregations
      const { data: congData } = await supabase
        .from('congregations')
        .select('id, name, sector, region')
        .order('sector', { ascending: true })
        .order('name', { ascending: true });
      if (congData) setCongregations(congData);

      // Fetch preaching points
      const { data: pointsData, error } = await supabase
        .from('preaching_points')
        .select('*, congregations(name, sector)')
        .order('created_at', { ascending: false });

      if (pointsData && !error) {
        setPoints(pointsData);
      } else {
        // Fallback: If table not created yet or empty, start with empty list
        setPoints([]);
      }
    } catch (err) {
      console.error('Erro ao carregar pontos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setFormData({
      congregation_id: currentUser?.congregation_id || (congregations[0]?.id || ''),
      name: '',
      address: '',
      neighborhood: '',
      responsible_name: currentUser?.full_name || '',
      responsible_phone: '',
      target_quarter: 'Q1-2027',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.address.trim() || !formData.responsible_name.trim()) {
      alert('Por favor, preencha o nome do ponto, endereço e responsável.');
      return;
    }

    try {
      setSaving(true);
      const isPrivileged = ['admin', 'pastor', 'sector_pastor', 'sector_agent'].includes(currentUser?.role || '');
      const initialStatus = isPrivileged ? 'approved' : 'pending_approval';

      const payload = {
        congregation_id: formData.congregation_id,
        name: formData.name,
        address: formData.address,
        neighborhood: formData.neighborhood || null,
        target_quarter: formData.target_quarter,
        responsible_name: formData.responsible_name,
        responsible_phone: formData.responsible_phone || null,
        notes: formData.notes || null,
        status: initialStatus,
        created_by: currentUser?.id || null,
        validated_by: isPrivileged ? currentUser?.id : null,
        validated_at: isPrivileged ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      };

      const { data: inserted, error } = await supabase
        .from('preaching_points')
        .insert(payload)
        .select('*, congregations(name, sector)')
        .single();

      if (error) {
        throw error;
      }

      if (inserted) {
        setPoints(prev => [inserted, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Erro ao salvar ponto:', err);
      alert('Não foi possível salvar o ponto. Verifique se a tabela foi criada no banco de dados.');
    } finally {
      setSaving(false);
    }
  };

  // Validação pelo Pastor, Líder Setorial ou Admin
  const handleValidatePoint = async (pointId: string) => {
    if (!confirm('Deseja homologar este Ponto de Pregação?')) return;
    try {
      const { error } = await supabase
        .from('preaching_points')
        .update({
          status: 'approved',
          validated_by: currentUser?.id || null,
          validated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', pointId);

      if (error) throw error;

      setPoints(prev =>
        prev.map(p => (p.id === pointId ? { ...p, status: 'approved', validated_at: new Date().toISOString() } : p))
      );
    } catch (err) {
      console.error('Erro ao homologar:', err);
      alert('Erro ao homologar o ponto.');
    }
  };

  // Métricas
  const approvedPointsCount = points.filter(p => p.status === 'approved' || p.status === 'active').length;
  const targetQuarterGoal = 4;
  const totalGoal = 84;
  const quarterProgressPercent = Math.min(Math.round((approvedPointsCount / targetQuarterGoal) * 100), 100);

  // Filtros
  const filteredPoints = useMemo(() => {
    return points.filter(p => {
      const congName = p.congregations?.name || '';
      const sector = p.congregations?.sector || '';
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        congName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.responsible_name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSector = selectedSector === 'ALL' || sector === selectedSector;
      const matchesStatus = selectedStatus === 'ALL' || p.status === selectedStatus;

      return matchesSearch && matchesSector && matchesStatus;
    });
  }, [points, searchTerm, selectedSector, selectedStatus]);

  const sectors = useMemo(() => {
    const list = Array.from(new Set(congregations.map(c => c.sector))).filter(Boolean);
    return list.sort((a, b) => parseInt(a) - parseInt(b));
  }, [congregations]);

  const canValidate = ['admin', 'pastor', 'sector_pastor', 'sector_agent', 'coordinator'].includes(
    currentUser?.role || ''
  );

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Pontos de Pregação</h1>
          <p className={styles.subtitle}>
            Expansão territorial e implantação de novos núcleos evangelísticos na cidade e região.
          </p>
        </div>
        <div className={styles.headerActions}>
          <button onClick={handleOpenModal} className={styles.newPointBtn}>
            <Plus size={18} /> Cadastrar Ponto
          </button>
        </div>
      </header>

      {/* METAS TRIMESTRAIS (ALINHAMENTO 2027) */}
      <div className={styles.goalsGrid}>
        <div className={styles.goalCard}>
          <div className={styles.goalHeader}>
            <span className={styles.goalTitle}>Meta Q1-2027 (1º Trimestre)</span>
            <span className={styles.goalBadge}>Imediata</span>
          </div>
          <div className={styles.goalNumbers}>
            <span className={styles.goalValue}>{approvedPointsCount}</span>
            <span className={styles.goalTarget}>/ {targetQuarterGoal} novos pontos</span>
          </div>
          <div className={styles.progressBarBg}>
            <div className={styles.progressBarFill} style={{ width: `${quarterProgressPercent}%` }}></div>
          </div>
          <span className={styles.goalDesc}>
            Meta de 1 novo ponto ativo por região (Leste, Sudeste, Norte, Sul/Oeste).
          </span>
        </div>

        <div className={styles.goalCard}>
          <div className={styles.goalHeader}>
            <span className={styles.goalTitle}>Meta Global Rumo a 2030</span>
            <span className={styles.goalBadge}>Ciclo 84</span>
          </div>
          <div className={styles.goalNumbers}>
            <span className={styles.goalValue}>{approvedPointsCount}</span>
            <span className={styles.goalTarget}>/ {totalGoal} congregações</span>
          </div>
          <div className={styles.progressBarBg}>
            <div
              className={styles.progressBarFill}
              style={{ width: `${Math.min(Math.round((approvedPointsCount / totalGoal) * 100), 100)}%` }}
            ></div>
          </div>
          <span className={styles.goalDesc}>
            Objetivo institucional de 84 novos pontos estruturados em todo o campo.
          </span>
        </div>
      </div>

      {/* FILTROS */}
      <div className={styles.filterBar}>
        <div className={styles.filterControls}>
          <div className={styles.searchBox}>
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar por nome, bairro, congregação ou responsável..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

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
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className={styles.selectInput}
          >
            <option value="ALL">Todos os Status</option>
            <option value="pending_approval">Aguardando Validação</option>
            <option value="approved">Homologado pelo Pastor</option>
            <option value="active">Ativo / Inaugurado</option>
          </select>
        </div>
      </div>

      {/* LISTAGEM DE PONTOS */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-blue-600 font-medium">
          Carregando pontos de pregação...
        </div>
      ) : filteredPoints.length === 0 ? (
        <div className={styles.emptyState}>
          <MapPin size={48} className="mx-auto mb-3 opacity-40 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-800 mb-1">Nenhum ponto de pregação cadastrado</h3>
          <p className="text-sm text-gray-500 mb-4">
            Cadastre os novos pontos de pregação mapeados pela congregação para este trimestre.
          </p>
          <button onClick={handleOpenModal} className={styles.newPointBtn}>
            <Plus size={16} /> Cadastrar Ponto Agora
          </button>
        </div>
      ) : (
        <div className={styles.pointsGrid}>
          {filteredPoints.map(point => {
            const phoneDigits = point.responsible_phone ? point.responsible_phone.replace(/\D/g, '') : '';
            const whatsappUrl = phoneDigits ? `https://wa.me/55${phoneDigits}` : null;

            return (
              <div key={point.id} className={styles.pointCard}>
                <div>
                  <div className={styles.pointHeader}>
                    <div>
                      <h3 className={styles.pointName}>{point.name}</h3>
                      <span className={styles.pointCongregation}>
                        Congregação {point.congregations?.name || '---'} • Setor{' '}
                        {point.congregations?.sector || '?'}
                      </span>
                    </div>
                    <div>
                      {point.status === 'pending_approval' && (
                        <span className={`${styles.statusBadge} ${styles.statusPending}`}>
                          Aguardando Validação
                        </span>
                      )}
                      {point.status === 'approved' && (
                        <span className={`${styles.statusBadge} ${styles.statusApproved}`}>Homologado</span>
                      )}
                      {point.status === 'active' && (
                        <span className={`${styles.statusBadge} ${styles.statusActive}`}>Ativo</span>
                      )}
                    </div>
                  </div>

                  <div className={styles.pointBody}>
                    <div className={styles.infoRow}>
                      <MapPin size={16} />
                      <span>
                        {point.address} {point.neighborhood ? `• ${point.neighborhood}` : ''}
                      </span>
                    </div>
                    <div className={styles.infoRow}>
                      <User size={16} />
                      <span>Responsável: <strong>{point.responsible_name}</strong></span>
                    </div>
                    {point.responsible_phone && (
                      <div className={styles.infoRow}>
                        <Phone size={16} />
                        <span>{point.responsible_phone}</span>
                      </div>
                    )}
                    <div className={styles.infoRow}>
                      <Target size={16} />
                      <span className="text-xs text-gray-500">Trimestre: {point.target_quarter}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.pointFooter}>
                  {point.status === 'pending_approval' && canValidate ? (
                    <button onClick={() => handleValidatePoint(point.id)} className={styles.validateBtn}>
                      <CheckCircle2 size={15} /> Homologar Ponto
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400">
                      {point.validated_at
                        ? `Validado em ${new Date(point.validated_at).toLocaleDateString('pt-BR')}`
                        : 'Aguardando parecer'}
                    </span>
                  )}

                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.whatsappContactBtn}
                    >
                      <MessageCircle size={15} color="#25D366" /> Falar
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE CADASTRO */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Novo Ponto de Pregação</h2>
              <button onClick={() => setIsModalOpen(false)} className={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Congregação Vinculada *</label>
                <select
                  value={formData.congregation_id}
                  onChange={e => setFormData({ ...formData, congregation_id: e.target.value })}
                  className={styles.formInput}
                  required
                >
                  {congregations.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Setor {c.sector})
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nome / Identificação do Ponto *</label>
                <input
                  type="text"
                  placeholder="Ex: Ponto Missionário Jd. Cerejeiras"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className={styles.formInput}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Endereço ou Ponto de Encontro *</label>
                <input
                  type="text"
                  placeholder="Ex: Rua das Flores, 120 (ou Praça Central)"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className={styles.formInput}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Bairro</label>
                <input
                  type="text"
                  placeholder="Ex: Jardim Paulista"
                  value={formData.neighborhood}
                  onChange={e => setFormData({ ...formData, neighborhood: e.target.value })}
                  className={styles.formInput}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Líder / Responsável *</label>
                  <input
                    type="text"
                    placeholder="Nome do irmão(ã)"
                    value={formData.responsible_name}
                    onChange={e => setFormData({ ...formData, responsible_name: e.target.value })}
                    className={styles.formInput}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>WhatsApp do Responsável</label>
                  <input
                    type="text"
                    placeholder="(12) 99999-9999"
                    value={formData.responsible_phone}
                    onChange={e => setFormData({ ...formData, responsible_phone: e.target.value })}
                    className={styles.formInput}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Trimestre da Meta</label>
                <select
                  value={formData.target_quarter}
                  onChange={e => setFormData({ ...formData, target_quarter: e.target.value })}
                  className={styles.formInput}
                >
                  <option value="Q1-2027">1º Trimestre (Q1-2027) - Imediata</option>
                  <option value="Q2-2027">2º Trimestre (Q2-2027)</option>
                  <option value="Q3-2027">3º Trimestre (Q3-2027)</option>
                  <option value="Q4-2027">4º Trimestre (Q4-2027)</option>
                </select>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={styles.cancelBtn}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.submitBtn} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar Ponto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

