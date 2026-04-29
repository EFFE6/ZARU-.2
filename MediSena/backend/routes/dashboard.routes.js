const express = require('express');
const { getConnection, getTableName, OUT_FORMAT_OBJECT } = require('../utils/db');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     DashboardStats:
 *       type: object
 *       properties:
 *         total_usuarios:
 *           type: integer
 *           example: 150
 *         total_beneficiarios:
 *           type: integer
 *           example: 5000
 *         total_beneficiarios_activos:
 *           type: integer
 *           example: 4500
 *         total_funcionarios:
 *           type: integer
 *           example: 200
 *         total_medicos:
 *           type: integer
 *           example: 50
 *         total_contratistas:
 *           type: integer
 *           example: 10
 *         total_ordenes:
 *           type: integer
 *           example: 1200
 *         total_citas:
 *           type: integer
 *           example: 800
 *         total_cuentas_cobro:
 *           type: integer
 *           example: 300
 *         total_recibos_caja:
 *           type: integer
 *           example: 250
 *         citas_hoy:
 *           type: integer
 *           example: 15
 *         ordenes_pendientes:
 *           type: integer
 *           example: 50
 *         excedentes_pendientes:
 *           type: integer
 *           example: 20
 */

/**
 * @swagger
 * /api/stats:
 *   get:
 *     summary: Obtener estadísticas del dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardStats'
 */
