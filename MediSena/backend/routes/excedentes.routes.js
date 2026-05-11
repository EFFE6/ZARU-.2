const express = require('express');
const { getConnection, getTableName, buildQuery, OUT_FORMAT_OBJECT } = require('../utils/db');
const router = express.Router();

/**
 * GET /api/excedentes/recibos
 * Listar todos los recibos de pago
 */
router.get('/recibos', async (req, res) => {
  try {
    const conn = await getConnection();
    const query = buildQuery(`SELECT * FROM ${getTableName('SMA_RECIBOS_PAGO')} ORDER BY FECHA_PAGO DESC`);
    const result = await conn.execute(query, {}, { outFormat: OUT_FORMAT_OBJECT });
    await conn.close();

    const items = result.rows.map(r => ({
      id: r.ID_RECIBO,
      numeroRecibo: r.NUMERO_RECIBO,
      funcionario: r.FUNCIONARIO,
      beneficiario: r.BENEFICIARIO,
      fechaPago: r.FECHA_PAGO,
      valorTotal: r.VALOR_TOTAL,
      concepto: r.CONCEPTO,
      estado: r.ESTADO,
      tipoPago: r.TIPO_PAGO,
      metodoPago: r.METODO_PAGO,
      observaciones: r.OBSERVACIONES,
      referenciaOrden: r.REFERENCIA,
      regional: r.REGIONAL
    }));

    res.json(items);
  } catch (error) {
    console.error('Error al obtener recibos:', error);
    res.status(500).json({ error: 'Error interno del servidor', message: error.message });
  }
});

/**
 * POST /api/excedentes/recibos
 * Crear un nuevo recibo de pago
 */
router.post('/recibos', async (req, res) => {
  try {
    const { funcionario, beneficiario, fechaPago, valorTotal, tipoPago, metodoPago, concepto, referenciaOrden, observaciones } = req.body;
    const conn = await getConnection();
    
    // Generar número de recibo (en un sistema real esto sería una secuencia o lógica de negocio)
    const nextValResult = await conn.execute(`SELECT nextval('medisena.sma_recibos_pago_seq') as val`);
    const nextId = nextValResult.rows[0].val;
    const numeroRecibo = `REC-${nextId.toString().padStart(6, '0')}`;

    const query = buildQuery(`
      INSERT INTO ${getTableName('SMA_RECIBOS_PAGO')} (
        ID_RECIBO, NUMERO_RECIBO, FUNCIONARIO, BENEFICIARIO, FECHA_PAGO, 
        VALOR_TOTAL, CONCEPTO, ESTADO, TIPO_PAGO, METODO_PAGO, 
        OBSERVACIONES, REFERENCIA, REGIONAL
      ) VALUES (
        :id, :num, :func, :bene, TO_DATE(:fecha, 'YYYY-MM-DD'), 
        :valor, :conc, 'PENDIENTE', :tipo, :meto, 
        :obs, :ref, '001'
      )
    `);

    await conn.execute(query, {
      id: nextId,
      num: numeroRecibo,
      func: funcionario,
      bene: beneficiario,
      fecha: fechaPago || new Date().toISOString().split('T')[0],
      valor: parseFloat(valorTotal.replace(/[^\d.-]/g, '')) || 0,
      conc: concepto,
      tipo: tipoPago,
      meto: metodoPago,
      obs: observaciones,
      ref: referenciaOrden
    });

    await conn.close();
    res.status(201).json({ id: nextId, numeroRecibo, ...req.body, estado: 'PENDIENTE' });
  } catch (error) {
    console.error('Error al crear recibo:', error);
    res.status(500).json({ error: 'Error al crear recibo', message: error.message });
  }
});

/**
 * PUT /api/excedentes/recibos/:id
 * Actualizar un recibo existente
 */
router.put('/recibos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { funcionario, beneficiario, valorTotal, tipoPago, metodoPago, concepto, referenciaOrden, observaciones, estado } = req.body;
    
    const conn = await getConnection();
    const query = buildQuery(`
      UPDATE ${getTableName('SMA_RECIBOS_PAGO')} SET
        FUNCIONARIO = :func,
        BENEFICIARIO = :bene,
        VALOR_TOTAL = :valor,
        TIPO_PAGO = :tipo,
        METODO_PAGO = :meto,
        CONCEPTO = :conc,
        REFERENCIA = :ref,
        OBSERVACIONES = :obs,
        ESTADO = :est,
        FECHA_MODIFICACION = CURRENT_TIMESTAMP
      WHERE ID_RECIBO = :id
    `);

    const result = await conn.execute(query, {
      func: funcionario,
      bene: beneficiario,
      valor: typeof valorTotal === 'string' ? parseFloat(valorTotal.replace(/[^\d.-]/g, '')) : valorTotal,
      tipo: tipoPago,
      meto: metodoPago,
      conc: concepto,
      ref: referenciaOrden,
      obs: observaciones,
      est: estado || 'PENDIENTE',
      id: id
    });

    await conn.close();
    if (result.rowsAffected === 0) {
      return res.status(404).json({ error: 'Recibo no encontrado' });
    }
    res.json({ message: 'Recibo actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar recibo:', error);
    res.status(500).json({ error: 'Error al actualizar recibo', message: error.message });
  }
});

/**
 * GET /api/excedentes/mayor-30
 * Stub para excedentes mayores a 30 días
 */
router.get('/mayor-30', async (req, res) => {
  res.json([]);
});

/**
 * GET /api/excedentes/sin-cancelar
 * Stub para excedentes sin cancelar
 */
router.get('/sin-cancelar', async (req, res) => {
  res.json([]);
});

module.exports = router;
