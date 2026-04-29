const mockResoluciones = [
  {
    CODIGO_RES: 'RES-2024-001',
    VIGENCIA_RES: 2024,
    FECHA_INICIO_RES: '2024-01-01',
    FECHA_TERMINACION_RES: '2024-12-31',
    ESTADO_RES: 'A',
    DESC_RESOLUCION: 'Resolución Principal 2024',
    TIPO_RESOLUCION: 'POLÍTICA',
    COD_REGIONAL: '001'
  },
  {
    CODIGO_RES: 'RES-2024-002',
    VIGENCIA_RES: 2024,
    FECHA_INICIO_RES: '2024-06-01',
    FECHA_TERMINACION_RES: '2024-12-31',
    ESTADO_RES: 'A',
    DESC_RESOLUCION: 'Resolución Secundaria 2024',
    TIPO_RESOLUCION: 'OPERATIVA',
    COD_REGIONAL: '001'
  }
];

const mockUsuarios = [
  {
    MAIL_USUA: 'admin@medisena.local',
    CLAV_USUA: 'admin',
    ROL_USUA: 'ADMIN',
    NOMB_USUA: 'Admin Local',
    COD_REGI_USUA: '001',
    COD_DEPE_USUA: '100',
    COD_TIPO_USUA: 'A',
    ESTADO_USUA: '1',
    EXTENSION_USUA: '123'
  }
];

const mockVigencias = [
  { VIGENCIA: 2024, ESTADO_VIGENCIA: 'A' },
  { VIGENCIA: 2023, ESTADO_VIGENCIA: 'C' }
];

const mockNiveles = [
  { COD_NIVEL: '1', NOMBRE_NIVEL: 'Nivel 1', ESTADO: 'A' },
  { COD_NIVEL: '2', NOMBRE_NIVEL: 'Nivel 2', ESTADO: 'A' }
];

const mockParentescos = [
  { COD_PARE: '01', NOMB_PARE: 'Cónyuge' },
  { COD_PARE: '02', NOMB_PARE: 'Hijo' }
];

const mockGruposTope = [
  {
    COD_GRUPO_TOPE: '001',
    NOMB_GRUPO_TOPE: 'Grupo Tope Nivel 1',
    COD_RESOLUCION_GRUPO: 'RES-001-2024',
    VIGENCIA_GRUPO: 2024,
    COD_NIVEL_TOPE: 'NIV001',
    VALOR_NORMAL_CAT_A: 150000.50,
    VALOR_NORMAL_CAT_B: 120000.25,
    VALOR_NORMAL_CAT_C: 100000.75,
    VALOR_NORMAL_CAT_D: 80000.00,
    VALOR_ESPECIAL_CAT_A: 200000.00,
    VALOR_ESPECIAL_CAT_B: 180000.50,
    VALOR_ESPECIAL_CAT_C: 150000.25,
    VALOR_ESPECIAL_CAT_D: 120000.75
  }
];

const mockParametros = [
  {
    VIGENCIA_PAR: 2024,
    REGIONAL_PAR: '01',
    SMLV_PAR: 1300000.00,
    RAZON_SOCIAL_PAR: 'SENA',
    JEFE_PAR: 'Juan Perez',
    CODIGO_PAR: 'PARAM-001',
    DIRECCION_CENTRO_PAR: 'Calle Falsa 123',
    PORCENTAJE_NORMAL_PAR: 10,
    PORCENTAJE_ESPEC_PAR: 15,
    PORCENTAJE_LEY_PAR: 20,
    NRO_VISTOS_BUENOS_PAR: 2,
    NRO_URGENCIAS_PAR: 5,
    CARGO_FIRMA_PAR: 'Director',
    NOTA_PIE_PAR: 'Nota al pie',
    NOTA_AUDITOR_PAR: 'Nota del auditor',
    NOMBRE_AUDITOR_PAR: 'Pedro Auditor',
    CARGO_AUDITOR_PAR: 'Auditor Jefe',
    RESOLUCION_PAR: 'RES-2024-001'
  }
];

const mockSubEspecialidades = [
  {
    NIT_ADSC_SUBESP: 123456789,
    COD_REGI_ADSC_SUBESP: '01',
    CONSECUTIVO_SUBESP: 1,
    NOMBRE_SUBESP: 'Cardiología Pediátrica',
    MEDICAMENTOS_SUBESP: 'S'
  },
  {
    NIT_ADSC_SUBESP: 987654321,
    COD_REGI_ADSC_SUBESP: '01',
    CONSECUTIVO_SUBESP: 2,
    NOMBRE_SUBESP: 'Neurología Adultos',
    MEDICAMENTOS_SUBESP: 'N'
  }
];

module.exports = {
  getMockConnection: () => {
    return {
      execute: async (sql, binds = {}, options = {}) => {
        let rows = [];
        const query = sql.toUpperCase();
        
        if (query.includes('SMA_RESOLUCIONES')) {
          if (query.includes('COUNT(*)')) rows = [{ TOTAL: mockResoluciones.length }];
          else rows = mockResoluciones;
        } else if (query.includes('SMA_USUA')) {
          rows = mockUsuarios;
        } else if (query.includes('SMA_VIGENCIAS')) {
          rows = mockVigencias;
        } else if (query.includes('SMA_NIVELES')) {
          rows = mockNiveles;
        } else if (query.includes('SMA_PARENTESCOS')) {
          if (query.includes('COUNT(*)')) rows = [{ TOTAL: mockParentescos.length }];
          else rows = mockParentescos;
        } else if (query.includes('SMA_GRUPOS_TOPE')) {
          if (query.includes('COUNT(*)')) rows = [{ TOTAL: mockGruposTope.length }];
          else rows = mockGruposTope;
        } else if (query.includes('SMA_PARAMETROS')) {
          if (query.includes('COUNT(*)')) rows = [{ TOTAL: mockParametros.length }];
          else rows = mockParametros;
        } else if (query.includes('SMA_SUB_ESPECIALIDADES')) {
          if (query.includes('COUNT(*)')) rows = [{ TOTAL: mockSubEspecialidades.length }];
          else if (query.includes('DISTINCT COD_REGI_ADSC_SUBESP')) rows = [{ REGIONAL: '01' }];
          else rows = mockSubEspecialidades;
        } else {
          rows = [];
        }

        return {
          rows,
          rowsAffected: rows.length
        };
      },
      commit: async () => {},
      rollback: async () => {},
      close: () => {}
    };
  }
};
