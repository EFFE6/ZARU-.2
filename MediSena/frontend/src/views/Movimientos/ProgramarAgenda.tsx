import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import MovTabs from './MovTabs';
import { Home, ChevronRight, Trash2, RefreshCw } from 'lucide-react';
import '../../styles/GestionResoluciones/GestionResoluciones.css';
import './OrdenAtencion.css';
import './tabs/Agendas.css';

interface AgendaProgramada {
  id: number;
  medico: string;
  fecha: string;
  horarioInicio: string;
  horarioFin: string;
  cupos: number;
}

const MEDICOS = [
  'Médico #1067401566',
  'Médico #1032500530',
  'Médico #1144149666',
  'Dr. Juan Carlos Herrera',
  'Dra. Patricia Morales',
];

const mockAgendas: AgendaProgramada[] = [
  { id: 1, medico: 'Médico #1067401566', fecha: '29/03/2026', horarioInicio: '08:00 AM', horarioFin: '08:00 AM', cupos: 1 },
  { id: 2, medico: 'Médico #1032500530', fecha: '29/03/2026', horarioInicio: '08:00 AM', horarioFin: '08:00 AM', cupos: 1 },
  { id: 3, medico: 'Médico #1144149666', fecha: '10/03/2026', horarioInicio: '08:00 AM', horarioFin: '08:00 AM', cupos: 1 },
  { id: 4, medico: 'Médico #1144149666', fecha: '10/03/2026', horarioInicio: '08:30 AM', horarioFin: '08:30 AM', cupos: 1 },
  { id: 5, medico: 'Médico #1144149666', fecha: '10/03/2026', horarioInicio: '09:00 AM', horarioFin: '09:00 AM', cupos: 1 },
  { id: 6, medico: 'Médico #1144149666', fecha: '10/03/2026', horarioInicio: '09:30 AM', horarioFin: '09:30 AM', cupos: 1 },
  { id: 7, medico: 'Médico #1144149666', fecha: '10/03/2026', horarioInicio: '10:00 AM', horarioFin: '10:00 AM', cupos: 1 },
  { id: 8, medico: 'Médico #1144149666', fecha: '10/03/2026', horarioInicio: '10:30 AM', horarioFin: '10:30 AM', cupos: 1 },
  { id: 9, medico: 'Médico #1144149666', fecha: '05/03/2026', horarioInicio: '08:00 AM', horarioFin: '08:00 AM', cupos: 1 },
  { id: 10, medico: 'Médico #1144149666', fecha: '05/03/2026', horarioInicio: '08:30 AM', horarioFin: '08:30 AM', cupos: 1 },
];

