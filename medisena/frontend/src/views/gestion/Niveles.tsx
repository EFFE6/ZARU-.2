import React from 'react';
import {
  ArrowUpDown, Edit2, Trash2, HelpCircle, Plus, Save, X,
} from 'lucide-react';
import { Nivel, nivelColor, TIPOS_BENEFICIARIO, NIVELES_OPTS } from './types';

/* ─── Forma vacía ──────────────────────────────────── */
export const EMPTY_NIVEL_FORM = {
  tipoBeneficiario: 'Todos los beneficiarios',
  nivel: 'Nivel 1',
  topeMaximo: '',
  periodo: '',
  descripcion: '',
};

/* ══════════════════════════════════════════════════════
   TOOLBAR
   ══════════════════════════════════════════════════════ */
export const NivelesToolbar: React.FC<{ onNew: () => void }> = ({ onNew }) => (
  <div className="content-toolbar">
    <p className="tab-description">Configure los niveles y topes máximos para beneficiarios</p>
    <button className="btn-new-resolution" onClick={onNew}>
      <Plus size={16} />
      Nuevo Nivel
    </button>
  </div>
);

/* ══════════════════════════════════════════════════════
   THEAD
   ══════════════════════════════════════════════════════ */
export const NivelesHead: React.FC = () => (
  <tr>
    <th>TIPO BENEFICIARIO <ArrowUpDown size={13} className="sort-icon" /></th>
    <th>NIVEL</th>
    <th>TOPE MÁXIMO <ArrowUpDown size={13} className="sort-icon" /></th>
    <th>DESCRIPCIÓN</th>
    <th>PERIODO</th>
    <th>ESTADO</th>
    <th></th>
  </tr>
);

/* ══════════════════════════════════════════════════════
   TABLA NIVELES
   ══════════════════════════════════════════════════════ */
interface NivelesTablaProps {
  items: Nivel[];
  loading: boolean;
  onEdit: (n: Nivel) => void;
  onDelete: (n: Nivel) => void;
}

export const NivelesTabla: React.FC<NivelesTablaProps> = ({ items, loading, onEdit, onDelete }) => {
  if (loading) return <tr><td colSpan={7} className="table-empty">Cargando datos...</td></tr>;
  if (items.length === 0) return <tr><td colSpan={7} className="table-empty">No se encontraron resultados.</td></tr>;

  return (
    <>
      {items.map(n => (
        <tr key={n.id}>
          <td className="col-tipo-benef">{n.tipoBeneficiario}</td>
          <td>
            <span className="nivel-badge" style={{ color: nivelColor(n.nivel) }}>
              <span className="nivel-dot" style={{ background: nivelColor(n.nivel) }}></span>
              {n.nivel}
            </span>
          </td>
          <td className="col-tope">{n.topeMaximo}</td>
          <td className="col-desc-nivel">{n.descripcion}</td>
          <td className="col-periodo">{n.periodo}</td>
          <td>
            <span className="status-badge vigente">
              <div className="status-dot vigente"></div>
              {n.estado}
            </span>
          </td>
          <td>
            <div className="row-actions">
              <button className="icon-btn edit" onClick={() => onEdit(n)}><Edit2 size={15} /></button>
              <button className="icon-btn delete" onClick={() => onDelete(n)}><Trash2 size={15} /></button>
            </div>
          </td>
        </tr>
      ))}
    </>
  );
};

/* ══════════════════════════════════════════════════════
   MODAL EDITAR NIVEL
   ══════════════════════════════════════════════════════ */
