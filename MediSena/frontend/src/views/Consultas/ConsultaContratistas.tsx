import React from 'react';
import {
  Building2, Search, Filter, Printer, Info, X, Mail, Phone,
} from 'lucide-react';
import Modal from '../../components/Modal';
import { ViewIcon } from '../../components/Icons';
import { ContratistaConsulta, ESPECIALIDADES_CONS } from './types';

/* ─── Formulario de filtros vacío ────────────────────── */
export const EMPTY_CONTRATISTA_FILTER = {
  nit: '',
  nombre: '',
  especialidad: 'Todas',
  regional: '',
  estado: 'Todos',
};

/* ══════════════════════════════════════════════════════
   FILTROS – Consulta Contratistas
   ══════════════════════════════════════════════════════ */
interface FiltrosProps {
  filters: typeof EMPTY_CONTRATISTA_FILTER;
  onChange: (field: string, value: string) => void;
  onConsultar: () => void;
  onLimpiar: () => void;
  loading: boolean;
}

export const ContratistasFiltros: React.FC<FiltrosProps> = ({
  filters, onChange, onConsultar, onLimpiar, loading,
}) => (
  <div className="cons-filters-card">
    <div className="cons-filters-grid">
      <div className="cons-input-group">
        <label className="cons-floating-label">NIT</label>
        <div className="cons-input-wrapper">
          <Building2 size={15} className="cons-input-icon" />
          <input
            className="cons-input"
            placeholder="Ej: 900123456"
            value={filters.nit}
            onChange={e => onChange('nit', e.target.value)}
          />
        </div>
      </div>

      <div className="cons-input-group">
        <label className="cons-floating-label">Nombre / Razón Social</label>
        <div className="cons-input-wrapper">
          <input
            className="cons-input"
            placeholder="Nombre del contratista"
            value={filters.nombre}
            onChange={e => onChange('nombre', e.target.value)}
          />
        </div>
      </div>

      <div className="cons-input-group">
        <label className="cons-floating-label">Especialidad</label>
        <div className="cons-input-wrapper">
          <select className="cons-input cons-select" value={filters.especialidad} onChange={e => onChange('especialidad', e.target.value)}>
            <option value="Todas">Todas</option>
            {ESPECIALIDADES_CONS.map(e => <option key={e}>{e}</option>)}
          </select>
        </div>
      </div>

      <div className="cons-input-group">
        <label className="cons-floating-label">Regional</label>
        <div className="cons-input-wrapper">
          <input
            className="cons-input"
            placeholder="Regional"
            value={filters.regional}
            onChange={e => onChange('regional', e.target.value)}
          />
        </div>
      </div>

      <div className="cons-input-group">
        <label className="cons-floating-label">Estado</label>
        <div className="cons-input-wrapper">
          <select className="cons-input cons-select" value={filters.estado} onChange={e => onChange('estado', e.target.value)}>
            <option>Todos</option>
            <option>Activo</option>
            <option>Inactivo</option>
          </select>
        </div>
      </div>
    </div>

    <div className="cons-actions-row">
      <button className="cons-btn-consultar" onClick={onConsultar} disabled={loading}>
        <Search size={15} />
        {loading ? 'Consultando...' : 'Consultar'}
      </button>
      <button className="cons-btn-limpiar" onClick={onLimpiar}>
        <Filter size={14} />
        Limpiar
      </button>
    </div>
  </div>
);

/* ══════════════════════════════════════════════════════
   ESTADO VACÍO
   ══════════════════════════════════════════════════════ */
export const ContratistasEmpty: React.FC = () => (
  <div className="cons-empty-state">
    <div className="cons-empty-icon">
      <Info size={22} color="#94a3b8" />
    </div>
    <h3 className="cons-empty-title">Configure los filtros y presione Consultar</h3>
    <p className="cons-empty-desc">Puede filtrar por NIT, nombre, especialidad, regional o estado</p>
  </div>
);

/* ══════════════════════════════════════════════════════
   HEADER RESULTADOS
   ══════════════════════════════════════════════════════ */
interface ResultsHeaderProps {
  total: number;
  onPrint: () => void;
}

export const ContratistasResultsHeader: React.FC<ResultsHeaderProps> = ({ total, onPrint }) => (
  <div className="cons-results-header">
    <h3 className="cons-results-title">Resultados de la Búsqueda ({total} contratistas)</h3>
    <button className="cons-btn-print" onClick={onPrint}>
      <Printer size={14} />
      Imprimir
    </button>
  </div>
);

