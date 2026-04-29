import React from 'react';
import { Edit2, Trash2, Plus, X, HelpCircle, Save } from 'lucide-react';
import { Parentesco } from './types';

/* ─── Forma vacía ──────────────────────────────────── */
export const EMPTY_PARENTESCO_FORM = {
  nombre: '',
  descripcion: '',
  ambito: '',
};

/* ══════════════════════════════════════════════════════
   TOOLBAR
   ══════════════════════════════════════════════════════ */
export const ParentescosToolbar: React.FC<{ onNew: () => void }> = ({ onNew }) => (
  <div className="content-toolbar">
    <p className="tab-description">Configura los tipos de parentescos para los beneficiarios.</p>
    <button className="btn-new-resolution" onClick={onNew}>
      <Plus size={16} />
      Nuevo Parentesco
    </button>
  </div>
);

/* ══════════════════════════════════════════════════════
   LISTA PARENTESCOS (diseño card)
   ══════════════════════════════════════════════════════ */
interface ParentescosListaProps {
  items: Parentesco[];
  loading: boolean;
  onEdit: (p: Parentesco) => void;
  onDelete: (p: Parentesco) => void;
}

export const ParentescosLista: React.FC<ParentescosListaProps> = ({ items, loading, onEdit, onDelete }) => {
  if (loading) return <div className="table-empty">Cargando datos...</div>;
  if (items.length === 0) return <div className="table-empty">No se encontraron resultados.</div>;

  return (
    <div className="parentescos-list">
      {items.map(p => (
        <div className="parentesco-card" key={p.id}>
          <div className="par-left">
            <div className="par-number">{String(p.orden).padStart(2, '0')}</div>
            <div className="par-name">{p.nombre}</div>
          </div>
          <div className="par-right">
            <div className="par-pill-nacional">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
              {p.tipo}
            </div>
            <div className="par-pill-activo">
              <div className="status-dot vigente"></div>
              {p.activo ? 'Activo' : 'Inactivo'}
            </div>
            <button className="icon-btn edit" onClick={() => onEdit(p)}><Edit2 size={15} /></button>
            <button className="icon-btn delete" onClick={() => onDelete(p)}><Trash2 size={15} /></button>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   MODAL EDITAR PARENTESCO
   ══════════════════════════════════════════════════════ */
interface EditParentescoModalProps {
  isEdit?: boolean;
  form: typeof EMPTY_PARENTESCO_FORM;
  onFormChange: (field: string, value: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export const EditParentescoModal: React.FC<EditParentescoModalProps> = ({
  isEdit = true, form, onFormChange, onClose, onSave,
}) => (
  <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
    <div className="resolucion-modal user-edit-modal">
      <div className="resolucion-modal-header">
        <h2 className="resolucion-modal-title">{isEdit ? 'Editar' : 'Nuevo'} Parentesco</h2>
        <button className="resolucion-modal-close" onClick={onClose}><X size={18} /></button>
      </div>
      <div className="resolucion-modal-body user-edit-body">
        <div className="ue-field">
          <label className="ue-label">Nombre <HelpCircle size={13} className="rm-help" /></label>
          <input className="ue-input" placeholder="Madre-Padre" value={form.nombre} onChange={e => onFormChange('nombre', e.target.value)} />
        </div>
        <div className="ue-field">
          <label className="ue-label">Descripción <HelpCircle size={13} className="rm-help" /></label>
          <input className="ue-input" placeholder="Madre-Padre" value={form.descripcion} onChange={e => onFormChange('descripcion', e.target.value)} />
        </div>
        <div className="ue-field">
          <label className="ue-label">Ámbito <HelpCircle size={13} className="rm-help" /></label>
          <input className="ue-input" placeholder="Nacional" value={form.ambito} onChange={e => onFormChange('ambito', e.target.value)} />
        </div>
      </div>
      <div className="resolucion-modal-footer" style={{ justifyContent: 'flex-end', borderTop: 'none' }}>
        <div className="rm-footer-actions">
          <button className="rm-btn-cancel" onClick={onClose} style={{ minWidth: '100px' }}>Cancelar</button>
          <button className="rm-btn-primary" onClick={onSave} style={{ minWidth: '160px' }}>
            <Save size={15} />
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL (DEFAULT EXPORT)
   ══════════════════════════════════════════════════════ */
export default function Parentescos() {
  const [items, setItems] = React.useState<Parentesco[]>([
    { id: 1, orden: 1, nombre: 'Madre-Padre', tipo: 'Nacional', activo: true },
    { id: 2, orden: 2, nombre: 'Cónyuge', tipo: 'Nacional', activo: true },
    { id: 3, orden: 3, nombre: 'Hijo', tipo: 'Nacional', activo: true },
    { id: 4, orden: 4, nombre: 'Hermano', tipo: 'Nacional', activo: true },
    { id: 5, orden: 5, nombre: 'Hijos entenados', tipo: 'Nacional', activo: true },
    { id: 6, orden: 6, nombre: 'Otros', tipo: 'Nacional', activo: true },
  ]);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [form, setForm] = React.useState(EMPTY_PARENTESCO_FORM);
  const [editingId, setEditingId] = React.useState<number | null>(null);

  const handleNew = () => {
    setForm(EMPTY_PARENTESCO_FORM);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleEdit = (p: Parentesco) => {
    setForm({ nombre: p.nombre, descripcion: p.nombre, ambito: p.tipo });
    setEditingId(p.id);
    setIsModalOpen(true);
  };

  const handleDelete = (p: Parentesco) => {
    if (confirm(`¿Eliminar parentesco ${p.nombre}?`)) {
      setItems(prev => prev.filter(item => item.id !== p.id));
    }
  };

  const handleSave = () => {
    if (editingId) {
      setItems(prev => prev.map(item => item.id === editingId ? { ...item, nombre: form.nombre, tipo: form.ambito || 'Nacional' } : item));
    } else {
      const newId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
      setItems(prev => [...prev, { id: newId, orden: newId, nombre: form.nombre, tipo: form.ambito || 'Nacional', activo: true }]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="gestion-content-card">
      <ParentescosToolbar onNew={handleNew} />
      <ParentescosLista items={items} loading={false} onEdit={handleEdit} onDelete={handleDelete} />
      {isModalOpen && (
        <EditParentescoModal
          isEdit={!!editingId}
          form={form}
          onFormChange={(field, value) => setForm(prev => ({ ...prev, [field]: value }))}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
