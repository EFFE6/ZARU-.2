-- ============================================================
-- SEGURIDAD DE TOKENS (PostgreSQL / schema medisena)
-- - Almacenamiento hash de refresh tokens
-- - Revocación de access tokens por jti
-- ============================================================

CREATE SCHEMA IF NOT EXISTS medisena;

CREATE TABLE IF NOT EXISTS medisena.auth_refresh_tokens (
  id BIGSERIAL PRIMARY KEY,
  jti VARCHAR(80) UNIQUE NOT NULL,
  token_hash CHAR(64) NOT NULL,
  user_identifier VARCHAR(255),
  user_email VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP NULL,
  revoked_reason VARCHAR(120) NULL,
  replaced_by_jti VARCHAR(80) NULL,
  ip_address VARCHAR(80) NULL,
  user_agent TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_auth_refresh_tokens_hash ON medisena.auth_refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_auth_refresh_tokens_user_identifier ON medisena.auth_refresh_tokens(user_identifier);
CREATE INDEX IF NOT EXISTS idx_auth_refresh_tokens_user_email ON medisena.auth_refresh_tokens(LOWER(user_email));
CREATE INDEX IF NOT EXISTS idx_auth_refresh_tokens_expires ON medisena.auth_refresh_tokens(expires_at);

CREATE TABLE IF NOT EXISTS medisena.auth_revoked_access_tokens (
  jti VARCHAR(80) PRIMARY KEY,
  expires_at TIMESTAMP NOT NULL,
  reason VARCHAR(120) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auth_revoked_access_tokens_expires ON medisena.auth_revoked_access_tokens(expires_at);

-- Limpieza recomendada (ejecución periódica)
-- DELETE FROM medisena.auth_refresh_tokens WHERE expires_at < CURRENT_TIMESTAMP - INTERVAL '7 days';
-- DELETE FROM medisena.auth_revoked_access_tokens WHERE expires_at < CURRENT_TIMESTAMP;

