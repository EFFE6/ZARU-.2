import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../components/Sidebar';
import MovTabs from './MovTabs';
import api from '../../api/api';
import {
  ChevronRight, ChevronLeft, Home, RefreshCw,
  Download, Printer, ChevronDown,
} from 'lucide-react';
import '../../styles/GestionResoluciones/GestionResoluciones.css';
import './OrdenAtencion.css';
import './RelacionPagos.css';

interface RelacionPago {
  id: number;
  numero: number;
  contratista: string;
  cuentaCobro: string;
  fechaPago: string;
  valor: string;
  formaPago: string;
  estado: string;
}

const RelacionPagosView: React.FC = () => {
  const [pagos, setPagos] = useState<RelacionPago[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [firstActive, setFirstActive] = useState(false);

  const fetchPagos = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/relacion-pagos');
      setPagos(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Error al cargar');
    } finally {
      setLoading(false);
      setCurrentPage(1);
    }
  };

  useEffect(() => { fetchPagos(); }, []);

  const filtered = useMemo(() => {
    return pagos.filter(p =>
      String(p.numero).includes(search) ||
      p.contratista?.toLowerCase().includes(search.toLowerCase())
    );
  }, [pagos, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const current = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalValor = filtered.reduce((sum, p) => {
    const v = parseFloat(p.valor?.replace(/[^0-9.-]/g, '') || '0');
    return sum + v;
  }, 0);

  const paginaValor = current.reduce((sum, p) => {
    const v = parseFloat(p.valor?.replace(/[^0-9.-]/g, '') || '0');
    return sum + v;
  }, 0);

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
                <div className="breadcrumb-item active">Relación de Pagos</div>
              </nav>
            </div>
            <div className="gestion-header-bottom">
              <h1 className="gestion-title" style={{ margin: 0 }}>Relación de Pagos</h1>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="oa-btn-refresh" onClick={fetchPagos}>
                  <Download size={14} style={{ opacity: 0.6 }} /> Exportar
                </button>
                <button className="oa-btn-refresh" onClick={() => window.print()}>
                  <Printer size={14} style={{ opacity: 0.6 }} /> Imprimir
                </button>
                <button className="oa-btn-refresh" onClick={fetchPagos}>
                  <RefreshCw size={14} /> Actualizar
                </button>
              </div>
            </div>
          </header>

          <div className="tabs-card-group">
            <MovTabs onFirstActive={setFirstActive} />
            <div className={`gestion-content-card${firstActive ? ' first-tab-active' : ''}`} style={{ marginTop: 0 }}>

              {/* Toolbar búsqueda */}
              <div className="rp-toolbar">
                <div className="oa-search-wrap rp-search-wrap">
                  <svg width="15" height="15" viewBox="0 0 17 17" fill="none">
                    <circle cx="7" cy="7" r="4.2" stroke="#94a3b8" strokeWidth="2" />
                    <line x1="10.2" y1="10.5" x2="15.5" y2="15.8" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <input
                    className="oa-search-input"
                    placeholder="Buscar por número, contratista..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                  />
                </div>
                <button className="rp-btn-buscar" onClick={() => setCurrentPage(1)}>
                  Buscar
                </button>
              </div>

              {/* Tabla */}
              <div className="oa-table-scroll">
                <table className="resoluciones-table">
                  <thead>
                    <tr>
                      <th>Número</th>
                      <th>Contratista</th>
                      <th>Cuenta Cobro</th>
                      <th>Fecha Pago</th>
                      <th>Valor</th>
                      <th>Forma Pago</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={7} className="table-empty">Cargando datos...</td></tr>
                    ) : error ? (
                      <tr><td colSpan={7} className="table-empty" style={{ color: '#e11d48' }}>⚠️ {error}</td></tr>
                    ) : current.length === 0 ? (
                      <tr><td colSpan={7} className="table-empty">No hay pagos registrados</td></tr>
                    ) : current.map(p => (
                      <tr key={p.id}>
                        <td>{p.numero}</td>
                        <td>{p.contratista}</td>
                        <td>{p.cuentaCobro}</td>
                        <td>{p.fechaPago}</td>
                        <td>{p.valor}</td>
                        <td>{p.formaPago}</td>
                        <td>{p.estado}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Info filas */}
              <div className="rp-footer-info">
                <span className="rp-info-label">Filas por página:</span>
                <div className="oa-select-wrap" style={{ minWidth: 70 }}>
                  <select className="oa-filter-select rp-page-select" defaultValue={10}>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                  <ChevronDown size={11} className="oa-select-icon" />
                </div>
                <span className="rp-info-count">
                  {current.length === 0 ? '0-0' : `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, filtered.length)}`} de {filtered.length}
                </span>
                <button className="rp-nav-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <ChevronLeft size={15} />
                </button>
                <button className="rp-nav-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || filtered.length === 0}>
                  <ChevronRight size={15} />
                </button>
              </div>

              {/* Totales */}
              <div className="rp-totales">
                <span className="rp-total-badge rp-total-dark">
                  Total: {filtered.length} pago{filtered.length !== 1 ? 's' : ''}
                </span>
                <span className="rp-total-badge rp-total-green">
                  En esta página: ${paginaValor.toLocaleString('es-CO')}
                </span>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RelacionPagosView;
