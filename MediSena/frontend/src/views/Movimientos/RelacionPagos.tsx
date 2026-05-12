import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Download, Printer, RefreshCw, Eye, X, Check } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
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

const DetallesModal: React.FC<{ pago: RelacionPago; onClose: () => void }> = ({ pago, onClose }) => {
  const [step, setStep] = useState(0);
  const STEPS_LABELS = ['DATOS DEL PAGO', 'CONTRATISTA', 'CUENTA Y VALOR'];

  const nextStep = () => {
    if (step < 2) setStep(step + 1);
  };

  return (
    <Modal isOpen={true} onClose={onClose} hideHeader className="oa-modal-detalles-final">
      <div className="oa-modal-detalles-header-tabs">
        {STEPS_LABELS.map((s, i) => (
          <div 
            key={i} 
            className={`oa-det-tab ${step === i ? 'active' : ''}`}
            onClick={() => setStep(i)}
          >
            <div className="oa-det-tab-circle">{i + 1}</div>
            <span className="oa-det-tab-label">{s}</span>
          </div>
        ))}
        <button className="oa-modal-detalles-close" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      <div className="oa-modal-detalles-body-final">
        {step === 0 && (
          <div className="oa-det-content-grid">
            <div className="oa-det-card">
              <div className="oa-det-grid-inner">
                <div className="oa-det-info-field">
                  <span className="oa-det-info-label">Número de Pago</span>
                  <span className="oa-det-info-value">#{pago.numero}</span>
                </div>
                <div className="oa-det-info-field">
                  <span className="oa-det-info-label">Fecha de Pago</span>
                  <span className="oa-det-info-value">{pago.fechaPago}</span>
                </div>
              </div>
            </div>
            <div className="oa-det-card">
              <div className="oa-det-info-field full">
                <span className="oa-det-info-label">Forma de Pago</span>
                <span className="oa-det-info-value">{pago.formaPago}</span>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="oa-det-content-step2">
            <div className="oa-det-card full">
              <span className="oa-det-info-label">Contratista / Beneficiario</span>
              <span className="oa-det-info-value">{pago.contratista}</span>
            </div>
            <div className="oa-det-card full">
              <span className="oa-det-info-label">Estado</span>
              <span className="oa-det-badge-status" style={{ 
                background: pago.estado === 'Pagado' ? '#f0fdf4' : '#fff7ed',
                color: pago.estado === 'Pagado' ? '#22c55e' : '#f97316'
              }}>
                <Check size={14} /> {pago.estado}
              </span>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="oa-det-content-grid">
            <div className="oa-det-card">
              <span className="oa-det-info-label">Cuenta de Cobro</span>
              <span className="oa-det-info-value">{pago.cuentaCobro}</span>
            </div>
            <div className="oa-det-card">
              <span className="oa-det-info-label">Valor Pagado</span>
              <span className="oa-det-info-value" style={{ color: '#166534' }}>{pago.valor}</span>
            </div>
            <div className="oa-det-card full">
              <span className="oa-det-info-label">Observaciones de Tesorería</span>
              <span className="oa-det-info-value">PAGO REALIZADO SEGÚN PROGRAMACIÓN DE CAJA.</span>
            </div>
          </div>
        )}
      </div>

      <div className="oa-modal-detalles-footer-final">
        <div className="oa-det-footer-left">
          <button className="oa-det-btn-icon-outline" title="Imprimir" onClick={() => window.print()}>
            <Printer size={20} />
          </button>
        </div>
        
        <div className="oa-det-footer-right">
          <button className="oa-det-btn-cancel" onClick={onClose}>Cancelar</button>
          <button className="oa-det-btn-next" onClick={step === 2 ? onClose : nextStep}>
            {step === 2 ? 'Finalizar' : 'Siguiente'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

const MOCK_PAGOS: RelacionPago[] = [
  { id: 1, numero: 1001, contratista: 'Juan Perez', cuentaCobro: 'CC-001', fechaPago: '01/03/2026', valor: '$1,500,000', formaPago: 'Transferencia', estado: 'Pagado' },
  { id: 2, numero: 1002, contratista: 'Maria Lopez', cuentaCobro: 'CC-002', fechaPago: '05/03/2026', valor: '$2,100,000', formaPago: 'Cheque', estado: 'Pendiente' },
  { id: 3, numero: 1003, contratista: 'Carlos Sanchez', cuentaCobro: 'CC-003', fechaPago: '10/03/2026', valor: '$950,000', formaPago: 'Transferencia', estado: 'Pagado' },
];

const RelacionPagosView: React.FC = () => {
  const [pagos] = useState<RelacionPago[]>(MOCK_PAGOS);
  const { search } = useOutletContext<{ search: string }>();
  const [pagoSeleccionado, setPagoSeleccionado] = useState<RelacionPago | null>(null);

  const filtered = useMemo(() => {
    return pagos.filter(p =>
      String(p.numero).includes(search) ||
      p.contratista?.toLowerCase().includes(search.toLowerCase())
    );
  }, [pagos, search]);

  const totalValor = filtered.reduce((sum, p) => sum + parseFloat(p.valor.replace(/[^0-9.-]/g, '')), 0);

  return (
    <div className="mov-view-container">
      <div className="oa-toolbar-header-row">
        <span className="oa-table-toolbar-text">
          Listado de pagos registrados en el sistema
        </span>
        <div className="oa-toolbar-actions-row">
          <div className="oa-header-actions" style={{ gap: '8px' }}>
            <span className="oa-count-badge" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
              Total: <strong>{filtered.length}</strong> pago{filtered.length !== 1 ? 's' : ''}
            </span>
            <span className="oa-count-badge" style={{ padding: '6px 14px', fontSize: '0.8rem', background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }}>
              Valor Total: <strong>${totalValor.toLocaleString('es-CO')}</strong>
            </span>
          </div>

          <div className="oa-header-actions">
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
            <th>Acciones</th>
          </tr>
        }
      >
        {filtered.length === 0 ? (
          <tr><td colSpan={8} className="table-empty">No hay pagos registrados</td></tr>
        ) : filtered.map(p => (
          <tr key={p.id}>
            <td className="bold" style={{ color: '#0165B0' }}>#{p.numero}</td>
            <td className="bold">{p.contratista}</td>
            <td>{p.cuentaCobro}</td>
            <td>{p.fechaPago}</td>
            <td className="bold" style={{ color: '#166534' }}>{p.valor}</td>
            <td>{p.formaPago}</td>
            <td>
              <span className={`oa-det-badge-status`} style={{ 
                background: p.estado === 'Pagado' ? '#f0fdf4' : '#fff7ed',
                color: p.estado === 'Pagado' ? '#22c55e' : '#f97316'
              }}>
                {p.estado}
              </span>
            </td>
            <td>
              <button 
                className="oa-action-circle-btn" 
                onClick={() => setPagoSeleccionado(p)}
                title="Ver Detalles"
              >
                <Eye size={18} />
              </button>
            </td>
          </tr>
        ))}
      </DataTable>

      {pagoSeleccionado && (
        <DetallesModal 
          pago={pagoSeleccionado} 
          onClose={() => setPagoSeleccionado(null)} 
        />
      )}
    </div>
  );
};

export default RelacionPagosView;
