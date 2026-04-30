const express = require('express');
const { getConnection, getTableName, buildQuery, OUT_FORMAT_OBJECT } = require('../utils/db');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken, decodeToken } = require('../utils/tokenManager');
const { logLogin, logLogout } = require('../utils/auditLogger');
const { getUserPermissions } = require('../utils/rbac');
const { verifyAndMigrateLegacyPassword, hashPassword } = require('../utils/passwordSecurity');
const { storeRefreshToken, isRefreshTokenActive, revokeRefreshToken, revokeAllUserRefreshTokens, revokeAccessToken } = require('../utils/tokenStore');
const { authenticateJWT } = require('../middlewares/auth');
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - username o nombreUsuario
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: "Nombre de usuario (alternativo: nombreUsuario)"
 *           example: admin
 *         nombreUsuario:
 *           type: string
 *           description: "Nombre de usuario (alternativo: username)"
 *           example: admin
 *         password:
 *           type: string
 *           description: Contraseña
 *           example: password123
 *     LoginResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         token:
 *           type: string
 *           description: JWT token
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: integer
 *               example: 1
 *             username:
 *               type: string
 *               example: admin
 *             role:
 *               type: string
 *               example: admin
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: Error message
 *         message:
 *           type: string
 *           example: Detailed error description
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', async (req, res) => {
  try {
    // Aceptar tanto 'username' como 'nombreUsuario'
    const username = req.body.username || req.body.nombreUsuario;
    const password = req.body.password;
    
    // Validación básica
    if (!username || !password) {
      return res.status(400).json({
        error: 'Datos requeridos',
        mensaje: 'Usuario (username/nombreUsuario) y password son obligatorios',
        message: 'Usuario (username/nombreUsuario) y password son obligatorios'
      });
    }

    // ─── USUARIO DE DESARROLLO LOCAL ─────────────────────────────────────────
    // Solo activo fuera de producción. Permite trabajar sin acceso a la BD.
    if (process.env.NODE_ENV !== 'production') {
      const DEV_USERS = {
        'dev@medisena.local': {
          password: 'Dev12345!',
          nombre: 'Desarrollador Local',
          rol: 'ADMIN',
          estado: '1',
          tipoUsuario: 'ADMIN',
          dependencia: 'DESARROLLO',
          regional: 'LOCAL',
        }
      };
      const lowerUsername = username.toLowerCase();
      const devProfile = DEV_USERS[lowerUsername];
      if (devProfile && password === devProfile.password) {
        const devPayload = {
          sub: lowerUsername,
          nombreUsuario: lowerUsername,
          email: lowerUsername,
          rol: devProfile.rol,
          permissions: ['*'],
        };
        const accessToken = generateAccessToken(devPayload);
        const refreshToken = generateRefreshToken({ userId: lowerUsername, sub: lowerUsername });
        console.log(`[DEV] Login dev user: ${lowerUsername}`);
        return res.json({
          success: true,
          token: accessToken,
          refreshToken,
          usuario: {
            idUsuario: lowerUsername,
            nombreUsuario: lowerUsername,
            email: lowerUsername,
            nombreCompleto: devProfile.nombre,
            tipoUsuario: devProfile.tipoUsuario,
            dependencia: devProfile.dependencia,
            codDependencia: devProfile.dependencia,
            regional: devProfile.regional,
            codRegional: devProfile.regional,
            rol: devProfile.rol,
            estado: devProfile.estado,
            extension: null,
            activo: true,
            permissions: ['*'],
          }
        });
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Autenticación con PostgreSQL
    const conn = await getConnection();
    // Consulta flexible: intenta con diferentes posibles nombres de columna ID
    // Incluir todos los campos necesarios para el perfil del usuario
    let result;
    const queries = [
      buildQuery(`SELECT MAIL_USUA, CLAV_USUA, ROL_USUA, NOMB_USUA, COD_REGI_USUA, COD_DEPE_USUA, COD_TIPO_USUA, ESTADO_USUA, EXTENSION_USUA, ROWID FROM SMA.SMA_USUA WHERE LOWER(MAIL_USUA) = LOWER(:u)`),
      buildQuery(`SELECT MAIL_USUA, CLAV_USUA, ROL_USUA, NOMB_USUA, COD_REGI_USUA, COD_DEPE_USUA, COD_TIPO_USUA, ESTADO_USUA, EXTENSION_USUA, COD_USUA FROM SMA.SMA_USUA WHERE LOWER(MAIL_USUA) = LOWER(:u)`),
      buildQuery(`SELECT MAIL_USUA, CLAV_USUA, ROL_USUA, NOMB_USUA, COD_REGI_USUA, COD_DEPE_USUA, COD_TIPO_USUA, ESTADO_USUA, EXTENSION_USUA, NUM_USUA FROM SMA.SMA_USUA WHERE LOWER(MAIL_USUA) = LOWER(:u)`)
    ];
    
    let lastError;
    for (const query of queries) {
      try {
        result = await conn.execute(query, { u: username }, { outFormat: OUT_FORMAT_OBJECT });
        if (result && result.rows && result.rows.length > 0) break;
      } catch (e) {
        lastError = e;
        // Continuar con siguiente query si es error de columna
        if (e && (e.code === 'ORA-00904' || e.code === '42703')) continue; // columna inexistente
        // Si es otro error, propagarlo
        throw e;
      }
    }
    
    await conn.close();
    
    if (!result || !result.rows || result.rows.length === 0) {
      return res.status(401).json({
        error: 'Credenciales inválidas',
        mensaje: 'Usuario o contraseña incorrectos',
        message: 'Usuario o contraseña incorrectos'
      });
    }

    const dbUser = result.rows[0];
    const stored = dbUser.CLAV_USUA;
    const loginIdentifier = dbUser.MAIL_USUA;
    const passwordValidation = await verifyAndMigrateLegacyPassword({
      storedValue: stored,
      inputPassword: password,
      migratePlaintextToHash: async (newHash) => {
        const migrationConn = await getConnection();
        try {
          const updateLegacyQuery = buildQuery(
            `UPDATE ${getTableName('SMA_USUA')} SET CLAV_USUA = :passwordHash WHERE LOWER(MAIL_USUA) = LOWER(:email)`
          );
          await migrationConn.execute(updateLegacyQuery, {
            passwordHash: newHash,
            email: loginIdentifier
          });
        } finally {
          await migrationConn.close();
        }
      }
    });

    if (!passwordValidation.ok) {
      // Obtener IP y User Agent para auditoría
      const clientIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      
      // Registrar intento de login fallido en auditoría
      logLogin({ userId: username, userEmail: username, ip: clientIp, details: { success: false, reason: 'Contraseña incorrecta' } });
      
      return res.status(401).json({
        error: 'Credenciales inválidas',
        mensaje: 'Usuario o contraseña incorrectos',
        message: 'Usuario o contraseña incorrectos'
      });
    }

    // Obtener ID de cualquier campo disponible
    const userId = dbUser.COD_USUA || dbUser.NUM_USUA || dbUser.ROWID || dbUser.MAIL_USUA;

    const permissions = await getUserPermissions({
      userId,
      email: dbUser.MAIL_USUA,
      role: (dbUser.ROL_USUA || 'USER').toString().toUpperCase()
    });

    const payload = {
      sub: userId,
      nombreUsuario: dbUser.MAIL_USUA,
      email: dbUser.MAIL_USUA,
      rol: (dbUser.ROL_USUA || 'USER').toString().toUpperCase(),
      permissions
    };

    // Generar access token (15 minutos) y refresh token (7 días)
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken({ userId, sub: userId });
    const decodedRefresh = decodeToken(refreshToken);
    const refreshExpiresAt = decodedRefresh?.exp ? new Date(decodedRefresh.exp * 1000) : null;

    // Obtener IP y User Agent para auditoría
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    // Registrar login exitoso en auditoría
    logLogin({
      userId,
      userEmail: dbUser.MAIL_USUA,
      ip: clientIp,
      details: {
        success: true,
        legacyPasswordMigrated: !!passwordValidation.migrated
      }
    });

    // Persistir refresh token hasheado (si tablas auth existen)
    await storeRefreshToken({
      jti: decodedRefresh?.jti,
      refreshToken,
      userIdentifier: userId,
      userEmail: dbUser.MAIL_USUA,
      expiresAt: refreshExpiresAt,
      ipAddress: clientIp,
      userAgent
    });

    // Actualizar fecha_ultimo_acceso en sma_usua
    try {
      const updateConn = await getConnection();
      const updateQuery = buildQuery(
        `UPDATE ${getTableName('SMA_USUA')} SET FECHA_ULTIMO_ACCESO = CURRENT_TIMESTAMP WHERE LOWER(MAIL_USUA) = LOWER(:email)`
      );
      await updateConn.execute(updateQuery, { email: dbUser.MAIL_USUA }, { autoCommit: true });
      await updateConn.close();
    } catch (e) {
      // No fallar el login si la columna no existe
      console.warn('⚠️ No se pudo actualizar fecha_ultimo_acceso:', e.message);
    }

    // Obtener datos completos del usuario para la respuesta
    const usuarioResponse = {
      idUsuario: userId,
      nombreUsuario: dbUser.MAIL_USUA,
      email: dbUser.MAIL_USUA,
      rol: (dbUser.ROL_USUA || 'USER').toString().toUpperCase(),
      nombreCompleto: dbUser.NOMB_USUA || dbUser.MAIL_USUA,
      tipoUsuario: dbUser.COD_TIPO_USUA || 'USER',
      dependencia: dbUser.COD_DEPE_USUA || null,
      codDependencia: dbUser.COD_DEPE_USUA || null,
      regional: dbUser.COD_REGI_USUA || null,
      codRegional: dbUser.COD_REGI_USUA || null,
      estado: dbUser.ESTADO_USUA || '1',
      extension: dbUser.EXTENSION_USUA || null,
      activo: dbUser.ESTADO_USUA === '1' || dbUser.ESTADO_USUA === 'A',
      permissions
    };

    return res.json({
      success: true,
      token: accessToken,
      refreshToken: refreshToken,
      usuario: usuarioResponse
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al procesar la solicitud de login'
    });
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout exitoso
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
 *                   example: Sesión cerrada exitosamente
 */
router.post('/logout', async (req, res) => {
  try {
    // Obtener información del usuario para auditoría
    const token = req.headers.authorization?.replace('Bearer ', '');
    const { refreshToken, allSessions } = req.body || {};
    let userId = null;
    let userEmail = null;
    let accessJti = null;
    let accessExp = null;

    if (token) {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.decode(token);
        userId = decoded?.sub || decoded?.userId;
        userEmail = decoded?.email || decoded?.nombreUsuario;
        accessJti = decoded?.jti || null;
        accessExp = decoded?.exp ? new Date(decoded.exp * 1000) : null;
      } catch (e) {
        // Token inválido, continuar con logout
      }
    }

    // Registrar logout en auditoría
    if (userId) {
      const clientIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const userAgent = req.headers['user-agent'] || '';
      logLogout(userId, userEmail, clientIp, userAgent);
    }

    // Revocar access token (si existe jti)
    if (accessJti && accessExp) {
      await revokeAccessToken({ jti: accessJti, expiresAt: accessExp, reason: 'logout' });
    }

    // Revocar refresh token específico o todos
    if (allSessions && (userId || userEmail)) {
      await revokeAllUserRefreshTokens({
        userIdentifier: userId,
        userEmail,
        reason: 'logout_all'
      });
    } else if (refreshToken) {
      await revokeRefreshToken(refreshToken, 'logout');
    }

    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al cerrar sesión'
    });
  }
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Renovar access token usando refresh token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token válido
 *     responses:
 *       200:
 *         description: Token renovado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   description: Nuevo access token
 *                 refreshToken:
 *                   type: string
 *                   description: Nuevo refresh token
 *       401:
 *         description: Refresh token inválido o expirado
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token requerido',
        message: 'Debe proporcionar un refresh token válido'
      });
    }

    // Verificar refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({
        error: 'Refresh token inválido',
        message: 'El refresh token es inválido o ha expirado'
      });
    }

    // Verificar estado del refresh token en almacenamiento seguro
    const refreshActive = await isRefreshTokenActive(refreshToken, decoded.jti);
    if (!refreshActive) {
      return res.status(401).json({
        error: 'Refresh token inválido',
        message: 'El refresh token fue revocado o no está activo'
      });
    }

    // Obtener información del usuario desde la BD
    const conn = await getConnection();
    const queries = [
      buildQuery(`SELECT MAIL_USUA, ROL_USUA, COD_USUA FROM SMA.SMA_USUA WHERE COD_USUA = :id`),
      buildQuery(`SELECT MAIL_USUA, ROL_USUA, NUM_USUA FROM SMA.SMA_USUA WHERE NUM_USUA = :id`),
      buildQuery(`SELECT MAIL_USUA, ROL_USUA, ROWID FROM SMA.SMA_USUA WHERE ROWID = :id`)
    ];

    let result;
    for (const query of queries) {
      try {
        result = await conn.execute(query, { id: decoded.userId }, { outFormat: OUT_FORMAT_OBJECT });
        if (result && result.rows && result.rows.length > 0) break;
      } catch (e) {
        if (e && (e.code === 'ORA-00904' || e.code === '42703')) continue; // columna inexistente
      }
    }

    await conn.close();

    if (!result || !result.rows || result.rows.length === 0) {
      return res.status(401).json({
        error: 'Usuario no encontrado',
        message: 'El usuario asociado al refresh token no existe'
      });
    }

    const dbUser = result.rows[0];
    const userId = dbUser.COD_USUA || dbUser.NUM_USUA || decoded.userId;

    // Generar nuevos tokens
    const permissions = await getUserPermissions({
      userId,
      email: dbUser.MAIL_USUA,
      role: (dbUser.ROL_USUA || 'USER').toString().toUpperCase()
    });

    const payload = {
      sub: userId,
      nombreUsuario: dbUser.MAIL_USUA,
      email: dbUser.MAIL_USUA,
      rol: (dbUser.ROL_USUA || 'USER').toString().toUpperCase(),
      permissions
    };

    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken({ userId, sub: userId });
    const decodedNewRefresh = decodeToken(newRefreshToken);
    const refreshExpiresAt = decodedNewRefresh?.exp ? new Date(decodedNewRefresh.exp * 1000) : null;

    // Rotación: invalidar token usado y registrar uno nuevo
    await revokeRefreshToken(refreshToken, 'refresh_rotation', decodedNewRefresh?.jti || null);
    await storeRefreshToken({
      jti: decodedNewRefresh?.jti,
      refreshToken: newRefreshToken,
      userIdentifier: userId,
      userEmail: dbUser.MAIL_USUA,
      expiresAt: refreshExpiresAt,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'] || ''
    });

    return res.json({
      success: true,
      token: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error) {
    console.error('Error al renovar token:', error);
    return res.status(401).json({
      error: 'Refresh token inválido',
      message: error.message || 'El refresh token es inválido o ha expirado'
    });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Obtener perfil del usuario autenticado
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del usuario autenticado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 idUsuario:
 *                   type: string
 *                   example: "admin"
 *                 nombreUsuario:
 *                   type: string
 *                   example: "admin"
 *                 email:
 *                   type: string
 *                   example: "admin@sena.edu.co"
 *                 nombreCompleto:
 *                   type: string
 *                   example: "Administrador del Sistema"
 *                 tipoUsuario:
 *                   type: string
 *                   example: "ADMIN"
 *                 dependencia:
 *                   type: string
 *                   example: "BOGOTA"
 *                 rol:
 *                   type: string
 *                   example: "ADMIN"
 *                 estado:
 *                   type: string
 *                   example: "1"
 *       401:
 *         description: No autorizado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error interno del servidor
 */
// Ruta protegida: obtener perfil del usuario autenticado
router.get('/me', authenticateJWT, async (req, res) => {
  let conn;
  try {
    // Verificar que el usuario esté autenticado
    if (!req.user) {
      return res.status(401).json({
        error: 'No autorizado',
        message: 'Token no válido o expirado'
      });
    }

    const userId = req.user.sub || req.user.userId || req.user.nombreUsuario;
    const userEmail = req.user.email || req.user.nombreUsuario;

    if (!userId) {
      return res.status(401).json({
        error: 'No autorizado',
        message: 'No se pudo identificar al usuario'
      });
    }

    // Obtener datos completos del usuario desde la base de datos
    conn = await getConnection();
    // Consulta para obtener todos los datos del usuario
    const query = buildQuery(`
      SELECT 
        MAIL_USUA,
        NOMB_USUA,
        ROL_USUA,
        COD_REGI_USUA,
        COD_DEPE_USUA,
        COD_TIPO_USUA,
        ESTADO_USUA,
        EXTENSION_USUA
      FROM SMA.SMA_USUA 
      WHERE LOWER(MAIL_USUA) = LOWER(:email)
    `);
    
    const result = await conn.execute(
      query, 
      { email: userEmail }, 
      { outFormat: OUT_FORMAT_OBJECT }
    );
    
    await conn.close();

    if (!result || !result.rows || result.rows.length === 0) {
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: 'No se encontró información del usuario en la base de datos'
      });
    }

    const dbUser = result.rows[0];
    
    // Mapear datos del usuario con todos los campos necesarios
    const userProfile = {
      idUsuario: dbUser.MAIL_USUA,
      nombreUsuario: dbUser.MAIL_USUA,
      email: dbUser.MAIL_USUA,
      nombreCompleto: dbUser.NOMB_USUA || dbUser.MAIL_USUA,
      tipoUsuario: dbUser.COD_TIPO_USUA || 'USER',
      dependencia: dbUser.COD_DEPE_USUA || 'N/A',
      regional: dbUser.COD_REGI_USUA || 'N/A',
      rol: (dbUser.ROL_USUA || 'USER').toString().toUpperCase(),
      estado: dbUser.ESTADO_USUA || '1',
      extension: dbUser.EXTENSION_USUA || null,
      activo: dbUser.ESTADO_USUA === '1' || dbUser.ESTADO_USUA === 'A',
      permissions: Array.isArray(req.user?.permissions) ? req.user.permissions : await getUserPermissions({
        userId,
        email: userEmail,
        role: (dbUser.ROL_USUA || 'USER').toString().toUpperCase()
      })
    };

    res.json(userProfile);
  } catch (error) {
    if (conn) await conn.close();
    console.error('Error al obtener perfil del usuario:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al obtener los datos del perfil del usuario'
    });
  }
});

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Cambiar contraseña del usuario autenticado
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contraseña cambiada exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: Contraseña actual incorrecta
 */
