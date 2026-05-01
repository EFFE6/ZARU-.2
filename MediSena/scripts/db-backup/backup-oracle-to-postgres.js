#!/usr/bin/env node
/**
 * Backup Oracle (SMA) -> PostgreSQL medisena (directo al esquema medisena)
 * - Escribe en DB medisena, esquema medisena, tablas medisena.sma_*
 * - RESYNC=1: resincroniza todas las tablas desde origen (DROP + full copy).
 * - SYNC_FALTANTES=1: solo agrega filas nuevas; no borra tablas (INSERT ... ON CONFLICT DO NOTHING).
 * Uso: npm run backup   o   RESYNC=1 npm run backup   o   SYNC_FALTANTES=1 npm run backup
 */

const path = require('path');
const root = path.join(__dirname, '../..');
['.env', 'config-puertos-libres.env'].forEach(f => {
  require('dotenv').config({ path: path.join(root, f) });
});
const oracledb = require('oracledb');
const { Client } = require('pg');
const fs = require('fs');

const { BACKUP_DIR } = require('./config');

// Origen remoto: ORACLE_PROD_* (máquina donde está Oracle SMA). Solo local: ORACLE_HOST/ORACLE_LOCAL_*
const smaHost = process.env.ORACLE_PROD_HOST || process.env.ORACLE_HOST || process.env.ORACLE_LOCAL_HOST || '';
const smaPort = process.env.ORACLE_PROD_PORT || process.env.ORACLE_PORT || process.env.ORACLE_LOCAL_PORT || '1521';
const smaService = process.env.ORACLE_PROD_SERVICE_NAME || process.env.ORACLE_SERVICE_NAME || process.env.ORACLE_LOCAL_SERVICE_NAME || '';
const smaConnectString = (smaHost && smaService)
  ? `${smaHost}:${smaPort}/${smaService}`
  : (process.env.ORACLE_CONNECT_STRING || process.env.ORACLE_PROD_CONNECT_STRING || '');

const oracleConfig = {
  user: process.env.ORACLE_USER || process.env.ORACLE_USERNAME || 'sma',
  password: process.env.ORACLE_PASS || process.env.ORACLE_PASSWORD || '',
  connectString: smaConnectString,
  poolMin: 0,
  poolMax: 1
};

const pgBaseConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5433', 10),
  user: process.env.POSTGRES_USER || 'medisena',
  password: process.env.POSTGRES_PASSWORD || 'medisena_local'
};

const PG_DATABASE = process.env.MEDISENA_DB || process.env.POSTGRES_DB || 'medisena';
const SCHEMA_ORACLE = process.env.ORACLE_SCHEMA || 'SMA';
const PG_SCHEMA = 'medisena';
const PROGRESS_FILE = path.join(BACKUP_DIR, 'backup_progress.json');
const LOG_FILE = path.join(BACKUP_DIR, 'resync_progress.log');
const BATCH_SIZE = 1000;
const INSERT_BATCH_ROWS = 100;
const MAX_RETRIES = 6;
const RETRY_DELAY_MS = 5000;
const MAX_TABLE_RETRIES = 3;
const PROTECTED_TABLE_PREFIXES = ['AUTH_', 'RBAC_'];
const IS_CONN_ERROR = /ORA-|DPI-|NJS-|connection|ECONNRESET|ETIMEDOUT|broken pipe|network|unreachable|refused/i;
const MAX_INSERT_VALUE_LENGTH = parseInt(process.env.MAX_INSERT_VALUE_LENGTH || '2097152', 10);

function logProgress(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  process.stderr.write(line + '\n');
  try {
    fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
    fs.appendFileSync(LOG_FILE, line + '\n', 'utf8');
  } catch (e) { /* ignore */ }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isConnectionError(err) {
  return err && IS_CONN_ERROR.test((err.message || '') + (err.code || ''));
}

async function retryWithBackoff(fn, label = 'op') {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_RETRIES && isConnectionError(err)) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        console.warn(`    Reintento ${attempt}/${MAX_RETRIES} en ${delay / 1000}s (${err.message})...`);
        await sleep(delay);
      } else {
        throw err;
      }
    }
  }
  throw lastErr;
}

