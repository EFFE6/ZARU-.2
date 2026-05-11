/* ═══════════════════════════════════════════════════════════
   TIPOS COMPARTIDOS – Movimientos
   ═══════════════════════════════════════════════════════════ */

export interface OrdenAtencion {
  id: number;
  numero: number;
  vigencia: number;
  beneficiario: string;
  contratista: string;
  especialidad: string | number;
  fecha: string;
  estado: 'A' | 'I' | 'P';
  tipoAtencion?: string;
  observaciones?: string;
  funcionarioSolicitante?: string;
  medicoTratante?: string;
  diagnostico?: string;
  valorEstimado?: string;
  documentoBeneficiario?: string;
  estadoBeneficiario?: 'Activo' | 'Inactivo';
}

/* ─── Constantes ────────────────────────────────────── */

export const TIPOS_ATENCION = [
  'Consulta General', 
  'Control', 
  'Urgencia', 
  'Especializada'
];

export const ESTADOS_ORDEN = {
  A: 'Activa',
  I: 'Inactiva',
  P: 'Pendiente'
};

/* ─── Mock Data para pruebas ───────────────────────── */

export const MOCK_ORDENES: OrdenAtencion[] = [
  { 
    id: 1, 
    numero: 668, 
    vigencia: 2025, 
    beneficiario: 'AGUIRRE CAMACHO\nLUIS ALEJANDRO', 
    contratista: 'ABRIL GALEANO GIOVANNI', 
    especialidad: '0', 
    fecha: '14 feb 2025', 
    estado: 'A',
    tipoAtencion: '0',
    diagnostico: 'REMISIÓN A CONSULTA ESPECIALIZADA POR DE...',
    observaciones: 'SE AUTORIZA CONSULTA ESPECIALIZADA POR DERMATOLOGÍA. TARIFA PACTADA.',
    funcionarioSolicitante: 'MÉDICO TRATANTE',
    medicoTratante: 'DR. RODRIGUEZ MARIO',
    documentoBeneficiario: '9526609',
    estadoBeneficiario: 'Activo'
  },
  { 
    id: 2, 
    numero: 669, 
    vigencia: 2025, 
    beneficiario: 'MARTINEZ LAURA', 
    documentoBeneficiario: '10203040', 
    estadoBeneficiario: 'Activo', 
    contratista: 'ABRIL GALEANO GIOVANNI', 
    especialidad: '0', 
    fecha: '14 feb 2025', 
    estado: 'A' 
  },
  { 
    id: 3, 
    numero: 670, 
    vigencia: 2025, 
    beneficiario: 'ROJAS RODRIGUEZ\nLUISA', 
    documentoBeneficiario: '50607080', 
    estadoBeneficiario: 'Activo', 
    contratista: 'ABRIL GALEANO GIOVANNI', 
    especialidad: '0', 
    fecha: '14 feb 2025', 
    estado: 'A' 
  },
  { 
    id: 4, 
    numero: 671, 
    vigencia: 2025, 
    beneficiario: 'ALARCON SALOMON', 
    documentoBeneficiario: '9526609', 
    estadoBeneficiario: 'Activo', 
    contratista: 'ABRIL GALEANO GIOVANNI', 
    especialidad: '0', 
    fecha: '14 feb 2025', 
    estado: 'A' 
  },
];
