import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from '../../components/Sidebar';
import MovTabs from './MovTabs';
import DataTable from '../../components/DataTable';
import api from '../../api/api';
import SearchBar from '../../components/SearchBar';
import { Home, ChevronRight, Clock, Download, RefreshCw, Search } from 'lucide-react';
import '../../styles/GestionResoluciones/GestionResoluciones.css';
import '../../styles/Movimientos/OrdenAtencion.css';
import '../../styles/Movimientos/ConsultarOrdenes.css';
import CampanaSvg from '../../assets/img/icons/campana.svg';

interface OrdenConsulta {
  id: number;
  numero: number;
  fecha: string;
  paciente: string;
  servicio: string | number;
  contratista: string;
  valor: number;
  estado: string;
}

const AÑOS = ['2024', '2025', '2026'];
const ESTADOS = ['Todos', 'Completada', 'Pendiente', 'Cancelada'];

const ConsultarOrdenes: React.FC = () => {
  const [data, setData] = useState<OrdenConsulta[]>([]);
  const [loading, setLoading] = useState(false);
  const [año, setAño] = useState('2026');
  const [estado, setEstado] = useState('Todos');
  const [search, setSearch] = useState('');
  const [firstActive, setFirstActive] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ordenes');
      setData(res.data);
    } catch {
      setData([
        { id: 1, numero: 668, fecha: '21/2/2026', paciente: 'ROSALINA PALMA SANDOVAL', servicio: 0, contratista: 'ABRIL GALEANO GIOVANNI', valor: 0, estado: 'A' },
        { id: 2, numero: 668, fecha: '21/2/2026', paciente: 'ROSALINA PALMA SANDOVAL', servicio: 0, contratista: 'ABRIL GALEANO GIOVANNI', valor: 0, estado: 'A' },
        { id: 3, numero: 668, fecha: '21/2/2026', paciente: 'ROSALINA PALMA SANDOVAL', servicio: 0, contratista: 'CLAUDIA BASSIL AMIN', valor: 0, estado: 'A' },
        { id: 4, numero: 667, fecha: '21/2/2026', paciente: 'ROSALINA PALMA SANDOVAL', servicio: 0, contratista: 'DURANGO LARIOS MARIA BERNARDA', valor: 0, estado: 'A' },
        { id: 5, numero: 666, fecha: '20/2/2026', paciente: 'CARLOS MESA RIOS', servicio: 0, contratista: 'ABRIL GALEANO GIOVANNI', valor: 0, estado: 'C' },
        { id: 6, numero: 665, fecha: '19/2/2026', paciente: 'ANA LUCIA TORRES', servicio: 0, contratista: 'CLAUDIA BASSIL AMIN', valor: 0, estado: 'P' },
      ]);
    } finally {
      setLoading(false);
      setCurrentPage(1);
    }
  };

  useEffect(() => { fetchData(); }, [año]);

  const filtered = useMemo(() => {
    return data.filter(o => {
      if (estado !== 'Todos') {
        const estadoMap: Record<string, string> = { Completada: 'C', Pendiente: 'P', Cancelada: 'X' };
        if (o.estado !== estadoMap[estado]) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          String(o.numero).includes(q) ||
          o.paciente.toLowerCase().includes(q) ||
          String(o.servicio).toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [data, estado, search]);

  const total = filtered.length;
  const completadas = filtered.filter(o => o.estado === 'C').length;
  const pendientes  = filtered.filter(o => o.estado === 'P').length;
  const valorTotal  = filtered.reduce((acc, o) => acc + (o.valor || 0), 0);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const current = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const visiblePages = useMemo(() => {
    const delta = 2, start = Math.max(1, currentPage - delta), end = Math.min(totalPages, currentPage + delta);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  const estadoLabel: Record<string, string> = { A: 'A', C: 'C', P: 'P', X: 'X' };

  const tableHeaders = (
    <tr>
      <th>Número Orden</th>
      <th>Fecha</th>
      <th>Paciente</th>
      <th>Servicio</th>
      <th>Contratista</th>
      <th>Valor</th>
      <th>Estado</th>
    </tr>
  );

  return (
    <>
      <div className="gestion-container">

          {/* Header */}
          <header className="gestion-header">
            <div className="gestion-header-top">
              <nav className="breadcrumb">
                <div className="breadcrumb-item"><Home size={14} /></div>
                <div className="breadcrumb-sep"><ChevronRight size={13} /></div>
                <div className="breadcrumb-item">Movimientos</div>
                <div className="breadcrumb-sep"><ChevronRight size={13} /></div>
                <div className="breadcrumb-item active">Consultar Órdenes</div>
              </nav>
              <img src={CampanaSvg} alt="Notificaciones" style={{ width: 28, height: 28, cursor: 'pointer', flexShrink: 0 }} className="notification-bell" />
            </div>
            <div className="gestion-header-bottom">
              <h1 className="gestion-title">Consultar Órdenes</h1>
              <SearchBar
                value={search}
                onChange={(val) => { setSearch(val); setCurrentPage(1); }}
                placeholder="Busca por número de orden, paciente o servicio"
              />
            </div>
          </header>

          {/* Card blanca */}
          <div className="tabs-card-group">
            <MovTabs onFirstActive={setFirstActive} />
            <div className={`gestion-content-card${firstActive ? ' first-tab-active' : ''}`} style={{ marginTop: 0 }}>

              {/* Filtros */}
              <div className="co-filters-box">
                <div className="co-filters-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                  Filtros de Búsqueda
                </div>
                <div className="co-filters-row">
                  <div className="co-filter-group">
                    <label className="co-filter-label">Año</label>
                    <select className="co-filter-select" value={año} onChange={e => setAño(e.target.value)}>
                      {AÑOS.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <div className="co-filter-group">
                    <label className="co-filter-label">Estado</label>
                    <select className="co-filter-select" value={estado} onChange={e => setEstado(e.target.value)}>
                      {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                  <div className="co-search-wrapper">
                    <Search size={15} color="#94a3b8" className="co-search-icon" />
                    <input
                      type="text"
                      className="co-search-input"
                      placeholder="Buscar por número de orden, paciente o servicio..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="co-stats-row">
                <span className="co-stat-pill blue">Total: {total} órdenes</span>
                <span className="co-stat-pill green">Completadas: {completadas}</span>
                <span className="co-stat-pill orange">Pendientes: {pendientes}</span>
                <span className="co-stat-pill teal">Valor Total: ${valorTotal.toLocaleString()}</span>
              </div>

              {/* Tabla con DataTable */}
              <DataTable
                headers={tableHeaders}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                totalPages={totalPages}
                visiblePages={visiblePages}
              >
                {loading ? (
                  <tr><td colSpan={7} className="table-empty">Cargando...</td></tr>
                ) : current.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="table-empty">
                      No hay órdenes para el año {año} con los filtros seleccionados
                    </td>
                  </tr>
                ) : (
                  current.map(o => (
                    <tr key={o.id}>
                      <td className="co-col-num">{o.numero}</td>
                      <td>{o.fecha}</td>
                      <td className="co-col-paciente">{o.paciente}</td>
                      <td>{o.servicio}</td>
                      <td>{o.contratista}</td>
                      <td>${o.valor.toLocaleString()}</td>
                      <td>
                        <span className={`co-estado-pill ${o.estado === 'C' ? 'green' : o.estado === 'P' ? 'orange' : o.estado === 'X' ? 'red' : 'gray'}`}>
                          {estadoLabel[o.estado] || o.estado}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </DataTable>

            </div>
          </div>

        </div>
    </>
  );
};

export default ConsultarOrdenes;
