import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { Printer, ChevronDown, ChevronLeft, ChevronRight, X, ArrowDownUp, RefreshCcw, Plus, Check, Pencil, Save } from 'lucide-react';
import { ExcedentesEstado, OJOIcon, EditIcon, EditarDetallesIcon, PrintIcon } from '../../components/Icons';
import '../../styles/Movimientos/OrdenAtencion.css';
import logoPrint from '../../assets/img/Sidebar/Sidebar.svg';

import { OrdenAtencion, TIPOS_ATENCION, MOCK_ORDENES } from './types';

/* ─── Badge estado ───────────────────────────────────────── */
const EstadoBadge: React.FC<{ estado: string }> = () => (
  <div className="oa-estado-icon-badge">
    <ExcedentesEstado size={16} />
  </div>
);

/* ─── Custom Select (dropdown estilo Figma) ─────────────── */
interface CustomSelectProps {
  value: string;
  options: string[];
  placeholder?: string;
  onChange: (v: string) => void;
  label?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ value, options, placeholder = 'Seleccionar', onChange, label }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <fieldset className={`oa-fieldset oa-custom-select ${open ? 'open' : ''}`} ref={ref}>
      {label && <legend className="oa-legend">{label}</legend>}
      <div
        className="oa-custom-select-trigger"
        onClick={() => setOpen(o => !o)}
      >
        <span className={value ? '' : 'placeholder'}>{value || placeholder}</span>
        <ChevronDown size={13} className={`oa-custom-select-arrow ${open ? 'open' : ''}`} />
      </div>
      {open && (
        <ul className="oa-custom-select-dropdown">
          {options.map(opt => (
            <li
              key={opt}
              className={`oa-custom-select-option ${value === opt ? 'selected' : ''}`}
              onClick={() => { onChange(opt); setOpen(false); }}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  );
};

/* ═══════════════════════════════════════════════════════════
   MODAL: Detalles de la Orden
   ═══════════════════════════════════════════════════════════ */
const DetallesModal: React.FC<{ orden: OrdenAtencion; onClose: () => void; onEdit: (o: OrdenAtencion) => void }> = ({ orden, onClose, onEdit }) => {
  const [step, setStep] = useState(0);
  const STEPS_LABELS = ['DATOS GENERALES', 'BENEFICIARIO Y FUNCIONARIO', 'ATENCIÓN MÉDICA'];

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
            <div className="oa-det-info-field">
              <span className="oa-det-info-label">Tipo de Atención</span>
              <input className="oa-det-input-clean" readOnly value={orden.tipoAtencion || '0'} />
            </div>
            <div className="oa-det-info-field">
              <span className="oa-det-info-label">Detalles de la orden</span>
              <input className="oa-det-input-clean" readOnly value={orden.diagnostico || 'REMISIÓN A CONSULTA ESPECIALIZADA...'} />
            </div>
            <div className="oa-det-info-field full">
              <span className="oa-det-info-label">Detalles de la orden</span>
              <input className="oa-det-input-clean" readOnly value={orden.observaciones || 'SE AUTORIZA CONSULTA ESPECIALIZADA POR DERMATOLOGÍA. TARIFA PACTADA.'} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="oa-det-content-step2">
            <div className="oa-det-info-field full">
              <span className="oa-det-info-label">Beneficiario</span>
              <input className="oa-det-input-clean" readOnly value={orden.beneficiario.replace('\n', ' ')} />
            </div>
            <div className="oa-det-info-field full">
              <span className="oa-det-info-label">Funcionario solicitante</span>
              <input className="oa-det-input-clean" readOnly value={orden.funcionarioSolicitante || 'MÉDICO TRATANTE'} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="oa-det-content-grid">
            <div className="oa-det-info-field">
              <span className="oa-det-info-label">Médico tratante</span>
              <input className="oa-det-input-clean" readOnly value={orden.medicoTratante || 'NO ESPECIFICADO'} />
            </div>
            <div className="oa-det-info-field">
              <span className="oa-det-info-label">Especialidad</span>
              <input className="oa-det-input-clean" readOnly value={orden.especialidad || 'NO ESPECIFICADO'} />
            </div>
            <div className="oa-det-info-field">
              <span className="oa-det-info-label">Valor total estimado</span>
              <input className="oa-det-input-clean" readOnly value={orden.valorEstimado || 'NO ESPECIFICADO'} />
            </div>
            <div className="oa-det-info-field">
              <span className="oa-det-info-label">Diagnóstico (Opcional)</span>
              <input className="oa-det-input-clean" readOnly value={orden.diagnostico || 'N/A'} />
            </div>
          </div>
        )}
      </div>

      <div className="oa-modal-detalles-footer-final">
        
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

/* ═══════════════════════════════════════════════════════════
   MODAL: Editar Orden (multi-paso, estilo Figma)
   ═══════════════════════════════════════════════════════════ */
type EditStep = 0 | 1 | 2;
const STEPS = ['Datos Generales', 'Beneficiario y Funcionario', 'Atención Médica'];

const EditarOrdenModal: React.FC<{
  orden: OrdenAtencion;
  onClose: () => void;
  onSave: (o: OrdenAtencion) => void;
}> = ({ orden, onClose, onSave }) => {
  const STEPS_LABELS = ['DATOS GENERALES', 'BENEFICIARIO Y FUNCIONARIO', 'ATENCIÓN MÉDICA'];
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    tipoAtencion: orden.tipoAtencion || '',
    fecha: orden.fecha,
    observaciones: orden.observaciones || '',
    beneficiario: orden.beneficiario.replace('\n', ' '),
    funcionarioSolicitante: orden.funcionarioSolicitante || '',
    medicoTratante: orden.medicoTratante || '',
    especialidad: String(orden.especialidad),
    diagnostico: orden.diagnostico || '',
    valorEstimado: orden.valorEstimado || '',
  });

  const change = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }));

  const handleSave = async () => {
    const updated = { ...orden, ...form, especialidad: form.especialidad };
    onSave(updated as OrdenAtencion);
    onClose();
  };

  const nextStep = () => {
    if (step < 2) setStep(step + 1);
  };

  return (
    <Modal isOpen={true} onClose={onClose} hideHeader className="oa-modal-edit-final">
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
            <div className="oa-det-info-field">
              <span className="oa-det-info-label">Tipo de Atención</span>
              <input 
                className="oa-det-input-clean" 
                value={form.tipoAtencion}
                onChange={e => change('tipoAtencion', e.target.value)}
              />
            </div>
            <div className="oa-det-info-field">
              <span className="oa-det-info-label">Detalles de la orden</span>
              <input 
                className="oa-det-input-clean" 
                placeholder="Diagnóstico / Motivo"
                value={form.diagnostico} 
                onChange={e => change('diagnostico', e.target.value)} 
              />
            </div>
            <div className="oa-det-info-field full">
              <span className="oa-det-info-label">Detalles de la orden</span>
              <input 
                className="oa-det-input-clean" 
                value={form.observaciones} 
                onChange={e => change('observaciones', e.target.value)} 
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="oa-det-content-step2">
            <div className="oa-det-info-field full">
              <span className="oa-det-info-label">Beneficiario</span>
              <input 
                className="oa-det-input-clean" 
                value={form.beneficiario} 
                onChange={e => change('beneficiario', e.target.value)} 
              />
            </div>
            <div className="oa-det-info-field full">
              <span className="oa-det-info-label">Funcionario solicitante</span>
              <input 
                className="oa-det-input-clean" 
                placeholder="Médico tratante"
                value={form.funcionarioSolicitante} 
                onChange={e => change('funcionarioSolicitante', e.target.value)} 
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="oa-det-content-grid">
            <div className="oa-det-info-field">
              <span className="oa-det-info-label">Médico tratante</span>
              <input 
                className="oa-det-input-clean" 
                value={form.medicoTratante} 
                onChange={e => change('medicoTratante', e.target.value)} 
              />
            </div>
            <div className="oa-det-info-field">
              <span className="oa-det-info-label">Especialidad</span>
              <input 
                className="oa-det-input-clean" 
                value={form.especialidad} 
                onChange={e => change('especialidad', e.target.value)} 
              />
            </div>
            <div className="oa-det-info-field">
              <span className="oa-det-info-label">Valor total estimado</span>
              <input 
                className="oa-det-input-clean" 
                value={form.valorEstimado} 
                onChange={e => change('valorEstimado', e.target.value)} 
              />
            </div>
            <div className="oa-det-info-field">
              <span className="oa-det-info-label">Diagnóstico (Opcional)</span>
              <input 
                className="oa-det-input-clean" 
                value={form.diagnostico} 
                onChange={e => change('diagnostico', e.target.value)} 
              />
            </div>
          </div>
        )}
      </div>

      <div className="oa-modal-detalles-footer-final">
        <div className="oa-det-footer-right">
          <button className="oa-det-btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="oa-det-btn-next" onClick={step === 2 ? handleSave : nextStep}>
            {step === 2 ? <><Save size={20} style={{ marginRight: 8 }} /> Guardar</> : 'Siguiente'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

/* ═══════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ═══════════════════════════════════════════════════════════ */
const OrdenAtencionView: React.FC = () => {
  const [ordenes, setOrdenes] = useState<OrdenAtencion[]>(MOCK_ORDENES);
  const { search } = useOutletContext<{ search: string }>();
  const [detallesOrden, setDetallesOrden] = useState<OrdenAtencion | null>(null);
  const [editOrden, setEditOrden] = useState<OrdenAtencion | null>(null);

  /* ── Filtrado ── */
  const filtered = useMemo(() => {
    return ordenes.filter(o => {
      if (!search) return true;
      return String(o.numero).includes(search) ||
        o.beneficiario.toLowerCase().includes(search.toLowerCase()) ||
        o.contratista.toLowerCase().includes(search.toLowerCase());
    });
  }, [ordenes, search]);

  const handleSaveEdit = (updated: OrdenAtencion) => {
    setOrdenes(p => p.map(o => o.id === updated.id ? updated : o));
  };

  /* ── Headers de la tabla ── */
  const tableHeaders = (
    <tr>
      <th>NÚMERO</th>
      <th>VIGENCIA</th>
      <th>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          BENEFICIARIO <ArrowDownUp size={12} color="#64748b" />
        </div>
      </th>
      <th>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          CONTRATISTA <ArrowDownUp size={12} color="#64748b" />
        </div>
      </th>
      <th>ESPECIALIDAD</th>
      <th>FECHA</th>
      <th>ESTADO</th>
      <th></th>
    </tr>
  );

  return (
    <div className="mov-view-container">
      <div className="oa-warning-banner">
        <div className="oa-warning-icon-wrap">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 9V14M12 17.5V18M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="oa-warning-text">
          <p className="oa-warning-title">Cantidad máxima de órdenes alcanzada</p>
          <p className="oa-warning-subtitle">Debido a que el número total de órdenes supera los 3 millones, solo se mostrarán las primeras 1.000 órdenes para optimizar el rendimiento.</p>
        </div>
      </div>

      <div className="oa-table-toolbar">
        <span className="oa-table-toolbar-text">Configure los niveles y topes máximos para beneficiarios</span>
        <div className="oa-table-toolbar-actions">
          <button className="oa-btn-outline" onClick={() => {}}>
            <RefreshCcw size={15} />
            Actualizar
          </button>
          <button className="oa-btn-primary" onClick={() => {}}>
            <Plus size={15} />
            Nueva Orden
          </button>
        </div>
      </div>

      <DataTable headers={tableHeaders}>
        {filtered.length === 0 ? (
          <tr><td colSpan={8} className="table-empty">No se encontraron resultados.</td></tr>
        ) : filtered.map(o => (
          <tr key={o.id}>
            <td style={{ color: '#525252' }}>{o.numero}</td>
            <td style={{ color: '#525252' }}>{o.vigencia}</td>
            <td>
              <div className="oa-multiline-text bold">
                {o.beneficiario.split('\n').map((line, idx) => (
                  <div key={idx}>{line}</div>
                ))}
              </div>
            </td>
            <td style={{ color: '#303030', fontWeight: 600 }}>{o.contratista}</td>
            <td style={{ color: '#525252' }}>{o.especialidad}</td>
            <td style={{ color: '#525252' }}>{o.fecha}</td>
            <td><EstadoBadge estado={o.estado} /></td>
            <td>
              <div className="oa-actions-cell">
                <button className="oa-action-circle-btn" onClick={() => setEditOrden(o)}>
                  <EditIcon size={28} />
                </button>
                <button className="oa-action-circle-btn" onClick={() => setDetallesOrden(o)}>
                  <OJOIcon size={28} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      {detallesOrden && <DetallesModal orden={detallesOrden} onClose={() => setDetallesOrden(null)} onEdit={(o) => setEditOrden(o)} />}
      {editOrden && <EditarOrdenModal orden={editOrden} onClose={() => setEditOrden(null)} onSave={handleSaveEdit} />}
    </div>
  );
};

export default OrdenAtencionView;
