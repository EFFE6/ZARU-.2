/* ═══════════════════════════════════════════════════════════
   TIPOS COMPARTIDOS – Excedentes
   ═══════════════════════════════════════════════════════════ */

export interface ReciboPago {
  id: number;
  numeroRecibo: string;
  funcionario: string;
  beneficiario: string;
  fechaPago: string;
  valorTotal: string;
  tipoPago: string;          // 'PARTICULAR' | 'INSTITUCIONAL'
  estado: string;            // 'PENDIENTE' | 'PAGADO' | 'ANULADO'
  metodoPago: string;        // 'TRANSFERENCIA' | 'CHEQUE' | 'EFECTIVO'
  concepto: string;
  referenciaOrden?: string;
  observaciones?: string;
}

export interface ImprimirExcedente {
  id: number;
  recibo: string;
  funcionario: string;
  periodo: string;
  valor: string;
  estado: string;
}

export interface ExcedenteMayor30 {
  id: number;
  recibo: string;
  funcionario: string;
  fechaGeneracion: string;
  diasTranscurridos: number;
  valor: string;
  estado: string;
}

export interface RecibosPagoRelacion {
  id: number;
  recibo: string;
  funcionario: string;
  cedula: string;
  dependencia: string;
  valor: string;
  estado: string;
}

export interface FinancieroTotales {
  totalExcedentes: string;
  totalPagado: string;
  saldoPendiente: string;
}

export interface FormatoSalario {
  id: number;
  funcionario: string;
  cedula: string;
  salarioBase: string;
  excedentes: string;
  total: string;
}

export interface ReliquidarInfo {
  recibo: string;
  funcionario: string;
  valorActual: string;
}

export interface ExcedenteSinCancelar {
  id: number;
  recibo: string;
  funcionario: string;
  fechaGeneracion: string;
  valor: string;
  diasPendiente: number;
}

/* ─── Constantes ────────────────────────────────────── */
export const ESTADOS_RECIBO = ['Todos', 'Pendiente', 'Pagado', 'Anulado'];
export const TIPOS_PAGO_EXC = ['Todos', 'Particular', 'Institucional'];
export const METODOS_PAGO = ['Transferencia', 'Cheque', 'Efectivo'];

export const REGIONALES_EXC = [
  'Todas',
  'Regional 001',
  'Regional 002',
  'Regional 003',
  'Regional Centro de Comercio',
];

export const FUNCIONARIOS_EXC = [
  'CALIXTO MONTANEZ EFRAIN',
  'FERNANDEZ VALENZUELA EDGAR',
  'DURAN RESTREPO LUIS HOOVER',
  'ARIAS OROZCO IGNACIO DE',
];
