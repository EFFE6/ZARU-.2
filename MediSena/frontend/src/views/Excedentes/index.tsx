import React, { useState, useMemo } from 'react';
import { ChevronRight, Home } from 'lucide-react';
import TabGroup from '../../components/TabGroup';
import SearchBar from '../../components/SearchBar';
import DataTable from '../../components/DataTable';
import '../../styles/Excedentes/Excedentes.css';

import ResolucionesIcon from '../../assets/img/icons/resoluciones-tags.png';
import CampanaSvg from '../../assets/img/icons/campana.svg';

import {
  ReciboPago, ImprimirExcedente, ExcedenteMayor30, RecibosPagoRelacion,
  FinancieroTotales, FormatoSalario, ReliquidarInfo, ExcedenteSinCancelar,
  MOCK_RECIBOS, MOCK_MAYOR_30, MOCK_SIN_CANCELAR, MOCK_IMPRIMIR, MOCK_RELACION, MOCK_SALARIOS,
  EMPTY_RECIBO_FORM
} from './types';

// Import Tabs
import RecibosPagoTab, { 
  RecibosTotalesCards, RecibosToolbar, RecibosHead, RecibosTabla,
  ReciboDetallesModal, ReciboEditModal 
} from './RecibosPago';
import ImprimirExcedentesTab from './ImprimirExcedentes';
import Mayor30DiasTab from './Mayor30Dias';
import RelacionRecibosTab from './RelacionRecibos';
import FormatoFinancieroTab from './FormatoFinanciero';
import FormatoSalariosTab from './FormatoSalarios';
import ReliquidarExcedentesTab from './ReliquidarExcedentes';
import SinCancelarTab from './SinCancelar';

import { 
  ImprimirHead, ImprimirTabla,
  Mayor30Head, Mayor30Tabla,
  RelacionHead, RelacionTabla,
  SalariosHead, SalariosTabla,
  SinCancelarHead, SinCancelarTabla 
} from './OtrosTabs';

const TABS = [
  { id: 'Recibos de Pago', label: 'Recibos de Pago' },
  { id: 'Imprimir Excedentes', label: 'Imprimir Excedentes' },
  { id: 'Excedentes mayor a 30 días', label: 'Excedentes mayor a 30 días' },
  { id: 'Relación recibos de pago', label: 'Relación recibos de pago' },
  { id: 'Formato Financiero', label: 'Formato Financiero' },
  { id: 'Formato Salarios', label: 'Formato Salarios' },
  { id: 'Reliquidar excedentes', label: 'Reliquidar excedentes' },
  { id: 'Excedentes sin cancelar', label: 'Excedentes sin cancelar' },
];

const ExcedentesLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Recibos de Pago');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  /* ── Data State ── */
  const [recibos, setRecibos] = useState<ReciboPago[]>(MOCK_RECIBOS);
  const [imprimirItems] = useState<ImprimirExcedente[]>(MOCK_IMPRIMIR);
  const [mayor30] = useState<ExcedenteMayor30[]>(MOCK_MAYOR_30);
  const [relacionItems] = useState<RecibosPagoRelacion[]>(MOCK_RELACION);
  const [salariosItems] = useState<FormatoSalario[]>(MOCK_SALARIOS);
  const [sinCancelar] = useState<ExcedenteSinCancelar[]>(MOCK_SIN_CANCELAR);

  /* ── Recibos Specific State ── */
  const [recibosSearch, setRecibosSearch] = useState('');
  const [recibosEstado, setRecibosEstado] = useState('Todos');
  const [recibosTipoPago, setRecibosTipoPago] = useState('Todos');
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isNewMode, setIsNewMode] = useState(false);
  const [selectedRecibo, setSelectedRecibo] = useState<ReciboPago | null>(null);
  const [reciboForm, setReciboForm] = useState({ ...EMPTY_RECIBO_FORM });

  /* ── Otros Tabs State ── */
  const [imprimirPeriodo, setImprimirPeriodo] = useState('2026-01');
  const [imprimirRegional, setImprimirRegional] = useState('Todas');
  const [imprimirSelected, setImprimirSelected] = useState<Set<number>>(new Set());
  const [relacionPeriodo, setRelacionPeriodo] = useState('2026-01');
  const [financieroPeriodo, setFinancieroPeriodo] = useState('2026-01');
  const [financieroTotales] = useState<FinancieroTotales | null>({
    totalExcedentes: '$4.500.000',
    totalPagado: '$3.200.000',
    saldoPendiente: '$1.300.000'
  });
  const [salariosPeriodo, setSalariosPeriodo] = useState('2026-01');
  const [reliquidarNum, setReliquidarNum] = useState('');
  const [reliquidarInfo, setReliquidarInfo] = useState<ReliquidarInfo | null>(null);
  const [reliquidarError, setReliquidarError] = useState<string | null>(null);

  /* ── Computed Totals ── */
  const recibosTotales = useMemo(() => {
    const parse = (s: string) => parseFloat(String(s).replace(/[^\d.-]/g, '')) || 0;
    const pagado = recibos.filter(r => r.estado.toLowerCase() === 'pagado').reduce((sum, r) => sum + parse(r.valorTotal), 0);
    const pendiente = recibos.filter(r => r.estado.toLowerCase() === 'pendiente').reduce((sum, r) => sum + parse(r.valorTotal), 0);
    return {
      totalPagado: `$${pagado.toLocaleString('es-CO')}`,
      totalPendiente: `$${pendiente.toLocaleString('es-CO')}`,
      totalRecibos: recibos.length,
    };
  }, [recibos]);

  /* ── Filtering ── */
  const filteredRecibos = useMemo(() => {
    const q = (recibosSearch || searchQuery).toLowerCase();
    return recibos.filter(r => {
      const ms = !q || r.numeroRecibo.toLowerCase().includes(q) || r.funcionario.toLowerCase().includes(q);
      const me = recibosEstado === 'Todos' || r.estado.toLowerCase() === recibosEstado.toLowerCase();
      const mt = recibosTipoPago === 'Todos' || r.tipoPago.toLowerCase() === recibosTipoPago.toLowerCase();
      return ms && me && mt;
    });
  }, [recibos, recibosSearch, searchQuery, recibosEstado, recibosTipoPago]);

  const filteredMayor30 = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return mayor30.filter(r => !q || r.recibo.toLowerCase().includes(q) || r.funcionario.toLowerCase().includes(q));
  }, [mayor30, searchQuery]);

  const filteredSinCancelar = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return sinCancelar.filter(r => !q || r.recibo.toLowerCase().includes(q) || r.funcionario.toLowerCase().includes(q));
  }, [sinCancelar, searchQuery]);

  /* ── Handlers ── */
  const openViewRecibo = (r: ReciboPago) => { setSelectedRecibo(r); setIsViewOpen(true); };
  const openEditRecibo = (r: ReciboPago) => {
    setSelectedRecibo(r);
    setIsNewMode(false);
    setReciboForm({ ...r });
    setIsEditOpen(true);
  };
  const openNewRecibo = () => {
    setIsNewMode(true);
    setSelectedRecibo(null);
    setReciboForm({ ...EMPTY_RECIBO_FORM, numeroRecibo: `REC-00${recibos.length + 1}` });
    setIsEditOpen(true);
  };
  const closeReciboModals = () => {
    setIsViewOpen(false); setIsEditOpen(false);
    setSelectedRecibo(null); setIsNewMode(false);
  };
  const handleSaveRecibo = () => {
    if (isNewMode) {
      const nuevo = { ...reciboForm, id: Date.now(), estado: 'Pendiente' };
      setRecibos(p => [nuevo, ...p]);
    } else if (selectedRecibo) {
      setRecibos(p => p.map(x => x.id === selectedRecibo.id ? { ...x, ...reciboForm } : x));
    }
    closeReciboModals();
  };
  const handleAnularRecibo = (r: ReciboPago) => {
    setRecibos(p => p.map(x => x.id === r.id ? { ...x, estado: 'Anulado' } : x));
  };
  const handleReliquidarBuscar = () => {
    const found = recibos.find(r => r.numeroRecibo === reliquidarNum);
    if (found) {
      setReliquidarInfo({ recibo: found.numeroRecibo, funcionario: found.funcionario, valorActual: found.valorTotal });
      setReliquidarError(null);
    } else {
      setReliquidarError('No se encontró el recibo especificado.');
      setReliquidarInfo(null);
    }
  };

  const slicePage = <T,>(arr: T[]) => arr.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = (len: number) => Math.ceil(len / itemsPerPage) || 1;
  const commonPaginationProps = (len: number) => ({
    itemsPerPage, setItemsPerPage: (v: number) => { setItemsPerPage(v); setCurrentPage(1); },
    currentPage, setCurrentPage, totalPages: totalPages(len),
    visiblePages: Array.from({ length: Math.min(5, totalPages(len)) }, (_, i) => i + 1)
  });

  return (
    <div className="gestion-container">
      <header className="gestion-header">
        <div className="gestion-header-top">
          <nav className="breadcrumb">
            <div className="breadcrumb-item"><Home size={14} /></div>
            <div className="breadcrumb-sep"><ChevronRight size={13} /></div>
            <div className="breadcrumb-item">Excedentes</div>
            <div className="breadcrumb-sep"><ChevronRight size={13} /></div>
            <div className="breadcrumb-item active">{activeTab}</div>
          </nav>
          <img src={CampanaSvg} alt="Notificaciones" className="notification-bell" style={{ width: 28, height: 28 }} />
        </div>
        <div className="gestion-header-bottom">
          <h1 className="gestion-title">Excedentes</h1>
          <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Busca por recibo o funcionario..." />
        </div>
      </header>

      <div className="tabs-card-group">
        <TabGroup 
          tabs={TABS} 
          activeTab={activeTab} 
          onTabChange={(t) => { setActiveTab(t); setCurrentPage(1); setSearchQuery(''); }} 
          defaultIcon={() => <img src={ResolucionesIcon} alt="icon" width={14} height={14} />} 
        />
        <div className={`gestion-content-card ${activeTab === TABS[0].id ? 'first-tab-active' : ''}`}>
          
          {activeTab === 'Recibos de Pago' && (
            <>
              <RecibosTotalesCards {...recibosTotales} />
              <RecibosToolbar
                estado={recibosEstado}
                tipoPago={recibosTipoPago}
                error={null}
                onEstadoChange={setRecibosEstado}
                onTipoPagoChange={setRecibosTipoPago}
                onRefresh={() => {}}
                onNew={openNewRecibo}
              />
              <DataTable headers={<RecibosHead />} {...commonPaginationProps(filteredRecibos.length)}>
                <RecibosTabla items={slicePage(filteredRecibos)} loading={false} onView={openViewRecibo} onEdit={openEditRecibo} onPrint={() => {}} onAnular={handleAnularRecibo} />
              </DataTable>
            </>
          )}

          {activeTab === 'Imprimir Excedentes' && (
            <>
              <ImprimirExcedentesTab 
                periodo={imprimirPeriodo} regional={imprimirRegional} 
                onPeriodoChange={setImprimirPeriodo} onRegionalChange={setImprimirRegional} 
                onBuscar={() => {}} items={slicePage(imprimirItems)} loading={false}
                selected={imprimirSelected} onToggle={() => {}} onToggleAll={() => {}}
              />
              <DataTable headers={<ImprimirHead allSelected={imprimirSelected.size === imprimirItems.length} onToggleAll={() => {}} />} {...commonPaginationProps(imprimirItems.length)}>
                <ImprimirTabla items={slicePage(imprimirItems)} loading={false} selected={imprimirSelected} onToggle={() => {}} onToggleAll={() => {}} />
              </DataTable>
            </>
          )}

          {activeTab === 'Excedentes mayor a 30 días' && (
            <>
              <Mayor30DiasTab totalCount={mayor30.length} onRefresh={() => {}} />
              <DataTable headers={<Mayor30Head />} {...commonPaginationProps(filteredMayor30.length)}>
                <Mayor30Tabla items={slicePage(filteredMayor30)} loading={false} />
              </DataTable>
            </>
          )}

          {activeTab === 'Relación recibos de pago' && (
            <>
              <RelacionRecibosTab periodo={relacionPeriodo} onPeriodoChange={setRelacionPeriodo} onGenerar={() => {}} onPrint={() => {}} onExport={() => {}} />
              <DataTable headers={<RelacionHead />} {...commonPaginationProps(relacionItems.length)}>
                <RelacionTabla items={slicePage(relacionItems)} loading={false} />
              </DataTable>
            </>
          )}

          {activeTab === 'Formato Financiero' && (
            <FormatoFinancieroTab periodo={financieroPeriodo} onPeriodoChange={setFinancieroPeriodo} onGenerar={() => {}} onPrint={() => {}} totales={financieroTotales} loading={false} />
          )}

          {activeTab === 'Formato Salarios' && (
            <>
              <FormatoSalariosTab periodo={salariosPeriodo} onPeriodoChange={setSalariosPeriodo} onGenerar={() => {}} onPrint={() => {}} hasData={true} />
              <DataTable headers={<SalariosHead />} {...commonPaginationProps(salariosItems.length)}>
                <SalariosTabla items={slicePage(salariosItems)} loading={false} />
              </DataTable>
            </>
          )}

          {activeTab === 'Reliquidar excedentes' && (
            <ReliquidarExcedentesTab numeroRecibo={reliquidarNum} onChange={setReliquidarNum} onBuscar={handleReliquidarBuscar} onReliquidar={() => {}} info={reliquidarInfo} error={reliquidarError} loading={false} />
          )}

          {activeTab === 'Excedentes sin cancelar' && (
            <>
              <SinCancelarTab totalCount={sinCancelar.length} onRefresh={() => {}} />
              <DataTable headers={<SinCancelarHead />} {...commonPaginationProps(filteredSinCancelar.length)}>
                <SinCancelarTabla items={slicePage(filteredSinCancelar)} loading={false} />
              </DataTable>
            </>
          )}

        </div>
      </div>

      {isViewOpen && selectedRecibo && <ReciboDetallesModal recibo={selectedRecibo} onClose={closeReciboModals} onEdit={openEditRecibo} />}
      {isEditOpen && <ReciboEditModal isEdit={!isNewMode} form={reciboForm} onFormChange={(f, v) => setReciboForm(p => ({ ...p, [f]: v }))} onClose={closeReciboModals} onSave={handleSaveRecibo} />}
    </div>
  );
};

export default ExcedentesLayout;