function loadProgress() {
  if (process.env.RESET_PROGRESS === '1') {
    return { completedTables: [], tablesMeta: {}, startedAt: new Date().toISOString() };
  }
  try {
    const data = fs.readFileSync(PROGRESS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return { completedTables: [], tablesMeta: {}, startedAt: new Date().toISOString() };
  }
}

function isProtectedTable(tableName) {
  const upper = String(tableName || '').toUpperCase();
  return PROTECTED_TABLE_PREFIXES.some(prefix => upper.startsWith(prefix));
}

function saveProgress(progress) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  progress.updatedAt = new Date().toISOString();
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf8');
}

function loadSkipEmptyTables() {
  const skipPath = path.join(BACKUP_DIR, 'skip_empty_tables_sma.json');
  try {
    const data = JSON.parse(fs.readFileSync(skipPath, 'utf8'));
    return new Set((data.tables || []).map(t => String(t).toUpperCase()));
  } catch {
    return new Set();
  }
}

function oracleTypeToPg(oracleType) {
  const t = (oracleType || '').toUpperCase();
  if (t.includes('NUMBER')) return 'NUMERIC';
  if (t.includes('VARCHAR') || t.includes('CHAR')) return 'TEXT';
  if (t.includes('DATE') || t.includes('TIMESTAMP')) return 'TIMESTAMP';
  if (t.includes('CLOB')) return 'TEXT';
  if (t.includes('BLOB')) return 'BYTEA';
  if (t.includes('XMLTYPE')) return 'TEXT';
  if (t.includes('FLOAT') || t.includes('BINARY_FLOAT')) return 'REAL';
  return 'TEXT';
}

async function getOracleConnection() {
  try {
    oracledb.initOracleClient();
  } catch (e) {
    if (!e.message.includes('already been called')) { /* ignore */ }
  }
  return oracledb.getConnection(oracleConfig);
}

async function getOracleTables(conn) {
  const result = await conn.execute(
    `SELECT TABLE_NAME FROM ALL_TABLES WHERE OWNER = :owner AND TABLE_NAME LIKE 'SMA_%' ORDER BY TABLE_NAME`,
    { owner: SCHEMA_ORACLE },
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );
  return (result.rows || []).map(r => r.TABLE_NAME);
}

/** Para SYNC_FALTANTES: devuelve (childTable, parentTable) de FKs donde ambas están en tableSet. */
async function getAllFkRefs(conn, tableSet) {
  const set = new Set((tableSet || []).map(t => String(t).toUpperCase()));
  const result = await conn.execute(
    `SELECT c.TABLE_NAME AS CHILD_T, rc.TABLE_NAME AS PARENT_T
     FROM ALL_CONSTRAINTS c
     JOIN ALL_CONSTRAINTS rc ON c.R_OWNER = rc.OWNER AND c.R_CONSTRAINT_NAME = rc.CONSTRAINT_NAME
     WHERE c.OWNER = :owner AND c.CONSTRAINT_TYPE = 'R'
       AND rc.OWNER = :owner AND c.TABLE_NAME <> rc.TABLE_NAME`,
    { owner: SCHEMA_ORACLE },
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );
  const rows = result.rows || [];
  return rows
    .filter(r => set.has(String(r.CHILD_T).toUpperCase()) && set.has(String(r.PARENT_T).toUpperCase()))
    .map(r => ({ child: String(r.CHILD_T).toUpperCase(), parent: String(r.PARENT_T).toUpperCase() }));
}

/** Ordena tablas para que los padres (referenciados por FK) se procesen antes que los hijos. */
function sortTablesByFkOrder(tables, fkRefs) {
  const upper = tables.map(t => String(t).toUpperCase());
  const deps = new Map();
  upper.forEach(t => deps.set(t, new Set()));
  for (const { child, parent } of fkRefs) {
    if (child !== parent) deps.get(child)?.add(parent);
  }
  const order = [];
  const remaining = new Set(upper);
  while (remaining.size > 0) {
    const ready = [...remaining].filter(t => {
      const parentSet = deps.get(t);
      if (!parentSet || parentSet.size === 0) return true;
      return [...parentSet].every(p => order.includes(p));
    });
    if (ready.length === 0) {
      order.push(...remaining);
      break;
    }
    ready.forEach(t => { order.push(t); remaining.delete(t); });
  }
  const idx = new Map(order.map((t, i) => [t, i]));
  return [...tables].sort((a, b) => (idx.get(a.toUpperCase()) ?? 999) - (idx.get(b.toUpperCase()) ?? 999));
}

/** Devuelve el número de filas en la tabla Oracle. Si es 0, no se sincronizan datos. */
async function getTableRowCount(conn, tableName) {
  const result = await conn.execute(
    `SELECT COUNT(*) AS C FROM "${SCHEMA_ORACLE}"."${tableName}"`,
    [],
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );
  const row = (result.rows && result.rows[0]) ? result.rows[0] : { C: 0 };
  return parseInt(row.C, 10) || 0;
}

