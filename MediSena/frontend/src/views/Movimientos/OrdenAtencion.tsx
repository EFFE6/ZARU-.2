import React, { useState, useEffect, useMemo, useRef } from 'react';
import Sidebar from '../../components/Sidebar';
import MovTabs from './MovTabs';
import api from '../../api/api';
import {
  ChevronRight, ChevronLeft, Home, Eye, Printer, Pencil,
  RefreshCw, ChevronDown, X,
} from 'lucide-react';
import '../../styles/GestionResoluciones/GestionResoluciones.css';
import './OrdenAtencion.css';

/* ─── Tipos ─────────────────────────────────────────────── */
interface OrdenAtencion {
  id: number;
  numero: number;
  vigencia: number;
  beneficiario: string;
  contratista: string;
  especialidad: string | number;
  fecha: string;
  estado: 'A' | 'I' | 'P';
  tipoAtencion?: string;
  observaciones?: string;
  funcionarioSolicitante?: string;
  medicoTratante?: string;
  diagnostico?: string;
  valorEstimado?: string;
}

const TIPOS_ATENCION = ['Consulta General', 'Control', 'Urgencia', 'Especializada'];
const VIGENCIAS = ['Todas las vigencias', '2026', '2025', '2024'];
const ESTADOS_FILTER = ['Todos', 'A', 'I', 'P'];

/* ─── Badge estado ───────────────────────────────────────── */
const EstadoBadge: React.FC<{ estado: string }> = ({ estado }) => (
  <span className={`oa-estado-badge oa-estado-${estado.toLowerCase()}`}>{estado}</span>
);

