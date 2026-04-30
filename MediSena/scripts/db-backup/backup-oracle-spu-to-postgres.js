#!/usr/bin/env node
/**
 * Backup Oracle (SPU) -> PostgreSQL medisena (directo al esquema medisena)
 * - Escribe en DB medisena, esquema medisena, tablas medisena.t_*
 * - RESYNC=1: resincroniza todas las tablas desde origen (DROP + full copy).
 * - SYNC_FALTANTES=1: solo agrega filas nuevas; no borra tablas (INSERT ... ON CONFLICT DO NOTHING / skip duplicados).
 * Uso: npm run backup:spu   o   RESYNC=1 npm run backup:spu   o   SYNC_FALTANTES=1 npm run backup:spu
 */

const path = require('path');
const root = path.join(__dirname, '../..');
['.env', 'config-puertos-libres.env'].forEach(f => {
  require('dotenv').config({ path: path.join(root, f) });
});
const oracledb = require('oracledb');
const { Client } = require('pg');
const fs = require('fs');
const { createWriteStream } = require('fs');

const spuHost = process.env.ORACLE_SPU_HOST || '';
const spuPort = process.env.ORACLE_SPU_PORT || '1521';
const spuService = process.env.ORACLE_SPU_SERVICE_NAME || '';
// Prioridad: si están HOST y SERVICE_NAME, se arma desde ellos (permite usar IP); si no, se usa CONNECT_STRING
const spuConnectString = (spuHost && spuService)
  ? `${spuHost}:${spuPort}/${spuService}`
  : (process.env.ORACLE_SPU_CONNECT_STRING || '');

const oracleConfig = {
  user: process.env.ORACLE_SPU_USER || 'SPUSMA',
  password: process.env.ORACLE_SPU_PASS || process.env.ORACLE_SPU_PASSWORD || '',
  connectString: spuConnectString,
  poolMin: 0,
  poolMax: 1
};

const pgBaseConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5433', 10),
  user: process.env.POSTGRES_USER || 'medisena',
  password: process.env.POSTGRES_PASSWORD || 'medisena_local'
};

const { BACKUP_DIR } = require('./config');
const PG_DATABASE = process.env.MEDISENA_DB || process.env.POSTGRES_DB || 'medisena';
const SCHEMA_ORACLE = process.env.ORACLE_SPU_SCHEMA || 'SPUSMA';
const PG_SCHEMA = 'medisena';
const PROGRESS_FILE = path.join(BACKUP_DIR, 'backup_progress_spu.json');
const LOB_DIR = path.join(BACKUP_DIR, 'lobs', PG_SCHEMA);
const LOB_STREAM_CHUNK = 256 * 1024; // 256KB por chunk (evita que getData devuelva strings/buffers gigantes)
const SAFE_LOB_READ_BYTES = 512 * 1024; // máx 512KB por lectura en memoria (evita Invalid string length)
const BATCH_SIZE = 1000;
const LOB_TABLE_BATCH_SIZE = 100; // tablas con LOB: menos filas por lote para reducir pico de memoria
const LOB_ALWAYS_TO_FILE_TABLES = new Set(['T_ANEXO', 'T_CERTIFICADOS']); // Nunca cargar LOB en memoria: siempre stream a archivo (evita Invalid string length)
const INSERT_BATCH_ROWS = 100;
const SKIP_JSON_OVER_ROWS = 50000;
const MAX_RETRIES = 6;
const RETRY_DELAY_MS = 5000;
const MAX_TABLE_RETRIES = 3;
const IS_CONN_ERROR = /ORA-|DPI-|NJS-|connection|ECONNRESET|ETIMEDOUT|broken pipe|network|unreachable|refused/i;
const MAX_STRING_LENGTH = parseInt(process.env.MAX_LOB_LENGTH || '31457280', 10);
const MAX_INSERT_VALUE_LENGTH = parseInt(process.env.MAX_INSERT_VALUE_LENGTH || '2097152', 10);
const ROW_BY_ROW_THROTTLE_EVERY = parseInt(process.env.ROW_THROTTLE_EVERY || '50', 10);
const ROW_THROTTLE_MS = parseInt(process.env.ROW_THROTTLE_MS || '20', 10);
const PROTECTED_TABLE_PREFIXES = ['AUTH_', 'RBAC_'];
// Tablas SPU que no son necesarias en medisena; no sincronizar.
// T_CARGOS sí se sincroniza: es el maestro de cargos; sma_cargos es la relación (cargo-sueldo-vigencia) con FK a t_cargos.
const SPU_TABLES_EXCLUDE = new Set(['T_ARTICULO']);

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
  if (process.env.RESET_PROGRESS_SPU === '1') {
    return { completedTables: [], tablesMeta: {}, startedAt: new Date().toISOString() };
  }
  try {
    const data = fs.readFileSync(PROGRESS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return { completedTables: [], tablesMeta: {}, startedAt: new Date().toISOString() };
  }
}

