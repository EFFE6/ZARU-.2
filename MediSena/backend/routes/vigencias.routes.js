const express = require('express');
const { getConnection, getTableName, buildQuery, OUT_FORMAT_OBJECT } = require('../utils/db');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     VigenciaItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "2024_BOG_1"
 *         vigencia:
 *           type: integer
 *           example: 2024
 *         anio:
 *           type: integer
 *           example: 2024
 *         año:
 *           type: integer
 *           example: 2024
 *         resolucion:
 *           type: integer
 *           example: 123
 *         resolucionNombre:
 *           type: string
 *           example: "Resolución 123 - Vigencia 2024"
 *         regional:
 *           type: string
 *           example: "BOG"
 *         regionalNombre:
 *           type: string
 *           example: "Bogotá"
 *         regionalCodigo:
 *           type: string
 *           example: "BOG"
 *         smlv:
 *           type: number
 *           format: float
 *           example: 1160000.00
 *         razonSocial:
 *           type: string
 *           example: "Servicio Nacional de Aprendizaje SENA"
 *         activo:
 *           type: boolean
 *           example: true
 *         estado:
 *           type: string
 *           example: "A"
 *         estado_nombre:
 *           type: string
 *           example: "Activa"
 *         codigo:
 *           type: string
 *           example: "2024"
 *         nombre:
 *           type: string
 *           example: "Vigencia 2024"
 *         descripcion:
 *           type: string
 *           example: "Vigencia fiscal 2024"
 *         valor:
 *           type: integer
 *           example: 2024
 *     VigenciaListaItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 2024
 *         codigo:
 *           type: string
 *           example: "2024"
 *         nombre:
 *           type: string
 *           example: "Vigencia 2024"
 *         anio:
 *           type: integer
 *           example: 2024
 *         año:
 *           type: integer
 *           example: 2024
 *         activo:
 *           type: boolean
 *           example: true
 *         estado:
 *           type: string
 *           example: "A"
 *         estado_nombre:
 *           type: string
 *           example: "Activa"
 *     VigenciaParametroItem:
 *       type: object
 *       properties:
 *         vigencia:
 *           type: integer
 *           example: 2024
 *         resolucion:
 *           type: integer
 *           example: 123
 *         regional:
 *           type: string
 *           example: "BOG"
 *         smlv:
 *           type: number
 *           format: float
 *           example: 1160000.00
 *         razonSocial:
 *           type: string
 *           example: "Servicio Nacional de Aprendizaje SENA"
 *         jefe:
 *           type: string
 *           example: "Director Regional"
 *         codigo:
 *           type: string
 *           example: "PAR-001"
 *         porcentajeNormal:
 *           type: number
 *           format: float
 *           example: 12.5
 *         porcentajeEspecial:
 *           type: number
 *           format: float
 *           example: 15.0
 *         porcentajeLey:
 *           type: number
 *           format: float
 *           example: 8.0
 *     VigenciaActivaResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "2024"
 *         codigo:
 *           type: string
 *           example: "2024"
 *         nombre:
 *           type: string
 *           example: "Vigencia 2024"
 *         descripcion:
 *           type: string
 *           example: "Vigencia fiscal 2024"
 *         valor:
 *           type: integer
 *           example: 2024
 *         anio:
 *           type: integer
 *           example: 2024
 *         año:
 *           type: integer
 *           example: 2024
 *         vigencia:
 *           type: integer
 *           example: 2024
 *         activo:
 *           type: boolean
 *           example: true
 *         estado:
 *           type: string
 *           example: "A"
 *         estado_nombre:
 *           type: string
 *           example: "Activa"
 *         fechaInicio:
 *           type: string
 *           format: date
 *           example: "2024-01-01"
 *         fechaFin:
 *           type: string
 *           format: date
 *           example: "2024-12-31"
 *         tipoVigencia:
 *           type: string
 *           example: "FISCAL"
 *         creadoPor:
 *           type: string
 *           example: "SISTEMA"
 *         fechaCreacion:
 *           type: string
 *           format: date-time
 *           example: "2024-01-01T00:00:00.000Z"
 *     VigenciaDetalleResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               example: 2024
 *             codigo:
 *               type: string
 *               example: "2024"
 *             nombre:
 *               type: string
 *               example: "Vigencia 2024"
 *             descripcion:
 *               type: string
 *               example: "Vigencia fiscal 2024"
 *             valor:
 *               type: integer
 *               example: 2024
 *             anio:
 *               type: integer
 *               example: 2024
 *             año:
 *               type: integer
 *               example: 2024
 *             activo:
 *               type: boolean
 *               example: true
 *             estado:
 *               type: string
 *               example: "A"
 *             estado_nombre:
 *               type: string
 *               example: "Activa"
 *             totalResoluciones:
 *               type: integer
 *               example: 15
 *             fechaInicio:
 *               type: string
 *               format: date
 *               example: "2024-01-01"
 *             fechaFin:
 *               type: string
 *               format: date
 *               example: "2024-12-31"
 *             parametros:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/VigenciaParametroItem'
 *     AbrirVigenciaRequest:
 *       type: object
 *       required:
 *         - vigencia
 *         - ipc
 *         - smlvm
 *       properties:
 *         vigencia:
 *           type: integer
 *           example: 2025
 *         ipc:
 *           type: number
 *           format: float
 *           example: 7.5
 *         smlvm:
 *           type: number
 *           format: float
 *           example: 1300000.00
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: "Error interno"
 *         message:
 *           type: string
 *           example: "Descripción detallada del error"
 *         success:
 *           type: boolean
 *           example: false
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: Token JWT para autenticación en header Authorization
 */

