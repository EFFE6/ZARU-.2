import React from 'react';
import { FileText, Printer, Download } from 'lucide-react';

interface Props {
  periodo: string;
  onPeriodoChange: (v: string) => void;
  onGenerar: () => void;
  onPrint: () => void;
  onExport: () => void;
}

const RelacionRecibos: React.FC<Props> = ({
  periodo, onPeriodoChange, onGenerar, onPrint, onExport,
}) => (
  <div style={{ padding: '0 4px' }}>
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
  </div>
);

export default RelacionRecibos;