/* ══════════════════════════════════════════════════════
   THEAD
   ══════════════════════════════════════════════════════ */
export const ContratistasHead: React.FC = () => (
  <tr>
    <th>NIT</th>
    <th>Nombre / Razón Social</th>
    <th>Especialidad</th>
    <th>Regional</th>
    <th>Contacto</th>
    <th>Estado</th>
    <th>Acciones</th>
  </tr>
);

/* ══════════════════════════════════════════════════════
   TABLA
   ══════════════════════════════════════════════════════ */
interface TablaProps {
  items: ContratistaConsulta[];
  loading: boolean;
  onView: (c: ContratistaConsulta) => void;
}

export const ContratistasTabla: React.FC<TablaProps> = ({ items, loading, onView }) => {
  if (loading) return <tr><td colSpan={7} className="table-empty">Cargando datos...</td></tr>;
  if (items.length === 0) return <tr><td colSpan={7} className="table-empty">No se encontraron contratistas con esos criterios.</td></tr>;

  return (
    <>
      {items.map(c => (
        <tr key={c.id}>
          <td className="col-numero">{c.nit}</td>
          <td className="cons-col-benef">{c.nombre}</td>
          <td>{c.especialidad}</td>
          <td>{c.regional}</td>
          <td>
            <div className="cons-contact-cell">
              <span className="cons-contact-item"><Phone size={11} /> {c.telefono}</span>
              <span className="cons-contact-item"><Mail size={11} /> {c.email}</span>
            </div>
          </td>
          <td>
            <span className={`status-badge ${c.estado === 'Activo' ? 'vigente' : 'vencido'}`}>
              <div className={`status-dot ${c.estado === 'Activo' ? 'vigente' : 'vencido'}`}></div>
              {c.estado}
            </span>
          </td>
          <td>
            <div className="row-actions">
              <button className="db-icon-btn-svg" title="Ver contratista" onClick={() => onView(c)}>
                <ViewIcon className="db-action-icon" />
              </button>
            </div>
          </td>
        </tr>
      ))}
    </>
  );
};

/* ══════════════════════════════════════════════════════
   MODAL DETALLES – Contratista
   ══════════════════════════════════════════════════════ */
interface DetallesProps {
  contratista: ContratistaConsulta;
  onClose: () => void;
}

export const ContratistasDetallesModal: React.FC<DetallesProps> = ({ contratista, onClose }) => (
  <Modal isOpen={true} onClose={onClose} title="Detalles del Contratista" className="cons-detalles-modal">
    <div className="resolucion-modal-body cons-detalles-body">
      <div className="cons-detalles-hero">
        <h3 className="cons-detalles-numero">{contratista.nombre}</h3>
        <span className={`status-badge ${contratista.estado === 'Activo' ? 'vigente' : 'vencido'}`}>
          <div className={`status-dot ${contratista.estado === 'Activo' ? 'vigente' : 'vencido'}`}></div>
          {contratista.estado}
        </span>
      </div>
      <div className="cons-detalles-divider" />
      <div className="cons-detalles-grid">
        <div className="cons-detalle-field">
          <span className="cons-detalle-label">NIT</span>
          <span className="cons-detalle-value">{contratista.nit}</span>
        </div>
        <div className="cons-detalle-field">
          <span className="cons-detalle-label">Especialidad</span>
          <span className="cons-detalle-value">{contratista.especialidad}</span>
        </div>
        <div className="cons-detalle-field">
          <span className="cons-detalle-label">Regional</span>
          <span className="cons-detalle-value">{contratista.regional}</span>
        </div>
        <div className="cons-detalle-field">
          <span className="cons-detalle-label">Teléfono</span>
          <span className="cons-detalle-value">{contratista.telefono}</span>
        </div>
        <div className="cons-detalle-field" style={{ gridColumn: '1 / -1' }}>
          <span className="cons-detalle-label">Email</span>
          <span className="cons-detalle-value">{contratista.email}</span>
        </div>
      </div>
    </div>
    <div className="resolucion-modal-footer" style={{ justifyContent: 'flex-end' }}>
      <div className="rm-footer-actions">
        <button className="rm-btn-cancel" onClick={onClose}>Cerrar</button>
      </div>
    </div>
  </Modal>
);
