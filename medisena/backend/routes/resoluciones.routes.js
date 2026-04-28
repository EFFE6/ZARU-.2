const express = require('express');
const { getConnection, getTableName, buildQuery, OUT_FORMAT_OBJECT } = require('../utils/db');
const { logAuditEvent, ACTION_TYPES } = require('../utils/auditLogger');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Resoluciones
 *     description: Gestión de resoluciones del sistema
 * 
 * components:
 *   schemas:
 *     Resolucion:
 *       type: object
 *       required:
 *         - codigoResolucion
 *         - vigencia
 *       properties:
 *         codigoResolucion:
 *           type: string
 *           description: Código único de la resolución
 *           example: "RES-2024-001"
 *         vigencia:
 *           type: integer
 *           description: Año de vigencia de la resolución
 *           example: 2024
 *         fechaInicio:
 *           type: string
 *           format: date-time
 *           description: Fecha de inicio de vigencia
 *           example: "2024-01-01T00:00:00Z"
 *         fechaTerminacion:
 *           type: string
 *           format: date-time
 *           description: Fecha de finalización de vigencia
 *           example: "2024-12-31T23:59:59Z"
 *         estado:
 *           type: string
 *           enum: [ACTIVA, INACTIVA, SUSPENDIDA]
 *           description: Estado de la resolución
 *           example: "ACTIVA"
 *         descripcion:
 *           type: string
 *           description: Descripción de la resolución
 *           example: "Resolución que establece normas..."
 *     
 *     ResolucionResponse:
 *       type: object
 *       properties:
 *         codigoRES:
 *           type: string
 *           description: Código de la resolución (alias CODIGO_RES)
 *           example: "RES-2024-001"
 *         vigenciaRES:
 *           type: integer
 *           description: Vigencia (alias VIGENCIA_RES)
 *           example: 2024
 *         fechaInicioRES:
 *           type: string
 *           description: Fecha de inicio (alias FECHA_INICIO_RES)
 *           example: "2024-01-01"
 *         fechaTerminacionRES:
 *           type: string
 *           description: Fecha de terminación (alias FECHA_TERMINACION_RES)
 *           example: "2024-12-31"
 *         estadoRES:
 *           type: string
 *           description: Estado (alias ESTADO_RES)
 *           example: "ACTIVA"
 *     
 *     PaginatedResolutions:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ResolucionResponse'
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
 *               example: 150
 *             totalPages:
 *               type: integer
 *               example: 15
 *             hasNextPage:
 *               type: boolean
 *               example: true
 *             hasPreviousPage:
 *               type: boolean
 *               example: false
 *     
 *     TestResult:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         tests:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               test:
 *                 type: string
 *               success:
 *                 type: boolean
 *               rows:
 *                 type: integer
 *               error:
 *                 type: string
 *         successful:
 *           type: string
 *           description: Nombre del test exitoso
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ResolucionResponse'
 *     
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           description: Descripción del error
 *           example: "Error interno del servidor"
 *         message:
 *           type: string
 *           description: Mensaje detallado del error
 *   
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
/**
 * @swagger
 * /api/resoluciones/test:
 *   get:
 *     summary: Endpoint de prueba para debugging de resoluciones
 *     description: Realiza pruebas de conexión y validación del esquema de resoluciones. Solo para uso en desarrollo/debugging.
 *     operationId: testResolutions
 *     tags: [Resoluciones]
 *     deprecated: true
 *     responses:
 *       200:
 *         description: Resultado de las pruebas ejecutadas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TestResult'
 *       500:
 *         description: Error durante las pruebas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/test', async (req, res) => {
  let conn;
  try {
    console.log('🧪 === PRUEBA DE CONSULTA RESOLUCIONES ===');
    conn = await getConnection();
    console.log('✅ Conexión establecida');
    
    const results = {
      tests: [],
      successful: null
    };
    
    // Prueba 1: Consulta mínima sin WHERE
    console.log('\n📝 Prueba 1: SELECT simple sin WHERE');
    try {
      const query1 = `SELECT CODIGO_RES, VIGENCIA_RES, FECHA_INICIO_RES, FECHA_TERMINACION_RES, ESTADO_RES FROM ${getTableName('SMA_RESOLUCIONES')}`;
      const result1 = await conn.execute(query1, {}, { outFormat: OUT_FORMAT_OBJECT });
      console.log(`✅ Prueba 1 exitosa: ${result1.rows ? result1.rows.length : 0} filas`);
      
      results.tests.push({
        test: 'Prueba 1: SELECT simple sin WHERE',
        success: true,
        rows: result1.rows?.length || 0,
        sample: result1.rows?.slice(0, 3) || []
      });
      
      await conn.close();
      return res.json({
        success: true,
        ...results,
        successful: 'Prueba 1',
        data: result1.rows?.slice(0, 10) || []
      });
    } catch (e1) {
      console.error(`❌ Prueba 1 falló: ${e1.code} - ${e1.message}`);
      results.tests.push({
        test: 'Prueba 1: SELECT simple sin WHERE',
        success: false,
        error: e1.code,
        message: e1.message
      });
      
      // Prueba 2: Consulta con ROWNUM limitado
      console.log('\n📝 Prueba 2: SELECT con ROWNUM limitado');
      try {
        const query2 = `SELECT CODIGO_RES, VIGENCIA_RES, FECHA_INICIO_RES, FECHA_TERMINACION_RES, ESTADO_RES FROM ${getTableName('SMA_RESOLUCIONES')} WHERE ROWNUM <= 5`;
        const result2 = await conn.execute(query2, {}, { outFormat: OUT_FORMAT_OBJECT });
        console.log(`✅ Prueba 2 exitosa: ${result2.rows ? result2.rows.length : 0} filas`);
        
        results.tests.push({
          test: 'Prueba 2: SELECT con ROWNUM limitado',
          success: true,
          rows: result2.rows?.length || 0,
          sample: result2.rows || []
        });
        
        await conn.close();
        return res.json({
          success: true,
          ...results,
          successful: 'Prueba 2',
          data: result2.rows || []
        });
      } catch (e2) {
        console.error(`❌ Prueba 2 falló: ${e2.code} - ${e2.message}`);
        results.tests.push({
          test: 'Prueba 2: SELECT con ROWNUM limitado',
          success: false,
          error: e2.code,
          message: e2.message
        });
        
        // Prueba 3: Solo un campo
        console.log('\n📝 Prueba 3: Solo CODIGO_RES');
        try {
          const query3 = `SELECT CODIGO_RES FROM ${getTableName('SMA_RESOLUCIONES')} WHERE ROWNUM <= 5`;
          const result3 = await conn.execute(query3, {}, { outFormat: OUT_FORMAT_OBJECT });
          console.log(`✅ Prueba 3 exitosa: ${result3.rows ? result3.rows.length : 0} filas`);
          
          results.tests.push({
            test: 'Prueba 3: Solo CODIGO_RES',
            success: true,
            rows: result3.rows?.length || 0,
            sample: result3.rows || []
          });
          
          await conn.close();
          return res.json({
            success: true,
            ...results,
            successful: 'Prueba 3',
            data: result3.rows || []
          });
        } catch (e3) {
          console.error(`❌ Prueba 3 falló: ${e3.code} - ${e3.message}`);
          results.tests.push({
            test: 'Prueba 3: Solo CODIGO_RES',
            success: false,
            error: e3.code,
            message: e3.message
          });
          
          // Prueba 4: Verificar si es una vista y obtener su definición
          console.log('\n📝 Prueba 4: Verificar estructura de la tabla/vista');
          try {
            const query4 = `SELECT * FROM USER_VIEWS WHERE VIEW_NAME = 'SMA_RESOLUCIONES'`;
            const result4 = await conn.execute(query4, {}, { outFormat: OUT_FORMAT_OBJECT });
            console.log(`✅ Es una vista: ${result4.rows?.length > 0 ? 'Sí' : 'No'}`);
            
            results.tests.push({
              test: 'Prueba 4: Verificar si es vista',
              success: true,
              isView: result4.rows?.length > 0,
              viewDefinition: result4.rows?.[0]?.TEXT || null
            });
            
            // Prueba 5: Intentar consultar con subconsulta
            console.log('\n📝 Prueba 5: Subconsulta con alias');
            try {
              const query5 = `SELECT * FROM (SELECT CODIGO_RES, VIGENCIA_RES, FECHA_INICIO_RES, FECHA_TERMINACION_RES, ESTADO_RES FROM ${getTableName('SMA_RESOLUCIONES')}) WHERE ROWNUM <= 5`;
              const result5 = await conn.execute(query5, {}, { outFormat: OUT_FORMAT_OBJECT });
              console.log(`✅ Prueba 5 exitosa: ${result5.rows ? result5.rows.length : 0} filas`);
              
              results.tests.push({
                test: 'Prueba 5: Subconsulta con alias',
                success: true,
                rows: result5.rows?.length || 0,
                sample: result5.rows || []
              });
              
              await conn.close();
              return res.json({
                success: true,
                ...results,
                successful: 'Prueba 5',
                data: result5.rows || []
              });
            } catch (e5) {
              console.error(`❌ Prueba 5 falló: ${e5.code} - ${e5.message}`);
              results.tests.push({
                test: 'Prueba 5: Subconsulta con alias',
                success: false,
                error: e5.code,
                message: e5.message
              });
              
              await conn.close();
              return res.status(500).json({
                success: false,
                ...results,
                message: 'Todas las pruebas fallaron',
                recommendation: 'La vista SMA_RESOLUCIONES tiene DISTINCT/GROUP BY y Oracle no permite SELECT directo. Necesitamos consultar la tabla base o modificar la consulta.'
              });
            }
          } catch (e4) {
            console.error(`❌ Prueba 4 falló: ${e4.code} - ${e4.message}`);
            results.tests.push({
              test: 'Prueba 4: Verificar estructura',
              success: false,
              error: e4.code,
              message: e4.message
            });
            
            await conn.close();
            return res.status(500).json({
              success: false,
              ...results,
              message: 'No se pudo verificar la estructura'
            });
          }
        }
      }
    }
  } catch (error) {
    if (conn) await conn.close();
    console.error('❌ Error en prueba:', error);
    return res.status(500).json({
      success: false,
      error: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'Error en prueba',
      stack: error.stack
    });
  }
});

/**
 * @swagger
 * /api/resoluciones:
 *   get:
 *     summary: Obtener lista paginada de resoluciones
 *     description: Obtiene la lista de resoluciones del sistema con paginación y búsqueda opcional
 *     operationId: getResoluciones
 *     tags: [Resoluciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Número de página (comienza en 1)
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 1000
 *         description: Cantidad de elementos por página (máximo 1000)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Término de búsqueda (busca por código de resolución)
 *         example: "RES-2024"
 *     responses:
 *       200:
 *         description: Lista de resoluciones obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResolutions'
 *       400:
 *         description: Parámetros de búsqueda inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Parámetro inválido"
 *               message: "El pageSize debe ser un número positivo"
 *       401:
 *         description: No autorizado - Token no proporcionado o inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Prohibido - Sin permisos para acceder a resoluciones
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor o tabla no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Error interno del servidor"
 *               message: "Error al acceder a la tabla de resoluciones"
 */