/* ─── Custom Select (dropdown estilo Figma) ─────────────── */
interface CustomSelectProps {
  value: string;
  options: string[];
  placeholder?: string;
  onChange: (v: string) => void;
  label?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ value, options, placeholder = 'Seleccionar', onChange, label }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="oa-custom-select" ref={ref}>
      {label && <span className="oa-custom-select-label">{label}</span>}
      <div
        className={`oa-custom-select-trigger ${open ? 'open' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span className={value ? '' : 'placeholder'}>{value || placeholder}</span>
        <ChevronDown size={13} className={`oa-custom-select-arrow ${open ? 'open' : ''}`} />
      </div>
      {open && (
        <ul className="oa-custom-select-dropdown">
          {options.map(opt => (
            <li
              key={opt}
              className={`oa-custom-select-option ${value === opt ? 'selected' : ''}`}
              onClick={() => { onChange(opt); setOpen(false); }}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MODAL: Detalles de la Orden
   ═══════════════════════════════════════════════════════════ */
const DetallesModal: React.FC<{ orden: OrdenAtencion; onClose: () => void }> = ({ orden, onClose }) => (
  <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
    <div className="oa-modal-detalles">
      <div className="oa-modal-detalles-header">
        <Eye size={16} style={{ color: '#0165B0' }} />
        <h2 className="oa-modal-detalles-title">Detalles de la Orden</h2>
      </div>
      <div className="oa-modal-detalles-body">
        <div className="oa-det-field">
          <span className="oa-det-label">Número de Orden</span>
          <span className="oa-det-value bold">{orden.numero}</span>
        </div>
        <div className="oa-det-divider" />
        <div className="oa-det-row">
          <div className="oa-det-field">
            <span className="oa-det-label">Estado</span>
            <EstadoBadge estado={orden.estado} />
          </div>
          <div className="oa-det-field">
            <span className="oa-det-label">Tipo de Atención</span>
            <span className="oa-det-value">{orden.tipoAtencion || '—'}</span>
          </div>
        </div>
        <div className="oa-det-divider" />
        <div className="oa-det-field">
          <span className="oa-det-label">Beneficiario</span>
          <span className="oa-det-value bold">{orden.beneficiario}</span>
        </div>
        <div className="oa-det-field">
          <span className="oa-det-label">Funcionario Solicitante</span>
          <span className="oa-det-value">{orden.funcionarioSolicitante || '—'}</span>
        </div>
        <div className="oa-det-row">
          <div className="oa-det-field">
            <span className="oa-det-label">Médico Tratante</span>
            <span className="oa-det-value">{orden.medicoTratante || '—'}</span>
          </div>
          <div className="oa-det-field">
            <span className="oa-det-label">Especialidad</span>
            <span className="oa-det-value">{orden.especialidad}</span>
          </div>
        </div>
        <div className="oa-det-divider" />
        <div className="oa-det-field">
          <span className="oa-det-label">Fecha</span>
          <span className="oa-det-value">{orden.fecha}</span>
        </div>
        {orden.observaciones && (
          <>
            <div className="oa-det-divider" />
            <div className="oa-det-field">
              <span className="oa-det-label">Observaciones</span>
              <span className="oa-det-value">{orden.observaciones}</span>
            </div>
          </>
        )}
      </div>
      <div className="oa-modal-detalles-footer">
        <button className="oa-btn-print" onClick={() => window.print()}>
          <Printer size={14} /> Imprimir
        </button>
        <button className="oa-btn-cerrar" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   MODAL: Editar Orden (multi-paso, estilo Figma)
   ═══════════════════════════════════════════════════════════ */
type EditStep = 0 | 1 | 2;
const STEPS = ['Datos Generales', 'Beneficiario y Funcionario', 'Atención Médica'];

const EditarOrdenModal: React.FC<{
  orden: OrdenAtencion;
  onClose: () => void;
  onSave: (o: OrdenAtencion) => void;
}> = ({ orden, onClose, onSave }) => {
  const [step, setStep] = useState<EditStep>(0);
  const [form, setForm] = useState({
    tipoAtencion: orden.tipoAtencion || '',
    fecha: orden.fecha,
    observaciones: orden.observaciones || '',
    beneficiario: orden.beneficiario,
    funcionarioSolicitante: orden.funcionarioSolicitante || '',
    medicoTratante: orden.medicoTratante || '',
    especialidad: String(orden.especialidad),
    diagnostico: orden.diagnostico || '',
    valorEstimado: orden.valorEstimado || '',
  });

  const change = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }));

  const handleSave = async () => {
    const updated = { ...orden, ...form, especialidad: form.especialidad };
    try {
      await api.put(`/ordenes-atencion/${orden.id}`, updated);
    } catch { /* continuar aunque falle */ }
    onSave(updated as OrdenAtencion);
    onClose();
  };

  /* Helpers para fecha */
  const toInputDate = (dd_mm_yyyy: string) => {
    const parts = dd_mm_yyyy.split('/');
    if (parts.length !== 3) return '';
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  };
  const fromInputDate = (yyyy_mm_dd: string) => {
    const parts = yyyy_mm_dd.split('-');
    if (parts.length !== 3) return yyyy_mm_dd;
    return `${parseInt(parts[2])}/${parseInt(parts[1])}/${parts[0]}`;
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="oa-modal-edit">
        {/* ── Header con steps ── */}
        <div className="oa-modal-edit-header">
          <div className="oa-edit-title-row">
            <Pencil size={14} color="#fff" />
            <span className="oa-modal-edit-title">Editar Orden de Atención</span>
          </div>
          <div className="oa-steps-row">
            {STEPS.map((s, i) => (
              <React.Fragment key={s}>
                <div className={`oa-step ${step === i ? 'active' : step > i ? 'done' : ''}`}>
                  <div className="oa-step-circle">
                    {step > i ? '✓' : i + 1}
                  </div>
                  <span className="oa-step-label">{s}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`oa-step-line ${step > i ? 'done' : ''}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="oa-modal-edit-body">

          {/* Paso 0 */}
          {step === 0 && (
            <div className="oa-form-grid">
              <div className="oa-form-field oa-field-full">
                <CustomSelect
                  label="Tipo de Atención *"
                  value={form.tipoAtencion}
                  options={TIPOS_ATENCION}
                  placeholder="Seleccionar tipo"
                  onChange={v => change('tipoAtencion', v)}
                />
              </div>
              <div className="oa-form-field">
                <label className="oa-form-label">Fecha de la Orden *</label>
                <input
                  type="date"
                  className="oa-input"
                  value={toInputDate(form.fecha)}
                  onChange={e => change('fecha', fromInputDate(e.target.value))}
                />
              </div>
              <div className="oa-form-field oa-field-full">
                <label className="oa-form-label">Observaciones</label>
                <textarea
                  className="oa-textarea"
                  rows={4}
                  value={form.observaciones}
                  onChange={e => change('observaciones', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Paso 1 */}
          {step === 1 && (
            <div className="oa-form-grid">
              <div className="oa-form-field oa-field-full">
                <label className="oa-form-label">Beneficiario *</label>
                <input className="oa-input" value={form.beneficiario} onChange={e => change('beneficiario', e.target.value)} />
              </div>
              <div className="oa-form-field oa-field-full">
                <label className="oa-form-label">Funcionario Solicitante *</label>
                <input className="oa-input" placeholder="Funcionario Solicitante" value={form.funcionarioSolicitante} onChange={e => change('funcionarioSolicitante', e.target.value)} />
              </div>
            </div>
          )}

          {/* Paso 2 */}
          {step === 2 && (
            <div className="oa-form-grid">
              <div className="oa-form-field oa-field-full">
                <label className="oa-form-label">Médico Tratante *</label>
                <input className="oa-input" placeholder="Médico Tratante" value={form.medicoTratante} onChange={e => change('medicoTratante', e.target.value)} />
              </div>
              <div className="oa-form-field oa-field-full">
                <label className="oa-form-label">Especialidad *</label>
                <input className="oa-input" value={form.especialidad} onChange={e => change('especialidad', e.target.value)} />
              </div>
              <div className="oa-form-field oa-field-full">
                <label className="oa-form-label">Diagnóstico (Opcional)</label>
                <input className="oa-input" value={form.diagnostico} onChange={e => change('diagnostico', e.target.value)} />
              </div>
              <div className="oa-form-field">
                <label className="oa-form-label">Valor Total Estimado</label>
                <input className="oa-input" placeholder="$" value={form.valorEstimado} onChange={e => change('valorEstimado', e.target.value)} />
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="oa-modal-edit-footer">
          <button className="oa-btn-cancel-edit" onClick={onClose}>
            <X size={14} /> Cancelar
          </button>
          <div className="oa-footer-nav">
            {step > 0 && (
              <button className="oa-btn-prev" onClick={() => setStep(s => (s - 1) as EditStep)}>
                <ChevronLeft size={14} /> Anterior
              </button>
            )}
            {step < 2 ? (
              <button className="oa-btn-next" onClick={() => setStep(s => (s + 1) as EditStep)}>
                Siguiente <ChevronRight size={14} />
              </button>
            ) : (
              <button className="oa-btn-save" onClick={handleSave}>
                Actualizar Orden
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ═══════════════════════════════════════════════════════════ */
const OrdenAtencionView: React.FC = () => {
  const [ordenes, setOrdenes] = useState<OrdenAtencion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('Todos');
  const [vigenciaFilter, setVigenciaFilter] = useState('Todas las vigencias');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [detallesOrden, setDetallesOrden] = useState<OrdenAtencion | null>(null);
  const [editOrden, setEditOrden] = useState<OrdenAtencion | null>(null);
  const [firstActive, setFirstActive] = useState(true); // Orden de Atención es el primer tab

  /* ── Fetch desde backend ── */
  const fetchOrdenes = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/ordenes-atencion');
      setOrdenes(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al cargar órdenes');
    } finally {
      setLoading(false);
      setCurrentPage(1);
    }
  };

  useEffect(() => { fetchOrdenes(); }, []);

  /* ── Filtrado ── */
  const filtered = useMemo(() => {
    return ordenes.filter(o => {
      const matchSearch =
        String(o.numero).includes(search) ||
        o.beneficiario.toLowerCase().includes(search.toLowerCase()) ||
        o.contratista.toLowerCase().includes(search.toLowerCase());
      const matchEstado = estadoFilter === 'Todos' || o.estado === estadoFilter;
      const matchVigencia = vigenciaFilter === 'Todas las vigencias' || String(o.vigencia) === vigenciaFilter;
      return matchSearch && matchEstado && matchVigencia;
    });
  }, [ordenes, search, estadoFilter, vigenciaFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const current = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const visiblePages = useMemo(() => {
    const delta = 2, start = Math.max(1, currentPage - delta), end = Math.min(totalPages, currentPage + delta);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  const handleSaveEdit = (updated: OrdenAtencion) => {
    setOrdenes(p => p.map(o => o.id === updated.id ? updated : o));
  };

  return (
    <div className="main-layout">
      <Sidebar />
      <main className="main-content">
        <div className="gestion-container">

          {/* ── Header ── */}
          <header className="gestion-header">
            <div className="gestion-header-top">
              <nav className="breadcrumb">
                <div className="breadcrumb-item"><Home size={14} /></div>
                <div className="breadcrumb-sep"><ChevronRight size={13} /></div>
                <div className="breadcrumb-item">Movimientos</div>
                <div className="breadcrumb-sep"><ChevronRight size={13} /></div>
                <div className="breadcrumb-item active">Orden de atención</div>
              </nav>
            </div>
            <div className="gestion-header-bottom">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <h1 className="gestion-title" style={{ margin: 0 }}>Órdenes de Atención</h1>
                {/* Badge: filtradas de total — sólo visible con datos cargados */}
                {!loading && (
                  <span className="oa-count-badge">
                    {filtered.length} de {ordenes.length}
                  </span>
                )}
              </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  className="oa-btn-nueva-orden"
                  disabled
                  title="Próximamente disponible"
                >
                  + Nueva Orden
                </button>
                <button className="oa-btn-refresh" onClick={fetchOrdenes}>
                  <RefreshCw size={14} /> Actualizar
                </button>
              </div>
            </div>
            <p className="oa-subtitle">Gestionar órdenes médicas para beneficiarios</p>
          </header>

          {/* ── Tabs + Card ── */}
          <div className="tabs-card-group">
            <MovTabs onFirstActive={setFirstActive} />
            <div className={`gestion-content-card${firstActive ? ' first-tab-active' : ''}`} style={{ marginTop: 0 }}>

              {/* Barra de advertencia — siempre visible */}
              <div className="oa-warning-bar">
                ⚠️ <strong>Base de datos con 3.1 millones de órdenes.</strong> Por rendimiento, mostrando máximo 1,000 órdenes. Use filtros para refinar la búsqueda.
              </div>

              {/* Toolbar */}
              <div className="oa-toolbar">
                <div className="oa-search-wrap">
                  <svg width="15" height="15" viewBox="0 0 17 17" fill="none">
                    <circle cx="7" cy="7" r="4.2" stroke="#94a3b8" strokeWidth="2" />
                    <line x1="10.2" y1="10.5" x2="15.5" y2="15.8" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <input
                    className="oa-search-input"
                    placeholder="Buscar por orden, beneficio..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                  />
                </div>

                <div className="oa-filter-group">
                  <span className="oa-filter-label">Estado</span>
                  <div className="oa-select-wrap oa-filter-select-wrap">
                    <select className="oa-filter-select" value={estadoFilter}
                      onChange={e => { setEstadoFilter(e.target.value); setCurrentPage(1); }}>
                      {ESTADOS_FILTER.map(e => <option key={e}>{e}</option>)}
                    </select>
                    <ChevronDown size={12} className="oa-select-icon" />
                  </div>
                </div>

                <div className="oa-filter-group">
                  <span className="oa-filter-label">Vigencia</span>
                  <div className="oa-select-wrap oa-filter-select-wrap">
                    <select className="oa-filter-select" value={vigenciaFilter}
                      onChange={e => { setVigenciaFilter(e.target.value); setCurrentPage(1); }}>
                      {VIGENCIAS.map(v => <option key={v}>{v}</option>)}
                    </select>
                    <ChevronDown size={12} className="oa-select-icon" />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                  <button className="oa-btn-ver-todas" onClick={() => { setEstadoFilter('Todos'); setVigenciaFilter('Todas las vigencias'); setSearch(''); }}>
                    Ver Todas
                  </button>
                  <button className="oa-btn-filtradas">Filtradas</button>
                </div>
              </div>

              {/* Tabla con scroll */}
              <div className="oa-table-scroll">
                <table className="resoluciones-table">
                  <thead>
                    <tr>
                      <th>Número</th>
                      <th>Vigencia</th>
                      <th>Beneficiario</th>
                      <th>Contratista</th>
                      <th>Especialidad</th>
                      <th>Fecha</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={8} className="table-empty">Cargando datos...</td></tr>
                    ) : error ? (
                      <tr><td colSpan={8} className="table-empty" style={{ color: '#e11d48' }}>⚠️ {error}</td></tr>
                    ) : current.length === 0 ? (
                      <tr><td colSpan={8} className="table-empty">No se encontraron resultados.</td></tr>
                    ) : current.map(o => (
                      <tr key={o.id}>
                        <td><strong>{o.numero}</strong></td>
                        <td>{o.vigencia}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>{o.beneficiario}</span>
                            <span className="oa-ben-badge">C</span>
                          </div>
                        </td>
                        <td>{o.contratista}</td>
                        <td>{o.especialidad}</td>
                        <td>{o.fecha}</td>
                        <td><EstadoBadge estado={o.estado} /></td>
                        <td>
                          <div className="oa-actions-cell">
                            <button className="oa-action-btn oa-action-eye" title="Ver" onClick={() => setDetallesOrden(o)}>
                              <Eye size={15} />
                            </button>
                            <button className="oa-action-btn oa-action-print" title="Imprimir" onClick={() => window.print()}>
                              <Printer size={15} />
                            </button>
                            <button className="oa-action-btn oa-action-edit" title="Editar" onClick={() => setEditOrden(o)}>
                              <Pencil size={14} />
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
                <div className="page-info-total">{currentPage} - de {totalPages} páginas</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {detallesOrden && <DetallesModal orden={detallesOrden} onClose={() => setDetallesOrden(null)} />}
      {editOrden && <EditarOrdenModal orden={editOrden} onClose={() => setEditOrden(null)} onSave={handleSaveEdit} />}
    </div>
  );
};

export default OrdenAtencionView;
