const express = require('express');
const { getConnection, executeTransaction, OUT_FORMAT_OBJECT } = require('../utils/db');
const { authorizeRoles, authorizePermissions } = require('../middlewares/auth');
const { hashPassword } = require('../utils/passwordSecurity');

const router = express.Router();

const PERMISSION_CODE_REGEX = /^[a-z0-9_]+\.[a-z0-9_]+$/;

router.use(authorizeRoles('ADMIN'));
router.use(authorizePermissions('rbac.manage'));

function normalizeBoolean(value, defaultValue = true) {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (v === 'true' || v === '1' || v === 'yes' || v === 'si') return true;
    if (v === 'false' || v === '0' || v === 'no') return false;
  }
  return defaultValue;
}

function normalizeRoleCode(code) {
  return String(code || '').trim().toUpperCase();
}

function normalizePermissionCode(code) {
  return String(code || '').trim().toLowerCase();
}

function normalizeIdentity({ userEmail, userIdentifier }) {
  const email = userEmail ? String(userEmail).trim().toLowerCase() : null;
  const identifier = userIdentifier ? String(userIdentifier).trim() : null;
  return { email, identifier };
}

router.get('/roles', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const rolesResult = await conn.execute(
      `SELECT
        r.id,
        r.code,
        r.name,
        r.description,
        r.is_active,
        r.created_at,
        r.updated_at
      FROM medisena.auth_roles r
      ORDER BY r.code`,
      {},
      { outFormat: OUT_FORMAT_OBJECT }
    );

    const rolePermissionsResult = await conn.execute(
      `SELECT
        r.code AS role_code,
        p.code AS permission_code
      FROM medisena.auth_roles r
      LEFT JOIN medisena.auth_role_permissions rp ON rp.role_id = r.id
      LEFT JOIN medisena.auth_permissions p ON p.id = rp.permission_id
      ORDER BY r.code, p.code`,
      {},
      { outFormat: OUT_FORMAT_OBJECT }
    );

    const permissionsByRole = {};
    for (const row of rolePermissionsResult.rows || []) {
      const roleCode = row.ROLE_CODE;
      const permissionCode = row.PERMISSION_CODE;
      if (!permissionsByRole[roleCode]) permissionsByRole[roleCode] = [];
      if (permissionCode) permissionsByRole[roleCode].push(permissionCode);
    }

    const data = (rolesResult.rows || []).map((row) => ({
      id: row.ID,
      code: row.CODE,
      name: row.NAME,
      description: row.DESCRIPTION,
      isActive: row.IS_ACTIVE,
      createdAt: row.CREATED_AT,
      updatedAt: row.UPDATED_AT,
      permissions: permissionsByRole[row.CODE] || []
    }));

    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'No fue posible consultar roles RBAC',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (conn) await conn.close();
  }
});

