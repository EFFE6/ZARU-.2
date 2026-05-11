import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../components/Sidebar';
import MovTabs from './MovTabs';
import api from '../../api/api';
import {
  ChevronRight, ChevronLeft, Home, Eye, RefreshCw,
  Plus, ChevronDown, Check,
} from 'lucide-react';
import '../../styles/GestionResoluciones/GestionResoluciones.css';
import './OrdenAtencion.css';
import './CuentaCobro.css';

interface CuentaCobro {
  id: number;
  numero: number;
  contratista: string;
  periodo: string;
  fecha: string;
  valor: string;
  estado: string;
}

const ESTADOS_CC = ['Todos', 'PENDIENTE', 'APROBADA', 'RECHAZADA'];

/* ── Badge Estado ── */
const EstadoCCBadge: React.FC<{ estado: string }> = ({ estado }) => {
  const map: Record<string, string> = {
    PENDIENTE: 'cc-badge-pendiente',
    APROBADA: 'cc-badge-aprobada',
    RECHAZADA: 'cc-badge-rechazada',
  };
  return <span className={`cc-estado-badge ${map[estado] ?? 'cc-badge-pendiente'}`}>{estado}</span>;
};

/* ── Formatear periodo ISO ── */
const formatPeriodo = (iso: string) => {
  try {
    const d = new Date(iso);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  } catch { return iso; }
};

