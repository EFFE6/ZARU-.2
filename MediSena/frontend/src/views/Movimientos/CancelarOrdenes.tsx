import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AlertTriangle, FileX, CheckCircle2, Loader2 } from 'lucide-react';
import '../../styles/Movimientos/OrdenAtencion.css';
import '../../styles/Movimientos/CancelarOrdenes.css';

interface OrdenEncontrada {
  numero: string; paciente: string; fecha: string;
  servicio: string; medico: string; estado: string;
}

const ORDENES_MOCK: Record<string, OrdenEncontrada> = {
  '668': { numero: '668', paciente: 'ROSALINA PALMA SANDOVAL', fecha: '21/02/2026', servicio: 'Consulta General', medico: 'CLAUDIA BASSIL AMIN', estado: 'Activo' },
  '667': { numero: '667', paciente: 'ROSALINA PALMA SANDOVAL', fecha: '21/02/2026', servicio: 'Especializada', medico: 'Piedad Viana Marzola', estado: 'Activo' },
  '666': { numero: '666', paciente: 'CARLOS MENDEZ RUIZ', fecha: '20/02/2026', servicio: 'Urgencia', medico: 'ABRIL GALEANO GIOVANNI', estado: 'Inactivo' },
};

const CancelarOrdenes: React.FC = () => {
  const { search } = useOutletContext<{ search: string }>();
  const [buscando, setBuscando] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [resultado, setResultado] = useState<OrdenEncontrada | null>(null);
  const [cancelada, setCancelada] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    const handleBuscar = async () => {
      if (!search.trim()) {
        setResultado(null);
        setBuscado(false);
        setCancelada(false);
        return;
      }
      setBuscando(true); 
      setBuscado(false); 
      setCancelada(false); 
      setResultado(null);
      
      await new Promise(r => setTimeout(r, 400));
      setResultado(ORDENES_MOCK[search.trim()] || null);
      setBuscado(true); 
      setBuscando(false);
    };

    const timer = setTimeout(() => {
      handleBuscar();
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const handleCancelar = async () => {
    setConfirmando(true);
    await new Promise(r => setTimeout(r, 800));
    setCancelada(true); setConfirmando(false); setResultado(null);
    setBuscado(false);
  };

  return (
    <>
      {cancelada && (
        <div className="cancel-success-banner">
          <CheckCircle2 size={18} color="#166534" style={{ flexShrink: 0 }} />
          <span><strong>Orden cancelada exitosamente.</strong> La orden ha sido marcada como cancelada en el sistema.</span>
        </div>
      )}
      {buscando && (
        <div className="cancel-empty">
          <Loader2 size={30} className="cancel-spin" color="#94a3b8" />
          <p>Buscando orden...</p>
        </div>
      )}

      <div className="cancel-warning-banner">
        <AlertTriangle size={15} color="#d97706" style={{ flexShrink: 0 }} />
        <span><strong>Atención:</strong> Esta acción es irreversible.</span>
      </div>
      {buscado && !resultado && !cancelada && search.trim() && (
        <div className="cancel-empty">
          <FileX size={44} color="#cbd5e1" />
          <p>No se encontró la orden <strong>{search}</strong>.</p>
        </div>
      )}
      {resultado && (
        <div className="cancel-result-card">
          <div className="cancel-result-badge">Orden encontrada</div>
          <div className="cancel-result-grid">
            <div className="cancel-result-item"><span className="cancel-result-label">N° Orden</span><span className="cancel-result-value cancel-result-num">#{resultado.numero}</span></div>
            <div className="cancel-result-item"><span className="cancel-result-label">Estado</span><span className={`cancel-estado-badge ${resultado.estado === 'Activo' ? 'activo' : 'inactivo'}`}>{resultado.estado}</span></div>
            <div className="cancel-result-item cancel-result-item-full"><span className="cancel-result-label">Paciente</span><span className="cancel-result-value">{resultado.paciente}</span></div>
            <div className="cancel-result-item"><span className="cancel-result-label">Fecha</span><span className="cancel-result-value">{resultado.fecha}</span></div>
            <div className="cancel-result-item"><span className="cancel-result-label">Servicio</span><span className="cancel-result-value">{resultado.servicio}</span></div>
            <div className="cancel-result-item cancel-result-item-full"><span className="cancel-result-label">Médico</span><span className="cancel-result-value">{resultado.medico}</span></div>
          </div>
          <div className="cancel-result-actions">
            <button className="cancel-btn-keep" onClick={() => { setResultado(null); setBuscado(false); }}>Mantener orden</button>
            <button className="cancel-btn-cancel-order" onClick={handleCancelar} disabled={confirmando}>
              {confirmando ? <><Loader2 size={14} className="cancel-spin" /> Cancelando...</> : 'Confirmar Cancelación'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default CancelarOrdenes;