router.get('/permissions', async (req, res) => {
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT
        p.id,
        p.code,
        p.module,
        p.action,
        p.description,
        p.is_active,
        p.created_at,
        p.updated_at
      FROM medisena.auth_permissions p
      ORDER BY p.module, p.action, p.code`,
      {},
      { outFormat: OUT_FORMAT_OBJECT }
    );

    const data = (result.rows || []).map((row) => ({
      id: row.ID,
      code: row.CODE,
      module: row.MODULE,
      action: row.ACTION,
      description: row.DESCRIPTION,
      isActive: row.IS_ACTIVE,
      createdAt: row.CREATED_AT,
      updatedAt: row.UPDATED_AT
    }));

    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'No fue posible consultar permisos RBAC',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (conn) await conn.close();
  }
});

router.post('/roles', async (req, res) => {
  const code = normalizeRoleCode(req.body?.code);
  const name = String(req.body?.name || '').trim();
  const description = req.body?.description ? String(req.body.description).trim() : null;
  const isActive = normalizeBoolean(req.body?.isActive, true);

  if (!code || !name) {
    return res.status(400).json({
      success: false,
      error: 'Datos inválidos',
      mensaje: 'Los campos code y name son obligatorios'
    });
  }

  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `INSERT INTO medisena.auth_roles (code, name, description, is_active)
       VALUES (:code, :name, :description, :isActive)
       RETURNING id, code, name, description, is_active, created_at, updated_at`,
      { code, name, description, isActive },
      { outFormat: OUT_FORMAT_OBJECT }
    );

    const row = result.rows?.[0];
    return res.status(201).json({
      success: true,
      data: {
        id: row.ID,
        code: row.CODE,
        name: row.NAME,
        description: row.DESCRIPTION,
        isActive: row.IS_ACTIVE,
        createdAt: row.CREATED_AT,
        updatedAt: row.UPDATED_AT
      }
    });
  } catch (error) {
    if (error && error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'Conflicto',
        mensaje: `Ya existe un rol con código ${code}`
      });
    }
    return res.status(500).json({
      success: false,
      error: 'No fue posible crear el rol'
    });
  } finally {
    if (conn) await conn.close();
  }
});

router.put('/roles/:roleCode', async (req, res) => {
  const roleCode = normalizeRoleCode(req.params.roleCode);
  const name = String(req.body?.name || '').trim();
  const description = req.body?.description !== undefined ? String(req.body.description || '').trim() : null;
  const isActive = req.body?.isActive;

  if (!roleCode) {
    return res.status(400).json({ success: false, error: 'Código de rol inválido' });
  }

  const fields = [];
  const binds = { roleCode };

  if (name) {
    fields.push('name = :name');
    binds.name = name;
  }
  if (description !== null) {
    fields.push('description = :description');
    binds.description = description || null;
  }
  if (isActive !== undefined) {
    fields.push('is_active = :isActive');
    binds.isActive = normalizeBoolean(isActive, true);
  }
  fields.push('updated_at = CURRENT_TIMESTAMP');

  if (fields.length === 1) {
    return res.status(400).json({
      success: false,
      error: 'Sin cambios',
      mensaje: 'No se recibió ningún campo para actualizar'
    });
  }

  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `UPDATE medisena.auth_roles
       SET ${fields.join(', ')}
       WHERE code = :roleCode
       RETURNING id, code, name, description, is_active, created_at, updated_at`,
      binds,
      { outFormat: OUT_FORMAT_OBJECT }
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Rol no encontrado' });
    }

    const row = result.rows[0];
    return res.json({
      success: true,
      data: {
        id: row.ID,
        code: row.CODE,
        name: row.NAME,
        description: row.DESCRIPTION,
        isActive: row.IS_ACTIVE,
        createdAt: row.CREATED_AT,
        updatedAt: row.UPDATED_AT
      }
    });
  } catch (_) {
    return res.status(500).json({
      success: false,
      error: 'No fue posible actualizar el rol'
    });
  } finally {
    if (conn) await conn.close();
  }
});

router.post('/permissions', async (req, res) => {
  const code = normalizePermissionCode(req.body?.code);
  const moduleName = String(req.body?.module || '').trim().toLowerCase();
  const action = String(req.body?.action || '').trim().toLowerCase();
  const description = req.body?.description ? String(req.body.description).trim() : null;
  const isActive = normalizeBoolean(req.body?.isActive, true);

  if (!code || !moduleName || !action) {
    return res.status(400).json({
      success: false,
      error: 'Datos inválidos',
      mensaje: 'Los campos code, module y action son obligatorios'
    });
  }
  if (!PERMISSION_CODE_REGEX.test(code)) {
    return res.status(400).json({
      success: false,
      error: 'Código de permiso inválido',
      mensaje: 'El código debe tener formato modulo.accion'
    });
  }

  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `INSERT INTO medisena.auth_permissions (code, module, action, description, is_active)
       VALUES (:code, :moduleName, :action, :description, :isActive)
       RETURNING id, code, module, action, description, is_active, created_at, updated_at`,
      { code, moduleName, action, description, isActive },
      { outFormat: OUT_FORMAT_OBJECT }
    );

    const row = result.rows?.[0];
    return res.status(201).json({
      success: true,
      data: {
        id: row.ID,
        code: row.CODE,
        module: row.MODULE,
        action: row.ACTION,
        description: row.DESCRIPTION,
        isActive: row.IS_ACTIVE,
        createdAt: row.CREATED_AT,
        updatedAt: row.UPDATED_AT
      }
    });
  } catch (error) {
    if (error && error.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'Conflicto',
        mensaje: `Ya existe el permiso ${code}`
      });
    }
    return res.status(500).json({
      success: false,
      error: 'No fue posible crear el permiso'
    });
  } finally {
    if (conn) await conn.close();
  }
});

router.put('/permissions/:permissionCode', async (req, res) => {
  const permissionCode = normalizePermissionCode(req.params.permissionCode);
  if (!permissionCode) {
    return res.status(400).json({ success: false, error: 'Código de permiso inválido' });
  }

  const fields = [];
  const binds = { permissionCode };

  if (req.body?.module !== undefined) {
    fields.push('module = :moduleName');
    binds.moduleName = String(req.body.module || '').trim().toLowerCase();
  }
  if (req.body?.action !== undefined) {
    fields.push('action = :action');
    binds.action = String(req.body.action || '').trim().toLowerCase();
  }
  if (req.body?.description !== undefined) {
    fields.push('description = :description');
    binds.description = req.body.description ? String(req.body.description).trim() : null;
  }
  if (req.body?.isActive !== undefined) {
    fields.push('is_active = :isActive');
    binds.isActive = normalizeBoolean(req.body.isActive, true);
  }
  fields.push('updated_at = CURRENT_TIMESTAMP');

  if (fields.length === 1) {
    return res.status(400).json({
      success: false,
      error: 'Sin cambios',
      mensaje: 'No se recibió ningún campo para actualizar'
    });
  }

  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `UPDATE medisena.auth_permissions
       SET ${fields.join(', ')}
       WHERE code = :permissionCode
       RETURNING id, code, module, action, description, is_active, created_at, updated_at`,
      binds,
      { outFormat: OUT_FORMAT_OBJECT }
    );

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Permiso no encontrado' });
    }

    const row = result.rows[0];
    return res.json({
      success: true,
      data: {
        id: row.ID,
        code: row.CODE,
        module: row.MODULE,
        action: row.ACTION,
        description: row.DESCRIPTION,
        isActive: row.IS_ACTIVE,
        createdAt: row.CREATED_AT,
        updatedAt: row.UPDATED_AT
      }
    });
  } catch (_) {
    return res.status(500).json({
      success: false,
      error: 'No fue posible actualizar el permiso'
    });
  } finally {
    if (conn) await conn.close();
  }
});

router.put('/roles/:roleCode/permissions', async (req, res) => {
  const roleCode = normalizeRoleCode(req.params.roleCode);
  const permissionCodes = Array.isArray(req.body?.permissionCodes)
    ? req.body.permissionCodes.map(normalizePermissionCode).filter(Boolean)
    : [];

  if (!roleCode) {
    return res.status(400).json({ success: false, error: 'Código de rol inválido' });
  }
  if (!Array.isArray(req.body?.permissionCodes)) {
    return res.status(400).json({
      success: false,
      error: 'Datos inválidos',
      mensaje: 'permissionCodes debe ser un arreglo'
    });
  }

  try {
    const result = await executeTransaction(async (conn) => {
      const roleResult = await conn.execute(
        `SELECT id, code FROM medisena.auth_roles WHERE code = :roleCode`,
        { roleCode },
        { outFormat: OUT_FORMAT_OBJECT }
      );
      const roleRow = roleResult.rows?.[0];
      if (!roleRow) {
        return { status: 404, payload: { success: false, error: 'Rol no encontrado' } };
      }

      if (permissionCodes.length > 0) {
        const permissionsResult = await conn.execute(
          `SELECT code
           FROM medisena.auth_permissions
           WHERE code = ANY(:permissionCodes::text[])`,
          { permissionCodes },
          { outFormat: OUT_FORMAT_OBJECT }
        );
        const existingCodes = new Set((permissionsResult.rows || []).map((row) => row.CODE));
        const missingCodes = permissionCodes.filter((code) => !existingCodes.has(code));
        if (missingCodes.length > 0) {
          return {
            status: 400,
            payload: {
              success: false,
              error: 'Permisos inexistentes',
              missingPermissionCodes: missingCodes
            }
          };
        }
      }

      await conn.execute(
        `DELETE FROM medisena.auth_role_permissions WHERE role_id = :roleId`,
        { roleId: roleRow.ID },
        {}
      );

      if (permissionCodes.length > 0) {
        await conn.execute(
          `INSERT INTO medisena.auth_role_permissions (role_id, permission_id)
           SELECT :roleId, p.id
           FROM medisena.auth_permissions p
           WHERE p.code = ANY(:permissionCodes::text[])
           ON CONFLICT DO NOTHING`,
          { roleId: roleRow.ID, permissionCodes },
          {}
        );
      }

      await conn.execute(
        `UPDATE medisena.auth_roles
         SET updated_at = CURRENT_TIMESTAMP
         WHERE id = :roleId`,
        { roleId: roleRow.ID },
        {}
      );

      return {
        status: 200,
        payload: {
          success: true,
          data: {
            roleCode,
            permissionCodes
          }
        }
      };
    });

    return res.status(result.status).json(result.payload);
  } catch (_) {
    return res.status(500).json({
      success: false,
      error: 'No fue posible actualizar permisos del rol'
    });
  }
});

router.get('/user-roles', async (req, res) => {
  let conn;
  try {
    const search = String(req.query?.search || '').trim().toLowerCase();
    conn = await getConnection();
    const result = await conn.execute(
      `SELECT
        ur.id,
        ur.user_identifier,
        ur.user_email,
        ur.source_system,
        ur.is_active,
        ur.created_at,
        ur.updated_at,
        r.code AS role_code,
        r.name AS role_name
      FROM medisena.auth_user_roles ur
      INNER JOIN medisena.auth_roles r ON r.id = ur.role_id
      ORDER BY COALESCE(ur.user_email, ur.user_identifier), r.code`,
      {},
      { outFormat: OUT_FORMAT_OBJECT }
    );

    const grouped = new Map();
    for (const row of result.rows || []) {
      const email = row.USER_EMAIL || null;
      const identifier = row.USER_IDENTIFIER || null;
      const key = `${email || ''}|${identifier || ''}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          userEmail: email,
          userIdentifier: identifier,
          sourceSystem: row.SOURCE_SYSTEM,
          isActive: row.IS_ACTIVE,
          roles: []
        });
      }
      const current = grouped.get(key);
      current.isActive = current.isActive || row.IS_ACTIVE;
      current.roles.push({
        code: row.ROLE_CODE,
        name: row.ROLE_NAME,
        assignmentId: row.ID,
        isActive: row.IS_ACTIVE
      });
    }

    let data = Array.from(grouped.values());
    if (search) {
      data = data.filter((u) =>
        String(u.userEmail || '').toLowerCase().includes(search) ||
        String(u.userIdentifier || '').toLowerCase().includes(search) ||
        u.roles.some((role) => String(role.code || '').toLowerCase().includes(search))
      );
    }
    return res.json({ success: true, data });
  } catch (_) {
    return res.status(500).json({
      success: false,
      error: 'No fue posible consultar asignaciones por usuario'
    });
  } finally {
    if (conn) await conn.close();
  }
});