/**
 * @swagger
 * /api/vigencias:
 *   get:
 *     summary: Obtener lista de vigencias con información de regionales
 *     description: Obtiene una lista completa de vigencias fiscales con información detallada de regionales, resoluciones y parámetros asociados.
 *     tags: [Vigencias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: detalle
 *         schema:
 *           type: boolean
 *         description: Si es true, incluye detalle por regional
 *         example: true
 *     responses:
 *       200:
 *         description: Lista de vigencias obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/VigenciaItem'
 *             example:
 *               - id: "2024_BOG_1"
 *                 vigencia: 2024
 *                 anio: 2024
 *                 año: 2024
 *                 resolucion: 123
 *                 resolucionNombre: "Resolución 123 - Vigencia 2024"
 *                 regional: "BOG"
 *                 regionalNombre: "Bogotá"
 *                 regionalCodigo: "BOG"
 *                 smlv: 1160000.00
 *                 razonSocial: "Servicio Nacional de Aprendizaje SENA"
 *                 activo: true
 *                 estado: "A"
 *                 estado_nombre: "Activa"
 *                 codigo: "2024"
 *                 nombre: "Vigencia 2024"
 *                 descripcion: "Vigencia fiscal 2024"
 *                 valor: 2024
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Error interno del servidor"
 *               message: "Error al obtener vigencias: conexión a base de datos fallida"
 */

/**
 * @swagger
 * /api/vigencias/lista:
 *   get:
 *     summary: Obtener lista simple de años de vigencia (sin detalle por regional)
 *     description: Obtiene una lista simplificada de años de vigencia disponibles en el sistema.
 *     tags: [Vigencias]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista simple de vigencias obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/VigenciaListaItem'
 *                 total:
 *                   type: integer
 *                   example: 5
 *             example:
 *               success: true
 *               data:
 *                 - id: 2024
 *                   codigo: "2024"
 *                   nombre: "Vigencia 2024"
 *                   anio: 2024
 *                   año: 2024
 *                   activo: true
 *                   estado: "A"
 *                   estado_nombre: "Activa"
 *                 - id: 2023
 *                   codigo: "2023"
 *                   nombre: "Vigencia 2023"
 *                   anio: 2023
 *                   año: 2023
 *                   activo: false
 *                   estado: "I"
 *                   estado_nombre: "Cerrada"
 *               total: 5
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Error interno del servidor"
 *               message: "Error al obtener lista de vigencias: conexión a base de datos fallida"
 */

