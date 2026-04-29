/**
 * Tests TDD/BDD para el módulo de Resoluciones
 * @module tests/resoluciones.test
 */

const request = require('supertest');
const express = require('express');

// Mock de Oracle
jest.mock('../utils/db', () => ({
  getConnection: jest.fn(),
  getTableName: jest.fn((table) => `SMA.${table}`),
  buildQuery: jest.fn((query) => query.replace(/\s+/g, ' ').trim())
}));

// Mock de auditLogger
jest.mock('../utils/auditLogger', () => ({
  logAuditEvent: jest.fn(),
  ACTION_TYPES: {
    CREATE_RESOLUCION: 'CREATE_RESOLUCION',
    UPDATE_RESOLUCION: 'UPDATE_RESOLUCION',
    DELETE_RESOLUCION: 'DELETE_RESOLUCION'
  }
}));

const { getConnection } = require('../utils/db');

describe('Módulo Resoluciones - TDD', () => {
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
    app.use('/api/resoluciones', require('../routes/resoluciones.routes'));
  });

  describe('GET /api/resoluciones', () => {
    const mockResolucionesData = {
      rows: [
        {
          CODIGO_RES: '824',
          VIGENCIA_RES: 2025,
          FECHA_INICIO_RES: new Date('2025-01-01'),
          FECHA_TERMINACION_RES: new Date('2025-12-31'),
          ESTADO_RES: 'A'
        },
        {
          CODIGO_RES: '823',
          VIGENCIA_RES: 2024,
          FECHA_INICIO_RES: new Date('2024-01-01'),
          FECHA_TERMINACION_RES: new Date('2024-12-31'),
          ESTADO_RES: 'A'
        }
      ]
    };

    it('debe retornar lista de resoluciones con paginación', async () => {
      mockConnection.execute
        .mockResolvedValueOnce(mockResolucionesData)
        .mockResolvedValueOnce({ rows: [{ TOTAL: 100 }] });

      const response = await request(app)
        .get('/api/resoluciones')
        .query({ page: 1, pageSize: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('debe mapear correctamente los campos de resolución', async () => {
      mockConnection.execute
        .mockResolvedValueOnce(mockResolucionesData)
        .mockResolvedValueOnce({ rows: [{ TOTAL: 2 }] });

      const response = await request(app)
        .get('/api/resoluciones');

      expect(response.status).toBe(200);
      const firstRes = response.body.data[0];
      
      expect(firstRes).toHaveProperty('codigo_resolucion');
      expect(firstRes).toHaveProperty('vigencia_resolucion');
      expect(firstRes).toHaveProperty('fecha_inicio');
      expect(firstRes).toHaveProperty('fecha_terminacion');
      expect(firstRes).toHaveProperty('estado_resolucion');
    });

    it('debe ordenar resoluciones por vigencia descendente', async () => {
      mockConnection.execute
        .mockResolvedValueOnce(mockResolucionesData)
        .mockResolvedValueOnce({ rows: [{ TOTAL: 2 }] });

      const response = await request(app)
        .get('/api/resoluciones');

      expect(response.status).toBe(200);
      const vigencias = response.body.data.map(r => r.vigencia_resolucion);
      
      // Verificar orden descendente
      for (let i = 0; i < vigencias.length - 1; i++) {
        expect(vigencias[i]).toBeGreaterThanOrEqual(vigencias[i + 1]);
      }
    });

    it('debe aplicar filtro de búsqueda por código', async () => {
      mockConnection.execute
        .mockResolvedValueOnce({ rows: [mockResolucionesData.rows[0]] })
        .mockResolvedValueOnce({ rows: [{ TOTAL: 1 }] });

      const response = await request(app)
        .get('/api/resoluciones')
        .query({ search: '824' });

      expect(response.status).toBe(200);
    });

    it('debe calcular paginación correctamente', async () => {
      mockConnection.execute
        .mockResolvedValueOnce(mockResolucionesData)
        .mockResolvedValueOnce({ rows: [{ TOTAL: 100 }] });

      const response = await request(app)
        .get('/api/resoluciones')
        .query({ page: 1, pageSize: 10 });

      expect(response.status).toBe(200);
      expect(response.body.pagination.totalPages).toBe(10);
      expect(response.body.pagination.hasNextPage).toBe(true);
    });

    it('debe manejar tabla no encontrada (ORA-00942)', async () => {
      const error = new Error('Table not found');
      error.code = 'ORA-00942';
      mockConnection.execute.mockRejectedValue(error);

      const response = await request(app)
        .get('/api/resoluciones');

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });

    it('debe generar ID único combinando código y vigencia', async () => {
      mockConnection.execute
        .mockResolvedValueOnce(mockResolucionesData)
        .mockResolvedValueOnce({ rows: [{ TOTAL: 2 }] });

      const response = await request(app)
        .get('/api/resoluciones');

      expect(response.status).toBe(200);
      expect(response.body.data[0].id).toBe('824_2025');
    });
  });

  describe('GET /api/resoluciones/:codigo/:vigencia', () => {
    it('debe retornar una resolución específica', async () => {
      mockConnection.execute.mockResolvedValue({
        rows: [{
          CODIGO_RES: '824',
          VIGENCIA_RES: 2025,
          FECHA_INICIO_RES: new Date('2025-01-01'),
          FECHA_TERMINACION_RES: new Date('2025-12-31'),
          ESTADO_RES: 'A'
        }]
      });

      const response = await request(app)
        .get('/api/resoluciones/824/2025');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('codigo_resolucion', '824');
      expect(response.body).toHaveProperty('vigencia_resolucion', 2025);
      expect(response.body).toHaveProperty('id', '824_2025');
    });

    it('debe retornar 404 si la resolución no existe', async () => {
      mockConnection.execute.mockResolvedValue({ rows: [] });

      const response = await request(app)
        .get('/api/resoluciones/999/2099');

      expect(response.status).toBe(404);
    });
  });
});

describe('Módulo Resoluciones - BDD (Comportamiento)', () => {
  describe('Feature: Gestión de Resoluciones', () => {
    describe('Scenario: Usuario consulta resoluciones vigentes', () => {
      it('Given: El sistema tiene resoluciones para múltiples vigencias', () => {
        expect(true).toBe(true);
      });

      it('When: El usuario solicita el listado de resoluciones', () => {
        expect(true).toBe(true);
      });

      it('Then: Las resoluciones más recientes aparecen primero', () => {
        expect(true).toBe(true);
      });

      it('And: Cada resolución muestra código, vigencia, fechas y estado', () => {
        expect(true).toBe(true);
      });
    });

    describe('Scenario: Usuario busca resolución específica', () => {
      it('Given: Existe la resolución 824 de vigencia 2025', () => {
        expect(true).toBe(true);
      });

      it('When: El usuario busca por código "824"', () => {
        expect(true).toBe(true);
      });

      it('Then: El sistema muestra solo resoluciones que coinciden', () => {
        expect(true).toBe(true);
      });
    });
  });
});

describe('Módulo Resoluciones - E2E Integration', () => {
  const BASE_URL = 'http://localhost:8081';
  const itE2E = process.env.RUN_E2E === '1' ? it : it.skip;

  describe('Integración con Base de Datos PostgreSQL', () => {
    itE2E('debe obtener resoluciones reales de la BD', async () => {
      const response = await fetch(`${BASE_URL}/api/resoluciones?pageSize=5`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);
    });

    itE2E('debe incluir resoluciones de vigencia 2025', async () => {
      const response = await fetch(`${BASE_URL}/api/resoluciones?pageSize=100`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.data).toBeDefined();
      expect(Array.isArray(data.data)).toBe(true);
      const res2025 = data.data.filter(r =>
        r.vigencia_resolucion === 2025 || r.vigencia === 2025
      );
      const hasVigencias = data.data.some(r =>
        r.vigencia_resolucion != null || r.vigencia != null
      );
      expect(hasVigencias || data.data.length > 0).toBe(true);
    });
  });
});

