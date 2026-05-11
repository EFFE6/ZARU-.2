import React from 'react';
import {
  Printer, RefreshCw, Download, Search, AlertTriangle,
  FileText, DollarSign, Building2, XCircle, AlertCircle, Info,
} from 'lucide-react';
import {
  ImprimirExcedente, ExcedenteMayor30, RecibosPagoRelacion,
  FinancieroTotales, FormatoSalario, ReliquidarInfo, ExcedenteSinCancelar,
  REGIONALES_EXC,
} from './types';



/* ═══════════════════════════════════════════════════════════
   TAB 2 – IMPRIMIR EXCEDENTES
   ═══════════════════════════════════════════════════════════ */
interface ImprimirToolbarProps {
  periodo: string;
  regional: string;
  onPeriodoChange: (v: string) => void;
  onRegionalChange: (v: string) => void;
  onBuscar: () => void;
}
export const ImprimirToolbar: React.FC<ImprimirToolbarProps> = ({
  periodo, regional, onPeriodoChange, onRegionalChange, onBuscar,
}) => (
  <div className="exc-toolbar-row exc-toolbar-col">
    <div className="exc-toolbar-head">
      <div>
        <h2 className="exc-section-title">
          <Printer size={20} color="#0165B0" />
          Imprimir Excedentes
        </h2>
        <p className="exc-section-desc">Imprima excedentes por periodo y regional</p>
      </div>
    </div>
    <div className="exc-filter-grid">
      <div className="cons-input-group" style={{ minWidth: 200 }}>
        <label className="cons-floating-label">Periodo</label>
        <div className="cons-input-wrapper">
          <input className="cons-input" type="month" value={periodo} onChange={e => onPeriodoChange(e.target.value)} />
        </div>
      </div>
      <div className="cons-input-group" style={{ minWidth: 220 }}>
        <label className="cons-floating-label">Regional</label>
        <div className="cons-input-wrapper">
          <select className="cons-input cons-select" value={regional} onChange={e => onRegionalChange(e.target.value)}>
            {REGIONALES_EXC.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
      </div>
      <button className="exc-btn-primary" style={{ height: 42, marginTop: 18 }} onClick={onBuscar}>
        <Search size={15} /> Buscar
      </button>
    </div>
  </div>
);

interface ImprimirTablaProps {
  items: ImprimirExcedente[];
  loading: boolean;
  selected: Set<number>;
  onToggle: (id: number) => void;
  onToggleAll: () => void;
}
export const ImprimirTabla: React.FC<ImprimirTablaProps> = ({ items, loading, selected, onToggle, onToggleAll }) => {
  if (loading) return (
    <tr>
      <td colSpan={6} className="table-empty">Cargando datos...</td>
    </tr>
  );
  
  if (items.length === 0) return (
    <tr>
      <td colSpan={6} className="table-empty">No hay excedentes en este periodo</td>
    </tr>
  );

  return (
    <>
      {items.map(r => (
        <tr key={r.id}>
          <td><input type="checkbox" checked={selected.has(r.id)} onChange={() => onToggle(r.id)} /></td>
          <td style={{ color: '#64748b' }}>{r.recibo}</td>
          <td className="bold">{r.funcionario}</td>
          <td>{r.periodo}</td>
          <td className="bold">{r.valor}</td>
          <td>
            <span className={`exc-pill-badge exc-pill-estado-${(r.estado || '').toLowerCase()}`}>
              {r.estado}
            </span>
          </td>
        </tr>
      ))}
    </>
  );
};

export const ImprimirHead: React.FC<{ allSelected: boolean; onToggleAll: () => void }> = ({ allSelected, onToggleAll }) => (
  <tr>
    <th style={{ width: 40 }}>
      <input type="checkbox" checked={allSelected} onChange={onToggleAll} />
    </th>
    <th>RECIBO</th>
    <th>FUNCIONARIO</th>
    <th>PERIODO</th>
    <th>VALOR</th>
    <th>ESTADO</th>
  </tr>
);

/* ═══════════════════════════════════════════════════════════
   TAB 3 – EXCEDENTES MAYOR A 30 DÍAS
   ═══════════════════════════════════════════════════════════ */
interface Mayor30ToolbarProps {
  totalCount: number;
  onRefresh: () => void;
}
export const Mayor30Toolbar: React.FC<Mayor30ToolbarProps> = ({ totalCount, onRefresh }) => (
  <div className="exc-toolbar-row exc-toolbar-col">
    <div className="exc-toolbar-head">
      <div>
        <h2 className="exc-section-title">
          <AlertTriangle size={20} color="#f97316" />
          Excedentes Mayor a 30 Días
        </h2>
        <p className="exc-section-desc">Excedentes pendientes de cobro con más de 30 días</p>
      </div>
      <button className="exc-btn-outline" onClick={onRefresh}>
        <RefreshCw size={14} /> Actualizar
      </button>
    </div>
    <div className="exc-warning-bar" style={{ background: '#fffbeb', color: '#b45309', padding: '10px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
      <AlertTriangle size={14} />
      <span><strong>{totalCount.toLocaleString()}</strong> excedente(s) con más de 30 días pendientes de cobro</span>
    </div>
  </div>
);

export const Mayor30Head: React.FC = () => (
  <tr>
    <th>RECIBO</th>
    <th>FUNCIONARIO</th>
    <th>FECHA GENERACIÓN</th>
    <th>DÍAS TRANSCURRIDOS</th>
    <th>VALOR</th>
    <th>ESTADO</th>
  </tr>
);

interface Mayor30TablaProps {
  items: ExcedenteMayor30[];
  loading: boolean;
}
export const Mayor30Tabla: React.FC<Mayor30TablaProps> = ({ items, loading }) => {
  if (loading) return <tr><td colSpan={6} className="table-empty">Cargando datos...</td></tr>;
  if (items.length === 0) return <tr><td colSpan={6} className="table-empty">Sin excedentes mayores a 30 días</td></tr>;
  return (
    <>
      {items.map(r => (
        <tr key={r.id}>
          <td style={{ color: '#64748b' }}>{r.recibo}</td>
          <td className="bold">{r.funcionario}</td>
          <td>{r.fechaGeneracion}</td>
          <td><span className="exc-pill-badge" style={{ background: '#fee2e2', color: '#b91c1c' }}>{r.diasTranscurridos} días</span></td>
          <td className="bold">{r.valor}</td>
          <td>
            <span className={`exc-pill-badge exc-pill-estado-${(r.estado || '').toLowerCase()}`}>
              {r.estado}
            </span>
          </td>
        </tr>
      ))}
    </>
  );
};

/* ═══════════════════════════════════════════════════════════
   TAB 4 – RELACIÓN RECIBOS DE PAGO
   ═══════════════════════════════════════════════════════════ */
interface RelacionToolbarProps {
  periodo: string;
  onPeriodoChange: (v: string) => void;
  onGenerar: () => void;
  onPrint: () => void;
  onExport: () => void;
}
export const RelacionToolbar: React.FC<RelacionToolbarProps> = ({
  periodo, onPeriodoChange, onGenerar, onPrint, onExport,
}) => (
  <div className="exc-toolbar-row exc-toolbar-col">
    <div className="exc-toolbar-head">
      <div>
        <h2 className="exc-section-title">
          <FileText size={20} color="#0165B0" />
          Relación de Recibos de Pago
        </h2>
        <p className="exc-section-desc">Genere la relación de recibos por periodo</p>
      </div>
      <div className="exc-toolbar-actions">
        <button className="exc-btn-outline" onClick={onPrint}>
          <Printer size={14} /> Imprimir
        </button>
        <button className="exc-btn-outline" onClick={onExport}>
          <Download size={14} /> Exportar
        </button>
      </div>
    </div>
    <div className="exc-filter-grid">
      <div className="cons-input-group" style={{ minWidth: 260, flex: 1 }}>
        <label className="cons-floating-label">Periodo</label>
        <div className="cons-input-wrapper">
          <input className="cons-input" type="month" value={periodo} onChange={e => onPeriodoChange(e.target.value)} />
        </div>
      </div>
      <button className="exc-btn-primary" style={{ height: 42, marginTop: 18 }} onClick={onGenerar}>
        Generar Relación
      </button>
    </div>
  </div>
);

export const RelacionHead: React.FC = () => (
  <tr>
    <th>RECIBO</th>
    <th>FUNCIONARIO</th>
    <th>CÉDULA</th>
    <th>DEPENDENCIA</th>
    <th>VALOR</th>
    <th>ESTADO</th>
  </tr>
);

interface RelacionTablaProps {
  items: RecibosPagoRelacion[];
  loading: boolean;
}
export const RelacionTabla: React.FC<RelacionTablaProps> = ({ items, loading }) => {
  if (loading) return <tr><td colSpan={6} className="table-empty">Cargando datos...</td></tr>;
  if (items.length === 0) return <tr><td colSpan={6} className="table-empty">Sin relación generada</td></tr>;
  return (
    <>
      {items.map(r => (
        <tr key={r.id}>
          <td style={{ color: '#64748b' }}>{r.recibo}</td>
          <td className="bold">{r.funcionario}</td>
          <td>{r.cedula}</td>
          <td>{r.dependencia}</td>
          <td className="bold">{r.valor}</td>
          <td>
            <span className={`exc-pill-badge exc-pill-estado-${(r.estado || '').toLowerCase()}`}>
              {r.estado}
            </span>
          </td>
        </tr>
      ))}
    </>
  );
};

/* ═══════════════════════════════════════════════════════════
   TAB 5 – FORMATO FINANCIERO
   ═══════════════════════════════════════════════════════════ */
interface FinancieroProps {
  periodo: string;
  onPeriodoChange: (v: string) => void;
  onGenerar: () => void;
  onPrint: () => void;
  totales: FinancieroTotales | null;
  loading: boolean;
}
export const FormatoFinancieroPanel: React.FC<FinancieroProps> = ({
  periodo, onPeriodoChange, onGenerar, onPrint, totales, loading,
}) => (
  <div className="exc-toolbar-row exc-toolbar-col" style={{ padding: 0 }}>
    <div className="exc-toolbar-head">
      <div>
        <h2 className="exc-section-title">
          <Building2 size={20} color="#0165B0" />
          Formato Financiero
        </h2>
        <p className="exc-section-desc">Genere el formato financiero consolidado por periodo</p>
      </div>
    </div>
    <div className="exc-filter-grid">
      <div className="cons-input-group" style={{ minWidth: 260, flex: 1 }}>
        <label className="cons-floating-label">Periodo</label>
        <div className="cons-input-wrapper">
          <input className="cons-input" type="month" value={periodo} onChange={e => onPeriodoChange(e.target.value)} />
        </div>
      </div>
      <button className="exc-btn-primary" style={{ height: 42, marginTop: 18 }} onClick={onGenerar} disabled={loading}>
        {loading ? 'Generando...' : 'Generar'}
      </button>
    </div>
    {totales ? (
      <div className="exc-fin-panel" style={{ marginTop: 20, border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
        <div className="exc-fin-row-head" style={{ background: '#f8fafc', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', fontWeight: 600 }}>
          <span>Concepto</span>
          <span style={{ textAlign: 'right' }}>Valor</span>
        </div>
        <div className="exc-fin-row" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9' }}>
          <span className="exc-fin-label">Total Excedentes Generados</span>
          <span className="exc-fin-value bold">{totales.totalExcedentes}</span>
        </div>
        <div className="exc-fin-row" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9' }}>
          <span className="exc-fin-label">Total Pagado</span>
          <span className="exc-fin-value bold">{totales.totalPagado}</span>
        </div>
        <div className="exc-fin-row exc-fin-row-highlight" style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', background: '#f0f9ff', fontWeight: 700, color: '#0369a1' }}>
          <span className="exc-fin-label">Saldo Pendiente</span>
          <span className="exc-fin-value">{totales.saldoPendiente}</span>
        </div>
        <div className="exc-fin-footer" style={{ padding: '12px 20px', background: '#f8fafc', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="exc-btn-outline" onClick={onPrint}>
            <Printer size={14} /> Imprimir
          </button>
        </div>
      </div>
    ) : (
      <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: 12, marginTop: 20, color: '#64748b' }}>
        <Info size={24} style={{ marginBottom: 10, opacity: 0.5 }} />
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#475569' }}>Seleccione un periodo y presione Generar</h3>
        <p style={{ fontSize: 14 }}>Se mostrará el resumen financiero consolidado del periodo.</p>
      </div>
    )}
  </div>
);

/* ═══════════════════════════════════════════════════════════
   TAB 6 – FORMATO DE SALARIOS
   ═══════════════════════════════════════════════════════════ */
interface SalariosToolbarProps {
  periodo: string;
  onPeriodoChange: (v: string) => void;
  onGenerar: () => void;
  onPrint: () => void;
  hasData: boolean;
}
export const SalariosToolbar: React.FC<SalariosToolbarProps> = ({
  periodo, onPeriodoChange, onGenerar, onPrint, hasData,
}) => (
  <div className="exc-toolbar-row exc-toolbar-col">
    <div className="exc-toolbar-head">
      <div>
        <h2 className="exc-section-title">
          <DollarSign size={20} color="#0165B0" />
          Formato de Salarios
        </h2>
        <p className="exc-section-desc">Reporte de salarios base vs excedentes por funcionario</p>
      </div>
    </div>
    <div className="exc-filter-grid">
      <div className="cons-input-group" style={{ minWidth: 260, flex: 1 }}>
        <label className="cons-floating-label">Periodo</label>
        <div className="cons-input-wrapper">
          <input className="cons-input" type="month" value={periodo} onChange={e => onPeriodoChange(e.target.value)} />
        </div>
      </div>
      <button className="exc-btn-primary" style={{ height: 42, marginTop: 18 }} onClick={onGenerar}>Generar</button>
      {hasData && (
        <button className="exc-btn-outline" style={{ height: 42, marginTop: 18 }} onClick={onPrint}>
          <Printer size={14} /> Imprimir
        </button>
      )}
    </div>
  </div>
);

export const SalariosHead: React.FC = () => (
  <tr>
    <th>FUNCIONARIO</th>
    <th>CÉDULA</th>
    <th>SALARIO BASE</th>
    <th>EXCEDENTES</th>
    <th>TOTAL</th>
  </tr>
);

interface SalariosTablaProps {
  items: FormatoSalario[];
  loading: boolean;
}
export const SalariosTabla: React.FC<SalariosTablaProps> = ({ items, loading }) => {
  if (loading) return <tr><td colSpan={5} className="table-empty">Cargando datos...</td></tr>;
  if (items.length === 0) return <tr><td colSpan={5} className="table-empty">Sin datos de salarios</td></tr>;
  return (
    <>
      {items.map(r => (
        <tr key={r.id}>
          <td className="bold">{r.funcionario}</td>
          <td>{r.cedula}</td>
          <td className="bold">{r.salarioBase}</td>
          <td className="bold">{r.excedentes}</td>
          <td className="bold" style={{ color: '#0165B0' }}>{r.total}</td>
        </tr>
      ))}
    </>
  );
};

/* ═══════════════════════════════════════════════════════════
   TAB 7 – RELIQUIDAR EXCEDENTES
   ═══════════════════════════════════════════════════════════ */
interface ReliquidarProps {
  numeroRecibo: string;
  onChange: (v: string) => void;
  onBuscar: () => void;
  onReliquidar: () => void;
  info: ReliquidarInfo | null;
  error: string | null;
  loading: boolean;
}
export const ReliquidarPanel: React.FC<ReliquidarProps> = ({
  numeroRecibo, onChange, onBuscar, onReliquidar, info, error, loading,
}) => (
  <div className="exc-reliquidar-wrapper">
    <div className="exc-toolbar-head">
      <div>
        <h2 className="exc-section-title">
          <RefreshCw size={20} color="#0165B0" />
          Reliquidar Excedentes
        </h2>
        <p className="exc-section-desc">Busque un recibo por número para reliquidar sus excedentes</p>
      </div>
    </div>
    <div className="exc-filter-grid">
      <div className="cons-input-group" style={{ minWidth: 260, flex: 1 }}>
        <label className="cons-floating-label">Número de Recibo</label>
        <div className="cons-input-wrapper">
          <input
            className="cons-input"
            placeholder="Ej: REC-001"
            value={numeroRecibo}
            onChange={e => onChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onBuscar()}
          />
        </div>
      </div>
      <button className="exc-btn-primary" style={{ height: 42, marginTop: 18 }} onClick={onBuscar} disabled={loading || !numeroRecibo.trim()}>
        <Search size={15} /> {loading ? 'Buscando...' : 'Buscar'}
      </button>
    </div>
    {error && <div style={{ marginTop: 16, padding: '12px 16px', background: '#fef2f2', color: '#b91c1c', borderRadius: 8, fontSize: 14 }}>{error}</div>}
    {info && (
      <div style={{ marginTop: 24, padding: 20, border: '1px solid #e2e8f0', borderRadius: 12, background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, color: '#0165B0', fontWeight: 600 }}>
          <Info size={16} />
          <span>Información del Recibo</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 24 }}>
          <div><div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Recibo</div><div className="bold">{info.recibo}</div></div>
          <div><div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Funcionario</div><div className="bold">{info.funcionario}</div></div>
          <div><div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Valor Actual</div><div className="bold">{info.valorActual}</div></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="exc-btn-primary" onClick={onReliquidar}>
            <RefreshCw size={14} /> Reliquidar
          </button>
        </div>
      </div>
    )}
  </div>
);

/* ═══════════════════════════════════════════════════════════
   TAB 8 – EXCEDENTES SIN CANCELAR
   ═══════════════════════════════════════════════════════════ */
interface SinCancelarToolbarProps {
  totalCount: number;
  onRefresh: () => void;
}
export const SinCancelarToolbar: React.FC<SinCancelarToolbarProps> = ({ totalCount, onRefresh }) => (
  <div className="exc-toolbar-row exc-toolbar-col">
    <div className="exc-toolbar-head">
      <div>
        <h2 className="exc-section-title">
          <XCircle size={20} color="#dc2626" />
          Excedentes sin Cancelar
        </h2>
        <p className="exc-section-desc">Excedentes pendientes de cancelación</p>
      </div>
      <button className="exc-btn-outline" onClick={onRefresh}>
        <RefreshCw size={14} /> Actualizar
      </button>
    </div>
    <div className="exc-error-bar" style={{ background: '#fef2f2', color: '#b91c1c', padding: '10px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
      <AlertCircle size={14} />
      <span><strong>{totalCount.toLocaleString()}</strong> excedente(s) sin cancelar</span>
    </div>
  </div>
);

export const SinCancelarHead: React.FC = () => (
  <tr>
    <th>RECIBO</th>
    <th>FUNCIONARIO</th>
    <th>FECHA GENERACIÓN</th>
    <th>VALOR</th>
    <th>DÍAS PENDIENTE</th>
  </tr>
);

interface SinCancelarTablaProps {
  items: ExcedenteSinCancelar[];
  loading: boolean;
}
export const SinCancelarTabla: React.FC<SinCancelarTablaProps> = ({ items, loading }) => {
  if (loading) return <tr><td colSpan={5} className="table-empty">Cargando datos...</td></tr>;
  if (items.length === 0) return <tr><td colSpan={5} className="table-empty">Sin excedentes pendientes</td></tr>;
  return (
    <>
      {items.map(r => (
        <tr key={r.id}>
          <td style={{ color: '#64748b' }}>{r.recibo}</td>
          <td className="bold">{r.funcionario}</td>
          <td>{r.fechaGeneracion}</td>
          <td className="bold">{r.valor}</td>
          <td><span className="exc-pill-badge" style={{ background: '#fee2e2', color: '#b91c1c' }}>{r.diasPendiente} días</span></td>
        </tr>
      ))}
    </>
  );
};
