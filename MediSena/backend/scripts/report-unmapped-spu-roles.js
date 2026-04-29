require('dotenv').config({ path: '../.env' });
const { Client } = require('pg');

const client = new Client({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5433', 10),
  user: process.env.POSTGRES_USER || 'medisena',
  password: process.env.POSTGRES_PASSWORD || 'medisena_local',
  database: process.env.MEDISENA_DB || process.env.POSTGRES_SPU_DB || process.env.POSTGRES_DB || 'medisena'
});

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeRoleName(roleName) {
  return normalizeText(roleName).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function isActivePersonaStatus(status) {
  const s = normalizeText(status).toUpperCase();
  return s === '1' || s === 'A' || s === 'ACTIVO' || s === 'TRUE';
}

function mapSpuRoleToCanonical(roleName) {
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
  if (key.includes('MEDIC') || key.includes('DOCTOR')) return 'MEDICO';
  if (key.includes('BENEF') || key.includes('PACIENT') || key.includes('AFILI')) return 'BENEFICIARIO';
  if (
    key.includes('FUNC') ||
    key.includes('ASIST') ||
    key.includes('ANALIST') ||
    key.includes('COORD') ||
    key.includes('AUX') ||
    key.includes('GESTOR')
  ) {
    return 'FUNCIONARIO';
  }
  return null;
}

async function run() {
  await client.connect();
  try {
    const result = await client.query(`
      SELECT
        COALESCE(r.t_rolnombre, '') AS role_name,
        COALESCE(p.t_personaestado::text, '') AS persona_estado,
        NULLIF(LOWER(TRIM(COALESCE(p.t_personacorreosena, p.t_personacorreopersonal, ''))), '') AS email,
        NULLIF(TRIM(COALESCE(p.t_personadocumento, '')), '') AS documento
      FROM medisena.t_rolpersona rp
      INNER JOIN medisena.t_persona p ON p.t_personaid = rp.t_personaid
      INNER JOIN medisena.t_rol r ON r.t_rolid = rp.t_rolid
    `);

    const unmapped = new Map();
    let totalActive = 0;
    let totalMapped = 0;
    let totalUnmapped = 0;

    for (const row of result.rows || []) {
      if (!isActivePersonaStatus(row.persona_estado)) continue;
      totalActive += 1;
      const mapped = mapSpuRoleToCanonical(row.role_name);
      if (mapped) {
        totalMapped += 1;
        continue;
      }

      totalUnmapped += 1;
      const roleName = normalizeText(row.role_name) || '(SIN_NOMBRE)';
      if (!unmapped.has(roleName)) {
        unmapped.set(roleName, {
          roleName,
          total: 0,
          samples: new Set()
        });
      }
      const current = unmapped.get(roleName);
      current.total += 1;
      const identity = row.email || row.documento || '(SIN_IDENTIDAD)';
      if (current.samples.size < 5) current.samples.add(identity);
    }

    const report = Array.from(unmapped.values())
      .map((x) => ({
        roleName: x.roleName,
        total: x.total,
        sampleUsers: Array.from(x.samples)
      }))
      .sort((a, b) => b.total - a.total || a.roleName.localeCompare(b.roleName));

    console.log(JSON.stringify({
      summary: {
        totalActiveAssignments: totalActive,
        mappedAssignments: totalMapped,
        unmappedAssignments: totalUnmapped,
        unmappedRoleNames: report.length
      },
      unmappedRoles: report
    }, null, 2));
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
