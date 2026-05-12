import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { Eye, Pencil, ChevronDown, X, Printer, Check } from 'lucide-react';
import { PrintIcon, EditIcon } from '../../components/Icons';
import '../../styles/Movimientos/Agendas.css';

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

const DetallesModal: React.FC<{ agenda: AgendaGestion; onClose: () => void }> = ({ agenda, onClose }) => {
  const [step, setStep] = useState(0);
  const STEPS_LABELS = ['INFO GENERAL', 'MÉDICO Y ESPECIALIDAD', 'CUPOS Y ESTADO'];

  const nextStep = () => {
    if (step < 2) setStep(step + 1);
  };

  return (
    <Modal isOpen={true} onClose={onClose} hideHeader className="oa-modal-detalles-final">
      <div className="oa-modal-detalles-header-tabs">
        {STEPS_LABELS.map((s, i) => (
          <div 
            key={i} 
            className={`oa-det-tab ${step === i ? 'active' : ''}`}
            onClick={() => setStep(i)}
          >
            <div className="oa-det-tab-circle">{i + 1}</div>
            <span className="oa-det-tab-label">{s}</span>
          </div>
        ))}
        <button className="oa-modal-detalles-close" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="oa-modal-detalles-body-final">
        {step === 0 && (
          <div className="oa-det-content-grid">
            <div className="oa-det-card">
              <div className="oa-det-grid-inner">
                <div className="oa-det-info-field">
                  <span className="oa-det-info-label">Fecha de Agenda</span>
                  <span className="oa-det-info-value">{agenda.fecha}</span>
                </div>
                <div className="oa-det-info-field">
                  <span className="oa-det-info-label">Horario</span>
                  <span className="oa-det-info-value">{agenda.horario}</span>
                </div>
              </div>
            </div>
            <div className="oa-det-card">
              <div className="oa-det-info-field full">
                <span className="oa-det-info-label">Sede / Ubicación</span>
                <span className="oa-det-info-value">SEDE PRINCIPAL - CONSULTORIO 302</span>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="oa-det-content-step2">
            <div className="oa-det-card full">
              <span className="oa-det-info-label">Médico Tratante</span>
              <span className="oa-det-info-value">{agenda.medico}</span>
            </div>
            <div className="oa-det-card full">
              <span className="oa-det-info-label">Especialidad</span>
              <span className="oa-det-info-value">{agenda.especialidad === '-' ? 'MEDICINA GENERAL' : agenda.especialidad}</span>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="oa-det-content-grid">
            <div className="oa-det-card">
              <span className="oa-det-info-label">Cupos Totales</span>
              <span className="oa-det-info-value">{agenda.cuposTotal}</span>
            </div>
            <div className="oa-det-card">
              <span className="oa-det-info-label">Cupos Usados</span>
              <span className="oa-det-info-value">{agenda.cuposUsados}</span>
            </div>
            <div className="oa-det-card">
              <span className="oa-det-info-label">Estado de Agenda</span>
              <span className={`gag-estado-pill ${agenda.estado}`} style={{ 
                background: agenda.estado === 'DISPONIBLE' ? '#22c55e' : agenda.estado === 'COMPLETA' ? '#ef4444' : '#64748b',
                color: '#fff',
                padding: '4px 12px',
                borderRadius: '20px'
              }}>
                {agenda.estado}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="oa-modal-detalles-footer-final">
        <div className="oa-det-footer-left">
          <button className="oa-det-btn-icon-outline" title="Imprimir" onClick={() => window.print()}>
            <PrintIcon size={48} />
          </button>
          <button className="oa-det-btn-icon-outline" title="Editar" onClick={() => {}}>
            <EditIcon size={48} />
          </button>
        </div>
        
        <div className="oa-det-footer-right">
          <button className="oa-det-btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="oa-det-btn-next" onClick={step === 2 ? onClose : nextStep}>
            {step === 2 ? 'Finalizar' : 'Siguiente'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

const mockData: AgendaGestion[] = [
  { id: 1, fecha: '29/03/2026', medico: 'Médico #1032500530', especialidad: '-', horario: '08:00 AM', cuposUsados: 1, cuposTotal: 1, estado: 'COMPLETA' },
  { id: 2, fecha: '29/03/2026', medico: 'Médico #1067401566', especialidad: '-', horario: '08:00 AM', cuposUsados: 1, cuposTotal: 1, estado: 'COMPLETA' },
  { id: 3, fecha: '10/03/2026', medico: 'Médico #1144149666', especialidad: '-', horario: '08:00 AM', cuposUsados: 1, cuposTotal: 1, estado: 'COMPLETA' },
  { id: 4, fecha: '10/03/2026', medico: 'Médico #1144149666', especialidad: '-', horario: '08:30 AM', cuposUsados: 1, cuposTotal: 1, estado: 'COMPLETA' },
  { id: 5, fecha: '10/03/2026', medico: 'Médico #1144149666', especialidad: '-', horario: '09:00 AM', cuposUsados: 1, cuposTotal: 1, estado: 'COMPLETA' },
  { id: 6, fecha: '10/03/2026', medico: 'Médico #1144149666', especialidad: '-', horario: '09:30 AM', cuposUsados: 1, cuposTotal: 1, estado: 'COMPLETA' },
  { id: 7, fecha: '10/03/2026', medico: 'Médico #1144149666', especialidad: '-', horario: '10:00 AM', cuposUsados: 0, cuposTotal: 1, estado: 'DISPONIBLE' },
];

const ESTADOS_FILTER = ['Todos', 'COMPLETA', 'DISPONIBLE', 'CANCELADA'];

const estadoBadgeStyle: Record<string, { background: string; color: string }> = {
  COMPLETA:   { background: '#ef4444', color: '#fff' },
  DISPONIBLE: { background: '#22c55e', color: '#fff' },
  CANCELADA:  { background: '#64748b', color: '#fff' },
};

const Agendas: React.FC = () => {
  const { search } = useOutletContext<{ search: string }>();
  const [fecha, setFecha] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('Todos');
  const [data] = useState<AgendaGestion[]>(mockData);
  const [agendaSeleccionada, setAgendaSeleccionada] = useState<AgendaGestion | null>(null);

  const filtered = useMemo(() => {
    return data.filter(a => {
      const q = search?.toLowerCase() || '';
      const matchSearch = a.medico.toLowerCase().includes(q) || a.especialidad.toLowerCase().includes(q);
      const matchEstado = estadoFilter === 'Todos' || a.estado === estadoFilter;
      const matchFecha = !fecha || a.fecha === fecha.split('-').reverse().join('/');
      return matchSearch && matchEstado && matchFecha;
    });
  }, [data, search, estadoFilter, fecha]);

  return (
    <div className="mov-view-container" style={{ padding: '0 4px' }}>
        {/* Filtros */}
        <div className="gag-toolbar" style={{ display: 'flex', gap: '16px', marginBottom: '16px', alignItems: 'flex-end' }}>
          <div className="gag-filter-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label className="gag-filter-label" style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8' }}>Filtrar por Fecha</label>
            <input
              type="date"
              className="gag-filter-date"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              style={{ height: '34px', padding: '0 10px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '0.82rem', color: '#1e293b', outline: 'none' }}
            />
          </div>

          <div className="gag-filter-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label className="gag-filter-label" style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8' }}>Estado</label>
            <div className="gag-select-wrap" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <select 
                className="gag-select" 
                value={estadoFilter} 
                onChange={e => setEstadoFilter(e.target.value)}
                style={{ appearance: 'none', height: '34px', padding: '0 30px 0 10px', border: '1.5px solid #E2E8F0', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, color: '#1e293b', background: '#fff', cursor: 'pointer', outline: 'none', minWidth: '130px' }}
              >
                {ESTADOS_FILTER.map(e => <option key={e}>{e}</option>)}
              </select>
              <ChevronDown size={14} className="gag-select-icon" style={{ position: 'absolute', right: '8px', color: '#94a3b8', pointerEvents: 'none' }} />
            </div>
          </div>
          
          <button
            onClick={() => { setEstadoFilter('Todos'); setFecha(''); }}
            style={{ height: '34px', padding: '0 16px', background: '#fff', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
          >
            Limpiar Filtros
          </button>
        </div>

        {/* Tabla estandarizada */}
        <DataTable
          headers={
            <tr>
              <th>FECHA</th>
              <th>MÉDICO</th>
              <th>ESPECIALIDAD</th>
              <th>HORARIO</th>
              <th>CUPOS</th>
              <th>ESTADO</th>
              <th>ACCIONES</th>
            </tr>
          }
        >
          {filtered.length === 0 ? (
            <tr><td colSpan={7} className="table-empty">No se encontraron agendas.</td></tr>
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
                <span className="gag-estado-pill" style={{ ...estadoBadgeStyle[a.estado], padding: '3px 12px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.05em' }}>
                  {a.estado}
                </span>
              </td>
              <td>
                <div className="gag-actions" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button 
                    title="Ver" 
                    className="oa-action-circle-btn"
                    onClick={() => setAgendaSeleccionada(a)}
                  >
                    <Eye size={16} />
                  </button>
                  <button title="Editar" className="oa-action-circle-btn">
                    <Pencil size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>

        {agendaSeleccionada && (
          <DetallesModal 
            agenda={agendaSeleccionada} 
            onClose={() => setAgendaSeleccionada(null)} 
          />
        )}
    </div>
  );
};

export default Agendas;
