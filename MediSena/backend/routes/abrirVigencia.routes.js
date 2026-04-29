/**
 * Alias para /api/abrir-vigencia (frontend legacy)
 * Delega en la misma lógica que /api/vigencias/abrir
 *
 * @swagger
 * /api/abrir-vigencia:
 *   post:
 *     summary: Abrir nueva vigencia (alias legacy)
 *     description: Alias para el endpoint /api/vigencias/abrir. Configura y abre una nueva vigencia fiscal en el sistema con sus parámetros iniciales.
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
const express = require('express');
const router = express.Router();
const vigenciasRouter = require('./vigencias.routes');

// POST /api/abrir-vigencia -> mismo handler que POST /api/vigencias/abrir
router.post('/', (req, res, next) => {
  req.url = '/abrir';
  vigenciasRouter(req, res, next);
});

module.exports = router;