router.get('/', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    
    // Obtener estadísticas de diferentes tablas
    const queries = {
      usuarios: 'SELECT COUNT(*) as total FROM SMA.SMA_USUA',
      beneficiarios: 'SELECT COUNT(*) as total FROM SMA.SMA_BENEFICIARIOS',
      funcionarios: 'SELECT COUNT(*) as total FROM SMA.SMA_FUNCIONARIOS',
      medicos: 'SELECT COUNT(*) as total FROM SMA.SMA_MEDICOS',
      contratistas: 'SELECT COUNT(*) as total FROM SMA.SMA_CONTRATOS',
      ordenes: 'SELECT COUNT(*) as total FROM SMA.SMA_ORDENES',
      recibosCaja: 'SELECT COUNT(*) as total FROM SMA.SMA_RECIBOS_CAJA',
      cuentasCobro: 'SELECT COUNT(*) as total FROM SMA.SMA_CUENTAS_COBRO',
      agendas: 'SELECT COUNT(*) as total FROM SMA.SMA_AGENDAS'
    };
    
    const stats = {};
    const errors = {};
    
    // Ejecutar todas las consultas en paralelo
    const queryPromises = Object.keys(queries).map(async (key) => {
      try {
        const result = await conn.execute(queries[key], {}, { outFormat: OUT_FORMAT_OBJECT });
        const total = result.rows[0]?.TOTAL || result.rows[0]?.total || 0;
        return { key, total, error: null };
      } catch (error) {
        console.warn(`Error al obtener ${key}:`, error.message);
        return { key, total: 0, error: error.message };
      }
    });
    
    const results = await Promise.all(queryPromises);
    
    // Mapear resultados
    results.forEach(({ key, total, error }) => {
      if (error) {
        errors[key] = error;
      }
      stats[key] = parseInt(total);
    });
    
    // Beneficiarios activos: usar solo sma_beneficiarios (tabla canónica). No usar sma_beneficiarios_activos (redundante).
    try {
      const T_BEN = getTableName('SMA_BENEFICIARIOS');
      const result = await conn.execute(
        `SELECT COUNT(*) as total FROM ${T_BEN} WHERE estado_ben IN ('1','A') OR estado_ben::text IN ('1','A')`,
        {},
        { outFormat: OUT_FORMAT_OBJECT }
      );
      stats.beneficiariosActivos = parseInt(result.rows[0]?.total || result.rows[0]?.TOTAL || 0);
      if (stats.beneficiariosActivos === 0) stats.beneficiariosActivos = stats.beneficiarios || 0;
    } catch (error) {
      stats.beneficiariosActivos = stats.beneficiarios || 0;
      errors.beneficiariosActivos = error.message;
    }
    
    // Obtener citas de hoy (usando nombre correcto de columna)
    try {
      const agendasHoyQueries = [
        `SELECT COUNT(*) as total FROM SMA.SMA_AGENDAS WHERE TRUNC(FECHA_AGENDA) = TRUNC(SYSDATE)`
      ];
      
      let agendasHoy = 0;
      for (const query of agendasHoyQueries) {
        try {
          const result = await conn.execute(query, {}, { outFormat: OUT_FORMAT_OBJECT });
          agendasHoy = parseInt(result.rows[0]?.TOTAL || result.rows[0]?.total || 0);
          if (agendasHoy > 0 || result.rows.length > 0) break;
        } catch (e) {
          if (e.code !== 'ORA-00904') continue;
        }
      }
      stats.agendasHoy = agendasHoy;
    } catch (error) {
      stats.agendasHoy = 0;
      errors.agendasHoy = error.message;
    }
    
    // Obtener órdenes pendientes (intentar diferentes columnas)
    try {
      const ordenesPendientesQueries = [
        `SELECT COUNT(*) as total FROM SMA.SMA_ORDENES WHERE ESTADO_ORDEN != 'CERRADA' OR ESTADO_ORDEN IS NULL`,
        `SELECT COUNT(*) as total FROM SMA.SMA_ORDENES WHERE ESTADO != 'CERRADA' OR ESTADO IS NULL`
      ];
      
      let ordenesPendientes = 0;
      for (const query of ordenesPendientesQueries) {
        try {
          const result = await conn.execute(query, {}, { outFormat: OUT_FORMAT_OBJECT });
          ordenesPendientes = parseInt(result.rows[0]?.TOTAL || result.rows[0]?.total || 0);
          break;
        } catch (e) {
          if (e.code !== 'ORA-00904') continue;
        }
      }
      stats.ordenes_pendientes = ordenesPendientes;
    } catch (error) {
      stats.ordenes_pendientes = 0;
      errors.ordenes_pendientes = error.message;
    }
    
    // Cerrar conexión solo una vez al final
    if (conn) {
      try {
        await conn.close();
      } catch (e) {
        console.warn('Error al cerrar conexión:', e.message);
      }
    }
    
    // Formatear respuesta
    const response = {
      total_usuarios: stats.usuarios || 0,
      total_beneficiarios: stats.beneficiarios || 0,
      total_beneficiarios_activos: stats.beneficiariosActivos || stats.beneficiarios || 0,
      total_funcionarios: stats.funcionarios || 0,
      total_medicos: stats.medicos || 0,
      total_contratistas: stats.contratistas || 0,
      total_ordenes: stats.ordenes || 0,
      total_citas: stats.agendas || 0,
      total_cuentas_cobro: stats.cuentasCobro || 0,
      total_recibos_caja: stats.recibosCaja || 0,
      citas_hoy: stats.agendasHoy || 0,
      ordenes_pendientes: stats.ordenes_pendientes || 0,
      excedentes_pendientes: 0 // Por implementar
    };
    
    // Incluir errores si los hay (para debug)
    if (Object.keys(errors).length > 0) {
      console.warn('Errores al obtener algunas estadísticas:', errors);
    }
    
    res.json(response);
  } catch (error) {
    if (conn) {
      try {
        await conn.close();
      } catch (e) {
        console.warn('Error al cerrar conexión en catch:', e.message);
      }
    }
    console.error('Error al obtener estadísticas del dashboard:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: `Error al obtener estadísticas: ${error.message}`
    });
  }
});

