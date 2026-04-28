const express = require('express');
const { getConnection, getTableName, buildQuery, OUT_FORMAT_OBJECT } = require('../utils/db');
const router = express.Router();
/**
 * @swagger
 * components:
 *   schemas:
 *     GrupoTopeItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Identificador único compuesto (codigo_vigencia)
 *           example: "001_2024"
 *         codigo:
 *           type: string
 *           description: Código del grupo tope
 *           example: "001"
 *         nombre:
 *           type: string
 *           description: Nombre del grupo tope
 *           example: "Grupo Tope Nivel 1"
 *         codigo_resolucion:
 *           type: string
 *           description: Código de resolución del grupo
 *           example: "RES-001-2024"
 *         vigencia:
 *           type: integer
 *           description: Año de vigencia del grupo
 *           example: 2024
 *         nivel:
 *           type: string
 *           description: Código del nivel tope
 *           example: "NIV001"
 *         resolucion:
 *           type: string
 *           description: Alias de codigo_resolucion
 *           example: "RES-001-2024"
 *         vigenciaResolucion:
 *           type: integer
 *           description: Alias de vigencia
 *           example: 2024
 *         valorNormalCatA:
 *           type: number
 *           format: float
 *           description: Valor normal para categoría A
 *           example: 150000.50
 *         valorNormalCatB:
 *           type: number
 *           format: float
 *           description: Valor normal para categoría B
 *           example: 120000.25
 *         valorNormalCatC:
 *           type: number
 *           format: float
 *           description: Valor normal para categoría C
 *           example: 100000.75
 *         valorNormalCatD:
 *           type: number
 *           format: float
 *           description: Valor normal para categoría D
 *           example: 80000.00
 *         valorEspecialCatA:
 *           type: number
 *           format: float
 *           description: Valor especial para categoría A
 *           example: 200000.00
 *         valorEspecialCatB:
 *           type: number
 *           format: float
 *           description: Valor especial para categoría B
 *           example: 180000.50
 *         valorEspecialCatC:
 *           type: number
 *           format: float
 *           description: Valor especial para categoría C
 *           example: 150000.25
 *         valorEspecialCatD:
 *           type: number
 *           format: float
 *           description: Valor especial para categoría D
 *           example: 120000.75
 *       required:
 *         - id
 *         - codigo
 *         - nombre
 *
 *     PaginatedGruposTope:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/GrupoTopeItem'
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
 *               example: 25
 *             totalPages:
 *               type: integer
 *               description: Total de páginas
 *               example: 3
 *             hasNextPage:
 *               type: boolean
 *               description: Indica si hay página siguiente
 *               example: true
 *             hasPreviousPage:
 *               type: boolean
 *               description: Indica si hay página anterior
 *               example: false
 *       required:
 *         - data
 *         - pagination
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         data:
 *           type: array
 *           example: []
 *         message:
 *           type: string
 *           description: Mensaje de error
 *           example: "Error al consultar tabla SMA_GRUPOS_TOPE: Columna no encontrada"
 *         pagination:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *               example: 1
 *             pageSize:
 *               type: integer
 *               example: 10
 *             totalItems:
 *               type: integer
 *               example: 0
 *             totalPages:
 *               type: integer
 *               example: 0
 *             hasNextPage:
 *               type: boolean
 *               example: false
 *             hasPreviousPage:
 *               type: boolean
 *               example: false
 *       required:
 *         - success
 *         - data
 *         - pagination
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
 *       description: Término de búsqueda por nombre o código del grupo
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
 * /api/grupos-tope:
 *   get:
 *     summary: Obtener lista paginada de grupos tope
 *     description: |
 *       Retorna una lista paginada de grupos tope con sus valores por categorías.
 *
 *       **Características:**
 *       - Valores normales y especiales para 4 categorías (A, B, C, D)
 *       - Información de resolución y vigencia
 *       - Búsqueda por nombre o código
 *       - Opción para obtener todos los registros sin paginación
 *
 *       **Categorías de valores:**
 *       - **Normales**: Valores estándar aplicables
 *       - **Especiales**: Valores excepcionales o diferenciados
 *       - **Categorías A-D**: Diferentes niveles de cobertura o servicio
 *     tags: [Grupos Tope]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/pageSizeParam'
 *       - $ref: '#/components/parameters/searchParam'
 *       - $ref: '#/components/parameters/allParam'
 *     responses:
 *       200:
 *         description: Lista de grupos tope obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedGruposTope'
 *             example:
 *               data:
 *                 - id: "001_2024"
 *                   codigo: "001"
 *                   nombre: "Grupo Tope Nivel 1"
 *                   codigo_resolucion: "RES-001-2024"
 *                   vigencia: 2024
 *                   nivel: "NIV001"
 *                   resolucion: "RES-001-2024"
 *                   vigenciaResolucion: 2024
 *                   valorNormalCatA: 150000.50
 *                   valorNormalCatB: 120000.25
 *                   valorNormalCatC: 100000.75
 *                   valorNormalCatD: 80000.00
 *                   valorEspecialCatA: 200000.00
 *                   valorEspecialCatB: 180000.50
 *                   valorEspecialCatC: 150000.25
 *                   valorEspecialCatD: 120000.75
 *               pagination:
 *                 page: 1
 *                 pageSize: 10
 *                 totalItems: 25
 *                 totalPages: 3
 *                 hasNextPage: true
 *                 hasPreviousPage: false
 *       401:
 *         description: No autorizado - Token JWT faltante o inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               data: []
 *               message: "No autorizado"
 *               pagination:
 *                 page: 1
 *                 pageSize: 10
 *                 totalItems: 0
 *                 totalPages: 0
 *                 hasNextPage: false
 *                 hasPreviousPage: false
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               data: []
 *               message: "Error al consultar tabla SMA_GRUPOS_TOPE: Columna no encontrada"
 *               pagination:
 *                 page: 1
 *                 pageSize: 10
 *                 totalItems: 0
 *                 totalPages: 0
 *                 hasNextPage: false
 *                 hasPreviousPage: false
 */