interface EditNivelModalProps {
  form: typeof EMPTY_NIVEL_FORM;
  onFormChange: (field: string, value: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export const EditNivelModal: React.FC<EditNivelModalProps> = ({ form, onFormChange, onClose, onSave }) => (
  <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
    <div className="resolucion-modal user-edit-modal">
      <div className="resolucion-modal-header">
        <h2 className="resolucion-modal-title">Editar Nivel</h2>
        <button className="resolucion-modal-close" onClick={onClose}><X size={18} /></button>
      </div>
      <div className="resolucion-modal-body user-edit-body">
        <div className="ue-row">
          <div className="ue-field">
            <label className="ue-label">Tipo de Beneficiario<span className="rm-req">*</span> <HelpCircle size={13} className="rm-help" /></label>
            <select className="ue-input ue-select" value={form.tipoBeneficiario} onChange={e => onFormChange('tipoBeneficiario', e.target.value)}>
              {TIPOS_BENEFICIARIO.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="ue-field">
            <label className="ue-label">Nivel<span className="rm-req">*</span> <HelpCircle size={13} className="rm-help" /></label>
            <select className="ue-input ue-select" value={form.nivel} onChange={e => onFormChange('nivel', e.target.value)}>
              {NIVELES_OPTS.map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
        </div>
        <div className="ue-row">
          <div className="ue-field">
            <label className="ue-label">Tope Máximo ($)<span className="rm-req">*</span> <HelpCircle size={13} className="rm-help" /></label>
            <input className="ue-input" placeholder="$ 1.000.000" value={form.topeMaximo} onChange={e => onFormChange('topeMaximo', e.target.value)} />
          </div>
          <div className="ue-field">
            <label className="ue-label">Periodo de Vigencia<span className="rm-req">*</span> <HelpCircle size={13} className="rm-help" /></label>
            <input className="ue-input" placeholder="2024 - 2025" value={form.periodo} onChange={e => onFormChange('periodo', e.target.value)} />
          </div>
        </div>
        <div className="ue-field" style={{ gridColumn: '1 / -1' }}>
          <label className="ue-label">Descripción<span className="rm-req">*</span> <HelpCircle size={13} className="rm-help" /></label>
          <textarea
            className="nm-textarea"
            placeholder="Nivel 1 de atención médica"
            rows={4}
            value={form.descripcion}
            onChange={e => onFormChange('descripcion', e.target.value)}
          />
        </div>
      </div>
      <div className="resolucion-modal-footer" style={{ justifyContent: 'flex-end' }}>
        <div className="rm-footer-actions">
          <button className="rm-btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="rm-btn-primary" onClick={onSave}>
            <Save size={15} style={{ marginRight: 6 }} />
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════
   MODAL NUEVO NIVEL
   ══════════════════════════════════════════════════════ */
export const NewNivelModal: React.FC<EditNivelModalProps> = ({ form, onFormChange, onClose, onSave }) => (
  <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
    <div className="resolucion-modal user-edit-modal">
      <div className="resolucion-modal-header">
        <h2 className="resolucion-modal-title">Nuevo Nivel</h2>
        <button className="resolucion-modal-close" onClick={onClose}><X size={18} /></button>
      </div>
      <div className="resolucion-modal-body user-edit-body">
        <div className="ue-row">
          <div className="ue-field">
            <label className="ue-label">Tipo de Beneficiario<span className="rm-req">*</span> <HelpCircle size={13} className="rm-help" /></label>
            <select className="ue-input ue-select" value={form.tipoBeneficiario} onChange={e => onFormChange('tipoBeneficiario', e.target.value)}>
              {TIPOS_BENEFICIARIO.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="ue-field">
            <label className="ue-label">Nivel<span className="rm-req">*</span> <HelpCircle size={13} className="rm-help" /></label>
            <select className="ue-input ue-select" value={form.nivel} onChange={e => onFormChange('nivel', e.target.value)}>
              {NIVELES_OPTS.map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
        </div>
        <div className="ue-row">
          <div className="ue-field">
            <label className="ue-label">Tope Máximo ($)<span className="rm-req">*</span> <HelpCircle size={13} className="rm-help" /></label>
            <input className="ue-input" placeholder="$ 1.000.000" value={form.topeMaximo} onChange={e => onFormChange('topeMaximo', e.target.value)} />
          </div>
          <div className="ue-field">
            <label className="ue-label">Periodo de Vigencia<span className="rm-req">*</span> <HelpCircle size={13} className="rm-help" /></label>
            <input className="ue-input" placeholder="2024 - 2025" value={form.periodo} onChange={e => onFormChange('periodo', e.target.value)} />
          </div>
        </div>
        <div className="ue-field" style={{ gridColumn: '1 / -1' }}>
          <label className="ue-label">Descripción<span className="rm-req">*</span> <HelpCircle size={13} className="rm-help" /></label>
          <textarea
            className="nm-textarea"
            placeholder="Nivel 1 de atención médica"
            rows={4}
            value={form.descripcion}
            onChange={e => onFormChange('descripcion', e.target.value)}
          />
        </div>
      </div>
      <div className="resolucion-modal-footer" style={{ justifyContent: 'flex-end' }}>
        <div className="rm-footer-actions">
          <button className="rm-btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="rm-btn-primary" onClick={onSave}>
            <Save size={15} style={{ marginRight: 6 }} />
            Crear Nivel
          </button>
        </div>
      </div>
    </div>
  </div>
);