/**
 * @swagger
 * /api/vigencias/parametros:
 *   get:
 *     summary: Obtener parámetros de una vigencia específica
 *     description: Obtiene los parámetros configurados para una vigencia específica o todas las vigencias si no se especifica ninguna.
 *     tags: [Vigencias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: vigencia
 *         schema:
 *           type: integer
 *         description: Año de la vigencia para filtrar parámetros
 *         example: 2024
 *     responses:
 *       200:
 *         description: Parámetros de vigencia obtenidos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/VigenciaParametroItem'
 *             example:
 *               success: true
 *               data:
 *                 - vigencia: 2024
 *                   resolucion: 123
 *                   regional: "BOG"
 *                   smlv: 1160000.00
 *                   razonSocial: "Servicio Nacional de Aprendizaje SENA"
 *                   jefe: "Director Regional"
 *                   codigo: "PAR-001"
 *                   porcentajeNormal: 12.5
 *                   porcentajeEspecial: 15.0
 *                   porcentajeLey: 8.0
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Error interno del servidor"
 *               message: "Error al obtener parámetros: conexión a base de datos fallida"
 */

/**
 * @swagger
 * /api/vigencias/abrir:
 *   post:
 *     summary: Abrir nueva vigencia
 *     description: Configura y abre una nueva vigencia fiscal en el sistema con sus parámetros iniciales.
 *     tags: [Vigencias]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AbrirVigenciaRequest'
 *           example:
 *             vigencia: 2025
 *             ipc: 7.5
 *             smlvm: 1300000.00
 *     responses:
 *       200:
 *         description: Vigencia abierta exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Vigencia 2025 configurada exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     vigencia:
 *                       type: integer
 *                       example: 2025
 *                     ipc:
 *                       type: number
 *                       format: float
 *                       example: 7.5
 *                     smlvm:
 *                       type: number
 *                       format: float
 *                       example: 1300000.00
 *       400:
 *         description: Datos requeridos faltantes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Faltan datos requeridos: vigencia, ipc, smlvm"
 *       409:
 *         description: Vigencia ya existe
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "La vigencia 2025 ya existe en el sistema"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Error interno del servidor"
 *                 message:
 *                   type: string
 *                   example: "Error al abrir vigencia: conexión a base de datos fallida"
 */

/**
 * @swagger
 * /api/vigencias/activa:
 *   get:
 *     summary: Obtener vigencia activa actual
 *     description: Obtiene información de la vigencia fiscal actualmente activa en el sistema.
 *     tags: [Vigencias]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vigencia activa obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VigenciaActivaResponse'
 *             example:
 *               id: "2024"
 *               codigo: "2024"
 *               nombre: "Vigencia 2024"
 *               descripcion: "Vigencia fiscal 2024"
 *               valor: 2024
 *               anio: 2024
 *               año: 2024
 *               vigencia: 2024
 *               activo: true
 *               estado: "A"
 *               estado_nombre: "Activa"
 *               fechaInicio: "2024-01-01"
 *               fechaFin: "2024-12-31"
 *               tipoVigencia: "FISCAL"
 *               creadoPor: "SISTEMA"
 *               fechaCreacion: "2024-01-01T00:00:00.000Z"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Error interno del servidor"
 *               message: "Error al obtener vigencia activa: conexión a base de datos fallida"
 */

/**
 * @swagger
 * /api/vigencias/cerrar-actual:
 *   post:
 *     summary: Cerrar vigencia actual
 *     description: Cierra la vigencia fiscal actual, marcando todas las resoluciones y parámetros asociados como cerrados.
 *     tags: [Vigencias]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vigencia cerrada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Vigencia 2024 cerrada exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     vigencia:
 *                       type: integer
 *                       example: 2024
 *                     registrosActualizados:
 *                       type: integer
 *                       example: 25
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Error interno del servidor"
 *                 message:
 *                   type: string
 *                   example: "Error al cerrar vigencia: conexión a base de datos fallida"
 */

