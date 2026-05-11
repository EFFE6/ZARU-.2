import React from 'react';
import { DollarSign, Printer } from 'lucide-react';

interface Props {
  periodo: string;
  onPeriodoChange: (v: string) => void;
  onGenerar: () => void;
  onPrint: () => void;
  hasData: boolean;
}

const FormatoSalarios: React.FC<Props> = ({
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

export default FormatoSalarios;
