const express = require('express');
const { getConnection, getTableName, buildQuery, OUT_FORMAT_OBJECT } = require('../utils/db');
const { authorizePermissions } = require('../middlewares/auth');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Usuario:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         cedula:
 *           type: string
 *           example: "12345678"
 *         nombre:
 *           type: string
 *           example: "Juan Pérez"
 *         email:
 *           type: string
 *           example: "juan.perez@sena.edu.co"
 *         telefono:
 *           type: string
 *           example: "3001234567"
 *         activo:
 *           type: boolean
 *           example: true
 *         fechaCreacion:
 *           type: string
 *           format: date-time
 *           example: "2024-01-01T00:00:00Z"
 */

/**
 * @swagger
 * /api/usuarios:
 *   get:
 *     summary: Obtener lista de usuarios
 *     tags: [Usuarios]
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
 *         description: Cantidad de elementos por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Término de búsqueda
 *     responses:
 *       200:
 *         description: Lista de usuarios obtenida exitosamente
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
 *                     $ref: '#/components/schemas/Usuario'
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
 *                       example: 100
 *                     totalPages:
 *                       type: integer
 *                       example: 10
 *                     hasNextPage:
 *                       type: boolean
 *                       example: true
 *                     hasPreviousPage:
 *                       type: boolean
 *                       example: false
 *       401:
 *         description: No autorizado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/', authorizePermissions('usuarios.read'), async (req, res) => {
  let conn;
  try {
    // Aceptar tanto pageSize como limit para compatibilidad con frontend
    // Ignorar _t (timestamp para evitar caché) y otros parámetros no relevantes
    const { page = 1, pageSize, limit, search = '', estado, rol, _t, ...otherParams } = req.query;
    // Usar pageSize si está presente, sino limit, sino 10 por defecto
    const actualPageSize = Math.min(parseInt(pageSize || limit || 10) || 10, 1000);
    const actualPage = parseInt(page) || 1;
    const offset = (actualPage - 1) * actualPageSize;
    
    console.log('📝 Usuarios - Parámetros recibidos:', { 
      page: actualPage, 
      pageSize: actualPageSize, 
      limit, 
      search, 
      offset,
      queryString: req.url,
      allQueryParams: req.query
    });
    
    conn = await getConnection();
    
    // Construir consulta con búsqueda opcional
    let whereClause = '';
    let queryParams = {};
    
    const conditions = [];
    if (search && String(search).trim()) {
      queryParams.search = `%${String(search).trim()}%`;
      conditions.push(`(
        LOWER(COALESCE(MAIL_USUA::text, '')) LIKE LOWER(:search)
        OR LOWER(COALESCE(NOMB_USUA, '')) LIKE LOWER(:search)
        OR LOWER(COALESCE(ROL_USUA::text, '')) LIKE LOWER(:search)
        OR LOWER(COALESCE(COD_REGI_USUA::text, '')) LIKE LOWER(:search)
      )`);
    }
    if (estado && String(estado).trim() && String(estado) !== 'TODOS') {
      queryParams.estado = String(estado).trim();
      conditions.push(`(COALESCE(ESTADO_USUA::text, '') = :estado)`);
    }
    if (rol && String(rol).trim() && String(rol) !== 'TODOS') {
      queryParams.rol = String(rol).trim().toUpperCase();
      conditions.push(`UPPER(ROL_USUA::text) = :rol`);
    }
    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ');
    }
    
    // Consulta principal - incluye todos los campos
    // NOTA: Evitamos usar ROWID en caso de que SMA_USUA sea una vista
    // Usamos paginación en memoria similar a resoluciones para evitar ORA-01446
    const queryCompleta = `
      SELECT 
        MAIL_USUA,
        NOMB_USUA,
        ROL_USUA,
        COD_REGI_USUA,
        COD_DEPE_USUA,
        COD_TIPO_USUA,
        ESTADO_USUA,
        EXTENSION_USUA,
        FECHA_ULTIMO_ACCESO,
        FECHA_CREACION,
        FECHA_MODIFICACION
      FROM ${getTableName('SMA_USUA')}
      ${whereClause}
      ORDER BY MAIL_USUA
    `;
    const querySinFechasExtra = `
      SELECT 
        MAIL_USUA,
        NOMB_USUA,
        ROL_USUA,
        COD_REGI_USUA,
        COD_DEPE_USUA,
        COD_TIPO_USUA,
        ESTADO_USUA,
        EXTENSION_USUA,
        FECHA_ULTIMO_ACCESO
      FROM ${getTableName('SMA_USUA')}
      ${whereClause}
      ORDER BY MAIL_USUA
    `;
    const queryMinima = `
      SELECT 
        MAIL_USUA,
        NOMB_USUA,
        ROL_USUA,
        COD_REGI_USUA,
        COD_DEPE_USUA,
        COD_TIPO_USUA,
        ESTADO_USUA,
        EXTENSION_USUA
      FROM ${getTableName('SMA_USUA')}
      ${whereClause}
      ORDER BY MAIL_USUA
    `;

    let result;
    try {
      result = await conn.execute(queryCompleta, queryParams, { outFormat: OUT_FORMAT_OBJECT });
    } catch (e) {
      if (e.code === '42703' || e.code === 'ORA-00904') {
        try {
          result = await conn.execute(querySinFechasExtra, queryParams, { outFormat: OUT_FORMAT_OBJECT });
        } catch (e2) {
          if (e2.code === '42703' || e2.code === 'ORA-00904') {
            console.warn('⚠️ Columna FECHA_ULTIMO_ACCESO no existe. Ejecute: backend/sql/03-add-fecha-ultimo-acceso-usuarios.sql');
            result = await conn.execute(queryMinima, queryParams, { outFormat: OUT_FORMAT_OBJECT });
          } else throw e2;
        }
      } else throw e;
    }
    
    console.log('📝 Usuarios - Ejecutando consulta completada');
    
    console.log(`📝 Usuarios - Total registros obtenidos de BD: ${result?.rows?.length || 0}`);
    
    // Aplicar paginación en memoria (similar a resoluciones)
    let usuarios = [];
    let totalRows = 0;
    
    if (result && result.rows && result.rows.length > 0) {
      const allRows = [...result.rows];
      totalRows = allRows.length;
      
      const startIndex = offset;
      const endIndex = offset + actualPageSize;
      usuarios = allRows.slice(startIndex, endIndex);
      
      console.log(`📄 Usuarios - Paginación aplicada: mostrando ${usuarios.length} de ${totalRows} registros (página ${actualPage}, tamaño ${actualPageSize})`);
    }

    // Consulta para contar total de registros (mantiene compatibilidad con pruebas unitarias)
    try {
      const countQuery = `
        SELECT COUNT(*) as TOTAL
        FROM ${getTableName('SMA_USUA')}
        ${whereClause}
      `;
      const countResult = await conn.execute(buildQuery(countQuery), queryParams, { outFormat: OUT_FORMAT_OBJECT });
      if (countResult?.rows && countResult.rows[0] && countResult.rows[0].TOTAL !== undefined) {
        totalRows = parseInt(countResult.rows[0].TOTAL);
      }
    } catch (countError) {
      console.warn('⚠️ Usuarios - Error obteniendo total de registros:', countError.code, countError.message);
      // Si falla el conteo, mantenemos el total calculado en memoria
    }
    
    await conn.close();
    
    // Mapear resultados con todos los campos
    const toIso = (v) => (v && (typeof v === 'object' && v.toISOString ? v.toISOString() : String(v))) || null;
    usuarios = usuarios.map(row => {
      const fechaAcceso = row.FECHA_ULTIMO_ACCESO ?? row.fecha_ultimo_acceso ?? null;
      const fechaCreacion = row.FECHA_CREACION ?? row.fecha_creacion ?? null;
      const fechaModificacion = row.FECHA_MODIFICACION ?? row.fecha_modificacion ?? null;
      return {
        id: row.MAIL_USUA, // Usar MAIL_USUA como ID en lugar de ROWID
        email: row.MAIL_USUA,
        nombreUsuario: row.MAIL_USUA,
        nombreCompleto: row.NOMB_USUA || row.MAIL_USUA,
        rol: (row.ROL_USUA || 'USER').toString().toUpperCase(),
        codRegional: row.COD_REGI_USUA,
        regional: row.COD_REGI_USUA || null,
        codDependencia: row.COD_DEPE_USUA,
        codTipoUsuario: row.COD_TIPO_USUA,
        estado: row.ESTADO_USUA || '1',
        extension: row.EXTENSION_USUA,
        telefono: row.EXTENSION_USUA || null,
        nombresCompletos: row.NOMB_USUA || null,
        activo: row.ESTADO_USUA === '1' || row.ESTADO_USUA === 'A',
        ultimoAcceso: toIso(fechaAcceso),
        fechaCreacion: toIso(fechaCreacion),
        fechaModificacion: toIso(fechaModificacion)
      };
    });
    
    const totalPages = Math.ceil(totalRows / actualPageSize);
    
    const response = {
      success: true,
      data: usuarios,
      pagination: {
        page: actualPage,
        pageSize: actualPageSize,
        limit: actualPageSize, // Mantener limit para compatibilidad con frontend
        totalItems: totalRows,
        total: totalRows, // Mantener total para compatibilidad con frontend
        totalPages: totalPages,
        hasNextPage: actualPage < totalPages,
        hasPreviousPage: actualPage > 1
      }
    };
    
    console.log(`✅ Usuarios - Respuesta: ${usuarios.length} usuarios, Total: ${totalRows}, Páginas: ${totalPages}`);
    
    res.json(response);
  } catch (error) {
    if (conn) await conn.close();
    console.error('❌ Error al obtener usuarios:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al obtener la lista de usuarios'
    });
  }
});

/**
 * @swagger
 * /api/usuarios/{id}:
 *   get:
 *     summary: Obtener usuario por ID
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Usuario encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Usuario'
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.get('/:id', authorizePermissions('usuarios.read'), async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    
    conn = await getConnection();
    
    // Intentar buscar por MAIL_USUA directamente (sin ROWID para evitar problemas con vistas)
    let result;
    const toIso = (v) => (v && (typeof v === 'object' && v.toISOString ? v.toISOString() : String(v))) || null;
    const queryCompletaId = buildQuery(`
      SELECT MAIL_USUA, NOMB_USUA, ROL_USUA, COD_REGI_USUA, COD_DEPE_USUA, COD_TIPO_USUA, ESTADO_USUA, EXTENSION_USUA, FECHA_ULTIMO_ACCESO, FECHA_CREACION, FECHA_MODIFICACION
      FROM ${getTableName('SMA_USUA')} WHERE LOWER(MAIL_USUA) = LOWER(:id)
    `);
    const querySinFechasExtraId = buildQuery(`
      SELECT MAIL_USUA, NOMB_USUA, ROL_USUA, COD_REGI_USUA, COD_DEPE_USUA, COD_TIPO_USUA, ESTADO_USUA, EXTENSION_USUA, FECHA_ULTIMO_ACCESO
      FROM ${getTableName('SMA_USUA')} WHERE LOWER(MAIL_USUA) = LOWER(:id)
    `);
    const queryMinimaId = buildQuery(`
      SELECT MAIL_USUA, NOMB_USUA, ROL_USUA, COD_REGI_USUA, COD_DEPE_USUA, COD_TIPO_USUA, ESTADO_USUA, EXTENSION_USUA
      FROM ${getTableName('SMA_USUA')} WHERE LOWER(MAIL_USUA) = LOWER(:id)
    `);
    try {
      result = await conn.execute(queryCompletaId, { id }, { outFormat: OUT_FORMAT_OBJECT });
    } catch (e) {
      if (e.code === '42703' || e.code === 'ORA-00904') {
        try {
          result = await conn.execute(querySinFechasExtraId, { id }, { outFormat: OUT_FORMAT_OBJECT });
        } catch (e2) {
          if (e2.code === '42703' || e2.code === 'ORA-00904') {
            result = await conn.execute(queryMinimaId, { id }, { outFormat: OUT_FORMAT_OBJECT });
          } else throw e2;
        }
      } else throw e;
    }

    await conn.close();

    if (!result || !result.rows || result.rows.length === 0) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: `No se encontró usuario con ID ${id}`
      });
    }

    const row = result.rows[0];
    const fechaAcceso = row.FECHA_ULTIMO_ACCESO ?? row.fecha_ultimo_acceso ?? null;
    const fechaCreacion = row.FECHA_CREACION ?? row.fecha_creacion ?? null;
    const fechaModificacion = row.FECHA_MODIFICACION ?? row.fecha_modificacion ?? null;
    const usuario = {
      id: row.MAIL_USUA, // Usar MAIL_USUA como ID
      email: row.MAIL_USUA,
      nombreUsuario: row.MAIL_USUA,
      nombreCompleto: row.NOMB_USUA || row.MAIL_USUA,
      rol: row.ROL_USUA || 'USER',
      codRegional: row.COD_REGI_USUA,
      codDependencia: row.COD_DEPE_USUA,
      codTipoUsuario: row.COD_TIPO_USUA,
      estado: row.ESTADO_USUA || '1',
      extension: row.EXTENSION_USUA || null,
      telefono: row.EXTENSION_USUA || null,
      activo: row.ESTADO_USUA === '1' || row.ESTADO_USUA === 'A',
      ultimoAcceso: toIso(fechaAcceso),
      fechaCreacion: toIso(fechaCreacion),
      fechaModificacion: toIso(fechaModificacion),
      regional: row.COD_REGI_USUA || null,
      nombresCompletos: row.NOMB_USUA || null
    };
    
    res.json({
      success: true,
      data: usuario
    });
  } catch (error) {
    if (conn) await conn.close();
    console.error('Error al obtener usuario:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al obtener el usuario'
    });
  }
});

/**
 * @swagger
 * /api/usuarios:
 *   post:
 *     summary: Crear nuevo usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cedula
 *               - nombre
 *               - email
 *             properties:
 *               cedula:
 *                 type: string
 *                 example: "12345678"
 *               nombre:
 *                 type: string
 *                 example: "Juan Pérez"
 *               email:
 *                 type: string
 *                 example: "juan.perez@sena.edu.co"
 *               telefono:
 *                 type: string
 *                 example: "3001234567"
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Usuario'
 *                 message:
 *                   type: string
 *                   example: "Usuario creado exitosamente"
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error interno del servidor
 */
