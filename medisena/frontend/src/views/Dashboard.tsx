import React, { useState, useEffect } from 'react';
import api from '../api/api';
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MinusCircle
} from 'lucide-react';
import {
  MedicoIcon,
  BeneficiarioCitaIcon,
  RelojIcon,
  BeneficiariosActivosIcon,
  CitasProgramadasIcon,
  CitasProgramadasIcon2,
  OrdenesMedicasIcon,
  ProfesionalesIcon
} from '../components/Icons';
import CampanaSvg from '../assets/img/icons/campana.svg';
import '../App.css';
import '../styles/Dashboard/Dashboard.css';

export interface Cita {
  id: number | string;
  medico: string;
  beneficiario: string;
  hora: string;
}

export interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
}

export interface CitaCardProps {
  cita: Cita;
}

/** Respuesta de `GET /api/dashboard` (estadísticas reales, incluye conteos de agendas). */
export interface DashboardStats {
  total_beneficiarios_activos?: number;
  total_citas?: number;
  citas_hoy?: number;
  total_ordenes?: number;
  total_cuentas_cobro?: number;
  total_medicos?: number;
  total_contratistas?: number;
}

function formatIntegerEs(value: unknown): string {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return '0';
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(n);
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const getFormattedDate = () => {
    const parts = new Date().toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).split(' ');
    if (parts.length > 2) {
      parts[2] = parts[2].charAt(0).toUpperCase() + parts[2].slice(1);
    }
    return parts.join(' ');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, citasRes] = await Promise.all([
          api.get('/dashboard'),
          api.get('/dashboard/citas-recientes', {
            params: { page: currentPage, pageSize },
          }),
        ]);
        setStats(statsRes.data as DashboardStats);
        const payload = citasRes.data as {
          data?: Array<Record<string, unknown>>;
          pagination?: { totalPages?: number; totalItems?: number; page?: number; pageSize?: number };
        };
        const rows = Array.isArray(payload?.data) ? payload.data : [];
        setCitas(
          rows.map((row, idx) => ({
            id: `${row.IDEN_FUNC ?? row.IDEN_FUNC_AGENDA ?? 'id'}-${row.LETRA_BEN ?? row.LETRA_BEN_AGENDA ?? 'x'}-${idx}`,
            medico: String(row.MEDICO ?? '—'),
            beneficiario: String(row.PACIENTE ?? '—'),
            hora: String(row.HORA_AGENDA ?? '—'),
          }))
        );
        const pag = payload?.pagination;
        const ti = typeof pag?.totalItems === 'number' ? pag.totalItems : 0;
        const tp = typeof pag?.totalPages === 'number' && pag.totalPages > 0 ? pag.totalPages : 1;
        setTotalItems(ti);
        setTotalPages(tp);
      } catch (err) {
        console.error("Error al cargar datos del dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentPage, pageSize]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100%' }}>
        <Loader2 className="animate-spin" size={48} color="#1C3E57" />
      </div>
    );
  }

  const pageWindow = 5;
  let pageStart = Math.max(1, currentPage - Math.floor(pageWindow / 2));
  let pageEnd = Math.min(totalPages, pageStart + pageWindow - 1);
  if (pageEnd - pageStart + 1 < Math.min(pageWindow, totalPages)) {
    pageStart = Math.max(1, pageEnd - Math.min(pageWindow, totalPages) + 1);
  }
  const pageNumbers = Array.from({ length: Math.max(0, pageEnd - pageStart + 1) }, (_, i) => pageStart + i);

  const effectiveTotal =
    totalItems > 0
      ? totalItems
      : citas.length > 0
        ? (currentPage - 1) * pageSize + citas.length
        : 0;
  const rangeStart = effectiveTotal === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd =
    effectiveTotal === 0 ? 0 : Math.min(currentPage * pageSize, effectiveTotal);
  const pagesLabel =
    totalPages === 1 ? '1 página' : `${formatIntegerEs(totalPages)} páginas`;

  const benefActivos = formatIntegerEs(stats?.total_beneficiarios_activos);
  const citasTotal = formatIntegerEs(stats?.total_citas);
  const citasHoy = formatIntegerEs(stats?.citas_hoy);
  const ordenes = formatIntegerEs(stats?.total_ordenes);
  const cuentasCobro = formatIntegerEs(stats?.total_cuentas_cobro);
  const medicos = formatIntegerEs(stats?.total_medicos);
  const contratistas = formatIntegerEs(stats?.total_contratistas);
  const nombreUsuario = sessionStorage.getItem('nombreCompleto')?.trim().split(' ')[0] || 'Usuario';

  return (

    <main className="dashboard-page">

      {/* ── Header ──  */}
      <header className="dashboard-header">
        <div className="header-title-container">
          <div className="sun-icon-container">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="#1C3E57" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          </div>
          <div>
            <h1 className="header-title">Buenos días, {nombreUsuario}</h1>
            <p className="header-date">{getFormattedDate()}</p>
          </div>
        </div>
        <div className="notification-wrapper">
          <img
            src={CampanaSvg}
            alt="Notificaciones"
            style={{ width: 64, height: 64, cursor: 'pointer', flexShrink: 0 }}
          />
        </div>
      </header>

      {/* ── Stats ── */}
      <div className="stats-grid">
        <StatCard
          title="Beneficiarios activos"
          value={benefActivos}
          subtitle="Beneficiarios activos"
          icon={<BeneficiariosActivosIcon size={20} />}
        />
        <StatCard
          title="Citas programadas"
          value={citasTotal}
          subtitle={`${citasHoy} hoy`}
          icon={<CitasProgramadasIcon size={20} />}
        />
        <StatCard
          title="Órdenes médicas"
          value={ordenes}
          subtitle={`${cuentasCobro} cuentas de cobro`}
          icon={<OrdenesMedicasIcon size={20} />}
        />
        <StatCard
          title="Profesionales"
          value={medicos}
          subtitle={`${contratistas} contratistas`}
          icon={<ProfesionalesIcon size={20} />}
        />
      </div>

      {/* ── Título Citas (FUERA del contenedor blanco) ── */}
      <div className="citas-header">
        <div className="citas-header-icon">
          <CitasProgramadasIcon2 size={15} color="white" />
        </div>
        <h2 className="citas-title">Citas programadas</h2>
      </div>

      {/* ── Citas Section (solo cards + paginación) ── */}
      <section className="citas-section">
        <div className="citas-list">
          {citas.map(cita => (
            <CitaCard key={cita.id} cita={cita} />
          ))}
        </div>

        {/* Paginación */}
        <div className="pagination">
          <div className="pagination-left">
            <span>Elementos por página</span>
            <select
              className="page-select"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>

          <div className="pagination-center">
            <button className="page-btn" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
              <ChevronsLeft size={12} />
            </button>
            <button className="page-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
              <ChevronLeft size={12} />
            </button>
            {pageNumbers.map(n => (
              <button
                key={n}
                className={`page-btn${currentPage === n ? ' active-page-btn' : ''}`}
                onClick={() => setCurrentPage(n)}
              >
                {n}
              </button>
            ))}
            <button className="page-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
              <ChevronRight size={12} />
            </button>
            <button className="page-btn" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
              <ChevronsRight size={12} />
            </button>
          </div>

          <div className="pagination-right">
            {effectiveTotal === 0
              ? 'Sin citas en esta vista'
              : `${formatIntegerEs(rangeStart)} – ${formatIntegerEs(rangeEnd)} de ${formatIntegerEs(effectiveTotal)} citas · ${pagesLabel}`}
          </div>
        </div>
      </section>
    </main>
  );
};

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon }) => (
        <div className="stat-card">
          <div className="stat-card-content">
            <div className="stat-header">
              <div className="stat-icon">{icon}</div>
              <span className="stat-title">{title}</span>
            </div>
            <span className="stat-value">{value}</span>
            <span className="stat-subtitle">{subtitle}</span>
          </div>
          <div className="stat-decoration"></div>
        </div>
        );

        const CitaCard: React.FC<CitaCardProps> = ({cita}) => (
          <div className="cita-card">
            <div className="cita-content">
              <div className="cita-top">
                <h3 className="cita-type">Consulta médica</h3>
                <span className="active-badge">
                  <MinusCircle size={12} strokeWidth={2.5} />
                  Activo
                </span>
              </div>
              <div className="cita-details">
                <div className="detail-item">
                  <MedicoIcon size={16} color="#002C4D" />
                  <span className="detail-label">Médico:</span>
                  <span className="detail-value">{cita.medico}</span>
                </div>
                <div className="detail-item">
                  <BeneficiarioCitaIcon size={16} color="#002C4D" />
                  <span className="detail-label">Beneficiario:</span>
                  <span className="detail-value">{cita.beneficiario}</span>
                </div>
                <div className="detail-item">
                  <RelojIcon size={16} color="#002C4D" />
                  <span className="detail-label">Hora de la consulta:</span>
                  <span className="detail-value">{cita.hora}</span>
                </div>
              </div>
            </div>
            <div className="cita-decoration"></div>
          </div>
          );

          export default Dashboard;