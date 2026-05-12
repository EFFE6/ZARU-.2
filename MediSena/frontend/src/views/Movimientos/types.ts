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
  { id: 5, numero: 672, vigencia: 2025, beneficiario: 'PEREZ JUAN', contratista: 'GARCIA CARLOS', especialidad: 'General', fecha: '15 feb 2025', estado: 'A' },
  { id: 6, numero: 673, vigencia: 2025, beneficiario: 'LOPEZ MARIA', contratista: 'LOPEZ ELENA', especialidad: 'Pediatría', fecha: '15 feb 2025', estado: 'A' },
  { id: 7, numero: 674, vigencia: 2025, beneficiario: 'GOMEZ LUIS', contratista: 'RAMIREZ JOSE', especialidad: 'Dermatología', fecha: '16 feb 2025', estado: 'P' },
  { id: 8, numero: 675, vigencia: 2025, beneficiario: 'TORRES ANA', contratista: 'SUAREZ MARTHA', especialidad: 'Ginecología', fecha: '16 feb 2025', estado: 'A' },
  { id: 9, numero: 676, vigencia: 2025, beneficiario: 'DIAZ PEDRO', contratista: 'MENDOZA RAUL', especialidad: 'Urología', fecha: '17 feb 2025', estado: 'I' },
  { id: 10, numero: 677, vigencia: 2025, beneficiario: 'HERNANDEZ ROSA', contratista: 'ABRIL GALEANO GIOVANNI', especialidad: '0', fecha: '17 feb 2025', estado: 'A' },
  { id: 11, numero: 678, vigencia: 2025, beneficiario: 'CASTRO JORGE', contratista: 'GARCIA CARLOS', especialidad: 'General', fecha: '18 feb 2025', estado: 'A' },
  { id: 12, numero: 679, vigencia: 2025, beneficiario: 'RUIZ CARMEN', contratista: 'LOPEZ ELENA', especialidad: 'Pediatría', fecha: '18 feb 2025', estado: 'P' },
  { id: 13, numero: 680, vigencia: 2025, beneficiario: 'MORALES FABIO', contratista: 'RAMIREZ JOSE', especialidad: 'Dermatología', fecha: '19 feb 2025', estado: 'A' },
  { id: 14, numero: 681, vigencia: 2025, beneficiario: 'ORTEGA SONIA', contratista: 'SUAREZ MARTHA', especialidad: 'Ginecología', fecha: '19 feb 2025', estado: 'A' },
  { id: 15, numero: 682, vigencia: 2025, beneficiario: 'JIMENEZ RAFAEL', contratista: 'MENDOZA RAUL', especialidad: 'Urología', fecha: '20 feb 2025', estado: 'A' },
  { id: 16, numero: 683, vigencia: 2025, beneficiario: 'VARGAS GLORIA', contratista: 'ABRIL GALEANO GIOVANNI', especialidad: '0', fecha: '20 feb 2025', estado: 'I' },
  { id: 17, numero: 684, vigencia: 2025, beneficiario: 'REYES HUGO', contratista: 'GARCIA CARLOS', especialidad: 'General', fecha: '21 feb 2025', estado: 'A' },
  { id: 18, numero: 685, vigencia: 2025, beneficiario: 'SILVA BEATRIZ', contratista: 'LOPEZ ELENA', especialidad: 'Pediatría', fecha: '21 feb 2025', estado: 'A' },
  { id: 19, numero: 686, vigencia: 2025, beneficiario: 'NUNEZ ALVARO', contratista: 'RAMIREZ JOSE', especialidad: 'Dermatología', fecha: '22 feb 2025', estado: 'P' },
  { id: 20, numero: 687, vigencia: 2025, beneficiario: 'SOLIS IRENE', contratista: 'SUAREZ MARTHA', especialidad: 'Ginecología', fecha: '22 feb 2025', estado: 'A' },
  { id: 21, numero: 688, vigencia: 2025, beneficiario: 'LARA VICTOR', contratista: 'MENDOZA RAUL', especialidad: 'Urología', fecha: '23 feb 2025', estado: 'A' },
  { id: 22, numero: 689, vigencia: 2025, beneficiario: 'FLORES ALICIA', contratista: 'ABRIL GALEANO GIOVANNI', especialidad: '0', fecha: '23 feb 2025', estado: 'A' },
  { id: 23, numero: 690, vigencia: 2025, beneficiario: 'CORTES OSCAR', contratista: 'GARCIA CARLOS', especialidad: 'General', fecha: '24 feb 2025', estado: 'A' },
  { id: 24, numero: 691, vigencia: 2025, beneficiario: 'MARIN CLARA', contratista: 'LOPEZ ELENA', especialidad: 'Pediatría', fecha: '24 feb 2025', estado: 'A' },
];
