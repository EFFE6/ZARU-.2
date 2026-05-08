import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { ChevronRight, Home, Info, Eye, Download, Calendar } from 'lucide-react';
import SearchBar from '../../components/SearchBar';
import OpcionReportes, { type ReporteOpcion } from '../../components/OpcionReportes';
import '../../styles/Reportes/Reportes.css';
import '../../styles/Excedentes/Excedentes.css';   // gestion-container, gestion-header, breadcrumb…
import CampanaSvg from '../../assets/img/icons/campana.svg';

/* ═══════════════════════════════════════════════════════════════
   DATOS — se reemplazarán por fetch al backend
   ═══════════════════════════════════════════════════════════════ */

const LOREM = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud…';

const REPORTES_DATA: ReporteOpcion[] = [
  { id: 'f1-distribucion',         nombre: 'F1-Distribución del Gasto',       fecha: '24 de Oct de 2026', descripcion: LOREM, filtros: ['regional', 'fechas'] },
  { id: 'f5-excedentes',           nombre: 'F5-Excedentes',                   fecha: '24 de Oct de 2026', descripcion: LOREM, filtros: ['fechas'] },
  { id: 'f10-beneficiarios',       nombre: 'F10-Beneficiarios Activos',       fecha: '24 de Oct de 2026', descripcion: LOREM, filtros: ['regional'] },
  { id: 'historia-beneficiario',   nombre: 'Historia de Beneficiario',        fecha: '24 de Oct de 2026', descripcion: LOREM, filtros: ['beneficiario'] },
  { id: 'beneficiarios-inactivos', nombre: 'Beneficiarios Inactivos',         fecha: '24 de Oct de 2026', descripcion: LOREM, filtros: [] },
  { id: 'cuenta-cobro',           nombre: 'Cuenta de Cobro sin Asociar',      fecha: '24 de Oct de 2026', descripcion: LOREM, filtros: ['identificacion'] },
  { id: 'citas-generadas',        nombre: 'Citas generadas',                  fecha: '24 de Oct de 2026', descripcion: LOREM, filtros: [] },
  { id: 'facturacion-contratista', nombre: 'Facturación por contratista',      fecha: '24 de Oct de 2026', descripcion: LOREM, filtros: [] },
  { id: 'reembolsos',             nombre: 'Reembolsos',                       fecha: '24 de Oct de 2026', descripcion: LOREM, filtros: [] },
  { id: 'nro-orden-especialidad', nombre: 'Nro. de Orden por Especialidad',   fecha: '24 de Oct de 2026', descripcion: LOREM, filtros: ['fechas'], nombreDisplay: 'Número de Orden por Especialidad' },
  { id: 'red-contratistas',       nombre: 'Red de Contratistas',              fecha: '24 de Oct de 2026', descripcion: LOREM, filtros: [] },
  { id: 'excedentes-nacionales',  nombre: 'Excedentes Nacionales',            fecha: '24 de Oct de 2026', descripcion: LOREM, filtros: ['fechas'] },
  { id: 'reporte-f15',            nombre: 'Reporte F15',                      fecha: '24 de Oct de 2026', descripcion: LOREM, filtros: [] },
];

/* ── Historial dummy (se reemplazará por API) ── */
interface HistorialItem { id: number; nombre: string; regional?: string; fechaInicio?: string; fechaFin?: string; }

const HISTORIAL_DUMMY: Record<string, HistorialItem[]> = {
  'f10-beneficiarios':    [{ id: 1, nombre: 'Gasto de Dotaciones', regional: 'RISARALDA' }, { id: 2, nombre: 'Gasto de Dotaciones', regional: 'RISARALDA' }],
  'historia-beneficiario':[{ id: 1, nombre: 'Santiago Torres' }, { id: 2, nombre: 'Santiago Barbosa' }],
  'f5-excedentes':        [{ id: 1, nombre: 'Presupuesto', fechaInicio: '23/03/2026', fechaFin: '23/06/2026' }, { id: 2, nombre: 'Presupuesto', fechaInicio: '23/03/2026', fechaFin: '23/06/2026' }],
  'cuenta-cobro':         [{ id: 1, nombre: 'Gasto de Dotaciones', regional: 'RISARALDA' }, { id: 2, nombre: 'Gasto de Dotaciones', regional: 'RISARALDA' }],
  'nro-orden-especialidad':[{ id: 1, nombre: 'Lorem Ipsum', fechaInicio: '23/03/2026', fechaFin: '23/06/2026' }, { id: 2, nombre: 'Lorem Ipsum', fechaInicio: '23/03/2026', fechaFin: '23/06/2026' }],
};

