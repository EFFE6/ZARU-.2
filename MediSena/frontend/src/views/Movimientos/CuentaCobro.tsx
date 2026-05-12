import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { RotateCw, Plus, Check, ChevronDown, X, Printer, Eye } from 'lucide-react';
import '../../styles/Movimientos/CuentaCobro.css';

interface CuentaCobro {
  id: number;
  numero: number;
  contratista: string;
  periodo: string;
  fecha: string;
  valor: string;
  estado: string;
}

const DetallesModal: React.FC<{ cuenta: CuentaCobro; onClose: () => void }> = ({ cuenta, onClose }) => {
  const [step, setStep] = useState(0);
  const STEPS_LABELS = ['INFO DE CUENTA', 'CONTRATISTA', 'VALOR Y ESTADO'];

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
                  <span className="oa-det-info-label">Número de Cuenta</span>
                  <span className="oa-det-info-value">#{cuenta.numero}</span>
                </div>
                <div className="oa-det-info-field">
                  <span className="oa-det-info-label">Fecha Radicación</span>
                  <span className="oa-det-info-value">{cuenta.fecha}</span>
                </div>
              </div>
            </div>
            <div className="oa-det-card">
              <div className="oa-det-info-field full">
                <span className="oa-det-info-label">Periodo Prestado</span>
                <span className="oa-det-info-value">OCTUBRE 2015</span>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="oa-det-content-step2">
            <div className="oa-det-card full">
              <span className="oa-det-info-label">Identificación Contratista</span>
              <span className="oa-det-info-value">{cuenta.contratista}</span>
            </div>
            <div className="oa-det-card full">
              <span className="oa-det-info-label">Nombre del Contratista</span>
              <span className="oa-det-info-value">CONTRATISTA SELECCIONADO</span>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="oa-det-content-grid">
            <div className="oa-det-card">
              <span className="oa-det-info-label">Valor de la Cuenta</span>
              <span className="oa-det-info-value" style={{ color: '#166534' }}>{cuenta.valor}</span>
            </div>
            <div className="oa-det-card">
              <span className="oa-det-info-label">Estado Actual</span>
              <span className={`cc-estado-badge cc-badge-${cuenta.estado.toLowerCase()}`}>
                {cuenta.estado}
              </span>
            </div>
            <div className="oa-det-card full">
              <span className="oa-det-info-label">Observaciones de Auditoría</span>
              <span className="oa-det-info-value">CUENTA EN REVISIÓN POR EL ÁREA FINANCIERA.</span>
            </div>
          </div>
        )}
      </div>

      <div className="oa-modal-detalles-footer-final">
        <div className="oa-det-footer-left">
          <button className="oa-det-btn-icon-outline" title="Imprimir" onClick={() => window.print()}>
            <Printer size={20} />
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

const ESTADOS_CC = ['Todos', 'PENDIENTE', 'APROBADA', 'RECHAZADA'];

const MOCK_CUENTAS: CuentaCobro[] = [
  { id: 1, numero: 4623, contratista: '176041', periodo: '2015-10-01T00:00:00.000Z', fecha: '14/9/2015', valor: '$70000', estado: 'PENDIENTE' },
  { id: 2, numero: 4626, contratista: '176041', periodo: '2015-10-01T00:00:00.000Z', fecha: '2/9/2015', valor: '$120737', estado: 'PENDIENTE' },
  { id: 3, numero: 4627, contratista: '176041', periodo: '2015-10-01T00:00:00.000Z', fecha: '2/9/2015', valor: '$70000', estado: 'PENDIENTE' },
  { id: 4, numero: 4630, contratista: '176041', periodo: '2015-10-01T00:00:00.000Z', fecha: '9/9/2015', valor: '$70000', estado: 'PENDIENTE' },
];

const EstadoCCBadge: React.FC<{ estado: string }> = ({ estado }) => {
  const map: Record<string, string> = {
    PENDIENTE: 'cc-badge-pendiente',
    APROBADA: 'cc-badge-aprobada',
    RECHAZADA: 'cc-badge-rechazada',
  };
  return <span className={`cc-estado-badge ${map[estado] ?? 'cc-badge-pendiente'}`}>{estado}</span>;
};

