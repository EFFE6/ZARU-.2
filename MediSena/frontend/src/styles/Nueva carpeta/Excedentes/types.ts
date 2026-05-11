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

export const EMPTY_RECIBO_FORM = {
  funcionario: '',
  beneficiario: '',
  fechaPago: '',
  valorTotal: '',
  tipoPago: 'Particular',
  metodoPago: 'Transferencia',
  concepto: 'Excedentes',
  referenciaOrden: '',
  observaciones: '',
};

/* ─── Mock Data ────────────────────────────────────── */
export const MOCK_RECIBOS: ReciboPago[] = [
  {
    id: 1,
    numeroRecibo: '62',
    funcionario: 'FERNANDEZ VALENZUELA EDGAR',
    beneficiario: 'AGUIRRE CAMACHO LUIS ALEJANDRO',
    fechaPago: '19 feb 2025',
    valorTotal: '$ 43.500',
    tipoPago: 'PARTICULAR',
    estado: 'PENDIENTE',
    metodoPago: 'TRANSFERENCIA',
    concepto: 'Excedentes',
    referenciaOrden: '',
    observaciones: ''
  },
  {
    id: 2,
    numeroRecibo: '62',
    funcionario: 'FERNANDEZ VALENZUELA EDGAR',
    beneficiario: 'AGUIRRE CAMACHO LUIS ALEJANDRO',
    fechaPago: '19 feb 2025',
    valorTotal: '$ 43.500',
    tipoPago: 'PARTICULAR',
    estado: 'PENDIENTE',
    metodoPago: 'TRANSFERENCIA',
    concepto: 'Excedentes',
    referenciaOrden: '',
    observaciones: ''
  },
  {
    id: 3,
    numeroRecibo: '62',
    funcionario: 'FERNANDEZ VALENZUELA EDGAR',
    beneficiario: 'AGUIRRE CAMACHO LUIS ALEJANDRO',
    fechaPago: '19 feb 2025',
    valorTotal: '$ 43.500',
    tipoPago: 'PARTICULAR',
    estado: 'PENDIENTE',
    metodoPago: 'TRANSFERENCIA',
    concepto: 'Excedentes',
    referenciaOrden: '',
    observaciones: ''
  },
  {
    id: 4,
    numeroRecibo: '62',
    funcionario: 'FERNANDEZ VALENZUELA EDGAR',
    beneficiario: 'AGUIRRE CAMACHO LUIS ALEJANDRO',
    fechaPago: '19 feb 2025',
    valorTotal: '$ 43.500',
    tipoPago: 'PARTICULAR',
    estado: 'PENDIENTE',
    metodoPago: 'TRANSFERENCIA',
    concepto: 'Excedentes',
    referenciaOrden: '',
    observaciones: ''
  },
  {
    id: 5,
    numeroRecibo: '62',
    funcionario: 'FERNANDEZ VALENZUELA EDGAR',
    beneficiario: 'AGUIRRE CAMACHO LUIS ALEJANDRO',
    fechaPago: '19 feb 2025',
    valorTotal: '$ 43.500',
    tipoPago: 'PARTICULAR',
    estado: 'PENDIENTE',
    metodoPago: 'TRANSFERENCIA',
    concepto: 'Excedentes',
    referenciaOrden: '',
    observaciones: ''
  },
  {
    id: 6,
    numeroRecibo: '62',
    funcionario: 'FERNANDEZ VALENZUELA EDGAR',
    beneficiario: 'AGUIRRE CAMACHO LUIS ALEJANDRO',
    fechaPago: '19 feb 2025',
    valorTotal: '$ 43.500',
    tipoPago: 'PARTICULAR',
    estado: 'PENDIENTE',
    metodoPago: 'TRANSFERENCIA',
    concepto: 'Excedentes',
    referenciaOrden: '',
    observaciones: ''
  }
];

export const MOCK_MAYOR_30: ExcedenteMayor30[] = [
  {
    id: 1,
    recibo: 'REC-990',
    funcionario: 'ARIAS OROZCO IGNACIO DE',
    fechaGeneracion: '2026-01-05',
    diasTranscurridos: 35,
    valor: '$ 120.000',
    estado: 'Pendiente'
  }
];

export const MOCK_SIN_CANCELAR: ExcedenteSinCancelar[] = [
  {
    id: 1,
    recibo: 'REC-995',
    funcionario: 'CALIXTO MONTANEZ EFRAIN',
    fechaGeneracion: '2026-02-01',
    valor: '$ 45.000',
    diasPendiente: 10
  }
];

export const MOCK_FINANCIERO: FinancieroTotales = {
  totalExcedentes: '$ 1.250.000',
  totalPagado: '$ 850.000',
  saldoPendiente: '$ 400.000'
};

export const MOCK_SALARIOS: FormatoSalario[] = [
  {
    id: 1,
    funcionario: 'CALIXTO MONTANEZ EFRAIN',
    cedula: '12345678',
    salarioBase: '$ 3.500.000',
    excedentes: '$ 150.000',
    total: '$ 3.650.000'
  }
];

export const MOCK_RELACION: RecibosPagoRelacion[] = [
  {
    id: 1,
    recibo: 'REC-001',
    funcionario: 'CALIXTO MONTANEZ EFRAIN',
    cedula: '12345678',
    dependencia: 'Sistemas',
    valor: '$ 150.000',
    estado: 'Pagado'
  }
];

export const MOCK_IMPRIMIR: ImprimirExcedente[] = [
  {
    id: 1,
    recibo: 'REC-001',
    funcionario: 'CALIXTO MONTANEZ EFRAIN',
    periodo: '2026-02',
    valor: '$ 150.000',
    estado: 'Pagado'
  }
];
