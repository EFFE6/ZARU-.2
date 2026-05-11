import React from 'react';
import { Search } from 'lucide-react';
import { REGIONALES_EXC, ImprimirExcedente } from './types';

interface Props {
  periodo: string;
  regional: string;
  onPeriodoChange: (v: string) => void;
  onRegionalChange: (v: string) => void;
  onBuscar: () => void;
  items: ImprimirExcedente[];
  loading: boolean;
  selected: Set<number>;
  onToggle: (id: number) => void;
  onToggleAll: () => void;
}

const ImprimirExcedentes: React.FC<Props> = ({
  periodo, regional, onPeriodoChange, onRegionalChange, onBuscar,
  items, loading, selected, onToggle, onToggleAll
}) => (
  <div style={{ padding: '0 4px' }}>
    <div className="exc-toolbar-row exc-toolbar-col">
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
              {REGIONALES_EXC.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <button className="exc-btn-primary" style={{ height: 42, marginTop: 18 }} onClick={onBuscar}>
          <Search size={15} /> Buscar
        </button>
      </div>
    </div>

    {/* La tabla se renderiza en el index usando DataTable, 
        aquí solo devolvemos el contenido de las filas si es necesario, 
        o podemos mover el DataTable aquí para que sea más independiente */}
  </div>
);

export default ImprimirExcedentes;
