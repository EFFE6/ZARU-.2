const express = require('express');
const { getConnection, getTableName, buildQuery, OUT_FORMAT_OBJECT } = require('../utils/db');
const router = express.Router();
/**
 * @swagger
 * components:
 *   schemas:
 *     NivelTopeItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Identificador único del nivel tope
 *           example: "001"
 *         codigo:
 *           type: string
 *           description: Código del nivel tope
 *           example: "001"
 *         nombre:
 *           type: string
 *           description: Nombre del nivel tope
 *           example: "Nivel Básico"
 *         descripcion:
 *           type: string
 *           description: Descripción detallada del nivel tope
 *           example: "Nivel de atención médica 001 - Define los límites y topes para servicios médicos"
 *         valor_tope:
 *           type: number
 *           format: float
 *           description: Valor máximo permitido para el nivel
 *           example: 500000.00
 *         vigencia:
 *           type: integer
 *           description: Año de vigencia del nivel
 *           example: 2024
 *         vigente:
 *           type: boolean
 *           description: Indica si el nivel está vigente/activo
 *           example: true
 *         informacion:
 *           type: object
 *           description: Información adicional contextual
 *           properties:
 *             es_libre:
 *               type: boolean
 *               description: Indica si es un nivel libre (sin límites)
 *               example: false
 *             es_nivel_numero:
 *               type: boolean
 *               description: Indica si el código es numérico
 *               example: true
 *             numero_nivel:
 *               type: integer
 *               description: Número del nivel si aplica
 *               example: 1
 *       required:
 *         - id
 *         - codigo
 *         - nombre
 *         - descripcion
 *         - valor_tope
 *         - vigente
 *
 *     PaginatedNivelesTope:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/NivelTopeItem'
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
 *             totalItems:
 *               type: integer
 *               description: Total de registros
 *               example: 15
 *             totalPages:
 *               type: integer
 *               description: Total de páginas
 *               example: 2
 *             hasNextPage:
 *               type: boolean
 *               description: Indica si hay página siguiente
 *               example: true
 *             hasPreviousPage:
 *               type: boolean
 *               description: Indica si hay página anterior
 *               example: false
 *         allRecords:
 *           type: boolean
 *           description: Indica si se retornaron todos los registros sin paginación
 *           example: false
 *       required:
 *         - data
 *         - pagination
 *         - allRecords
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Mensaje de error
 *           example: "Error al obtener niveles tope"
 *         error:
 *           type: string
 *           description: Detalle del error (solo en desarrollo)
 *           example: "ORA-00942: table or view does not exist"
 *       required:
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
 *       description: Término de búsqueda por nombre o descripción
 *       required: false
 *       schema:
 *         type: string
 *         minLength: 1
 *     allParam:
 *       name: all
 *       in: query
 *       description: Traer todos los registros sin paginación
 *       required: false
 *       schema:
 *         type: boolean
 *         default: false
 *
 * /api/niveles-tope:
 *   get:
 *     summary: Obtener lista paginada de niveles tope
 *     description: |
 *       Retorna una lista paginada de niveles tope que definen los límites y valores
 *       máximos para diferentes categorías de servicios médicos.
 *
 *       **Características de los niveles tope:**
 *       - **Valor tope**: Límite máximo de cobertura o gasto
 *       - **Vigencia**: Año en que aplica el nivel
 *       - **Estado**: Si el nivel está activo/vigente
 *       - **Niveles especiales**: Algunos niveles pueden ser "libres" (sin límites)
 *
 *       **Búsqueda y filtros:**
 *       - Búsqueda por nombre o descripción del nivel
 *       - Opción para obtener todos los registros sin paginación
 *     tags: [Niveles Tope]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/pageSizeParam'
 *       - $ref: '#/components/parameters/searchParam'
 *       - $ref: '#/components/parameters/allParam'
 *     responses:
 *       200:
 *         description: Lista de niveles tope obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedNivelesTope'
 *             example:
 *               data:
 *                 - id: "001"
 *                   codigo: "001"
 *                   nombre: "Nivel Básico"
 *                   descripcion: "Nivel de atención médica 001 - Define los límites y topes para servicios médicos"
 *                   valor_tope: 500000.00
 *                   vigencia: 2024
 *                   vigente: true
 *                   informacion:
 *                     es_libre: false
 *                     es_nivel_numero: true
 *                     numero_nivel: 1
 *                 - id: "LIBRE"
 *                   codigo: "LIBRE"
 *                   nombre: "LIBRE"
 *                   descripcion: "Nivel libre - Sin límite de tope para casos especiales y excepciones"
 *                   valor_tope: 0
 *                   vigencia: 2024
 *                   vigente: true
 *                   informacion:
 *                     es_libre: true
 *                     es_nivel_numero: false
 *                     numero_nivel: null
 *               pagination:
 *                 page: 1
 *                 pageSize: 10
 *                 totalItems: 15
 *                 totalPages: 2
 *                 hasNextPage: true
 *                 hasPreviousPage: false
 *               allRecords: false
 *       401:
 *         description: No autorizado - Token JWT faltante o inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "No autorizado"
 *               error: "Token de autenticación requerido"
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Error al obtener niveles tope"
 *               error: "ORA-00942: table or view does not exist"
 */
