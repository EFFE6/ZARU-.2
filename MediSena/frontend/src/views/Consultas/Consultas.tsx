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
   COMPONENTE PRINCIPAL – Consultas
   ════════════════════════════════════════════════════════════ */
const Consultas: React.FC = () => {

  /* ── Tab activa ── */
  const [activeTab, setActiveTab] = useState('Orden de Atención consulta');

  /* ── Búsqueda general ── */
  const [searchQuery, setSearchQuery] = useState('');

  /* ── Loading ── */
  const [loading, setLoading] = useState(false);

  /* ── Paginación ── */
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  const tabs = [
    'Orden de Atención consulta',
    'Cuentas Cobro consulta',
    'Consulta Contratistas',
    'Buscar Beneficiario',
  ];

  /* ── Reset paginación al cambiar tab ── */
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  /* ─── Handlers Órdenes ──────────────────────────── */
  const handleOrdenConsultar = async () => {
    setLoading(true);
    try {
      const res = await api.get('/consultas/ordenes', { params: ordenFilter });
      setOrdenResults(res.data);
      setOrdenConsulted(true);
      setCurrentPage(1);
    } catch (e) {
      console.error(e);
      setOrdenResults([]);
      setOrdenConsulted(true);
    } finally {
      setLoading(false);
    }
  };
  const handleOrdenLimpiar = () => {
    setOrdenFilter({ ...EMPTY_ORDEN_FILTER });
    setOrdenResults([]);
    setOrdenConsulted(false);
  };

  /* ─── Handlers Cuentas ──────────────────────────── */
  const handleCuentaConsultar = async () => {
    setLoading(true);
    try {
      const res = await api.get('/consultas/cuentas-cobro', { params: cuentaFilter });
      setCuentaResults(res.data);
      setCuentaConsulted(true);
      setCurrentPage(1);
    } catch (e) {
      console.error(e);
      setCuentaResults([]);
      setCuentaConsulted(true);
    } finally {
      setLoading(false);
    }
  };
  const handleCuentaLimpiar = () => {
    setCuentaFilter({ ...EMPTY_CUENTA_FILTER });
    setCuentaResults([]);
    setCuentaConsulted(false);
  };

  /* ─── Handlers Contratistas ─────────────────────── */
  const handleContratistaConsultar = async () => {
    setLoading(true);
    try {
      const res = await api.get('/consultas/contratistas', { params: contratistaFilter });
      setContratistaResults(res.data);
      setContratistaConsulted(true);
      setCurrentPage(1);
    } catch (e) {
      console.error(e);
      setContratistaResults([]);
      setContratistaConsulted(true);
    } finally {
      setLoading(false);
    }
  };
  const handleContratistaLimpiar = () => {
    setContratistaFilter({ ...EMPTY_CONTRATISTA_FILTER });
    setContratistaResults([]);
    setContratistaConsulted(false);
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

  /* ─── Paginación genérica ─────────────────────────── */
  const getCurrentItems = <T,>(arr: T[]) => arr.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const getTotalPages = (arr: any[]) => Math.ceil(arr.length / itemsPerPage) || 1;

  const totalPages = useMemo(() => {
    if (activeTab === 'Orden de Atención consulta') return getTotalPages(filteredOrdenes);
    if (activeTab === 'Cuentas Cobro consulta') return getTotalPages(filteredCuentas);
    if (activeTab === 'Consulta Contratistas') return getTotalPages(filteredContratistas);
    return 1;
  }, [activeTab, filteredOrdenes, filteredCuentas, filteredContratistas, itemsPerPage]);

  const visiblePages = useMemo(() => {
    const delta = 2;
    const start = Math.max(1, currentPage - delta);
    const end = Math.min(totalPages, currentPage + delta);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  /* ════════════════════════════════════════════════ RENDER ═══ */
  const showPagination =
    (activeTab === 'Orden de Atención consulta' && ordenConsulted && ordenResults.length > 0) ||
    (activeTab === 'Cuentas Cobro consulta' && cuentaConsulted && cuentaResults.length > 0) ||
    (activeTab === 'Consulta Contratistas' && contratistaConsulted && contratistaResults.length > 0);

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
              onTabChange={(id) => { setActiveTab(id); setSearchQuery(''); setCurrentPage(1); }}
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
                      <DataTable
                        headers={<OrdenConsultaHead />}
                        itemsPerPage={itemsPerPage}
                        setItemsPerPage={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        totalPages={totalPages}
                        visiblePages={visiblePages}
                      >
                        <OrdenConsultaTabla
                          items={getCurrentItems(filteredOrdenes)}
                          loading={loading}
                          onView={setSelectedOrden}
                        />
                      </DataTable>
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
                      <DataTable
                        headers={<CuentaConsultaHead />}
                        itemsPerPage={itemsPerPage}
                        setItemsPerPage={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        totalPages={totalPages}
                        visiblePages={visiblePages}
                      >
                        <CuentaConsultaTabla
                          items={getCurrentItems(filteredCuentas)}
                          loading={loading}
                          onView={setSelectedCuenta}
                        />
                      </DataTable>
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
                      <DataTable
                        headers={<ContratistasHead />}
                        itemsPerPage={itemsPerPage}
                        setItemsPerPage={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
                        currentPage={currentPage}
                        setCurrentPage={setCurrentPage}
                        totalPages={totalPages}
                        visiblePages={visiblePages}
                      >
                        <ContratistasTabla
                          items={getCurrentItems(filteredContratistas)}
                          loading={loading}
                          onView={setSelectedContratista}
                        />
                      </DataTable>
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

              {/* Paginación removida ya que es manejada por DataTable */}
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
