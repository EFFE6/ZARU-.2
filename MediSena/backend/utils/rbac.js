const { getConnection } = require('./db');

const FALLBACK_PERMISSIONS_BY_ROLE = {
  ADMIN: ['*'],
  FUNCIONARIO: [
    'usuarios.read',
    'beneficiarios.read', 'beneficiarios.create', 'beneficiarios.update',
    'funcionarios.read',
    'medicos.read',
    'ordenes.read', 'ordenes.create', 'ordenes.update',
    'agendas.read', 'agendas.create', 'agendas.update',
    'cuentas_cobro.read', 'cuentas_cobro.create', 'cuentas_cobro.update',
    'relacion_pagos.read', 'relacion_pagos.create', 'relacion_pagos.update',
    'excedentes.read',
    'reportes.read', 'reportes.export',
    'documentos_administrativos.read', 'documentos_administrativos.create', 'documentos_administrativos.update',
    'documentos_clinicos.read'
  ],
  MEDICO: [
    'beneficiarios.read',
    'medicos.read', 'medicos.update',
    'ordenes.read', 'ordenes.create', 'ordenes.update',
    'agendas.read', 'agendas.create', 'agendas.update',
    'historia_clinica.read', 'historia_clinica.create', 'historia_clinica.update', 'historia_clinica.export',
    'documentos_clinicos.read', 'documentos_clinicos.create', 'documentos_clinicos.update',
    'reportes.read', 'reportes.export'
  ],
  BENEFICIARIO: [
    'beneficiarios.read_own',
    'ordenes.read_own',
    'agendas.read_own',
    'cuentas_cobro.read_own',
    'relacion_pagos.read_own',
    'excedentes.read_own',
    'reportes.read_own',
    'notificaciones.read_own', 'notificaciones.update_own'
  ],
  USER: ['beneficiarios.read_own', 'usuarios.read', 'usuarios.create', 'usuarios.update', 'usuarios.delete']
};

function normalizeRole(role) {
  return String(role || 'USER').trim().toUpperCase();
}

function getFallbackPermissionsByRole(role) {
  const normalizedRole = normalizeRole(role);
  return FALLBACK_PERMISSIONS_BY_ROLE[normalizedRole] || FALLBACK_PERMISSIONS_BY_ROLE.USER;
}

function hasPermission(permissions, requiredPermission) {
  if (!Array.isArray(permissions) || permissions.length === 0) return false;
  if (permissions.includes('*')) return true;
  return permissions.includes(requiredPermission);
}

async function authTablesExist(conn) {
  const result = await conn.execute(
    `SELECT COUNT(*)::int AS total
     FROM information_schema.tables
     WHERE table_schema = 'medisena'
       AND table_name IN ('auth_roles', 'auth_permissions', 'auth_role_permissions', 'auth_user_roles')`,
    {},
    {}
  );
  const total = Number(result?.rows?.[0]?.total || result?.rows?.[0]?.TOTAL || 0);
  return total === 4;
}

async function getPermissionsFromDb(conn, principal) {
  const { userId, email } = principal;
  const result = await conn.execute(
    `SELECT DISTINCT p.code
     FROM medisena.auth_user_roles ur
     INNER JOIN medisena.auth_roles r ON r.id = ur.role_id AND r.is_active = TRUE
     INNER JOIN medisena.auth_role_permissions rp ON rp.role_id = r.id
     INNER JOIN medisena.auth_permissions p ON p.id = rp.permission_id AND p.is_active = TRUE
     WHERE ur.is_active = TRUE
       AND (
         (ur.user_identifier IS NOT NULL AND ur.user_identifier = :userIdentifier)
         OR (ur.user_email IS NOT NULL AND LOWER(ur.user_email) = LOWER(:userEmail))
       )`,
    {
      userIdentifier: String(userId || ''),
      userEmail: String(email || '')
    },
    {}
  );

  return (result?.rows || [])
    .map(row => row.code || row.CODE)
    .filter(Boolean);
}

async function getUserPermissions(principal) {
  const fallback = getFallbackPermissionsByRole(principal?.role);
  let conn;
  try {
    conn = await getConnection();
    const exists = await authTablesExist(conn);
    if (!exists) return fallback;

    const dbPermissions = await getPermissionsFromDb(conn, principal || {});
    if (dbPermissions.length > 0) return dbPermissions;
    return fallback;
  } catch (_) {
    return fallback;
  } finally {
    if (conn) await conn.close();
  }
}

module.exports = {
  normalizeRole,
  getFallbackPermissionsByRole,
  hasPermission,
  getUserPermissions
};