router.get('/', async (req, res) => {
  let conn;
  try {
    const { page = 1, pageSize = 10, search = '', all = 'false' } = req.query;
    const traerTodos = all === 'true' || all === true;
    
    // Si se solicita traer todos, usar límites muy altos
    const limitePageSize = traerTodos ? 10000 : parseInt(pageSize);
    const limiteOffset = traerTodos ? 0 : (parseInt(page) - 1) * parseInt(pageSize);
    
    conn = await getConnection();
    
    // Consulta flexible para obtener niveles tope
    // Tabla real: SMA_NIVELES_TOPE
    const queries = [
      // Query 1: Estructura común de niveles tope
      `SELECT * FROM (
        SELECT a.*, ROWNUM rnum FROM (
          SELECT 
            COD_NIVEL_TOPE as codigo,
            NOMB_NIVEL_TOPE as nombre,
            DESC_NIVEL_TOPE as descripcion,
            VALOR_TOPE,
            VIGENCIA,
            ESTADO,
            ROWID
          FROM ${getTableName('SMA_NIVELES_TOPE')}
          WHERE 1=1
          ${search ? `AND (NOMB_NIVEL_TOPE LIKE '%' || :search || '%' OR DESC_NIVEL_TOPE LIKE '%' || :search || '%')` : ''}
          ORDER BY COD_NIVEL_TOPE
        ) a WHERE ROWNUM <= :maxRow
      ) WHERE rnum > :minRow`,
      // Query 2: Estructura alternativa
      `SELECT * FROM (
        SELECT a.*, ROWNUM rnum FROM (
          SELECT 
            COD_NIVEL as codigo,
            NOMBRE as nombre,
            DESCRIPCION as descripcion,
            VALOR,
            VIGENCIA_ID,
            ACTIVO as estado,
            ROWID
          FROM ${getTableName('SMA_NIVELES_TOPE')}
          WHERE 1=1
          ${search ? `AND (NOMBRE LIKE '%' || :search || '%' OR DESCRIPCION LIKE '%' || :search || '%')` : ''}
          ORDER BY COD_NIVEL
        ) a WHERE ROWNUM <= :maxRow
      ) WHERE rnum > :minRow`,
      // Query 3: Consulta básica con todos los campos (sin alias) - Primero seleccionar todos los campos, luego paginar
      `SELECT * FROM (
        SELECT a.*, ROWNUM rnum FROM (
          SELECT *
          FROM ${getTableName('SMA_NIVELES_TOPE')} a
          ORDER BY a.COD_NIVEL_TOPE
        ) a WHERE ROWNUM <= :maxRow
      ) WHERE rnum > :minRow`
    ];
    
    let result;
    let lastError;
    let queryIndex = 0;
    
    for (const query of queries) {
      try {
        // Para traer todos, modificar la query para no usar paginación
        let queryFinal = query;
        if (traerTodos && queryIndex === 2) {
          // Query 3 modificada para traer todos sin paginación
          queryFinal = `SELECT * FROM ${getTableName('SMA_NIVELES_TOPE')} a ORDER BY a.COD_NIVEL_TOPE`;
        }
        
        const queryParams = traerTodos ? 
          { ...(search ? { search } : {}) } : 
          {
            maxRow: limitePageSize + limiteOffset,
            minRow: limiteOffset,
            ...(search ? { search } : {})
          };

        result = await conn.execute(
          buildQuery(queryFinal),
          queryParams,
          { outFormat: OUT_FORMAT_OBJECT }
        );
        
        if (result.rows && result.rows.length > 0) {
          console.log(`✅ Consulta de niveles tope exitosa usando query ${queryIndex + 1}${traerTodos ? ' (TODOS LOS REGISTROS)' : ''}`);
          if ((queryIndex === 2 || traerTodos) && result.rows[0]) {
            console.log(`Total de registros obtenidos: ${result.rows.length}`);
            console.log('Campos disponibles en primera fila:', Object.keys(result.rows[0]));
            console.log('Primera fila completa:', JSON.stringify(result.rows[0], null, 2).substring(0, 500));
          }
          break;
        }
      } catch (e) {
        lastError = e;
        if (e.code === 'ORA-00904' || e.code === 'ORA-00942' || e.code === 'NJS-098') {
          // Continuar con siguiente query
        } else {
          console.warn(`⚠️ Error en consulta ${queryIndex + 1} de niveles tope:`, e.code, e.message);
        }
      }
      queryIndex++;
    }
    
    // Si todas las consultas fallan, intentar consulta básica sin filtros
    if (!result || !result.rows || result.rows.length === 0) {
      console.log('⚠️ Todas las consultas complejas fallaron, intentando consulta básica...');
      try {
        // Primero descubrir todas las columnas disponibles
        const descQuery = `SELECT column_name FROM all_tab_columns WHERE owner = 'SMA' AND table_name = 'SMA_NIVELES_TOPE' ORDER BY column_id`;
        const descResult = await conn.execute(descQuery, {}, { outFormat: OUT_FORMAT_OBJECT });
        const columns = descResult.rows.map(r => r.COLUMN_NAME).join(', ');
        console.log('Columnas disponibles en SMA_NIVELES_TOPE:', columns);
        
        const rowLimit = traerTodos ? '' : 'WHERE ROWNUM <= 20';
        const basicQuery = `SELECT ${columns} FROM ${getTableName('SMA_NIVELES_TOPE')} ${rowLimit} ORDER BY COD_NIVEL_TOPE`;
        result = await conn.execute(basicQuery, {}, { outFormat: OUT_FORMAT_OBJECT });
        if (result.rows && result.rows.length > 0) {
          console.log(`✅ Consulta básica exitosa${traerTodos ? ' (TODOS LOS REGISTROS)' : ''}`);
          console.log(`Total de registros obtenidos: ${result.rows.length}`);
          console.log('Campos disponibles en primera fila:', Object.keys(result.rows[0] || {}));
          console.log('Primera fila completa:', JSON.stringify(result.rows[0], null, 2));
        }
      } catch (e) {
        console.warn('⚠️ Error en consulta básica:', e.code, e.message);
        if (e.code === 'ORA-00942') {
          await conn.close();
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
            message: 'Tabla SMA_NIVELES_TOPE no encontrada o sin acceso'
          });
        }
      }
    }
    
    // Contar total de registros para paginación
    let countResult;
    const countQueries = [
      `SELECT COUNT(*) as TOTAL FROM ${getTableName('SMA_NIVELES_TOPE')}`,
      `SELECT COUNT(*) as TOTAL FROM SMA.SMA_NIVELES_TOPE`
    ];
    
    for (const countQuery of countQueries) {
      try {
        countResult = await conn.execute(buildQuery(countQuery), {}, { outFormat: OUT_FORMAT_OBJECT });
        if (countResult.rows && countResult.rows.length > 0) {
          break;
        }
      } catch (e) {
        if (e.code === 'ORA-00942') {
          continue;
        }
      }
    }
    
    const total = countResult?.rows?.[0]?.TOTAL || (traerTodos ? result.rows.length : 0);
    const totalPages = traerTodos ? 1 : Math.ceil(total / parseInt(pageSize));
    
    // Mapear resultados de forma flexible
    const nivelesTope = result.rows.map((row, index) => {
      // Debug de cada fila
      if (index === 0) {
        console.log('Mapeando primera fila. Todos los campos disponibles:', Object.keys(row));
        Object.keys(row).forEach(key => {
          console.log(`  ${key}: ${row[key]} (${typeof row[key]})`);
        });
      }
      
      // Buscar campos con diferentes nombres posibles (legacy Oracle + PostgreSQL backup)
      const codigo = row.COD_NIVEL_TOPE || row.COD_NIVEL || row.codigo || row.ID || row.CODIGO || null;
      const nombre = row.NOMB_NIVEL_TOPE || row.NOMB_NIVEL || row.nombre || row.NOMBRE || row.NOMBRE_NIVEL || 'SIN NOMBRE';
      const descripcion = row.DESC_NIVEL_TOPE || row.descripcion || row.DESCRIPCION || row.DESC || '';
      const valorTope = row.VALOR_TOPE || row.VALOR || row.VALOR_MAX || row.TOPE_MAXIMO || 0;
      const vigencia = row.VIGENCIA || row.VIGENCIA_ID || row.VIG || null;
      const estado = row.ESTADO || row.ACTIVO || row.EST || 'A';
      
      // Generar descripción más completa basada en el nombre del nivel
      let descripcionCompleta = descripcion;
      if (!descripcionCompleta || descripcionCompleta === '') {
        if (nombre && nombre.toUpperCase() === 'LIBRE') {
          descripcionCompleta = 'Nivel libre - Sin límite de tope para casos especiales y excepciones';
        } else if (nombre && nombre.toUpperCase().includes('NIVEL')) {
          descripcionCompleta = `Nivel de atención médica ${codigo || nombre} - Define los límites y topes para servicios médicos`;
        } else {
          descripcionCompleta = `Nivel ${codigo || ''} - ${nombre || 'Sin nombre'}`;
        }
      }
      
      const mapeada = {
        id: codigo || row.ROWID || `rowid_${index}`,
        codigo: codigo,
        nombre: nombre,
        descripcion: descripcionCompleta,
        valor_tope: valorTope,
        vigencia: vigencia,
        vigente: (estado === 'A' || estado === 'S' || estado === 1 || estado === true || String(estado).toUpperCase() === 'ACTIVO'),
        // Información adicional contextual
        informacion: {
          es_libre: (nombre && nombre.toUpperCase() === 'LIBRE'),
          es_nivel_numero: !isNaN(parseInt(codigo)),
          numero_nivel: codigo && !isNaN(parseInt(codigo)) ? parseInt(codigo) : null
        },
        raw: row // Para debug completo
      };
      
      if (index === 0) {
        console.log('=== PRIMERA NIVEL TOPE MAPEADA ===');
        console.log('Row original:', JSON.stringify(row, null, 2).substring(0, 500));
        console.log('Mapeada:', JSON.stringify(mapeada, null, 2).substring(0, 500));
        console.log('codigo mapeado:', mapeada.codigo);
        console.log('nombre mapeado:', mapeada.nombre);
        console.log('valor_tope mapeado:', mapeada.valor_tope);
      }
      
      return mapeada;
    });
    
    if (nivelesTope.length > 0) {
      console.log(`✅ Total de niveles tope mapeados: ${nivelesTope.length}`);
    }
    
    await conn.close();
    
    res.json({
      data: nivelesTope,
      pagination: {
        page: traerTodos ? 1 : parseInt(page),
        pageSize: traerTodos ? total : parseInt(pageSize),
        totalItems: parseInt(total),
        totalPages: totalPages,
        hasNextPage: traerTodos ? false : parseInt(page) < totalPages,
        hasPreviousPage: traerTodos ? false : parseInt(page) > 1
      },
      allRecords: traerTodos
    });
  } catch (error) {
    if (conn) await conn.close();
    console.error('❌ Error en /api/niveles-tope:', error);
    res.status(500).json({
      message: 'Error al obtener niveles tope',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