async function getTableColumns(conn, tableName) {
  const result = await conn.execute(
    `SELECT COLUMN_NAME, DATA_TYPE, DATA_LENGTH, DATA_PRECISION, DATA_SCALE 
     FROM ALL_TAB_COLUMNS 
     WHERE OWNER = :owner AND TABLE_NAME = :tableName 
     ORDER BY COLUMN_ID`,
    { owner: SCHEMA_ORACLE, tableName },
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );
  return result.rows || [];
}

async function getPrimaryKeys(conn, tableName) {
  const result = await conn.execute(
    `SELECT c.CONSTRAINT_NAME, cc.COLUMN_NAME, cc.POSITION
     FROM ALL_CONSTRAINTS c
     JOIN ALL_CONS_COLUMNS cc ON c.OWNER = cc.OWNER AND c.TABLE_NAME = cc.TABLE_NAME AND c.CONSTRAINT_NAME = cc.CONSTRAINT_NAME
     WHERE c.OWNER = :owner AND c.TABLE_NAME = :tableName AND c.CONSTRAINT_TYPE = 'P'
     ORDER BY cc.POSITION`,
    { owner: SCHEMA_ORACLE, tableName },
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );
  if (!result.rows || result.rows.length === 0) return [];
  const byName = {};
  for (const r of result.rows) {
    const name = r.CONSTRAINT_NAME;
    if (!byName[name]) byName[name] = [];
    byName[name].push(r.COLUMN_NAME);
  }
  return Object.entries(byName).map(([constraintName, columns]) => ({ constraintName, columns }));
}

