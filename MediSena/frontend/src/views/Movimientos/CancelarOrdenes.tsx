import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import MovTabs from './MovTabs';
import { Home, ChevronRight, Search, AlertTriangle, FileX, CheckCircle2, Loader2, ClipboardList } from 'lucide-react';
import '../../styles/GestionResoluciones/GestionResoluciones.css';
import './OrdenAtencion.css';
import './CancelarOrdenes.css';

interface OrdenEncontrada {
  numero: string;
  paciente: string;
  fecha: string;
  servicio: string;
  medico: string;
  estado: string;
}

const ORDENES_MOCK: Record<string, OrdenEncontrada> = {
  '668': { numero: '668', paciente: 'ROSALINA PALMA SANDOVAL', fecha: '21/02/2026', servicio: 'Consulta General', medico: 'CLAUDIA BASSIL AMIN', estado: 'Activo' },
  '667': { numero: '667', paciente: 'ROSALINA PALMA SANDOVAL', fecha: '21/02/2026', servicio: 'Especializada', medico: 'Piedad Viana Marzola', estado: 'Activo' },
  '666': { numero: '666', paciente: 'CARLOS MENDEZ RUIZ', fecha: '20/02/2026', servicio: 'Urgencia', medico: 'ABRIL GALEANO GIOVANNI', estado: 'Inactivo' },
};

const CancelarOrdenes: React.FC = () => {
  const [numeroOrden, setNumeroOrden] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [resultado, setResultado] = useState<OrdenEncontrada | null>(null);
  const [cancelada, setCancelada] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [firstActive, setFirstActive] = useState(false);

  const handleBuscar = async () => {
    if (!numeroOrden.trim()) return;
    setBuscando(true);
    setBuscado(false);
    setCancelada(false);
    setResultado(null);
    await new Promise(r => setTimeout(r, 600));
    setResultado(ORDENES_MOCK[numeroOrden.trim()] || null);
    setBuscado(true);
    setBuscando(false);
  };

  const handleCancelar = async () => {
    setConfirmando(true);
    await new Promise(r => setTimeout(r, 800));
    setCancelada(true);
    setConfirmando(false);
    setResultado(null);
    setNumeroOrden('');
    setBuscado(false);
  };

  return (
    <div className="main-layout">
      <Sidebar />
      <main className="main-content">
        <div className="gestion-container">

          {/* Header degradado */}
          <header className="gestion-header">
            <div className="gestion-header-top">
              <nav className="breadcrumb">
                <div className="breadcrumb-item"><Home size={14} /></div>
                <div className="breadcrumb-sep"><ChevronRight size={13} /></div>
                <div className="breadcrumb-item">Movimientos</div>
                <div className="breadcrumb-sep"><ChevronRight size={13} /></div>
                <div className="breadcrumb-item active">Cancelar Órdenes</div>
              </nav>
            </div>
            <div className="gestion-header-bottom">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ClipboardList size={24} color="#1e3a52" />
                <h1 className="gestion-title" style={{ margin: 0 }}>Cancelar Órdenes</h1>
              </div>
            </div>
          </header>

          {/* Card blanca */}
          <div className="tabs-card-group">
            <MovTabs onFirstActive={setFirstActive} />
            <div className={`gestion-content-card${firstActive ? ' first-tab-active' : ''}`} style={{ marginTop: 0 }}>

              {/* Banner éxito */}
              {cancelada && (
                <div className="cancel-success-banner">
                  <CheckCircle2 size={18} color="#166534" style={{ flexShrink: 0 }} />
                  <span><strong>Orden cancelada exitosamente.</strong> La orden ha sido marcada como cancelada en el sistema.</span>
                </div>
              )}

              {/* Buscador — PRIMERO */}
              <div className="cancel-search-section">
                <div className="cancel-search-row">
                  <input
                    type="text"
                    className="cancel-search-input"
                    placeholder="Número de Orden"
                    value={numeroOrden}
                    onChange={e => setNumeroOrden(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleBuscar()}
                  />
                  <button className="cancel-search-btn" onClick={handleBuscar} disabled={buscando}>
                    {buscando
                      ? <Loader2 size={14} className="cancel-spin" />
                      : <Search size={14} style={{ marginRight: 4 }} />}
                    {buscando ? 'Buscando...' : 'Buscar'}
                  </button>
                </div>
              </div>

              {/* Advertencia — DESPUÉS del buscador */}
              <div className="cancel-warning-banner">
                <AlertTriangle size={15} color="#d97706" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Atención:</strong> Esta acción es irreversible. Una vez cancelada, la orden no podrá ser reactivada.
                </span>
              </div>

              {/* No encontrada */}
              {buscado && !resultado && !cancelada && (
                <div className="cancel-empty">
                  <FileX size={44} color="#cbd5e1" />
                  <p>No se encontró ninguna orden con el número <strong>{numeroOrden}</strong>.</p>
                  <span>Verifique el número e intente de nuevo.</span>
                </div>
              )}

              {/* Resultado */}
              {resultado && (
                <div className="cancel-result-card">
                  <div className="cancel-result-badge">Orden encontrada</div>
                  <div className="cancel-result-grid">
                    <div className="cancel-result-item">
                      <span className="cancel-result-label">N° Orden</span>
                      <span className="cancel-result-value cancel-result-num">#{resultado.numero}</span>
                    </div>
                    <div className="cancel-result-item">
                      <span className="cancel-result-label">Estado Actual</span>
                      <span className={`cancel-estado-badge ${resultado.estado === 'Activo' ? 'activo' : 'inactivo'}`}>
                        {resultado.estado}
                      </span>
                    </div>
                    <div className="cancel-result-item cancel-result-item-full">
                      <span className="cancel-result-label">Paciente</span>
                      <span className="cancel-result-value">{resultado.paciente}</span>
                    </div>
                    <div className="cancel-result-item">
                      <span className="cancel-result-label">Fecha</span>
                      <span className="cancel-result-value">{resultado.fecha}</span>
                    </div>
                    <div className="cancel-result-item">
                      <span className="cancel-result-label">Servicio</span>
                      <span className="cancel-result-value">{resultado.servicio}</span>
                    </div>
                    <div className="cancel-result-item cancel-result-item-full">
                      <span className="cancel-result-label">Médico / Contratista</span>
                      <span className="cancel-result-value">{resultado.medico}</span>
                    </div>
                  </div>
                  <div className="cancel-result-actions">
                    <button className="cancel-btn-keep" onClick={() => { setResultado(null); setBuscado(false); }}>
                      Mantener orden
                    </button>
                    <button className="cancel-btn-cancel-order" onClick={handleCancelar} disabled={confirmando}>
                      {confirmando
                        ? <><Loader2 size={14} className="cancel-spin" /> Cancelando...</>
                        : 'Confirmar Cancelación'}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default CancelarOrdenes;
