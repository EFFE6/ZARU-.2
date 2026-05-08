import React, { useState, useMemo } from 'react';
import { RefreshCw, Plus } from 'lucide-react';
import { DeleteIcon } from '../../../components/Icons';
import DataTable from '../../../components/DataTable';
import Modal from '../../../components/Modal';
import '../../../styles/Movimientos/Agendas.css';

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
];

const ProgramarAgendaTab: React.FC = () => {
  const [agendas, setAgendas] = useState<AgendaProgramada[]>(mockAgendas);
  const [form, setForm] = useState({ medico: '', fecha: '', horaInicio: '', horaFin: '', cupos: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const change = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }));

  const handleProgramar = () => {
    if (!form.medico || !form.fecha || !form.horaInicio || !form.horaFin || !form.cupos) return;
    const nueva: AgendaProgramada = {
      id: Date.now(),
      medico: form.medico,
      fecha: form.fecha.split('-').reverse().join('/'),
      horarioInicio: form.horaInicio,
      horarioFin: form.horaFin,
      cupos: Number(form.cupos),
    };
    setAgendas(p => [nueva, ...p]);
    setForm({ medico: '', fecha: '', horaInicio: '', horaFin: '', cupos: '' });
    setIsModalOpen(false);
  };

  const handleEliminar = (id: number) => setAgendas(p => p.filter(a => a.id !== id));

  const totalPages = Math.max(1, Math.ceil(agendas.length / itemsPerPage));
  const current = agendas.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const visiblePages = useMemo(() => {
    const delta = 2, start = Math.max(1, currentPage - delta), end = Math.min(totalPages, currentPage + delta);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  const tableHeaders = (
    <tr>
      <th>Médico</th>
      <th>Fecha</th>
      <th>Horario</th>
      <th className="pag-td-center">Cupos</th>
      <th className="pag-td-center">Acciones</th>
    </tr>
  );

  return (
    <div className="pag-container">
      {/* Encabezado con acciones */}
      <div className="pag-header-actions">
        <div className="pag-title-group">
          <h2 className="pag-table-title">Agendas Programadas</h2>
          <button className="pag-btn-refresh" onClick={() => setAgendas(mockAgendas)} title="Actualizar">
            <RefreshCw size={16} />
          </button>
        </div>
        <button className="pag-btn-new" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} /> Nueva Agenda
        </button>
      </div>

      {/* Tabla Principal */}
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
          <tr><td colSpan={5} className="table-empty">No hay agendas programadas.</td></tr>
        ) : current.map(a => (
          <tr key={a.id}>
            <td className="pag-td-medico" title={a.medico}>{a.medico}</td>
            <td className="pag-td-fecha">{a.fecha}</td>
            <td className="pag-td-horario">{a.horarioInicio.replace(' ', '')}-{a.horarioFin.replace(' ', '')}</td>
            <td className="pag-td-center">
              <span className="pag-cupos-badge">{a.cupos}/{a.cupos}</span>
            </td>
            <td className="pag-td-center">
              <button className="pag-btn-del" onClick={() => handleEliminar(a.id)} title="Eliminar">
                <DeleteIcon size={26} />
              </button>
            </td>
          </tr>
        ))}
      </DataTable>

      {/* Modal de Creación */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Programar Nueva Agenda"
        className="resolucion-modal modal-compact"
      >
        <div className="resolucion-modal-body">
          <div className="ue-row">
            <div className="ue-field">
              <label className="ue-label">Médico Responsable *</label>
              <select className="ue-input" value={form.medico} onChange={e => change('medico', e.target.value)}>
                <option value="">Seleccione un médico...</option>
                {MEDICOS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="ue-row">
            <div className="ue-field">
              <label className="ue-label">Fecha de Agenda *</label>
              <input type="date" className="ue-input" value={form.fecha} onChange={e => change('fecha', e.target.value)} />
            </div>
          </div>

          <div className="ue-row">
            <div className="ue-field">
              <label className="ue-label">Hora Inicio *</label>
              <input type="time" className="ue-input" value={form.horaInicio} onChange={e => change('horaInicio', e.target.value)} />
            </div>
            <div className="ue-field">
              <label className="ue-label">Hora Fin *</label>
              <input type="time" className="ue-input" value={form.horaFin} onChange={e => change('horaFin', e.target.value)} />
            </div>
          </div>

          <div className="ue-row">
            <div className="ue-field">
              <label className="ue-label">Cupos Totales *</label>
              <input
                type="number"
                min={1}
                className="ue-input"
                placeholder="Cantidad de cupos"
                value={form.cupos}
                onChange={e => change('cupos', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="resolucion-modal-footer">
          <button className="rm-btn-cancel" onClick={() => setIsModalOpen(false)}>Cancelar</button>
          <button className="rm-btn-primary" onClick={handleProgramar}>
            Guardar Agenda
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ProgramarAgendaTab;
