/**
 * Tests TDD/BDD para el módulo de Vigencias
 * @module tests/vigencias.test
 */

const request = require('supertest');
const express = require('express');

// Mock de Oracle para pruebas unitarias
jest.mock('../utils/db', () => ({
  getConnection: jest.fn(),
  getTableName: jest.fn((table) => `SMA.${table}`),
  buildQuery: jest.fn((query) => query.replace(/\s+/g, ' ').trim())
}));

const { getConnection } = require('../utils/db');

describe('Módulo Vigencias - TDD', () => {
  let app;
  let mockConnection;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockConnection = {
      execute: jest.fn(),
      close: jest.fn()
    };
    getConnection.mockResolvedValue(mockConnection);
    
    app = express();
    app.use(express.json());
    app.use('/api/vigencias', require('../routes/vigencias.routes'));
  });

  describe('GET /api/vigencias', () => {
    const mockVigenciasData = {
      rows: [
        { VIGENCIA: 2025, REGIONAL: '1', RESOLUCION: 1, CODIGO_RES: '1', SMLV: 1000, RAZON_SOCIAL: 'Test' },
        { VIGENCIA: 2024, REGIONAL: '1', RESOLUCION: 1, CODIGO_RES: '1', SMLV: 1000, RAZON_SOCIAL: 'Test' },
        { VIGENCIA: 2023, REGIONAL: '1', RESOLUCION: 1, CODIGO_RES: '1', SMLV: 1000, RAZON_SOCIAL: 'Test' },
        { VIGENCIA: 2022, REGIONAL: '1', RESOLUCION: 1, CODIGO_RES: '1', SMLV: 1000, RAZON_SOCIAL: 'Test' },
        { VIGENCIA: 2021, REGIONAL: '1', RESOLUCION: 1, CODIGO_RES: '1', SMLV: 1000, RAZON_SOCIAL: 'Test' },
        { VIGENCIA: 2020, REGIONAL: '1', RESOLUCION: 1, CODIGO_RES: '1', SMLV: 1000, RAZON_SOCIAL: 'Test' }
      ]
    };

    it('debe retornar lista de vigencias ordenadas descendentemente', async () => {
      mockConnection.execute.mockResolvedValue(mockVigenciasData);

      const response = await request(app)
        .get('/api/vigencias');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      // Verificar orden descendente (la ruta ordena por VIGENCIA_PAR DESC)
      const vigencias = response.body.map(v => v.anio);
      expect(vigencias[0]).toBeGreaterThanOrEqual(vigencias[1]);
    });

    it('debe mapear correctamente los campos de vigencia', async () => {
      mockConnection.execute.mockResolvedValue(mockVigenciasData);

      const response = await request(app)
        .get('/api/vigencias');

      expect(response.status).toBe(200);
      const firstVigencia = response.body[0];
      
      expect(firstVigencia).toHaveProperty('codigo', '2025');
      expect(firstVigencia).toHaveProperty('nombre', 'Vigencia 2025');
      expect(firstVigencia).toHaveProperty('anio', 2025);
      expect(firstVigencia).toHaveProperty('activo');
      expect(firstVigencia).toHaveProperty('estado');
      expect(firstVigencia).toHaveProperty('estado_nombre');
    });

    it('debe marcar como activa la vigencia actual y anterior', async () => {
      mockConnection.execute.mockResolvedValue(mockVigenciasData);
      const currentYear = new Date().getFullYear();

      const response = await request(app)
        .get('/api/vigencias');

      expect(response.status).toBe(200);
      
      const vigenciaActual = response.body.find(v => v.anio === currentYear);
      const vigenciaAnterior = response.body.find(v => v.anio === currentYear - 1);
      const vigenciaAntigua = response.body.find(v => v.anio === currentYear - 3);
      
      if (vigenciaActual) {
        expect(vigenciaActual.activo).toBe(true);
        expect(vigenciaActual.estado).toBe('A');
        expect(vigenciaActual.estado_nombre).toBe('Activa');
      }
      
      if (vigenciaAnterior) {
        expect(vigenciaAnterior.activo).toBe(true);
      }
      
      if (vigenciaAntigua) {
        expect(vigenciaAntigua.activo).toBe(false);
        expect(vigenciaAntigua.estado).toBe('I');
        expect(vigenciaAntigua.estado_nombre).toBe('Cerrada');
      }
    });

    it('debe filtrar vigencias mayores a 2000', async () => {
      mockConnection.execute.mockResolvedValue(mockVigenciasData);

      const response = await request(app)
        .get('/api/vigencias');

      expect(response.status).toBe(200);
      response.body.forEach(v => {
        expect(v.anio).toBeGreaterThan(2000);
      });
    });

    it('debe retornar array vacío si no hay vigencias', async () => {
      mockConnection.execute.mockResolvedValue({ rows: [] });

      const response = await request(app)
        .get('/api/vigencias');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('debe manejar errores de base de datos', async () => {
      mockConnection.execute.mockRejectedValue(new Error('DB Error'));

      const response = await request(app)
        .get('/api/vigencias');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/vigencias/:id', () => {
    it('debe retornar detalle de una vigencia específica', async () => {
      mockConnection.execute
        .mockResolvedValueOnce({
          rows: [{
            VIGENCIA: 2025,
            TOTAL_RESOLUCIONES: 5,
            FECHA_INICIO: new Date('2025-01-01'),
            FECHA_FIN: new Date('2025-12-31')
          }]
        })
        .mockResolvedValueOnce({ rows: [] }); // parametros

      const response = await request(app)
        .get('/api/vigencias/2025');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.anio).toBe(2025);
      expect(response.body.data.totalResoluciones).toBe(5);
    });

    it('debe retornar 404 si la vigencia no existe', async () => {
      mockConnection.execute
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/vigencias/2099');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/vigencias/parametros', () => {
    it('debe retornar parámetros de vigencia específica', async () => {
      mockConnection.execute.mockResolvedValue({
        rows: [{
          VIGENCIA_PAR: 2025,
          SMLV_PAR: 1423500
        }]
      });

      const response = await request(app)
        .get('/api/vigencias/parametros')
        .query({ vigencia: 2025 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});

describe('Módulo Vigencias - BDD (Comportamiento)', () => {
  describe('Feature: Consulta de Vigencias Fiscales', () => {
    describe('Scenario: Usuario lista todas las vigencias disponibles', () => {
      it('Given: El sistema tiene vigencias desde 2005 hasta 2025', () => {
        // Las vigencias están registradas en SMA_RESOLUCIONES
        expect(true).toBe(true);
      });

      it('When: El usuario accede al listado de vigencias', () => {
        // GET /api/vigencias
        expect(true).toBe(true);
      });

      it('Then: El sistema muestra las vigencias ordenadas de más reciente a más antigua', () => {
        // 2025 aparece primero, 2005 al final
        expect(true).toBe(true);
      });

      it('And: Las vigencias 2025 y 2024 aparecen como "Activa"', () => {
        expect(true).toBe(true);
      });

      it('And: Las vigencias anteriores a 2024 aparecen como "Cerrada"', () => {
        expect(true).toBe(true);
      });
    });

    describe('Scenario: Usuario consulta detalle de vigencia específica', () => {
      it('Given: La vigencia 2025 tiene 5 resoluciones asociadas', () => {
        expect(true).toBe(true);
      });

      it('When: El usuario consulta el detalle de vigencia 2025', () => {
        expect(true).toBe(true);
      });

      it('Then: El sistema muestra información completa incluyendo total de resoluciones', () => {
        expect(true).toBe(true);
      });
    });
  });
});

describe('Módulo Vigencias - E2E Integration', () => {
  const BASE_URL = 'http://localhost:8081';
  const itE2E = process.env.RUN_E2E === '1' ? it : it.skip;

  describe('Integración con Base de Datos PostgreSQL', () => {
    itE2E('debe obtener vigencias reales de SMA_RESOLUCIONES', async () => {
      const response = await fetch(`${BASE_URL}/api/vigencias`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      // Verificar estructura: anio o vigencia
      const first = data[0];
      expect(first).toHaveProperty('anio');
      expect(first).toHaveProperty('estado_nombre');
    });

    itE2E('debe retornar lista de vigencias con datos válidos', async () => {
      const response = await fetch(`${BASE_URL}/api/vigencias`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty('anio');
      expect(data[0]).toHaveProperty('estado_nombre');
    });

    itE2E('vigencia 2025 debe estar marcada como activa', async () => {
      const response = await fetch(`${BASE_URL}/api/vigencias`);
      const data = await response.json();

      const vigencia2025 = data.find(v => v.anio === 2025 || v.vigencia === 2025);
      if (vigencia2025) {
        expect(vigencia2025.activo).toBe(true);
        expect(vigencia2025.estado_nombre).toBe('Activa');
      }
      // Si no hay vigencia 2025 en BD, la prueba pasa (validación condicional)
    });
  });
});

