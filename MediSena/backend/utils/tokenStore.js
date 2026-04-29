const crypto = require('crypto');
const { getConnection } = require('./db');

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex');
}

async function authTokenTablesExist(conn) {
  const result = await conn.execute(
    `SELECT COUNT(*)::int AS total
     FROM information_schema.tables
     WHERE table_schema = 'medisena'
       AND table_name IN ('auth_refresh_tokens', 'auth_revoked_access_tokens')`,
    {},
    {}
  );
  const total = Number(result?.rows?.[0]?.total || result?.rows?.[0]?.TOTAL || 0);
  return total === 2;
}

async function withConnection(callback) {
  let conn;
  try {
    conn = await getConnection();
    const ready = await authTokenTablesExist(conn);
    if (!ready) return null;
    return await callback(conn);
  } finally {
    if (conn) await conn.close();
  }
}

async function storeRefreshToken({
  jti,
  refreshToken,
  userIdentifier,
  userEmail,
  expiresAt,
  ipAddress,
  userAgent
}) {
  return withConnection(async (conn) => {
    const query = `
      INSERT INTO medisena.auth_refresh_tokens
      (jti, token_hash, user_identifier, user_email, expires_at, ip_address, user_agent)
      VALUES (:jti, :tokenHash, :userIdentifier, :userEmail, :expiresAt, :ipAddress, :userAgent)
      ON CONFLICT (jti) DO UPDATE SET
        token_hash = EXCLUDED.token_hash,
        user_identifier = EXCLUDED.user_identifier,
        user_email = EXCLUDED.user_email,
        expires_at = EXCLUDED.expires_at,
        revoked_at = NULL,
        revoked_reason = NULL,
        replaced_by_jti = NULL,
        ip_address = EXCLUDED.ip_address,
        user_agent = EXCLUDED.user_agent
    `;
    await conn.execute(query, {
      jti: String(jti || ''),
      tokenHash: hashToken(refreshToken),
      userIdentifier: String(userIdentifier || ''),
      userEmail: String(userEmail || ''),
      expiresAt,
      ipAddress: String(ipAddress || ''),
      userAgent: String(userAgent || '')
    });
    return true;
  });
}

async function isRefreshTokenActive(refreshToken, jti) {
  const result = await withConnection(async (conn) => {
    const query = `
      SELECT 1
      FROM medisena.auth_refresh_tokens
      WHERE token_hash = :tokenHash
        AND jti = :jti
        AND revoked_at IS NULL
        AND expires_at > CURRENT_TIMESTAMP
      LIMIT 1
    `;
    const r = await conn.execute(query, {
      tokenHash: hashToken(refreshToken),
      jti: String(jti || '')
    }, {});
    return (r?.rows || []).length > 0;
  });

  // Si no existen tablas de tokens aún, no bloqueamos.
  return result == null ? true : !!result;
}

async function revokeRefreshToken(refreshToken, reason = 'logout', replacedByJti = null) {
  return withConnection(async (conn) => {
    const query = `
      UPDATE medisena.auth_refresh_tokens
      SET revoked_at = CURRENT_TIMESTAMP,
          revoked_reason = :reason,
          replaced_by_jti = :replacedByJti
      WHERE token_hash = :tokenHash
        AND revoked_at IS NULL
    `;
    await conn.execute(query, {
      tokenHash: hashToken(refreshToken),
      reason: String(reason || 'logout'),
      replacedByJti: replacedByJti ? String(replacedByJti) : null
    });
    return true;
  });
}

async function revokeAllUserRefreshTokens({ userIdentifier, userEmail, reason = 'logout_all' }) {
  return withConnection(async (conn) => {
    const query = `
      UPDATE medisena.auth_refresh_tokens
      SET revoked_at = CURRENT_TIMESTAMP,
          revoked_reason = :reason
      WHERE revoked_at IS NULL
        AND (
          (user_identifier IS NOT NULL AND user_identifier = :userIdentifier)
          OR (user_email IS NOT NULL AND LOWER(user_email) = LOWER(:userEmail))
        )
    `;
    await conn.execute(query, {
      reason: String(reason),
      userIdentifier: String(userIdentifier || ''),
      userEmail: String(userEmail || '')
    });
    return true;
  });
}

async function revokeAccessToken({ jti, expiresAt, reason = 'logout' }) {
  if (!jti || !expiresAt) return null;
  return withConnection(async (conn) => {
    const query = `
      INSERT INTO medisena.auth_revoked_access_tokens (jti, expires_at, reason)
      VALUES (:jti, :expiresAt, :reason)
      ON CONFLICT (jti) DO NOTHING
    `;
    await conn.execute(query, {
      jti: String(jti),
      expiresAt,
      reason: String(reason)
    });
    return true;
  });
}

async function isAccessTokenRevoked(jti) {
  if (!jti) return false;
  const result = await withConnection(async (conn) => {
    const query = `
      SELECT 1
      FROM medisena.auth_revoked_access_tokens
      WHERE jti = :jti
      LIMIT 1
    `;
    const r = await conn.execute(query, { jti: String(jti) }, {});
    return (r?.rows || []).length > 0;
  });
  return result == null ? false : !!result;
}

module.exports = {
  hashToken,
  storeRefreshToken,
  isRefreshTokenActive,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
  revokeAccessToken,
  isAccessTokenRevoked
};