async function getForeignKeys(conn, tableName) {
  const result = await conn.execute(
    `SELECT c.CONSTRAINT_NAME, c.R_OWNER, c.R_CONSTRAINT_NAME, cc.COLUMN_NAME, cc.POSITION, rc.TABLE_NAME AS R_TABLE_NAME
     FROM ALL_CONSTRAINTS c
     JOIN ALL_CONS_COLUMNS cc ON c.OWNER = cc.OWNER AND c.TABLE_NAME = cc.TABLE_NAME AND c.CONSTRAINT_NAME = cc.CONSTRAINT_NAME
     JOIN ALL_CONSTRAINTS rc ON c.R_OWNER = rc.OWNER AND c.R_CONSTRAINT_NAME = rc.CONSTRAINT_NAME
     WHERE c.OWNER = :owner AND c.TABLE_NAME = :tableName AND c.CONSTRAINT_TYPE = 'R'
     ORDER BY c.CONSTRAINT_NAME, cc.POSITION`,
    { owner: SCHEMA_ORACLE, tableName },
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );
  if (!result.rows || result.rows.length === 0) return [];
  const byConstraint = {};
  for (const r of result.rows) {
    const key = r.CONSTRAINT_NAME;
    if (!byConstraint[key]) byConstraint[key] = { constraintName: key, columns: [], refTable: r.R_TABLE_NAME, rOwner: r.R_OWNER, rConstraintName: r.R_CONSTRAINT_NAME, refColumns: [] };
    byConstraint[key].columns.push(r.COLUMN_NAME);
  }
  const fkList = Object.values(byConstraint);
  for (const fk of fkList) {
    const refCols = await conn.execute(
      `SELECT COLUMN_NAME FROM ALL_CONS_COLUMNS WHERE OWNER = :owner AND CONSTRAINT_NAME = :cname ORDER BY POSITION`,
      { owner: fk.rOwner, cname: fk.rConstraintName },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    fk.refColumns = (refCols.rows || []).map(row => row.COLUMN_NAME);
  }
  return fkList;
}

const ORACLE_PASSTHROUGH_TYPES = new Set([
  'VARCHAR2', 'CHAR', 'NCHAR', 'NVARCHAR2', 'VARCHAR',
  'NUMBER', 'FLOAT', 'BINARY_FLOAT', 'BINARY_DOUBLE',
  'DATE', 'TIMESTAMP', 'CLOB', 'NCLOB', 'BLOB'
]);

function oracleSelectExpression(col) {
  const name = col.COLUMN_NAME;
  const quoted = `"${name}"`;
  const dataType = (col.DATA_TYPE || '').toUpperCase().replace(/\s*\(\d+\)/g, '').trim();
  switch (dataType) {
    case 'XMLTYPE':
      return `XMLTYPE.GETCLOBVAL(${quoted}) AS ${quoted}`;
    case 'TIMESTAMP WITH TIME ZONE':
    case 'TIMESTAMP WITH LOCAL TIME ZONE':
      return `TO_CHAR(${quoted}) AS ${quoted}`;
    case 'INTERVAL YEAR TO MONTH':
    case 'INTERVAL DAY TO SECOND':
      return `TO_CHAR(${quoted}) AS ${quoted}`;
    case 'RAW':
      return `RAWTOHEX(${quoted}) AS ${quoted}`;
    case 'LONG':
      return `TO_LOB(${quoted}) AS ${quoted}`;
    default:
      if (dataType.startsWith('TIMESTAMP') && dataType.includes('TIME ZONE')) return `TO_CHAR(${quoted}) AS ${quoted}`;
      if (dataType.startsWith('INTERVAL')) return `TO_CHAR(${quoted}) AS ${quoted}`;
      if (ORACLE_PASSTHROUGH_TYPES.has(dataType)) return quoted;
      return `TO_CHAR(${quoted}) AS ${quoted}`;
  }
}

function formatValue(val) {
  if (val === null || val === undefined) return null;
  if (typeof val !== 'object') return val;
  if (val instanceof Date) return val;
  if (Buffer.isBuffer(val)) return val;
  if (typeof val.toISOString === 'function') return val.toISOString();
  if (typeof val.getData === 'function' || typeof val.read === 'function') return null;
  try {
    const s = String(val);
    if (s !== '[object Object]') return s;
  } catch (e) { /* ignore */ }
  return null;
}

function capSizeForInsert(val) {
  if (val == null) return val;
  if (Buffer.isBuffer(val)) return val.length > MAX_INSERT_VALUE_LENGTH ? val.slice(0, MAX_INSERT_VALUE_LENGTH) : val;
  if (typeof val === 'string' && val.length > MAX_INSERT_VALUE_LENGTH) return val.slice(0, MAX_INSERT_VALUE_LENGTH);
  return val;
}

function safeFormatValue(row, colName) {
  try {
    const val = row[colName] ?? row[colName?.toLowerCase?.()] ?? null;
    if (val === null || val === undefined) return null;
    const v = formatValue(val);
    return v === undefined ? null : capSizeForInsert(v);
  } catch (e) {
    return null;
  }
}

async function tableExists(client, tableName) {
  const pgTable = tableName.toLowerCase();
  const r = await client.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = $1 AND table_name = $2`,
    [PG_SCHEMA, pgTable]
  );
  return r.rows.length > 0;
}

async function createPgTable(client, tableName, columns, skipDrop = false) {
  const colDefs = columns.map(c => {
    const pgType = oracleTypeToPg(c.DATA_TYPE);
    const colName = c.COLUMN_NAME.toLowerCase();
    return `"${colName}" ${pgType}`;
  });
  const pgTable = tableName.toLowerCase();
  if (skipDrop) {
    const r = await client.query(
      `SELECT 1 FROM information_schema.tables WHERE table_schema = $1 AND table_name = $2`,
      [PG_SCHEMA, pgTable]
    );
    if (r.rows.length > 0) return;
    await client.query(`CREATE TABLE ${PG_SCHEMA}.${pgTable} (${colDefs.join(', ')});`);
  } else {
    await client.query(`
      DROP TABLE IF EXISTS ${PG_SCHEMA}.${pgTable} CASCADE;
      CREATE TABLE ${PG_SCHEMA}.${pgTable} (${colDefs.join(', ')});
    `);
  }
}

async function addPrimaryKey(client, tableName, pk) {
  if (!pk || !pk.columns || pk.columns.length === 0) return;
  const pgTable = tableName.toLowerCase();
  const cols = pk.columns.map(c => `"${c.toLowerCase()}"`).join(', ');
  const name = (pk.constraintName || `pk_${pgTable}`).toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 63);
  await client.query(`ALTER TABLE ${PG_SCHEMA}.${pgTable} ADD CONSTRAINT ${name} PRIMARY KEY (${cols})`);
}

async function addForeignKey(client, tableName, fk) {
  if (!fk || !fk.columns || fk.columns.length === 0 || !fk.refTable || !fk.refColumns || fk.refColumns.length === 0) return;
  const pgTable = tableName.toLowerCase();
  const refTable = fk.refTable.toLowerCase();
  const cols = fk.columns.map(c => `"${c.toLowerCase()}"`).join(', ');
  const refCols = fk.refColumns.map(c => `"${c.toLowerCase()}"`).join(', ');
  const name = (fk.constraintName || `fk_${pgTable}_${refTable}`).toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 63);
  await client.query(`ALTER TABLE ${PG_SCHEMA}.${pgTable} ADD CONSTRAINT ${name} FOREIGN KEY (${cols}) REFERENCES ${PG_SCHEMA}.${refTable} (${refCols})`);
}

async function insertIntoPg(client, tableName, columns, rows) {
  if (rows.length === 0) return 0;
  const colNames = columns.map(c => `"${c.COLUMN_NAME.toLowerCase()}"`).join(', ');
  const pgTable = tableName.toLowerCase();
  let inserted = 0;
  for (let i = 0; i < rows.length; i += INSERT_BATCH_ROWS) {
    const batch = rows.slice(i, i + INSERT_BATCH_ROWS);
    const valueSets = [];
    const allValues = [];
    let paramIdx = 1;
    for (const row of batch) {
      valueSets.push(`(${columns.map(() => `$${paramIdx++}`).join(', ')})`);
      for (const c of columns) {
        allValues.push(safeFormatValue(row, c.COLUMN_NAME));
      }
    }
    try {
      await client.query(
        `INSERT INTO ${PG_SCHEMA}.${pgTable} (${colNames}) VALUES ${valueSets.join(', ')}`,
        allValues
      );
      inserted += batch.length;
    } catch (err) {
      console.warn(`    Batch insert error: ${err.message}`);
    }
  }
  return inserted;
}

/** Inserta solo filas cuya PK no existe (ON CONFLICT DO NOTHING). Para SYNC_FALTANTES. */
async function insertIntoPgAppend(client, tableName, columns, pkColumns, rows) {
  if (rows.length === 0 || !pkColumns || pkColumns.length === 0) return 0;
  const colNames = columns.map(c => `"${c.COLUMN_NAME.toLowerCase()}"`).join(', ');
  const pgTable = tableName.toLowerCase();
  const conflictCols = pkColumns.map(c => `"${c.toLowerCase()}"`).join(', ');
  let inserted = 0;
  for (let i = 0; i < rows.length; i += INSERT_BATCH_ROWS) {
    const batch = rows.slice(i, i + INSERT_BATCH_ROWS);
    const valueSets = [];
    const allValues = [];
    let paramIdx = 1;
    for (const row of batch) {
      valueSets.push(`(${columns.map(() => `$${paramIdx++}`).join(', ')})`);
      for (const c of columns) {
        allValues.push(safeFormatValue(row, c.COLUMN_NAME));
      }
    }
    try {
      const res = await client.query(
        `INSERT INTO ${PG_SCHEMA}.${pgTable} (${colNames}) VALUES ${valueSets.join(', ')}
         ON CONFLICT (${conflictCols}) DO NOTHING`,
        allValues
      );
      inserted += res.rowCount || 0;
    } catch (err) {
      console.warn(`    Append batch error: ${err.message}`);
    }
  }
  return inserted;
}

async function exportTableFromOracleStreaming(conn, tableName, columns, onBatch) {
  const selectList = columns.map(c => oracleSelectExpression(c)).join(', ');
  const fullTable = `${SCHEMA_ORACLE}.${tableName}`;
  const query = `SELECT ${selectList} FROM ${fullTable}`;
  const result = await conn.execute(query, [], {
    resultSet: true,
    outFormat: oracledb.OUT_FORMAT_OBJECT,
    fetchArraySize: BATCH_SIZE
  });
  const rs = result.resultSet;
  let totalRows = 0;
  let rows;
  while ((rows = await rs.getRows(BATCH_SIZE)) && rows.length > 0) {
    totalRows += rows.length;
    await onBatch(rows);
  }
  await rs.close();
  return { columns, totalRows };
}

async function ensureSmaDatabase() {
  const admin = new Client({ ...pgBaseConfig, database: 'postgres' });
  await admin.connect();
  try {
    const r = await admin.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [PG_DATABASE]
    );
    if (r.rows.length === 0) {
      await admin.query(`CREATE DATABASE ${PG_DATABASE}`);
      console.log(`  Base de datos "${PG_DATABASE}" creada.`);
    }
  } finally {
    await admin.end();
  }
}

const RESYNC = process.env.RESYNC === '1';
const SYNC_FALTANTES = process.env.SYNC_FALTANTES === '1';

async function main() {
  console.log('=== Backup Oracle SMA -> PostgreSQL ===');
  if (SYNC_FALTANTES) console.log('Modo: SYNC_FALTANTES (solo agrega filas nuevas, no borra tablas)\n');
  else if (RESYNC) console.log('Modo: RESYNC (resincronizar todas las tablas desde origen)\n');
  else console.log('Modo: incremental (reanudable)\n');

  if (!oracleConfig.password) {
    console.error('Configure ORACLE_PASS u ORACLE_PASSWORD en .env o config-puertos-libres.env');
    process.exit(1);
  }
  if (!oracleConfig.connectString) {
    console.error('Configure conexion Oracle SMA (origen remoto): ORACLE_PROD_HOST + ORACLE_PROD_SERVICE_NAME (y opcional ORACLE_PROD_PORT), o ORACLE_PROD_CONNECT_STRING. Para entorno local: ORACLE_HOST + ORACLE_SERVICE_NAME.');
    process.exit(1);
  }

  const progress = loadProgress();
  const completedSet = new Set(progress.completedTables || []);
  progress.tablesMeta = progress.tablesMeta || {};

  let pgClient;
  try {
    await ensureSmaDatabase();

    const pgConfig = { ...pgBaseConfig, database: PG_DATABASE };
    console.log('Conectando a PostgreSQL (' + PG_DATABASE + ')...');
    pgClient = new Client(pgConfig);
    await pgClient.connect();
    console.log('  OK PostgreSQL conectado\n');
    await pgClient.query(`CREATE SCHEMA IF NOT EXISTS ${PG_SCHEMA}`);

    let tables;
    let oracleConn = null;
    let fkRefsForOrder = [];
    try {
      oracleConn = await retryWithBackoff(getOracleConnection, 'Oracle SMA connect');
      tables = await retryWithBackoff(() => getOracleTables(oracleConn), 'get tables');
      if (SYNC_FALTANTES && oracleConn && tables.length > 0) {
        fkRefsForOrder = await retryWithBackoff(() => getAllFkRefs(oracleConn, tables), 'get FK refs');
      }
      if (oracleConn) { await oracleConn.close(); oracleConn = null; }
    } catch (err) {
      console.error('No se pudo conectar a Oracle SMA:', err.message);
      console.log('\nConexion interrumpida o servidor no alcanzable. Re-ejecute cuando la red este disponible.');
      console.log('Tablas ya completadas:', completedSet.size);
      process.exit(1);
    }

    const skipEmpty = loadSkipEmptyTables();
    if (skipEmpty.size > 0) {
      const before = tables.length;
      tables = tables.filter(t => !skipEmpty.has(String(t).toUpperCase()));
      if (tables.length < before) console.log(`Tablas vacias excluidas: ${before - tables.length}\n`);
    }

    const protectedExcluded = tables.filter(isProtectedTable);
    if (protectedExcluded.length > 0) {
      tables = tables.filter(t => !isProtectedTable(t));
      console.log(`Tablas protegidas excluidas (AUTH_/RBAC_): ${protectedExcluded.length}`);
    }

    // Tablas *_DESTINO: misma tabla que la sin sufijo (sma_regionales_destino = sma_regionales). No sincronizar; en medisena se depuran con drop-unused-destino-tables-medisena.js (paso 1.5 de los scripts de sincronización).
    const destinoExcluded = tables.filter(t => String(t).toUpperCase().endsWith('_DESTINO'));
    if (destinoExcluded.length > 0) {
      tables = tables.filter(t => !String(t).toUpperCase().endsWith('_DESTINO'));
      console.log(`Tablas *_DESTINO excluidas (no usadas): ${destinoExcluded.join(', ')}`);
    }

    // Tablas con fecha en el nombre (ej. SMA_CARGOS04072023): copias de respaldo con información repetida. No sincronizar; se depuran con drop-dated-backup-tables-medisena.js. Tabla canónica: sma_cargos (y t_cargos en SPU).
    const datedBackupPattern = /^\w+\d{8}$/;
    const datedExcluded = tables.filter(t => datedBackupPattern.test(String(t)));
    if (datedExcluded.length > 0) {
      tables = tables.filter(t => !datedBackupPattern.test(String(t)));
      console.log(`Tablas copia con fecha excluidas (evitar duplicados): ${datedExcluded.join(', ')}`);
    }

    // Tablas redundantes: misma información que otra tabla principal (sma_beneficiarios_activos = subconjunto de sma_beneficiarios; sma_funcionarios es la canónica). No sincronizar; se depuran con drop-redundant-tables-medisena.js.
    const REDUNDANT_TABLES = new Set(['SMA_BENEFICIARIOS_ACTIVOS']);
    const redundantExcluded = tables.filter(t => REDUNDANT_TABLES.has(String(t).toUpperCase()));
    if (redundantExcluded.length > 0) {
      tables = tables.filter(t => !REDUNDANT_TABLES.has(String(t).toUpperCase()));
      console.log(`Tablas redundantes excluidas (usar tabla canónica): ${redundantExcluded.join(', ')}`);
    }

    let pending = SYNC_FALTANTES ? tables : (RESYNC ? tables : tables.filter(t => !completedSet.has(t)));
    if (SYNC_FALTANTES && pending.length > 0 && fkRefsForOrder.length > 0) {
      pending = sortTablesByFkOrder(pending, fkRefsForOrder);
      console.log('Tablas ordenadas por dependencias FK (padres antes que hijos).');
    }
    const pendingLabel = SYNC_FALTANTES ? 'A revisar (solo faltantes)' : (RESYNC ? 'A resincronizar' : 'Pendientes');
    console.log(`Tablas SMA: ${tables.length} | ${pendingLabel}: ${pending.length} | Completadas: ${completedSet.size}\n`);

    if (pending.length === 0 && !RESYNC && !SYNC_FALTANTES) {
      console.log('Todas las tablas SMA ya estan respaldadas. Use RESYNC=1 para volver a copiar desde origen o SYNC_FALTANTES=1 para solo agregar datos nuevos.');
      return;
    }

    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const fksToAdd = [];
    const skippedEmptyTables = new Set();

    for (const tableName of pending) {
      let tableSuccess = false;
      for (let tableAttempt = 1; tableAttempt <= MAX_TABLE_RETRIES && !tableSuccess; tableAttempt++) {
        if (tableAttempt > 1) {
          console.warn(`  Reintento tabla ${tableAttempt}/${MAX_TABLE_RETRIES}...`);
        }
        process.stdout.write(`  ${tableName}... `);
        let conn = null;
        try {
          conn = await retryWithBackoff(getOracleConnection, 'Oracle connect');

          const columns = await getTableColumns(conn, tableName);
          const rowCount = await getTableRowCount(conn, tableName);

          if (rowCount === 0) {
            if (!SYNC_FALTANTES) {
              skippedEmptyTables.add(String(tableName).toUpperCase());
              progress.completedTables = progress.completedTables || [];
              if (!progress.completedTables.includes(tableName)) progress.completedTables.push(tableName);
              progress.tablesMeta[tableName] = { rows: 0, updatedAt: new Date().toISOString() };
              saveProgress(progress);
            }
            logProgress(`${tableName}... 0 filas (tabla vacia)`);
            console.log('0 filas (tabla vacia)');
            tableSuccess = true;
            continue;
          }

          const pks = await getPrimaryKeys(conn, tableName);
          const pkCols = (pks && pks[0] && pks[0].columns) ? pks[0].columns.map(c => c.toLowerCase()) : [];
          const exists = await tableExists(pgClient, tableName);

          if (SYNC_FALTANTES && exists && pkCols.length === 0) {
            console.log('omitida (sin PK, no se puede hacer ON CONFLICT)');
            tableSuccess = true;
          } else if (SYNC_FALTANTES && exists && pkCols.length > 0) {
            let totalInserted = 0;
            await exportTableFromOracleStreaming(conn, tableName, columns, async (rows) => {
              const n = await insertIntoPgAppend(pgClient, tableName, columns, pkCols, rows);
              totalInserted += n;
            });
            logProgress(`${tableName}... ${totalInserted} filas nuevas insertadas (solo faltantes)`);
            console.log(`${totalInserted} filas nuevas (ON CONFLICT DO NOTHING)`);
            tableSuccess = true;
          } else {
            await createPgTable(pgClient, tableName, columns, false);
            for (const pk of pks) {
              await addPrimaryKey(pgClient, tableName, { constraintName: pk.constraintName, columns: pk.columns });
            }
            const fks = await getForeignKeys(conn, tableName);
            for (const fk of fks) {
              fksToAdd.push({ tableName, fk });
            }

            let totalInserted = 0;
            await exportTableFromOracleStreaming(conn, tableName, columns, async (rows) => {
              const n = await insertIntoPg(pgClient, tableName, columns, rows);
              totalInserted += n;
            });
            progress.completedTables = progress.completedTables || [];
            if (!progress.completedTables.includes(tableName)) {
              progress.completedTables.push(tableName);
            }
            progress.tablesMeta[tableName] = { rows: totalInserted, updatedAt: new Date().toISOString() };
            saveProgress(progress);
            logProgress(`${tableName}... ${totalInserted} filas -> PG (${totalInserted} insertadas)`);
            console.log(`${totalInserted} filas -> PG (${totalInserted} insertadas)`);
            tableSuccess = true;
          }
        } catch (err) {
          console.log('ERROR ' + err.message);
          logProgress(`${tableName} ERROR: ${err.message}`);
          if (tableAttempt >= MAX_TABLE_RETRIES) {
            console.warn(`  Tabla ${tableName} fallo tras ${MAX_TABLE_RETRIES} intentos. Continuando.`);
          }
        } finally {
          if (conn) {
            try { await conn.close(); } catch (e) { /* ignore */ }
          }
        }
      }
    }

    // Solo añadir FK si la tabla referenciada existe en medisena (sma_*)
    const pgTablesRes = await pgClient.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = $1 AND table_type = 'BASE TABLE' AND table_name LIKE 'sma_%'`,
      [PG_SCHEMA]
    );
    const pgTableSet = new Set((pgTablesRes.rows || []).map(r => r.table_name.toLowerCase()));
    const pgTablesSma = (pgTablesRes.rows || []).map(r => r.table_name);

    if (SYNC_FALTANTES && pgTablesSma.length > 0) {
      const existingFkRes = await pgClient.query(`
        SELECT tc.table_name, string_agg(kcu.column_name, ',' ORDER BY kcu.ordinal_position) AS cols,
               ccu.table_name AS ref_table, string_agg(ccu.column_name, ',' ORDER BY kcu.ordinal_position) AS ref_cols
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
        WHERE tc.table_schema = $1 AND tc.constraint_type = 'FOREIGN KEY' AND tc.table_name LIKE 'sma_%'
        GROUP BY tc.table_name, tc.constraint_name, ccu.table_name
      `, [PG_SCHEMA]);
      const existingFkSigs = new Set();
      (existingFkRes.rows || []).forEach(r => {
        const cols = (r.cols || '').split(',').map(c => c.trim().toLowerCase()).sort().join(',');
        const refCols = (r.ref_cols || '').split(',').map(c => c.trim().toLowerCase()).sort().join(',');
        existingFkSigs.add(`${r.table_name}|${r.ref_table}|${cols}|${refCols}`);
      });
      let oraConn = null;
      try {
        oraConn = await retryWithBackoff(getOracleConnection, 'Oracle SMA (FKs faltantes)');
        let added = 0;
        for (const pgTable of pgTablesSma) {
          const oraTable = pgTable.toUpperCase();
          const fks = await getForeignKeys(oraConn, oraTable);
          for (const fk of fks) {
            const refLower = (fk.refTable || '').toLowerCase();
            if (!pgTableSet.has(refLower)) continue;
            const sig = `${pgTable}|${refLower}|${(fk.columns || []).map(c => c.toLowerCase()).sort().join(',')}|${(fk.refColumns || []).map(c => c.toLowerCase()).sort().join(',')}`;
            if (existingFkSigs.has(sig)) continue;
            try {
              await addForeignKey(pgClient, pgTable, fk);
              existingFkSigs.add(sig);
              added++;
            } catch (e) {
              if (!/already exists|duplicate/i.test(e.message)) console.warn(`  FK ${pgTable}: ${e.message}`);
            }
          }
        }
        if (added > 0) console.log(`\n  FKs SMA añadidas (solo faltantes): ${added}`);
      } finally {
        if (oraConn) { try { await oraConn.close(); } catch (e) {} }
      }
    } else {
      for (const { tableName, fk } of fksToAdd) {
        const refTable = (fk.refTable || '').toUpperCase();
        const refTableLower = refTable.toLowerCase();
        if (skippedEmptyTables.has(refTable) || !pgTableSet.has(refTableLower)) continue;
        try {
          await addForeignKey(pgClient, tableName, fk);
        } catch (e) {
          if (!/already exists|duplicate/i.test(e.message)) {
            console.warn(`  FK ${tableName}: ${e.message}`);
          }
        }
      }
    }

    console.log('\nBackup SMA finalizado. Tablas en ' + PG_SCHEMA + ' (sma_*).');
  } finally {
    if (pgClient) await pgClient.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