router.get('/', async (req, res) => {
  let conn;
  try {
    console.log('🔍 GET /api/resoluciones - Iniciando...');
    const { page = 1, pageSize = 10, search = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    
    console.log('📝 Parámetros recibidos:', { page, pageSize, search, offset });
    
    conn = await getConnection();
    console.log('✅ Conexión a BD establecida');
    
    // Consulta flexible para obtener resoluciones
    // Basado en el código antiguo: SeleccionarResoluciones() sin paginación
    // Campos: CODIGO_RES, VIGENCIA_RES, FECHA_INICIO_RES, FECHA_TERMINACION_RES, ESTADO_RES
    // NOTA: La tabla puede ser una vista con DISTINCT/GROUP BY, por lo que NO podemos usar ROWID ni SELECT *
    // PROBLEMA: ORDER BY también causa ORA-01446 si la vista tiene DISTINCT/GROUP BY
    // SOLUCIÓN: Consulta simple SIN ORDER BY (probada exitosamente en /test/resoluciones), luego ordenamos en memoria
    // Query probada: SELECT CODIGO_RES, VIGENCIA_RES, FECHA_INICIO_RES, FECHA_TERMINACION_RES, ESTADO_RES FROM SMA_RESOLUCIONES
    
    // Ejecutar query simple (sin paginación en SQL para evitar problemas con vistas)
    // La paginación se hará en memoria después de obtener los resultados
    let result;
    let totalRows = 0;
    try {
      const queryParams = {};
      
      // Construir la query directamente - SOLO campos específicos, SIN ORDER BY
      // Esta es la misma consulta que funcionó exitosamente en /test/resoluciones
      let finalQuery = `SELECT CODIGO_RES, VIGENCIA_RES, FECHA_INICIO_RES, FECHA_TERMINACION_RES, ESTADO_RES FROM ${getTableName('SMA_RESOLUCIONES')}`;
      
      if (search) {
        finalQuery += ` WHERE CODIGO_RES LIKE '%' || :search || '%'`;
        queryParams.search = search;
      }
      
      console.log(`🔍 Ejecutando consulta simple (probada exitosamente en /test/resoluciones)...`);
      console.log(`📝 Query: ${finalQuery.substring(0, 150)}...`);
      
      result = await conn.execute(
        finalQuery,
        queryParams,
        { outFormat: OUT_FORMAT_OBJECT }
      );

      // Obtener total real mediante COUNT(*) para mantener compatibilidad con pruebas unitarias
      try {
        const countQuery = `
          SELECT COUNT(*) AS TOTAL
          FROM ${getTableName('SMA_RESOLUCIONES')}
          ${search ? `WHERE CODIGO_RES LIKE '%' || :search || '%'` : ''}
        `;
        const countResult = await conn.execute(
          buildQuery(countQuery),
          queryParams,
          { outFormat: OUT_FORMAT_OBJECT }
        );
        if (countResult?.rows && countResult.rows[0] && countResult.rows[0].TOTAL !== undefined) {
          totalRows = parseInt(countResult.rows[0].TOTAL);
        }
      } catch (countError) {
        console.warn('⚠️ Error obteniendo total de resoluciones:', countError.code, countError.message);
      }
      
      console.log(`✅ Query exitosa: ${result.rows ? result.rows.length : 0} filas obtenidas`);
      
      // Aplicar paginación en memoria después de obtener todos los resultados
      if (result && result.rows && result.rows.length > 0) {
        const allRows = [...result.rows]; // Crear copia para evitar mutación
        
        // Ordenar en memoria: por vigencia descendente (de mayor a menor)
        // Ordenar solo por vigencia, de la más alta a la más baja
        allRows.sort((a, b) => {
          const vigenciaA = parseInt(a.VIGENCIA_RES) || 0;
          const vigenciaB = parseInt(b.VIGENCIA_RES) || 0;
          
          // Ordenar por vigencia descendente (valores más altos primero)
          return vigenciaB - vigenciaA;
        });
        
        const startIndex = offset;
        const endIndex = offset + parseInt(pageSize);
        
        // Guardar el total antes de aplicar paginación
        if (!totalRows) {
          totalRows = allRows.length;
        }
        
        // Aplicar paginación
        result.rows = allRows.slice(startIndex, endIndex);
        result.totalRows = totalRows;
        
        console.log(`📄 Paginación aplicada: mostrando ${result.rows.length} de ${totalRows} registros (página ${page}, tamaño ${pageSize})`);
      } else {
        result = { rows: [], totalRows: 0 };
      }
    } catch (e) {
      if (e.code === 'ORA-00942') {
        console.warn('⚠️ Tabla SMA_RESOLUCIONES no encontrada. Retornando respuesta vacía.');
        if (conn) {
          await conn.close();
          conn = null;
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
          message: 'Tabla de resoluciones no encontrada'
        });
      }
      console.error(`❌ Error ejecutando consulta:`, e.code, e.message);
      throw e; // Si falla, lanzar error
    }
    
    // Validar que tenemos resultados antes de continuar
    if (!result || !result.rows) {
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
        message: 'No se encontraron resoluciones'
      });
    }
    
    // Usar el total de filas obtenidas (ya aplicamos paginación en memoria)
    const total = totalRows || result.totalRows || result.rows.length;
    const totalPages = Math.ceil(total / parseInt(pageSize));
    
    console.log(`📊 Total calculado: ${total}, Total páginas: ${totalPages}`);
    
    // Cerrar conexión ANTES de procesar datos (para evitar problemas de memoria)
    try {
      await conn.close();
      console.log('✅ Conexión cerrada');
      conn = null; // Marcar como cerrada
    } catch (closeError) {
      console.warn('⚠️ Error al cerrar conexión:', closeError.message);
    }
    
    // Función helper para convertir fechas de Oracle a string ISO
    const formatOracleDate = (dateValue) => {
      if (!dateValue) return null;
      try {
        // Si ya es un string en formato ISO o fecha simple
        if (typeof dateValue === 'string') {
          // Si ya está en formato YYYY-MM-DD, retornarlo
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
            return dateValue;
          }
          // Si tiene T (ISO format), tomar solo la parte de fecha
          if (dateValue.includes('T')) {
            return dateValue.split('T')[0];
          }
          // Intentar parsear como fecha
          const parsed = new Date(dateValue);
          if (!isNaN(parsed.getTime())) {
            return parsed.toISOString().split('T')[0];
          }
          return dateValue;
        }
        
        // Si es un objeto Date de JavaScript
        if (dateValue instanceof Date) {
          if (isNaN(dateValue.getTime())) {
            return null;
          }
          return dateValue.toISOString().split('T')[0];
        }
        
        // Si tiene método getTime (objetos Date de Oracle)
        if (dateValue && typeof dateValue.getTime === 'function') {
          const timestamp = dateValue.getTime();
          if (isNaN(timestamp)) {
            return null;
          }
          return new Date(timestamp).toISOString().split('T')[0];
        }
        
        // Si tiene propiedades de fecha (objetos Date de Oracle)
        if (dateValue && (dateValue.year || dateValue.month || dateValue.day)) {
          const year = dateValue.year || new Date().getFullYear();
          const month = (dateValue.month || 1) - 1; // Los meses en JS son 0-indexed
          const day = dateValue.day || 1;
          const date = new Date(year, month, day);
          return date.toISOString().split('T')[0];
        }
        
        // Intentar convertir como número (timestamp)
        if (typeof dateValue === 'number') {
          const date = new Date(dateValue);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        }
        
        // Último intento: convertir a Date
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
        
        return null;
      } catch (e) {
        console.warn('Error formateando fecha:', e, dateValue);
        return null;
      }
    };

    console.log(`📊 Resultados obtenidos: ${result.rows ? result.rows.length : 0} filas`);
    console.log(`📊 Total de registros: ${result.totalRows || (result.rows ? result.rows.length : 0)}`);
    
    // Mapear resultados de forma flexible
    const resoluciones = (result.rows || []).map((row, index) => {
      try {
        // Buscar campos con diferentes nombres posibles - mapeo exhaustivo
        // Basado en campos reales: CODIGO_RES, VIGENCIA_RES, FECHA_INICIO_RES, FECHA_TERMINACION_RES, ESTADO_RES
        const codigoRes = row.CODIGO_RES;
        const vigenciaRes = row.VIGENCIA_RES;
        const fechaInicioRes = row.FECHA_INICIO_RES;
        const fechaTerminacionRes = row.FECHA_TERMINACION_RES;
        const estadoRes = row.ESTADO_RES;
        
        // Debug: mostrar estructura de la primera fila
        if (index === 0) {
          console.log('🔍 Primera fila (estructura):', Object.keys(row));
          console.log('🔍 Primera fila (valores):', {
            CODIGO_RES: codigoRes,
            VIGENCIA_RES: vigenciaRes,
            FECHA_INICIO_RES: fechaInicioRes,
            FECHA_TERMINACION_RES: fechaTerminacionRes,
            ESTADO_RES: estadoRes
          });
        }
        
        const mapeada = {
          // Campos reales de la BD según JSP original: CODIGO_RES, VIGENCIA_RES, FECHA_INICIO_RES, FECHA_TERMINACION_RES, ESTADO_RES
          id: (codigoRes !== undefined && codigoRes !== null) ? `${codigoRes}_${vigenciaRes || ''}` : (row.id || row.COD_RESOLUCION || row.CODIGO || row.ID || row.ROWID || `rowid_${index}`),
          codigo_resolucion: (codigoRes !== undefined && codigoRes !== null) ? codigoRes : (row.COD_RESOLUCION || row.CODIGO || (row.numero_resolucion ? parseInt(row.numero_resolucion) : null) || null),
          vigencia_resolucion: (vigenciaRes !== undefined && vigenciaRes !== null) ? vigenciaRes : (row.vigencia || null),
          numero_resolucion: (codigoRes !== undefined && codigoRes !== null) ? String(codigoRes) : (row.numero_resolucion || row.NUM_RESOLUCION || row.NUMERO || row.CODIGO || row.COD_RESOLUCION || ''),
          fecha_resolucion: formatOracleDate(fechaInicioRes || row.fecha_resolucion || row.FECH_RESOLUCION || row.FECHA || row.FECHA_RESOLUCION || row.FECHA_RESOLUC),
          descripcion: row.descripcion || row.DESC_RESOLUCION || row.DESCRIPCION || row.OBSERVACION || row.NOTAS || `Resolución ${codigoRes || row.NUM_RESOLUCION || row.NUMERO || ''} - Vigencia ${vigenciaRes || ''}` || 'Resolución',
          tipo_resolucion: row.tipo_resolucion || row.TIPO_RESOLUCION || row.TIPO || row.CLASE || 'POLÍTICA',
          estado_resolucion: (estadoRes !== undefined && estadoRes !== null) ? estadoRes : (row.ESTADO_RES || row.VIGENTE || 'A'),
          estado_nombre: (estadoRes !== undefined && estadoRes !== null) ? 
            (String(estadoRes).toUpperCase() === 'A' ? 'Activa' : 'Inactiva') : 
            ((row.VIGENTE === 'S' || row.VIGENTE === 'A' || row.ESTADO_VIGENTE === 'A') ? 'Activa' : 'Inactiva'),
          vigente: (estadoRes !== undefined && estadoRes !== null) ? 
            (String(estadoRes).toUpperCase() === 'S' || String(estadoRes).toUpperCase() === 'A' || String(estadoRes) === '1' || estadoRes === true || estadoRes === 1) : 
            (row.VIGENTE !== undefined ? (row.VIGENTE === 'S' || row.VIGENTE === '1' || row.VIGENTE === true || row.VIGENTE === 1 || row.ESTADO_VIGENTE === 'S' || row.ESTADO_VIGENTE === '1') : true),
          fecha_inicio: formatOracleDate(fechaInicioRes || row.fecha_inicio || row.FECH_INICIO || row.FECHA_INICIO || row.FECHA_INIC || row.fecha_resolucion || row.FECH_RESOLUCION),
          fecha_terminacion: formatOracleDate(fechaTerminacionRes || row.fecha_fin || row.FECH_FIN || row.FECHA_FIN || row.FECHA_F),
          fecha_fin: formatOracleDate(fechaTerminacionRes || row.fecha_fin || row.FECH_FIN || row.FECHA_FIN || row.FECHA_F),
          regional: row.COD_REGIONAL || row.REGIONAL || row.COD_REGIO || '001',
          vigencia: (vigenciaRes !== undefined && vigenciaRes !== null) ? vigenciaRes : (row.vigencia || null)
        };
        
        return mapeada;
      } catch (mapError) {
        console.error(`Error mapeando fila ${index}:`, mapError);
        console.error('Datos de la fila:', row);
        // Retornar objeto mínimo para evitar romper el mapeo completo
        return {
          id: `error_${index}`,
          codigo_resolucion: null,
          vigencia_resolucion: null,
          numero_resolucion: '',
          fecha_inicio: null,
          fecha_terminacion: null,
          fecha_fin: null,
          estado_resolucion: 'A',
          estado_nombre: 'Activa',
          vigente: true,
          error: mapError.message
        };
      }
    });
    
    console.log(`✅ Mapeo completado: ${resoluciones.length} resoluciones procesadas`);
    
    res.json({
      data: resoluciones,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalItems: parseInt(total),
        totalPages: totalPages,
        hasNextPage: parseInt(page) < totalPages,
        hasPreviousPage: parseInt(page) > 1
      }
    });
    
    console.log('✅ Respuesta enviada exitosamente');
  } catch (error) {
    console.error('❌ ERROR en GET /api/resoluciones:', error);
    console.error('❌ Stack trace:', error.stack);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      name: error.name,
      cause: error.cause,
      errorNum: error.errorNum
    });
    
    // Cerrar conexión solo si existe y no está cerrada
    if (conn && typeof conn.close === 'function') {
      try {
        await conn.close();
        console.log('✅ Conexión cerrada en catch');
      } catch (e) {
        console.warn('⚠️ Error al cerrar conexión en catch:', e.message);
      }
    }
    
    // Preparar respuesta de error CON código siempre
    const errorResponse = {
      error: 'Error interno del servidor',
      message: error.message || 'Error al obtener resoluciones',
      code: error.code || error.errorNum || 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString()
    };
    
    // SIEMPRE incluir detalles en desarrollo (o siempre para debugging)
    errorResponse.details = error.stack || 'No stack trace available';
    errorResponse.errorDetails = {
      name: error.name || 'Unknown',
      code: error.code || 'N/A',
      errorNum: error.errorNum || 'N/A',
      errno: error.errno || 'N/A',
      sqlState: error.sqlState || 'N/A',
      message: error.message || 'No message'
    };
    
    // Solo enviar respuesta si no se ha enviado ya
    if (!res.headersSent) {
      res.status(500).json(errorResponse);
    } else {
      console.error('⚠️ Respuesta ya enviada, no se puede enviar error');
    }
  }
});

