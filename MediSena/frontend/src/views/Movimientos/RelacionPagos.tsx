import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Download, Printer, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import DataTable from '../../components/DataTable';
import '../../styles/Movimientos/RelacionPagos.css';

interface RelacionPago {
  id: number;
  numero: number;
  contratista: string;
  cuentaCobro: string;
  fechaPago: string;
  valor: string;
  formaPago: string;
  estado: string;
}

const MOCK_PAGOS: RelacionPago[] = [
  // { id: 1, numero: 1001, contratista: 'Juan Perez', cuentaCobro: 'CC-001', fechaPago: '01/03/2026', valor: '$1,500,000', formaPago: 'Transferencia', estado: 'Pagado' },
];

const RelacionPagosView: React.FC = () => {
  const [pagos] = useState<RelacionPago[]>(MOCK_PAGOS);
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  const filtered = useMemo(() => {
    if (!appliedSearch) return pagos;
    const q = appliedSearch.toLowerCase();
    return pagos.filter(p =>
      String(p.numero).includes(q) ||
      p.contratista?.toLowerCase().includes(q) ||
      p.cuentaCobro?.toLowerCase().includes(q)
    );
  }, [pagos, appliedSearch]);

  const totalValor = filtered.reduce((sum, p) => sum + parseFloat(p.valor.replace(/[^0-9.-]/g, '') || '0'), 0);

  return (
    <div className="rp-container">
      <div className="rp-toolbar">
        {/* ── Search Section ── */}
        <div className="rp-search-section">
          <div className="rp-search-box">
            <div className="rp-search-input-wrapper">
              <svg className="rp-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
              <input 
                type="text" 
                placeholder="Buscar por número, contratista..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && setAppliedSearch(searchTerm)}
              />
            </div>
            <button className="rp-btn-buscar" onClick={() => setAppliedSearch(searchTerm)}>
              Buscar
            </button>
          </div>
        </div>

        <div className="rp-header-actions">
          <button className="rp-action-btn grey">
            <Download size={16} /> Exportar
          </button>
          <button className="rp-action-btn grey">
            <Printer size={16} /> Imprimir
          </button>
          <button className="rp-action-btn outline">
            <RefreshCw size={16} /> Actualizar
          </button>
        </div>
      </div>

      {/* ── Table Section ── */}
      <div className="rp-table-container">
        <DataTable
          headers={
            <tr>
              <th>Número</th>
              <th>Contratista</th>
              <th>Cuenta Cobro</th>
              <th>Fecha Pago</th>
              <th>Valor</th>
              <th>Forma Pago</th>
              <th>Estado</th>
            </tr>
          }
        >
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={7} className="rp-table-empty">
                No hay pagos registrados
              </td>
            </tr>
          ) : (
            filtered.map(p => (
              <tr key={p.id}>
                <td>{p.numero}</td>
                <td>{p.contratista}</td>
                <td>{p.cuentaCobro}</td>
                <td>{p.fechaPago}</td>
                <td>{p.valor}</td>
                <td>{p.formaPago}</td>
                <td>
                  <span className={`rp-status-badge ${p.estado.toLowerCase()}`}>
                    {p.estado}
                  </span>
                </td>
              </tr>
            ))
          )}
        </DataTable>
      </div>

      {/* ── Footer ── */}
      <div className="rp-footer">
        <div className="rp-footer-pills">
          <div className="rp-pill dark">Total: {filtered.length} pagos</div>
          <div className="rp-pill green">En esta página: ${totalValor.toLocaleString('es-CO')}</div>
        </div>
        
        <div className="rp-pagination">
          <span className="rp-pag-label">Filas por página:</span>
          <select className="rp-pag-select">
            <option>10</option>
            <option>20</option>
            <option>50</option>
          </select>
          <span className="rp-pag-info">0-0 de 0</span>
          <div className="rp-pag-arrows">
            <button disabled><ChevronLeft size={18} /></button>
            <button disabled><ChevronRight size={18} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RelacionPagosView;
