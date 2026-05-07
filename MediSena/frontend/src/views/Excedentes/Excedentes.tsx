import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../api/api';
import { ChevronRight, ChevronLeft, Home } from 'lucide-react';
import TabGroup from '../../components/TabGroup';
import SearchBar from '../../components/SearchBar';
import DataTable from '../../components/DataTable';
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
        <DataTable
          headers={<RecibosHead />}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
          visiblePages={visiblePages}
        >
          <RecibosTabla
            items={slicePage(filteredRecibos)}
            loading={loading}
            onView={openViewRecibo}
            onEdit={openEditRecibo}
            onPrint={() => window.print()}
            onAnular={handleAnularRecibo}
          />
        </DataTable>
      );
    }
    if (activeTab === 'Imprimir Excedentes') {
      return (
        <DataTable
          headers={<ImprimirHead allSelected={imprimirItems.length > 0 && imprimirSelected.size === imprimirItems.length} onToggleAll={toggleImprimirAll} />}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
          visiblePages={visiblePages}
        >
          <ImprimirTabla
            items={slicePage(imprimirItems)}
            loading={loading}
            selected={imprimirSelected}
            onToggle={toggleImprimirItem}
            onToggleAll={toggleImprimirAll}
          />
        </DataTable>
      );
    }
    if (activeTab === 'Excedentes mayor a 30 días') {
      return (
        <DataTable
          headers={<Mayor30Head />}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
          visiblePages={visiblePages}
        >
          <Mayor30Tabla items={slicePage(filteredMayor30)} loading={loading} />
        </DataTable>
      );
    }
    if (activeTab === 'Relación recibos de pago') {
      return (
        <DataTable
          headers={<RelacionHead />}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
          visiblePages={visiblePages}
        >
          <RelacionTabla items={slicePage(relacionItems)} loading={loading} />
        </DataTable>
      );
    }
    if (activeTab === 'Formato Salarios') {
      return (
        <DataTable
          headers={<SalariosHead />}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
          visiblePages={visiblePages}
        >
          <SalariosTabla items={slicePage(salariosItems)} loading={loading} />
        </DataTable>
      );
    }
    if (activeTab === 'Excedentes sin cancelar') {
      return (
        <DataTable
          headers={<SinCancelarHead />}
          itemsPerPage={itemsPerPage}
          setItemsPerPage={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
          visiblePages={visiblePages}
        >
          <SinCancelarTabla items={slicePage(filteredSinCancelar)} loading={loading} />
        </DataTable>
      );
    }
    return null;
  };

  const showPagination = currentDataLen > 0 &&
    activeTab !== 'Formato Financiero' &&
    activeTab !== 'Reliquidar excedentes';

  return (
    <>
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
              <SearchBar 
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Busca por recibo, funcionario o beneficiario"
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

              {/* Paginación removida ya que es manejada por DataTable */}
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
    </>
  );
};

export default Excedentes;
