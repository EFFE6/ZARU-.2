import React from 'react';
import { Building2, Printer, Info } from 'lucide-react';
import { FinancieroTotales } from './types';

interface Props {
  periodo: string;
  onPeriodoChange: (v: string) => void;
  onGenerar: () => void;
  onPrint: () => void;
  totales: FinancieroTotales | null;
  loading: boolean;
}

const FormatoFinanciero: React.FC<Props> = ({
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

export default FormatoFinanciero;
