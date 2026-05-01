#!/usr/bin/env node
/**
 * Corrige discrepancias Oracle vs PostgreSQL
 * Re-exporta las tablas con diferencias (TRUNCATE + re-import)
 * Uso: cd scripts/db-backup && node fix-migration-discrepancies.js
 */

const path = require('path');
const root = path.join(__dirname, '../..');
['.env', 'config-puertos-libres.env'].forEach(f => {
  require('dotenv').config({ path: path.join(root, f) });
});
const oracledb = require('oracledb');
const { Client } = require('pg');
const fs = require('fs');

const oracleConfig = {
  user: process.env.ORACLE_USER || process.env.ORACLE_USERNAME || 'sma',
  password: process.env.ORACLE_PASS || process.env.ORACLE_PASSWORD || 'S3na2021',
  connectString: process.env.ORACLE_CONNECT_STRING || process.env.ORACLE_URL ||
    (process.env.ORACLE_PROD_HOST && process.env.ORACLE_PROD_SERVICE_NAME
      ? `${process.env.ORACLE_PROD_HOST}:${process.env.ORACLE_PROD_PORT || 1521}/${process.env.ORACLE_PROD_SERVICE_NAME}`
      : '172.24.247.124:1521/SMEDICO1_PDB_SMEDICO1.paas.oracle.com')
};

const pgConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5433,
  user: process.env.POSTGRES_USER || 'medisena',
  password: process.env.POSTGRES_PASSWORD || 'medisena_local',
  database: process.env.POSTGRES_DB || 'medisena_backup'
};

const { BACKUP_DIR } = require('./config');
const SCHEMA = process.env.ORACLE_SCHEMA || 'SMA';
const BATCH_SIZE = 1000;
const PROTECTED_TABLE_PREFIXES = ['AUTH_', 'RBAC_'];

function isProtectedTable(tableName) {
  const upper = String(tableName || '').toUpperCase();
  return PROTECTED_TABLE_PREFIXES.some(prefix => upper.startsWith(prefix));
}

function oracleTypeToPg(t) {
  const x = (t || '').toUpperCase();
  if (x.includes('NUMBER')) return 'NUMERIC';
  if (x.includes('VARCHAR') || x.includes('CHAR')) return 'TEXT';
  if (x.includes('DATE') || x.includes('TIMESTAMP')) return 'TIMESTAMP';
  if (x.includes('CLOB') || x.includes('BLOB')) return 'TEXT';
  return 'TEXT';
}

function formatValue(val) {
  if (val === null || val === undefined) return null;
  if (val instanceof Date) return val;
  if (typeof val === 'object' && val.toISOString) return val.toISOString();
  return val;
}

async function getOracleConnection() {
  try { oracledb.initOracleClient(); } catch (e) {}
  return oracledb.getConnection(oracleConfig);
}

async function getTableColumns(conn, tableName) {
  const r = await conn.execute(
    `SELECT COLUMN_NAME, DATA_TYPE FROM ALL_TAB_COLUMNS 
     WHERE OWNER = :owner AND TABLE_NAME = :tableName ORDER BY COLUMN_ID`,
    { owner: SCHEMA, tableName },
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );
  return r.rows;
}

async function exportStreaming(conn, tableName, onBatch) {
  const columns = await getTableColumns(conn, tableName);
  const colNames = columns.map(c => `"${c.COLUMN_NAME}"`).join(', ');
  const result = await conn.execute(
    `SELECT ${colNames} FROM ${SCHEMA}.${tableName}`,
    [],
    { resultSet: true, outFormat: oracledb.OUT_FORMAT_OBJECT, fetchArraySize: BATCH_SIZE }
  );
  const rs = result.resultSet;
  let total = 0;
  let rows;
  while ((rows = await rs.getRows(BATCH_SIZE)) && rows.length > 0) {
    total += rows.length;
    await onBatch(rows);
  }
  await rs.close();
  return { columns, total };
}

async function createPgTable(client, tableName, columns) {
  const colDefs = columns.map(c =>
    `"${c.COLUMN_NAME.toLowerCase()}" ${oracleTypeToPg(c.DATA_TYPE)}`
  ).join(', ');
  const pgTable = tableName.toLowerCase();
  await client.query(`DROP TABLE IF EXISTS sma.${pgTable} CASCADE`);
  await client.query(`CREATE TABLE sma.${pgTable} (${colDefs})`);
}

async function insertBatch(client, tableName, columns, rows) {
  if (rows.length === 0) return 0;
  const colNames = columns.map(c => `"${c.COLUMN_NAME.toLowerCase()}"`).join(', ');
  const pgTable = tableName.toLowerCase();
  const valueSets = [];
  const allValues = [];
  let idx = 1;
  for (const row of rows) {
    valueSets.push(columns.map(() => `$${idx++}`).join(', '));
    columns.forEach(c => allValues.push(formatValue(row[c.COLUMN_NAME])));
  }
  const sql = `INSERT INTO sma.${pgTable} (${colNames}) VALUES ${valueSets.map(p => `(${p})`).join(', ')}`;
  await client.query(sql, allValues);
  return rows.length;
}

async function reexportTable(pgClient, tableName) {
  const conn = await getOracleConnection();
  try {
    const columns = await getTableColumns(conn, tableName);
    await createPgTable(pgClient, tableName, columns);

    let inserted = 0;
    const { total } = await exportStreaming(conn, tableName, async (rows) => {
      inserted += await insertBatch(pgClient, tableName, columns, rows);
    });
    return { total, inserted };
  } finally {
    try { await conn.close(); } catch (e) {}
  }
}

async function main() {
  console.log('=== Corrección de discrepancias Oracle -> PostgreSQL ===\n');

  const reports = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('verification_') && f.endsWith('.json'))
    .sort()
    .reverse();
  const reportPath = path.join(BACKUP_DIR, reports[0]);
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

  const toFix = report.results.filter(r => r.status === 'DIFERENCIA' && r.diff > 0 && !isProtectedTable(r.table));
  if (toFix.length === 0) {
    console.log('No hay tablas con discrepancias para corregir.');
    return;
  }

  console.log(`Tablas a re-exportar: ${toFix.map(t => t.table).join(', ')}\n`);

  const pgClient = new Client(pgConfig);
  await pgClient.connect();

  for (const { table } of toFix) {
    process.stdout.write(`  ${table}... `);
    try {
      const { total, inserted } = await reexportTable(pgClient, table);
      console.log(`${total} filas (${inserted} insertadas)`);
    } catch (err) {
      console.log(`ERROR: ${err.message}`);
    }
  }

  await pgClient.end();
  console.log('\nEjecuta "npm run verify" para confirmar.');
}

main().catch(e => { console.error(e); process.exit(1); });