const RESYNC = process.env.RESYNC === '1' || process.env.RESYNC_SPU === '1';
const SYNC_FALTANTES = process.env.SYNC_FALTANTES === '1';

function isProtectedTable(tableName) {
  const upper = String(tableName || '').toUpperCase();
  return PROTECTED_TABLE_PREFIXES.some(prefix => upper.startsWith(prefix));
}

function saveProgress(progress) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  progress.updatedAt = new Date().toISOString();
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf8');
}

/** Tablas vacías que no se sincronizan (lista generada por drop-empty-tables-pg.js) */
function loadSkipEmptyTables() {
  const skipPath = path.join(BACKUP_DIR, 'skip_empty_tables_spu.json');
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
    `SELECT TABLE_NAME FROM ALL_TABLES WHERE OWNER = :owner ORDER BY TABLE_NAME`,
    { owner: SCHEMA_ORACLE },
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );
  return result.rows.map(r => r.TABLE_NAME);
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
  return result.rows;
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

const SENSITIVE_TYPES = new Set(['CLOB', 'NCLOB', 'BLOB', 'BFILE', 'XMLTYPE', 'LONG']);

function isSensitiveColumn(col) {
  const t = (col.DATA_TYPE || '').toUpperCase().replace(/\s*\(\d+\)/g, '').trim();
  return SENSITIVE_TYPES.has(t) || t.startsWith('XMLTYPE') || t === 'LONG';
}

function getSensitiveColumnNames(columns) {
  return columns.filter(c => isSensitiveColumn(c)).map(c => c.COLUMN_NAME);
}

function getLobColumns(columns) {
  const lobTypes = new Set(['CLOB', 'NCLOB', 'BLOB', 'BFILE']);
  return columns.filter(c => lobTypes.has((c.DATA_TYPE || '').toUpperCase()));
}

function hasLobColumns(columns) {
  const lobTypes = new Set(['CLOB', 'NCLOB', 'BLOB', 'BFILE']);
  return columns.some(c => lobTypes.has((c.DATA_TYPE || '').toUpperCase()));
}

function hasSensitiveColumns(columns) {
  return columns.some(c => isSensitiveColumn(c));
}

/**
 * Lee un LOB sin superar MAX_INSERT_VALUE_LENGTH (nunca getData() sin amount:
 * evita "Invalid string length" y buffers gigantes).
 */
async function readLobCapped(lob) {
  try {
    const len = typeof lob.length === 'number' && lob.length > 0 ? lob.length : 0;
    const amount = len > 0 ? Math.min(len, SAFE_LOB_READ_BYTES) : SAFE_LOB_READ_BYTES;
    const data = await Promise.resolve(lob.getData(1, amount));
    if (data == null) return null;
    if (Buffer.isBuffer(data) && data.length > MAX_INSERT_VALUE_LENGTH) return data.slice(0, MAX_INSERT_VALUE_LENGTH);
    if (typeof data === 'string' && data.length > MAX_INSERT_VALUE_LENGTH) return data.slice(0, MAX_INSERT_VALUE_LENGTH);
    return data;
  } catch (e) {
    return null;
  }
}

/**
 * Escribe un LOB completo en un archivo por trozos (100% del contenido, sin truncar).
 * Devuelve la ruta relativa a BACKUP_DIR para guardar en _path.
 * options.chunkSize: usar chunk más pequeño (ej. 64KB) para tablas problemáticas.
 */
async function streamLobToFile(lob, absolutePath, options = {}) {
  try {
    const len = typeof lob.length === 'number' && lob.length > 0 ? lob.length : 0;
    const maxChunk = options.chunkSize || LOB_STREAM_CHUNK;
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    const w = createWriteStream(absolutePath);
    let offset = 1;
    const chunkSize = Math.min(maxChunk, len || maxChunk);
    while (true) {
      const amount = len > 0 ? Math.min(chunkSize, len - offset + 1) : chunkSize;
      if (amount <= 0) break;
      const chunk = await Promise.resolve(lob.getData(offset, amount));
      if (!chunk || (Buffer.isBuffer(chunk) && chunk.length === 0) || (typeof chunk === 'string' && chunk.length === 0)) break;
      const readLen = Buffer.isBuffer(chunk) ? chunk.length : chunk.length;
      if (Buffer.isBuffer(chunk)) {
        for (let i = 0; i < chunk.length; i += maxChunk) {
          w.write(chunk.slice(i, i + maxChunk));
        }
      } else {
        const str = String(chunk);
        const writeChunk = Math.min(maxChunk, 64 * 1024);
        for (let i = 0; i < str.length; i += writeChunk) {
          w.write(str.slice(i, i + writeChunk), 'utf8');
        }
      }
      offset += readLen;
      if (readLen < amount || (len > 0 && offset > len)) break;
    }
    w.end();
    await new Promise((resolve, reject) => { w.on('finish', resolve); w.on('error', reject); });
    const relativePath = path.relative(BACKUP_DIR, absolutePath).replace(/\\/g, '/');
    return relativePath;
  } catch (e) {
    return null;
  }
}

