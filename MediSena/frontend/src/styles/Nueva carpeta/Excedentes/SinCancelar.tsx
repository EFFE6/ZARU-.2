import React from 'react';
import { XCircle, RefreshCw, AlertCircle } from 'lucide-react';

interface Props {
  totalCount: number;
  onRefresh: () => void;
}

const SinCancelar: React.FC<Props> = ({ totalCount, onRefresh }) => (
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

export default SinCancelar;
