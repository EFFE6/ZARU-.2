import React, { useState } from 'react';
import { Eye, Pencil, RefreshCw, ChevronDown } from 'lucide-react';

interface AgendaGestion {
  id: number;
  fecha: string;
  medico: string;
  especialidad: string;
  horario: string;
  cuposUsados: number;
  cuposTotal: number;
  estado: 'COMPLETA' | 'DISPONIBLE' | 'CANCELADA';
}

const mockData: AgendaGestion[] = [
  { id: 1, fecha: '29/03/2026', medico: 'Médico #1032500530', especialidad: '-', horario: '08:00 AM', cuposUsados: 1, cuposTotal: 1, estado: 'COMPLETA' },
  { id: 2, fecha: '29/03/2026', medico: 'Médico #1067401566', especialidad: '-', horario: '08:00 AM', cuposUsados: 1, cuposTotal: 1, estado: 'COMPLETA' },
  { id: 3, fecha: '10/03/2026', medico: 'Médico #1144149666', especialidad: '-', horario: '08:00 AM', cuposUsados: 1, cuposTotal: 1, estado: 'COMPLETA' },
  { id: 4, fecha: '10/03/2026', medico: 'Médico #1144149666', especialidad: '-', horario: '08:30 AM', cuposUsados: 1, cuposTotal: 1, estado: 'COMPLETA' },
  { id: 5, fecha: '10/03/2026', medico: 'Médico #1144149666', especialidad: '-', horario: '09:00 AM', cuposUsados: 1, cuposTotal: 1, estado: 'COMPLETA' },
  { id: 6, fecha: '10/03/2026', medico: 'Médico #1144149666', especialidad: '-', horario: '09:30 AM', cuposUsados: 1, cuposTotal: 1, estado: 'COMPLETA' },
  { id: 7, fecha: '10/03/2026', medico: 'Médico #1144149666', especialidad: '-', horario: '10:00 AM', cuposUsados: 1, cuposTotal: 1, estado: 'DISPONIBLE' },
];

const ESTADOS_FILTER = ['Todos', 'COMPLETA', 'DISPONIBLE', 'CANCELADA'];

const estadoBadgeStyle: Record<string, { background: string; color: string }> = {
  COMPLETA:   { background: '#ef4444', color: '#fff' },
  DISPONIBLE: { background: '#22c55e', color: '#fff' },
  CANCELADA:  { background: '#64748b', color: '#fff' },
};

const GestionAgendas: React.FC = () => {
  const [search, setSearch] = useState('');
  const [fecha, setFecha] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('Todos');
  const [data, setData] = useState<AgendaGestion[]>(mockData);

  const filtered = data.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = a.medico.toLowerCase().includes(q) || a.especialidad.toLowerCase().includes(q);
    const matchEstado = estadoFilter === 'Todos' || a.estado === estadoFilter;
    const matchFecha = !fecha || a.fecha === fecha.split('-').reverse().join('/');
    return matchSearch && matchEstado && matchFecha;
  });

  return (
    <div className="gag-card">

      {/* Header */}
      <div className="gag-header-row">
        <div>
          <div className="gag-title-row">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1e3a52" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <h2 className="gag-title">Gestión de Agendas</h2>
          </div>
          <p className="gag-subtitle">Visualice y administre las agendas médicas</p>
        </div>
        <button className="gag-btn-refresh" onClick={() => setData(mockData)}>
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="gag-toolbar">
        <div className="gag-search-wrap">
          <svg width="14" height="14" viewBox="0 0 17 17" fill="none">
            <circle cx="7" cy="7" r="4.2" stroke="#94a3b8" strokeWidth="2"/>
            <line x1="10.2" y1="10.5" x2="15.5" y2="15.8" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            className="gag-search-input"
            placeholder="Buscar médico o especialidad..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="gag-filter-group">
          <label className="gag-filter-label">Filtrar por Fecha</label>
          <input
            type="date"
            className="gag-filter-date"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
          />
        </div>

        <div className="gag-filter-group">
          <label className="gag-filter-label">Estado</label>
          <div className="gag-select-wrap">
            <select className="gag-select" value={estadoFilter} onChange={e => setEstadoFilter(e.target.value)}>
              {ESTADOS_FILTER.map(e => <option key={e}>{e}</option>)}
            </select>
            <ChevronDown size={12} className="gag-select-icon" />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="gag-table-scroll">
        <table className="gag-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Médico</th>
              <th>Especialidad</th>
              <th>Horario</th>
              <th>Cupos</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="gag-empty">No se encontraron agendas.</td></tr>
            ) : filtered.map(a => (
              <tr key={a.id}>
                <td style={{ color: '#0165B0', fontWeight: 600 }}>{a.fecha}</td>
                <td>{a.medico}</td>
                <td>{a.especialidad}</td>
                <td>{a.horario}</td>
                <td>
                  <span className="gag-cupos-badge">{a.cuposUsados}/{a.cuposTotal}</span>
                </td>
                <td>
                  <span className="gag-estado-pill" style={estadoBadgeStyle[a.estado]}>
                    {a.estado}
                  </span>
                </td>
                <td>
                  <div className="gag-actions">
                    <button className="gag-btn-eye" title="Ver"><Eye size={14} /></button>
                    <button className="gag-btn-edit" title="Editar"><Pencil size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="gag-footer">
        <span className="gag-count">{filtered.length} agenda(s) encontrada(s)</span>
      </div>
    </div>
  );
};

export default GestionAgendas;