/**
 * Resuelve LOBs fila a fila: si el LOB es mayor que MAX_INSERT_VALUE_LENGTH
 * se hace stream a archivo (100% del contenido) y se guarda la ruta en _path;
 * si no, se lee acotado y se guarda en la columna.
 */
async function resolveLobsInRows(rows, columns, tableName) {
  const lobColumns = getLobColumns(columns);
  const lobColNames = new Set(lobColumns.map(l => l.COLUMN_NAME));
  const out = [];
  for (const row of rows) {
    try {
      const newRow = {};
      const rowId = (row.ROWID || row.rowid || '').toString().replace(/[\/+]/g, '_').slice(0, 80) || `r${out.length}`;
      const tableDir = path.join(LOB_DIR, tableName);
      for (const c of columns) {
        const key = c.COLUMN_NAME;
        try {
          let val = row[key] ?? row[key?.toLowerCase?.()] ?? null;
          const isLob = val != null && typeof val === 'object' && typeof val.getData === 'function';
          if (isLob && lobColNames.has(key)) {
            const alwaysToFile = LOB_ALWAYS_TO_FILE_TABLES.has(tableName);
            const len = typeof val.length === 'number' ? val.length : 0;
            if (alwaysToFile || len > MAX_INSERT_VALUE_LENGTH) {
              const fname = `${rowId}_${key}.bin`;
              const absPath = path.join(tableDir, fname);
              const streamOpts = alwaysToFile ? { chunkSize: 64 * 1024 } : {};
              const relPath = await streamLobToFile(val, absPath, streamOpts);
              newRow[key] = null;
              newRow[key + '_path'] = relPath;
            } else {
              val = await readLobCapped(val);
              newRow[key] = capSizeForInsert(capSize(val));
              newRow[key + '_path'] = null;
            }
          } else if (isLob && !LOB_ALWAYS_TO_FILE_TABLES.has(tableName)) {
            val = await readLobCapped(val);
            newRow[key] = capSizeForInsert(capSize(val));
            if (lobColNames.has(key)) newRow[key + '_path'] = null;
          } else if (isLob && LOB_ALWAYS_TO_FILE_TABLES.has(tableName)) {
            newRow[key] = null;
            if (lobColNames.has(key)) newRow[key + '_path'] = null;
          } else if (lobColNames.has(key) && typeof val === 'string' && val.length > MAX_INSERT_VALUE_LENGTH) {
            // No hacer val.slice: un string gigante puede provocar Invalid string length al manipularlo
            newRow[key] = null;
            newRow[key + '_path'] = null;
          } else {
            newRow[key] = capSizeForInsert(capSize(val));
            if (lobColNames.has(key)) newRow[key + '_path'] = null;
          }
        } catch (e) {
          newRow[key] = null;
          if (lobColNames.has(key)) newRow[key + '_path'] = null;
        }
      }
      out.push(newRow);
    } catch (rowErr) {
      // Invalid string length u otro error a nivel fila: insertar fila con LOBs a null para no perder el resto
      const fallbackRow = {};
      for (const c of columns) {
        const key = c.COLUMN_NAME;
        fallbackRow[key] = null;
        if (lobColNames.has(key)) fallbackRow[key + '_path'] = null;
      }
      out.push(fallbackRow);
    }
  }
  return out;
}

const LOB_PROGRESS_EVERY_ROWS = 500; // cada N filas imprimir progreso en tablas LOB para no parecer detenido