router.get('/', async (req, res) => {
  let conn;
  try {
    const { page = 1, pageSize = 10, search = '', all = 'false' } = req.query;
    const traerTodos = all === 'true' || all === true;
    
    conn = await getConnection();
    
    // Consulta flexible para obtener grupos tope
    // Tabla real: SMA_GRUPOS_TOPE
    const queries = [
      // Query 1: Estructura común con campos conocidos
      `SELECT * FROM (
        SELECT a.*, ROWNUM rnum FROM (
          SELECT 
            COD_GRUPO_TOPE as codigo,
            NOMB_GRUPO_TOPE as nombre,
            COD_RESOLUCION_GRUPO as codigo_resolucion,
            VIGENCIA_GRUPO as vigencia,
            COD_NIVEL_TOPE as nivel,
            VALOR_NORMAL_CAT_A as valorNormalCatA,
            VALOR_NORMAL_CAT_B as valorNormalCatB,
            VALOR_NORMAL_CAT_C as valorNormalCatC,
            VALOR_NORMAL_CAT_D as valorNormalCatD,
            VALOR_ESPECIAL_CAT_A as valorEspecialCatA,
            VALOR_ESPECIAL_CAT_B as valorEspecialCatB,
            VALOR_ESPECIAL_CAT_C as valorEspecialCatC,
            VALOR_ESPECIAL_CAT_D as valorEspecialCatD,
            ROWID
          FROM ${getTableName('SMA_GRUPOS_TOPE')}
          WHERE 1=1
          ${search ? `AND (NOMB_GRUPO_TOPE LIKE '%' || :search || '%' OR COD_GRUPO_TOPE LIKE '%' || :search || '%')` : ''}
          ORDER BY VIGENCIA_GRUPO DESC, COD_GRUPO_TOPE
        ) a WHERE ROWNUM <= :maxRow
      ) WHERE rnum > :minRow`,
      // Query 2: Consulta básica con todos los campos (sin alias)
      `SELECT * FROM (
        SELECT a.*, ROWNUM rnum FROM (
          SELECT *
          FROM ${getTableName('SMA_GRUPOS_TOPE')} a
          ORDER BY a.VIGENCIA_GRUPO DESC, a.COD_GRUPO_TOPE
        ) a WHERE ROWNUM <= :maxRow
      ) WHERE rnum > :minRow`
    ];
    
    let result = { rows: [] };
    let queryIndex = 0;
    
    for (const query of queries) {
      try {
        let queryFinal = query;
        
        // Para traer todos, modificar la query para no usar paginación
        if (traerTodos && queryIndex === 0) {
          // Query 1 sin paginación
          queryFinal = `SELECT 
            COD_GRUPO_TOPE as codigo,
            NOMB_GRUPO_TOPE as nombre,
            COD_RESOLUCION_GRUPO as codigo_resolucion,
            VIGENCIA_GRUPO as vigencia,
            COD_NIVEL_TOPE as nivel,
            VALOR_NORMAL_CAT_A as valorNormalCatA,
            VALOR_NORMAL_CAT_B as valorNormalCatB,
            VALOR_NORMAL_CAT_C as valorNormalCatC,
            VALOR_NORMAL_CAT_D as valorNormalCatD,
            VALOR_ESPECIAL_CAT_A as valorEspecialCatA,
            VALOR_ESPECIAL_CAT_B as valorEspecialCatB,
            VALOR_ESPECIAL_CAT_C as valorEspecialCatC,
            VALOR_ESPECIAL_CAT_D as valorEspecialCatD,
            ROWID
          FROM ${getTableName('SMA_GRUPOS_TOPE')}
          ${search ? `WHERE (NOMB_GRUPO_TOPE LIKE '%' || :search || '%' OR COD_GRUPO_TOPE LIKE '%' || :search || '%')` : ''}
          ORDER BY VIGENCIA_GRUPO DESC, COD_GRUPO_TOPE`;
        } else if (traerTodos && queryIndex === 1) {
          queryFinal = `SELECT * FROM ${getTableName('SMA_GRUPOS_TOPE')} a ORDER BY a.VIGENCIA_GRUPO DESC, a.COD_GRUPO_TOPE`;
        }
        
        const queryParams = traerTodos ? 
          { ...(search ? { search } : {}) } :
          {
            maxRow: parseInt(pageSize) + (parseInt(page) - 1) * parseInt(pageSize),
            minRow: (parseInt(page) - 1) * parseInt(pageSize),
            ...(search ? { search } : {})
          };
        
        result = await conn.execute(
          buildQuery(queryFinal),
          queryParams,
          { outFormat: OUT_FORMAT_OBJECT }
        );
        
        if (result.rows && result.rows.length > 0) {
          console.log(`✅ Consulta de grupos tope exitosa usando query ${queryIndex + 1}${traerTodos ? ' (TODOS LOS REGISTROS)' : ''}`);
          if (queryIndex === 1 && result.rows[0]) {
            console.log(`Total de registros obtenidos: ${result.rows.length}`);
            console.log('Campos disponibles en primera fila:', Object.keys(result.rows[0]));
            console.log('Primera fila completa:', JSON.stringify(result.rows[0], null, 2).substring(0, 800));
          }
          break;
        }
      } catch (e) {
        if (e.code === 'ORA-00904' || e.code === 'ORA-00942' || e.code === 'NJS-098') {
          // Continuar con siguiente query
        } else {
          console.warn(`⚠️ Error en consulta ${queryIndex + 1} de grupos tope:`, e.code, e.message);
        }
      }
      queryIndex++;
    }
    
    // Si todas las consultas fallan, intentar consulta básica sin filtros
    if (!result || !result.rows || result.rows.length === 0) {
      console.log('⚠️ Todas las consultas complejas fallaron, intentando consulta básica...');
      try {
        // Primero intentar obtener las columnas disponibles
        let basicQuery;
        try {
          // Intentar consulta con ORDER BY
          if (traerTodos) {
            basicQuery = `SELECT * FROM ${getTableName('SMA_GRUPOS_TOPE')} ORDER BY VIGENCIA_GRUPO DESC, COD_GRUPO_TOPE`;
          } else {
            basicQuery = `SELECT * FROM (
              SELECT a.*, ROWNUM rnum FROM (
                SELECT * FROM ${getTableName('SMA_GRUPOS_TOPE')} ORDER BY VIGENCIA_GRUPO DESC, COD_GRUPO_TOPE
              ) a WHERE ROWNUM <= :maxRow
            ) WHERE rnum > :minRow`;
          }
          
          const basicParams = traerTodos ? {} : {
            maxRow: parseInt(pageSize) + (parseInt(page) - 1) * parseInt(pageSize),
            minRow: (parseInt(page) - 1) * parseInt(pageSize)
          };
          
          result = await conn.execute(
            buildQuery(basicQuery), 
            basicParams, 
            { outFormat: OUT_FORMAT_OBJECT }
          );
        } catch (orderError) {
          // Si falla por ORDER BY, intentar sin ordenar
          console.log('⚠️ Consulta con ORDER BY falló, intentando sin ordenar...');
          try {
            if (traerTodos) {
              basicQuery = `SELECT * FROM ${getTableName('SMA_GRUPOS_TOPE')}`;
            } else {
              basicQuery = `SELECT * FROM (
                SELECT a.*, ROWNUM rnum FROM (
                  SELECT * FROM ${getTableName('SMA_GRUPOS_TOPE')}
                ) a WHERE ROWNUM <= :maxRow
              ) WHERE rnum > :minRow`;
            }
            
            const basicParams = traerTodos ? {} : {
              maxRow: parseInt(pageSize) + (parseInt(page) - 1) * parseInt(pageSize),
              minRow: (parseInt(page) - 1) * parseInt(pageSize)
            };
            
            result = await conn.execute(
              buildQuery(basicQuery), 
              basicParams, 
              { outFormat: OUT_FORMAT_OBJECT }
            );
          } catch (noOrderError) {
            // Si también falla sin ORDER BY, lanzar el error para que lo capture el catch externo
            console.log('⚠️ Consulta sin ORDER BY también falló:', noOrderError.message);
            throw noOrderError;
          }
        }
        
        if (result && result.rows && result.rows.length > 0) {
          console.log(`✅ Consulta básica exitosa${traerTodos ? ' (TODOS LOS REGISTROS)' : ''}`);
          console.log(`Total de registros obtenidos: ${result.rows.length}`);
          console.log('Campos disponibles en primera fila:', Object.keys(result.rows[0] || {}));
        }
      } catch (e) {
        console.warn('⚠️ Error en consulta básica:', e.code, e.message);
        await conn.close();
        return res.json({
          success: true,
          data: [],
          pagination: {
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            totalItems: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false
          },
          message: `Error al consultar tabla SMA_GRUPOS_TOPE: ${e.message || 'Columna no encontrada'}`
        });
      }
    }
    
    // Verificar que result existe antes de continuar
    if (!result || !result.rows) {
      await conn.close();
      return res.json({
        success: true,
        data: [],
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          totalItems: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false
        },
        message: 'No se pudieron obtener los grupos de tope'
      });
    }
    
    // Contar total de registros para paginación
    let countResult;
    const countQueries = [
      `SELECT COUNT(*) as TOTAL FROM ${getTableName('SMA_GRUPOS_TOPE')}`,
      `SELECT COUNT(*) as TOTAL FROM SMA.SMA_GRUPOS_TOPE`
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
    
    // Verificar nuevamente que result existe antes de continuar (por si acaso)
    if (!result || !result.rows) {
      await conn.close();
      return res.json({
        success: true,
        data: [],
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          totalItems: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false
        },
        message: 'No se pudieron obtener los grupos de tope (resultado vacío después de contar)'
      });
    }
    
    const total = countResult?.rows?.[0]?.TOTAL || (traerTodos ? result.rows.length : 0);
    const totalPages = traerTodos ? 1 : Math.ceil(total / parseInt(pageSize));
    
    // Mapear resultados de forma flexible
    const gruposTope = result.rows.map((row, index) => {
      if (index === 0) {
        console.log('Mapeando primera fila. Todos los campos disponibles:', Object.keys(row));
      }
      
      // Buscar campos con diferentes nombres posibles (legacy Oracle + PostgreSQL backup)
      const codigo = row.COD_GRUPO_TOPE || row.COD_GRUPO || row.codigo || row.ID || null;
      const nombre = row.NOMB_GRUPO_TOPE || row.NOMB_GRUPO || row.nombre || row.NOMBRE || row.NOMBRE_GRUPO || 'SIN NOMBRE';
      const codigoResolucion = row.COD_RESOLUCION_GRUPO || row.CODIGO_RES_GRUPO || row.codigo_resolucion || row.COD_RESOLUCION || row.COD_RES || null;
      const vigencia = row.VIGENCIA_GRUPO || row.VIGENCIA_RES_GRUPO || row.vigencia || row.VIGENCIA || row.VIG || null;
      const nivel = row.COD_NIVEL_TOPE || row.COD_NIVEL_GRUPO || row.nivel || row.NIVEL || row.COD_NIVEL || null;
      
      const mapeada = {
        id: codigo && vigencia ? `${codigo}_${vigencia}` : (row.ROWID || `rowid_${index}`),
        codigo: codigo,
        nombre: nombre,
        codigo_resolucion: codigoResolucion,
        vigencia: vigencia,
        nivel: nivel,
        resolucion: codigoResolucion,
        vigenciaResolucion: vigencia,
        valorNormalCatA: parseFloat(row.VALOR_NORMAL_CAT_A ?? row.VALOR_NORMAL_CAT_A_GRUPO ?? row.VALORNORMALCATA ?? row.valorNormalCatA ?? row.valor_normal_cat_a ?? row.VALOR_NORMAL_A ?? row.VALOR_A ?? 0),
        valorNormalCatB: parseFloat(row.VALOR_NORMAL_CAT_B ?? row.VALOR_NORMAL_CAT_B_GRUPO ?? row.VALORNORMALCATB ?? row.valorNormalCatB ?? row.valor_normal_cat_b ?? row.VALOR_NORMAL_B ?? row.VALOR_B ?? 0),
        valorNormalCatC: parseFloat(row.VALOR_NORMAL_CAT_C ?? row.VALOR_NORMAL_CAT_C_GRUPO ?? row.VALORNORMALCATC ?? row.valorNormalCatC ?? row.valor_normal_cat_c ?? row.VALOR_NORMAL_C ?? row.VALOR_C ?? 0),
        valorNormalCatD: parseFloat(row.VALOR_NORMAL_CAT_D ?? row.VALOR_NORMAL_CAT_D_GRUPO ?? row.VALORNORMALCATD ?? row.valorNormalCatD ?? row.valor_normal_cat_d ?? row.VALOR_NORMAL_D ?? row.VALOR_D ?? 0),
        valorEspecialCatA: row.VALOR_ESPECIAL_CAT_A || row.VALOR_ESPECIAL_CAT_A_GRUPO || row.valorEspecialCatA || row.VALOR_ESPECIAL_A || 0,
        valorEspecialCatB: row.VALOR_ESPECIAL_CAT_B || row.VALOR_ESPECIAL_CAT_B_GRUPO || row.valorEspecialCatB || row.VALOR_ESPECIAL_B || 0,
        valorEspecialCatC: row.VALOR_ESPECIAL_CAT_C || row.VALOR_ESPECIAL_CAT_C_GRUPO || row.valorEspecialCatC || row.VALOR_ESPECIAL_C || 0,
        valorEspecialCatD: row.VALOR_ESPECIAL_CAT_D || row.VALOR_ESPECIAL_CAT_D_GRUPO || row.valorEspecialCatD || row.VALOR_ESPECIAL_D || 0,
        raw: row
      };
      
      if (index === 0) {
        console.log('=== PRIMERA GRUPO TOPE MAPEADA ===');
        console.log('Row original:', JSON.stringify(row, null, 2).substring(0, 500));
        console.log('Mapeada:', JSON.stringify(mapeada, null, 2).substring(0, 500));
      }
      
      return mapeada;
    });
    
    if (gruposTope.length > 0) {
      console.log(`✅ Total de grupos tope mapeados: ${gruposTope.length}`);
    }
    
    await conn.close();
    
    res.json({
      data: gruposTope,
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
    console.error('❌ Error en /api/grupos-tope:', error);
    res.status(500).json({
      message: 'Error al obtener grupos tope',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

