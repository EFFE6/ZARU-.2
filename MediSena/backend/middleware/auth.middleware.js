const jwt = require('jsonwebtoken');

// Middleware de autenticación JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token de acceso requerido'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'MEDISENA_JWT_SECRET_KEY_2025', (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'Token inválido o expirado'
      });
    }

    req.user = user;
    next();
  });
};

// Middleware para verificar roles
const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      });
    }

    if (!roles.includes(req.user.tipoUsuario)) {
      return res.status(403).json({
        success: false,
        error: 'Permisos insuficientes'
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRole
};