async function exportTableFromOracleBatch(conn, tableName, columns, onBatch) {
  const lobCols = getLobColumns(columns);
  let batchSize = lobCols.length > 0 ? LOB_TABLE_BATCH_SIZE : BATCH_SIZE;
  if (LOB_ALWAYS_TO_FILE_TABLES.has(tableName)) batchSize = 10;
  const isLobTable = lobCols.length > 0 || LOB_ALWAYS_TO_FILE_TABLES.has(tableName);
  const prefix = lobCols.length > 0 ? 'ROWID, ' : '';
  const selectList = prefix + columns.map(c => oracleSelectExpression(c)).join(', ');
  const fullTable = `${SCHEMA_ORACLE}.${tableName}`;
  const query = `SELECT ${selectList} FROM ${fullTable} ORDER BY ROWID OFFSET :off ROWS FETCH NEXT :batch ROWS ONLY`;
  const opts = { outFormat: oracledb.OUT_FORMAT_OBJECT };
  let offset = 0;
  let totalRows = 0;
  let rows;
  do {
    const result = await conn.execute(query, { off: offset, batch: batchSize }, opts);
    rows = result.rows || [];
    if (rows.length === 0) break;
    const resolved = await resolveLobsInRows(rows, columns, tableName);
    await onBatch(resolved);
    totalRows += resolved.length;
    offset += batchSize;
    if (isLobTable && totalRows > 0 && totalRows % LOB_PROGRESS_EVERY_ROWS < rows.length) {
      process.stderr.write(`  ... ${totalRows} filas procesadas (LOB)\r`);
    }
  } while (rows.length === batchSize);
  if (isLobTable && totalRows > 0) process.stderr.write('\n');
  return { columns, totalRows };
}

