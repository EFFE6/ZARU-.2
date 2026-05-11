import React from 'react';
import { RefreshCw, Search, Info } from 'lucide-react';
import { ReliquidarInfo } from './types';

interface Props {
  numeroRecibo: string;
  onChange: (v: string) => void;
  onBuscar: () => void;
  onReliquidar: () => void;
  info: ReliquidarInfo | null;
  error: string | null;
  loading: boolean;
}

const ReliquidarExcedentes: React.FC<Props> = ({
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

export default ReliquidarExcedentes;