/**
 * @swagger
 * /api/resoluciones/{codigo}/{vigencia}:
 *   get:
 *     summary: Obtener una resolución por código y vigencia
 *     tags: [Resoluciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: integer
 *         description: Código de la resolución
 *       - in: path
 *         name: vigencia
 *         required: true
 *         schema:
 *           type: integer
 *         description: Año de vigencia
 *     responses:
 *       200:
 *         description: Resolución encontrada
 *       404:
 *         description: Resolución no encontrada
 */
router.get('/:codigo/:vigencia', async (req, res) => {
  let conn;
  try {
    const { codigo, vigencia } = req.params;
    conn = await getConnection();
    
    const query = `SELECT * FROM ${getTableName('SMA_RESOLUCIONES')} 
                   WHERE CODIGO_RES = :codigo AND VIGENCIA_RES = :vigencia`;
    
    const result = await conn.execute(
      buildQuery(query),
      { codigo: parseInt(codigo), vigencia: parseInt(vigencia) },
      { outFormat: OUT_FORMAT_OBJECT }
    );
    
    await conn.close();
    
    if (!result || !result.rows || result.rows.length === 0) {
      return res.status(404).json({
        error: 'No encontrado',
        message: 'Resolución no encontrada'
      });
    }
    
    const row = result.rows[0];
    const resolucion = {
      id: `${row.CODIGO_RES}_${row.VIGENCIA_RES}`,
      codigo_resolucion: row.CODIGO_RES,
      vigencia_resolucion: row.VIGENCIA_RES,
      fecha_inicio: row.FECHA_INICIO_RES ? row.FECHA_INICIO_RES.toISOString().split('T')[0] : null,
      fecha_terminacion: row.FECHA_TERMINACION_RES ? row.FECHA_TERMINACION_RES.toISOString().split('T')[0] : null,
      estado_resolucion: row.ESTADO_RES,
      estado_nombre: row.ESTADO_RES === 'A' ? 'Activa' : 'Inactiva',
      vigente: row.ESTADO_RES === 'A'
    };
    
    res.json(resolucion);
  } catch (error) {
    if (conn) await conn.close();
    console.error('Error al obtener resolución:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al obtener resolución'
    });
  }
});

