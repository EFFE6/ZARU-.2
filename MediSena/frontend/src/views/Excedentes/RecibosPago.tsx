import React from 'react';
import {
  DollarSign, Edit2, Printer, Ban, Plus, RefreshCw,
  Search, X, Save, HelpCircle, AlertTriangle, Eye
} from 'lucide-react';
import Modal from '../../components/Modal';
import { ViewIcon, EditIcon } from '../../components/Icons';
import {
  ReciboPago, ESTADOS_RECIBO, TIPOS_PAGO_EXC, METODOS_PAGO, FUNCIONARIOS_EXC,
} from './types';

/* ─── Formulario vacío ──────────────────────────────── */
export const EMPTY_RECIBO_FORM = {
  funcionario: '',
  beneficiario: '',
  fechaPago: '',
  valorTotal: '',
  tipoPago: 'Particular',
  metodoPago: 'Transferencia',
  concepto: 'Excedentes',
  referenciaOrden: '',
  observaciones: '',
};

/* ══════════════════════════════════════════════════════
   TARJETAS DE TOTALES (Total Pagado, Pendiente, Recibos)
   ══════════════════════════════════════════════════════ */
interface TotalesProps {
  totalPagado: string;
  totalPendiente: string;
  totalRecibos: number;
}

export const RecibosTotalesCards: React.FC<TotalesProps> = ({
  totalPagado, totalPendiente, totalRecibos,
}) => (
  <div className="exc-totales-row">
    <div className="exc-total-card exc-total-green">
      <div className="exc-total-info">
        <span className="exc-total-label">Total Pagado</span>
        <span className="exc-total-value">{totalPagado}</span>
      </div>
      <div className="exc-total-icon"><DollarSign size={26} /></div>
    </div>
    <div className="exc-total-card exc-total-orange">
      <div className="exc-total-info">
        <span className="exc-total-label">Total Pendiente</span>
        <span className="exc-total-value">{totalPendiente}</span>
      </div>
      <div className="exc-total-icon"><DollarSign size={26} /></div>
    </div>
    <div className="exc-total-card exc-total-blue">
      <div className="exc-total-info">
        <span className="exc-total-label">Total Recibos</span>
        <span className="exc-total-value">{totalRecibos}</span>
      </div>
      <div className="exc-total-icon">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      </div>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════
   TOOLBAR – Recibos de Pago
   ══════════════════════════════════════════════════════ */
interface ToolbarProps {
  search: string;
  estado: string;
  tipoPago: string;
  error: string | null;
  onSearchChange: (v: string) => void;
  onEstadoChange: (v: string) => void;
  onTipoPagoChange: (v: string) => void;
  onBuscar: () => void;
  onRefresh: () => void;
  onNew: () => void;
}

export const RecibosToolbar: React.FC<ToolbarProps> = ({
  search, estado, tipoPago, error,
  onSearchChange, onEstadoChange, onTipoPagoChange, onBuscar, onRefresh, onNew,
}) => (
  <div className="content-toolbar exc-toolbar-col">
    <div className="exc-toolbar-head">
      <div>
        <h2 className="exc-section-title">
          <DollarSign size={22} color="#0165B0" />
          Recibos de Pago por Excedentes
        </h2>
        <p className="exc-section-desc">Gestione los recibos de pago por excedentes médicos</p>
      </div>
      <div className="usuarios-toolbar-right">
        <button className="btn-actualizar" onClick={onRefresh}>
          <RefreshCw size={14} /> Actualizar
        </button>
        <button className="btn-new-resolution" onClick={onNew}>
          <Plus size={16} /> Nuevo Recibo
        </button>
      </div>
    </div>

    {error && (
      <div className="exc-error-banner">
        <span className="exc-error-dot">⊘</span>
        {error}
      </div>
    )}

    <div className="exc-filter-grid">
      <div className="mov-field mov-field-flex">
        <div className="mov-search-mini">
          <Search size={14} style={{ color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Buscar por número de recibo, funcionario..."
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onBuscar()}
          />
        </div>
      </div>
      <button className="mov-btn-buscar" onClick={onBuscar}>Buscar</button>
      <div className="cons-input-group" style={{ minWidth: 180 }}>
        <label className="cons-floating-label">Estado</label>
        <div className="cons-input-wrapper">
          <select className="cons-input cons-select" value={estado} onChange={e => onEstadoChange(e.target.value)}>
            {ESTADOS_RECIBO.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>
    </div>

    <div className="exc-filter-grid">
      <div className="cons-input-group" style={{ minWidth: 200, maxWidth: 260 }}>
        <label className="cons-floating-label">Tipo de Pago</label>
        <div className="cons-input-wrapper">
          <select className="cons-input cons-select" value={tipoPago} onChange={e => onTipoPagoChange(e.target.value)}>
            {TIPOS_PAGO_EXC.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════
   THEAD
   ══════════════════════════════════════════════════════ */
export const RecibosHead: React.FC = () => (
  <tr>
    <th>Número Recibo</th>
    <th>Funcionario</th>
    <th>Beneficiario</th>
    <th>Fecha Pago</th>
    <th>Valor Total</th>
    <th>Tipo Pago</th>
    <th>Estado</th>
    <th>Método</th>
    <th>Acciones</th>
  </tr>
);

/* ══════════════════════════════════════════════════════
   TABLA
   ══════════════════════════════════════════════════════ */
interface TablaProps {
  items: ReciboPago[];
  loading: boolean;
  onView: (r: ReciboPago) => void;
  onEdit: (r: ReciboPago) => void;
  onPrint: (r: ReciboPago) => void;
  onAnular: (r: ReciboPago) => void;
}

export const RecibosTabla: React.FC<TablaProps> = ({ items, loading, onView, onEdit, onPrint, onAnular }) => {
  if (loading) return <tr><td colSpan={9} className="table-empty">Cargando datos...</td></tr>;
  if (items.length === 0) return <tr><td colSpan={9} className="table-empty">No hay recibos registrados</td></tr>;

  const estadoClass = (e: string) => {
    const l = e.toLowerCase();
    if (l === 'pagado') return 'completada';
    if (l === 'pendiente') return 'pendiente';
    return 'anulada';
  };

  return (
    <>
      {items.map(r => (
        <tr key={r.id}>
          <td className="col-numero">{r.numeroRecibo}</td>
          <td className="exc-col-nombre">{r.funcionario}</td>
          <td>{r.beneficiario || '—'}</td>
          <td>{r.fechaPago}</td>
          <td className="mov-col-valor">{r.valorTotal}</td>
          <td><span className="exc-pill-outline exc-pill-blue">{r.tipoPago}</span></td>
          <td><span className={`mov-estado-badge ${estadoClass(r.estado)}`}>{r.estado}</span></td>
          <td><span className="exc-pill-outline exc-pill-cyan">{r.metodoPago}</span></td>
          <td>
            <div className="row-actions exc-actions-grid">
              <button className="db-icon-btn-svg" title="Ver detalles" onClick={() => onView(r)}>
                <ViewIcon className="db-action-icon" />
              </button>
              <button className="db-icon-btn-svg" title="Editar" onClick={() => onEdit(r)}>
                <EditIcon className="db-action-icon" />
              </button>
              <button className="icon-btn exc-icon-print" title="Imprimir" onClick={() => onPrint(r)}><Printer size={14} /></button>
              <button className="icon-btn delete" title="Anular" onClick={() => onAnular(r)}><Ban size={14} /></button>
            </div>
          </td>
        </tr>
      ))}
    </>
  );
};

/* ══════════════════════════════════════════════════════
   MODAL – DETALLES DEL RECIBO
   ══════════════════════════════════════════════════════ */
interface DetallesProps {
  recibo: ReciboPago;
  onClose: () => void;
}

export const ReciboDetallesModal: React.FC<DetallesProps> = ({ recibo, onClose }) => (
  <Modal isOpen={true} onClose={onClose} title="Detalles del Recibo" className="exc-detalles-modal">
    <div className="resolucion-modal-body exc-detalles-body">
      <div className="exc-det-topline">
        <span className="exc-det-numero">Número de Recibo</span>
        <span className="exc-det-numero-big">{recibo.numeroRecibo}</span>
      </div>
      <div className="exc-det-state-row">
        <span className={`mov-estado-badge ${recibo.estado.toLowerCase() === 'pagado' ? 'completada' : recibo.estado.toLowerCase() === 'pendiente' ? 'pendiente' : 'anulada'}`}>
          {recibo.estado}
        </span>
        <div className="exc-det-valor">
          <span className="exc-det-valor-label">Valor Total</span>
          <span className="exc-det-valor-value">{recibo.valorTotal}</span>
        </div>
      </div>
      <div className="cons-detalles-divider" />
      <div className="exc-det-grid">
        <div className="cons-detalle-field">
          <span className="cons-detalle-label">Funcionario</span>
          <span className="cons-detalle-value">{recibo.funcionario}</span>
        </div>
        <div className="cons-detalle-field">
          <span className="cons-detalle-label">Beneficiario</span>
          <span className="cons-detalle-value">{recibo.beneficiario || '—'}</span>
        </div>
        <div className="cons-detalle-field">
          <span className="cons-detalle-label">Concepto</span>
          <span className="cons-detalle-value">{recibo.concepto}</span>
        </div>
        <div className="cons-detalle-field">
          <span className="cons-detalle-label">Tipo de Pago</span>
          <span className="cons-detalle-value">{recibo.tipoPago}</span>
        </div>
        <div className="cons-detalle-field">
          <span className="cons-detalle-label">Método de Pago</span>
          <span className="cons-detalle-value">{recibo.metodoPago}</span>
        </div>
        <div className="cons-detalle-field">
          <span className="cons-detalle-label">Fecha de Pago</span>
          <span className="cons-detalle-value">{recibo.fechaPago}</span>
        </div>
      </div>
    </div>
    <div className="resolucion-modal-footer" style={{ justifyContent: 'flex-end' }}>
      <div className="rm-footer-actions">
        <button className="rm-btn-primary">
          <Printer size={15} style={{ marginRight: 6 }} />
          Imprimir
        </button>
        <button className="rm-btn-cancel" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  </Modal>
);

/* ══════════════════════════════════════════════════════
   MODAL – EDITAR / NUEVO RECIBO
   ══════════════════════════════════════════════════════ */
interface EditProps {
  isEdit: boolean;
  form: typeof EMPTY_RECIBO_FORM;
  onFormChange: (field: string, value: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export const ReciboEditModal: React.FC<EditProps> = ({ isEdit, form, onFormChange, onClose, onSave }) => (
  <Modal isOpen={true} onClose={onClose} title={isEdit ? 'Editar Recibo de Pago' : 'Nuevo Recibo de Pago'} className="exc-editar-modal">
    <div className="resolucion-modal-body user-edit-body">
      <div className="ue-row">
        <div className="ue-field">
          <label className="ue-label">Funcionario<span className="rm-req">*</span> <HelpCircle size={13} className="rm-help" /></label>
          <select className="ue-input ue-select" value={form.funcionario} onChange={e => onFormChange('funcionario', e.target.value)}>
            <option value="">Seleccionar funcionario</option>
            {FUNCIONARIOS_EXC.map(f => <option key={f}>{f}</option>)}
          </select>
        </div>
        <div className="ue-field">
          <label className="ue-label">Beneficiario<span className="rm-req">*</span> <HelpCircle size={13} className="rm-help" /></label>
          <input className="ue-input" placeholder="Beneficiario" value={form.beneficiario} onChange={e => onFormChange('beneficiario', e.target.value)} />
        </div>
      </div>
      <div className="ue-row">
        <div className="ue-field">
          <label className="ue-label">Fecha de Pago<span className="rm-req">*</span></label>
          <input className="ue-input" type="date" placeholder="dd/mm/aaaa" value={form.fechaPago} onChange={e => onFormChange('fechaPago', e.target.value)} />
        </div>
        <div className="ue-field">
          <label className="ue-label">Valor Total<span className="rm-req">*</span></label>
          <input className="ue-input" placeholder="$ 0" value={form.valorTotal} onChange={e => onFormChange('valorTotal', e.target.value)} />
        </div>
      </div>
      <div className="ue-row">
        <div className="ue-field">
          <label className="ue-label">Tipo de Pago<span className="rm-req">*</span></label>
          <select className="ue-input ue-select" value={form.tipoPago} onChange={e => onFormChange('tipoPago', e.target.value)}>
            <option value="Particular">Particular</option>
            <option value="Institucional">Institucional</option>
          </select>
        </div>
        <div className="ue-field">
          <label className="ue-label">Método de Pago<span className="rm-req">*</span></label>
          <select className="ue-input ue-select" value={form.metodoPago} onChange={e => onFormChange('metodoPago', e.target.value)}>
            {METODOS_PAGO.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
      </div>
      <div className="ue-field" style={{ gridColumn: '1 / -1' }}>
        <label className="ue-label">Concepto<span className="rm-req">*</span></label>
        <input className="ue-input" placeholder="Excedentes" value={form.concepto} onChange={e => onFormChange('concepto', e.target.value)} />
      </div>
      <div className="ue-field" style={{ gridColumn: '1 / -1' }}>
        <label className="ue-label">Referencia/Orden</label>
        <input className="ue-input" placeholder="Referencia u orden" value={form.referenciaOrden} onChange={e => onFormChange('referenciaOrden', e.target.value)} />
      </div>
      <div className="ue-field" style={{ gridColumn: '1 / -1' }}>
        <label className="ue-label">Observaciones</label>
        <textarea className="nm-textarea" rows={3} placeholder="Observaciones" value={form.observaciones} onChange={e => onFormChange('observaciones', e.target.value)} />
      </div>
    </div>
    <div className="resolucion-modal-footer" style={{ justifyContent: 'flex-end' }}>
      <div className="rm-footer-actions">
        <button className="rm-btn-cancel" onClick={onClose}>
          <X size={13} style={{ marginRight: 4 }} />
          Cancelar
        </button>
        <button className="rm-btn-primary" onClick={onSave}>
          <Save size={15} style={{ marginRight: 6 }} />
          {isEdit ? 'Actualizar Recibo' : 'Crear Recibo'}
        </button>
      </div>
    </div>
  </Modal>
);
