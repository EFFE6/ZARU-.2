const express = require('express');
const { getConnection, getTableName, buildQuery, OUT_FORMAT_OBJECT } = require('../utils/db');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     SubEspecialidadItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Identificador único compuesto (nit_regional_consecutivo)
 *           example: "123456789_01_1"
 *         nitAdscrito:
 *           type: integer
 *           description: NIT del adscrito
 *           example: 123456789
 *         regional:
 *           type: string
 *           description: Código de la regional
 *           example: "01"
 *         consecutivo:
 *           type: integer
 *           description: Número consecutivo de la sub-especialidad
 *           example: 1
 *         nombre:
 *           type: string
 *           description: Nombre de la sub-especialidad
 *           example: "Cardiología Pediátrica"
 *         medicamentos:
 *           type: boolean
 *           description: Indica si maneja medicamentos
 *           example: true
 *       required:
 *         - id
 *         - nitAdscrito
 *         - regional
 *         - consecutivo
 *         - nombre
 *         - medicamentos
 *
 *     RegionalItem:
 *       type: object
 *       properties:
 *         codigo:
 *           type: string
 *           description: Código de la regional
 *           example: "01"
 *         nombre:
 *           type: string
 *           description: Nombre descriptivo de la regional
 *           example: "Regional 01"
 *       required:
 *         - codigo
 *         - nombre
 *
 *     PaginatedSubEspecialidades:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SubEspecialidadItem'
 *         pagination:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *               description: Página actual
 *               example: 1
 *             pageSize:
 *               type: integer
 *               description: Tamaño de página
 *               example: 10
 *             total:
 *               type: integer
 *               description: Total de registros
 *               example: 150
 *             totalPages:
 *               type: integer
 *               description: Total de páginas
 *               example: 15
 *       required:
 *         - success
 *         - data
 *         - pagination
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Tipo de error
 *           example: "Error interno del servidor"
 *         message:
 *           type: string
 *           description: Mensaje detallado del error
 *           example: "Error de conexión a la base de datos"
 *       required:
 *         - error
 *         - message
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 *   parameters:
 *     pageParam:
 *       name: page
 *       in: query
 *       description: Número de página (empieza en 1)
 *       required: false
 *       schema:
 *         type: integer
 *         minimum: 1
 *         default: 1
 *     pageSizeParam:
 *       name: pageSize
 *       in: query
 *       description: Cantidad de registros por página
 *       required: false
 *       schema:
 *         type: integer
 *         minimum: 1
 *         maximum: 100
 *         default: 10
 *     searchParam:
 *       name: search
 *       in: query
 *       description: Término de búsqueda para filtrar por nombre
 *       required: false
 *       schema:
 *         type: string
 *         minLength: 1
 *     regionalParam:
 *       name: regional
 *       in: query
 *       description: Código de regional para filtrar
 *       required: false
 *       schema:
 *         type: string
 *         pattern: '^[0-9]{2}$'
 *     medicamentosParam:
 *       name: medicamentos
 *       in: query
 *       description: Filtrar por manejo de medicamentos (SI/NO/TODOS)
 *       required: false
 *       schema:
 *         type: string
 *         enum: [SI, NO, TODOS]
 *
 * /api/sub-especialidades:
 *   get:
 *     summary: Obtener lista paginada de sub-especialidades
 *     description: |
 *       Retorna una lista paginada de sub-especialidades con filtros opcionales.
 *
 *       **Filtros disponibles:**
 *       - `search`: Búsqueda por nombre de sub-especialidad
 *       - `regional`: Filtrar por código de regional
 *       - `medicamentos`: Filtrar por manejo de medicamentos (SI/NO/TODOS)
 *     tags: [SubEspecialidades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/pageSizeParam'
 *       - $ref: '#/components/parameters/searchParam'
 *       - $ref: '#/components/parameters/regionalParam'
 *       - $ref: '#/components/parameters/medicamentosParam'
 *     responses:
 *       200:
 *         description: Lista de sub-especialidades obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedSubEspecialidades'
 *             example:
 *               success: true
 *               data:
 *                 - id: "123456789_01_1"
 *                   nitAdscrito: 123456789
 *                   regional: "01"
 *                   consecutivo: 1
 *                   nombre: "Cardiología Pediátrica"
 *                   medicamentos: true
 *                 - id: "987654321_02_1"
 *                   nitAdscrito: 987654321
 *                   regional: "02"
 *                   consecutivo: 1
 *                   nombre: "Neurología Adultos"
 *                   medicamentos: false
 *               pagination:
 *                 page: 1
 *                 pageSize: 10
 *                 total: 2
 *                 totalPages: 1
 *       400:
 *         description: Parámetros de consulta inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Parámetros inválidos"
 *               message: "El código de regional debe tener 2 dígitos"
 *       401:
 *         description: No autorizado - Token JWT faltante o inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "No autorizado"
 *               message: "Token de autenticación requerido"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Error interno del servidor"
 *               message: "Error de conexión a la base de datos"
 */
router.get('/', async (req, res) => {
  let conn;
  try {
    const { page = 1, pageSize = 10, search = '', regional = '', medicamentos = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    
    conn = await getConnection();
    
    // Construir condiciones WHERE
    let whereConditions = ['1=1'];
    let queryParams = {};
    
    if (search) {
      whereConditions.push(`NOMBRE_SUBESP LIKE '%' || :search || '%'`);
      queryParams.search = search;
    }
    
    if (regional && regional !== 'TODAS') {
      whereConditions.push(`COD_REGI_ADSC_SUBESP = :regional`);
      queryParams.regional = regional;
    }
    
    if (medicamentos === 'SI') {
      whereConditions.push(`MEDICAMENTOS_SUBESP = 'S'`);
    } else if (medicamentos === 'NO') {
      whereConditions.push(`MEDICAMENTOS_SUBESP = 'N'`);
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    // Consulta principal - Tabla correcta: SMA_SUB_ESPECIALIDADES
    // Columnas: NIT_ADSC_SUBESP, COD_REGI_ADSC_SUBESP, CONSECUTIVO_SUBESP, NOMBRE_SUBESP, MEDICAMENTOS_SUBESP
    const query = `
      SELECT * FROM (
        SELECT a.*, ROWNUM rnum FROM (
          SELECT 
            NIT_ADSC_SUBESP,
            COD_REGI_ADSC_SUBESP,
            CONSECUTIVO_SUBESP,
            NOMBRE_SUBESP,
            MEDICAMENTOS_SUBESP
          FROM SMA.SMA_SUB_ESPECIALIDADES
          WHERE ${whereClause}
          ORDER BY COD_REGI_ADSC_SUBESP, CONSECUTIVO_SUBESP, NOMBRE_SUBESP
        ) a WHERE ROWNUM <= :maxRow
      ) WHERE rnum > :minRow
    `;
    
    queryParams.maxRow = parseInt(pageSize) + offset;
    queryParams.minRow = offset;
    
    const result = await conn.execute(
      buildQuery(query),
      queryParams,
      { outFormat: OUT_FORMAT_OBJECT }
    );
    
    // Contar total
    const countQuery = `SELECT COUNT(*) as TOTAL FROM SMA.SMA_SUB_ESPECIALIDADES WHERE ${whereClause}`;
    const countParams = { ...queryParams };
    delete countParams.maxRow;
    delete countParams.minRow;
    
    let countResult;
    try {
      countResult = await conn.execute(
        buildQuery(countQuery),
        countParams,
        { outFormat: OUT_FORMAT_OBJECT }
      );
    } catch (e) {
      countResult = { rows: [{ TOTAL: result.rows?.length || 0 }] };
    }
    
    await conn.close();
    
    // Mapear resultados
    const subEspecialidades = (result.rows || []).map((row, index) => ({
      id: `${row.NIT_ADSC_SUBESP}_${row.COD_REGI_ADSC_SUBESP}_${row.CONSECUTIVO_SUBESP}`,
      nitAdscrito: row.NIT_ADSC_SUBESP || 0,
      regional: row.COD_REGI_ADSC_SUBESP || '',
      regionalCodigo: row.COD_REGI_ADSC_SUBESP || '',
      consecutivo: row.CONSECUTIVO_SUBESP || 0,
      nombre: row.NOMBRE_SUBESP || '',
      medicamentos: row.MEDICAMENTOS_SUBESP === 'S',
      medicamentosTexto: row.MEDICAMENTOS_SUBESP === 'S' ? 'Sí' : 'No',
      activo: true
    }));
    
    const total = countResult?.rows?.[0]?.TOTAL || subEspecialidades.length;
    const totalPages = Math.ceil(total / parseInt(pageSize));
    
    res.json({
      data: subEspecialidades,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        limit: parseInt(pageSize),
        total: parseInt(total),
        totalItems: parseInt(total),
        totalPages: totalPages,
        hasNextPage: parseInt(page) < totalPages,
        hasPreviousPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    if (conn) await conn.close();
    console.error('❌ Error en /api/sub-especialidades:', error);
    res.status(500).json({
      message: 'Error al obtener sub-especialidades',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/sub-especialidades/regionales:
 *   get:
 *     summary: Obtener lista de regionales con sub-especialidades
 *     description: Retorna la lista de códigos de regionales que tienen sub-especialidades registradas.
 *     tags: [SubEspecialidades]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de regionales obtenida exitosamente
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
 *                     $ref: '#/components/schemas/RegionalItem'
 *             example:
 *               success: true
 *               data:
 *                 - codigo: "01"
 *                   nombre: "Regional 01"
 *                 - codigo: "02"
 *                   nombre: "Regional 02"
 *                 - codigo: "03"
 *                   nombre: "Regional 03"
 *       401:
 *         description: No autorizado - Token JWT faltante o inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "No autorizado"
 *               message: "Token de autenticación requerido"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Error interno del servidor"
 *               message: "Error de conexión a la base de datos"
 */
router.get('/regionales', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    
    const query = `
      SELECT DISTINCT COD_REGI_ADSC_SUBESP as REGIONAL
      FROM SMA.SMA_SUB_ESPECIALIDADES
      WHERE COD_REGI_ADSC_SUBESP IS NOT NULL
      ORDER BY COD_REGI_ADSC_SUBESP
    `;
    
    const result = await conn.execute(query, {}, { outFormat: OUT_FORMAT_OBJECT });
    
    await conn.close();
    
    const regionales = (result.rows || []).map(row => ({
      codigo: row.REGIONAL,
      nombre: `Regional ${row.REGIONAL}`
    }));
    
    res.json({
      success: true,
      data: regionales
    });
  } catch (error) {
    if (conn) await conn.close();
    console.error('Error al obtener regionales:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/sub-especialidades/{nit}/{regional}/{consecutivo}:
 *   get:
 *     summary: Obtener una sub-especialidad específica
 *     description: Retorna los detalles de una sub-especialidad específica identificada por su clave compuesta (NIT, regional, consecutivo).
 *     tags: [SubEspecialidades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: nit
 *         in: path
 *         description: NIT del adscrito
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - name: regional
 *         in: path
 *         description: Código de la regional
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9]{2}$'
 *       - name: consecutivo
 *         in: path
 *         description: Número consecutivo de la sub-especialidad
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       200:
 *         description: Sub-especialidad encontrada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/SubEspecialidadItem'
 *             example:
 *               success: true
 *               data:
 *                 id: "123456789_01_1"
 *                 nitAdscrito: 123456789
 *                 regional: "01"
 *                 consecutivo: 1
 *                 nombre: "Cardiología Pediátrica"
 *                 medicamentos: true
 *       400:
 *         description: Parámetros de ruta inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Parámetros inválidos"
 *               message: "El NIT debe ser un número entero positivo"
 *       401:
 *         description: No autorizado - Token JWT faltante o inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "No autorizado"
 *               message: "Token de autenticación requerido"
 *       404:
 *         description: Sub-especialidad no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "No encontrado"
 *               message: "La sub-especialidad especificada no existe"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Error interno del servidor"
 *               message: "Error de conexión a la base de datos"
 */
router.get('/:nit/:regional/:consecutivo', async (req, res) => {
  let conn;
  try {
    const { nit, regional, consecutivo } = req.params;
    
    conn = await getConnection();
    
    const query = `
      SELECT * FROM SMA.SMA_SUB_ESPECIALIDADES
      WHERE NIT_ADSC_SUBESP = :nit
        AND COD_REGI_ADSC_SUBESP = :regional
        AND CONSECUTIVO_SUBESP = :consecutivo
    `;
    
    const result = await conn.execute(
      query,
      { nit: parseInt(nit), regional, consecutivo: parseInt(consecutivo) },
      { outFormat: OUT_FORMAT_OBJECT }
    );
    
    await conn.close();
    
    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({
        error: 'Sub-especialidad no encontrada'
      });
    }
    
    const row = result.rows[0];
    
    res.json({
      success: true,
      data: {
        id: `${row.NIT_ADSC_SUBESP}_${row.COD_REGI_ADSC_SUBESP}_${row.CONSECUTIVO_SUBESP}`,
        nitAdscrito: row.NIT_ADSC_SUBESP,
        regional: row.COD_REGI_ADSC_SUBESP,
        consecutivo: row.CONSECUTIVO_SUBESP,
        nombre: row.NOMBRE_SUBESP,
        medicamentos: row.MEDICAMENTOS_SUBESP === 'S'
      }
    });
  } catch (error) {
    if (conn) await conn.close();
    console.error('Error al obtener sub-especialidad:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

module.exports = router;
