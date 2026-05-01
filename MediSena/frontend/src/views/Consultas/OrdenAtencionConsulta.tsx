import React from 'react';
import {
  FileText, User, Calendar, Search, Filter, Eye, Printer,
  Info, X, Stethoscope,
} from 'lucide-react';
import { OrdenConsulta, ESTADOS_CONSULTA } from './types';

/* ─── Formulario de filtros vacío ────────────────────── */
export const EMPTY_ORDEN_FILTER = {
  numeroOrden: '',
  beneficiario: '',
  medico: '',
  estado: 'Todos',
  fechaDesde: '',
  fechaHasta: '',
};

/* ══════════════════════════════════════════════════════
   PANEL DE FILTROS – Consulta Órdenes
   ══════════════════════════════════════════════════════ */
interface FiltrosProps {
  filters: typeof EMPTY_ORDEN_FILTER;
  onChange: (field: string, value: string) => void;
  onConsultar: () => void;
  onLimpiar: () => void;
  loading: boolean;
}

export const OrdenConsultaFiltros: React.FC<FiltrosProps> = ({
  filters, onChange, onConsultar, onLimpiar, loading,
}) => (
  <div className="cons-filters-card">
    <div className="cons-filters-grid">
      <div className="cons-input-group">
        <label className="cons-floating-label">Número de Orden</label>
        <div className="cons-input-wrapper">
          <FileText size={15} className="cons-input-icon" />
          <input
            className="cons-input"
            placeholder="Ej: ORD-2024-000001"
            value={filters.numeroOrden}
            onChange={e => onChange('numeroOrden', e.target.value)}
          />
        </div>
      </div>

      <div className="cons-input-group">
        <label className="cons-floating-label">Beneficiario</label>
        <div className="cons-input-wrapper">
          <User size={15} className="cons-input-icon" />
          <input
            className="cons-input"
            placeholder="Nombre del beneficiario"
            value={filters.beneficiario}
            onChange={e => onChange('beneficiario', e.target.value)}
          />
        </div>
      </div>

      <div className="cons-input-group">
        <label className="cons-floating-label">Médico</label>
        <div className="cons-input-wrapper">
          <input
            className="cons-input"
            placeholder="Médico"
            value={filters.medico}
            onChange={e => onChange('medico', e.target.value)}
          />
        </div>
      </div>

      <div className="cons-input-group">
        <label className="cons-floating-label">Estado</label>
        <div className="cons-input-wrapper">
          <select className="cons-input cons-select" value={filters.estado} onChange={e => onChange('estado', e.target.value)}>
            {ESTADOS_CONSULTA.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>

      <div className="cons-input-group">
        <label className="cons-floating-label">Fecha Desde</label>
        <div className="cons-input-wrapper">
          <input
            className="cons-input"
            type="date"
            value={filters.fechaDesde}
            onChange={e => onChange('fechaDesde', e.target.value)}
          />
        </div>
      </div>

      <div className="cons-input-group">
        <label className="cons-floating-label">Fecha Hasta</label>
        <div className="cons-input-wrapper">
          <input
            className="cons-input"
            type="date"
            value={filters.fechaHasta}
            onChange={e => onChange('fechaHasta', e.target.value)}
          />
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
   ESTADO VACÍO (antes de consultar)
   ══════════════════════════════════════════════════════ */
export const OrdenConsultaEmpty: React.FC = () => (
  <div className="cons-empty-state">
    <div className="cons-empty-icon">
      <Info size={22} color="#94a3b8" />
    </div>
    <h3 className="cons-empty-title">Configure los filtros y presione Consultar</h3>
    <p className="cons-empty-desc">Puede filtrar por número de orden, beneficiario, médico, estado o rango de fechas</p>
  </div>
);

/* ══════════════════════════════════════════════════════
   HEADER DE RESULTADOS (cuenta + botón imprimir)
   ══════════════════════════════════════════════════════ */
interface ResultsHeaderProps {
  total: number;
  onPrint: () => void;
}

export const OrdenConsultaResultsHeader: React.FC<ResultsHeaderProps> = ({ total, onPrint }) => (
  <div className="cons-results-header">
    <h3 className="cons-results-title">Resultados de la Búsqueda ({total} órdenes)</h3>
    <button className="cons-btn-print" onClick={onPrint}>
      <Printer size={14} />
      Imprimir
    </button>
  </div>
);

/* ══════════════════════════════════════════════════════
   THEAD tabla de órdenes
   ══════════════════════════════════════════════════════ */
export const OrdenConsultaHead: React.FC = () => (
  <tr>
    <th>Número</th>
    <th>Fecha</th>
    <th>Beneficiario</th>
    <th>Médico</th>
    <th>Especialidad</th>
    <th>Estado</th>
    <th>Valor</th>
    <th>Acciones</th>
  </tr>
);

/* ══════════════════════════════════════════════════════
   TABLA de resultados
   ══════════════════════════════════════════════════════ */
interface TablaProps {
  items: OrdenConsulta[];
  loading: boolean;
  onView: (o: OrdenConsulta) => void;
}

export const OrdenConsultaTabla: React.FC<TablaProps> = ({ items, loading, onView }) => {
  if (loading) return <tr><td colSpan={8} className="table-empty">Cargando datos...</td></tr>;
  if (items.length === 0) return <tr><td colSpan={8} className="table-empty">No se encontraron órdenes con esos criterios.</td></tr>;

  return (
    <>
      {items.map(o => (
        <tr key={o.id}>
          <td className="col-numero">{o.numero}</td>
          <td>{o.fecha}</td>
          <td className="cons-col-benef">{o.beneficiario}</td>
          <td>{o.medico || '—'}</td>
          <td className="cons-col-esp">{o.especialidad || '0'}</td>
          <td>
            <span className="cons-estado-chip">{o.estado}</span>
          </td>
          <td className="cons-col-valor">{o.valor}</td>
          <td>
            <div className="row-actions">
              <button className="icon-btn view" title="Ver detalles" onClick={() => onView(o)}>
                <Eye size={15} />
              </button>
            </div>
          </td>
        </tr>
      ))}
    </>
  );
};

/* ══════════════════════════════════════════════════════
   MODAL – DETALLES DE LA ORDEN (consulta)
   ══════════════════════════════════════════════════════ */
interface DetallesProps {
  orden: OrdenConsulta;
  onClose: () => void;
}

export const OrdenConsultaDetallesModal: React.FC<DetallesProps> = ({ orden, onClose }) => (
  <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
    <div className="resolucion-modal cons-detalles-modal">
      <div className="resolucion-modal-header">
        <h2 className="resolucion-modal-title">
          <Eye size={17} style={{ marginRight: 8, verticalAlign: 'middle' }} />
          Detalles de la Orden
        </h2>
        <button className="resolucion-modal-close" onClick={onClose}><X size={18} /></button>
      </div>
      <div className="resolucion-modal-body cons-detalles-body">
        <div className="cons-detalles-hero">
          <h3 className="cons-detalles-numero">{orden.numero}</h3>
          <span className="cons-estado-chip cons-estado-chip-lg">{orden.estado}</span>
        </div>
        <div className="cons-detalles-divider" />
        <div className="cons-detalles-grid">
          <div className="cons-detalle-field">
            <span className="cons-detalle-label">Beneficiario</span>
            <span className="cons-detalle-value">{orden.beneficiario}</span>
          </div>
          <div className="cons-detalle-field">
            <span className="cons-detalle-label">Funcionario Solicitante</span>
            <span className="cons-detalle-value">{orden.funcionarioSolicitante || '—'}</span>
          </div>
          <div className="cons-detalle-field">
            <span className="cons-detalle-label">Médico Tratante</span>
            <span className="cons-detalle-value">{orden.medico || '—'}</span>
          </div>
          <div className="cons-detalle-field">
            <span className="cons-detalle-label">Especialidad</span>
            <span className="cons-detalle-value">{orden.especialidad || '0'}</span>
          </div>
          <div className="cons-detalle-field">
            <span className="cons-detalle-label">Tipo de Atención</span>
            <span className="cons-detalle-value">{orden.tipoAtencion || '—'}</span>
          </div>
          <div className="cons-detalle-field">
            <span className="cons-detalle-label">Fecha de Emisión</span>
            <span className="cons-detalle-value">{orden.fechaEmision || orden.fecha}</span>
          </div>
        </div>
      </div>
      <div className="resolucion-modal-footer" style={{ justifyContent: 'flex-end' }}>
        <div className="rm-footer-actions">
          <button className="rm-btn-cancel" onClick={onClose}>Cerrar</button>
          <button className="rm-btn-primary">
            <Printer size={15} style={{ marginRight: 6 }} />
            Imprimir
          </button>
        </div>
      </div>
    </div>
  </div>
);
