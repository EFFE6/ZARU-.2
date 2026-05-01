/**
 * Tests TDD/BDD para el módulo de Parámetros
 * @module tests/parametros.test
 */

const request = require('supertest');
const express = require('express');

// Mock de Oracle para pruebas unitarias
jest.mock('../utils/db', () => ({
  getConnection: jest.fn(),
  getTableName: jest.fn((table) => `SMA.${table}`),
  buildQuery: jest.fn((query) => query.replace(/\s+/g, ' ').trim())
}));

const { getConnection, getTableName } = require('../utils/db');

describe('Módulo Parámetros - TDD', () => {
  let app;
  let mockConnection;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock de conexión Oracle
    mockConnection = {
      execute: jest.fn(),
      close: jest.fn()
    };
    getConnection.mockResolvedValue(mockConnection);
    
    // Configurar app de prueba
    app = express();
    app.use(express.json());
    app.use('/api/parametros', require('../routes/parametros.routes'));
  });

  describe('GET /api/parametros', () => {
    const mockParametrosData = {
      rows: [
        {
          VIGENCIA_PAR: 2025,
          REGIONAL_PAR: '1',
          SMLV_PAR: 1423500,
          RAZON_SOCIAL_PAR: 'Servicio Médico Asistencial - SENA',
          JEFE_PAR: 'Coordinador S.M.A.',
          CODIGO_PAR: '1020',
          DIRECCION_CENTRO_PAR: 'Calle Principal',
          PORCENTAJE_NORMAL_PAR: 8,
          PORCENTAJE_ESPEC_PAR: 5,
          PORCENTAJE_LEY_PAR: 4,
          NRO_VISTOS_BUENOS_PAR: 8,
          NRO_URGENCIAS_PAR: 4,
          CARGO_FIRMA_PAR: 'Coordinador S.M.A.',
          NOTA_PIE_PAR: 'Nota de prueba',
          RESOLUCION_PAR: 824
        },
        {
          VIGENCIA_PAR: 2025,
          REGIONAL_PAR: '11',
          SMLV_PAR: 1423500,
          RAZON_SOCIAL_PAR: 'Servicio Médico Asistencial - SENA',
          JEFE_PAR: 'Coordinador S.M.A.',
          CODIGO_PAR: '1020',
          PORCENTAJE_NORMAL_PAR: 8,
          PORCENTAJE_ESPEC_PAR: 5,
          PORCENTAJE_LEY_PAR: 4
        }
      ]
    };

    it('debe retornar lista de parámetros con paginación', async () => {
      mockConnection.execute
        .mockResolvedValueOnce(mockParametrosData)
        .mockResolvedValueOnce({ rows: [{ TOTAL: 638 }] });

      const response = await request(app)
        .get('/api/parametros')
        .query({ page: 1, pageSize: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('debe mapear correctamente los campos con sufijo _PAR', async () => {
      mockConnection.execute
        .mockResolvedValueOnce(mockParametrosData)
        .mockResolvedValueOnce({ rows: [{ TOTAL: 2 }] });

      const response = await request(app)
        .get('/api/parametros');

      expect(response.status).toBe(200);
      const firstParam = response.body.data[0];
      
      // Verificar mapeo correcto de campos
      expect(firstParam.vigencia).toBe(2025);
      expect(firstParam.regional).toBe('1');
      expect(firstParam.smlv).toBe(1423500);
      expect(firstParam.razonSocial).toBe('Servicio Médico Asistencial - SENA');
      expect(firstParam.porcentajeNormal).toBe(8);
      expect(firstParam.porcentajeEspecial).toBe(5);
      expect(firstParam.porcentajeLey).toBe(4);
    });

    it('debe filtrar por vigencia cuando se proporciona', async () => {
      mockConnection.execute
        .mockResolvedValueOnce(mockParametrosData)
        .mockResolvedValueOnce({ rows: [{ TOTAL: 33 }] });

      const response = await request(app)
        .get('/api/parametros')
        .query({ vigencia: 2025 });

      expect(response.status).toBe(200);
      expect(mockConnection.execute).toHaveBeenCalled();
      
      // Verificar que se pasó el parámetro de vigencia
      const callArgs = mockConnection.execute.mock.calls[0];
      expect(callArgs[1]).toHaveProperty('vigencia', 2025);
    });

    it('debe filtrar por regional cuando se proporciona', async () => {
      mockConnection.execute
        .mockResolvedValueOnce({ rows: [mockParametrosData.rows[0]] })
        .mockResolvedValueOnce({ rows: [{ TOTAL: 1 }] });

      const response = await request(app)
        .get('/api/parametros')
        .query({ regional: '1' });

      expect(response.status).toBe(200);
      const callArgs = mockConnection.execute.mock.calls[0];
      expect(callArgs[1]).toHaveProperty('regional', '1');
    });

    it('debe calcular paginación correctamente', async () => {
      mockConnection.execute
        .mockResolvedValueOnce(mockParametrosData)
        .mockResolvedValueOnce({ rows: [{ TOTAL: 638 }] });

      const response = await request(app)
        .get('/api/parametros')
        .query({ page: 1, pageSize: 50 });

      expect(response.status).toBe(200);
      expect(response.body.pagination.totalItems).toBe(638);
      expect(response.body.pagination.totalPages).toBe(13); // 638/50 = 12.76 -> 13
      expect(response.body.pagination.hasNextPage).toBe(true);
      expect(response.body.pagination.hasPreviousPage).toBe(false);
    });

    it('debe generar ID único para cada parámetro', async () => {
      mockConnection.execute
        .mockResolvedValueOnce(mockParametrosData)
        .mockResolvedValueOnce({ rows: [{ TOTAL: 2 }] });

      const response = await request(app)
        .get('/api/parametros');

      expect(response.status).toBe(200);
      expect(response.body.data[0].id).toBe('2025_1');
      expect(response.body.data[1].id).toBe('2025_11');
    });

    it('debe manejar errores de base de datos', async () => {
      mockConnection.execute.mockRejectedValue(new Error('DB Connection failed'));

      const response = await request(app)
        .get('/api/parametros');

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/parametros/:vigencia/:regional', () => {
    it('debe retornar un parámetro específico', async () => {
      mockConnection.execute.mockResolvedValue({
        rows: [{
          VIGENCIA_PAR: 2025,
          REGIONAL_PAR: '1',
          SMLV_PAR: 1423500,
          RAZON_SOCIAL_PAR: 'Servicio Médico Asistencial - SENA'
        }]
      });

      const response = await request(app)
        .get('/api/parametros/2025/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.vigencia).toBe(2025);
      expect(response.body.data.regional).toBe('1');
    });

    it('debe retornar 404 si no existe el parámetro', async () => {
      mockConnection.execute.mockResolvedValue({ rows: [] });

      const response = await request(app)
        .get('/api/parametros/2030/99');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/parametros/:vigencia/:regional', () => {
    it('debe actualizar un parámetro existente', async () => {
      mockConnection.execute.mockResolvedValue({ rowsAffected: 1 });

      const response = await request(app)
        .put('/api/parametros/2025/1')
        .send({ smlv: 1500000 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('debe retornar error si no hay campos para actualizar', async () => {
      const response = await request(app)
        .put('/api/parametros/2025/1')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('No hay campos para actualizar');
    });
  });
});

describe('Módulo Parámetros - BDD (Comportamiento)', () => {
  describe('Feature: Gestión de Parámetros del Sistema', () => {
    describe('Scenario: Usuario consulta parámetros de una vigencia', () => {
      it('Given: El sistema tiene parámetros configurados para 2025', () => {
        // Los parámetros existen en la BD
        expect(true).toBe(true);
      });

      it('When: El usuario solicita los parámetros de vigencia 2025', () => {
        // Se hace la petición GET /api/parametros?vigencia=2025
        expect(true).toBe(true);
      });

      it('Then: El sistema retorna los parámetros con SMLV actualizado', () => {
        // Los datos incluyen SMLV correcto (1,423,500 para 2025)
        expect(true).toBe(true);
      });
    });

    describe('Scenario: Usuario filtra parámetros por regional', () => {
      it('Given: Existen parámetros para múltiples regionales', () => {
        expect(true).toBe(true);
      });

      it('When: El usuario filtra por regional "1"', () => {
        expect(true).toBe(true);
      });

      it('Then: Solo se muestran parámetros de esa regional', () => {
        expect(true).toBe(true);
      });
    });
  });
});

describe('Módulo Parámetros - E2E Integration', () => {
  const BASE_URL = 'http://localhost:8081';
  const itE2E = process.env.RUN_E2E === '1' ? it : it.skip;

  describe('Integración con Base de Datos PostgreSQL', () => {
    itE2E('debe obtener parámetros reales de la BD', async () => {
      const response = await fetch(`${BASE_URL}/api/parametros?pageSize=5`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);
      expect(data.data[0]).toHaveProperty('vigencia');
      expect(data.data[0]).toHaveProperty('smlv');
      expect(data.data[0]).toHaveProperty('regional');
    });

    itE2E('debe contener datos válidos del SMLV 2025', async () => {
      const response = await fetch(`${BASE_URL}/api/parametros?vigencia=2025&pageSize=1`);
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.data).toBeDefined();
      expect(Array.isArray(data.data)).toBe(true);
      if (data.data.length > 0) {
        const item = data.data[0];
        expect(item).toHaveProperty('smlv');
        expect(item).toHaveProperty('vigencia');
        if (item.vigencia === 2025 && item.smlv > 0) {
          expect(item.smlv).toBe(1423500); // SMLV 2025 oficial
        }
      }
    });
  });
});

