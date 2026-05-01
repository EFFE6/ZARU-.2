/**
 * Seed de asignaciones RBAC mezclando SPU + SMA.
 * Reglas:
 * 1) Mezcla ambos orígenes.
 * 2) Si el usuario está en ambos, se elige el rol con más permisos efectivos.
 * 3) Si hay empate, gana SPU.
 */
require('dotenv').config({ path: '../.env' });
const { Client } = require('pg');

const SOURCE_TAG = 'spu_sma_merged_v1';
const APPLY_CHANGES = process.argv.includes('--apply');

const connectionConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5433', 10),
  user: process.env.POSTGRES_USER || 'medisena',
  password: process.env.POSTGRES_PASSWORD || 'medisena_local'
};

const MEDISENA_DB = process.env.MEDISENA_DB || process.env.POSTGRES_DB || 'medisena';

const medisenaClient = new Client({
  ...connectionConfig,
  database: MEDISENA_DB
});

const spuClient = new Client({
  ...connectionConfig,
  database: MEDISENA_DB
});

const smaClient = new Client({
  ...connectionConfig,
  database: MEDISENA_DB
});

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeRoleName(roleName) {
  return normalizeText(roleName).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function normalizeEmail(email) {
  return normalizeText(email).toLowerCase() || null;
}

function normalizeDocument(document) {
  return normalizeText(document) || null;
}

function isActiveStatus(status) {
  const s = normalizeText(status).toUpperCase();
  return s === '1' || s === 'A' || s === 'ACTIVO' || s === 'TRUE';
}

function mapRoleToCanonical(roleName) {
  const key = normalizeRoleName(roleName);
  if (!key) return null;

  const explicitMap = {
    AUDITOR: 'FUNCIONARIO',
    AUDITORRB: 'FUNCIONARIO',
    CONSULTA: 'FUNCIONARIO',
    LIQUIDADOR: 'FUNCIONARIO',
    RESPONSABLESMA: 'FUNCIONARIO',
    ODONTOLOGO: 'MEDICO',
    ODONTOLOGOAUDITOR: 'MEDICO',
    ODONTOLOGOAUDITORSB: 'MEDICO'
  };
  if (explicitMap[key]) return explicitMap[key];

  if (key.includes('ADMIN') || key.includes('SUPERUSER')) return 'ADMIN';
  if (key.includes('MEDIC') || key.includes('DOCTOR') || key.includes('ODONTO')) return 'MEDICO';
  if (key.includes('BENEF') || key.includes('PACIENT') || key.includes('AFILI')) return 'BENEFICIARIO';
  if (
    key.includes('FUNC') ||
    key.includes('ASIST') ||
    key.includes('ANALIST') ||
    key.includes('COORD') ||
    key.includes('AUX') ||
    key.includes('GESTOR') ||
    key.includes('LIQUID')
  ) {
    return 'FUNCIONARIO';
  }
  return null;
}

function getSharedIdentityKey({ userEmail, userIdentifier }) {
  if (userEmail) return `email:${userEmail}`;
  if (userIdentifier) return `id:${userIdentifier}`;
  return null;
}

function sourcePriority(source) {
  if (source === 'spu') return 2;
  if (source === 'sma') return 1;
  return 0;
}

async function queryExists(client, sql) {
  const result = await client.query(sql);
  return Number(result.rows?.[0]?.total || 0) > 0;
}

async function ensureSourceTables() {
  const hasSpu = await queryExists(
    medisenaClient,
    `SELECT COUNT(*)::int AS total
     FROM information_schema.tables
     WHERE table_schema = 'medisena'
       AND table_name IN ('t_persona', 't_rol', 't_rolpersona')`
  );

  const hasSma = await queryExists(
    medisenaClient,
    `SELECT COUNT(*)::int AS total
     FROM information_schema.tables
     WHERE table_schema = 'medisena'
       AND table_name = 'sma_usua'`
  );

  return { hasSpu, hasSma };
}

async function loadRoleMetadata() {
  const rolesResult = await medisenaClient.query(`
    SELECT r.id, r.code, COUNT(rp.permission_id)::int AS permission_count
    FROM medisena.auth_roles r
    LEFT JOIN medisena.auth_role_permissions rp ON rp.role_id = r.id
    WHERE r.is_active = TRUE
    GROUP BY r.id, r.code
  `);

  const roleMeta = new Map();
  for (const row of rolesResult.rows || []) {
    roleMeta.set(row.code, {
      roleId: row.id,
      permissionCount: Number(row.permission_count || 0)
    });
  }
  return roleMeta;
}

async function loadSpuCandidates(roleMeta) {
  const candidates = [];
  const result = await spuClient.query(`
    SELECT
      p.t_personaid::text AS person_id,
      NULLIF(LOWER(TRIM(COALESCE(p.t_personacorreosena, p.t_personacorreopersonal, ''))), '') AS user_email,
      NULLIF(TRIM(COALESCE(p.t_personadocumento, '')), '') AS user_document,
      COALESCE(p.t_personaestado::text, '') AS user_status,
      COALESCE(r.t_rolnombre, '') AS role_name
    FROM medisena.t_rolpersona rp
    INNER JOIN medisena.t_persona p ON p.t_personaid = rp.t_personaid
    INNER JOIN medisena.t_rol r ON r.t_rolid = rp.t_rolid
  `);

  for (const row of result.rows || []) {
    if (!isActiveStatus(row.user_status)) continue;

    const roleCode = mapRoleToCanonical(row.role_name);
    if (!roleCode || !roleMeta.has(roleCode)) continue;

    const userEmail = normalizeEmail(row.user_email);
    const userDocument = normalizeDocument(row.user_document);
    const userIdentifier = userDocument || normalizeText(row.person_id) || null;
    if (!userEmail && !userIdentifier) continue;

    candidates.push({
      source: 'spu',
      userEmail,
      userIdentifier,
      personId: normalizeText(row.person_id) || null,
      sharedIdentityKey: getSharedIdentityKey({ userEmail, userIdentifier }),
      roleCode,
      roleId: roleMeta.get(roleCode).roleId,
      permissionCount: roleMeta.get(roleCode).permissionCount
    });
  }

  return candidates;
}

async function loadSmaCandidates(roleMeta) {
  const candidates = [];
  const result = await smaClient.query(`
    SELECT
      NULLIF(LOWER(TRIM(COALESCE(MAIL_USUA, ''))), '') AS user_email,
      COALESCE(ESTADO_USUA::text, '') AS user_status,
      COALESCE(ROL_USUA, '') AS role_name
    FROM medisena.sma_usua
  `);

  for (const row of result.rows || []) {
    if (!isActiveStatus(row.user_status)) continue;

    const roleCode = mapRoleToCanonical(row.role_name);
    if (!roleCode || !roleMeta.has(roleCode)) continue;

    const userEmail = normalizeEmail(row.user_email);
    if (!userEmail) continue;

    candidates.push({
      source: 'sma',
      userEmail,
      userIdentifier: null,
      personId: null,
      sharedIdentityKey: getSharedIdentityKey({ userEmail, userIdentifier: null }),
      roleCode,
      roleId: roleMeta.get(roleCode).roleId,
      permissionCount: roleMeta.get(roleCode).permissionCount
    });
  }

  return candidates;
}

function resolveBestAssignments(candidates) {
  const sharedKeyCount = new Map();
  for (const candidate of candidates) {
    if (!candidate.sharedIdentityKey) continue;
    sharedKeyCount.set(
      candidate.sharedIdentityKey,
      (sharedKeyCount.get(candidate.sharedIdentityKey) || 0) + 1
    );
  }

  const byIdentity = new Map();

  for (const candidate of candidates) {
    const sharedKey = candidate.sharedIdentityKey;
    const isAmbiguousSharedKey = sharedKey ? (sharedKeyCount.get(sharedKey) || 0) > 1 : false;
    const identityKey = (!isAmbiguousSharedKey && sharedKey)
      ? sharedKey
      : `spu_persona:${candidate.personId || candidate.userIdentifier || candidate.userEmail || 'unknown'}`;
    const current = byIdentity.get(identityKey);
    if (!current) {
      byIdentity.set(identityKey, candidate);
      continue;
    }

    if (candidate.permissionCount > current.permissionCount) {
      byIdentity.set(identityKey, candidate);
      continue;
    }

    if (candidate.permissionCount === current.permissionCount) {
      if (sourcePriority(candidate.source) > sourcePriority(current.source)) {
        byIdentity.set(identityKey, candidate);
      }
    }
  }

  return Array.from(byIdentity.values());
}

async function run() {
  await medisenaClient.connect();
  await spuClient.connect();
  await smaClient.connect();

  try {
    const { hasSpu, hasSma } = await ensureSourceTables();
    if (!hasSpu && !hasSma) {
      console.log('No se encontraron fuentes válidas en SPU/SMA para asignación de roles.');
      return;
    }

    const roleMeta = await loadRoleMetadata();
    const spuCandidates = hasSpu ? await loadSpuCandidates(roleMeta) : [];
    const smaCandidates = hasSma ? await loadSmaCandidates(roleMeta) : [];
    const mergedCandidates = [...spuCandidates, ...smaCandidates];
    const resolved = resolveBestAssignments(mergedCandidates);

    let summaryRows = [];
    if (APPLY_CHANGES) {
      await medisenaClient.query('BEGIN');
      try {
        await medisenaClient.query(
          `DELETE FROM medisena.auth_user_roles WHERE source_system = $1`,
          [SOURCE_TAG]
        );

        for (const item of resolved) {
          await medisenaClient.query(
            `INSERT INTO medisena.auth_user_roles (
              user_identifier,
              user_email,
              role_id,
              source_system,
              is_active
            ) VALUES ($1, $2, $3, $4, TRUE)`,
            [item.userIdentifier, item.userEmail, item.roleId, SOURCE_TAG]
          );
        }

        await medisenaClient.query('COMMIT');
      } catch (error) {
        await medisenaClient.query('ROLLBACK');
        throw error;
      }

      const summary = await medisenaClient.query(
        `SELECT r.code AS role_code, COUNT(*)::int AS total
         FROM medisena.auth_user_roles ur
         INNER JOIN medisena.auth_roles r ON r.id = ur.role_id
         WHERE ur.source_system = $1
         GROUP BY r.code
         ORDER BY r.code`,
        [SOURCE_TAG]
      );
      summaryRows = summary.rows || [];
    } else {
      const previewSummary = new Map();
      for (const item of resolved) {
        previewSummary.set(item.roleCode, (previewSummary.get(item.roleCode) || 0) + 1);
      }
      summaryRows = Array.from(previewSummary.entries())
        .map(([role_code, total]) => ({ role_code, total }))
        .sort((a, b) => String(a.role_code).localeCompare(String(b.role_code)));
    }

    const bySource = resolved.reduce(
      (acc, cur) => {
        acc[cur.source] += 1;
        return acc;
      },
      { spu: 0, sma: 0 }
    );

    console.log(`Seed RBAC mezclado SPU+SMA ${APPLY_CHANGES ? 'aplicado' : 'en PREVIEW'} completado.`);
    console.log('Fuente canónica preferida en empate/conflicto: SPU.');
    console.log(`Modo de ejecución: ${APPLY_CHANGES ? 'APPLY (persistente)' : 'PREVIEW (sin escribir en DB)'}`);
    console.log('Candidatos SPU:', spuCandidates.length);
    console.log('Candidatos SMA:', smaCandidates.length);
    console.log('Asignaciones finales:', resolved.length);
    console.log('Asignaciones por origen ganador:', bySource);
    console.log('Resumen por rol:', summaryRows);
  } finally {
    await medisenaClient.end();
    await spuClient.end();
    await smaClient.end();
  }
}

run().catch((error) => {
  console.error('Error ejecutando seed-auth-user-roles:', error.message);
  process.exit(1);
});
