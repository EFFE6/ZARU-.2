/* ═══════════════════════════════════════════════════════════
   TIPOS COMPARTIDOS – Consultas
   ═══════════════════════════════════════════════════════════ */

export interface OrdenConsulta {
  id: number;
  numero: string;
  fecha: string;
  beneficiario: string;
  medico: string;
  especialidad: string;
  estado: string;              // 'A' | 'C' | 'N' (Aprobada / Cancelada / Anulada)
  valor: string;
  funcionarioSolicitante?: string;
  tipoAtencion?: string;
  fechaEmision?: string;
}

export interface CuentaCobroConsulta {
  id: number;
  numeroRecibo: string;
  funcionario: string;
  fecha: string;
  tipoPago: string;
  valor: string;
  estado: string;
}

export interface ContratistaConsulta {
  id: number;
  nit: string;
  nombre: string;
  especialidad: string;
  regional: string;
  telefono: string;
  email: string;
  estado: string;
}

export interface BeneficiarioConsulta {
  id: number;
  identificacion: string;
  tipoId: string;                   // 'CC' | 'TI' | 'CE'
  nombreCompleto: string;
  edad: number;
  fechaNacimiento: string;
  sexo: string;
  parentesco: string;
  funcionarioTitular: string;
  telefono: string;
  direccion: string;
  eps: string;
  estado: string;
  ordenesTotales: number;
  citasTotales: number;
}

/* ─── Constantes compartidas ───────────────────────────── */
export const ESTADOS_CONSULTA = ['Todos', 'Aprobada', 'Pendiente', 'Cancelada', 'Anulada'];

export const TIPOS_PAGO = ['Todos', 'Transferencia', 'Cheque', 'Efectivo'];

export const BUSCAR_POR_OPTS = ['Identificación', 'Nombre'];

export const ESPECIALIDADES_CONS = [
  'Dermatología',
  'Cardiología',
  'Medicina General',
  'Ortopedia',
  'Pediatría',
  'Ginecología',
];