/**
 * @swagger
 * /api/dashboard/citas-recientes:
 *   get:
 *     summary: Obtener citas recientes del dashboard
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Citas obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       FECHA_AGENDA:
 *                         type: string
 *                         format: date
 *                         example: "2026-03-31"
 *                       HORA_AGENDA:
 *                         type: string
 *                         example: "09:30"
 *                       PACIENTE:
 *                         type: string
 *                         example: "Juan Perez"
 *                       MEDICO:
 *                         type: string
 *                         example: "Dr. Carlos González"
 *                       ESPECIALIDAD:
 *                         type: string
 *                         example: "Medicina General"
 *                       CANCELADA_AGENDA:
 *                         type: string
 *                         example: "N"
 *                       LLEGADA_AGENDA:
 *                         type: string
 *                         example: "S"
 *                       ID_MEDICO:
 *                         type: integer
 *                         example: 1
 *                       IDEN_FUNC:
 *                         type: string
 *                         example: "123ABC"
 *                       LETRA_BEN:
 *                         type: string
 *                         example: "A"
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     pageSize:
 *                       type: integer
 *                       example: 10
 *                     totalItems:
 *                       type: integer
 *                       example: 50
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *                     hasNextPage:
 *                       type: boolean
 *                       example: true
 *                     hasPreviousPage:
 *                       type: boolean
 *                       example: false
 *       500:
 *         description: Error al obtener citas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   example: []
 *                 message:
 *                   type: string
 *                   example: "No se pudieron obtener citas"
 *                 error:
 *                   type: string
 *                   example: "UNKNOWN_ERROR"
 */
