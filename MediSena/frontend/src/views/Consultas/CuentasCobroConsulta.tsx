import React from 'react';
import {
  DollarSign, User, Search, Filter, Printer, Info, X,
} from 'lucide-react';
import Modal from '../../components/Modal';
import { ViewIcon } from '../../components/Icons';
import { CuentaCobroConsulta, ESTADOS_CONSULTA, TIPOS_PAGO } from './types';

/* ─── Formulario de filtros vacío ────────────────────── */
export const EMPTY_CUENTA_FILTER = {
  numeroRecibo: '',
  funcionario: '',
  estado: 'Todos',
  tipoPago: 'Todos',
  fechaDesde: '',
  fechaHasta: '',
};

/* ══════════════════════════════════════════════════════
   PANEL DE FILTROS – Consulta Cuentas Cobro
   ══════════════════════════════════════════════════════ */
interface FiltrosProps {
  filters: typeof EMPTY_CUENTA_FILTER;
  onChange: (field: string, value: string) => void;
  onConsultar: () => void;
  onLimpiar: () => void;
  loading: boolean;
}

export const CuentaConsultaFiltros: React.FC<FiltrosProps> = ({
  filters, onChange, onConsultar, onLimpiar, loading,
}) => (
  <div className="cons-filters-card">
    <div className="cons-filters-grid">
      <div className="cons-input-group">
        <label className="cons-floating-label">Número de Recibo</label>
        <div className="cons-input-wrapper">
          <DollarSign size={15} className="cons-input-icon" />
          <input
            className="cons-input"
            placeholder="Ej: REC-2024-000001"
            value={filters.numeroRecibo}
            onChange={e => onChange('numeroRecibo', e.target.value)}
          />
        </div>
      </div>

      <div className="cons-input-group">
        <label className="cons-floating-label">Funcionario</label>
        <div className="cons-input-wrapper">
          <User size={15} className="cons-input-icon" />
          <input
            className="cons-input"
            placeholder="Nombre del funcionario"
            value={filters.funcionario}
            onChange={e => onChange('funcionario', e.target.value)}
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
        <label className="cons-floating-label">Tipo de Pago</label>
        <div className="cons-input-wrapper">
          <select className="cons-input cons-select" value={filters.tipoPago} onChange={e => onChange('tipoPago', e.target.value)}>
            {TIPOS_PAGO.map(o => <option key={o}>{o}</option>)}
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
   ESTADO VACÍO
   ══════════════════════════════════════════════════════ */
export const CuentaConsultaEmpty: React.FC = () => (
  <div className="cons-empty-state">
    <div className="cons-empty-icon">
      <Info size={22} color="#94a3b8" />
    </div>
    <h3 className="cons-empty-title">Configure los filtros y presione Consultar</h3>
    <p className="cons-empty-desc">Puede filtrar por número de recibo, funcionario, tipo de pago o rango de fechas</p>
  </div>
);

/* ══════════════════════════════════════════════════════
   HEADER DE RESULTADOS
   ══════════════════════════════════════════════════════ */
interface ResultsHeaderProps {
  total: number;
  onPrint: () => void;
}

export const CuentaConsultaResultsHeader: React.FC<ResultsHeaderProps> = ({ total, onPrint }) => (
  <div className="cons-results-header">
    <h3 className="cons-results-title">Resultados de la Búsqueda ({total} cuentas)</h3>
    <button className="cons-btn-print" onClick={onPrint}>
      <Printer size={14} />
      Imprimir
    </button>
  </div>
);

/* ══════════════════════════════════════════════════════
   THEAD
   ══════════════════════════════════════════════════════ */
export const CuentaConsultaHead: React.FC = () => (
  <tr>
    <th>N° Recibo</th>
    <th>Funcionario</th>
    <th>Fecha</th>
    <th>Tipo Pago</th>
    <th>Valor</th>
    <th>Estado</th>
    <th>Acciones</th>
  </tr>
);

/* ══════════════════════════════════════════════════════
   TABLA
   ══════════════════════════════════════════════════════ */
interface TablaProps {
  items: CuentaCobroConsulta[];
  loading: boolean;
  onView: (c: CuentaCobroConsulta) => void;
}

export const CuentaConsultaTabla: React.FC<TablaProps> = ({ items, loading, onView }) => {
  if (loading) return <tr><td colSpan={7} className="table-empty">Cargando datos...</td></tr>;
  if (items.length === 0) return <tr><td colSpan={7} className="table-empty">No se encontraron cuentas de cobro con esos criterios.</td></tr>;

  return (
    <>
      {items.map(c => (
        <tr key={c.id}>
          <td className="col-numero">{c.numeroRecibo}</td>
          <td className="cons-col-benef">{c.funcionario}</td>
          <td>{c.fecha}</td>
          <td>{c.tipoPago}</td>
          <td className="cons-col-valor">{c.valor}</td>
          <td>
            <span className="cons-estado-chip">{c.estado}</span>
          </td>
          <td>
            <div className="row-actions">
              <button className="db-icon-btn-svg" title="Ver detalles" onClick={() => onView(c)}>
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
   MODAL DETALLES – Cuenta de Cobro
   ══════════════════════════════════════════════════════ */
interface DetallesProps {
  cuenta: CuentaCobroConsulta;
  onClose: () => void;
}

export const CuentaConsultaDetallesModal: React.FC<DetallesProps> = ({ cuenta, onClose }) => (
  <Modal isOpen={true} onClose={onClose} title="Detalles de la Cuenta" className="cons-detalles-modal">
    <div className="resolucion-modal-body cons-detalles-body">
      <div className="cons-detalles-hero">
        <h3 className="cons-detalles-numero">{cuenta.numeroRecibo}</h3>
        <span className="cons-estado-chip cons-estado-chip-lg">{cuenta.estado}</span>
      </div>
      <div className="cons-detalles-divider" />
      <div className="cons-detalles-grid">
        <div className="cons-detalle-field">
          <span className="cons-detalle-label">Funcionario</span>
          <span className="cons-detalle-value">{cuenta.funcionario}</span>
        </div>
        <div className="cons-detalle-field">
          <span className="cons-detalle-label">Tipo de Pago</span>
          <span className="cons-detalle-value">{cuenta.tipoPago}</span>
        </div>
        <div className="cons-detalle-field">
          <span className="cons-detalle-label">Fecha</span>
          <span className="cons-detalle-value">{cuenta.fecha}</span>
        </div>
        <div className="cons-detalle-field">
          <span className="cons-detalle-label">Valor</span>
          <span className="cons-detalle-value cons-detalle-value-big">{cuenta.valor}</span>
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
  </Modal>
);