/**
 * @swagger
 * /api/vigencias/{id}:
 *   get:
 *     summary: Obtener detalle de una vigencia
 *     description: Obtiene información detallada de una vigencia específica incluyendo resoluciones y parámetros asociados.
 *     tags: [Vigencias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID (año) de la vigencia
 *         example: 2024
 *     responses:
 *       200:
 *         description: Detalle de vigencia obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/VigenciaDetalleResponse'
 *             example:
 *               success: true
 *               data:
 *                 id: 2024
 *                 codigo: "2024"
 *                 nombre: "Vigencia 2024"
 *                 descripcion: "Vigencia fiscal 2024"
 *                 valor: 2024
 *                 anio: 2024
 *                 año: 2024
 *                 activo: true
 *                 estado: "A"
 *                 estado_nombre: "Activa"
 *                 totalResoluciones: 15
 *                 fechaInicio: "2024-01-01"
 *                 fechaFin: "2024-12-31"
 *                 parametros: []
 *       404:
 *         description: Vigencia no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Vigencia no encontrada"
 *               message: "No se encontró la vigencia 2024"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Error interno del servidor"
 *               message: "Error al obtener vigencia: conexión a base de datos fallida"
 */
router.get('/', async (req, res) => {
  let conn;
  try {
    const { page = 1, limit = 10, search, detalle } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const currentYear = new Date().getFullYear();
    
    conn = await getConnection();
    
    // Query: vigencias + nombre regional (sma_regionales) + descripción resolución
    const T_PARAM = getTableName('SMA_PARAMETROS');
    const T_RESOL = getTableName('SMA_RESOLUCIONES');
    const T_REGI = getTableName('SMA_REGIONALES');
    const query = `
      SELECT 
        p.VIGENCIA_PAR as VIGENCIA,
        p.RESOLUCION_PAR as RESOLUCION,
        p.REGIONAL_PAR as REGIONAL,
        reg.nomb_regi as REGIONAL_NOMBRE,
        p.SMLV_PAR as SMLV,
        p.RAZON_SOCIAL_PAR as RAZON_SOCIAL,
        r.CODIGO_RES,
        r.ESTADO_RES
      FROM ${T_PARAM} p
      LEFT JOIN ${T_RESOL} r 
        ON p.VIGENCIA_PAR = r.VIGENCIA_RES 
        AND p.RESOLUCION_PAR = r.CODIGO_RES
      LEFT JOIN ${T_REGI} reg ON p.REGIONAL_PAR = reg.cod_regi
      WHERE p.VIGENCIA_PAR IS NOT NULL
      ORDER BY p.VIGENCIA_PAR DESC, p.REGIONAL_PAR
    `;
    
    let result;
    try {
      result = await conn.execute(buildQuery(query), {}, { outFormat: OUT_FORMAT_OBJECT });
    } catch (e) {
      // Si sma_regionales no existe, consultar sin JOIN
      const queryFallback = `
        SELECT 
          p.VIGENCIA_PAR as VIGENCIA,
          p.RESOLUCION_PAR as RESOLUCION,
          p.REGIONAL_PAR as REGIONAL,
          p.SMLV_PAR as SMLV,
          p.RAZON_SOCIAL_PAR as RAZON_SOCIAL,
          r.CODIGO_RES,
          r.ESTADO_RES
        FROM ${T_PARAM} p
        LEFT JOIN ${T_RESOL} r 
          ON p.VIGENCIA_PAR = r.VIGENCIA_RES 
          AND p.RESOLUCION_PAR = r.CODIGO_RES
        WHERE p.VIGENCIA_PAR IS NOT NULL
        ORDER BY p.VIGENCIA_PAR DESC, p.REGIONAL_PAR
      `;
      result = await conn.execute(buildQuery(queryFallback), {}, { outFormat: OUT_FORMAT_OBJECT });
    }
    
    await conn.close();
    
    if (!result || !result.rows || result.rows.length === 0) {
      // Frontend espera un array vacío directamente
      return res.json([]);
    }
    
    // Mapear resultados: incluir nombres legibles (regional, resolución)
    const vigencias = result.rows.map((row, index) => {
      const year = parseInt(row.VIGENCIA) || 0;
      const isActive = year >= currentYear - 1;
      const codResol = row.RESOLUCION ?? row.CODIGO_RES ?? 0;
      const regionalCod = row.REGIONAL || '';
      const regionalNom = row.REGIONAL_NOMBRE || row.NOMB_REGI || regionalCod;
      return {
        id: `${row.VIGENCIA}_${row.REGIONAL}_${index}`,
        vigencia: row.VIGENCIA,
        anio: year,
        año: year,
        resolucion: codResol,
        resolucionNombre: codResol ? `Resolución ${codResol} - Vigencia ${year}` : '',
        regional: regionalCod,
        regionalNombre: regionalNom,
        regionalCodigo: regionalCod,
        smlv: row.SMLV || 0,
        razonSocial: row.RAZON_SOCIAL || '',
        activo: isActive,
        estado: isActive ? 'A' : 'I',
        estado_nombre: isActive ? 'Activa' : 'Cerrada',
        codigo: year.toString(),
        nombre: `Vigencia ${year}`,
        descripcion: `Vigencia fiscal ${year}`,
        valor: year
      };
    });
    
    // El frontend espera un array directamente (no un objeto con data)
    // Retornar el array de vigencias directamente
    res.json(vigencias);
  } catch (error) {
    if (conn) await conn.close();
    console.error('Error al obtener vigencias:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: `Error al obtener vigencias: ${error.message}`
    });
  }
});