async function exportTableFromOracleStreaming(conn, tableName, onBatch) {
  const columns = await getTableColumns(conn, tableName);
  const selectList = columns.map(c => oracleSelectExpression(c)).join(', ');
  const fullTable = `${SCHEMA_ORACLE}.${tableName}`;
  const query = `SELECT ${selectList} FROM ${fullTable}`;
  const fetchString = [ oracledb.CLOB ];
  if (oracledb.NCLOB) fetchString.push(oracledb.NCLOB);
  const result = await conn.execute(query, [], {
    resultSet: true,
    outFormat: oracledb.OUT_FORMAT_OBJECT,
    fetchArraySize: BATCH_SIZE,
    fetchAsBuffer: [ oracledb.BLOB ],
    fetchAsString: fetchString
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

async function createPgTable(client, tableName, columns, lobColumns = [], skipDrop = false) {
  const colDefs = columns.map(c => {
    const pgType = oracleTypeToPg(c.DATA_TYPE);
    const colName = c.COLUMN_NAME.toLowerCase();
    return `"${colName}" ${pgType}`;
  });
  lobColumns.forEach(c => {
    colDefs.push(`"${(c.COLUMN_NAME + '_path').toLowerCase()}" TEXT`);
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

async function tableExists(client, tableName) {
  const pgTable = tableName.toLowerCase();
  const r = await client.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = $1 AND table_name = $2`,
    [PG_SCHEMA, pgTable]
  );
  return r.rows.length > 0;
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
  // NOT VALID: no valida filas existentes (evita fallos por huérfanos); las nuevas sí quedan validadas
  await client.query(`ALTER TABLE ${PG_SCHEMA}.${pgTable} ADD CONSTRAINT ${name} FOREIGN KEY (${cols}) REFERENCES ${PG_SCHEMA}.${refTable} (${refCols}) NOT VALID`);
}

function formatValue(val) {
  if (val === null || val === undefined) return null;
  if (typeof val !== 'object') return val;
  if (val instanceof Date) return val;
  if (Buffer.isBuffer(val)) return val;
  if (typeof val.toISOString === 'function') return val.toISOString();
  // Objetos Oracle (NVPair, LOB, etc.) tienen referencias circulares -> no pasarlos a PG ni a JSON
  if (typeof val.getData === 'function' || typeof val.read === 'function') return null;
  try {
    const s = String(val);
    if (s !== '[object Object]') return s;
  } catch (e) { /* ignore */ }
  return null;
}

function capSize(val) {
  if (val == null) return val;
  if (Buffer.isBuffer(val)) return val.length > MAX_STRING_LENGTH ? Buffer.concat([val.slice(0, MAX_STRING_LENGTH)], MAX_STRING_LENGTH) : val;
  if (typeof val === 'string' && val.length > MAX_STRING_LENGTH) return val.slice(0, MAX_STRING_LENGTH);
  return val;
}

function capSizeForInsert(val) {
  if (val == null) return val;
  if (Buffer.isBuffer(val)) return val.length > MAX_INSERT_VALUE_LENGTH ? Buffer.concat([val.slice(0, MAX_INSERT_VALUE_LENGTH)], MAX_INSERT_VALUE_LENGTH) : val;
  if (typeof val === 'string' && val.length > MAX_INSERT_VALUE_LENGTH) return val.slice(0, MAX_INSERT_VALUE_LENGTH);
  return val;
}

function safeFormatValue(row, colName) {
  try {
    const val = row[colName] ?? row[colName?.toLowerCase?.()] ?? null;
    if (val === null || val === undefined) return null;
    const v = formatValue(val);
    const out = v === undefined ? null : v;
    return capSize(out);
  } catch (e) {
    return null;
  }
}

const IS_INVALID_STRING_LENGTH = /Invalid string length|RangeError|alloc/i;
const PG_UNIQUE_VIOLATION = '23505';
const IS_DUPLICATE_KEY = /duplicate key|unique constraint|violates unique constraint/i;

/**
 * Construye el array de valores de una fila campo a campo: cada columna se
 * formatea en su propio try/catch y se limita a MAX_INSERT_VALUE_LENGTH para
 * evitar "Invalid string length" y ENOBUFS al enviar a PostgreSQL.
 */
function safeRowValuesFieldByField(row, columns) {
  const values = [];
  for (const c of columns) {
    try {
      let v = safeFormatValue(row, c.COLUMN_NAME);
      v = v === undefined ? null : capSizeForInsert(v);
      values.push(v);
    } catch (e) {
      values.push(null);
    }
  }
  return values;
}

async function insertIntoPg(client, tableName, columns, rows) {
  if (rows.length === 0) return 0;
  const colNames = columns.map(c => `"${c.COLUMN_NAME.toLowerCase()}"`).join(', ');
  const pgTable = tableName.toLowerCase();
  const numCols = columns.length;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    for (let j = 0; j < batch.length; j += INSERT_BATCH_ROWS) {
      const insertRows = batch.slice(j, j + INSERT_BATCH_ROWS);
      const valueSets = [];
      const allValues = [];
      let paramIdx = 1;
      for (const row of insertRows) {
        valueSets.push(`(${columns.map(() => `$${paramIdx++}`).join(', ')})`);
        for (const c of columns) {
          allValues.push(safeFormatValue(row, c.COLUMN_NAME));
        }
      }
      const expectedLen = insertRows.length * numCols;
      if (allValues.length !== expectedLen) {
        console.warn(`    Batch insert skip: params ${allValues.length} != ${expectedLen}`);
        continue;
      }
      try {
        await client.query(
          `INSERT INTO ${PG_SCHEMA}.${pgTable} (${colNames}) VALUES ${valueSets.join(', ')}`,
          allValues
        );
        inserted += insertRows.length;
      } catch (err) {
        console.warn(`    Batch insert error: ${err.message}`);
      }
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
  const numCols = columns.length;
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

/**
 * Inserción fila a fila con valores campo a campo (cada columna con try/catch).
 * Para tablas con columnas sensibles (LOB, XMLType, LONG): si una fila falla
 * al insertar, se reintenta con esas columnas en null. Throttle cada N filas
 * y reintento en ENOBUFS para no saturar el socket (write ENOBUFS).
 */
function isDuplicateKeyError(err) {
  return err && (err.code === PG_UNIQUE_VIOLATION || IS_DUPLICATE_KEY.test(String(err.message || '')));
}

async function insertIntoPgRowByRow(client, tableName, columns, rows, sensitiveColNames) {
  if (rows.length === 0) return 0;
  const colNames = columns.map(c => `"${c.COLUMN_NAME.toLowerCase()}"`).join(', ');
  const pgTable = tableName.toLowerCase();
  const sensitiveSet = new Set((sensitiveColNames || []).map(n => n.toUpperCase()));
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
  const insertSql = `INSERT INTO ${PG_SCHEMA}.${pgTable} (${colNames}) VALUES (${placeholders})`;
  let inserted = 0;
  let failedRows = 0;
  let duplicateSkipped = 0;
  let rowIndex = 0;
  for (const row of rows) {
    rowIndex++;
    if (ROW_BY_ROW_THROTTLE_EVERY > 0 && rowIndex % ROW_BY_ROW_THROTTLE_EVERY === 0 && ROW_THROTTLE_MS > 0) {
      await sleep(ROW_THROTTLE_MS);
    }
    let values;
    try {
      values = safeRowValuesFieldByField(row, columns);
    } catch (e) {
      if (IS_INVALID_STRING_LENGTH.test(String(e && e.message))) {
        values = columns.map(() => null);
      } else {
        failedRows++;
        if (failedRows <= 3) console.warn(`    Row values error: ${(e && e.message) || e}`);
        continue;
      }
    }
    const tryInsert = async (vals, retriesLeft = 2) => {
      for (let r = 0; r <= retriesLeft; r++) {
        try {
          await client.query(insertSql, vals);
          return true;
        } catch (err) {
          if (isDuplicateKeyError(err)) throw err;
          const isEnobufs = (err.code === 'ENOBUFS' || (err.message && /ENOBUFS/i.test(err.message)));
          if (isEnobufs && r < retriesLeft) {
            await sleep(ROW_THROTTLE_MS * (10 + r * 5));
            continue;
          }
          throw err;
        }
      }
      return false;
    };
    try {
      if (await tryInsert(values)) inserted++;
    } catch (err) {
      if (isDuplicateKeyError(err)) {
        duplicateSkipped++;
        if (duplicateSkipped === 1) console.warn(`    Duplicate key(s) skipped (unique constraint, origen puede tener duplicados).`);
        continue;
      }
      const fallbackValues = columns.map((c, i) =>
        sensitiveSet.has((c.COLUMN_NAME || '').toUpperCase()) ? null : values[i]
      );
      try {
        if (await tryInsert(fallbackValues)) inserted++;
        else { failedRows++; if (failedRows <= 3) console.warn(`    Row insert error: ${err.message}`); }
      } catch (err2) {
        if (isDuplicateKeyError(err2)) {
          duplicateSkipped++;
          if (duplicateSkipped === 1) console.warn(`    Duplicate key(s) skipped (unique constraint, origen puede tener duplicados).`);
        } else {
          failedRows++;
          if (failedRows <= 3) console.warn(`    Row insert error (sensitive cols nulled): ${err2.message}`);
        }
      }
    }
  }
  if (duplicateSkipped > 0) console.warn(`    Filas omitidas por clave duplicada: ${duplicateSkipped}`);
  if (failedRows > 3) console.warn(`    ... y ${failedRows - 3} filas más con error de inserción.`);
  return inserted;
}

async function ensureSpuDatabase() {
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

async function main() {
  console.log('=== Backup Oracle SPU -> PostgreSQL ===');
  if (SYNC_FALTANTES) console.log('Modo: SYNC_FALTANTES (solo agrega filas nuevas, no borra tablas)\n');
  else if (RESYNC) console.log('Modo: RESYNC (resincronizar todas las tablas desde origen)\n');
  else console.log('Modo: incremental (reanudable)\n');

  if (!process.env.ORACLE_SPU_PASS && !process.env.ORACLE_SPU_PASSWORD) {
    console.error('Configure ORACLE_SPU_PASS en .env o config-puertos-libres.env');
    process.exit(1);
  }
  if (!oracleConfig.connectString) {
    console.error('Configure conexion Oracle SPU (origen remoto): ORACLE_SPU_HOST + ORACLE_SPU_SERVICE_NAME (y opcional ORACLE_SPU_PORT), o ORACLE_SPU_CONNECT_STRING. Debe ser la IP/host de la maquina donde esta Oracle SPU.');
    process.exit(1);
  }

  const progress = loadProgress();
  const completedSet = new Set(progress.completedTables || []);
  progress.tablesMeta = progress.tablesMeta || {};

  let pgClient;
  try {
    await ensureSpuDatabase();

    const pgConfig = { ...pgBaseConfig, database: PG_DATABASE };
    console.log('Conectando a PostgreSQL (' + PG_DATABASE + ')...');
    pgClient = new Client(pgConfig);
    await pgClient.connect();
    console.log('  OK PostgreSQL conectado\n');
    await pgClient.query(`CREATE SCHEMA IF NOT EXISTS ${PG_SCHEMA}`);

    let tables;
    let oracleConn = null;
    try {
      oracleConn = await retryWithBackoff(getOracleConnection, 'Oracle SPU connect');
      tables = await retryWithBackoff(() => getOracleTables(oracleConn), 'get tables');
      if (oracleConn) { await oracleConn.close(); oracleConn = null; }
    } catch (err) {
      console.error('No se pudo conectar a Oracle SPU:', err.message);
      console.log('\nConexion interrumpida o servidor no alcanzable. Re-ejecute cuando la red este disponible.');
      console.log('Tablas ya completadas:', completedSet.size);
      process.exit(1);
    }

    const skipEmpty = loadSkipEmptyTables();
    if (skipEmpty.size > 0) {
      const before = tables.length;
      tables = tables.filter(t => !skipEmpty.has(String(t).toUpperCase()));
      if (tables.length < before) console.log(`Tablas vacias excluidas (no se sincronizan): ${before - tables.length}\n`);
    }

    const protectedExcluded = tables.filter(isProtectedTable);
    if (protectedExcluded.length > 0) {
      tables = tables.filter(t => !isProtectedTable(t));
      console.log(`Tablas protegidas excluidas (seguridad/RBAC): ${protectedExcluded.length}`);
    }
    const excludeExcluded = tables.filter(t => SPU_TABLES_EXCLUDE.has(String(t).toUpperCase()));
    if (excludeExcluded.length > 0) {
      tables = tables.filter(t => !SPU_TABLES_EXCLUDE.has(String(t).toUpperCase()));
      console.log(`Tablas SPU excluidas (no necesarias): ${excludeExcluded.join(', ')}`);
    }

    const pending = SYNC_FALTANTES ? tables : (RESYNC ? tables : tables.filter(t => !completedSet.has(t)));
    const pendingLabel = SYNC_FALTANTES ? 'A revisar (solo faltantes)' : (RESYNC ? 'A resincronizar' : 'Pendientes');
    console.log(`Tablas SPU: ${tables.length} | ${pendingLabel}: ${pending.length} | Completadas (en sesion anterior): ${completedSet.size}\n`);

    if (pending.length === 0 && !RESYNC && !SYNC_FALTANTES) {
      console.log('Todas las tablas SPU ya estan respaldadas. Use RESYNC=1 para volver a copiar desde origen o SYNC_FALTANTES=1 para solo agregar datos nuevos.');
      const metaPath = path.join(BACKUP_DIR, `backup_spu_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`);
      fs.writeFileSync(metaPath, JSON.stringify({ ...progress, completed: true }, null, 2), 'utf8');
      console.log('Metadata:', metaPath);
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
              progress.tablesMeta[tableName] = { rows: 0, at: new Date().toISOString() };
              saveProgress(progress);
            }
            console.log('0 filas (tabla vacia)');
            tableSuccess = true;
            continue;
          }

          const lobColumns = getLobColumns(columns);
          const insertColumns = lobColumns.length > 0
            ? columns.concat(lobColumns.map(c => ({ COLUMN_NAME: c.COLUMN_NAME + '_path', DATA_TYPE: 'VARCHAR2' })))
            : columns;
          const pks = await getPrimaryKeys(conn, tableName);
          const pkCols = (pks && pks[0] && pks[0].columns) ? pks[0].columns.map(c => c.toLowerCase()) : [];
          const exists = await tableExists(pgClient, tableName);

          if (SYNC_FALTANTES && exists && pkCols.length === 0) {
            console.log('omitida (sin PK, no se puede hacer ON CONFLICT)');
            tableSuccess = true;
          } else if (SYNC_FALTANTES && exists && pkCols.length > 0) {
            let inserted = 0;
            const onBatchAppend = async (rows) => {
              if (hasSensitiveColumns(columns)) {
                inserted += await insertIntoPgRowByRow(pgClient, tableName, insertColumns, rows, getSensitiveColumnNames(columns));
              } else {
                inserted += await insertIntoPgAppend(pgClient, tableName, columns, pkCols, rows);
              }
            };
            const useLobBatch = getLobColumns(columns).length > 0 || hasSensitiveColumns(columns);
            await retryWithBackoff(
              () => useLobBatch
                ? exportTableFromOracleBatch(conn, tableName, columns, onBatchAppend)
                : exportTableFromOracleStreaming(conn, tableName, onBatchAppend),
              `export ${tableName}`
            );
            if (conn) { try { await conn.close(); } catch (e) {} conn = null; }
            console.log(`${inserted} filas nuevas (solo faltantes)`);
            tableSuccess = true;
          } else {
          await createPgTable(pgClient, tableName, columns, lobColumns, false);
          for (const pk of pks) await addPrimaryKey(pgClient, tableName, pk);
          const fks = await getForeignKeys(conn, tableName);
          fksToAdd.push({ tableName, fks });

          let inserted = 0;
          const jsonChunks = [];
          let collectJson = true;
          const onBatch = async (rows) => {
            if (hasSensitiveColumns(columns)) {
              inserted += await insertIntoPgRowByRow(pgClient, tableName, insertColumns, rows, getSensitiveColumnNames(columns));
            } else {
              inserted += await insertIntoPg(pgClient, tableName, columns, rows);
            }
            if (collectJson) {
                const plain = rows.map(row => {
                  const o = {};
                  columns.forEach(c => { o[c.COLUMN_NAME] = safeFormatValue(row, c.COLUMN_NAME); });
                  return o;
                });
              jsonChunks.push(...plain);
              if (jsonChunks.length > SKIP_JSON_OVER_ROWS) {
                jsonChunks.length = 0;
                collectJson = false;
              }
            }
          };

          const useLobBatch = getLobColumns(columns).length > 0 || hasSensitiveColumns(columns);
          const { totalRows } = await retryWithBackoff(
            () => useLobBatch
              ? exportTableFromOracleBatch(conn, tableName, columns, onBatch)
              : exportTableFromOracleStreaming(conn, tableName, onBatch),
            `export ${tableName}`
          );

          if (conn) { try { await conn.close(); } catch (e) {} conn = null; }

          if (jsonChunks.length > 0 && totalRows <= SKIP_JSON_OVER_ROWS) {
            const jsonPath = path.join(BACKUP_DIR, `spu_${tableName}.json`);
            fs.writeFileSync(jsonPath, JSON.stringify(jsonChunks, null, 0), 'utf8');
          }

          progress.completedTables.push(tableName);
          progress.tablesMeta[tableName] = { rows: totalRows, inserted, at: new Date().toISOString() };
          saveProgress(progress);

          const jsonNote = totalRows > SKIP_JSON_OVER_ROWS ? ' (sin JSON)' : '';
          console.log(`${totalRows} filas -> PG (${inserted} insertadas)${jsonNote}`);
          tableSuccess = true;
          }
        } catch (err) {
          if (conn) { try { await conn.close(); } catch (e) {} }
          console.log(`ERROR: ${err.message}`);
          if (isConnectionError(err)) {
            saveProgress(progress);
            if (tableAttempt < MAX_TABLE_RETRIES) {
              const delay = RETRY_DELAY_MS * Math.pow(2, tableAttempt);
              console.warn(`  Conexion interrumpida. Reintento en ${delay / 1000}s...`);
              await sleep(delay);
            } else {
              console.error('\nConexion inestable. Progreso guardado. Re-ejecute el script para continuar.');
              process.exit(1);
            }
          } else {
            progress.tablesMeta[tableName] = { error: err.message, at: new Date().toISOString() };
            saveProgress(progress);
            console.log('  Progreso guardado. Re-ejecute para continuar.');
            break;
          }
        }
      }
    }

    // Solo añadir FK si la tabla referenciada existe en medisena (t_*)
    const pgTableSet = new Set();
    const pgTablesRes = await pgClient.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = $1 AND table_type = 'BASE TABLE' AND table_name LIKE 't_%'`,
      [PG_SCHEMA]
    );
    const pgTables = (pgTablesRes.rows || []).map(r => r.table_name);
    pgTables.forEach(t => pgTableSet.add(t.toLowerCase()));

    // Full/Resync: FKs recolectadas en fksToAdd. Solo faltantes: asegurar FKs desde Oracle al final.
    if (SYNC_FALTANTES && pgTables.length > 0) {
      const existingFkRes = await pgClient.query(`
        SELECT tc.table_name, string_agg(kcu.column_name, ',' ORDER BY kcu.ordinal_position) AS cols,
               ccu.table_name AS ref_table, string_agg(ccu.column_name, ',' ORDER BY kcu.ordinal_position) AS ref_cols
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
        WHERE tc.table_schema = $1 AND tc.constraint_type = 'FOREIGN KEY' AND tc.table_name LIKE 't_%'
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
        oraConn = await retryWithBackoff(getOracleConnection, 'Oracle SPU (FKs faltantes)');
        let added = 0;
        for (const pgTable of pgTables) {
          const fks = await getForeignKeys(oraConn, pgTable.toUpperCase());
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
              console.warn(`  FK ${pgTable}.${fk.constraintName}: ${e.message}`);
            }
          }
        }
        if (added > 0) console.log(`\n  FKs SPU añadidas (solo faltantes): ${added}`);
      } finally {
        if (oraConn) { try { await oraConn.close(); } catch (e) {} }
      }
    } else {
      for (const { tableName, fks } of fksToAdd) {
        for (const fk of fks) {
          const refTable = (fk.refTable || '').toUpperCase();
          const refTableLower = refTable.toLowerCase();
          if (skippedEmptyTables.has(refTable) || !pgTableSet.has(refTableLower)) continue;
          try {
            await addForeignKey(pgClient, tableName, fk);
          } catch (e) {
            console.warn(`  FK ${tableName}.${fk.constraintName}: ${e.message}`);
          }
        }
      }
    }

    const metaPath = path.join(BACKUP_DIR, `backup_spu_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`);
    fs.writeFileSync(metaPath, JSON.stringify({ ...progress, completed: progress.completedTables.length === tables.length }, null, 2), 'utf8');
    console.log(`\nProgreso: ${progress.completedTables.length}/${tables.length} tablas`);
    console.log('Backups en:', BACKUP_DIR);

  } catch (err) {
    const msg = err && (err.errors && err.errors.length ? err.errors.map(e => e.message || e).join('; ') : (err.message || err.toString()));
    console.error('\nError:', msg || err);
    process.exit(1);
  } finally {
    if (pgClient) { try { await pgClient.end(); } catch (e) {} }
  }

  console.log('\n=== Backup SPU finalizado ===');
}

main().catch(err => {
  const msg = err && (err.errors && err.errors.length ? err.errors.map(e => e.message || e).join('; ') : (err.message || err.toString()));
  console.error('Fatal:', msg || err);
  process.exit(1);
});
