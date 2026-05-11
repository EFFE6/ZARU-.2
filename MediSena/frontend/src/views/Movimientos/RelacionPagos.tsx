import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Download, Printer, RefreshCw } from 'lucide-react';
import DataTable from '../../components/DataTable';
import '../../styles/Movimientos/OrdenAtencion.css';

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
  { id: 1, numero: 1001, contratista: 'Juan Perez', cuentaCobro: 'CC-001', fechaPago: '01/03/2026', valor: '$1,500,000', formaPago: 'Transferencia', estado: 'Pagado' },
  { id: 2, numero: 1002, contratista: 'Maria Lopez', cuentaCobro: 'CC-002', fechaPago: '05/03/2026', valor: '$2,100,000', formaPago: 'Cheque', estado: 'Pendiente' },
  { id: 3, numero: 1003, contratista: 'Carlos Sanchez', cuentaCobro: 'CC-003', fechaPago: '10/03/2026', valor: '$950,000', formaPago: 'Transferencia', estado: 'Pagado' },
];

const RelacionPagosView: React.FC = () => {
  const [pagos] = useState<RelacionPago[]>(MOCK_PAGOS);
  const { search } = useOutletContext<{ search: string }>();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filtered = useMemo(() => {
    return pagos.filter(p =>
      String(p.numero).includes(search) ||
      p.contratista?.toLowerCase().includes(search.toLowerCase())
    );
  }, [pagos, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const current = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const visiblePages = useMemo(() => {
    const delta = 2, start = Math.max(1, currentPage - delta), end = Math.min(totalPages, currentPage + delta);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  const paginaValor = current.reduce((sum, p) => sum + parseFloat(p.valor.replace(/[^0-9.-]/g, '')), 0);

  return (
    <div style={{ padding: '0 4px' }}>
      <div className="oa-table-toolbar" style={{ marginBottom: 20 }}>
        <span className="oa-table-toolbar-text">
          Listado de pagos registrados en el sistema
        </span>
        <div className="oa-table-toolbar-actions">
          <button className="oa-btn-refresh">
            <Download size={14} style={{ opacity: 0.6 }} /> Exportar
          </button>
          <button className="oa-btn-refresh" onClick={() => window.print()}>
            <Printer size={14} style={{ opacity: 0.6 }} /> Imprimir
          </button>
          <button className="oa-btn-refresh">
            <RefreshCw size={14} /> Actualizar
          </button>
        </div>
      </div>

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
        itemsPerPage={itemsPerPage}
        setItemsPerPage={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
        visiblePages={visiblePages}
      >
        {current.length === 0 ? (
          <tr><td colSpan={7} className="table-empty">No hay pagos registrados</td></tr>
        ) : current.map(p => (
          <tr key={p.id}>
            <td>{p.numero}</td>
            <td>{p.contratista}</td>
            <td>{p.cuentaCobro}</td>
            <td>{p.fechaPago}</td>
            <td>{p.valor}</td>
            <td>{p.formaPago}</td>
            <td>{p.estado}</td>
          </tr>
        ))}
      </DataTable>

      <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
        <span style={{ background: '#334155', color: '#fff', padding: '6px 16px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600 }}>
          Total: {filtered.length} pago{filtered.length !== 1 ? 's' : ''}
        </span>
        <span style={{ background: '#dcfce7', color: '#166534', padding: '6px 16px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600 }}>
          En esta página: ${paginaValor.toLocaleString('es-CO')}
        </span>
      </div>
    </div>
  );
};

export default RelacionPagosView;