const CuentaCobroView: React.FC = () => {
  const [cuentas, setCuentas] = useState<CuentaCobro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('Todos');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [firstActive, setFirstActive] = useState(false);

  const fetchCuentas = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/cuentas-cobro');
      setCuentas(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al cargar');
    } finally {
      setLoading(false);
      setCurrentPage(1);
    }
  };

  useEffect(() => { fetchCuentas(); }, []);

  const filtered = useMemo(() => {
    return cuentas.filter(c => {
      const matchSearch =
        String(c.numero).includes(search) ||
        c.contratista.toLowerCase().includes(search.toLowerCase());
      const matchEstado = estadoFilter === 'Todos' || c.estado === estadoFilter;
      return matchSearch && matchEstado;
    });
  }, [cuentas, search, estadoFilter, fechaInicio, fechaFin]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const current = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const visiblePages = useMemo(() => {
    const delta = 2, start = Math.max(1, currentPage - delta), end = Math.min(totalPages, currentPage + delta);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  return (
    <div className="main-layout">
      <Sidebar />
      <main className="main-content">
        <div className="gestion-container">

          {/* Header */}
          <header className="gestion-header">
            <div className="gestion-header-top">
              <nav className="breadcrumb">
                <div className="breadcrumb-item"><Home size={14} /></div>
                <div className="breadcrumb-sep"><ChevronRight size={13} /></div>
                <div className="breadcrumb-item">Movimientos</div>
                <div className="breadcrumb-sep"><ChevronRight size={13} /></div>
                <div className="breadcrumb-item active">Cuenta de Cobro</div>
              </nav>
            </div>
            <div className="gestion-header-bottom">
              <h1 className="gestion-title" style={{ margin: 0 }}>Cuentas de Cobro</h1>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="oa-btn-refresh" onClick={fetchCuentas}>
                  <RefreshCw size={14} /> Actualizar
                </button>
                <button className="cc-btn-nueva">
                  <Plus size={14} /> Nueva Cuenta
                </button>
              </div>
            </div>
            <p className="oa-subtitle">Gestione las cuentas de cobro de contratistas</p>
          </header>

          <div className="tabs-card-group">
            <MovTabs onFirstActive={setFirstActive} />
            <div className={`gestion-content-card${firstActive ? ' first-tab-active' : ''}`} style={{ marginTop: 0 }}>

              {/* Toolbar */}
              <div className="cc-toolbar">
                {/* Búsqueda */}
                <div className="cc-search-row">
                  <div className="oa-search-wrap cc-search-large">
                    <svg width="15" height="15" viewBox="0 0 17 17" fill="none">
                      <circle cx="7" cy="7" r="4.2" stroke="#94a3b8" strokeWidth="2" />
                      <line x1="10.2" y1="10.5" x2="15.5" y2="15.8" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <input
                      className="oa-search-input"
                      placeholder="Buscar..."
                      value={search}
                      onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                    />
                  </div>

                  <div className="oa-filter-group">
                    <span className="oa-filter-label">Estado</span>
                    <div className="oa-select-wrap oa-filter-select-wrap">
                      <select className="oa-filter-select" value={estadoFilter}
                        onChange={e => { setEstadoFilter(e.target.value); setCurrentPage(1); }}>
                        {ESTADOS_CC.map(e => <option key={e}>{e}</option>)}
                      </select>
                      <ChevronDown size={12} className="oa-select-icon" />
                    </div>
                  </div>

                  <button className="cc-btn-limpiar" onClick={() => {
                    setSearch(''); setEstadoFilter('Todos');
                    setFechaInicio(''); setFechaFin('');
                  }}>
                    Limpiar Filtros
                  </button>
                </div>

                {/* Fechas */}
                <div className="cc-fechas-row">
                  <div className="oa-filter-group">
                    <span className="oa-filter-label">Fecha Inicio</span>
                    <input type="date" className="oa-input cc-date-input" value={fechaInicio}
                      onChange={e => setFechaInicio(e.target.value)} />
                  </div>
                  <div className="oa-filter-group">
                    <span className="oa-filter-label">Fecha Fin</span>
                    <input type="date" className="oa-input cc-date-input" value={fechaFin}
                      onChange={e => setFechaFin(e.target.value)} />
                  </div>
                  {(!fechaInicio && !fechaFin) && (
                    <span className="cc-no-fecha">Sin filtro de fecha</span>
                  )}
                </div>
              </div>

              {/* Tabla */}
              <div className="oa-table-scroll">
                <table className="resoluciones-table">
                  <thead>
                    <tr>
                      <th>Número</th>
                      <th>Contratista</th>
                      <th>Período</th>
                      <th>Fecha</th>
                      <th>Valor</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={7} className="table-empty">Cargando datos...</td></tr>
                    ) : error ? (
                      <tr><td colSpan={7} className="table-empty" style={{ color: '#e11d48' }}>⚠️ {error}</td></tr>
                    ) : current.length === 0 ? (
                      <tr><td colSpan={7} className="table-empty">No se encontraron cuentas.</td></tr>
                    ) : current.map(c => (
                      <tr key={c.id}>
                        <td><strong>{c.numero}</strong></td>
                        <td>{c.contratista}</td>
                        <td>{formatPeriodo(c.periodo)}</td>
                        <td>{c.fecha}</td>
                        <td>{c.valor}</td>
                        <td><EstadoCCBadge estado={c.estado} /></td>
                        <td>
                          <div className="oa-actions-cell">
                            <button className="oa-action-btn oa-action-eye" title="Ver">
                              <Eye size={15} />
                            </button>
                            <button className="oa-action-btn cc-action-approve" title="Aprobar">
                              <Check size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              <div className="pagination-footer">
                <div className="items-per-page">
                  <span>Elementos por página</span>
                  <div className="items-select-wrapper">
                    <select className="items-select" value={itemsPerPage}
                      onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                    </select>
                  </div>
                </div>
                <div className="page-controls">
                  <button className="page-nav-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                    <ChevronLeft size={18} />
                  </button>
                  {visiblePages.map(n => (
                    <button key={n} className={`page-num-btn ${currentPage === n ? 'active' : ''}`} onClick={() => setCurrentPage(n)}>{n}</button>
                  ))}
                  <button className="page-nav-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                    <ChevronRight size={18} />
                  </button>
                </div>
                <div className="page-info-total">
                  {filtered.length === 0 ? '0 - de 0 páginas' : `${currentPage} - de ${totalPages} páginas`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CuentaCobroView;
