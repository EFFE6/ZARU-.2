const { verifyAccessToken } = require('../utils/tokenManager');
const { hasPermission, getUserPermissions } = require('../utils/rbac');
const { isAccessTokenRevoked } = require('../utils/tokenStore');

/**
 * Middleware para autenticar JWT
 */
async function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      error: 'No autorizado',
      mensaje: 'Token no provisto'
    });
  }
  
  const token = authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({
      error: 'No autorizado',
      mensaje: 'Formato de token inválido'
    });
  }
  
  const decoded = verifyAccessToken(token);
  
  if (!decoded) {
    return res.status(401).json({
      error: 'No autorizado',
      mensaje: 'Token inválido o expirado'
    });
  }

  if (decoded?.jti) {
    const revoked = await isAccessTokenRevoked(decoded.jti);
    if (revoked) {
      return res.status(401).json({
        error: 'No autorizado',
        mensaje: 'Token revocado'
      });
    }
  }
  
  // Agregar datos del usuario al request
  req.user = decoded;
  next();
}

/**
 * Middleware para verificar roles
 * @param {string[]} roles - Roles permitidos
 */
function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'No autorizado',
        mensaje: 'Usuario no autenticado'
      });
    }
    
    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({
        error: 'Prohibido',
        mensaje: 'No tienes permisos para realizar esta acción'
      });
    }
    
    next();
  };
}

/**
 * Middleware para verificar permisos granulares (RBAC).
 * Requiere JWT válido. Si el token no trae permisos, resuelve desde DB/fallback.
 */
function authorizePermissions(...requiredPermissions) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'No autorizado',
        mensaje: 'Usuario no autenticado'
      });
    }

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return next();
    }

    try {
      const userPermissions = await resolveUserPermissions(req);

      const missing = requiredPermissions.filter((p) => !hasPermission(userPermissions, p));
      if (missing.length > 0) {
        return res.status(403).json({
          error: 'Prohibido',
          mensaje: 'No tienes permisos para realizar esta acción',
          missingPermissions: missing
        });
      }

      req.user.permissions = userPermissions;
      return next();
    } catch (error) {
      return res.status(500).json({
        error: 'Error de autorización',
        mensaje: 'No fue posible validar permisos'
      });
    }
  };
}

function getMethodAction(method) {
  switch (String(method || '').toUpperCase()) {
    case 'GET':
      return 'read';
    case 'POST':
      return 'create';
    case 'PUT':
    case 'PATCH':
      return 'update';
    case 'DELETE':
      return 'delete';
    default:
      return null;
  }
}

function buildCandidatePermissions(moduleName, action) {
  if (!moduleName || !action) return [];
  const candidates = [`${moduleName}.${action}`];
  if (action === 'read' || action === 'update' || action === 'delete') {
    candidates.push(`${moduleName}.${action}_own`);
  }
  return candidates;
}

async function resolveUserPermissions(req) {
  const role = req.user.rol || req.user.role || 'USER';
  let userPermissions = Array.isArray(req.user.permissions) ? req.user.permissions : [];

  if (userPermissions.length === 0) {
    userPermissions = await getUserPermissions({
      userId: req.user.sub || req.user.userId || req.user.nombreUsuario,
      email: req.user.email || req.user.nombreUsuario,
      role
    });
  }

  req.user.permissions = userPermissions;
  return userPermissions;
}

/**
 * Middleware para permisos por módulo usando método HTTP:
 * GET->read, POST->create, PUT/PATCH->update, DELETE->delete.
 * Acepta automáticamente variantes *_own para read/update/delete.
 */
function authorizeModulePermissions(moduleName) {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'No autorizado',
        mensaje: 'Usuario no autenticado'
      });
    }

    if (String(req.method).toUpperCase() === 'OPTIONS') {
      return next();
    }

    const action = getMethodAction(req.method);
    if (!action) {
      return next();
    }

    const candidatePermissions = buildCandidatePermissions(moduleName, action);
    if (candidatePermissions.length === 0) {
      return next();
    }

    try {
      const userPermissions = await resolveUserPermissions(req);
      const allowed = candidatePermissions.some((permission) => hasPermission(userPermissions, permission));

      if (!allowed) {
        return res.status(403).json({
          error: 'Prohibido',
          mensaje: 'No tienes permisos para realizar esta acción',
          requiredAnyPermission: candidatePermissions
        });
      }

      return next();
    } catch (_) {
      return res.status(500).json({
        error: 'Error de autorización',
        mensaje: 'No fue posible validar permisos'
      });
    }
  };
}

/**
 * Middleware opcional de autenticación (no bloquea si no hay token)
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    if (token) {
      const decoded = verifyAccessToken(token);
      if (decoded) {
        req.user = decoded;
      }
    }
  }
  
  next();
}

module.exports = {
  authenticateJWT,
  authorizeRoles,
  authorizePermissions,
  authorizeModulePermissions,
  optionalAuth
};

