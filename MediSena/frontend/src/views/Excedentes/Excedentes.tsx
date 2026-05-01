import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../api/api';
import { ChevronRight, ChevronLeft, Home } from 'lucide-react';
import '../../styles/Excedentes/Excedentes.css';
import ResolucionesIcon from '../../assets/img/icons/resoluciones-tags.png';
import CampanaSvg from '../../assets/img/icons/campana.svg';

import {
  ReciboPago, ImprimirExcedente, ExcedenteMayor30, RecibosPagoRelacion,
  FinancieroTotales, FormatoSalario, ReliquidarInfo, ExcedenteSinCancelar,
} from './types';

import {
  EMPTY_RECIBO_FORM, RecibosTotalesCards, RecibosToolbar, RecibosHead, RecibosTabla,
  ReciboDetallesModal, ReciboEditModal,
} from './RecibosPago';

import {
  ImprimirToolbar, ImprimirHead, ImprimirTabla,
  Mayor30Toolbar, Mayor30Head, Mayor30Tabla,
  RelacionToolbar, RelacionHead, RelacionTabla,
  FormatoFinancieroPanel,
  SalariosToolbar, SalariosHead, SalariosTabla,
  ReliquidarPanel,
  SinCancelarToolbar, SinCancelarHead, SinCancelarTabla,
} from './OtrosTabs';

/* ════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL – Excedentes
   ════════════════════════════════════════════════════════════ */