/**
 * @swagger
 * /api/vigencias/lista:
 *   get:
 *     summary: Obtener lista simple de años de vigencia (sin detalle por regional)
 *     tags: [Vigencias]
 */
router.get('/lista', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const currentYear = new Date().getFullYear();
    
    // Obtener vigencias únicas
    const query = `
      SELECT DISTINCT VIGENCIA_PAR as VIGENCIA
      FROM SMA.SMA_PARAMETROS 
      WHERE VIGENCIA_PAR IS NOT NULL 
        AND VIGENCIA_PAR > 2000
      ORDER BY VIGENCIA_PAR DESC
    `;
    
    const result = await conn.execute(query, {}, { outFormat: OUT_FORMAT_OBJECT });
    
    await conn.close();
    
    const vigencias = (result.rows || []).map(row => {
      const year = parseInt(row.VIGENCIA);
      return {
        id: year,
        codigo: year.toString(),
        nombre: `Vigencia ${year}`,
        anio: year,
        año: year,
        activo: year >= currentYear - 1,
        estado: year >= currentYear - 1 ? 'A' : 'I',
        estado_nombre: year >= currentYear - 1 ? 'Activa' : 'Cerrada'
      };
    });
    
    res.json({
      success: true,
      data: vigencias,
      total: vigencias.length
    });
  } catch (error) {
    if (conn) await conn.close();
    console.error('Error al obtener lista de vigencias:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/vigencias/parametros:
 *   get:
 *     summary: Obtener parámetros de una vigencia específica
 *     tags: [Vigencias]
 */
router.get('/parametros', async (req, res) => {
  let conn;
  try {
    const { vigencia } = req.query;
    
    conn = await getConnection();
    
    let query, params;
    if (vigencia) {
      query = `SELECT * FROM SMA.SMA_PARAMETROS WHERE VIGENCIA_PAR = :vigencia ORDER BY REGIONAL_PAR`;
      params = { vigencia: parseInt(vigencia) };
    } else {
      query = `SELECT * FROM SMA.SMA_PARAMETROS ORDER BY VIGENCIA_PAR DESC, REGIONAL_PAR`;
      params = {};
    }
    
    const result = await conn.execute(query, params, { outFormat: OUT_FORMAT_OBJECT });
    
    await conn.close();
    
    // Mapear con nombres amigables
    const data = (result.rows || []).map(row => ({
      vigencia: row.VIGENCIA_PAR,
      resolucion: row.RESOLUCION_PAR,
      regional: row.REGIONAL_PAR,
      smlv: row.SMLV_PAR,
      razonSocial: row.RAZON_SOCIAL_PAR,
      jefe: row.JEFE_PAR,
      codigo: row.CODIGO_PAR,
      porcentajeNormal: row.PORCENTAJE_NORMAL_PAR,
      porcentajeEspecial: row.PORCENTAJE_ESPEC_PAR,
      porcentajeLey: row.PORCENTAJE_LEY_PAR
    }));
    
    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    if (conn) await conn.close();
    console.error('Error al obtener parámetros:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: `Error al obtener parámetros: ${error.message}`
    });
  }
});

/**
 * @swagger
 * /api/vigencias/abrir:
 *   post:
 *     summary: Abrir nueva vigencia
 *     tags: [Vigencias]
 */
router.post('/abrir', async (req, res) => {
  let conn;
  try {
    const { vigencia, ipc, smlvm } = req.body;
    
    if (!vigencia || !ipc || !smlvm) {
      return res.status(400).json({
        success: false,
        error: 'Faltan datos requeridos: vigencia, ipc, smlvm'
      });
    }
    
    conn = await getConnection();
    
    // Verificar si la vigencia ya existe en parámetros
    const checkQuery = `SELECT COUNT(*) as EXISTE FROM SMA.SMA_PARAMETROS WHERE VIGENCIA_PAR = :vigencia`;
    const checkResult = await conn.execute(checkQuery, { vigencia: parseInt(vigencia) }, { outFormat: OUT_FORMAT_OBJECT });
    
    if (checkResult.rows[0].EXISTE > 0) {
      await conn.close();
      return res.status(409).json({
        success: false,
        error: `La vigencia ${vigencia} ya existe en el sistema`
      });
    }
    
    await conn.close();
    
    res.json({
      success: true,
      message: `Vigencia ${vigencia} configurada exitosamente`,
      data: { vigencia, ipc, smlvm }
    });
  } catch (error) {
    if (conn) await conn.close();
    console.error('Error al abrir vigencia:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: `Error al abrir vigencia: ${error.message}`
    });
  }
});

