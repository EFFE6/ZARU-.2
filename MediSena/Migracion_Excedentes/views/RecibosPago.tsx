import React from 'react';
import {
  DollarSign, Edit2, Printer, Ban, Plus, RefreshCw,
  Search, X, Save, HelpCircle, AlertTriangle,
  ChevronDown
} from 'lucide-react';
import Modal from '../../components/Modal';
import { OJOIcon, EditIcon } from '../../components/Icons';
import {
  ReciboPago, ESTADOS_RECIBO, TIPOS_PAGO_EXC, METODOS_PAGO, FUNCIONARIOS_EXC,
} from './types';

/* ─── Tipos y Constantes ─── */
// Removido EMPTY_RECIBO_FORM (movido a types.ts)

/* ══════════════════════════════════════════════════════
   TARJETAS DE TOTALES (Total Pagado, Pendiente, Recibos)
   ══════════════════════════════════════════════════════ */
interface TotalesProps {
  totalPagado: string;
  totalPendiente: string;
  totalRecibos: number;
}

export const RecibosTotalesCards: React.FC<TotalesProps> = () => null;

/* ══════════════════════════════════════════════════════
   TOOLBAR – Recibos de Pago
   ══════════════════════════════════════════════════════ */
interface ToolbarProps {
  estado: string;
  tipoPago: string;
  error: string | null;
  onEstadoChange: (v: string) => void;
  onTipoPagoChange: (v: string) => void;
  onRefresh: () => void;
  onNew: () => void;
}

