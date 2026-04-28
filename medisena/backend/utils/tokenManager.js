const jwt = require('jsonwebtoken');
const crypto = require('crypto');

function resolveSecret(envName) {
  const value = process.env[envName];
  if (value && String(value).trim().length >= 32) {
    return value;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(`${envName} no está configurado correctamente para producción.`);
  }

  // En desarrollo evitamos secretos hardcodeados persistentes.
  const generated = crypto.randomBytes(48).toString('hex');
  console.warn(`⚠️ ${envName} no configurado. Se usa secreto efímero solo para entorno no productivo.`);
  return generated;
}

const JWT_SECRET = resolveSecret('JWT_SECRET');
const JWT_REFRESH_SECRET = resolveSecret('JWT_REFRESH_SECRET');
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

/**
 * Genera un token de acceso JWT
 * @param {Object} payload - Datos del usuario
 */
function generateAccessToken(payload) {
  const tokenPayload = {
    ...payload,
    jti: payload?.jti || crypto.randomUUID()
  };
  return jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

/**
 * Genera un token de refresh JWT
 * @param {Object} payload - Datos del usuario
 */
function generateRefreshToken(payload) {
  const tokenPayload = {
    ...payload,
    jti: payload?.jti || crypto.randomUUID()
  };
  return jwt.sign(tokenPayload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

/**
 * Verifica un token de acceso
 * @param {string} token - Token JWT
 */
function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Verifica un token de refresh
 * @param {string} token - Token JWT
 */
function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Decodifica un token sin verificar firma
 * @param {string} token - Token JWT
 */
function decodeToken(token) {
  return jwt.decode(token);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
  JWT_SECRET,
  JWT_REFRESH_SECRET
};

