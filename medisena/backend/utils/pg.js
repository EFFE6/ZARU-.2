/**
 * Adaptador PostgreSQL - Base de datos principal MediSENA
 * Traduce SQL legacy (SMA.*, SYSDATE, ROWNUM) a PostgreSQL
 *
 * Conexión: MEDISENA_DB o POSTGRES_DB. Por defecto 'medisena' (base unificada).
 * Para usar la base intermedia de backup: POSTGRES_DB=medisena_backup
 */
const { Pool } = require('pg');

const DB_NAME = process.env.MEDISENA_DB || process.env.POSTGRES_DB || 'medisena';

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5433,
  user: process.env.POSTGRES_USER || 'medisena',
  password: process.env.POSTGRES_PASSWORD || 'medisena_local',
  database: DB_NAME,
  max: 10,
  idleTimeoutMillis: 30000
});

const SCHEMA = 'medisena';

/**
 * Convierte SQL legacy a PostgreSQL
 */
function translateSql(sql, binds) {
  let s = sql;
  // SMA.TABLE -> medisena.table (lowercase); todo en esquema medisena
  s = s.replace(/SMA\.([A-Z_0-9]+)/gi, (_, t) => `medisena.${t.toLowerCase()}`);
  // SYSDATE -> CURRENT_TIMESTAMP
  s = s.replace(/SYSDATE/gi, 'CURRENT_TIMESTAMP');
  // TRUNC(SYSDATE - col) -> (CURRENT_DATE - col)
  s = s.replace(/TRUNC\s*\(\s*SYSDATE\s*-\s*([A-Z_0-9.]+)\s*\)/gi, '(CURRENT_DATE - $1)');
  // DUAL -> PostgreSQL no usa DUAL
  s = s.replace(/\s+FROM\s+DUAL\b/gi, '');
  // ROWID -> ctid (PostgreSQL row identifier)
  s = s.replace(/\bROWID\b/gi, 'ctid');
  // Paginación legacy (ROWNUM) -> LIMIT/OFFSET
  // -> SELECT * FROM (...) a LIMIT :maxRow OFFSET :minRow
  s = s.replace(
    /SELECT\s+\*\s+FROM\s*\(\s*SELECT\s+(?:a|q)\.\*,\s*ROWNUM\s+rnum\s+FROM\s*\(([\s\S]*?)\)\s*(?:a|q)\s+WHERE\s+ROWNUM\s*<=\s*:maxRow\s*\)\s*WHERE\s+rnum\s*>\s*:minRow/gi,
    (_, inner) => `SELECT * FROM (${inner}) a LIMIT :maxRow OFFSET :minRow`
  );
  // WHERE/AND ROWNUM <= N -> quitar y añadir LIMIT N al final
  let limitNum = null;
  s = s.replace(/\s+WHERE\s+ROWNUM\s*<=\s*(\d+)/gi, (_, n) => { limitNum = n; return ''; });
  s = s.replace(/\s+AND\s+ROWNUM\s*<=\s*(\d+)/gi, (_, n) => { limitNum = limitNum || n; return ''; });
  if (limitNum) s = s.trimEnd() + ` LIMIT ${limitNum}`;
  // Subquery: AND ROWNUM = 1 -> LIMIT 1
  s = s.replace(/\s+AND\s+ROWNUM\s*=\s*1\b/gi, ' LIMIT 1');
  // ORDER BY ROWID DESC -> ORDER BY ctid DESC
  s = s.replace(/ORDER\s+BY\s+ROWID/gi, 'ORDER BY ctid');
  // Named binds :name -> $n (después de otras sustituciones)
  const keys = binds ? Object.keys(binds) : [];
  keys.forEach((k, i) => {
    const re = new RegExp(':' + k + '\\b', 'g');
    s = s.replace(re, `$${i + 1}`);
  });
  return s;
}

/**
 * Convierte binds object a array en orden
 */
function bindsToArray(binds) {
  if (!binds || typeof binds !== 'object') return [];
  return Object.values(binds);
}

/**
 * Normaliza filas a formato con claves UPPERCASE (compatibilidad)
 */
function toUpperCaseFormat(rows) {
  if (!rows || !Array.isArray(rows)) return [];
  return rows.map(row => {
    const out = {};
    for (const [k, v] of Object.entries(row)) {
      out[k.toUpperCase()] = v;
    }
    return out;
  });
}

async function getConnection() {
  const client = await pool.connect();
  return {
    execute: async (sql, binds = {}, options = {}) => {
      const pgSql = translateSql(sql, binds);
      const values = bindsToArray(binds);
      const res = await client.query(pgSql, values);
      const rows = options.outFormat === 1 ? toUpperCaseFormat(res.rows) : res.rows;
      return { rows: rows || [], rowsAffected: res.rowCount };
    },
    commit: async () => { /* pg auto-commit por query */ },
    rollback: async () => { /* no-op para compat */ },
    close: () => client.release()
  };
}

function getTableName(tableName) {
  const t = (tableName || '').replace(/^SMA\./, '');
  return `${SCHEMA}.${t.toLowerCase()}`;
}

function buildQuery(query) {
  return query.replace(/\s+/g, ' ').trim();
}

async function executeQuery(sql, binds = [], options = {}) {
  const conn = await getConnection();
  try {
    const b = Array.isArray(binds) ? {} : binds;
    if (Array.isArray(binds)) {
      binds.forEach((v, i) => { b[i] = v; });
    }
    const result = await conn.execute(sql, b, { outFormat: 1 });
    return result;
  } finally {
    await conn.close();
  }
}

async function executeUpdate(sql, binds = []) {
  const conn = await getConnection();
  try {
    const b = Array.isArray(binds) ? {} : binds;
    const result = await conn.execute(sql, b, {});
    return result;
  } finally {
    await conn.close();
  }
}

async function executeTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const conn = {
      execute: async (sql, binds = {}, opts = {}) => {
        const pgSql = translateSql(sql, binds);
        const values = bindsToArray(binds);
        const res = await client.query(pgSql, values);
        const rows = opts.outFormat === 1 ? toUpperCaseFormat(res.rows || []) : res.rows;
        return { rows, rowsAffected: res.rowCount };
      },
      commit: async () => { await client.query('COMMIT'); },
      rollback: async () => { await client.query('ROLLBACK'); },
      close: () => {}
    };
    const result = await callback(conn);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function closePool() {
  await pool.end();
}

async function testConnection() {
  try {
    const res = await pool.query('SELECT 1 as ok');
    return res.rows.length > 0;
  } catch (e) {
    return false;
  }
}

// Formato de salida: 1 = objeto con claves UPPERCASE
const OUT_FORMAT_OBJECT = 1;

module.exports = {
  initializePool: () => pool,
  getConnection,
  getTableName,
  buildQuery,
  executeQuery,
  executeUpdate,
  executeTransaction,
  closePool,
  testConnection,
  OUT_FORMAT_OBJECT
};
