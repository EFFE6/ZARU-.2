import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Search } from 'lucide-react';
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

const MOCK_DATA = [
  { id: 1, numero: 668, fecha: '21/2/2026', paciente: 'ROSALINA PALMA SANDOVAL', servicio: 0, contratista: 'ABRIL GALEANO GIOVANNI', valor: 0, estado: 'A' },
  { id: 2, numero: 668, fecha: '21/2/2026', paciente: 'ROSALINA PALMA SANDOVAL', servicio: 0, contratista: 'ABRIL GALEANO GIOVANNI', valor: 0, estado: 'A' },
  { id: 3, numero: 668, fecha: '21/2/2026', paciente: 'ROSALINA PALMA SANDOVAL', servicio: 0, contratista: 'CLAUDIA BASSIL AMIN', valor: 0, estado: 'A' },
  { id: 4, numero: 667, fecha: '21/2/2026', paciente: 'ROSALINA PALMA SANDOVAL', servicio: 0, contratista: 'DURANGO LARIOS MARIA BERNARDA', valor: 0, estado: 'A' },
  { id: 5, numero: 666, fecha: '20/2/2026', paciente: 'CARLOS MESA RIOS', servicio: 0, contratista: 'ABRIL GALEANO GIOVANNI', valor: 0, estado: 'C' },
  { id: 6, numero: 665, fecha: '19/2/2026', paciente: 'ANA LUCIA TORRES', servicio: 0, contratista: 'CLAUDIA BASSIL AMIN', valor: 0, estado: 'P' },
];

const ConsultarOrdenes: React.FC = () => {
  const [data, setData] = useState<OrdenConsulta[]>(MOCK_DATA);
  const [año, setAño] = useState('2026');
  const [estado, setEstado] = useState('Todos');
  const { search, setSearch } = useOutletContext<{ search: string, setSearch: (v: string) => void }>();

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

  const estadoLabel: Record<string, string> = { A: 'A', C: 'C', P: 'P', X: 'X' };

  return (
    <div style={{ padding: '0 4px' }}>
      {/* Filtros */}
      <div className="co-filters-box">
        <div className="co-filters-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
          Filtros de Búsqueda
        </div>
        <div className="co-filters-row">
          <div className="co-filter-group">
            <label className="co-filter-label">AÑO</label>
            <select className="co-filter-select" value={año} onChange={e => setAño(e.target.value)}>
              {AÑOS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="co-filter-group">
            <label className="co-filter-label">ESTADO</label>
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

      {/* Tabla */}
      <div className="co-table-wrapper">
        <table className="co-table">
          <thead>
            <tr>
              <th>NÚMERO ORDEN</th>
              <th>FECHA</th>
              <th>PACIENTE</th>
              <th>SERVICIO</th>
              <th>CONTRATISTA</th>
              <th>VALOR</th>
              <th>ESTADO</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="co-table-empty">
                  No hay órdenes para el año {año} con los filtros seleccionados
                </td>
              </tr>
            ) : (
              filtered.map((o, idx) => (
                <tr key={`${o.id}-${idx}`}>
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
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ConsultarOrdenes;