/**
 * @swagger
 * /api/resoluciones/{codigo}:
 *   get:
 *     summary: Obtener una resolución por código
 *     tags: [Resoluciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: integer
 *         description: Código de la resolución
 *     responses:
 *       200:
 *         description: Resolución encontrada
 *       404:
 *         description: Resolución no encontrada
 */
router.get('/:codigo', async (req, res) => {
  let conn;
  try {
    const { codigo } = req.params;
    conn = await getConnection();

    const query = `SELECT CODIGO_RES, VIGENCIA_RES, FECHA_INICIO_RES, FECHA_TERMINACION_RES, ESTADO_RES 
                   FROM ${getTableName('SMA_RESOLUCIONES')}
                   WHERE CODIGO_RES = :codigo`;

    const result = await conn.execute(
      buildQuery(query),
      { codigo: parseInt(codigo) },
      { outFormat: OUT_FORMAT_OBJECT }
    );

    await conn.close();

    if (!result || !result.rows || result.rows.length === 0) {
      return res.status(404).json({
        error: 'No encontrado',
        message: `Resolución no encontrada con código ${codigo}`
      });
    }

    const row = result.rows[0];
    const formatDate = (value) => {
      if (!value) return null;
      if (typeof value === 'string') {
        return value.includes('T') ? value.split('T')[0] : value;
      }
      if (value instanceof Date) {
        return isNaN(value.getTime()) ? null : value.toISOString().split('T')[0];
      }
      if (value && typeof value.getTime === 'function') {
        const timestamp = value.getTime();
        if (!isNaN(timestamp)) {
          return new Date(timestamp).toISOString().split('T')[0];
        }
      }
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? null : parsed.toISOString().split('T')[0];
    };

    const codigoValor = row.CODIGO_RES ?? row.COD_RESOLUCION ?? row.NUM_RESOLUCION ?? row.NUMERO ?? parseInt(codigo, 10);
    const vigenciaValor = row.VIGENCIA_RES ?? row.VIGENCIA ?? row.ANO ?? null;
    const estadoValor = row.ESTADO_RES ?? row.VIGENTE ?? row.ESTADO ?? 'A';

    const resolucion = {
      id: `${codigoValor ?? 'sin_codigo'}_${vigenciaValor ?? 'sin_vigencia'}`,
      codigo_resolucion: codigoValor ?? null,
      vigencia_resolucion: vigenciaValor ?? null,
      numero_resolucion: codigoValor ?? null,
      fecha_inicio: formatDate(row.FECHA_INICIO_RES ?? row.FECHA_INICIO ?? row.FECHA),
      fecha_terminacion: formatDate(row.FECHA_TERMINACION_RES ?? row.FECHA_TERMINACION ?? row.FECHA_FIN),
      estado_resolucion: estadoValor,
      estado_nombre: ['A', 'S', '1', 1, true].includes(estadoValor) ? 'Activa' : 'Inactiva',
      vigente: ['A', 'S', '1', 1, true].includes(estadoValor)
    };

    res.json(resolucion);
  } catch (error) {
    if (conn) await conn.close();
    console.error('Error al obtener resolución por código:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al obtener resolución'
    });
  }
});