router.post('/', authorizePermissions('usuarios.create'), async (req, res) => {
  let conn;
  try {
    const { nombreUsuario, email, password, rol } = req.body;
    
    // Validación básica
    if (!email || !password) {
      return res.status(400).json({
        error: 'Datos requeridos',
        message: 'Email y password son obligatorios'
      });
    }
    
    conn = await getConnection();
    
    // Verificar si el usuario ya existe
    const checkQuery = buildQuery(`SELECT MAIL_USUA FROM SMA.SMA_USUA WHERE LOWER(MAIL_USUA) = LOWER(:email)`);
    const checkResult = await conn.execute(checkQuery, { email }, { outFormat: OUT_FORMAT_OBJECT });
    
    if (checkResult.rows && checkResult.rows.length > 0) {
      await conn.close();
      return res.status(400).json({
        error: 'Usuario existente',
        message: 'Ya existe un usuario con este email'
      });
    }
    
    // Hash de contraseña
    const bcrypt = require('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Insertar nuevo usuario (incluye fecha_creacion y fecha_modificacion si existen)
    const insertQuery = `
      INSERT INTO ${getTableName('SMA_USUA')} (MAIL_USUA, CLAV_USUA, ROL_USUA, FECHA_CREACION, FECHA_MODIFICACION)
      VALUES (:email, :passwordHash, :rol, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;
    try {
      await conn.execute(insertQuery, {
        email,
        passwordHash,
        rol: rol || 'USER'
      });
    } catch (insErr) {
      if (insErr.code === '42703' || insErr.code === 'ORA-00904') {
        await conn.execute(buildQuery(`INSERT INTO ${getTableName('SMA_USUA')} (MAIL_USUA, CLAV_USUA, ROL_USUA) VALUES (:email, :passwordHash, :rol)`), { email, passwordHash, rol: rol || 'USER' });
      } else throw insErr;
    }
    
    await conn.commit();
    await conn.close();
    
    res.status(201).json({
      success: true,
      data: {
        email,
        nombreUsuario: email,
        rol: rol || 'USER',
        activo: true
      },
      message: 'Usuario creado exitosamente'
    });
  } catch (error) {
    if (conn) {
      await conn.rollback();
      await conn.close();
    }
    console.error('Error al crear usuario:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al crear el usuario'
    });
  }
});

/**
 * @swagger
 * /api/usuarios/{id}:
 *   put:
 *     summary: Actualizar usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cedula:
 *                 type: string
 *                 example: "12345678"
 *               nombre:
 *                 type: string
 *                 example: "Juan Pérez"
 *               email:
 *                 type: string
 *                 example: "juan.perez@sena.edu.co"
 *               telefono:
 *                 type: string
 *                 example: "3001234567"
 *               activo:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Usuario'
 *                 message:
 *                   type: string
 *                   example: "Usuario actualizado exitosamente"
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.put('/:id', authorizePermissions('usuarios.update'), async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    const { email, rol, password, nombresCompletos, nombreCompleto, regional, telefono } = req.body;
    
    conn = await getConnection();
    
    // Verificar si el usuario existe
    const checkQuery = buildQuery(`SELECT MAIL_USUA FROM SMA.SMA_USUA WHERE LOWER(MAIL_USUA) = LOWER(:id)`);
    const checkResult = await conn.execute(checkQuery, { id }, { outFormat: OUT_FORMAT_OBJECT });
    
    if (!checkResult.rows || checkResult.rows.length === 0) {
      await conn.close();
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: `No se encontró usuario con ID ${id}`
      });
    }
    
    // Construir UPDATE dinámico
    const updates = [];
    const params = { id };
    
    if (email) {
      updates.push('MAIL_USUA = :email');
      params.email = email;
    }
    
    if (rol) {
      updates.push('ROL_USUA = :rol');
      params.rol = rol;
    }
    
    const nombreCompl = nombresCompletos ?? nombreCompleto;
    if (nombreCompl !== undefined) {
      updates.push('NOMB_USUA = :nombreCompleto');
      params.nombreCompleto = nombreCompl;
    }
    
    if (regional !== undefined) {
      updates.push('COD_REGI_USUA = :regional');
      params.regional = regional;
    }
    
    if (telefono !== undefined) {
      updates.push('EXTENSION_USUA = :telefono');
      params.telefono = telefono;
    }

    updates.push('FECHA_MODIFICACION = CURRENT_TIMESTAMP');

    if (password) {
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash(password, 10);
      updates.push('CLAV_USUA = :passwordHash');
      params.passwordHash = passwordHash;
    }
    
    if (updates.length === 0) {
      await conn.close();
      return res.status(400).json({
        error: 'Sin cambios',
        message: 'No se proporcionaron datos para actualizar'
      });
    }
    
    const updateQuery = `
      UPDATE ${getTableName('SMA_USUA')} 
      SET ${updates.join(', ')}
      WHERE LOWER(MAIL_USUA) = LOWER(:id)
    `;
    
    await conn.execute(updateQuery, params);
    await conn.commit();
    
    // Obtener usuario actualizado
    const selectQuery = buildQuery(`SELECT MAIL_USUA, ROL_USUA FROM SMA.SMA_USUA WHERE LOWER(MAIL_USUA) = LOWER(:id)`);
    const result = await conn.execute(selectQuery, { id }, { outFormat: OUT_FORMAT_OBJECT });
    
    await conn.close();
    
    const row = result.rows[0];
    res.json({
      success: true,
      data: {
        id: row.MAIL_USUA,
        email: row.MAIL_USUA,
        nombreUsuario: row.MAIL_USUA,
        rol: row.ROL_USUA || 'USER',
        activo: true
      },
      message: 'Usuario actualizado exitosamente'
    });
  } catch (error) {
    if (conn) {
      await conn.rollback();
      await conn.close();
    }
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al actualizar el usuario'
    });
  }
});

/**
 * @swagger
 * /api/usuarios/{id}:
 *   delete:
 *     summary: Eliminar usuario
 *     tags: [Usuarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Usuario eliminado exitosamente
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
 *                   example: "Usuario eliminado exitosamente"
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error interno del servidor
 */
router.delete('/:id', authorizePermissions('usuarios.delete'), async (req, res) => {
  let conn;
  try {
    const { id } = req.params;
    
    conn = await getConnection();
    
    // Verificar si el usuario existe
    const checkQuery = buildQuery(`SELECT MAIL_USUA FROM SMA.SMA_USUA WHERE LOWER(MAIL_USUA) = LOWER(:id)`);
    const checkResult = await conn.execute(checkQuery, { id }, { outFormat: OUT_FORMAT_OBJECT });
    
    if (!checkResult.rows || checkResult.rows.length === 0) {
      await conn.close();
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: `No se encontró usuario con ID ${id}`
      });
    }
    
    // Eliminar usuario (soft delete recomendado, aquí hard delete)
    const deleteQuery = buildQuery(`DELETE FROM SMA.SMA_USUA WHERE LOWER(MAIL_USUA) = LOWER(:id)`);
    await conn.execute(deleteQuery, { id });
    await conn.commit();
    await conn.close();
    
    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });
  } catch (error) {
    if (conn) {
      await conn.rollback();
      await conn.close();
    }
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al eliminar el usuario'
    });
  }
});

module.exports = router;
