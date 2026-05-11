import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { ExcedenteMayor30 } from './types';

interface Props {
  totalCount: number;
  onRefresh: () => void;
}

const Mayor30Dias: React.FC<Props> = ({ totalCount, onRefresh }) => (
  <div style={{ padding: '0 4px' }}>
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
  </div>
);

export default Mayor30Dias;