const ProgramarAgendaView: React.FC = () => {
  const [agendas, setAgendas] = useState<AgendaProgramada[]>(mockAgendas);
  const [form, setForm] = useState({ medico: '', fecha: '', horaInicio: '', horaFin: '', cupos: '' });
  const [page, setPage] = useState(1);
  const [firstActive, setFirstActive] = useState(false);
  const PER_PAGE = 10;

  const change = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }));

  const handleProgramar = () => {
    if (!form.medico || !form.fecha || !form.horaInicio || !form.horaFin || !form.cupos) return;
    const toAMPM = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
    };
    setAgendas(p => [{
      id: Date.now(),
      medico: form.medico,
      fecha: form.fecha.split('-').reverse().join('/'),
      horarioInicio: toAMPM(form.horaInicio),
      horarioFin: toAMPM(form.horaFin),
      cupos: Number(form.cupos),
    }, ...p]);
    setForm({ medico: '', fecha: '', horaInicio: '', horaFin: '', cupos: '' });
  };

  const handleEliminar = (id: number) => setAgendas(p => p.filter(a => a.id !== id));

  const totalPages = Math.max(1, Math.ceil(agendas.length / PER_PAGE));
  const current = agendas.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="main-layout">
      <Sidebar />
      <main className="main-content">
        <div className="gestion-container">

          {/* Header — fondo degradado con breadcrumb y título */}
          <header className="gestion-header">
            <div className="gestion-header-top">
              <nav className="breadcrumb">
                <div className="breadcrumb-item"><Home size={14} /></div>
                <div className="breadcrumb-sep"><ChevronRight size={13} /></div>
                <div className="breadcrumb-item">Movimientos</div>
                <div className="breadcrumb-sep"><ChevronRight size={13} /></div>
                <div className="breadcrumb-item active">Programar Agenda</div>
              </nav>
            </div>
            <div className="gestion-header-bottom">
              <h1 className="gestion-title" style={{ margin: 0 }}>Programar Agenda</h1>
              <button className="oa-btn-refresh" onClick={() => setAgendas(mockAgendas)}>
                <RefreshCw size={14} /> Actualizar
              </button>
            </div>
          </header>

          {/* Card blanca — layout 2 columnas */}
          <div className="tabs-card-group">
            <MovTabs onFirstActive={setFirstActive} />
            <div className={`gestion-content-card${firstActive ? ' first-tab-active' : ''}`} style={{ marginTop: 0 }}>
              <div className="pag-layout">

                {/* Formulario (izquierda) */}
                <div className="pag-form-panel">
                  <div className="pag-form-title-row">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#1e3a52" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <h2 className="pag-form-title">Nueva Agenda</h2>
                  </div>

                  <select className="pag-select" value={form.medico} onChange={e => change('medico', e.target.value)}>
                    <option value="">Médico *</option>
                    {MEDICOS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>

                  <div className="pag-field">
                    <label className="pag-label">Fecha *</label>
                    <input type="date" className="pag-input" value={form.fecha} onChange={e => change('fecha', e.target.value)} />
                  </div>

                  <div className="pag-two-col">
                    <div className="pag-field">
                      <label className="pag-label">Hora Inicio *</label>
                      <input type="time" className="pag-input" value={form.horaInicio} onChange={e => change('horaInicio', e.target.value)} />
                    </div>
                    <div className="pag-field">
                      <label className="pag-label">Hora Fin *</label>
                      <input type="time" className="pag-input" value={form.horaFin} onChange={e => change('horaFin', e.target.value)} />
                    </div>
                  </div>

                  <div className="pag-field">
                    <input
                      type="number" min={1}
                      className="pag-input"
                      placeholder="Cupos Disponibles *"
                      value={form.cupos}
                      onChange={e => change('cupos', e.target.value)}
                    />
                  </div>

                  <button className="pag-btn-save" onClick={handleProgramar}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
                      <polyline points="17 21 17 13 7 13 7 21"/>
                      <polyline points="7 3 7 8 15 8"/>
                    </svg>
                    Programar Agenda
                  </button>
                </div>

                {/* Tabla (derecha) */}
                <div className="pag-table-panel">
                  <div className="pag-table-header-row">
                    <h2 className="pag-table-title">Agendas Programadas</h2>
                    <span className="pag-count-badge">{agendas.length}</span>
                  </div>

                  <div className="oa-table-scroll">
                    <table className="resoluciones-table">
                      <thead>
                        <tr>
                          <th>Médico</th>
                          <th>Fecha</th>
                          <th>Horario</th>
                          <th>Cupos</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {current.length === 0 ? (
                          <tr><td colSpan={5} className="table-empty">No hay agendas programadas.</td></tr>
                        ) : current.map(a => (
                          <tr key={a.id}>
                            <td style={{ color: '#0165B0', fontWeight: 600 }}>{a.medico}</td>
                            <td>{a.fecha}</td>
                            <td>{a.horarioInicio} - {a.horarioFin}</td>
                            <td><span className="pag-cupos-badge">{a.cupos}/{a.cupos}</span></td>
                            <td>
                              <button className="oa-btn-delete" onClick={() => handleEliminar(a.id)} title="Eliminar">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="rp-footer-info">
                    <span className="rp-info-label">Filas por página: <strong>{PER_PAGE}</strong></span>
                    <span className="rp-info-count">{(page-1)*PER_PAGE+1}-{Math.min(page*PER_PAGE, agendas.length)} de {agendas.length}</span>
                    <button className="rp-nav-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                    <button className="rp-nav-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default ProgramarAgendaView;
