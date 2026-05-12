import React, { useState, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AlertTriangle, Trash2, CheckCircle2, Eye, X, Check, Printer, Pencil } from 'lucide-react';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { MOCK_ORDENES, OrdenAtencion } from './types';
import '../../styles/Movimientos/CancelarOrdenes.css';

const DetallesModal: React.FC<{ orden: OrdenAtencion; onClose: () => void }> = ({ orden, onClose }) => {
  const [step, setStep] = useState(0);
  const STEPS_LABELS = ['DATOS GENERALES', 'BENEFICIARIO Y FUNCIONARIO', 'ATENCIÓN MÉDICA'];

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
                  <span className="oa-det-info-label">Tipo de Atención</span>
                  <span className="oa-det-info-value">{orden.tipoAtencion || '0'}</span>
                </div>
                <div className="oa-det-info-field">
                  <span className="oa-det-info-label">Detalles de la orden</span>
                  <span className="oa-det-info-value">{orden.diagnostico || 'REMISIÓN A CONSULTA ESPECIALIZADA...'}</span>
                </div>
              </div>
            </div>
            <div className="oa-det-card">
              <div className="oa-det-info-field full">
                <span className="oa-det-info-label">Observaciones</span>
                <span className="oa-det-info-value">{orden.observaciones || 'SE AUTORIZA CONSULTA ESPECIALIZADA POR DERMATOLOGÍA. TARIFA PACTADA.'}</span>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="oa-det-content-step2">
            <div className="oa-det-info-field full">
              <span className="oa-det-info-label">Beneficiario</span>
              <div className="oa-det-ben-card">
                <span className="oa-det-ben-name">{orden.beneficiario.replace('\n', ' ')}</span>
                <div className="oa-det-ben-badges">
                  <span className="oa-det-badge-cc">C.C. {orden.documentoBeneficiario || '9526609'}</span>
                  <span className="oa-det-badge-status">
                    <Check size={14} strokeWidth={3} /> {orden.estadoBeneficiario || 'Activo'}
                  </span>
                </div>
              </div>
            </div>
            <div className="oa-det-card full">
              <span className="oa-det-info-label">Funcionario solicitante</span>
              <span className="oa-det-info-value">{orden.funcionarioSolicitante || 'MÉDICO TRATANTE'}</span>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="oa-det-content-grid">
            <div className="oa-det-card">
              <span className="oa-det-info-label">Médico tratante</span>
              <span className="oa-det-info-value">{orden.medicoTratante || 'NO ESPECIFICADO'}</span>
            </div>
            <div className="oa-det-card">
              <span className="oa-det-info-label">Especialidad</span>
              <span className="oa-det-info-value">{orden.especialidad || 'NO ESPECIFICADO'}</span>
            </div>
            <div className="oa-det-card">
              <span className="oa-det-info-label">Valor total estimado</span>
              <span className="oa-det-info-value">{orden.valorEstimado || 'NO ESPECIFICADO'}</span>
            </div>
            <div className="oa-det-card">
              <span className="oa-det-info-label">Diagnóstico (Opcional)</span>
              <span className="oa-det-info-value">{orden.diagnostico || 'N/A'}</span>
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

const CancelarOrdenes: React.FC = () => {
  const { search } = useOutletContext<{ search: string }>();
  const [ordenes, setOrdenes] = useState<OrdenAtencion[]>(MOCK_ORDENES);
  const [canceladaExitosa, setCanceladaExitosa] = useState(false);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<OrdenAtencion | null>(null);

  const filtered = useMemo(() => {
    return ordenes.filter(o => 
      String(o.numero).toLowerCase().includes(search.toLowerCase()) ||
      o.beneficiario.toLowerCase().includes(search.toLowerCase())
    );
  }, [ordenes, search]);

  const handleCancelar = (id: number) => {
    if (window.confirm('¿Está seguro de que desea cancelar esta orden? Esta acción es irreversible.')) {
      setOrdenes(prev => prev.filter(o => o.id !== id));
      setCanceladaExitosa(true);
      setTimeout(() => setCanceladaExitosa(false), 3000);
    }
  };

  return (
    <div className="mov-view-container">
      {/* Banner éxito */}
      {canceladaExitosa && (
        <div className="cancel-success-banner" style={{ margin: '0 0 16px 0', borderRadius: '8px', border: '1px solid #86efac' }}>
          <CheckCircle2 size={18} color="#166534" style={{ flexShrink: 0 }} />
          <span><strong>Orden cancelada exitosamente.</strong> La orden ha sido eliminada del sistema.</span>
        </div>
      )}

      {/* Toolbar con Advertencia */}
      <div className="oa-toolbar-header-row" style={{ marginBottom: 20 }}>
        <div className="cancel-warning-banner" style={{ margin: 0, width: '100%', boxSizing: 'border-box' }}>
          <AlertTriangle size={15} color="#d97706" style={{ flexShrink: 0 }} />
          <span>
            <strong>Atención:</strong> Esta acción es irreversible. Una vez cancelada, la orden no podrá ser reactivada.
          </span>
        </div>
      </div>

      <DataTable
        headers={
          <tr>
            <th>N° ORDEN</th>
            <th>PACIENTE</th>
            <th>FECHA</th>
            <th>CONTRATISTA</th>
            <th>ESTADO</th>
            <th>ACCIONES</th>
          </tr>
        }
      >
        {filtered.length === 0 ? (
          <tr><td colSpan={6} className="table-empty">No se encontraron órdenes para cancelar.</td></tr>
        ) : filtered.map(o => (
          <tr key={o.id}>
            <td className="bold" style={{ color: '#0165B0' }}>#{o.numero}</td>
            <td className="bold">{o.beneficiario.replace('\n', ' ')}</td>
            <td>{o.fecha}</td>
            <td>{o.contratista}</td>
            <td>
              <span className={`cancel-estado-badge ${o.estado === 'A' ? 'activo' : 'inactivo'}`}>
                {o.estado === 'A' ? 'Activo' : o.estado === 'P' ? 'Pendiente' : 'Inactivo'}
              </span>
            </td>
            <td>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <button 
                  className="oa-action-circle-btn" 
                  onClick={() => setOrdenSeleccionada(o)}
                  title="Ver Detalles"
                >
                  <Eye size={18} />
                </button>
                <button 
                  className="cancel-btn-del" 
                  onClick={() => handleCancelar(o.id)}
                  title="Cancelar Orden"
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#fee2e2',
                    color: '#dc2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      {ordenSeleccionada && (
        <DetallesModal 
          orden={ordenSeleccionada} 
          onClose={() => setOrdenSeleccionada(null)} 
        />
      )}
    </div>
  );
};

export default CancelarOrdenes;
