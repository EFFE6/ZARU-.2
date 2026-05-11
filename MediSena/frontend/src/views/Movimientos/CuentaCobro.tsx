import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import DataTable from '../../components/DataTable';
import { Eye, ChevronDown, Check, List, RotateCw, Plus, Search } from 'lucide-react';
import { OJOIcon } from '../../components/Icons';
import SearchBar from '../../components/SearchBar';
import '../../styles/Movimientos/OrdenAtencion.css';
import '../../styles/Movimientos/CuentaCobro.css';

interface CuentaCobro {
  id: number;
  numero: number;
  contratista: string;
  periodo: string;
  fecha: string;
  valor: string;
  estado: string;
}

const ESTADOS_CC = ['Todos', 'PENDIENTE', 'APROBADA', 'RECHAZADA'];

const MOCK_CUENTAS: CuentaCobro[] = [
  { id: 1, numero: 101, contratista: 'CLAUDIA BASSIL AMIN', periodo: '2026-01-31', fecha: '01/02/2026', valor: '$1.200.000', estado: 'APROBADA' },
  { id: 2, numero: 102, contratista: 'Piedad Viana Marzola', periodo: '2026-01-31', fecha: '05/02/2026', valor: '$850.000', estado: 'PENDIENTE' },
  { id: 3, numero: 103, contratista: 'ABRIL GALEANO GIOVANNI', periodo: '2026-02-28', fecha: '10/02/2026', valor: '$2.350.000', estado: 'PENDIENTE' },
  { id: 4, numero: 104, contratista: 'CLAUDIA BASSIL AMIN', periodo: '2026-02-28', fecha: '15/02/2026', valor: '$970.000', estado: 'RECHAZADA' },
  { id: 5, numero: 105, contratista: 'Piedad Viana Marzola', periodo: '2026-03-31', fecha: '20/02/2026', valor: '$1.540.000', estado: 'APROBADA' },
];

const EstadoCCBadge: React.FC<{ estado: string }> = ({ estado }) => {
  const map: Record<string, string> = {
    PENDIENTE: 'cc-badge-pendiente',
    APROBADA: 'cc-badge-aprobada',
    RECHAZADA: 'cc-badge-rechazada',
  };
  return <span className={`cc-estado-badge ${map[estado] ?? 'cc-badge-pendiente'}`}>{estado}</span>;
};

const formatPeriodo = (iso: string) => {
  try {
    const d = new Date(iso);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  } catch { return iso; }
};

const CuentaCobroView: React.FC = () => {
  const [cuentas] = useState<CuentaCobro[]>(MOCK_CUENTAS);
  const { search, setSearch } = useOutletContext<{ search: string, setSearch: (v: string) => void }>();
  const [estadoFilter, setEstadoFilter] = useState('Todos');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filtered = useMemo(() => {
    return cuentas.filter(c => {
      const matchSearch =
        String(c.numero).includes(search) ||
        c.contratista.toLowerCase().includes(search.toLowerCase());
      const matchEstado = estadoFilter === 'Todos' || c.estado === estadoFilter;
      return matchSearch && matchEstado;
    });
  }, [cuentas, search, estadoFilter, fechaInicio, fechaFin]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const current = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const visiblePages = useMemo(() => {
    const delta = 2, start = Math.max(1, currentPage - delta), end = Math.min(totalPages, currentPage + delta);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  return (
    <div className="cc-view-container">
      {/* Figma Header */}
      <div className="cc-header-figma">
        <div className="cc-header-left">
          <div className="cc-title-row">
            <List className="cc-title-icon" size={24} />
            <h1 className="cc-main-title">Cuentas de Cobro</h1>
          </div>
          <p className="cc-main-subtitle">Gestione las cuentas de cobro de contratistas</p>
        </div>
        <div className="cc-header-right">
          <button className="cc-btn-actualizar">
            <RotateCw size={16} /> Actualizar
          </button>
          <button className="cc-btn-nueva">
            <Plus size={18} /> Nueva Cuenta
          </button>
        </div>
      </div>

      {/* Figma Filters */}
      <div className="cc-toolbar-figma">
        <div className="cc-filters-top">
          <div className="cc-search-wrap-figma">
            <Search size={18} className="cc-search-icon-figma" />
            <input 
              type="text" 
              placeholder="Buscar..." 
              className="cc-search-input-figma"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <fieldset className="cc-fieldset cc-field-estado">
            <legend>Estado</legend>
            <div className="cc-select-wrap-figma">
              <select 
                value={estadoFilter}
                onChange={e => { setEstadoFilter(e.target.value); setCurrentPage(1); }}
              >
                {ESTADOS_CC.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
              <ChevronDown size={16} className="cc-select-icon-figma" />
            </div>
          </fieldset>

          <button className="cc-btn-limpiar-figma" onClick={() => {
            setEstadoFilter('Todos');
            setSearch('');
            setFechaInicio(''); setFechaFin('');
          }}>
            Limpiar Filtros
          </button>
        </div>

        <div className="cc-filters-bottom">
          <fieldset className="cc-fieldset cc-field-fecha">
            <legend>Fecha Inicio</legend>
            <input 
              type="date" 
              value={fechaInicio}
              onChange={e => setFechaInicio(e.target.value)}
            />
          </fieldset>

          <fieldset className="cc-fieldset cc-field-fecha">
            <legend>Fecha Fin</legend>
            <input 
              type="date" 
              value={fechaFin}
              onChange={e => setFechaFin(e.target.value)}
            />
          </fieldset>

          <span className="cc-no-fecha-text">
            {!fechaInicio && !fechaFin ? 'Sin filtro de fecha' : ''}
          </span>
        </div>
      </div>

      <DataTable
        headers={
          <tr>
            <th>Número</th>
            <th>Contratista</th>
            <th>Período</th>
            <th>Fecha</th>
            <th>Valor</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        }
        itemsPerPage={itemsPerPage}
        setItemsPerPage={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        visiblePages={visiblePages}
      >
        {current.length === 0 ? (
          <tr><td colSpan={7} className="table-empty">No se encontraron cuentas.</td></tr>
        ) : current.map(c => (
          <tr key={c.id}>
            <td className="cc-table-num">{c.numero}</td>
            <td>{c.contratista}</td>
            <td>{formatPeriodo(c.periodo)}</td>
            <td>{c.fecha}</td>
            <td>{c.valor}</td>
            <td><EstadoCCBadge estado={c.estado} /></td>
            <td>
              <div className="oa-actions-cell">
                <button className="cc-action-btn cc-btn-view" title="Ver">
                  <OJOIcon size={20} />
                </button>
                <button className="cc-action-btn cc-btn-approve" title="Aprobar">
                  <Check size={16} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
};

export default CuentaCobroView;