router.post('/user-roles/assign', async (req, res) => {
  const roleCode = normalizeRoleCode(req.body?.roleCode);
  const { email, identifier } = normalizeIdentity(req.body || {});
  const isActive = normalizeBoolean(req.body?.isActive, true);

  if (!roleCode || (!email && !identifier)) {
    return res.status(400).json({
      success: false,
      error: 'Datos inválidos',
      mensaje: 'Se requiere roleCode y userEmail o userIdentifier'
    });
  }

  try {
    const result = await executeTransaction(async (conn) => {
      const roleResult = await conn.execute(
        `SELECT id, code FROM medisena.auth_roles WHERE code = :roleCode`,
        { roleCode },
        { outFormat: OUT_FORMAT_OBJECT }
      );
      const roleRow = roleResult.rows?.[0];
      if (!roleRow) {
        return { status: 404, payload: { success: false, error: 'Rol no encontrado' } };
      }

      const existing = await conn.execute(
        `SELECT id
         FROM medisena.auth_user_roles
         WHERE role_id = :roleId
           AND (
             (:userEmail IS NOT NULL AND LOWER(user_email) = LOWER(:userEmail))
             OR (:userIdentifier IS NOT NULL AND user_identifier = :userIdentifier)
           )
         LIMIT 1`,
        { roleId: roleRow.ID, userEmail: email, userIdentifier: identifier },
        { outFormat: OUT_FORMAT_OBJECT }
      );

      if (existing.rows?.length > 0) {
        const updated = await conn.execute(
          `UPDATE medisena.auth_user_roles
           SET is_active = :isActive, updated_at = CURRENT_TIMESTAMP
           WHERE id = :id
           RETURNING id, user_identifier, user_email, role_id, source_system, is_active, updated_at`,
          { id: existing.rows[0].ID, isActive },
          { outFormat: OUT_FORMAT_OBJECT }
        );
        return { status: 200, payload: { success: true, data: updated.rows?.[0] || null } };
      }

      const created = await conn.execute(
        `INSERT INTO medisena.auth_user_roles (
          user_identifier,
          user_email,
          role_id,
          source_system,
          is_active
        ) VALUES (:userIdentifier, :userEmail, :roleId, 'admin_manual', :isActive)
        RETURNING id, user_identifier, user_email, role_id, source_system, is_active, created_at, updated_at`,
        { userIdentifier: identifier, userEmail: email, roleId: roleRow.ID, isActive },
        { outFormat: OUT_FORMAT_OBJECT }
      );
      return { status: 201, payload: { success: true, data: created.rows?.[0] || null } };
    });

    return res.status(result.status).json(result.payload);
  } catch (_) {
    return res.status(500).json({
      success: false,
      error: 'No fue posible asignar el rol al usuario'
    });
  }
});