router.post('/change-password', authenticateJWT, async (req, res) => {
  let conn;
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Datos requeridos',
        message: 'currentPassword y newPassword son obligatorios'
      });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({
        error: 'Contraseña débil',
        message: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
    }
    const userId = req.user?.sub || req.user?.userId;
    const userEmail = req.user?.email || req.user?.nombreUsuario;
    if (!userEmail) {
      return res.status(401).json({
        error: 'No autorizado',
        message: 'Token no válido o expirado'
      });
    }
    conn = await getConnection();
    const selectQuery = buildQuery(`SELECT MAIL_USUA, CLAV_USUA, COD_USUA, NUM_USUA FROM ${getTableName('SMA_USUA')} WHERE LOWER(MAIL_USUA) = LOWER(:email)`);
    const result = await conn.execute(selectQuery, { email: userEmail }, { outFormat: OUT_FORMAT_OBJECT });
    if (!result?.rows?.length) {
      await conn.close();
      return res.status(404).json({
        error: 'Usuario no encontrado',
        message: 'No se encontró el usuario'
      });
    }
    const dbUser = result.rows[0];
    const passwordValidation = await verifyAndMigrateLegacyPassword({
      storedValue: dbUser.CLAV_USUA,
      inputPassword: currentPassword,
      migratePlaintextToHash: async (newHash) => {
        const migrateQuery = buildQuery(`UPDATE ${getTableName('SMA_USUA')} SET CLAV_USUA = :passwordHash WHERE LOWER(MAIL_USUA) = LOWER(:email)`);
        await conn.execute(migrateQuery, { passwordHash: newHash, email: userEmail }, { outFormat: OUT_FORMAT_OBJECT });
      }
    });
    if (!passwordValidation.ok) {
      await conn.close();
      return res.status(401).json({
        error: 'Contraseña incorrecta',
        message: 'La contraseña actual no es correcta'
      });
    }
    const passwordHash = await hashPassword(newPassword);
    const updateQuery = buildQuery(`UPDATE ${getTableName('SMA_USUA')} SET CLAV_USUA = :passwordHash WHERE LOWER(MAIL_USUA) = LOWER(:email)`);
    await conn.execute(updateQuery, { passwordHash, email: userEmail }, { outFormat: OUT_FORMAT_OBJECT });
    await conn.close();
    res.json({
      success: true,
      message: 'Contraseña cambiada exitosamente'
    });
  } catch (error) {
    if (conn) await conn.close();
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al cambiar la contraseña'
    });
  }
});

/**
 * @swagger
 * /api/auth/verify:
 *   get:
 *     summary: Verificar token
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token válido
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     username:
 *                       type: string
 *                       example: admin
 *                     role:
 *                       type: string
 *                       example: admin
 *       401:
 *         description: Token inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/verify', authenticateJWT, (req, res) => {
  try {
    res.json({
      valid: true,
      user: req.user
    });
  } catch (error) {
    console.error('Error en verificación:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Error al verificar token'
    });
  }
});

module.exports = router;