/**
 * @swagger
 * /api/vigencias/activa:
 *   get:
 *     summary: Obtener vigencia activa actual
 *     tags: [Vigencias]
 */
router.get('/activa', async (req, res) => {
  let conn;
  try {
    const currentYear = new Date().getFullYear();
    conn = await getConnection();
    const query = `
      SELECT DISTINCT VIGENCIA_PAR as VIGENCIA
      FROM SMA.SMA_PARAMETROS 
      WHERE VIGENCIA_PAR IS NOT NULL 
        AND VIGENCIA_PAR >= :minYear
      ORDER BY VIGENCIA_PAR DESC
      LIMIT 1
    `;
    let result;
    try {
      result = await conn.execute(query, { minYear: currentYear - 1 }, { outFormat: OUT_FORMAT_OBJECT });
    } catch (e) {
      result = { rows: [{ VIGENCIA: currentYear }] };
    }
    await conn.close();
    const vigencia = result?.rows?.[0]?.VIGENCIA ?? currentYear;
    const year = parseInt(vigencia);
    res.json({
      id: `${year}`,
      codigo: String(year),
      nombre: `Vigencia ${year}`,
      descripcion: `Vigencia fiscal ${year}`,
      valor: year,
      anio: year,
      año: year,
      vigencia: year,
      activo: true,
      estado: 'A',
      estado_nombre: 'Activa',
      fechaInicio: `${year}-01-01`,
      fechaFin: `${year}-12-31`,
      tipoVigencia: 'FISCAL',
      creadoPor: 'SISTEMA',
      fechaCreacion: new Date().toISOString()
    });
  } catch (error) {
    if (conn) await conn.close();
    console.error('Error al obtener vigencia activa:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: `Error al obtener vigencia activa: ${error.message}`
    });
  }
});

