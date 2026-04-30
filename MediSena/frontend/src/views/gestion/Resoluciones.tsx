import React from 'react';
import {
  ArrowUpDown, Edit2, Trash2, Copy, Plus, RefreshCw,
  ChevronLeft, ChevronRight, Search, SlidersHorizontal,
  Paperclip, HelpCircle, X,
} from 'lucide-react';
import Filters from '../../components/Filters';
import api from '../../api/api';
import {
  Resolucion,
  REGIONALES,
} from './types';

/* ─── Forma vacía ────────────────────────────────────── */
export const EMPTY_RES_FORM = {
  tipo: 'VIGENTE',
  numero: '',
  fechaResolucion: '',
  inicioVigencia: '',
  finVigencia: '',
  regionales: [] as string[],
  descripcion: '',
};

// Alias exports for compatibility
export { ResolucionModal as EditResModal };
export { ResolucionModal as NewResModal };

/* ══════════════════════════════════════════════════════
   HOOKS / LÓGICA
   ══════════════════════════════════════════════════════ */
export function useResoluciones() {
  const [resoluciones, setResoluciones] = React.useState<Resolucion[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [errorStatus, setErrorStatus] = React.useState<string | null>(null);

  const fetchResoluciones = React.useCallback(async () => {
    setLoading(true);
    setErrorStatus(null);
    setResoluciones([]);
    try {
      const res = await api.get('/resoluciones');
      setResoluciones(res.data);
    } catch (err: any) {
      setErrorStatus(err.response?.data?.message || err.message || 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { fetchResoluciones(); }, [fetchResoluciones]);

  return { resoluciones, setResoluciones, loading, errorStatus };
}

/* ══════════════════════════════════════════════════════
   TABLA RESOLUCIONES
   ══════════════════════════════════════════════════════ */
interface ResolucionesTablaProps {
  items: Resolucion[];
  loading: boolean;
  errorStatus: string | null;
  onEdit: (r: Resolucion) => void;
  onDelete: (r: Resolucion) => void;
}

export const ResolucionesTabla: React.FC<ResolucionesTablaProps> = ({
  items, loading, errorStatus, onEdit, onDelete,
}) => {
  if (loading) return <tr><td colSpan={6} className="table-empty">Cargando datos...</td></tr>;
  if (errorStatus) return (
    <tr><td colSpan={6} className="table-empty">
      <p style={{ color: '#e11d48', fontWeight: 700 }}>⚠️ {errorStatus}</p>
    </td></tr>
  );
  if (items.length === 0) return <tr><td colSpan={6} className="table-empty">No se encontraron resultados.</td></tr>;

  return (
    <>
      {items.map(res => (
        <tr key={res.id}>
          <td className="col-numero">{res.numero}</td>
          <td className="col-fecha">{res.fecha}</td>
          <td><div className="desc-with-icon">{res.descripcion}<Copy size={15} className="copy-icon" /></div></td>
          <td>
            <span className={`status-badge ${res.estado.toLowerCase()}`}>
              <div className={`status-dot ${res.estado.toLowerCase()}`}></div>
              {res.estado}
            </span>
          </td>
          <td className="col-vigencia">{res.vigencia}</td>
          <td>
            <div className="row-actions">
              <button className="icon-btn edit" onClick={() => onEdit(res)}><Edit2 size={16} /></button>
              <button className="icon-btn delete" onClick={() => onDelete(res)}><Trash2 size={16} /></button>
            </div>
          </td>
        </tr>
      ))}
    </>
  );
};

/* ══════════════════════════════════════════════════════
   TOOLBAR RESOLUCIONES
   ══════════════════════════════════════════════════════ */
interface ResolucionesToolbarProps {
  statusFilter: string;
  onStatusChange: (v: string) => void;
  onNew: () => void;
}

export const ResolucionesToolbar: React.FC<ResolucionesToolbarProps> = ({
  statusFilter, onStatusChange, onNew,
}) => (
  <div className="content-toolbar">
    <Filters>
      <select className="stat-select" style={{ minWidth: '150px' }} value={statusFilter} onChange={e => onStatusChange(e.target.value)}>
        <option value="" disabled hidden>Estado</option>
        <option value="">Todos</option>
        <option value="Vigente">Vigente</option>
        <option value="Vencido">Vencido</option>
      </select>
      <select className="stat-select" style={{ minWidth: '150px' }} defaultValue="">
        <option value="" disabled hidden>Regional</option>
        <option value="">Todas</option>
        <option value="Regional 1">Regional 1</option>
        <option value="Regional 2">Regional 2</option>
      </select>
    </Filters>
    <div className="usuarios-toolbar-right">
      <button className="btn-actualizar">
        <RefreshCw size={14} />
        Actualizar
      </button>
      <button className="btn-new-resolution" onClick={onNew}>
        <Plus size={18} />
        Nueva Resolución
      </button>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════
   THEAD RESOLUCIONES
   ══════════════════════════════════════════════════════ */
export const ResolucionesHead: React.FC = () => (
  <tr>
    <th>N° <ArrowUpDown size={13} className="sort-icon" /></th>
    <th>FECHA <ArrowUpDown size={13} className="sort-icon" /></th>
    <th>DESCRIPCIÓN</th>
    <th>ESTADO</th>
    <th>VIGENCIA</th>
    <th></th>
  </tr>
);

/* ══════════════════════════════════════════════════════
   MODAL CREAR / EDITAR RESOLUCIÓN
   ══════════════════════════════════════════════════════ */
interface ResolucionModalProps {
  isEdit: boolean;
  form: typeof EMPTY_RES_FORM;
  formErrors: Record<string, string>;
  regSearch: string;
  onRegSearch: (v: string) => void;
  onToggleRegional: (r: string) => void;
  onFormChange: (field: string, value: string) => void;
  onClose: () => void;
  onCreate: () => void;
  onUpdate: () => void;
}

export const ResolucionModal: React.FC<ResolucionModalProps> = ({
  isEdit, form, formErrors, regSearch, onRegSearch,
  onToggleRegional, onFormChange, onClose, onCreate, onUpdate,
}) => {
  const filtered = REGIONALES.filter(r => r.toLowerCase().includes(regSearch.toLowerCase()));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="resolucion-modal">
        <div className="resolucion-modal-header">
          <h2 className="resolucion-modal-title">{isEdit ? 'Editar resolución' : 'Crear resolución'}</h2>
          <button className="resolucion-modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="resolucion-modal-body">
          <div className="rm-row rm-row-3">
            <div className="rm-field">
              <label className="rm-label">Tipo de resolución <HelpCircle size={13} className="rm-help" /></label>
              <select className="rm-select" value={form.tipo} onChange={e => onFormChange('tipo', e.target.value)}>
                <option value="VIGENTE">VIGENTE</option>
                <option value="VENCIDO">VENCIDO</option>
              </select>
            </div>
            <div className="rm-field">
              <label className="rm-label">N° de resolución <HelpCircle size={13} className="rm-help" /></label>
              <div className={`rm-select-wrapper ${formErrors.numero ? 'rm-error' : ''}`}>
                <input className="rm-input-plain" placeholder="Ej: 824" value={form.numero} onChange={e => onFormChange('numero', e.target.value)} />
                <span className="rm-select-arrow">▾</span>
              </div>
            </div>
            <div className="rm-field">
              <label className="rm-label">Fecha de resolución <HelpCircle size={13} className="rm-help" /></label>
              <div className={`rm-date-wrapper ${formErrors.fechaResolucion ? 'rm-error' : ''}`}>
                <input type="date" className="rm-date-input" value={form.fechaResolucion} onChange={e => onFormChange('fechaResolucion', e.target.value)} />
              </div>
            </div>
          </div>
          <div className="rm-row rm-row-2">
            <div className="rm-field">
              <label className="rm-label">Inicio de la vigencia <HelpCircle size={13} className="rm-help" /></label>
              <div className={`rm-date-wrapper ${formErrors.inicioVigencia ? 'rm-error' : ''}`}>
                <input type="date" className="rm-date-input" value={form.inicioVigencia} onChange={e => onFormChange('inicioVigencia', e.target.value)} />
              </div>
            </div>
            <div className="rm-field">
              <label className="rm-label">Fin de la vigencia <HelpCircle size={13} className="rm-help" /></label>
              <div className={`rm-date-wrapper ${formErrors.finVigencia ? 'rm-error' : ''}`}>
                <input type="date" className="rm-date-input" value={form.finVigencia} onChange={e => onFormChange('finVigencia', e.target.value)} />
              </div>
            </div>
          </div>
          <div className="rm-field rm-field-full">
            <label className="rm-label">Regional <HelpCircle size={13} className="rm-help" /></label>
            <div className="rm-regional-box">
              <div className="rm-regional-search">
                <Search size={14} className="rm-search-icon" />
                <input className="rm-search-input" value={regSearch} onChange={e => onRegSearch(e.target.value)} />
                <SlidersHorizontal size={14} className="rm-filter-icon" />
              </div>
              <div className="rm-regional-list">
                {filtered.map(r => {
                  const checked = form.regionales.includes(r);
                  return (
                    <label key={r} className={`rm-regional-item ${checked ? 'checked' : ''}`}>
                      <input type="checkbox" className="rm-checkbox" checked={checked} onChange={() => onToggleRegional(r)} />
                      <span className="rm-regional-name">{r}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="rm-field rm-field-full">
            <label className="rm-label">Descripción de la resolución <HelpCircle size={13} className="rm-help" /></label>
            <textarea className="rm-textarea" placeholder="Resolución 824 – Vigencia del 2026" rows={4} value={form.descripcion} onChange={e => onFormChange('descripcion', e.target.value)} />
          </div>
        </div>
        <div className="resolucion-modal-footer">
          <button className="rm-btn-attach"><Paperclip size={16} /></button>
          <div className="rm-footer-actions">
            <button className="rm-btn-cancel" onClick={onClose}>Cancelar</button>
            {isEdit
              ? <button className="rm-btn-primary" onClick={onUpdate}>Actualizar resolución</button>
              : <button className="rm-btn-primary" onClick={onCreate}>Crear resolución</button>
            }
          </div>
        </div>
      </div>
    </div>
  );
};
