import React from 'react';
import {
  Printer, RefreshCw, Download, Search, AlertTriangle,
  FileText, DollarSign, TrendingUp, Building2, XCircle, AlertCircle, Info,
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
  <div className="content-toolbar exc-toolbar-col">
    <div className="exc-toolbar-head">
      <div>
        <h2 className="exc-section-title">
          <Printer size={22} color="#0165B0" />
          Imprimir Excedentes
        </h2>
        <p className="exc-section-desc">Imprima excedentes por periodo y regional</p>
      </div>
    </div>
    <div className="exc-filter-grid">
      <div className="cons-input-group" style={{ minWidth: 220 }}>
        <label className="cons-floating-label">Periodo</label>
        <div className="cons-input-wrapper">
          <input className="cons-input" type="month" value={periodo} onChange={e => onPeriodoChange(e.target.value)} />
        </div>
      </div>
      <div className="cons-input-group" style={{ minWidth: 240 }}>
        <label className="cons-floating-label">Regional</label>
        <div className="cons-input-wrapper">
          <select className="cons-input cons-select" value={regional} onChange={e => onRegionalChange(e.target.value)}>
            {REGIONALES_EXC.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>
      </div>
      <button className="cons-btn-consultar" onClick={onBuscar}>
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
    <tr><td colSpan={6} className="table-empty">Cargando datos...</td></tr>
  );
  return (
    <>
      {items.length === 0 ? (
        <tr><td colSpan={6} className="table-empty">No hay excedentes en este periodo</td></tr>
      ) : items.map(r => (
        <tr key={r.id}>
          <td><input type="checkbox" className="exc-checkbox" checked={selected.has(r.id)} onChange={() => onToggle(r.id)} /></td>
          <td className="col-numero">{r.recibo}</td>
          <td className="exc-col-nombre">{r.funcionario}</td>
          <td>{r.periodo}</td>
          <td className="mov-col-valor">{r.valor}</td>
          <td><span className="mov-estado-badge pendiente">{r.estado}</span></td>
        </tr>
      ))}
    </>
  );
};

export const ImprimirHead: React.FC<{ allSelected: boolean; onToggleAll: () => void }> = ({ allSelected, onToggleAll }) => (
  <tr>
    <th style={{ width: 40 }}>
      <input type="checkbox" className="exc-checkbox" checked={allSelected} onChange={onToggleAll} />
    </th>
    <th>Recibo</th>
    <th>Funcionario</th>
    <th>Periodo</th>
    <th>Valor</th>
    <th>Estado</th>
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
  <div className="content-toolbar exc-toolbar-col">
    <div className="exc-toolbar-head">
      <div>
        <h2 className="exc-section-title">
          <AlertTriangle size={22} color="#f97316" />
          Excedentes Mayor a 30 Días
        </h2>
        <p className="exc-section-desc">Excedentes pendientes de cobro con más de 30 días</p>
      </div>
      <div className="usuarios-toolbar-right">
        <button className="btn-actualizar" onClick={onRefresh}>
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>
    </div>
    <div className="exc-warning-bar">
      <AlertTriangle size={14} color="#d97706" />
      <span><strong>{totalCount.toLocaleString()}</strong> excedente(s) con más de 30 días pendientes de cobro</span>
    </div>
  </div>
);

export const Mayor30Head: React.FC = () => (
  <tr>
    <th>Recibo</th>
    <th>Funcionario</th>
    <th>Fecha Generación</th>
    <th>Días Transcurridos</th>
    <th>Valor</th>
    <th>Estado</th>
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
          <td className="col-numero">{r.recibo}</td>
          <td className="exc-col-nombre">{r.funcionario}</td>
          <td>{r.fechaGeneracion}</td>
          <td><span className="exc-dias-badge">{r.diasTranscurridos} días</span></td>
          <td className="mov-col-valor">{r.valor}</td>
          <td><span className="mov-estado-badge pendiente">{r.estado}</span></td>
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
  <div className="content-toolbar exc-toolbar-col">
    <div className="exc-toolbar-head">
      <div>
        <h2 className="exc-section-title">
          <FileText size={22} color="#0165B0" />
          Relación de Recibos de Pago
        </h2>
        <p className="exc-section-desc">Genere la relación de recibos por periodo</p>
      </div>
      <div className="usuarios-toolbar-right">
        <button className="mov-btn-secondary" onClick={onPrint}>
          <Printer size={14} /> Imprimir
        </button>
        <button className="mov-btn-secondary" onClick={onExport}>
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
      <button className="cons-btn-consultar" onClick={onGenerar}>
        Generar Relación
      </button>
    </div>
  </div>
);