const CuentaCobroView: React.FC = () => {
  const [cuentas] = useState<CuentaCobro[]>(MOCK_CUENTAS);
  const { search, setSearch } = useOutletContext<{ search: string; setSearch: (v: string) => void }>();
  const [estadoFilter, setEstadoFilter] = useState('Todos');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [cuentaSeleccionada, setCuentaSeleccionada] = useState<CuentaCobro | null>(null);

  const filtered = useMemo(() => {
    return cuentas.filter(c => {
      const matchSearch =
        String(c.numero).includes(search) ||
        c.contratista.toLowerCase().includes(search.toLowerCase());
      const matchEstado = estadoFilter === 'Todos' || c.estado === estadoFilter;
      return matchSearch && matchEstado;
    });
  }, [cuentas, search, estadoFilter, fechaInicio, fechaFin]);

  return (
    <div className="mov-view-container">
      <div className="oa-table-toolbar">
        <div className="cc-filters-row">
          <div className="cc-select-field">
            <label className="cc-field-label">Estado</label>
            <div className="cc-select-wrap">
              <select
                value={estadoFilter}
                onChange={e => setEstadoFilter(e.target.value)}
              >
                {ESTADOS_CC.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
              <ChevronDown size={14} className="cc-select-chevron" />
            </div>
          </div>

          <div className="cc-date-field">
            <label className="cc-field-label">Fecha Inicio</label>
            <input
              type="date"
              className="cc-date-input"
              value={fechaInicio}
              onChange={e => setFechaInicio(e.target.value)}
            />
          </div>

          <div className="cc-date-field">
            <label className="cc-field-label">Fecha Fin</label>
            <input
              type="date"
              className="cc-date-input"
              value={fechaFin}
              onChange={e => setFechaFin(e.target.value)}
            />
          </div>

          <button
            className="cc-btn-limpiar"
            onClick={() => { setEstadoFilter('Todos'); setSearch(''); setFechaInicio(''); setFechaFin(''); }}
          >
            Limpiar Filtros
          </button>
        </div>

        <div className="oa-table-toolbar-actions">
          <button className="oa-btn-outline">
            <RotateCw size={15} /> Actualizar
          </button>
          <button className="oa-btn-primary">
            <Plus size={15} /> Nueva Cuenta
          </button>
        </div>
      </div>

      <DataTable
        headers={
          <tr>
            <th>NÚMERO</th>
            <th>CONTRATISTA</th>
            <th>PERÍODO</th>
            <th>FECHA</th>
            <th>VALOR</th>
            <th>ESTADO</th>
            <th>ACCIONES</th>
          </tr>
        }
        >
        {filtered.length === 0 ? (
          <tr><td colSpan={7} className="table-empty">No se encontraron cuentas.</td></tr>
        ) : filtered.map(c => (
          <tr key={c.id}>
            <td className="cc-table-num">#{c.numero}</td>
            <td className="bold">{c.contratista}</td>
            <td>{c.periodo.split('T')[0]}</td>
            <td>{c.fecha}</td>
            <td className="bold" style={{ color: '#166534' }}>{c.valor}</td>
            <td><EstadoCCBadge estado={c.estado} /></td>
            <td>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <button 
                  className="oa-action-circle-btn" 
                  onClick={() => setCuentaSeleccionada(c)}
                  title="Ver Detalles"
                >
                  <Eye size={18} />
                </button>
                <button 
                  className="oa-action-circle-btn" 
                  title="Aprobar"
                  style={{ color: '#10B981' }}
                >
                  <Check size={18} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      {cuentaSeleccionada && (
        <DetallesModal 
          cuenta={cuentaSeleccionada} 
          onClose={() => setCuentaSeleccionada(null)} 
        />
      )}
    </div>
  );
};

export default CuentaCobroView;
