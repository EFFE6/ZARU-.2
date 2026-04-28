import React from 'react';
import { AlertTriangle, Plus } from 'lucide-react';

/* ══════════════════════════════════════════════════════
   VISTA ABRIR VIGENCIA (no tiene tabla, es contenido estático) 
   ══════════════════════════════════════════════════════ */
const AbrirVigencia: React.FC = () => (
  <div style={{ padding: '32px' }}>
    <div className="um-alert warning" style={{ background: '#fef9c3', border: '1px solid #fde047', color: '#854d0e', marginBottom: '24px' }}>
      <AlertTriangle size={15} className="um-alert-icon" color="#d97706" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <strong style={{ color: '#002c4d', fontSize: '12px' }}>Atención</strong>
        <span style={{ fontSize: '11px', color: '#5c7a90' }}>Este proceso solo puede ser ejecutado en la nueva vigencia 2027.</span>
      </div>
    </div>
    <h3 style={{ color: '#004B85', fontSize: '16px', marginBottom: '16px' }}>¿Qué pasará al abrir la nueva vigencia?</h3>
    <p style={{ color: '#5c7a90', fontSize: '12px', marginBottom: '8px' }}>Se copiarán automáticamente los siguientes datos de la vigencia anterior:</p>
    <ul style={{ color: '#5c7a90', fontSize: '12px', marginLeft: '20px', marginBottom: '24px', listStyleType: 'disc' }}>
      <li>Parámetros</li>
      <li>Resoluciones</li>
      <li>Topes</li>
      <li>Cargos</li>
      <li>Cargos por funcionario</li>
      <li>Categorías por regional</li>
      <li>Beneficiarios (se actualizarán los suspendidos)</li>
    </ul>
    <h3 style={{ color: '#004B85', fontSize: '16px', marginBottom: '16px' }}>Procesos que se activarán</h3>
    <p style={{ color: '#5c7a90', fontSize: '12px', marginBottom: '8px' }}>Después de crear la vigencia, podrás usar:</p>
    <ul style={{ color: '#5c7a90', fontSize: '12px', marginLeft: '20px', marginBottom: '40px', listStyleType: 'disc' }}>
      <li>Órdenes de atención</li>
      <li>Cuentas de cobro</li>
      <li>Recibos de pago</li>
    </ul>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
      <button className="btn-new-resolution" style={{ background: '#004B85' }}>
        <Plus size={16} />
        Abrir vigencia 2027
      </button>
      <span style={{ fontSize: '11px', color: '#94a3b8' }}>Este proceso puede tardar unos minutos.</span>
    </div>
  </div>
);

export default AbrirVigencia;