export const RecibosToolbar: React.FC<ToolbarProps> = ({
  estado, tipoPago, error,
  onEstadoChange, onTipoPagoChange, onRefresh, onNew,
}) => (
  <div className="exc-toolbar-row">
    {error && (
      <div className="exc-error-banner" style={{ width: '100%', marginBottom: 16 }}>
        <span className="exc-error-dot">⊘</span>
        {error}
      </div>
    )}

    <div className="exc-toolbar-filters">
      <div className="exc-select-wrap">
        <select className="exc-filter-select" value={estado} onChange={e => onEstadoChange(e.target.value)}>
          {ESTADOS_RECIBO.map(o => <option key={o}>{o}</option>)}
        </select>
        <ChevronDown size={14} className="exc-select-icon" />
      </div>

      <div className="exc-select-wrap">
        <select className="exc-filter-select" value={tipoPago} onChange={e => onTipoPagoChange(e.target.value)}>
          {TIPOS_PAGO_EXC.map(o => <option key={o}>{o}</option>)}
        </select>
        <ChevronDown size={14} className="exc-select-icon" />
      </div>
    </div>

    <div className="exc-toolbar-actions">
      <button className="exc-btn-outline" onClick={onRefresh}>
        <RefreshCw size={14} /> Actualizar
      </button>
      <button className="exc-btn-primary" onClick={onNew}>
        <Plus size={16} /> Nuevo recibo
      </button>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════
   THEAD
   ══════════════════════════════════════════════════════ */
export const RecibosHead: React.FC = () => (
  <tr>
    <th>NÚMERO RECIBO</th>
    <th>FUNCIONARIO</th>
    <th>BENEFICIARIO</th>
    <th>FECHA PAGO</th>
    <th>VALOR TOTAL</th>
    <th>TIPO DE PAGO</th>
    <th>ESTADO</th>
    <th>MÉTODO</th>
    <th></th>
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
          <td style={{ color: '#64748b' }}>{r.numeroRecibo}</td>
          <td className="bold">
            <div className="exc-multiline-text">
              {r.funcionario.toUpperCase().split('\n').map((line, idx) => (
                <div key={idx}>{line}</div>
              ))}
            </div>
          </td>
          <td className="bold">
            <div className="exc-multiline-text">
              {r.beneficiario ? r.beneficiario.toUpperCase().split('\n').map((line, idx) => (
                <div key={idx}>{line}</div>
              )) : '—'}
            </div>
          </td>
          <td style={{ color: '#64748b' }}>{r.fechaPago}</td>
          <td className="bold">
            {typeof r.valorTotal === 'string' && r.valorTotal.startsWith('$') 
              ? r.valorTotal 
              : `$ ${Number(r.valorTotal).toLocaleString('es-CO')}`}
          </td>
          <td>
            <span className={`exc-pill-badge exc-pill-tipo-${(r.tipoPago || '').toLowerCase()}`}>
              {r.tipoPago}
            </span>
          </td>
          <td>
            <span className={`exc-pill-badge exc-pill-estado-${(r.estado || '').toLowerCase()}`}>
              {r.estado}
            </span>
          </td>
          <td>
            <span className={`exc-pill-badge exc-pill-metodo-${(r.metodoPago || '').toLowerCase()}`}>
              {r.metodoPago}
            </span>
          </td>
          <td>
            <div className="exc-actions-cell">
              <button className="exc-action-circle-btn" onClick={() => onView(r)}>
                <OJOIcon size={28} />
              </button>
              <button className="exc-action-circle-btn" onClick={() => onEdit(r)}>
                <EditIcon size={28} />
              </button>
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
  onEdit?: (r: ReciboPago) => void;
}

export const ReciboDetallesModal: React.FC<DetallesProps> = ({ recibo, onClose, onEdit }) => (
  <Modal isOpen={true} onClose={onClose} hideHeader className="exc-modal-detalles-final">
    <div className="exc-modal-header">
      <h2 className="exc-modal-title">Detalles del Recibo de Pago</h2>
      <button className="exc-modal-close" onClick={onClose}><X size={20} /></button>
    </div>

    <div className="exc-detalles-body-premium">
      <div className="exc-detalles-grid-premium">
        <div className="exc-det-field-premium">
          <span className="exc-det-label-premium">Número de recibo</span>
          <span className="exc-det-value-premium">{recibo.numeroRecibo}</span>
        </div>
        <div className="exc-det-field-premium">
          <span className="exc-det-label-premium">Estado</span>
          <span className="exc-det-badge-premium exc-badge-pendiente-final">{recibo.estado}</span>
        </div>
        <div className="exc-det-field-premium">
          <span className="exc-det-label-premium">Funcionario</span>
          <span className="exc-det-value-premium">{recibo.funcionario.replace('\n', ' ')}</span>
        </div>
        <div className="exc-det-field-premium">
          <span className="exc-det-label-premium">Valor total</span>
          <span className="exc-det-value-premium">{recibo.valorTotal}</span>
        </div>
        <div className="exc-det-field-premium">
          <span className="exc-det-label-premium">Beneficiario</span>
          <span className="exc-det-value-premium">{recibo.beneficiario || 'N/A'}</span>
        </div>
        <div className="exc-det-field-premium">
          <span className="exc-det-label-premium">Concepto</span>
          <span className="exc-det-value-premium">{recibo.concepto}</span>
        </div>
        <div className="exc-det-field-premium">
          <span className="exc-det-label-premium">Tipo de pago</span>
          <span className="exc-det-badge-premium exc-badge-particular-final">{recibo.tipoPago}</span>
        </div>
        <div className="exc-det-field-premium">
          <span className="exc-det-label-premium">Método de pago</span>
          <span className="exc-det-badge-premium exc-badge-transferencia-final">{recibo.metodoPago}</span>
        </div>
        <div className="exc-det-field-premium">
          <span className="exc-det-label-premium">Fecha de pago</span>
          <span className="exc-det-value-premium">{recibo.fechaPago || '17 FEB 2026'}</span>
        </div>
      </div>
    </div>

    <div className="exc-modal-footer">
      <button className="exc-btn-cancel-premium" onClick={onClose}>Cancelar</button>
      <button className="exc-btn-update-final" onClick={() => onEdit?.(recibo)}>
        <Save size={18} /> Actualizar recibo
      </button>
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
  <Modal isOpen={true} onClose={onClose} hideHeader className="exc-modal-editar-final">
    <div className="exc-modal-header">
      <h2 className="exc-modal-title">{isEdit ? 'Editar Recibo de pago' : 'Nuevo Recibo de pago'}</h2>
      <button className="exc-modal-close" onClick={onClose}><X size={20} /></button>
    </div>

    <div className="exc-modal-body">
      <div className="exc-form-grid">
        <div className="exc-field">
          <label className="exc-label-premium">Funcionario<span className="exc-req">*</span></label>
          <select className="exc-input-premium" value={form.funcionario} onChange={e => onFormChange('funcionario', e.target.value)}>
            <option value="">Calixto Montanez Efrain</option>
            {FUNCIONARIOS_EXC.map(f => <option key={f}>{f}</option>)}
          </select>
        </div>
        <div className="exc-field">
          <label className="exc-label-premium">Beneficiario<span className="exc-req">*</span></label>
          <select className="exc-input-premium" value={form.beneficiario} onChange={e => onFormChange('beneficiario', e.target.value)}>
             <option value="">0</option>
          </select>
        </div>

        <div className="exc-field">
          <label className="exc-label-premium">Fecha de pago<span className="exc-req">*</span></label>
          <input className="exc-input-premium" type="date" value={form.fechaPago} onChange={e => onFormChange('fechaPago', e.target.value)} />
        </div>
        <div className="exc-field">
          <label className="exc-label-premium">Valor total<span className="exc-req">*</span></label>
          <input className="exc-input-premium" placeholder="0" value={form.valorTotal} onChange={e => onFormChange('valorTotal', e.target.value)} />
        </div>

        <div className="exc-field">
          <label className="exc-label-premium">Tipo de pago<span className="exc-req">*</span></label>
          <select className="exc-input-premium" value={form.tipoPago} onChange={e => onFormChange('tipoPago', e.target.value)}>
            <option value="Particular">Particular</option>
            <option value="Institucional">Institucional</option>
          </select>
        </div>
        <div className="exc-field">
          <label className="exc-label-premium">Método de pago<span className="exc-req">*</span></label>
          <select className="exc-input-premium" value={form.metodoPago} onChange={e => onFormChange('metodoPago', e.target.value)}>
            {METODOS_PAGO.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>

        <div className="exc-field">
          <label className="exc-label-premium">Concepto<span className="exc-req">*</span></label>
          <input className="exc-input-premium" placeholder="Excedentes" value={form.concepto} onChange={e => onFormChange('concepto', e.target.value)} />
        </div>
        <div className="exc-field">
          <label className="exc-label-premium">Referencia/Orden</label>
          <input className="exc-input-premium" placeholder="Digite el número de 10 dígitos de su factura" value={form.referenciaOrden} onChange={e => onFormChange('referenciaOrden', e.target.value)} />
        </div>

        <div className="exc-field-full">
          <label className="exc-label-premium">Observaciones</label>
          <textarea 
            className="exc-textarea-premium" 
            rows={3} 
            placeholder="Escribe acá comentarios adicionales sobre este recibo" 
            value={form.observaciones} 
            onChange={e => onFormChange('observaciones', e.target.value)} 
          />
        </div>
      </div>
    </div>

    <div className="exc-modal-footer">
      <button className="exc-btn-cancel-premium" onClick={onClose}>Cancelar</button>
      <button className="exc-btn-update-final" onClick={onSave}>
        <Save size={18} /> Actualizar recibo
      </button>
    </div>
  </Modal>
);
