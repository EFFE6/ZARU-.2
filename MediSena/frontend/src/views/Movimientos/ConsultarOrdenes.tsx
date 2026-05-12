import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, Download, Printer, RefreshCw, Filter } from 'lucide-react';
import DataTable from '../../components/DataTable';
import '../../styles/Movimientos/ConsultarOrdenes.css';

interface OrdenConsulta {
  id: number;
  numero: number;
  fecha: string;
  paciente: string;
  servicio: string | number;
  contratista: string;
  valor: number;
  estado: string;
}

const AÑOS = ['2024', '2025', '2026'];
const ESTADOS = ['Todos', 'Activa', 'Completada', 'Pendiente', 'Cancelada'];

const ConsultarOrdenes: React.FC = () => {
  const [data, setData] = useState<OrdenConsulta[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [filters, setFilters] = useState({
    año: '2026',
    estado: 'Todos',
    query: ''
  });

  const handleSearch = () => {
    // Aquí iría la lógica de API. Por ahora simulamos una búsqueda.
    setHasSearched(true);
    // setData(...)
  };

  return (
    <div className="mov-view-container">
      {/* Panel de Filtros según captura */}
      <div className="co-filters-panel-new">
        <div className="co-filters-title">
          <Filter size={18} />
          <span>Filtros de Búsqueda</span>
        </div>

        <div className="co-filters-row-new">
          <div className="co-fieldset-new">
            <label className="co-legend-new">Año</label>
            <div className="co-select-wrap-new">
              <select 
                className="co-select-new" 
                value={filters.año}
                onChange={e => setFilters({...filters, año: e.target.value})}
              >
                {AÑOS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <ChevronDown size={16} className="co-select-icon-new" />
            </div>
          </div>

          <div className="co-fieldset-new">
            <label className="co-legend-new">Estado</label>
            <div className="co-select-wrap-new">
              <select 
                className="co-select-new" 
                value={filters.estado}
                onChange={e => setFilters({...filters, estado: e.target.value})}
              >
                {ESTADOS.map(es => <option key={es} value={es}>{es}</option>)}
              </select>
              <ChevronDown size={16} className="co-select-icon-new" />
            </div>
          </div>

          <div className="co-search-wrapper-new">
            <Search size={18} className="co-search-icon-new" />
            <input 
              type="text" 
              className="co-search-input-new" 
              placeholder="Buscar por número de orden, paciente o servicio..." 
              value={filters.query}
              onChange={e => setFilters({...filters, query: e.target.value})}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
        </div>
      </div>

      {/* Toolbar de Exportación (Solo se muestra si se ha buscado) */}
      {hasSearched && (
        <div className="oa-toolbar-header-row animate-fade-in" style={{ marginTop: '20px' }}>
          <div className="oa-toolbar-actions-row" style={{ width: '100%', justifyContent: 'flex-end' }}>
            <div className="oa-header-actions">
              <button className="oa-btn-refresh"><Download size={14} /> Exportar</button>
              <button className="oa-btn-refresh" onClick={() => window.print()}><Printer size={14} /> Imprimir</button>
              <button className="oa-btn-refresh" onClick={handleSearch}><RefreshCw size={14} /> Actualizar</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: hasSearched ? '10px' : '20px' }}>
        <DataTable
          headers={
            <tr>
              <th>NÚMERO ORDEN</th>
              <th>FECHA</th>
              <th>PACIENTE</th>
              <th>SERVICIO</th>
              <th>CONTRATISTA</th>
              <th>VALOR</th>
              <th>ESTADO</th>
            </tr>
          }
        >
          {data.length === 0 ? (
            <tr>
              <td colSpan={7} className="table-empty">
                {hasSearched ? 'No se encontraron resultados para su búsqueda.' : 'Ingrese los filtros y presione Enter para buscar.'}
              </td>
            </tr>
          ) : data.map(o => (
            <tr key={o.id}>
              <td className="bold" style={{ color: '#0165B0' }}>#{o.numero}</td>
              <td>{o.fecha}</td>
              <td className="bold">{o.paciente}</td>
              <td>{o.servicio}</td>
              <td>{o.contratista}</td>
              <td className="bold">${o.valor.toLocaleString()}</td>
              <td>{o.estado}</td>
            </tr>
          ))}
        </DataTable>
      </div>
    </div>
  );
};

export default ConsultarOrdenes;