/* ═══════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ═══════════════════════════════════════════════════════════════ */
const Reportes = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId]   = useState<string | null>(null);

  // Filtros
  const [filterRegional, setFilterRegional]             = useState('');
  const [filterFechaRango, setFilterFechaRango]         = useState('');
  const [filterBeneficiario, setFilterBeneficiario]     = useState('');
  const [filterIdentificacion, setFilterIdentificacion] = useState('');

  // Derivados
  const selectedReporte = useMemo(() => REPORTES_DATA.find(r => r.id === selectedId) ?? null, [selectedId]);
  const filteredReportes = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return q ? REPORTES_DATA.filter(r => r.nombre.toLowerCase().includes(q)) : REPORTES_DATA;
  }, [searchQuery]);
  const historial  = selectedId ? (HISTORIAL_DUMMY[selectedId] ?? []) : [];
  const hasFiltros = !!(selectedReporte?.filtros?.length);

  // Custom Scrollbar Logic
  const sidebarScrollRef = useRef<HTMLDivElement>(null);
  const [thumbHeight, setThumbHeight] = useState(0);
  const [thumbTop, setThumbTop] = useState(0);

  const updateScrollbar = useCallback(() => {
    const el = sidebarScrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollHeight <= clientHeight) {
      setThumbHeight(0);
      return;
    }
    const tHeight = Math.max((clientHeight / scrollHeight) * clientHeight, 40);
    const maxScrollTop = scrollHeight - clientHeight;
    const tTop = (scrollTop / maxScrollTop) * (clientHeight - tHeight);
    setThumbHeight(tHeight);
    setThumbTop(tTop);
  }, []);

  useEffect(() => {
    updateScrollbar();
    window.addEventListener('resize', updateScrollbar);
    return () => window.removeEventListener('resize', updateScrollbar);
  }, [updateScrollbar, filteredReportes]);

  // Handlers
  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setFilterRegional('');
    setFilterFechaRango('');
    setFilterBeneficiario('');
    setFilterIdentificacion('');
  }, []);

  const formatDate = (r: ReporteOpcion) => {
    const p = r.fecha.split(' ');
    return p.length >= 5 ? `${p[0]} ${p[1].toLowerCase()} ${p[4]}` : r.fecha;
  };

  /* ─── Render ─── */
  return (
    <div className="gestion-container">
      {/* Header */}
      <header className="gestion-header">
        <div className="gestion-header-top">
          <nav className="breadcrumb">
            <div className="breadcrumb-item"><Home size={14} /></div>
            <div className="breadcrumb-sep"><ChevronRight size={13} /></div>
            <div className="breadcrumb-item active">Reportes</div>
          </nav>
          <img src={CampanaSvg} alt="Notificaciones" className="notification-bell" style={{ width: 28, height: 28, cursor: 'pointer', flexShrink: 0 }} />
        </div>
        <div className="gestion-header-bottom">
          <h1 className="gestion-title">Reportes</h1>
          <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Busca" />
        </div>
      </header>

      {/* Cuerpo */}
      <div className="reportes-body">
        {/* ── Sidebar ── */}
        <div className="reportes-sidebar" style={{ position: 'relative' }}>
          <div className="reportes-sidebar-scroll no-native-scroll" ref={sidebarScrollRef} onScroll={updateScrollbar}>
            {filteredReportes.map(r => (
              <OpcionReportes key={r.id} reporte={r} isActive={selectedId === r.id} onClick={() => handleSelect(r.id)} />
            ))}
            {filteredReportes.length === 0 && (
              <p className="reportes-sidebar-empty">No se encontraron reportes</p>
            )}
          </div>
          {/* Custom Native Scrollbar in TSX */}
          {thumbHeight > 0 && (
            <div className="custom-ts-scrollbar-track">
              <div 
                className="custom-ts-scrollbar-thumb" 
                style={{ height: thumbHeight, top: thumbTop }} 
              />
            </div>
          )}
        </div>

        {/* ── Contenido ── */}
        <div className="reportes-content">
          {!selectedReporte ? (
            <div className="reportes-empty-state">
              <div className="reportes-empty-icon"><Info size={24} strokeWidth={1.8} /></div>
              <h3 className="reportes-empty-title">Gestión de Reportes</h3>
              <p className="reportes-empty-desc">
                No tienes ningún Reporte seleccionado.<br />
                Selecciona un tipo de reporte y filtra los datos para visualizarlo y descargarlo.
              </p>
            </div>
          ) : (
            <div className="reporte-detalle">
              {/* Header */}
              <div className="reporte-detalle-header">
                <h2 className="reporte-detalle-titulo">{selectedReporte.nombreDisplay ?? selectedReporte.nombre}</h2>
                <span className="reporte-detalle-fecha">{formatDate(selectedReporte)}</span>
              </div>

              {/* Descripción */}
              {selectedReporte.descripcion && <p className="reporte-detalle-desc">{selectedReporte.descripcion}</p>}

              {/* Filtros */}
              {hasFiltros && (
                <div className="reporte-filtros">
                  {selectedReporte.filtros!.includes('regional') && (
                    <select className={`reporte-filtro-select${filterRegional ? '' : ' neutral'}`} value={filterRegional} onChange={e => setFilterRegional(e.target.value)} id="filtro-regional">
                      <option value="">Regional</option>
                      <option value="RISARALDA">RISARALDA</option>
                      <option value="CUNDINAMARCA">CUNDINAMARCA</option>
                      <option value="ANTIOQUIA">ANTIOQUIA</option>
                      <option value="VALLE">VALLE</option>
                      <option value="ATLANTICO">ATLÁNTICO</option>
                    </select>
                  )}
                  {selectedReporte.filtros!.includes('fechas') && (
                    <select className={`reporte-filtro-select${filterFechaRango ? '' : ' neutral'}`} value={filterFechaRango} onChange={e => setFilterFechaRango(e.target.value)} id="filtro-fechas">
                      <option value="">Rango de fechas</option>
                      <option value="ultimo-mes">Último mes</option>
                      <option value="ultimo-trimestre">Último trimestre</option>
                      <option value="ultimo-semestre">Último semestre</option>
                      <option value="ultimo-anio">Último año</option>
                    </select>
                  )}
                  {selectedReporte.filtros!.includes('beneficiario') && (
                    <div className="reporte-filtro-field">
                      <label htmlFor="filtro-beneficiario">Beneficiario</label>
                      <input type="text" className="reporte-filtro-input" placeholder="Santiago" value={filterBeneficiario} onChange={e => setFilterBeneficiario(e.target.value)} id="filtro-beneficiario" />
                    </div>
                  )}
                  {selectedReporte.filtros!.includes('identificacion') && (
                    <input type="text" className="reporte-filtro-input" placeholder="Identificación del beneficiario" value={filterIdentificacion} onChange={e => setFilterIdentificacion(e.target.value)} id="filtro-identificacion" />
                  )}
                  <button className="reporte-btn-consultar" id="btn-consultar-reporte">Consultar</button>
                </div>
              )}

              {/* Historial */}
              <div className="reporte-historial-container">
                {hasFiltros && (
                  <div className="reporte-historial-container-header">
                    <h4 className="reporte-historial-titulo">Tu historial de consultas</h4>
                  </div>
                )}

                {historial.length > 0 ? (
                  <div className="reporte-historial-scroll">
                    {historial.map(item => (
                      <div className="reporte-historial-item" key={item.id}>
                        <div className="reporte-historial-info">
                          <span className="reporte-historial-nombre">{item.nombre}</span>
                          {item.regional && (
                            <>
                              <span className="reporte-historial-label">en</span>
                              <span className="reporte-historial-badge regional">🏢 {item.regional}</span>
                            </>
                          )}
                          {item.fechaInicio && item.fechaFin && (
                            <>
                              <span className="reporte-historial-label">para</span>
                              <span className="reporte-historial-badge fecha">
                                <Calendar size={11} strokeWidth={2.2} />
                                {item.fechaInicio} · {item.fechaFin}
                              </span>
                            </>
                          )}
                        </div>
                        <div className="reporte-historial-actions">
                          <button className="reporte-historial-btn" title="Visualizar"><Eye size={15} strokeWidth={2.2} /></button>
                          <button className="reporte-historial-btn download" title="Descargar"><Download size={15} strokeWidth={2.2} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="reporte-historial-empty">
                    <div className="reporte-historial-empty-icon"><Info size={20} strokeWidth={1.8} /></div>
                    <p className="reporte-historial-empty-text">No has hecho consultas recientemente.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reportes;