export const RelacionHead: React.FC = () => (
  <tr>
    <th>Recibo</th>
    <th>Funcionario</th>
    <th>Cédula</th>
    <th>Dependencia</th>
    <th>Valor</th>
    <th>Estado</th>
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
          <td className="col-numero">{r.recibo}</td>
          <td className="exc-col-nombre">{r.funcionario}</td>
          <td>{r.cedula}</td>
          <td>{r.dependencia}</td>
          <td className="mov-col-valor">{r.valor}</td>
          <td><span className="mov-estado-badge pendiente">{r.estado}</span></td>
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
  <div className="content-toolbar exc-toolbar-col" style={{ padding: 0 }}>
    <div className="exc-toolbar-head">
      <div>
        <h2 className="exc-section-title">
          <Building2 size={22} color="#0165B0" />
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
      <button className="cons-btn-consultar" onClick={onGenerar} disabled={loading}>
        {loading ? 'Generando...' : 'Generar'}
      </button>
    </div>
    {totales ? (
      <div className="exc-fin-panel">
        <div className="exc-fin-row-head">
          <span>Concepto</span>
          <span style={{ textAlign: 'right' }}>Valor</span>
        </div>
        <div className="exc-fin-row">
          <span className="exc-fin-label">Total Excedentes Generados</span>
          <span className="exc-fin-value">{totales.totalExcedentes}</span>
        </div>
        <div className="exc-fin-row">
          <span className="exc-fin-label">Total Pagado</span>
          <span className="exc-fin-value">{totales.totalPagado}</span>
        </div>
        <div className="exc-fin-row exc-fin-row-highlight">
          <span className="exc-fin-label">Saldo Pendiente</span>
          <span className="exc-fin-value">{totales.saldoPendiente}</span>
        </div>
        <div className="exc-fin-footer">
          <button className="mov-btn-secondary" onClick={onPrint}>
            <Printer size={14} /> Imprimir
          </button>
        </div>
      </div>
    ) : (
      <div className="cons-empty-state" style={{ minHeight: 180 }}>
        <div className="cons-empty-icon"><Info size={22} color="#94a3b8" /></div>
        <h3 className="cons-empty-title">Seleccione un periodo y presione Generar</h3>
        <p className="cons-empty-desc">Se mostrará el resumen financiero consolidado del periodo.</p>
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
  <div className="content-toolbar exc-toolbar-col">
    <div className="exc-toolbar-head">
      <div>
        <h2 className="exc-section-title">
          <DollarSign size={22} color="#0165B0" />
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
      <button className="cons-btn-consultar" onClick={onGenerar}>Generar</button>
      {hasData && (
        <button className="mov-btn-secondary" onClick={onPrint}>
          <Printer size={14} /> Imprimir
        </button>
      )}
    </div>
  </div>
);

export const SalariosHead: React.FC = () => (
  <tr>
    <th>Funcionario</th>
    <th>Cédula</th>
    <th>Salario Base</th>
    <th>Excedentes</th>
    <th>Total</th>
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
          <td className="exc-col-nombre">{r.funcionario}</td>
          <td>{r.cedula}</td>
          <td className="mov-col-valor">{r.salarioBase}</td>
          <td className="mov-col-valor">{r.excedentes}</td>
          <td className="mov-col-valor exc-total-cell">{r.total}</td>
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
          <RefreshCw size={22} color="#0165B0" />
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
            placeholder="Ej: 123"
            value={numeroRecibo}
            onChange={e => onChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onBuscar()}
          />
        </div>
      </div>
      <button className="cons-btn-consultar" onClick={onBuscar} disabled={loading || !numeroRecibo.trim()}>
        <Search size={15} /> {loading ? 'Buscando...' : 'Buscar'}
      </button>
    </div>
    {error && <div className="mov-result-box mov-result-err">{error}</div>}
    {info && (
      <div className="exc-reliquidar-info">
        <div className="exc-reliquidar-header">
          <Info size={14} color="#0165B0" />
          <span>Información del Recibo</span>
        </div>
        <div className="exc-reliquidar-body">
          <div><strong>Recibo:</strong> {info.recibo}</div>
          <div><strong>Funcionario:</strong> {info.funcionario}</div>
          <div><strong>Valor Actual:</strong> {info.valorActual}</div>
        </div>
        <div>
          <button className="exc-btn-reliquidar" onClick={onReliquidar}>
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
  <div className="content-toolbar exc-toolbar-col">
    <div className="exc-toolbar-head">
      <div>
        <h2 className="exc-section-title">
          <XCircle size={22} color="#dc2626" />
          Excedentes sin Cancelar
        </h2>
        <p className="exc-section-desc">Excedentes pendientes de cancelación</p>
      </div>
      <div className="usuarios-toolbar-right">
        <button className="btn-actualizar" onClick={onRefresh}>
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>
    </div>
    <div className="exc-error-bar">
      <AlertCircle size={14} color="#dc2626" />
      <span><strong>{totalCount.toLocaleString()}</strong> excedente(s) sin cancelar</span>
    </div>
  </div>
);

export const SinCancelarHead: React.FC = () => (
  <tr>
    <th>Recibo</th>
    <th>Funcionario</th>
    <th>Fecha Generación</th>
    <th>Valor</th>
    <th>Días Pendiente</th>
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
          <td className="col-numero">{r.recibo}</td>
          <td className="exc-col-nombre">{r.funcionario}</td>
          <td>{r.fechaGeneracion}</td>
          <td className="mov-col-valor">{r.valor}</td>
          <td><span className="exc-dias-badge">{r.diasPendiente} días</span></td>
        </tr>
      ))}
    </>
  );
};
