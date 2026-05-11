import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Download, Printer, RefreshCw } from 'lucide-react';
import DataTable from '../../components/DataTable';
import '../../styles/Movimientos/OrdenAtencion.css';
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
  { id: 1, numero: 201, contratista: 'CLAUDIA BASSIL AMIN', cuentaCobro: 'CC-101', fechaPago: '05/02/2026', valor: '$1.200.000', formaPago: 'Transferencia', estado: 'PAGADO' },
  { id: 2, numero: 202, contratista: 'Piedad Viana Marzola', cuentaCobro: 'CC-102', fechaPago: '10/02/2026', valor: '$850.000', formaPago: 'Cheque', estado: 'PAGADO' },
  { id: 3, numero: 203, contratista: 'ABRIL GALEANO GIOVANNI', cuentaCobro: 'CC-103', fechaPago: '15/02/2026', valor: '$2.350.000', formaPago: 'Transferencia', estado: 'PENDIENTE' },
  { id: 4, numero: 204, contratista: 'CLAUDIA BASSIL AMIN', cuentaCobro: 'CC-104', fechaPago: '20/02/2026', valor: '$970.000', formaPago: 'Efectivo', estado: 'PAGADO' },
  { id: 5, numero: 205, contratista: 'Piedad Viana Marzola', cuentaCobro: 'CC-105', fechaPago: '25/02/2026', valor: '$1.540.000', formaPago: 'Transferencia', estado: 'PENDIENTE' },
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

  const paginaValor = current.reduce((sum, p) => {
    const v = parseFloat(p.valor?.replace(/[^0-9.-]/g, '') || '0');
    return sum + v;
  }, 0);

  return (
    <div style={{ padding: '0 4px' }}>
      <div className="oa-table-toolbar" style={{ marginBottom: 20 }}>
        <div className="oa-table-toolbar-text">
          Listado de pagos registrados en el sistema
        </div>
        <div className="oa-table-toolbar-actions">
          <button className="oa-btn-refresh" onClick={() => {}}>
            <Download size={14} style={{ opacity: 0.6 }} /> Exportar
          </button>
          <button className="oa-btn-refresh" onClick={() => window.print()}>
            <Printer size={14} style={{ opacity: 0.6 }} /> Imprimir
          </button>
          <button className="oa-btn-refresh" onClick={() => {}}>
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
            <td style={{ color: '#0165B0', fontWeight: 600 }}>{p.numero}</td>
            <td>{p.contratista}</td>
            <td>{p.cuentaCobro}</td>
            <td>{p.fechaPago}</td>
            <td style={{ fontWeight: 600 }}>{p.valor}</td>
            <td>{p.formaPago}</td>
            <td>
              <span className={`cc-estado-badge ${p.estado === 'PAGADO' ? 'cc-badge-aprobada' : 'cc-badge-pendiente'}`}>
                {p.estado}
              </span>
            </td>
          </tr>
        ))}
      </DataTable>

      <div className="rp-totales">
        <span className="rp-total-badge rp-total-dark">
          Total: {filtered.length} pago{filtered.length !== 1 ? 's' : ''}
        </span>
        <span className="rp-total-badge rp-total-green" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #10b98140' }}>
          En esta página: ${paginaValor.toLocaleString('es-CO')}
        </span>
      </div>
    </div>
  );
};

export default RelacionPagosView;
