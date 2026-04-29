import React from 'react';
import {
  ArrowUpDown, Eye, Trash2, Plus, X, AlertTriangle,
} from 'lucide-react';
import { Tope, nivelColor } from './types';

/* ══════════════════════════════════════════════════════
   TOOLBAR   
   ══════════════════════════════════════════════════════ */
export const TopesToolbar: React.FC<{ onNew: () => void }> = ({ onNew }) => (
  <div className="content-toolbar">
    <p className="tab-description">Consulta topes máximo por grupos, vigencia y categoría.</p>
    <button className="btn-new-resolution" onClick={onNew}>
      <Plus size={16} />
      Nuevo Tope
    </button>
  </div>
);

/* ══════════════════════════════════════════════════════
   THEAD
   ══════════════════════════════════════════════════════ */
export const TopesHead: React.FC = () => (
  <tr>
    <th>CÓDIGO</th>
    <th>GRUPO</th>
    <th>NIVEL <ArrowUpDown size={13} className="sort-icon" /></th>
    <th>VIGENCIA <ArrowUpDown size={13} className="sort-icon" /></th>
    <th>VALOR PROMEDIO</th>
    <th>RESOLUCIÓN</th>
    <th>ESTADO</th>
    <th></th>
  </tr>
);

/* ══════════════════════════════════════════════════════
   TABLA TOPES
   ══════════════════════════════════════════════════════ */
interface TopesTablaProps {
  items: Tope[];
  loading: boolean;
  onView: (t: Tope) => void;
  onDelete: (t: Tope) => void;
}

export const TopesTabla: React.FC<TopesTablaProps> = ({ items, loading, onView, onDelete }) => {
  if (loading) return <tr><td colSpan={8} className="table-empty">Cargando datos...</td></tr>;
  if (items.length === 0) return <tr><td colSpan={8} className="table-empty">No se encontraron resultados.</td></tr>;

  return (
    <>
      {items.map(t => (
        <tr key={t.id}>
          <td className="col-codigo">{t.codigo}</td>
          <td className="col-grupo">{t.grupo}</td>
          <td>
            <span className="nivel-badge" style={{ color: nivelColor(t.nivel) }}>
              <span className="nivel-dot" style={{ background: nivelColor(t.nivel) }}></span>
              {t.nivel}
            </span>
          </td>
          <td><span className="vigencia-orange">{t.vigencia}</span></td>
          <td>{t.valorPromedio}</td>
          <td><span className="resolucion-pill">{t.resolucion}</span></td>
          <td>
            <span className="status-badge vigente">
              <div className="status-dot vigente"></div>
              {t.estado}
            </span>
          </td>
          <td>
            <div className="row-actions">
              <button className="icon-btn view" title="Ver tope" onClick={() => onView(t)}><Eye size={15} /></button>
              <button className="icon-btn delete" onClick={() => onDelete(t)}><Trash2 size={15} /></button>
            </div>
          </td>
        </tr>
      ))}
    </>
  );
};

/* ══════════════════════════════════════════════════════
   MODAL VER TOPE
   ══════════════════════════════════════════════════════ */
interface ViewTopeModalProps {
  tope: Tope;
  onClose: () => void;
}

export const ViewTopeModal: React.FC<ViewTopeModalProps> = ({ tope, onClose }) => (
  <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
    <div className="resolucion-modal tope-view-modal">
      <div className="resolucion-modal-header tope-view-header">
        <h2 className="resolucion-modal-title">{tope.grupo}</h2>
        <button className="resolucion-modal-close" onClick={onClose}><X size={18} /></button>
      </div>
      <div className="resolucion-modal-body tope-view-body">
        <div className="tope-alert">
          <div className="alert-icon"><AlertTriangle size={18} color="#d97706" /></div>
          <div className="alert-content">
            <h4>Información del Sistema Original</h4>
            <p>Esta vista muestra los Topes de Grupos. El sistema original incluía subgrupos e ítems con configuraciones adicionales, no disponibles en esta versión.</p>
          </div>
        </div>
        <div className="tope-info-box">
          <div className="ti-col"><div className="ti-label">Código</div><div className="ti-val">{tope.codigo}</div></div>
          <div className="ti-col"><div className="ti-label">Nombre</div><div className="ti-val">{tope.grupo}</div></div>
          <div className="ti-col"><div className="ti-label">Nivel</div><div className="ti-val ti-n4">N4</div></div>
          <div className="ti-col"><div className="ti-label">Vigencia</div><div className="ti-val">{tope.vigencia}</div></div>
          <div className="ti-col"><div className="ti-label">Resolución</div><div className="ti-val">{tope.resolucion}</div></div>
          <div className="ti-col"><div className="ti-label">Estado</div><div className="ti-val"><span className="ti-badge-history">Histórico</span></div></div>
        </div>
        <div className="tope-section">
          <div className="ts-header ts-blue">Topes Máximos - Categorías Normales</div>
          <div className="ts-row"><span>Tope máximo del grupo en categoría A Normal</span><strong>$ 0</strong></div>
          <div className="ts-row"><span>Tope máximo del grupo en categoría B Normal</span><strong>$ 0</strong></div>
          <div className="ts-row"><span>Tope máximo del grupo en categoría C Normal</span><strong>$ 0</strong></div>
          <div className="ts-row"><span>Tope máximo del grupo en categoría D Normal</span><strong>$ 0</strong></div>
        </div>
        <div className="tope-section">
          <div className="ts-header ts-yellow">Topes Máximos - Categorías Especiales</div>
          <div className="ts-row"><span>Tope máximo del grupo en categoría A Especial</span><strong>$ 0</strong></div>
          <div className="ts-row"><span>Tope máximo del grupo en categoría B Especial</span><strong>$ 0</strong></div>
          <div className="ts-row"><span>Tope máximo del grupo en categoría C Especial</span><strong>$ 0</strong></div>
          <div className="ts-row"><span>Tope máximo del grupo en categoría D Especial</span><strong>$ 0</strong></div>
        </div>
      </div>
      <div className="resolucion-modal-footer tope-view-footer">
        <button className="rm-btn-primary" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
  </div>
);