/**
 * @swagger
 * /api/resoluciones:
 *   post:
 *     summary: Crear una nueva resolución
 *     tags: [Resoluciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - codigo_resolucion
 *               - vigencia_resolucion
 *               - fecha_inicio_resolucion
 *               - fecha_terminacion_resolucion
 *               - estado_resolucion
 *             properties:
 *               codigo_resolucion:
 *                 type: integer
 *                 description: Código de la resolución
 *               vigencia_resolucion:
 *                 type: integer
 *                 description: Año de vigencia (2006 hasta año actual)
 *               fecha_inicio_resolucion:
 *                 type: string
 *                 format: date
 *                 description: Fecha de inicio de vigencia
 *               fecha_terminacion_resolucion:
 *                 type: string
 *                 format: date
 *                 description: Fecha de terminación de vigencia
 *               estado_resolucion:
 *                 type: string
 *                 enum: [A, I]
 *                 description: Estado (A=Activa, I=Inactiva)
 *     responses:
 *       201:
 *         description: Resolución creada exitosamente
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: Ya existe una resolución con ese código y vigencia
 *       500:
 *         description: Error del servidor
 */
router.post('/', async (req, res) => {
  let conn;
  try {
    const {
      codigo_resolucion,
      vigencia_resolucion,
      fecha_inicio_resolucion,
      fecha_terminacion_resolucion,
      estado_resolucion
    } = req.body;

    // Validaciones
    if (!codigo_resolucion || !vigencia_resolucion || !fecha_inicio_resolucion || !fecha_terminacion_resolucion || !estado_resolucion) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Todos los campos son obligatorios: codigo_resolucion, vigencia_resolucion, fecha_inicio_resolucion, fecha_terminacion_resolucion, estado_resolucion'
      });
    }

    if (!['A', 'I'].includes(estado_resolucion)) {
      return res.status(400).json({
        error: 'Estado inválido',
        message: 'El estado debe ser "A" (Activa) o "I" (Inactiva)'
      });
    }

    // Validar vigencia (2006 hasta año actual)
    const añoActual = new Date().getFullYear();
    if (vigencia_resolucion < 2006 || vigencia_resolucion > añoActual) {
      return res.status(400).json({
        error: 'Vigencia inválida',
        message: `La vigencia debe estar entre 2006 y ${añoActual}`
      });
    }

    conn = await getConnection();

    // Verificar si ya existe una resolución con el mismo código y vigencia
    const checkQuery = `SELECT COUNT(*) as TOTAL FROM ${getTableName('SMA_RESOLUCIONES')} 
                        WHERE CODIGO_RES = :codigo AND VIGENCIA_RES = :vigencia`;
    const checkResult = await conn.execute(
      buildQuery(checkQuery),
      { codigo: codigo_resolucion, vigencia: vigencia_resolucion },
      { outFormat: OUT_FORMAT_OBJECT }
    );

    if (checkResult.rows && checkResult.rows[0] && checkResult.rows[0].TOTAL > 0) {
      await conn.close();
      return res.status(409).json({
        error: 'Resolución duplicada',
        message: 'Ya existe una resolución con el mismo código y vigencia'
      });
    }

    // Insertar nueva resolución
    const insertQuery = `INSERT INTO ${getTableName('SMA_RESOLUCIONES')} 
                        (CODIGO_RES, VIGENCIA_RES, FECHA_INICIO_RES, FECHA_TERMINACION_RES, ESTADO_RES) 
                        VALUES (:codigo, :vigencia, TO_DATE(:fecha_inicio, 'YYYY-MM-DD'), TO_DATE(:fecha_terminacion, 'YYYY-MM-DD'), :estado)`;
    
    await conn.execute(
      buildQuery(insertQuery),
      {
        codigo: codigo_resolucion,
        vigencia: vigencia_resolucion,
        fecha_inicio: fecha_inicio_resolucion,
        fecha_terminacion: fecha_terminacion_resolucion,
        estado: estado_resolucion
      },
      { autoCommit: true }
    );

    await conn.close();

    // Registrar en auditoría
    if (req.user) {
      logAuditEvent({
        userId: req.user.sub || req.user.userId,
        userEmail: req.user.email || req.user.nombreUsuario,
        action: ACTION_TYPES.CREATE_RESOLUCION,
        resource: '/api/resoluciones',
        resourceId: `${codigo_resolucion}_${vigencia_resolucion}`,
        ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'] || '',
        success: true,
        details: {
          codigo_resolucion,
          vigencia_resolucion,
          fecha_inicio_resolucion,
          fecha_terminacion_resolucion,
          estado_resolucion
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Resolución creada exitosamente',
      data: {
        codigo_resolucion,
        vigencia_resolucion,
        fecha_inicio_resolucion,
        fecha_terminacion_resolucion,
        estado_resolucion
      }
    });
  } catch (error) {
    if (conn) {
      try {
        await conn.close();
      } catch (e) {
        console.warn('Error al cerrar conexión:', e.message);
      }
    }
    console.error('Error al crear resolución:', error);
    
    // Manejar error de constraint único
    if (error.code === 'ORA-00001') {
      return res.status(409).json({
        error: 'Resolución duplicada',
        message: 'Ya existe una resolución con el mismo código y vigencia'
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message || 'Error al crear resolución'
    });
  }
});

