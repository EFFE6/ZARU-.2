import React from 'react';

const Placeholder: React.FC<{ title: string }> = ({ title }) => (
  <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
    <h2>{title}</h2>
    <p>Esta vista está siendo rediseñada.</p>
  </div>
);

export const ImprimirToolbar: React.FC<any> = () => null;
export const ImprimirTabla: React.FC<any> = () => <Placeholder title="Imprimir Excedentes" />;
export const ImprimirHead: React.FC<any> = () => null;

export const Mayor30Toolbar: React.FC<any> = () => null;
export const Mayor30Head: React.FC<any> = () => null;
export const Mayor30Tabla: React.FC<any> = () => <Placeholder title="Excedentes Mayor a 30 Días" />;

export const RelacionToolbar: React.FC<any> = () => null;
export const RelacionHead: React.FC<any> = () => null;
export const RelacionTabla: React.FC<any> = () => <Placeholder title="Relación Recibos de Pago" />;

export const FormatoFinancieroPanel: React.FC<any> = () => <Placeholder title="Formato Financiero" />;

export const SalariosToolbar: React.FC<any> = () => null;
export const SalariosHead: React.FC<any> = () => null;
export const SalariosTabla: React.FC<any> = () => <Placeholder title="Formato de Salarios" />;

export const ReliquidarPanel: React.FC<any> = () => <Placeholder title="Reliquidar Excedentes" />;

export const SinCancelarToolbar: React.FC<any> = () => null;
export const SinCancelarHead: React.FC<any> = () => null;
export const SinCancelarTabla: React.FC<any> = () => <Placeholder title="Excedentes sin Cancelar" />;
