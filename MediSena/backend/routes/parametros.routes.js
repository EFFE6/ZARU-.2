const express = require('express');
const { getConnection, getTableName, buildQuery, OUT_FORMAT_OBJECT } = require('../utils/db');
const router = express.Router();

/**
 * @swagger
 * /api/parametros:
 *   get:
 *     summary: Obtener lista de parámetros con paginación
 *     tags: [Parametros]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Número de página
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: Tamaño de página
 *       - in: query
 *         name: vigencia
 *         schema:
 *           type: integer
 *         description: Filtrar por vigencia
 *       - in: query
 *         name: regional
 *         schema:
 *           type: string
 *         description: Filtrar por regional
 */
router.get('/', async (req, res) => {
  let conn;
  try {
    const { page = 1, pageSize, limit, search = '', vigencia = '', regional = '' } = req.query;
    const ps = parseInt(pageSize || limit || 10);
    const offset = (parseInt(page) - 1) * ps;
    
    conn = await getConnection();
    
    // Columnas reales de SMA_PARAMETROS (con sufijo _PAR)
    let whereConditions = ['1=1'];
    let queryParams = {};
    
    if (vigencia) {
      whereConditions.push('VIGENCIA_PAR = :vigencia');
      queryParams.vigencia = parseInt(vigencia);
    }
    if (regional) {
      whereConditions.push('REGIONAL_PAR = :regional');
      queryParams.regional = regional;
    }
    if (search) {
      whereConditions.push(`(RAZON_SOCIAL_PAR LIKE '%' || :search || '%' OR CODIGO_PAR LIKE '%' || :search || '%')`);
      queryParams.search = search;
    }
    
    const whereClause = whereConditions.join(' AND ');
    const T_PARAM = getTableName('SMA_PARAMETROS');
    const T_REGI = getTableName('SMA_REGIONALES');
    
    const selectCols = `
        p.VIGENCIA_PAR,
        p.REGIONAL_PAR,
        reg.nomb_regi as REGIONAL_NOMBRE,
        p.SMLV_PAR,
        p.RAZON_SOCIAL_PAR,
        p.JEFE_PAR,
        p.CODIGO_PAR,
        p.DIRECCION_CENTRO_PAR,
        p.PORCENTAJE_NORMAL_PAR,
        p.PORCENTAJE_ESPEC_PAR,
        p.PORCENTAJE_LEY_PAR,
        p.NRO_VISTOS_BUENOS_PAR,
        p.NRO_URGENCIAS_PAR,
        p.CARGO_FIRMA_PAR,
        p.NOTA_PIE_PAR,
        p.NOTA_AUDITOR_PAR,
        p.NOMBRE_AUDITOR_PAR,
        p.CARGO_AUDITOR_PAR,
        p.RESOLUCION_PAR,
        p.VIGENCIA_FORMULA_PAR,
        p.NIT_ADSC_FARMACIA_PAR,
        p.NIT_ADSC_REMISION_PAR,
        p.NIT_ADSC_CONTRATO_PAR,
        p.REGIONAL_ADSC_CONTRATO_PAR,
        p.COD_TRATAMIENTO_NORMAL_PAR
    `;
    
    const query = `
      SELECT * FROM (
        SELECT a.*, ROWNUM rnum FROM (
          SELECT ${selectCols}
          FROM ${T_PARAM} p
          LEFT JOIN ${T_REGI} reg ON p.REGIONAL_PAR = reg.cod_regi
          WHERE ${whereClause}
          ORDER BY p.VIGENCIA_PAR DESC, p.REGIONAL_PAR
        ) a WHERE ROWNUM <= :maxRow
      ) WHERE rnum > :minRow
    `;
    
    queryParams.maxRow = ps + offset;
    queryParams.minRow = offset;
    
    let result;
    try {
      result = await conn.execute(
        buildQuery(query),
        queryParams,
        { outFormat: OUT_FORMAT_OBJECT }
      );
    } catch (e) {
      // Fallback si sma_regionales no existe
      const queryFallback = `
        SELECT * FROM (
          SELECT a.*, ROWNUM rnum FROM (
            SELECT VIGENCIA_PAR, REGIONAL_PAR, SMLV_PAR, RAZON_SOCIAL_PAR, JEFE_PAR, CODIGO_PAR,
              DIRECCION_CENTRO_PAR, PORCENTAJE_NORMAL_PAR, PORCENTAJE_ESPEC_PAR, PORCENTAJE_LEY_PAR,
              NRO_VISTOS_BUENOS_PAR, NRO_URGENCIAS_PAR, CARGO_FIRMA_PAR, NOTA_PIE_PAR, NOTA_AUDITOR_PAR,
              NOMBRE_AUDITOR_PAR, CARGO_AUDITOR_PAR, RESOLUCION_PAR, VIGENCIA_FORMULA_PAR,
              NIT_ADSC_FARMACIA_PAR, NIT_ADSC_REMISION_PAR, NIT_ADSC_CONTRATO_PAR,
              REGIONAL_ADSC_CONTRATO_PAR, COD_TRATAMIENTO_NORMAL_PAR
            FROM ${T_PARAM}
            WHERE ${whereClause}
            ORDER BY VIGENCIA_PAR DESC, REGIONAL_PAR
          ) a WHERE ROWNUM <= :maxRow
        ) WHERE rnum > :minRow
      `;
      result = await conn.execute(buildQuery(queryFallback), queryParams, { outFormat: OUT_FORMAT_OBJECT });
    }
    
    // Contar total
    const countQuery = `SELECT COUNT(*) as TOTAL FROM ${getTableName('SMA_PARAMETROS')} WHERE ${whereClause}`;
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
    
    // Mapear resultados: regionalNombre cuando existe sma_regionales
    const parametros = (result.rows || []).map((row, index) => {
      const regCod = row.REGIONAL_PAR || '';
      const regNom = row.REGIONAL_NOMBRE || row.NOMB_REGI || regCod;
      return {
      id: `${row.VIGENCIA_PAR || 0}_${row.REGIONAL_PAR || index}`,
      vigencia: row.VIGENCIA_PAR || null,
      regional: regCod,
      regionalNombre: regNom,
      regionalCodigo: regCod,
      smlv: row.SMLV_PAR || 0,
      smlvm: row.SMLV_PAR || 0,
      razonSocial: row.RAZON_SOCIAL_PAR || '',
      jefe: row.JEFE_PAR || '',
      codigo: row.CODIGO_PAR || '',
      direccionCentro: row.DIRECCION_CENTRO_PAR || '',
      porcentajeNormal: row.PORCENTAJE_NORMAL_PAR || 0,
      porcentajeEspecial: row.PORCENTAJE_ESPEC_PAR || 0,
      porcentajeLey: row.PORCENTAJE_LEY_PAR || 0,
      nroVistosBuenos: row.NRO_VISTOS_BUENOS_PAR || 0,
      nroUrgencias: row.NRO_URGENCIAS_PAR || 0,
      cargoFirma: row.CARGO_FIRMA_PAR || '',
      notaPie: row.NOTA_PIE_PAR || '',
      notaAuditor: row.NOTA_AUDITOR_PAR || '',
      nombreAuditor: row.NOMBRE_AUDITOR_PAR || '',
      cargoAuditor: row.CARGO_AUDITOR_PAR || '',
      resolucion: row.RESOLUCION_PAR || 0,
      vigenciaFormula: row.VIGENCIA_FORMULA_PAR || '',
      nitAdscFarmacia: row.NIT_ADSC_FARMACIA_PAR || null,
      nitAdscRemision: row.NIT_ADSC_REMISION_PAR || null,
      nitAdscContrato: row.NIT_ADSC_CONTRATO_PAR || null,
      regionalAdscContrato: row.REGIONAL_ADSC_CONTRATO_PAR || '',
      codTratamientoNormal: row.COD_TRATAMIENTO_NORMAL_PAR || '0'
    };
    });
    
    const total = countResult?.rows?.[0]?.TOTAL || parametros.length;
    const totalPages = Math.ceil(total / ps);
    
    res.json({
      data: parametros,
      pagination: {
        page: parseInt(page),
        pageSize: ps,
        limit: ps,
        total: parseInt(total),
        totalItems: parseInt(total),
        totalPages: totalPages,
        hasNextPage: parseInt(page) < totalPages,
        hasPreviousPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    if (conn) await conn.close();
    console.error('❌ Error en /api/parametros:', error);
    res.status(500).json({
      message: 'Error al obtener parámetros',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/parametros/{vigencia}/{regional}:
 *   get:
 *     summary: Obtener parámetro específico por vigencia y regional
 *     tags: [Parametros]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:vigencia/:regional', async (req, res) => {
  let conn;
  try {
    const { vigencia, regional } = req.params;
    
    conn = await getConnection();
    
    const query = `
      SELECT * FROM ${getTableName('SMA_PARAMETROS')}
      WHERE VIGENCIA_PAR = :vigencia AND REGIONAL_PAR = :regional
    `;
    
    const result = await conn.execute(
      buildQuery(query),
      { vigencia: parseInt(vigencia), regional },
      { outFormat: OUT_FORMAT_OBJECT }
    );
    
    await conn.close();
    
    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({
        error: 'Parámetro no encontrado',
        message: `No se encontró parámetro para vigencia ${vigencia} y regional ${regional}`
      });
    }
    
    const row = result.rows[0];
    
    res.json({
      success: true,
      data: {
        id: `${row.VIGENCIA_PAR}_${row.REGIONAL_PAR}`,
        vigencia: row.VIGENCIA_PAR,
        regional: row.REGIONAL_PAR,
        smlv: row.SMLV_PAR,
        razonSocial: row.RAZON_SOCIAL_PAR,
        jefe: row.JEFE_PAR,
        codigo: row.CODIGO_PAR,
        direccionCentro: row.DIRECCION_CENTRO_PAR,
        porcentajeNormal: row.PORCENTAJE_NORMAL_PAR,
        porcentajeEspecial: row.PORCENTAJE_ESPEC_PAR,
        porcentajeLey: row.PORCENTAJE_LEY_PAR,
        nroVistosBuenos: row.NRO_VISTOS_BUENOS_PAR,
        nroUrgencias: row.NRO_URGENCIAS_PAR,
        cargoFirma: row.CARGO_FIRMA_PAR,
        notaPie: row.NOTA_PIE_PAR,
        notaAuditor: row.NOTA_AUDITOR_PAR,
        nombreAuditor: row.NOMBRE_AUDITOR_PAR,
        cargoAuditor: row.CARGO_AUDITOR_PAR,
        resolucion: row.RESOLUCION_PAR
      }
    });
  } catch (error) {
    if (conn) await conn.close();
    console.error('Error al obtener parámetro:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/parametros/{vigencia}/{regional}:
 *   put:
 *     summary: Actualizar parámetros de una vigencia/regional
 *     tags: [Parametros]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:vigencia/:regional', async (req, res) => {
  let conn;
  try {
    const { vigencia, regional } = req.params;
    const {
      smlv, razonSocial, jefe, codigo, direccionCentro,
      porcentajeNormal, porcentajeEspecial, porcentajeLey,
      nroVistosBuenos, nroUrgencias, cargoFirma,
      notaPie, notaAuditor, nombreAuditor, cargoAuditor
    } = req.body;
    
    conn = await getConnection();
    
    const updates = [];
    const params = { vigencia: parseInt(vigencia), regional };
    
    if (smlv !== undefined) { updates.push('SMLV_PAR = :smlv'); params.smlv = smlv; }
    if (razonSocial !== undefined) { updates.push('RAZON_SOCIAL_PAR = :razonSocial'); params.razonSocial = razonSocial; }
    if (jefe !== undefined) { updates.push('JEFE_PAR = :jefe'); params.jefe = jefe; }
    if (codigo !== undefined) { updates.push('CODIGO_PAR = :codigo'); params.codigo = codigo; }
    if (direccionCentro !== undefined) { updates.push('DIRECCION_CENTRO_PAR = :direccionCentro'); params.direccionCentro = direccionCentro; }
    if (porcentajeNormal !== undefined) { updates.push('PORCENTAJE_NORMAL_PAR = :porcentajeNormal'); params.porcentajeNormal = porcentajeNormal; }
    if (porcentajeEspecial !== undefined) { updates.push('PORCENTAJE_ESPEC_PAR = :porcentajeEspecial'); params.porcentajeEspecial = porcentajeEspecial; }
    if (porcentajeLey !== undefined) { updates.push('PORCENTAJE_LEY_PAR = :porcentajeLey'); params.porcentajeLey = porcentajeLey; }
    if (nroVistosBuenos !== undefined) { updates.push('NRO_VISTOS_BUENOS_PAR = :nroVistosBuenos'); params.nroVistosBuenos = nroVistosBuenos; }
    if (nroUrgencias !== undefined) { updates.push('NRO_URGENCIAS_PAR = :nroUrgencias'); params.nroUrgencias = nroUrgencias; }
    if (cargoFirma !== undefined) { updates.push('CARGO_FIRMA_PAR = :cargoFirma'); params.cargoFirma = cargoFirma; }
    if (notaPie !== undefined) { updates.push('NOTA_PIE_PAR = :notaPie'); params.notaPie = notaPie; }
    if (notaAuditor !== undefined) { updates.push('NOTA_AUDITOR_PAR = :notaAuditor'); params.notaAuditor = notaAuditor; }
    if (nombreAuditor !== undefined) { updates.push('NOMBRE_AUDITOR_PAR = :nombreAuditor'); params.nombreAuditor = nombreAuditor; }
    if (cargoAuditor !== undefined) { updates.push('CARGO_AUDITOR_PAR = :cargoAuditor'); params.cargoAuditor = cargoAuditor; }
    
    if (updates.length === 0) {
      await conn.close();
      return res.status(400).json({
        error: 'No hay campos para actualizar'
      });
    }
    
    const query = `
      UPDATE ${getTableName('SMA_PARAMETROS')}
      SET ${updates.join(', ')}
      WHERE VIGENCIA_PAR = :vigencia AND REGIONAL_PAR = :regional
    `;
    
    const result = await conn.execute(buildQuery(query), params, { autoCommit: true });
    
    await conn.close();
    
    if (result.rowsAffected === 0) {
      return res.status(404).json({
        error: 'Parámetro no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Parámetro actualizado correctamente',
      rowsAffected: result.rowsAffected
    });
  } catch (error) {
    if (conn) await conn.close();
    console.error('Error al actualizar parámetro:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

module.exports = router;