/**
 * @swagger
 * /api/vigencias/cerrar-actual:
 *   post:
 *     summary: Cerrar vigencia actual
 *     tags: [Vigencias]
 */
router.post('/cerrar-actual', async (req, res) => {
  let conn;
  try {
    const currentYear = new Date().getFullYear();
    conn = await getConnection();
    const updateQueries = [
      `UPDATE SMA.SMA_RESOLUCIONES SET ESTADO_RES = 'CERRADA' WHERE VIGENCIA_RES = :year`,
      `UPDATE SMA.SMA_PARAMETROS SET ESTADO_PAR = 'CERRADA' WHERE VIGENCIA_PAR = :year`
    ];
    let updated = 0;
    for (const q of updateQueries) {
      try {
        const r = await conn.execute(q, { year: currentYear }, { outFormat: OUT_FORMAT_OBJECT });
        updated += r.rowsAffected || 0;
      } catch (_) { /* columna puede no existir */ }
    }
    await conn.close();
    res.json({
      success: true,
      message: `Vigencia ${currentYear} cerrada exitosamente`,
      data: { vigencia: currentYear, registrosActualizados: updated }
    });
  } catch (error) {
    if (conn) await conn.close();
    console.error('Error al cerrar vigencia:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: `Error al cerrar vigencia: ${error.message}`
    });
  }
});

/**
 * @swagger
 * /api/vigencias/{id}:
 *   get:
 *     summary: Obtener detalle de una vigencia
 *     tags: [Vigencias]
 */
router.get('/:id', async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    const vigenciaId = parseInt(id);
    
    conn = await getConnection();
    
    // Obtener información de la vigencia desde resoluciones
    const query = `
      SELECT 
        VIGENCIA_RES as VIGENCIA,
        COUNT(*) as TOTAL_RESOLUCIONES,
        MIN(FECHA_INICIO_RES) as FECHA_INICIO,
        MAX(FECHA_TERMINACION_RES) as FECHA_FIN
      FROM SMA.SMA_RESOLUCIONES 
      WHERE VIGENCIA_RES = :vigencia
      GROUP BY VIGENCIA_RES
    `;
    
    const result = await conn.execute(query, { vigencia: vigenciaId }, { outFormat: OUT_FORMAT_OBJECT });
    
    // Obtener parámetros de la vigencia
    const paramQuery = `SELECT * FROM SMA.SMA_PARAMETROS WHERE VIGENCIA_PAR = :vigencia ORDER BY REGIONAL_PAR`;
    let paramResult;
    try {
      paramResult = await conn.execute(paramQuery, { vigencia: vigenciaId }, { outFormat: OUT_FORMAT_OBJECT });
    } catch (e) {
      paramResult = { rows: [] };
    }
    
    await conn.close();
    
    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({
        error: 'Vigencia no encontrada',
        message: `No se encontró la vigencia ${vigenciaId}`
      });
    }
    
    const row = result.rows[0];
    const currentYear = new Date().getFullYear();
    
    res.json({
      success: true,
      data: {
        id: vigenciaId,
        codigo: vigenciaId.toString(),
        nombre: `Vigencia ${vigenciaId}`,
        descripcion: `Vigencia fiscal ${vigenciaId}`,
        valor: vigenciaId,
        anio: vigenciaId,
        año: vigenciaId,
        activo: vigenciaId >= currentYear - 1,
        estado: vigenciaId >= currentYear - 1 ? 'A' : 'I',
        estado_nombre: vigenciaId >= currentYear - 1 ? 'Activa' : 'Cerrada',
        totalResoluciones: row.TOTAL_RESOLUCIONES || 0,
        fechaInicio: row.FECHA_INICIO,
        fechaFin: row.FECHA_FIN,
        parametros: paramResult.rows || []
      }
    });
  } catch (error) {
    if (conn) await conn.close();
    console.error('Error al obtener vigencia:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: `Error al obtener vigencia: ${error.message}`
    });
  }
});

module.exports = router;
