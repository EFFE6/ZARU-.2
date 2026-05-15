import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../api/api';
import { ChevronRight, ChevronLeft, Home } from 'lucide-react';
import TabGroup from '../../components/TabGroup';
import SearchBar from '../../components/SearchBar';
import DataTable from '../../components/DataTable';
import '../../styles/Consultas/Consultas.css';
import ResolucionesIcon from '../../assets/img/icons/resoluciones-tags.png';
import CampanaSvg from '../../assets/img/icons/campana.svg';

/* ─── Tipos ─────────────────────────────────────────── */
import {
  OrdenConsulta, CuentaCobroConsulta, ContratistaConsulta, BeneficiarioConsulta,
} from './types';

/* ─── Módulos de cada Tab ───────────────────────────── */
import {
  EMPTY_ORDEN_FILTER, OrdenConsultaFiltros, OrdenConsultaEmpty,
  OrdenConsultaResultsHeader, OrdenConsultaHead, OrdenConsultaTabla, OrdenConsultaDetallesModal,
} from './OrdenAtencionConsulta';
import {
  EMPTY_CUENTA_FILTER, CuentaConsultaFiltros, CuentaConsultaEmpty,
  CuentaConsultaResultsHeader, CuentaConsultaHead, CuentaConsultaTabla, CuentaConsultaDetallesModal,
} from './CuentasCobroConsulta';
import {
  EMPTY_CONTRATISTA_FILTER, ContratistasFiltros, ContratistasEmpty,
  ContratistasResultsHeader, ContratistasHead, ContratistasTabla, ContratistasDetallesModal,
} from './ConsultaContratistas';
import {
  EMPTY_BENEFICIARIO_FILTER, BeneficiarioBuscar, BeneficiarioEmpty, BeneficiarioFicha,
} from './BuscarBeneficiario';

/* ════════════════════════════════════════════════════════════
   DATOS DE PRUEBA (se usan como fallback si la API no responde)
   ════════════════════════════════════════════════════════════ */
const MOCK_ORDENES: import('./types').OrdenConsulta[] = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  numero: `ORD-2024-${String(i + 1).padStart(6, '0')}`,
  fecha: `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
  beneficiario: ['JUAN CARLOS PÉREZ GÓMEZ', 'MARÍA ELENA RODRÍGUEZ', 'LUIS ALBERTO MARTÍNEZ', 'ANA SOFÍA TORRES', 'CARLOS ANDRÉS RAMÍREZ'][i % 5],
  medico: ['Dr. Hernández', 'Dra. Lopera', 'Dr. Quintero', 'Dra. Sánchez', 'Dr. Vargas'][i % 5],
  especialidad: ['Dermatología', 'Cardiología', 'Medicina General', 'Ortopedia', 'Pediatría'][i % 5],
  estado: ['Aprobada', 'Pendiente', 'Cancelada', 'Aprobada', 'Aprobada'][i % 5],
  valor: `$${((i + 1) * 85000).toLocaleString('es-CO')}`,
  funcionarioSolicitante: 'MÉDICO TRATANTE',
  tipoAtencion: ['Consulta', 'Procedimiento', 'Examen'][i % 3],
  fechaEmision: `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
}));