/**
 * @swagger
 * /api/resoluciones/{codigo}/{vigencia}:
 *   put:
 *     summary: Modificar una resolución existente
 *     tags: [Resoluciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: integer
 *         description: Código de la resolución
 *       - in: path
 *         name: vigencia
 *         required: true
 *         schema:
 *           type: integer
 *         description: Año de vigencia
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fecha_inicio_resolucion
 *               - fecha_terminacion_resolucion
 *               - estado_resolucion
 *             properties:
 *               fecha_inicio_resolucion:
 *                 type: string
 *                 format: date
 *               fecha_terminacion_resolucion:
 *                 type: string
 *                 format: date
 *               estado_resolucion:
 *                 type: string
 *                 enum: [A, I]
 *     responses:
 *       200:
 *         description: Resolución modificada exitosamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Resolución no encontrada
 *       500:
 *         description: Error del servidor
 */
router.put('/:codigo/:vigencia', async (req, res) => {
  let conn;
  try {
    const { codigo, vigencia } = req.params;
    const {
      fecha_inicio_resolucion,
      fecha_terminacion_resolucion,
      estado_resolucion
    } = req.body;

    // Validaciones
    if (!fecha_inicio_resolucion || !fecha_terminacion_resolucion || !estado_resolucion) {
      return res.status(400).json({
        error: 'Datos incompletos',
        message: 'Todos los campos son obligatorios: fecha_inicio_resolucion, fecha_terminacion_resolucion, estado_resolucion'
      });
    }

    if (!['A', 'I'].includes(estado_resolucion)) {
      return res.status(400).json({
        error: 'Estado inválido',
        message: 'El estado debe ser "A" (Activa) o "I" (Inactiva)'
      });
    }

    conn = await getConnection();

    // Verificar que la resolución existe
    const checkQuery = `SELECT COUNT(*) as TOTAL FROM ${getTableName('SMA_RESOLUCIONES')} 
                        WHERE CODIGO_RES = :codigo AND VIGENCIA_RES = :vigencia`;
    const checkResult = await conn.execute(
      buildQuery(checkQuery),
      { codigo: parseInt(codigo), vigencia: parseInt(vigencia) },
      { outFormat: OUT_FORMAT_OBJECT }
    );

    if (!checkResult.rows || !checkResult.rows[0] || checkResult.rows[0].TOTAL === 0) {
      await conn.close();
      return res.status(404).json({
        error: 'No encontrado',
        message: 'Resolución no encontrada'
      });
    }

    // Actualizar resolución (código y vigencia no se pueden modificar)
    const updateQuery = `UPDATE ${getTableName('SMA_RESOLUCIONES')} 
                         SET FECHA_INICIO_RES = TO_DATE(:fecha_inicio, 'YYYY-MM-DD'),
                             FECHA_TERMINACION_RES = TO_DATE(:fecha_terminacion, 'YYYY-MM-DD'),
                             ESTADO_RES = :estado
                         WHERE CODIGO_RES = :codigo AND VIGENCIA_RES = :vigencia`;
    
    await conn.execute(
      buildQuery(updateQuery),
      {
        codigo: parseInt(codigo),
        vigencia: parseInt(vigencia),
        fecha_inicio: fecha_inicio_resolucion,
        fecha_terminacion: fecha_terminacion_resolucion,
        estado: estado_resolucion
      },
      { autoCommit: true }
    );

    await conn.close();

    // Registrar en auditoría
    if (req.user) {
      logAuditEvent({
        userId: req.user.sub || req.user.userId,
        userEmail: req.user.email || req.user.nombreUsuario,
        action: ACTION_TYPES.UPDATE_RESOLUCION,
        resource: '/api/resoluciones',
        resourceId: `${codigo}_${vigencia}`,
        ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'] || '',
        success: true,
        details: {
          codigo_resolucion: parseInt(codigo),
          vigencia_resolucion: parseInt(vigencia),
          fecha_inicio_resolucion,
          fecha_terminacion_resolucion,
          estado_resolucion,
          cambios: req.body
        }
      });
    }

    res.json({
      success: true,
      message: 'Resolución modificada exitosamente',
      data: {
        codigo_resolucion: parseInt(codigo),
        vigencia_resolucion: parseInt(vigencia),
        fecha_inicio_resolucion,
        fecha_terminacion_resolucion,
        estado_resolucion
      }
    });
  } catch (error) {
    if (conn) {
      try {
        await conn.close();
      } catch (e) {
        console.warn('Error al cerrar conexión:', e.message);
      }
    }
    console.error('Error al modificar resolución:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message || 'Error al modificar resolución'
    });
  }
});

