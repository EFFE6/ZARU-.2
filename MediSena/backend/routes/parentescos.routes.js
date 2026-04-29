const express = require('express');
const { getConnection, getTableName, buildQuery, OUT_FORMAT_OBJECT } = require('../utils/db');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Parentesco:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "01"
 *         codigo:
 *           type: string
 *           example: "01"
 *         nombre:
 *           type: string
 *           example: "Padre"
 *         descripcion:
 *           type: string
 *           example: "Padre"
 *         nacional:
 *           type: boolean
 *           example: true
 *         activo:
 *           type: boolean
 *           example: true
 *     PaginatedParentescos:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Parentesco'
 *         pagination:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *               example: 1
 *             pageSize:
 *               type: integer
 *               example: 10
 *             limit:
 *               type: integer
 *               example: 10
 *             total:
 *               type: integer
 *               example: 20
 *             totalPages:
 *               type: integer
 *               example: 2
 *             hasNextPage:
 *               type: boolean
 *               example: true
 *             hasPreviousPage:
 *               type: boolean
 *               example: false
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: "Error interno"
 *         message:
 *           type: string
 *           example: "Descripción detallada del error"
 */

/**
 * @swagger
 * /api/parentescos:
 *   get:
 *     summary: Obtener lista de parentescos con paginación y búsqueda
 *     tags: [Parentescos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número de elementos por página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Alias para pageSize
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Término de búsqueda por código o nombre del parentesco
 *     responses:
 *       200:
 *         description: Lista de parentescos obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedParentescos'
 *             example:
 *               success: true
 *               data:
 *                 - id: "01"
 *                   codigo: "01"
 *                   nombre: "Padre"
 *                   descripcion: "Padre"
 *                   nacional: true
 *                   activo: true
 *                 - id: "02"
 *                   codigo: "02"
 *                   nombre: "Madre"
 *                   descripcion: "Madre"
 *                   nacional: true
 *                   activo: true
 *               pagination:
 *                 page: 1
 *                 pageSize: 10
 *                 total: 20
 *                 totalPages: 2
 *                 hasNextPage: true
 *                 hasPreviousPage: false
 *       400:
 *         description: Parámetros de consulta inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Parámetros inválidos"
 *               message: "El parámetro page debe ser un número positivo"
 *       401:
 *         description: No autorizado - Token JWT faltante o inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "No autorizado"
 *               message: "Token de autenticación requerido"
 *       403:
 *         description: Prohibido - No tiene permisos suficientes
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Prohibido"
 *               message: "No tiene permisos para acceder a parentescos"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Error interno del servidor"
 *               message: "Error al obtener parentescos: conexión a base de datos fallida"
 */
router.get('/', async (req, res) => {
  let conn;
  try {
    const { page = 1, limit, pageSize, search } = req.query;
    const ps = parseInt(pageSize || limit || 10);
    const offset = (parseInt(page) - 1) * ps;
    
    conn = await getConnection();
    
    const T = getTableName('SMA_PARENTESCOS');
    // Schema real: cod_pare, nomb_pare
    const whereClause = search
      ? `WHERE LOWER(COALESCE(nomb_pare::text, '')) LIKE LOWER(:search) OR COALESCE(cod_pare::text, '') LIKE :search`
      : '';
    const queryParams = search ? { search: `%${search}%`, maxRow: ps, minRow: offset } : { maxRow: ps, minRow: offset };
    
    const query = `
      SELECT cod_pare, nomb_pare
      FROM ${T}
      ${whereClause}
      ORDER BY cod_pare
      LIMIT :maxRow OFFSET :minRow
    `;
    
    let result;
    try {
      result = await conn.execute(buildQuery(query), queryParams, { outFormat: OUT_FORMAT_OBJECT });
    } catch (e) {
      if (conn) await conn.close();
      console.error('Error al obtener parentescos:', e.message);
      return res.status(500).json({
        error: 'Error al obtener parentescos',
        message: e.message
      });
    }
    
    const countQuery = `SELECT COUNT(*) as TOTAL FROM ${T} ${whereClause}`;
    let countResult;
    try {
      countResult = await conn.execute(buildQuery(countQuery), search ? { search: `%${search}%` } : {}, { outFormat: OUT_FORMAT_OBJECT });
    } catch (e) {
      countResult = { rows: [{ TOTAL: result?.rows?.length ?? 0 }] };
    }
    
    await conn.close();
    
    const total = parseInt(countResult?.rows?.[0]?.TOTAL ?? countResult?.rows?.[0]?.total ?? result?.rows?.length ?? 0);
    
    // pg adapter devuelve claves en UPPERCASE; schema real: cod_pare, nomb_pare
    const parentescos = (result.rows || []).map(row => {
      const codigo = String(row.COD_PARE ?? row.cod_pare ?? '');
      const nombre = row.NOMB_PARE ?? row.nomb_pare ?? 'N/A';
      return {
        id: codigo,
        codigo,
        nombre,
        descripcion: nombre,
        nacional: true,
        activo: true
      };
    });
    
    const totalPages = Math.ceil(total / ps);
    res.json({
      success: true,
      data: parentescos,
      pagination: {
        page: parseInt(page),
        pageSize: ps,
        limit: ps,
        total: parseInt(total),
        totalPages: totalPages,
        hasNextPage: parseInt(page) < totalPages,
        hasPreviousPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    if (conn) await conn.close();
    console.error('Error al obtener parentescos:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: `Error al obtener parentescos: ${error.message}`
    });
  }
});

module.exports = router;