const MOCK_CUENTAS: import('./types').CuentaCobroConsulta[] = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  numeroRecibo: `REC-2024-${String(i + 1).padStart(6, '0')}`,
  funcionario: ['PEDRO SUÁREZ', 'LAURA DÍAZ', 'JORGE MORENO', 'CLAUDIA JIMÉNEZ'][i % 4],
  fecha: `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
  tipoPago: ['Transferencia', 'Cheque', 'Efectivo'][i % 3],
  valor: `$${((i + 1) * 120000).toLocaleString('es-CO')}`,
  estado: ['Aprobada', 'Pendiente', 'Cancelada'][i % 3],
}));

const MOCK_CONTRATISTAS: import('./types').ContratistaConsulta[] = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  nit: `${900100000 + i * 7}-${i % 9}`,
  nombre: ['CLÍNICA MEDELLÍN S.A.', 'IPS SALUD TOTAL', 'LABORATORIOS NORTE', 'CENTRO MÉDICO SUR', 'DIAGNÓSTICO EXPRESS'][i % 5],
  especialidad: ['Dermatología', 'Cardiología', 'Medicina General', 'Ortopedia', 'Pediatría'][i % 5],
  regional: ['Antioquia', 'Cundinamarca', 'Valle del Cauca', 'Atlántico'][i % 4],
  telefono: `+57 ${310 + i} ${String(4000000 + i * 12345).slice(0, 7)}`,
  email: `contacto${i + 1}@ips${i + 1}.com.co`,
  estado: i % 3 === 2 ? 'Inactivo' : 'Activo',
}));

/* ════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL – Consultas
   ════════════════════════════════════════════════════════════ */
const Consultas: React.FC = () => {

  /* ── Tab activa ── */
  const [activeTab, setActiveTab] = useState('Orden de Atención consulta');

  /* ── Búsqueda general ── */
  const [searchQuery, setSearchQuery] = useState('');

  /* ── Loading ── */
  const [loading, setLoading] = useState(false);

  /* ── Órdenes ── */
  const [ordenFilter, setOrdenFilter] = useState({ ...EMPTY_ORDEN_FILTER });
  const [ordenResults, setOrdenResults] = useState<OrdenConsulta[]>([]);
  const [ordenConsulted, setOrdenConsulted] = useState(false);
  const [selectedOrden, setSelectedOrden] = useState<OrdenConsulta | null>(null);

  /* ── Cuentas de Cobro ── */
  const [cuentaFilter, setCuentaFilter] = useState({ ...EMPTY_CUENTA_FILTER });
  const [cuentaResults, setCuentaResults] = useState<CuentaCobroConsulta[]>([]);
  const [cuentaConsulted, setCuentaConsulted] = useState(false);
  const [selectedCuenta, setSelectedCuenta] = useState<CuentaCobroConsulta | null>(null);

  /* ── Contratistas ── */
  const [contratistaFilter, setContratistaFilter] = useState({ ...EMPTY_CONTRATISTA_FILTER });
  const [contratistaResults, setContratistaResults] = useState<ContratistaConsulta[]>([]);
  const [contratistaConsulted, setContratistaConsulted] = useState(false);
  const [selectedContratista, setSelectedContratista] = useState<ContratistaConsulta | null>(null);

  /* ── Beneficiario ── */
  const [beneficiarioFilter, setBeneficiarioFilter] = useState({ ...EMPTY_BENEFICIARIO_FILTER });
  const [beneficiarioResult, setBeneficiarioResult] = useState<BeneficiarioConsulta | null>(null);
  const [beneficiarioConsulted, setBeneficiarioConsulted] = useState(false);
  const [beneficiarioNotFound, setBeneficiarioNotFound] = useState(false);

  /* ── Paginación compartida + por tab ── */
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [ordenPage, setOrdenPage] = useState(1);
  const [cuentaPage, setCuentaPage] = useState(1);
  const [contratistaPage, setContratistaPage] = useState(1);

  const tabs = [
    'Orden de Atención consulta',
    'Cuentas Cobro consulta',
    'Consulta Contratistas',
    'Buscar Beneficiario',
  ];

  /* ─── Handlers Órdenes ──────────────────────────── */
  const handleOrdenConsultar = async () => {
    setLoading(true);
    setOrdenPage(1);
    try {
      const res = await api.get('/consultas/ordenes', { params: ordenFilter });
      setOrdenResults(res.data);
      setOrdenConsulted(true);
    } catch (e) {
      console.warn('API no disponible, usando datos de prueba:', e);
      setOrdenResults(MOCK_ORDENES);
      setOrdenConsulted(true);
    } finally {
      setLoading(false);
    }
  };
  const handleOrdenLimpiar = () => {
    setOrdenFilter({ ...EMPTY_ORDEN_FILTER });
    setOrdenResults([]);
    setOrdenConsulted(false);
    setOrdenPage(1);
  };

  /* ─── Handlers Cuentas ──────────────────────────── */
  const handleCuentaConsultar = async () => {
    setLoading(true);
    setCuentaPage(1);
    try {
      const res = await api.get('/consultas/cuentas-cobro', { params: cuentaFilter });
      setCuentaResults(res.data);
      setCuentaConsulted(true);
    } catch (e) {
      console.warn('API no disponible, usando datos de prueba:', e);
      setCuentaResults(MOCK_CUENTAS);
      setCuentaConsulted(true);
    } finally {
      setLoading(false);
    }
  };
  const handleCuentaLimpiar = () => {
    setCuentaFilter({ ...EMPTY_CUENTA_FILTER });
    setCuentaResults([]);
    setCuentaConsulted(false);
    setCuentaPage(1);
  };

  /* ─── Handlers Contratistas ─────────────────────── */
  const handleContratistaConsultar = async () => {
    setLoading(true);
    setContratistaPage(1);
    try {
      const res = await api.get('/consultas/contratistas', { params: contratistaFilter });
      setContratistaResults(res.data);
      setContratistaConsulted(true);
    } catch (e) {
      console.warn('API no disponible, usando datos de prueba:', e);
      setContratistaResults(MOCK_CONTRATISTAS);
      setContratistaConsulted(true);
    } finally {
      setLoading(false);
    }
  };
  const handleContratistaLimpiar = () => {
    setContratistaFilter({ ...EMPTY_CONTRATISTA_FILTER });
    setContratistaResults([]);
    setContratistaConsulted(false);
    setContratistaPage(1);
  };

  /* ─── Handlers Beneficiario ─────────────────────── */
  const handleBeneficiarioBuscar = async () => {
    if (!beneficiarioFilter.valor.trim()) return;
    setLoading(true);
    setBeneficiarioNotFound(false);
    try {
      const res = await api.get('/consultas/beneficiario', { params: beneficiarioFilter });
      if (res.data && res.data.id) {
        setBeneficiarioResult(res.data);
      } else {
        setBeneficiarioResult(null);
        setBeneficiarioNotFound(true);
      }
      setBeneficiarioConsulted(true);
    } catch (e) {
      console.error(e);
      setBeneficiarioResult(null);
      setBeneficiarioNotFound(true);
      setBeneficiarioConsulted(true);
    } finally {
      setLoading(false);
    }
  };
  const handleBeneficiarioLimpiar = () => {
    setBeneficiarioFilter({ ...EMPTY_BENEFICIARIO_FILTER });
    setBeneficiarioResult(null);
    setBeneficiarioConsulted(false);
    setBeneficiarioNotFound(false);
  };

  /* ─── Filtrado con searchQuery general ───────────── */
  const filteredOrdenes = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return ordenResults;
    return ordenResults.filter(o =>
      o.numero.toLowerCase().includes(q) ||
      o.beneficiario.toLowerCase().includes(q) ||
      o.medico?.toLowerCase().includes(q)
    );
  }, [ordenResults, searchQuery]);

  const filteredCuentas = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return cuentaResults;
    return cuentaResults.filter(c =>
      c.numeroRecibo.toLowerCase().includes(q) ||
      c.funcionario.toLowerCase().includes(q)
    );
  }, [cuentaResults, searchQuery]);

  const filteredContratistas = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return contratistaResults;
    return contratistaResults.filter(c =>
      c.nit.toLowerCase().includes(q) ||
      c.nombre.toLowerCase().includes(q) ||
      c.especialidad.toLowerCase().includes(q)
    );
  }, [contratistaResults, searchQuery]);

  /* ─── Resetear páginas al cambiar searchQuery ── */
  useEffect(() => { setOrdenPage(1); }, [searchQuery]);
  useEffect(() => { setCuentaPage(1); }, [searchQuery]);
  useEffect(() => { setContratistaPage(1); }, [searchQuery]);

  /* ─── Cálculos de paginación ──────────────────── */
  const ordenTotalPages       = Math.max(1, Math.ceil(filteredOrdenes.length / itemsPerPage));
  const cuentaTotalPages      = Math.max(1, Math.ceil(filteredCuentas.length / itemsPerPage));
  const contratistaTotalPages = Math.max(1, Math.ceil(filteredContratistas.length / itemsPerPage));

  const ordenSlice       = filteredOrdenes.slice((ordenPage - 1) * itemsPerPage, ordenPage * itemsPerPage);
  const cuentaSlice      = filteredCuentas.slice((cuentaPage - 1) * itemsPerPage, cuentaPage * itemsPerPage);
  const contratistaSlice = filteredContratistas.slice((contratistaPage - 1) * itemsPerPage, contratistaPage * itemsPerPage);

  /* ─── Helper: páginas visibles ───────────────── */
  const visiblePages = (current: number, total: number) => {
    const delta = 2;
    const start = Math.max(1, current - delta);
    const end   = Math.min(total, current + delta);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  /* ─── Footer de paginación reutilizable ──────── */
  const PaginationFooter = ({
    currentPage, totalPages, onPage, onItems,
  }: {
    currentPage: number;
    totalPages: number;
    onPage: (p: number) => void;
    onItems: (n: number) => void;
  }) => (
    <div className="pagination-footer">
      <div className="items-per-page">
        <span>Elementos por página</span>
        <div className="items-select-wrapper">
          <select
            className="items-select"
            value={itemsPerPage}
            onChange={e => { onItems(Number(e.target.value)); onPage(1); }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>
      </div>
      <div className="page-controls">
        <button
          className="page-nav-btn"
          onClick={() => onPage(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
        >
          <ChevronLeft size={18} />
        </button>
        {visiblePages(currentPage, totalPages).map(n => (
          <button
            key={n}
            className={`page-num-btn ${currentPage === n ? 'active' : ''}`}
            onClick={() => onPage(n)}
          >
            {n}
          </button>
        ))}
        <button
          className="page-nav-btn"
          onClick={() => onPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
        >
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="page-info-total">
        {currentPage} - de {totalPages} páginas
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════ RENDER ═══ */
  return (
    <>
      <div className="gestion-container">

          {/* ── Header ── */}
          <header className="gestion-header">
            <div className="gestion-header-top">
              <nav className="breadcrumb">
                <div className="breadcrumb-item"><Home size={14} /></div>
                <div className="breadcrumb-sep"><ChevronRight size={13} /></div>
                <div className="breadcrumb-item">Consultas</div>
                <div className="breadcrumb-sep"><ChevronRight size={13} /></div>
                <div className="breadcrumb-item active">{activeTab}</div>
              </nav>
              <img src={CampanaSvg} alt="Notificaciones" style={{ width: 28, height: 28, cursor: 'pointer', flexShrink: 0 }} className="notification-bell" />
            </div>
            <div className="gestion-header-bottom">
              <h1 className="gestion-title">{activeTab}</h1>
              <SearchBar 
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Busca por número, nombre o identificación"
              />
            </div>
          </header>

          {/* ── Tabs + Card ── */}
          <div className="tabs-card-group">
            <TabGroup 
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={(id) => { setActiveTab(id); setSearchQuery(''); }}
              defaultIcon={() => <img src={ResolucionesIcon} alt="Icon" width={14} height={14} />}
            />

            <div className={`gestion-content-card ${activeTab === 'Orden de Atención consulta' ? 'first-tab-active' : ''}`}>

              {/* ══ TAB 1: Órdenes ══ */}
              {activeTab === 'Orden de Atención consulta' && (
                <>
                  <OrdenConsultaFiltros
                    filters={ordenFilter}
                    onChange={(f, v) => setOrdenFilter(p => ({ ...p, [f]: v }))}
                    onConsultar={handleOrdenConsultar}
                    onLimpiar={handleOrdenLimpiar}
                    loading={loading}
                  />
                  {!ordenConsulted ? (
                    <OrdenConsultaEmpty />
                  ) : (
                    <>
                      <OrdenConsultaResultsHeader
                        total={filteredOrdenes.length}
                        onPrint={() => window.print()}
                      />
                      <DataTable headers={<OrdenConsultaHead />} hidePagination>
                        <OrdenConsultaTabla items={ordenSlice} loading={loading} onView={setSelectedOrden} />
                      </DataTable>
                      {filteredOrdenes.length > 0 && (
                        <PaginationFooter
                          currentPage={ordenPage}
                          totalPages={ordenTotalPages}
                          onPage={setOrdenPage}
                          onItems={setItemsPerPage}
                        />
                      )}
                    </>
                  )}
                </>
              )}

              {/* ══ TAB 2: Cuentas Cobro ══ */}
              {activeTab === 'Cuentas Cobro consulta' && (
                <>
                  <CuentaConsultaFiltros
                    filters={cuentaFilter}
                    onChange={(f, v) => setCuentaFilter(p => ({ ...p, [f]: v }))}
                    onConsultar={handleCuentaConsultar}
                    onLimpiar={handleCuentaLimpiar}
                    loading={loading}
                  />
                  {!cuentaConsulted ? (
                    <CuentaConsultaEmpty />
                  ) : (
                    <>
                      <CuentaConsultaResultsHeader
                        total={filteredCuentas.length}
                        onPrint={() => window.print()}
                      />
                      <DataTable headers={<CuentaConsultaHead />} hidePagination>
                        <CuentaConsultaTabla items={cuentaSlice} loading={loading} onView={setSelectedCuenta} />
                      </DataTable>
                      {filteredCuentas.length > 0 && (
                        <PaginationFooter
                          currentPage={cuentaPage}
                          totalPages={cuentaTotalPages}
                          onPage={setCuentaPage}
                          onItems={setItemsPerPage}
                        />
                      )}
                    </>
                  )}
                </>
              )}

              {/* ══ TAB 3: Contratistas ══ */}
              {activeTab === 'Consulta Contratistas' && (
                <>
                  <ContratistasFiltros
                    filters={contratistaFilter}
                    onChange={(f, v) => setContratistaFilter(p => ({ ...p, [f]: v }))}
                    onConsultar={handleContratistaConsultar}
                    onLimpiar={handleContratistaLimpiar}
                    loading={loading}
                  />
                  {!contratistaConsulted ? (
                    <ContratistasEmpty />
                  ) : (
                    <>
                      <ContratistasResultsHeader
                        total={filteredContratistas.length}
                        onPrint={() => window.print()}
                      />
                      <DataTable headers={<ContratistasHead />} hidePagination>
                        <ContratistasTabla items={contratistaSlice} loading={loading} onView={setSelectedContratista} />
                      </DataTable>
                      {filteredContratistas.length > 0 && (
                        <PaginationFooter
                          currentPage={contratistaPage}
                          totalPages={contratistaTotalPages}
                          onPage={setContratistaPage}
                          onItems={setItemsPerPage}
                        />
                      )}
                    </>
                  )}
                </>
              )}

              {/* ══ TAB 4: Buscar Beneficiario ══ */}
              {activeTab === 'Buscar Beneficiario' && (
                <>
                  <BeneficiarioBuscar
                    filters={beneficiarioFilter}
                    onChange={(f, v) => setBeneficiarioFilter(p => ({ ...p, [f]: v }))}
                    onBuscar={handleBeneficiarioBuscar}
                    onLimpiar={handleBeneficiarioLimpiar}
                    loading={loading}
                  />
                  {!beneficiarioConsulted ? (
                    <BeneficiarioEmpty />
                  ) : beneficiarioNotFound ? (
                    <div className="cons-empty-state cons-empty-state-err">
                      <h3 className="cons-empty-title">No se encontró el beneficiario</h3>
                      <p className="cons-empty-desc">Verifique los criterios de búsqueda e intente nuevamente.</p>
                    </div>
                  ) : beneficiarioResult ? (
                    <BeneficiarioFicha b={beneficiarioResult} />
                  ) : null}
                </>
              )}

            </div>
          </div>

          {/* ══ MODALES ══ */}
          {selectedOrden && (
            <OrdenConsultaDetallesModal orden={selectedOrden} onClose={() => setSelectedOrden(null)} />
          )}
          {selectedCuenta && (
            <CuentaConsultaDetallesModal cuenta={selectedCuenta} onClose={() => setSelectedCuenta(null)} />
          )}
          {selectedContratista && (
            <ContratistasDetallesModal contratista={selectedContratista} onClose={() => setSelectedContratista(null)} />
          )}

      </div>
    </>
  );
};

export default Consultas;
