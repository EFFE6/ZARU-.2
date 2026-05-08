import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import DataTable from '../../components/DataTable';
import { Search } from 'lucide-react';
import '../../styles/Movimientos/OrdenAtencion.css';
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
const ESTADOS = ['Todos', 'Completada', 'Pendiente', 'Cancelada'];

const MOCK_CONSULTAS: OrdenConsulta[] = [
  { id: 1, numero: 668, fecha: '21/02/2026', paciente: 'ROSALINA PALMA SANDOVAL', servicio: 'Consulta General', contratista: 'ABRIL GALEANO GIOVANNI', valor: 120000, estado: 'A' },
  { id: 2, numero: 667, fecha: '21/02/2026', paciente: 'CARLOS MESA RIOS', servicio: 'Especializada', contratista: 'CLAUDIA BASSIL AMIN', valor: 250000, estado: 'A' },
  { id: 3, numero: 666, fecha: '20/02/2026', paciente: 'MARIA GARCIA LOPEZ', servicio: 'Urgencia', contratista: 'DURANGO LARIOS MARIA B.', valor: 380000, estado: 'C' },
  { id: 4, numero: 665, fecha: '19/02/2026', paciente: 'ANA LUCIA TORRES', servicio: 'Control', contratista: 'CLAUDIA BASSIL AMIN', valor: 80000, estado: 'P' },
  { id: 5, numero: 664, fecha: '18/02/2026', paciente: 'JUAN PEREZ MONTOYA', servicio: 'Consulta General', contratista: 'Piedad Viana Marzola', valor: 120000, estado: 'C' },
  { id: 6, numero: 663, fecha: '17/02/2026', paciente: 'PEDRO HERRERA ZULUAGA', servicio: 'Especializada', contratista: 'ABRIL GALEANO GIOVANNI', valor: 310000, estado: 'A' },
  { id: 7, numero: 662, fecha: '16/02/2026', paciente: 'LUCIA MARTINEZ VEGA', servicio: 'Urgencia', contratista: 'CLAUDIA BASSIL AMIN', valor: 450000, estado: 'X' },
];

const ConsultarOrdenes: React.FC = () => {
  const [data] = useState<OrdenConsulta[]>(MOCK_CONSULTAS);
  const { search } = useOutletContext<{ search: string }>();
  const [año, setAño] = useState('2026');
  const [estado, setEstado] = useState('Todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filtered = useMemo(() => {
    return data.filter(o => {
      if (estado !== 'Todos') {
        const estadoMap: Record<string, string> = { Completada: 'C', Pendiente: 'P', Cancelada: 'X' };
        if (o.estado !== estadoMap[estado]) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          String(o.numero).includes(q) ||
          o.paciente.toLowerCase().includes(q) ||
          String(o.servicio).toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [data, estado, search]);

  const total = filtered.length;
  const completadas = filtered.filter(o => o.estado === 'C').length;
  const pendientes  = filtered.filter(o => o.estado === 'P').length;
  const valorTotal  = filtered.reduce((acc, o) => acc + (o.valor || 0), 0);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const current = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const visiblePages = useMemo(() => {
    const delta = 2, start = Math.max(1, currentPage - delta), end = Math.min(totalPages, currentPage + delta);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  const estadoLabel: Record<string, string> = { A: 'A', C: 'C', P: 'P', X: 'X' };

  const tableHeaders = (
    <tr>
      <th>Número Orden</th>
      <th>Fecha</th>
      <th>Paciente</th>
      <th>Servicio</th>
      <th>Contratista</th>
      <th>Valor</th>
      <th>Estado</th>
    </tr>
  );

  return (
    <>

              {/* Filtros */}
              <div className="co-filters-box">
                <div className="co-filters-label">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                  Filtros de Búsqueda
                </div>
                <div className="co-filters-row">
                  <div className="co-filter-group">
                    <label className="co-filter-label">Año</label>
                    <select className="co-filter-select" value={año} onChange={e => setAño(e.target.value)}>
                      {AÑOS.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <div className="co-filter-group">
                    <label className="co-filter-label">Estado</label>
                    <select className="co-filter-select" value={estado} onChange={e => setEstado(e.target.value)}>
                      {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>
                </div>
              </div>


              {/* Stats */}
              <div className="co-stats-row">
                <span className="co-stat-pill blue">Total: {total} órdenes</span>
                <span className="co-stat-pill green">Completadas: {completadas}</span>
                <span className="co-stat-pill orange">Pendientes: {pendientes}</span>
                <span className="co-stat-pill teal">Valor Total: ${valorTotal.toLocaleString()}</span>
              </div>

              {/* Tabla con DataTable */}
              <DataTable
                headers={tableHeaders}
                itemsPerPage={itemsPerPage}
                setItemsPerPage={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                totalPages={totalPages}
                visiblePages={visiblePages}
              >
                {current.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="table-empty">
                      No hay órdenes para el año {año} con los filtros seleccionados
                    </td>
                  </tr>
                ) : (
                  current.map(o => (
                    <tr key={o.id}>
                      <td className="co-col-num">{o.numero}</td>
                      <td>{o.fecha}</td>
                      <td className="co-col-paciente">{o.paciente}</td>
                      <td>{o.servicio}</td>
                      <td>{o.contratista}</td>
                      <td>${o.valor.toLocaleString()}</td>
                      <td>
                        <span className={`co-estado-pill ${o.estado === 'C' ? 'green' : o.estado === 'P' ? 'orange' : o.estado === 'X' ? 'red' : 'gray'}`}>
                          {estadoLabel[o.estado] || o.estado}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </DataTable>

    </>
  );
};

export default ConsultarOrdenes;
