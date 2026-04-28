import React from 'react';
import {
  ArrowUpDown, Edit2, Trash2, Eye, KeyRound,
  Plus, RefreshCw, X, Building2,
  HelpCircle, Info, Save,
} from 'lucide-react';
import api from '../../api/api';
import { UsuarioExtended, REGIONALES, ROLES } from './types';

/* ─── Formularios vacíos ──── */
export const EMPTY_USER_FORM = {
  nombre: '',
  username: '',
  rol: '',
  regional: '',
  email: '',
  telefono: '',
};

/* ══════════════════════════════════════════════════════
   TOOLBAR USUARIOS
   ══════════════════════════════════════════════════════ */
interface UsuariosToolbarProps {
  statusFilter: string;
  activeFilterTag: string;
  onStatusChange: (v: string) => void;
  onTagChange: (v: string) => void;
  onNew?: () => void;
}

export const UsuariosToolbar: React.FC<UsuariosToolbarProps> = ({
  statusFilter, activeFilterTag, onStatusChange, onTagChange, onNew,
}) => (
  <div className="content-toolbar">
    <div className="usuarios-filters">
      <select className="stat-select" value={statusFilter} onChange={e => onStatusChange(e.target.value)}>
        <option value="">Seleccionar estado</option>
        <option value="Activo">Activo</option>
        <option value="Inactivo">Inactivo</option>
      </select>
      <select className="stat-select" value={activeFilterTag} onChange={e => onTagChange(e.target.value)}>
        <option value="">Filtrar por etiqueta</option>
        <option value="Activo">Solo Activos</option>
        <option value="Inactivo">Solo Inactivos</option>
      </select>
      {activeFilterTag && (
        <div className="filter-tag">
          {activeFilterTag}
          <button onClick={() => onTagChange('')}><X size={12} /></button>
        </div>
      )}
    </div>
    <div className="usuarios-toolbar-right">
      <button className="btn-actualizar">
        <RefreshCw size={14} />
        Actualizar
      </button>
      <button className="btn-new-resolution" onClick={onNew}>
        <Plus size={16} />
        Nuevo Usuario
      </button>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════
   THEAD USUARIOS
   ══════════════════════════════════════════════════════ */
export const UsuariosHead: React.FC = () => (
  <tr>
    <th>USUARIO Y EMAIL <ArrowUpDown size={13} className="sort-icon" /></th>
    <th>ROL</th>
    <th>REGIONAL</th>
    <th>ÚLT. ACCESO</th>
    <th>ESTADO</th>
    <th></th>
  </tr>
);

/* ══════════════════════════════════════════════════════
   TABLA USUARIOS
   ══════════════════════════════════════════════════════ */
interface UsuariosTablaProps {
  items: UsuarioExtended[];
  loading: boolean;
  tooltip: { id: number; text: string } | null;
  onTooltip: (v: { id: number; text: string } | null) => void;
  onToggleActive: (id: number) => void;
  onEdit: (u: UsuarioExtended) => void;
  onResetPwd: (u: UsuarioExtended) => void;
  onView: (u: UsuarioExtended) => void;
}

export const UsuariosTabla: React.FC<UsuariosTablaProps> = ({
  items, loading, tooltip, onTooltip, onToggleActive, onEdit, onResetPwd, onView,
}) => {
  if (loading) return <tr><td colSpan={6} className="table-empty">Cargando datos...</td></tr>;
  if (items.length === 0) return <tr><td colSpan={6} className="table-empty">No se encontraron resultados.</td></tr>;

  return (
    <>
      {items.map(user => {
        const isLongRegional = user.regional.length > 10;
        const shortRegional = isLongRegional
          ? user.regional.split(' - ')[0] + ' - ' + user.regional.split(' - ')[1]?.slice(0, 12) + '...'
          : user.regional;

        return (
          <tr key={user.id}>
            <td>
              <div className="user-cell">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.nombre)}&background=0D8ABC&color=fff&rounded=true`}
                  alt={user.nombre}
                  className="user-avatar"
                  style={{ border: 'none' }}
                />
                <div className="user-info">
                  <span className="user-name">{user.nombre}</span>
                  <span className="user-email">{user.email}</span>
                </div>
              </div>
            </td>
            <td>
              <span className={`rol-badge ${user.rol === 'Administrador' ? 'admin' : 'usuario'}`}>
                {user.rol === 'Administrador'
                  ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                  : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                }
                {user.rol}
              </span>
            </td>
            <td>
              <div
                className={`regional-tag ${isLongRegional ? 'has-remove' : ''}`}
                onMouseEnter={() => isLongRegional && onTooltip({ id: user.id, text: user.regional })}
                onMouseLeave={() => onTooltip(null)}
                style={{ position: 'relative' }}
              >
                <Building2 size={13} className="regional-icon" />
                <span className="regional-text">{isLongRegional ? shortRegional : user.regional}</span>
                {isLongRegional && <button className="regional-remove" onClick={() => {}}><X size={11} /></button>}
                {tooltip?.id === user.id && (
                  <div className="regional-tooltip">{tooltip.text}</div>
                )}
              </div>
            </td>
            <td className="col-acceso">{user.ultimoAcceso}</td>
            <td>
              <button
                className={`toggle-switch ${user.activo ? 'on' : 'off'}`}
                onClick={() => onToggleActive(user.id)}
                aria-label={user.activo ? 'Desactivar' : 'Activar'}
              >
                <span className="toggle-thumb">
                  {user.activo
                    ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#39A900" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    : <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  }
                </span>
              </button>
            </td>
            <td>
              <div className="row-actions">
                <button className="icon-btn edit" title="Editar usuario" onClick={() => onEdit(user)}><Edit2 size={15} /></button>
                <button className="icon-btn key" title="Resetear contraseña" onClick={() => onResetPwd(user)}><KeyRound size={15} /></button>
                <button className="icon-btn view" title="Ver usuario" onClick={() => onView(user)}><Eye size={15} /></button>
              </div>
            </td>
          </tr>
        );
      })}
    </>
  );
};

/* ══════════════════════════════════════════════════════
   MODAL EDITAR USUARIO
   ══════════════════════════════════════════════════════ */
interface EditUserModalProps {
  user: UsuarioExtended | null;
  form: typeof EMPTY_USER_FORM;
  onFormChange: (field: string, value: string) => void;
  onClose: () => void;
  onSave: () => void;
  onGoResetPwd: () => void;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  user, form, onFormChange, onClose, onSave, onGoResetPwd,
}) => (
  <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
    <div className="resolucion-modal user-edit-modal">
      <div className="resolucion-modal-header">
        <h2 className="resolucion-modal-title">{user ? 'Editar usuario' : 'Nuevo usuario'}</h2>
        <button className="resolucion-modal-close" onClick={onClose}><X size={18} /></button>
      </div>
      <div className="resolucion-modal-body user-edit-body">
        {user && (
          <div className="um-alert info">
            <Info size={15} className="um-alert-icon" />
            <div>
              <strong>Información importante.</strong>
              <span> La contraseña no se puede cambiar aquí, para eso utilice la opción{' '}
                <button className="um-link" onClick={onGoResetPwd}>Resetear contraseña.</button>
              </span>
            </div>
          </div>
        )}
        <div className="ue-row">
          <div className="ue-field">
            <label className="ue-label">Nombre completo <HelpCircle size={13} className="rm-help" /></label>
            <input className="ue-input" placeholder="Harold Ricardo Jimenez Ro..." value={form.nombre} onChange={e => onFormChange('nombre', e.target.value)} />
          </div>
          <div className="ue-field">
            <label className="ue-label">Nombre de usuario <HelpCircle size={13} className="rm-help" /></label>
            <input className="ue-input" placeholder="Hricardojr" value={form.username} onChange={e => onFormChange('username', e.target.value)} />
          </div>
        </div>
        <div className="ue-row">
          <div className="ue-field">
            <label className="ue-label">Rol <HelpCircle size={13} className="rm-help" /></label>
            <div className="ue-tag-box">
              {form.rol ? (
                <span className={`rol-badge ${form.rol === 'Administrador' ? 'admin' : 'usuario'}`}>
                  {form.rol === 'Administrador'
                    ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                    : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  }
                  {form.rol}
                  <button className="ue-tag-remove" onClick={() => onFormChange('rol', '')}><X size={10} /></button>
                </span>
              ) : (
                <select className="ue-inline-select" onChange={e => onFormChange('rol', e.target.value)} defaultValue="">
                  <option value="" disabled>Seleccionar rol</option>
                  {ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
              )}
            </div>
          </div>
          <div className="ue-field">
            <label className="ue-label">Regional <HelpCircle size={13} className="rm-help" /></label>
            <div className="ue-tag-box">
              {form.regional ? (
                <span className="ue-regional-tag">
                  <Building2 size={12} className="ue-regional-icon" />
                  <span className="ue-regional-text">{form.regional}</span>
                  <button className="ue-tag-remove" onClick={() => onFormChange('regional', '')}><X size={10} /></button>
                </span>
              ) : (
                <select className="ue-inline-select" onChange={e => onFormChange('regional', e.target.value)} defaultValue="">
                  <option value="" disabled>Seleccionar regional</option>
                  {REGIONALES.map(r => <option key={r}>{r}</option>)}
                </select>
              )}
            </div>
          </div>
        </div>
        <div className="ue-row">
          <div className="ue-field">
            <label className="ue-label">ID/Email <HelpCircle size={13} className="rm-help" /></label>
            <input className="ue-input" placeholder="jricardojr@example.com" value={form.email} onChange={e => onFormChange('email', e.target.value)} />
          </div>
          <div className="ue-field">
            <label className="ue-label">Teléfono/Extensión <HelpCircle size={13} className="rm-help" /></label>
            <input className="ue-input" placeholder="0" value={form.telefono} onChange={e => onFormChange('telefono', e.target.value)} />
          </div>
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
