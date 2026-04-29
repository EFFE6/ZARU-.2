-- ============================================================
-- RBAC CANONICO PARA MEDISENA (PostgreSQL)
-- JWT + Roles + Permisos granulares
-- ============================================================

CREATE SCHEMA IF NOT EXISTS medisena;

CREATE TABLE IF NOT EXISTS medisena.auth_roles (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS medisena.auth_permissions (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(120) UNIQUE NOT NULL,
  module VARCHAR(80) NOT NULL,
  action VARCHAR(40) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS medisena.auth_role_permissions (
  role_id BIGINT NOT NULL REFERENCES medisena.auth_roles(id) ON DELETE CASCADE,
  permission_id BIGINT NOT NULL REFERENCES medisena.auth_permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id)
);

-- user_identifier permite mapear email/ID legacy sin romper resincronizaciones.
CREATE TABLE IF NOT EXISTS medisena.auth_user_roles (
  id BIGSERIAL PRIMARY KEY,
  user_identifier VARCHAR(255),
  user_email VARCHAR(255),
  role_id BIGINT NOT NULL REFERENCES medisena.auth_roles(id) ON DELETE RESTRICT,
  source_system VARCHAR(20) NOT NULL DEFAULT 'medisena',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auth_user_roles_identifier ON medisena.auth_user_roles(user_identifier);
CREATE INDEX IF NOT EXISTS idx_auth_user_roles_email ON medisena.auth_user_roles(LOWER(user_email));
CREATE INDEX IF NOT EXISTS idx_auth_permissions_module_action ON medisena.auth_permissions(module, action);

-- ============================================================
-- SEMILLAS BASE
-- ============================================================

INSERT INTO medisena.auth_roles (code, name, description)
VALUES
  ('ADMIN', 'Administrador', 'Acceso total del sistema'),
  ('FUNCIONARIO', 'Funcionario', 'Operación administrativa'),
  ('MEDICO', 'Médico', 'Operación clínica'),
  ('BENEFICIARIO', 'Beneficiario', 'Acceso personal')
ON CONFLICT (code) DO NOTHING;

INSERT INTO medisena.auth_permissions (code, module, action, description)
VALUES
  ('rbac.manage', 'rbac', 'manage', 'Administrar roles y permisos'),
  ('usuarios.read', 'usuarios', 'read', 'Consultar usuarios'),
  ('usuarios.create', 'usuarios', 'create', 'Crear usuarios'),
  ('usuarios.update', 'usuarios', 'update', 'Actualizar usuarios'),
  ('usuarios.delete', 'usuarios', 'delete', 'Eliminar usuarios'),
  ('beneficiarios.read', 'beneficiarios', 'read', 'Consultar beneficiarios'),
  ('beneficiarios.read_own', 'beneficiarios', 'read_own', 'Consultar información propia'),
  ('ordenes.read', 'ordenes', 'read', 'Consultar órdenes'),
  ('ordenes.create', 'ordenes', 'create', 'Crear órdenes'),
  ('ordenes.update', 'ordenes', 'update', 'Actualizar órdenes'),
  ('reportes.read', 'reportes', 'read', 'Consultar reportes'),
  ('reportes.export', 'reportes', 'export', 'Exportar reportes'),
  ('notificaciones.read_own', 'notificaciones', 'read_own', 'Consultar notificaciones propias'),
  ('notificaciones.update_own', 'notificaciones', 'update_own', 'Marcar notificaciones propias')
ON CONFLICT (code) DO NOTHING;

-- ADMIN = todos los permisos activos
INSERT INTO medisena.auth_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM medisena.auth_roles r
CROSS JOIN medisena.auth_permissions p
WHERE r.code = 'ADMIN'
  AND p.is_active = TRUE
ON CONFLICT DO NOTHING;

-- FUNCIONARIO
INSERT INTO medisena.auth_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM medisena.auth_roles r
JOIN medisena.auth_permissions p ON p.code IN (
  'usuarios.read',
  'beneficiarios.read',
  'ordenes.read',
  'ordenes.create',
  'ordenes.update',
  'reportes.read',
  'reportes.export'
)
WHERE r.code = 'FUNCIONARIO'
ON CONFLICT DO NOTHING;

-- MEDICO
INSERT INTO medisena.auth_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM medisena.auth_roles r
JOIN medisena.auth_permissions p ON p.code IN (
  'beneficiarios.read',
  'ordenes.read',
  'ordenes.create',
  'ordenes.update',
  'reportes.read',
  'reportes.export'
)
WHERE r.code = 'MEDICO'
ON CONFLICT DO NOTHING;

-- BENEFICIARIO
INSERT INTO medisena.auth_role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM medisena.auth_roles r
JOIN medisena.auth_permissions p ON p.code IN (
  'beneficiarios.read_own',
  'notificaciones.read_own',
  'notificaciones.update_own'
)
WHERE r.code = 'BENEFICIARIO'
ON CONFLICT DO NOTHING;

