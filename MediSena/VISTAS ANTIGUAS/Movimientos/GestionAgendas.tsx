import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import MovTabs from './MovTabs';
import { Home, ChevronRight, Eye, Pencil, RefreshCw, ChevronDown } from 'lucide-react';
import '../../styles/GestionResoluciones/GestionResoluciones.css';
import './OrdenAtencion.css';
import './tabs/Agendas.css';

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

const estadoPill: Record<string, { background: string; color: string }> = {
  COMPLETA:   { background: '#ef4444', color: '#fff' },
  DISPONIBLE: { background: '#22c55e', color: '#fff' },
  CANCELADA:  { background: '#64748b', color: '#fff' },
};

const GestionAgendasView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [fecha, setFecha] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('Todos');
  const [data] = useState<AgendaGestion[]>(mockData);
  const [firstActive, setFirstActive] = useState(false);

  const filtered = data.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = a.medico.toLowerCase().includes(q) || a.especialidad.toLowerCase().includes(q);
    const matchEstado = estadoFilter === 'Todos' || a.estado === estadoFilter;
    const matchFecha = !fecha || a.fecha === fecha.split('-').reverse().join('/');
    return matchSearch && matchEstado && matchFecha;
  });

  return (
    <div className="main-layout">
      <Sidebar />
      <main className="main-content">
        <div className="gestion-container">

          {/* Header degradado */}
          <header className="gestion-header">
            <div className="gestion-header-top">
              <nav className="breadcrumb">
                <div className="breadcrumb-item"><Home size={14} /></div>
                <div className="breadcrumb-sep"><ChevronRight size={13} /></div>
                <div className="breadcrumb-item">Movimientos</div>
                <div className="breadcrumb-sep"><ChevronRight size={13} /></div>
                <div className="breadcrumb-item active">Agendas</div>
              </nav>
            </div>
            <div className="gestion-header-bottom">
              <h1 className="gestion-title" style={{ margin: 0 }}>Gestión de Agendas</h1>
              <button className="oa-btn-refresh">
                <RefreshCw size={14} /> Actualizar
              </button>
            </div>
          </header>

          {/* Card blanca */}
          <div className="tabs-card-group">
            <MovTabs onFirstActive={setFirstActive} />
            <div className={`gestion-content-card${firstActive ? ' first-tab-active' : ''}`} style={{ marginTop: 0 }}>

              {/* Filtros */}
              <div className="oa-toolbar" style={{ flexWrap: 'wrap', gap: 10 }}>
                <div className="oa-search-wrap" style={{ flex: 1 }}>
                  <svg width="15" height="15" viewBox="0 0 17 17" fill="none">
                    <circle cx="7" cy="7" r="4.2" stroke="#94a3b8" strokeWidth="2"/>
                    <line x1="10.2" y1="10.5" x2="15.5" y2="15.8" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <input
                    className="oa-search-input"
                    placeholder="Buscar médico o especialidad..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <label style={{ fontSize: '0.70rem', color: '#64748b', fontWeight: 600 }}>Filtrar por Fecha</label>
                  <input
                    type="date"
                    className="oa-filter-select"
                    style={{ padding: '8px 10px', minWidth: 150 }}
                    value={fecha}
                    onChange={e => setFecha(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <label style={{ fontSize: '0.70rem', color: '#64748b', fontWeight: 600 }}>Estado</label>
                  <div className="oa-select-wrap">
                    <select className="oa-filter-select" value={estadoFilter} onChange={e => setEstadoFilter(e.target.value)}>
                      {ESTADOS_FILTER.map(e => <option key={e}>{e}</option>)}
                    </select>
                    <ChevronDown size={11} className="oa-select-icon" />
                  </div>
                </div>
              </div>

              {/* Tabla */}
              <div className="oa-table-scroll">
                <table className="resoluciones-table">
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
                      <tr><td colSpan={7} className="table-empty">No se encontraron agendas.</td></tr>
                    ) : filtered.map(a => (
                      <tr key={a.id}>
                        <td style={{ color: '#0165B0', fontWeight: 600 }}>{a.fecha}</td>
                        <td>{a.medico}</td>
                        <td>{a.especialidad}</td>
                        <td>{a.horario}</td>
                        <td><span className="pag-cupos-badge">{a.cuposUsados}/{a.cuposTotal}</span></td>
                        <td>
                          <span className="gag-estado-pill" style={estadoPill[a.estado]}>
                            {a.estado}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="oa-btn-view" title="Ver"><Eye size={14} /></button>
                            <button className="oa-btn-edit" title="Editar"><Pencil size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="rp-totales">
                <span className="rp-total-badge rp-total-dark">{filtered.length} agenda(s) encontrada(s)</span>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default GestionAgendasView;
