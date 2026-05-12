import React, { useState, useMemo } from 'react';
import { Search, AlertTriangle, Eye, Trash2, ChevronLeft, ChevronRight, XCircle } from 'lucide-react';
import DataTable from '../../components/DataTable';
import { MOCK_ORDENES, OrdenAtencion } from './types';
import '../../styles/Movimientos/CancelarOrdenes.css';

const CancelarOrdenes: React.FC = () => {
  const [ordenes, setOrdenes] = useState<OrdenAtencion[]>(MOCK_ORDENES);
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [canceladaExitosa, setCanceladaExitosa] = useState(false);

  const filtered = useMemo(() => {
    if (!appliedSearch) return [];
    const q = appliedSearch.toLowerCase();
    return ordenes.filter(o => 
      String(o.numero).toLowerCase().includes(q)
    );
  }, [ordenes, appliedSearch]);

  const handleCancelar = (id: number) => {
    if (window.confirm('¿Está seguro de que desea cancelar esta orden? Esta acción es irreversible.')) {
      setOrdenes(prev => prev.filter(o => o.id !== id));
      setCanceladaExitosa(true);
      setTimeout(() => setCanceladaExitosa(false), 3000);
    }
  };

  return (
    <div className="co-container">
      {/* ── Subtitle ── */}
      <p className="co-subtitle" style={{ marginBottom: '8px' }}>Busque y cancele órdenes de atención médica</p>

      {/* ── Search Section ── */}
      <div className="co-search-section">
        <div className="co-search-box">
          <input 
            type="text" 
            placeholder="Número de Orden" 
            className="co-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setAppliedSearch(searchTerm)}
          />
          <button className="co-btn-buscar" onClick={() => setAppliedSearch(searchTerm)}>
            <Search size={18} />
            Buscar
          </button>
        </div>
      </div>

      {/* ── Alert ── */}
      <div className="co-alert-warning">
        <AlertTriangle size={20} className="co-alert-icon" />
        <div className="co-alert-text">
          <strong>Atención:</strong> Esta acción es irreversible. Una vez cancelada, la orden no podrá ser reactivada.
        </div>
      </div>

      {/* ── Table Results ── */}
      {appliedSearch && (
        <div className="co-results-section">
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
              <tr><td colSpan={6} className="rp-table-empty">No se encontraron órdenes con ese número.</td></tr>
            ) : filtered.map(o => (
              <tr key={o.id}>
                <td className="bold" style={{ color: '#0165B0' }}>#{o.numero}</td>
                <td className="bold">{o.beneficiario.replace('\n', ' ')}</td>
                <td>{o.fecha}</td>
                <td>{o.contratista}</td>
                <td>
                  <span className={`rp-status-badge ${o.estado === 'A' ? 'pagado' : 'pendiente'}`}>
                    {o.estado === 'A' ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button className="oa-action-circle-btn" title="Ver Detalles"><Eye size={18} /></button>
                    <button 
                      className="co-btn-delete" 
                      onClick={() => handleCancelar(o.id)}
                      title="Cancelar Orden"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        </div>
      )}

      {/* ── Success Banner ── */}
      {canceladaExitosa && (
        <div className="co-success-toast">
          <CheckCircleIcon />
          <span>Orden cancelada exitosamente.</span>
        </div>
      )}
    </div>
  );
};

const CheckCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export default CancelarOrdenes;