const Excedentes: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Recibos de Pago');
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  /* ── Data ── */
  const [recibos, setRecibos] = useState<ReciboPago[]>([]);
  const [imprimirItems, setImprimirItems] = useState<ImprimirExcedente[]>([]);
  const [mayor30, setMayor30] = useState<ExcedenteMayor30[]>([]);
  const [relacionItems, setRelacionItems] = useState<RecibosPagoRelacion[]>([]);
  const [salariosItems, setSalariosItems] = useState<FormatoSalario[]>([]);
  const [sinCancelar, setSinCancelar] = useState<ExcedenteSinCancelar[]>([]);

  /* ── Filtros Recibos ── */
  const [recibosSearch, setRecibosSearch] = useState('');
  const [recibosEstado, setRecibosEstado] = useState('Todos');
  const [recibosTipoPago, setRecibosTipoPago] = useState('Todos');
  const [recibosError, setRecibosError] = useState<string | null>(null);

  /* ── Modal Recibos ── */
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isNewMode, setIsNewMode] = useState(false);
  const [selectedRecibo, setSelectedRecibo] = useState<ReciboPago | null>(null);
  const [reciboForm, setReciboForm] = useState({ ...EMPTY_RECIBO_FORM });

  /* ── Imprimir ── */
  const [imprimirPeriodo, setImprimirPeriodo] = useState('2026-01');
  const [imprimirRegional, setImprimirRegional] = useState('Todas');
  const [imprimirSelected, setImprimirSelected] = useState<Set<number>>(new Set());

  /* ── Relación ── */
  const [relacionPeriodo, setRelacionPeriodo] = useState('2026-01');
  const [relacionGenerated, setRelacionGenerated] = useState(false);

  /* ── Financiero ── */
  const [financieroPeriodo, setFinancieroPeriodo] = useState('2026-01');
  const [financieroTotales, setFinancieroTotales] = useState<FinancieroTotales | null>(null);

  /* ── Salarios ── */
  const [salariosPeriodo, setSalariosPeriodo] = useState('2026-01');
  const [salariosGenerated, setSalariosGenerated] = useState(false);

  /* ── Reliquidar ── */
  const [reliquidarNum, setReliquidarNum] = useState('');
  const [reliquidarInfo, setReliquidarInfo] = useState<ReliquidarInfo | null>(null);
  const [reliquidarError, setReliquidarError] = useState<string | null>(null);

  const tabs = [
    'Recibos de Pago',
    'Imprimir Excedentes',
    'Excedentes mayor a 30 días',
    'Relación recibos de pago',
    'Formato Financiero',
    'Formato Salarios',
    'Reliquidar excedentes',
    'Excedentes sin cancelar',
  ];

  /* ── Fetch por tab ── */
  const fetchTabData = async (tab: string) => {
    setLoading(true);
    setErrorStatus(null);
    try {
      if (tab === 'Recibos de Pago') {
        const res = await api.get('/excedentes/recibos');
        setRecibos(res.data);
      } else if (tab === 'Excedentes mayor a 30 días') {
        const res = await api.get('/excedentes/mayor-30');
        setMayor30(res.data);
      } else if (tab === 'Excedentes sin cancelar') {
        const res = await api.get('/excedentes/sin-cancelar');
        setSinCancelar(res.data);
      }
    } catch (err: any) {
      setErrorStatus(err.response?.data?.message || err.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
      setCurrentPage(1);
    }
  };

  useEffect(() => {
    fetchTabData(activeTab);
  }, [activeTab]);

  /* ── Totales Recibos ── */
  const recibosTotales = useMemo(() => {
    const parse = (s: string) => parseFloat(s.replace(/[^\d.-]/g, '')) || 0;
    const pagado = recibos.filter(r => r.estado.toLowerCase() === 'pagado').reduce((sum, r) => sum + parse(r.valorTotal), 0);
    const pendiente = recibos.filter(r => r.estado.toLowerCase() === 'pendiente').reduce((sum, r) => sum + parse(r.valorTotal), 0);
    return {
      totalPagado: `$${pagado.toLocaleString('es-CO')}`,
      totalPendiente: `$${pendiente.toLocaleString('es-CO')}`,
      totalRecibos: recibos.length,
    };
  }, [recibos]);

  /* ── Filtrado ── */
  const filteredRecibos = useMemo(() => {
    const q = (recibosSearch || searchQuery).toLowerCase();
    return recibos.filter(r => {
      const ms = !q ||
        r.numeroRecibo.toLowerCase().includes(q) ||
        r.funcionario.toLowerCase().includes(q);
      const me = recibosEstado === 'Todos' || r.estado.toLowerCase() === recibosEstado.toLowerCase();
      const mt = recibosTipoPago === 'Todos' || r.tipoPago.toLowerCase() === recibosTipoPago.toLowerCase();
      return ms && me && mt;
    });
  }, [recibos, recibosSearch, searchQuery, recibosEstado, recibosTipoPago]);

  const filteredMayor30 = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return mayor30;
    return mayor30.filter(r =>
      r.recibo.toLowerCase().includes(q) || r.funcionario.toLowerCase().includes(q)
    );
  }, [mayor30, searchQuery]);

  const filteredSinCancelar = useMemo(() => {
    const q = searchQuery.toLowerCase();
    if (!q) return sinCancelar;
    return sinCancelar.filter(r =>
      r.recibo.toLowerCase().includes(q) || r.funcionario.toLowerCase().includes(q)
    );
  }, [sinCancelar, searchQuery]);

  /* ── Paginación ── */
  const currentDataLen = (() => {
    if (activeTab === 'Recibos de Pago') return filteredRecibos.length;
    if (activeTab === 'Imprimir Excedentes') return imprimirItems.length;
    if (activeTab === 'Excedentes mayor a 30 días') return filteredMayor30.length;
    if (activeTab === 'Relación recibos de pago') return relacionItems.length;
    if (activeTab === 'Formato Salarios') return salariosItems.length;
    if (activeTab === 'Excedentes sin cancelar') return filteredSinCancelar.length;
    return 0;
  })();

  const totalPages = Math.ceil(currentDataLen / itemsPerPage) || 1;
  const slicePage = <T,>(arr: T[]) => arr.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const visiblePages = useMemo(() => {
    const delta = 2;
    const start = Math.max(1, currentPage - delta);
    const end = Math.min(totalPages, currentPage + delta);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  /* ─── Handlers Recibos ───────────────────────────── */
  const openViewRecibo = (r: ReciboPago) => { setSelectedRecibo(r); setIsViewOpen(true); };
  const openEditRecibo = (r: ReciboPago) => {
    setSelectedRecibo(r);
    setIsNewMode(false);
    setReciboForm({
      funcionario: r.funcionario, beneficiario: r.beneficiario, fechaPago: '',
      valorTotal: r.valorTotal, tipoPago: r.tipoPago, metodoPago: r.metodoPago,
      concepto: r.concepto, referenciaOrden: r.referenciaOrden || '', observaciones: r.observaciones || '',
    });
    setIsEditOpen(true);
  };
  const openNewRecibo = () => {
    setIsNewMode(true);
    setSelectedRecibo(null);
    setReciboForm({ ...EMPTY_RECIBO_FORM });
    setIsEditOpen(true);
  };
  const closeReciboModals = () => {
    setIsViewOpen(false); setIsEditOpen(false);
    setSelectedRecibo(null); setIsNewMode(false);
  };
  const handleSaveRecibo = async () => {
    try {
      if (isNewMode) {
        const res = await api.post('/excedentes/recibos', reciboForm);
        setRecibos(arr => [...arr, res.data]);
      } else if (selectedRecibo) {
        const payload = { ...selectedRecibo, ...reciboForm };
        await api.put(`/excedentes/recibos/${selectedRecibo.id}`, payload);
        setRecibos(arr => arr.map(x => x.id === selectedRecibo.id ? payload : x));
      }
      closeReciboModals();
    } catch (e) { console.error(e); }
  };
  const handleAnularRecibo = async (r: ReciboPago) => {
    try {
      const payload = { ...r, estado: 'Anulado' };
      await api.put(`/excedentes/recibos/${r.id}`, payload);
      setRecibos(arr => arr.map(x => x.id === r.id ? payload : x));
    } catch (e) { console.error(e); }
  };

  /* ─── Handlers Imprimir ──────────────────────────── */
  const handleImprimirBuscar = async () => {
    setLoading(true);
    try {
      const res = await api.get('/excedentes/imprimir', { params: { periodo: imprimirPeriodo, regional: imprimirRegional } });
      setImprimirItems(res.data);
      setImprimirSelected(new Set());
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  const toggleImprimirItem = (id: number) => {
    setImprimirSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleImprimirAll = () => {
    setImprimirSelected(prev =>
      prev.size === imprimirItems.length ? new Set() : new Set(imprimirItems.map(i => i.id))
    );
  };

  /* ─── Handlers Relación ──────────────────────────── */
  const handleRelacionGenerar = async () => {
    setLoading(true);
    try {
      const res = await api.get('/excedentes/relacion', { params: { periodo: relacionPeriodo } });
      setRelacionItems(res.data);
      setRelacionGenerated(true);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  /* ─── Handlers Financiero ────────────────────────── */
  const handleFinancieroGenerar = async () => {
    setLoading(true);
    try {
      const res = await api.get('/excedentes/financiero', { params: { periodo: financieroPeriodo } });
      setFinancieroTotales(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  /* ─── Handlers Salarios ──────────────────────────── */
  const handleSalariosGenerar = async () => {
    setLoading(true);
    try {
      const res = await api.get('/excedentes/salarios', { params: { periodo: salariosPeriodo } });
      setSalariosItems(res.data);
      setSalariosGenerated(true);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  /* ─── Handlers Reliquidar ─────────────────────────── */
  const handleReliquidarBuscar = async () => {
    if (!reliquidarNum.trim()) return;
    setLoading(true);
    setReliquidarError(null);
    setReliquidarInfo(null);
    try {
      const res = await api.get('/excedentes/reliquidar', { params: { numero: reliquidarNum } });
      if (res.data && res.data.recibo) {
        setReliquidarInfo(res.data);
      } else {
        setReliquidarError(`No se encontró el recibo #${reliquidarNum}`);
      }
    } catch (e) {
      setReliquidarError(`Error al buscar el recibo`);
    }
    setLoading(false);
  };
  const handleReliquidar = async () => {
    if (!reliquidarInfo) return;
    try {
      await api.post('/excedentes/reliquidar', { recibo: reliquidarInfo.recibo });
      setReliquidarError(null);
      alert(`Recibo #${reliquidarInfo.recibo} reliquidado exitosamente`);
      setReliquidarNum('');
      setReliquidarInfo(null);
    } catch (e) { console.error(e); }
  };

  /* ── Render toolbar ── */
  const renderToolbar = () => {
    if (activeTab === 'Recibos de Pago') {
      return (
        <>
          <RecibosTotalesCards {...recibosTotales} />
          <RecibosToolbar
            search={recibosSearch}
            estado={recibosEstado}
            tipoPago={recibosTipoPago}
            error={recibosError}
            onSearchChange={setRecibosSearch}
            onEstadoChange={setRecibosEstado}
            onTipoPagoChange={setRecibosTipoPago}
            onBuscar={() => fetchTabData(activeTab)}
            onRefresh={() => fetchTabData(activeTab)}
            onNew={openNewRecibo}
          />
        </>
      );
    }
    if (activeTab === 'Imprimir Excedentes') {
      return (
        <ImprimirToolbar
          periodo={imprimirPeriodo}
          regional={imprimirRegional}
          onPeriodoChange={setImprimirPeriodo}
          onRegionalChange={setImprimirRegional}
          onBuscar={handleImprimirBuscar}
        />
      );
    }
    if (activeTab === 'Excedentes mayor a 30 días') {
      return (
        <Mayor30Toolbar totalCount={mayor30.length} onRefresh={() => fetchTabData(activeTab)} />
      );
    }
    if (activeTab === 'Relación recibos de pago') {
      return (
        <RelacionToolbar
          periodo={relacionPeriodo}
          onPeriodoChange={setRelacionPeriodo}
          onGenerar={handleRelacionGenerar}
          onPrint={() => window.print()}
          onExport={() => {}}
        />
      );
    }
    if (activeTab === 'Formato Salarios') {
      return (
        <SalariosToolbar
          periodo={salariosPeriodo}
          onPeriodoChange={setSalariosPeriodo}
          onGenerar={handleSalariosGenerar}
          onPrint={() => window.print()}
          hasData={salariosGenerated && salariosItems.length > 0}
        />
      );
    }
    if (activeTab === 'Excedentes sin cancelar') {
      return (
        <SinCancelarToolbar totalCount={sinCancelar.length} onRefresh={() => fetchTabData(activeTab)} />
      );
    }
    return null;
  };

  /* ── Render thead/tbody ── */
  const renderTable = () => {
    if (activeTab === 'Recibos de Pago') {
      return (
        <div className="table-wrapper">
          <table className="resoluciones-table">
            <thead><RecibosHead /></thead>
            <tbody>
              <RecibosTabla
                items={slicePage(filteredRecibos)}
                loading={loading}
                onView={openViewRecibo}
                onEdit={openEditRecibo}
                onPrint={() => window.print()}
                onAnular={handleAnularRecibo}
              />
            </tbody>
          </table>
        </div>
      );
    }
    if (activeTab === 'Imprimir Excedentes') {
      return (
        <div className="table-wrapper">
          <table className="resoluciones-table">
            <thead>
              <ImprimirHead
                allSelected={imprimirItems.length > 0 && imprimirSelected.size === imprimirItems.length}
                onToggleAll={toggleImprimirAll}
              />
            </thead>
            <ImprimirTabla
              items={slicePage(imprimirItems)}
              loading={loading}
              selected={imprimirSelected}
              onToggle={toggleImprimirItem}
              onToggleAll={toggleImprimirAll}
            />
          </table>
        </div>
      );
    }
    if (activeTab === 'Excedentes mayor a 30 días') {
      return (
        <div className="table-wrapper">
          <table className="resoluciones-table">
            <thead><Mayor30Head /></thead>
            <tbody>
              <Mayor30Tabla items={slicePage(filteredMayor30)} loading={loading} />
            </tbody>
          </table>
        </div>
      );
    }
    if (activeTab === 'Relación recibos de pago') {
      return (
        <div className="table-wrapper">
          <table className="resoluciones-table">
            <thead><RelacionHead /></thead>
            <tbody>
              <RelacionTabla items={slicePage(relacionItems)} loading={loading} />
            </tbody>
          </table>
        </div>
      );
    }
    if (activeTab === 'Formato Salarios') {
      return (
        <div className="table-wrapper">
          <table className="resoluciones-table">
            <thead><SalariosHead /></thead>
            <tbody>
              <SalariosTabla items={slicePage(salariosItems)} loading={loading} />
            </tbody>
          </table>
        </div>
      );
    }
    if (activeTab === 'Excedentes sin cancelar') {
      return (
        <div className="table-wrapper">
          <table className="resoluciones-table">
            <thead><SinCancelarHead /></thead>
            <tbody>
              <SinCancelarTabla items={slicePage(filteredSinCancelar)} loading={loading} />
            </tbody>
          </table>
        </div>
      );
    }
    return null;
  };

  const showPagination = currentDataLen > 0 &&
    activeTab !== 'Formato Financiero' &&
    activeTab !== 'Reliquidar excedentes';

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
                <div className="breadcrumb-item">Excedentes</div>
                <div className="breadcrumb-sep"><ChevronRight size={13} /></div>
                <div className="breadcrumb-item active">{activeTab}</div>
              </nav>
              <img src={CampanaSvg} alt="Notificaciones" style={{ width: 28, height: 28, cursor: 'pointer', flexShrink: 0 }} className="notification-bell" />
            </div>
            <div className="gestion-header-bottom">
              <h1 className="gestion-title">{activeTab}</h1>
              <div className="search-wrapper">
                <div className="search-container">
                  <input
                    type="text"
                    placeholder="Busca por recibo, funcionario o beneficiario"
                    className="search-input"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <button className="search-btn" type="button">
                  <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="7" cy="7" r="4.2" stroke="#002c4d" strokeWidth="2" />
                    <line x1="10.2" y1="10.5" x2="15.5" y2="15.8" stroke="#002c4d" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
          </header>

          {/* ── Tabs + Card ── */}
          <div className="tabs-card-group">
            <div className="tabs-scroll-area">
              {tabs.map(tab => (
                <div
                  key={tab}
                  className={`tab-pill ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => { setActiveTab(tab); setSearchQuery(''); setCurrentPage(1); }}
                >
                  {activeTab === tab && (
                    <div className="active-tab-icon">
                      <img src={ResolucionesIcon} alt="Icon" width={14} height={14} />
                    </div>
                  )}
                  {tab}
                </div>
              ))}
            </div>

            <div className={`gestion-content-card ${activeTab === 'Recibos de Pago' ? 'first-tab-active' : ''}`}>
              {errorStatus && <div className="mov-error-banner">⚠ {errorStatus}</div>}

              {renderToolbar()}

              {activeTab === 'Formato Financiero' ? (
                <FormatoFinancieroPanel
                  periodo={financieroPeriodo}
                  onPeriodoChange={setFinancieroPeriodo}
                  onGenerar={handleFinancieroGenerar}
                  onPrint={() => window.print()}
                  totales={financieroTotales}
                  loading={loading}
                />
              ) : activeTab === 'Reliquidar excedentes' ? (
                <ReliquidarPanel
                  numeroRecibo={reliquidarNum}
                  onChange={setReliquidarNum}
                  onBuscar={handleReliquidarBuscar}
                  onReliquidar={handleReliquidar}
                  info={reliquidarInfo}
                  error={reliquidarError}
                  loading={loading}
                />
              ) : renderTable()}

              {showPagination && (
                <div className="pagination-footer">
                  <div className="items-per-page">
                    <span>Elementos por página</span>
                    <div className="items-select-wrapper">
                      <select className="items-select" value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
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
              )}
            </div>
          </div>

          {/* ── Modales ── */}
          {isViewOpen && selectedRecibo && (
            <ReciboDetallesModal recibo={selectedRecibo} onClose={closeReciboModals} />
          )}
          {isEditOpen && (
            <ReciboEditModal
              isEdit={!isNewMode}
              form={reciboForm}
              onFormChange={(f, v) => setReciboForm(p => ({ ...p, [f]: v }))}
              onClose={closeReciboModals}
              onSave={handleSaveRecibo}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default Excedentes;
