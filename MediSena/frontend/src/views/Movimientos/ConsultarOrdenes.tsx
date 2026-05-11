import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ChevronDown, Filter, FileText, CheckCircle, Clock, DollarSign, Download, RefreshCw } from 'lucide-react';
import DataTable from '../../components/DataTable';
import '../../styles/Movimientos/OrdenAtencion.css';
import '../../styles/Movimientos/ConsultarOrdenes.css';

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

const MOCK_CONSULTAS: OrdenConsulta[] = [
  { id: 1, numero: 668, fecha: '21/02/2026', paciente: 'ROSALINA PALMA SANDOVAL', servicio: 'Consulta General', contratista: 'ABRIL GALEANO GIOVANNI', valor: 120000, estado: 'A' },
  { id: 2, numero: 667, fecha: '21/02/2026', paciente: 'CARLOS MESA RIOS', servicio: 'Especializada', contratista: 'CLAUDIA BASSIL AMIN', valor: 250000, estado: 'A' },
  { id: 3, numero: 666, fecha: '20/02/2026', paciente: 'MARIA GARCIA LOPEZ', servicio: 'Urgencia', contratista: 'DURANGO LARIOS MARIA B.', valor: 380000, estado: 'C' },
  { id: 4, numero: 665, fecha: '19/02/2026', paciente: 'ANA LUCIA TORRES', servicio: 'Control', contratista: 'CLAUDIA BASSIL AMIN', valor: 80000, estado: 'P' },
  { id: 5, numero: 664, fecha: '18/02/2026', paciente: 'JUAN PEREZ MONTOYA', servicio: 'Consulta General', contratista: 'Piedad Viana Marzola', valor: 120000, estado: 'C' },
  { id: 6, numero: 663, fecha: '17/02/2026', paciente: 'PEDRO HERRERA ZULUAGA', servicio: 'Especializada', contratista: 'ABRIL GALEANO GIOVANNI', valor: 310000, estado: 'A' },
  { id: 7, numero: 662, fecha: '16/02/2026', paciente: 'LUCIA MARTINEZ VEGA', servicio: 'Urgencia', contratista: 'CLAUDIA BASSIL AMIN', valor: 450000, estado: 'X' },
];

const ConsultarOrdenes: React.FC = () => {
  const [data] = useState<OrdenConsulta[]>(MOCK_CONSULTAS);
  const { search } = useOutletContext<{ search: string }>();
  const [año, setAño] = useState('2026');
  const [estado, setEstado] = useState('Todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  const estadoLabel: Record<string, string> = { A: 'ACTIVA', C: 'COMPLETADA', P: 'PENDIENTE', X: 'CANCELADA' };

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
    <div style={{ padding: '0 4px' }}>
      {/* Filtros */}
      <div className="co-filters-box">
        <div className="co-filters-header">
          <div className="co-filters-label">
            <Filter size={16} color="#0165B0" />
            Filtros de Búsqueda
          </div>
          <div className="co-header-actions">
            <button className="oa-btn-refresh">
              <Download size={14} style={{ opacity: 0.6 }} /> Exportar
            </button>
            <button className="oa-btn-refresh" onClick={() => {}}>
              <RefreshCw size={14} /> Actualizar
            </button>
          </div>
        </div>
        <div className="co-filters-row">
          <div className="oa-filter-group">
            <label className="oa-filter-label">Año de consulta</label>
            <div className="oa-filter-select-wrap">
              <select className="oa-filter-select" value={año} onChange={e => setAño(e.target.value)}>
                {AÑOS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <ChevronDown size={14} className="oa-select-icon" />
            </div>
          </div>
          <div className="oa-filter-group">
            <label className="oa-filter-label">Estado de la orden</label>
            <div className="oa-filter-select-wrap">
              <select className="oa-filter-select" value={estado} onChange={e => { setEstado(e.target.value); setCurrentPage(1); }}>
                {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
              <ChevronDown size={14} className="oa-select-icon" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="co-stats-row">
        <div className="co-stat-card blue">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="co-stat-label">Total Órdenes</span>
            <FileText size={16} color="#3B82F6" />
          </div>
          <span className="co-stat-value">{total}</span>
        </div>
        <div className="co-stat-card green">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="co-stat-label">Completadas</span>
            <CheckCircle size={16} color="#10B981" />
          </div>
          <span className="co-stat-value">{completadas}</span>
        </div>
        <div className="co-stat-card orange">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="co-stat-label">Pendientes</span>
            <Clock size={16} color="#F59E0B" />
          </div>
          <span className="co-stat-value">{pendientes}</span>
        </div>
        <div className="co-stat-card teal">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="co-stat-label">Valor Total</span>
            <DollarSign size={16} color="#06B6D4" />
          </div>
          <span className="co-stat-value">${valorTotal.toLocaleString()}</span>
        </div>
      </div>

      <DataTable
        headers={tableHeaders}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        visiblePages={visiblePages}
      >
        {current.length === 0 ? (
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
              <td className="bold">${o.valor.toLocaleString()}</td>
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
  );
};

export default ConsultarOrdenes;