router.post('/user-roles/unassign', async (req, res) => {
  const roleCode = normalizeRoleCode(req.body?.roleCode);
  const { email, identifier } = normalizeIdentity(req.body || {});
  if (!roleCode || (!email && !identifier)) {
    return res.status(400).json({
      success: false,
      error: 'Datos inválidos',
      mensaje: 'Se requiere roleCode y userEmail o userIdentifier'
    });
  }

  let conn;
  try {
    conn = await getConnection();
    const deleted = await conn.execute(
      `DELETE FROM medisena.auth_user_roles ur
       USING medisena.auth_roles r
       WHERE ur.role_id = r.id
         AND r.code = :roleCode
         AND (
           (:userEmail IS NOT NULL AND LOWER(ur.user_email) = LOWER(:userEmail))
           OR (:userIdentifier IS NOT NULL AND ur.user_identifier = :userIdentifier)
         )`,
      { roleCode, userEmail: email, userIdentifier: identifier },
      {}
    );
    return res.json({ success: true, deleted: deleted.rowsAffected || 0 });
  } catch (_) {
    return res.status(500).json({
      success: false,
      error: 'No fue posible desasignar el rol'
    });
  } finally {
    if (conn) await conn.close();
  }
});

router.post('/user-roles/set-active', async (req, res) => {
  const { email, identifier } = normalizeIdentity(req.body || {});
  const isActive = normalizeBoolean(req.body?.isActive, true);
  if (!email && !identifier) {
    return res.status(400).json({
      success: false,
      error: 'Datos inválidos',
      mensaje: 'Se requiere userEmail o userIdentifier'
    });
  }

  let conn;
  try {
    conn = await getConnection();
    const updated = await conn.execute(
      `UPDATE medisena.auth_user_roles
       SET is_active = :isActive, updated_at = CURRENT_TIMESTAMP
       WHERE
         (:userEmail IS NOT NULL AND LOWER(user_email) = LOWER(:userEmail))
         OR (:userIdentifier IS NOT NULL AND user_identifier = :userIdentifier)`,
      { isActive, userEmail: email, userIdentifier: identifier },
      {}
    );
    return res.json({ success: true, updated: updated.rowsAffected || 0 });
  } catch (_) {
    return res.status(500).json({
      success: false,
      error: 'No fue posible actualizar estado del usuario RBAC'
    });
  } finally {
    if (conn) await conn.close();
  }
});

router.post('/users/set-password', async (req, res) => {
  const email = String(req.body?.userEmail || '').trim().toLowerCase();
  const newPassword = String(req.body?.newPassword || '');
  if (!email || !newPassword) {
    return res.status(400).json({
      success: false,
      error: 'Datos inválidos',
      mensaje: 'Se requiere userEmail y newPassword'
    });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      error: 'Contraseña inválida',
      mensaje: 'La contraseña debe tener al menos 8 caracteres'
    });
  }

  const hashed = await hashPassword(newPassword);
  let conn;
  try {
    conn = await getConnection();
    const result = await conn.execute(
      `UPDATE SMA.SMA_USUA
       SET CLAV_USUA = :hashed
       WHERE LOWER(MAIL_USUA) = LOWER(:email)`,
      { hashed, email },
      {}
    );

    if (!result.rowsAffected) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado para actualización de contraseña'
      });
    }
    return res.json({
      success: true,
      updated: result.rowsAffected
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'No fue posible actualizar contraseña',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    if (conn) await conn.close();
  }
});

module.exports = router;