router.get('/citas-recientes', async (req, res) => {
  let conn;
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const limit = parseInt(pageSize);
    const offset = (parseInt(page) - 1) * limit;
    
    conn = await getConnection();
    
    // Consulta con JOINs correctos - usando TO_CHAR para el ID del médico
    // Obtiene citas recientes (últimas registradas) con datos de paciente y médico
    const queries = [
      // Query 1: Con JOINs usando TO_CHAR para el médico
      `   SELECT 
            a.FECHA_AGENDA,
            a.HORA_AGENDA,
            b.NOMB_BEN as PACIENTE,
            m.NOMB_MEDICO as MEDICO,
            a.CANCELADA_AGENDA,
            a.LLEGADA_AGENDA,
            a.ID_MEDICO_AGENDA,
            a.IDEN_FUNC_AGENDA,
            a.LETRA_BEN_AGENDA
          FROM SMA.SMA_AGENDAS a
          LEFT JOIN SMA.SMA_BENEFICIARIOS b ON a.IDEN_FUNC_AGENDA = b.IDEN_FUNC_BEN AND a.LETRA_BEN_AGENDA = b.LETRA_BEN
          LEFT JOIN SMA.SMA_MEDICOS m ON a.ID_MEDICO_AGENDA = m.ID_MEDICO
          ORDER BY a.FECHA_AGENDA DESC, a.HORA_AGENDA DESC
        LIMIT :limit OFFSET :offset`,
      // Query 2: Solo JOIN de beneficiarios (si médicos falla)
      `   SELECT 
            a.FECHA_AGENDA,
            a.HORA_AGENDA,
            b.NOMB_BEN as PACIENTE,
            a.ID_MEDICO_AGENDA,
            a.CANCELADA_AGENDA,
            a.LLEGADA_AGENDA,
            a.IDEN_FUNC_AGENDA,
            a.LETRA_BEN_AGENDA
          FROM SMA.SMA_AGENDAS a
          LEFT JOIN SMA.SMA_BENEFICIARIOS b ON a.IDEN_FUNC_AGENDA = b.IDEN_FUNC_BEN AND a.LETRA_BEN_AGENDA = b.LETRA_BEN
          ORDER BY a.FECHA_AGENDA DESC, a.HORA_AGENDA DESC
        LIMIT :limit OFFSET :offset`,
      // Query 3: Sin JOINs
      `SELECT * FROM (
        SELECT a.*, ROWNUM rnum FROM (
          SELECT a.*
          FROM SMA.SMA_AGENDAS a
          ORDER BY a.FECHA_AGENDA DESC, a.HORA_AGENDA DESC
        ) a WHERE ROWNUM <= :maxRow
      ) WHERE rnum > :minRow`
    ];
    
    let result;
    let lastError;
    let queryIndex = 0;
    for (const query of queries) {
      try {
        let queryParams;
        queryParams = {
          limit,
          offset
        };
        result = await conn.execute(query, queryParams, { outFormat: OUT_FORMAT_OBJECT });
        if (result.rows && result.rows.length > 0) {
          console.log(`✅ Consulta de citas exitosa usando query ${queryIndex + 1}`);
          console.log(`Total de filas obtenidas: ${result.rows.length}`);
          console.log('Campos disponibles en primera fila:', Object.keys(result.rows[0] || {}));
          if (result.rows[0]) {
            console.log('Primera fila completa:', JSON.stringify(result.rows[0], null, 2).substring(0, 500));
          }
          break;
        }
      } catch (e) {
        lastError = e;
        console.warn(`⚠️ Error en consulta ${queryIndex + 1} de citas:`, e.code, e.message);
        // Continuar con siguiente consulta si es error de columna o bind
        if (e.code === 'ORA-00904' || e.code === 'NJS-098' || e.code === 'ORA-00942') {
          // Continuar con siguiente query
        } else {
          // Si es otro tipo de error, también intentar siguiente query
          console.warn(`Continuando con siguiente query después de error: ${e.code}`);
        }
      }
      queryIndex++;
    }
    
    if (!result || !result.rows || result.rows.length === 0) {
      // Si todas las consultas fallan, intentar consulta básica sin JOINs
      console.log('⚠️ Todas las consultas complejas fallaron, intentando consulta básica...');
      const basicQueries = [
        // Intentar con diferentes nombres de columna de fecha
        `SELECT * FROM SMA.SMA_AGENDAS 
         LIMIT :limit OFFSET :offset
         ORDER BY ROWID DESC`,
        `SELECT * FROM SMA.SMA_AGENDAS 
         WHERE ROWNUM <= 20`,
        `SELECT a.* FROM SMA.SMA_AGENDAS a 
         WHERE ROWNUM <= 20`
      ];
      
      for (const basicQuery of basicQueries) {
        try {
          result = await conn.execute(basicQuery, {}, { outFormat: OUT_FORMAT_OBJECT });
          if (result.rows && result.rows.length > 0) {
            console.log('✅ Consulta básica exitosa');
            console.log('Total de filas:', result.rows.length);
            if (result.rows[0]) {
              const firstRow = result.rows[0];
              console.log('Campos disponibles en primera fila:', Object.keys(firstRow));
              console.log('Primera fila completa (primeros 1000 chars):', JSON.stringify(firstRow, null, 2).substring(0, 1000));
              // Log específico de campos importantes
              console.log('Valores específicos:', {
                FECHA_AGENDA: firstRow.FECHA_AGENDA || 'NO ENCONTRADO',
                HORA_AGENDA: firstRow.HORA_AGENDA || 'NO ENCONTRADO',
                ID_MEDICO_AGENDA: firstRow.ID_MEDICO_AGENDA || 'NO ENCONTRADO',
                IDEN_FUNC_AGENDA: firstRow.IDEN_FUNC_AGENDA || 'NO ENCONTRADO',
                LETRA_BEN_AGENDA: firstRow.LETRA_BEN_AGENDA || 'NO ENCONTRADO',
              });
            }
            break;
          }
        } catch (e) {
          console.warn('⚠️ Error en consulta básica:', e.code, e.message);
          if (e.code === 'ORA-00942') {
            // Tabla no existe, retornar vacío
            if (conn) {
              try {
                await conn.close();
              } catch (closeErr) {
                console.warn('Error al cerrar conexión:', closeErr.message);
              }
            }
            return res.json({
              data: [],
              pagination: {
                page: parseInt(page),
                pageSize: parseInt(pageSize),
                totalItems: 0,
                totalPages: 0,
                hasNextPage: false,
                hasPreviousPage: false
              },
              message: 'Tabla SMA_AGENDAS no encontrada o sin acceso'
            });
          }
        }
      }
      
      if (!result || !result.rows || result.rows.length === 0) {
        if (conn) {
          try {
            await conn.close();
          } catch (closeErr) {
            console.warn('Error al cerrar conexión:', closeErr.message);
          }
        }
        // Retornar respuesta vacía en lugar de error
        return res.json({
          data: [],
          pagination: {
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            totalItems: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false
          },
          message: 'No se encontraron citas o tabla no disponible'
        });
      }
    }
    
    // Contar total
    const countQuery = `SELECT COUNT(*) as total FROM SMA.SMA_AGENDAS`;
    let countResult;
    try {
      countResult = await conn.execute(countQuery, {}, { outFormat: OUT_FORMAT_OBJECT });
    } catch (e) {
      countResult = { rows: [{ TOTAL: result?.rows?.length || 0 }] };
    }
    
    // Cerrar conexión solo una vez
    if (conn) {
      try {
        await conn.close();
      } catch (e) {
        console.warn('Error al cerrar conexión:', e.message);
      }
    }
    
    const total = countResult.rows[0]?.TOTAL || countResult.rows[0]?.total || result.rows.length;
    const totalPages = Math.ceil(total / parseInt(pageSize));
    
    // Mapear resultados con nombres correctos de campos
    const citas = result.rows.map(row => {
      return {
        FECHA_AGENDA: row.FECHA_AGENDA || null,
        HORA_AGENDA: row.HORA_AGENDA || null,
        PACIENTE: row.PACIENTE || row.NOMB_BEN || 'Sin asignar',
        MEDICO: row.MEDICO || row.NOMB_MEDICO || 'Sin asignar',
        ESPECIALIDAD: row.ESPECIALIDAD || row.NOMB_ESPE || 'Consulta General',
        CANCELADA_AGENDA: row.CANCELADA_AGENDA || 'N',
        LLEGADA_AGENDA: row.LLEGADA_AGENDA || null,
        ID_MEDICO: row.ID_MEDICO_AGENDA || null,
        IDEN_FUNC: row.IDEN_FUNC_AGENDA || null,
        LETRA_BEN: row.LETRA_BEN_AGENDA || null
      };
    });
    
    // Log del primer resultado mapeado para debug
    if (citas.length > 0) {
      console.log('Primera cita mapeada:', citas[0]);
    }
    
    res.json({
      data: citas,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalItems: parseInt(total),
        totalPages: totalPages,
        hasNextPage: parseInt(page) < totalPages,
        hasPreviousPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    if (conn) {
      try {
        await conn.close();
      } catch (e) {
        console.warn('Error al cerrar conexión en catch:', e.message);
      }
    }
    console.error('Error al obtener citas recientes:', error);
    
    // En lugar de retornar error 500, retornar respuesta vacía con mensaje
    // Esto permite que el frontend siga funcionando aunque no haya citas
    res.status(200).json({
      data: [],
      pagination: {
        page: parseInt(req.query.page || 1),
        pageSize: parseInt(req.query.pageSize || 10),
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false
      },
      message: `No se pudieron obtener citas: ${error.message}`,
      error: error.code || 'UNKNOWN_ERROR'
    });
  }
});

/**
 * @swagger
 * /api/dashboard/citas-hoy:
 *   get:
 *     summary: Obtener citas de hoy con paginación
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Citas de hoy obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       fecha:
 *                         type: string
 *                         format: date
 *                         example: "2026-03-31"
 *                       hora:
 *                         type: string
 *                         example: "09:30"
 *                       paciente:
 *                         type: string
 *                         example: "Juan Perez"
 *                       documentoPaciente:
 *                         type: string
 *                         example: "1023456789"
 *                       medico:
 *                         type: string
 *                         example: "Dr. Carlos González"
 *                       especialidad:
 *                         type: string
 *                         example: "Medicina General"
 *                       telefono:
 *                         type: string
 *                         example: "3015551234"
 *                       estado:
 *                         type: string
 *                         enum: ["Pendiente", "Atendida", "Cancelada"]
 *                         example: "Pendiente"
 *                       cancelada:
 *                         type: boolean
 *                         example: false
 *                       atendida:
 *                         type: boolean
 *                         example: false
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     pageSize:
 *                       type: integer
 *                       example: 10
 *                     totalItems:
 *                       type: integer
 *                       example: 15
 *                     totalPages:
 *                       type: integer
 *                       example: 2
 *                     hasNextPage:
 *                       type: boolean
 *                       example: true
 *                     hasPreviousPage:
 *                       type: boolean
 *                       example: false
 *       500:
 *         description: Error al obtener citas de hoy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   example: []
 *                 message:
 *                   type: string
 *                   example: "Error al obtener citas de hoy"
 */
router.get('/citas-hoy', async (req, res) => {
  let conn;
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    
    conn = await getConnection();
    
    // Obtener citas de hoy con datos de paciente y médico
    const query = `
      SELECT * FROM (
        SELECT a.*, ROWNUM rnum FROM (
          SELECT 
            a.FECHA_AGENDA,
            a.HORA_AGENDA,
            a.ID_MEDICO_AGENDA,
            a.IDEN_FUNC_AGENDA,
            a.LETRA_BEN_AGENDA,
            a.CANCELADA_AGENDA,
            a.LLEGADA_AGENDA,
            a.TELEFONO_BEN_AGENDA,
            b.NOMB_BEN as PACIENTE,
            b.IDEN_BEN as DOCUMENTO_PACIENTE,
            m.NOMB_MEDICO as MEDICO,
            e.NOMB_ESPE as ESPECIALIDAD
          FROM SMA.SMA_AGENDAS a
          LEFT JOIN SMA.SMA_BENEFICIARIOS b 
            ON a.IDEN_FUNC_AGENDA = b.IDEN_FUNC_BEN 
            AND a.LETRA_BEN_AGENDA = b.LETRA_BEN
          LEFT JOIN SMA.SMA_MEDICOS m 
            ON a.ID_MEDICO_AGENDA = m.ID_MEDICO
          LEFT JOIN SMA.SMA_ESPECIALIDADES e 
            ON m.REGIONAL_MEDICO = e.COD_ESPE
          WHERE TRUNC(a.FECHA_AGENDA) = TRUNC(SYSDATE)
          ORDER BY a.HORA_AGENDA ASC
        ) a WHERE ROWNUM <= :maxRow
      ) WHERE rnum > :minRow
    `;
    
    const result = await conn.execute(
      query,
      { maxRow: parseInt(pageSize) + offset, minRow: offset },
      { outFormat: OUT_FORMAT_OBJECT }
    );
    
    // Contar total de citas de hoy
    const countQuery = `SELECT COUNT(*) as TOTAL FROM SMA.SMA_AGENDAS WHERE TRUNC(FECHA_AGENDA) = TRUNC(SYSDATE)`;
    let countResult;
    try {
      countResult = await conn.execute(countQuery, {}, { outFormat: OUT_FORMAT_OBJECT });
    } catch (e) {
      countResult = { rows: [{ TOTAL: result?.rows?.length || 0 }] };
    }
    
    await conn.close();
    
    const total = countResult.rows[0]?.TOTAL || 0;
    const totalPages = Math.ceil(total / parseInt(pageSize));
    
    // Mapear resultados
    const citas = (result.rows || []).map((row, index) => ({
      id: index + 1 + offset,
      fecha: row.FECHA_AGENDA,
      hora: row.HORA_AGENDA,
      paciente: row.PACIENTE || 'Sin asignar',
      documentoPaciente: row.DOCUMENTO_PACIENTE || '',
      medico: row.MEDICO || 'Sin asignar',
      especialidad: row.ESPECIALIDAD || 'General',
      telefono: row.TELEFONO_BEN_AGENDA || '',
      estado: row.CANCELADA_AGENDA === 'S' ? 'Cancelada' : 
              row.LLEGADA_AGENDA === 'S' ? 'Atendida' : 'Pendiente',
      cancelada: row.CANCELADA_AGENDA === 'S',
      atendida: row.LLEGADA_AGENDA === 'S'
    }));
    
    res.json({
      data: citas,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalItems: parseInt(total),
        totalPages: totalPages,
        hasNextPage: parseInt(page) < totalPages,
        hasPreviousPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    if (conn) await conn.close();
    console.error('Error al obtener citas de hoy:', error);
    
    res.json({
      data: [],
      pagination: {
        page: parseInt(req.query.page || 1),
        pageSize: parseInt(req.query.pageSize || 10),
        totalItems: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false
      },
      message: error.message
    });
  }
});

module.exports = router;