/**
 * @swagger
 * /api/resoluciones/{codigo}/{vigencia}:
 *   delete:
 *     summary: Eliminar una resolución
 *     tags: [Resoluciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: integer
 *         description: Código de la resolución
 *       - in: path
 *         name: vigencia
 *         required: true
 *         schema:
 *           type: integer
 *         description: Año de vigencia
 *     responses:
 *       200:
 *         description: Resolución eliminada exitosamente
 *       404:
 *         description: Resolución no encontrada
 *       500:
 *         description: Error del servidor
 */
router.delete('/:codigo/:vigencia', async (req, res) => {
  let conn;
  try {
    const { codigo, vigencia } = req.params;

    conn = await getConnection();

    // Verificar que la resolución existe y obtener datos para auditoría
    const selectQuery = `SELECT CODIGO_RES, VIGENCIA_RES, FECHA_INICIO_RES, FECHA_TERMINACION_RES, ESTADO_RES 
                         FROM ${getTableName('SMA_RESOLUCIONES')} 
                         WHERE CODIGO_RES = :codigo AND VIGENCIA_RES = :vigencia`;
    const selectResult = await conn.execute(
      buildQuery(selectQuery),
      { codigo: parseInt(codigo), vigencia: parseInt(vigencia) },
      { outFormat: OUT_FORMAT_OBJECT }
    );

    if (!selectResult.rows || !selectResult.rows[0]) {
      await conn.close();
      return res.status(404).json({
        error: 'No encontrado',
        message: 'Resolución no encontrada'
      });
    }

    const resolucionEliminada = selectResult.rows[0];

    // Eliminar resolución (HARD DELETE - como en el módulo antiguo)
    // NOTA: El módulo antiguo hacía DELETE directo de la base de datos, no soft delete
    const deleteQuery = `DELETE FROM ${getTableName('SMA_RESOLUCIONES')} 
                        WHERE CODIGO_RES = :codigo AND VIGENCIA_RES = :vigencia`;
    
    await conn.execute(
      buildQuery(deleteQuery),
      {
        codigo: parseInt(codigo),
        vigencia: parseInt(vigencia)
      },
      { autoCommit: true }
    );

    await conn.close();

    // Registrar en auditoría
    if (req.user) {
      logAuditEvent({
        userId: req.user.sub || req.user.userId,
        userEmail: req.user.email || req.user.nombreUsuario,
        action: ACTION_TYPES.DELETE_RESOLUCION,
        resource: '/api/resoluciones',
        resourceId: `${codigo}_${vigencia}`,
        ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'] || '',
        success: true,
        details: {
          codigo_resolucion: parseInt(codigo),
          vigencia_resolucion: parseInt(vigencia),
          datos_eliminados: {
            codigo_res: resolucionEliminada.CODIGO_RES,
            vigencia_res: resolucionEliminada.VIGENCIA_RES,
            fecha_inicio_res: resolucionEliminada.FECHA_INICIO_RES,
            fecha_terminacion_res: resolucionEliminada.FECHA_TERMINACION_RES,
            estado_res: resolucionEliminada.ESTADO_RES
          }
        }
      });
    }

    res.json({
      success: true,
      message: 'Resolución eliminada exitosamente'
    });
  } catch (error) {
    if (conn) {
      try {
        await conn.close();
      } catch (e) {
        console.warn('Error al cerrar conexión:', e.message);
      }
    }
    console.error('Error al eliminar resolución:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message || 'Error al eliminar resolución'
    });
  }
});

module.exports = router;

