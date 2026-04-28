#!/usr/bin/env node
/**
 * Verificación completa de migración Oracle -> PostgreSQL
 * - Conteo de filas (Oracle vs PG)
 * - Tamaño de tablas en PG (bytes/MB)
 * - Estadísticas de columnas LOB: filas con contenido en DB vs filas con _path (archivo)
 *
 * Uso:
 *   node verify-migration-full.js           # SMA
 *   VERIFY_SPU=1 node verify-migration-full.js   # SPU
 *   VERIFY_SIZES_ONLY=1 node verify-migration-full.js   # Solo tamaños en PG (sin Oracle)
 */
const path = require('path');
const root = path.join(__dirname, '../..');
['.env', 'config-puertos-libres.env'].forEach(f => {
  require('dotenv').config({ path: path.join(root, f) });
});
const oracledb = require('oracledb');
const { Client } = require('pg');
const fs = require('fs');

const IS_SPU = process.env.VERIFY_SPU === '1' || process.env.VERIFY_SPU === 'true';
const SIZES_ONLY = process.env.VERIFY_SIZES_ONLY === '1' || process.env.VERIFY_SIZES_ONLY === 'true';

const pgConfig = IS_SPU
  ? {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5433', 10),
      user: process.env.POSTGRES_USER || 'medisena',
      password: process.env.POSTGRES_PASSWORD || 'medisena_local',
      database: process.env.POSTGRES_SPU_DB || 'spu_backup'
    }
  : {
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5433', 10),
      user: process.env.POSTGRES_USER || 'medisena',
      password: process.env.POSTGRES_PASSWORD || 'medisena_local',
      database: process.env.POSTGRES_DB || 'medisena_backup'
    };

const { BACKUP_DIR } = require('./config');
const PG_SCHEMA = IS_SPU ? 'spu' : 'sma';
const PROGRESS_FILE = path.join(BACKUP_DIR, IS_SPU ? 'backup_progress_spu.json' : 'backup_progress.json');
const SCHEMA = IS_SPU ? (process.env.ORACLE_SPU_SCHEMA || 'SPUSMA') : (process.env.ORACLE_SCHEMA || 'SMA');

const oracleConfig = IS_SPU
  ? {
      user: process.env.ORACLE_SPU_USER || 'SPUSMA',
      password: process.env.ORACLE_SPU_PASS || process.env.ORACLE_SPU_PASSWORD || '',
      connectString: (process.env.ORACLE_SPU_HOST && process.env.ORACLE_SPU_SERVICE_NAME)
        ? `${process.env.ORACLE_SPU_HOST}:${process.env.ORACLE_SPU_PORT || '1521'}/${process.env.ORACLE_SPU_SERVICE_NAME}`
        : process.env.ORACLE_SPU_CONNECT_STRING || ''
    }
  : {
      user: process.env.ORACLE_USER || process.env.ORACLE_USERNAME || 'sma',
      password: process.env.ORACLE_PASS || process.env.ORACLE_PASSWORD || 'S3na2021',
      connectString: process.env.ORACLE_CONNECT_STRING || process.env.ORACLE_URL || ''
    };

function formatNum(n) {
  return n == null ? '?' : n.toLocaleString('es-CO');
}

function formatBytes(bytes) {
  if (bytes == null || bytes === 0) return '0 B';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(2)} MB`;
  return `${(bytes / 1024).toFixed(2)} KB`;
}

async function getPgTables(client) {
  const r = await client.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = $1 AND table_type = 'BASE TABLE' ORDER BY table_name`,
    [PG_SCHEMA]
  );
  return (r.rows || []).map(x => x.table_name);
}

async function getPgCount(client, tableName) {
  const r = await client.query(`SELECT COUNT(*)::bigint as cnt FROM ${PG_SCHEMA}.${tableName}`);
  return parseInt(r.rows[0].cnt, 10);
}

async function getPgTableSize(client, tableName) {
  try {
    const r = await client.query(
      `SELECT pg_total_relation_size($1::regclass)::bigint as size`,
      [`${PG_SCHEMA}.${tableName}`]
    );
    return r.rows[0] && r.rows[0].size != null ? Number(r.rows[0].size) : 0;
  } catch {
    return null;
  }
}

/** Columnas que terminan en _path (referencia a archivo LOB) y su columna base (ej: contenido_path -> contenido) */
async function getPathColumns(client, tableName) {
  try {
    const r = await client.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = $1 AND table_name = $2 AND column_name LIKE '%_path'`,
      [PG_SCHEMA, tableName]
    );
  return (r.rows || []).map(x => x.column_name);
  } catch {
    return [];
  }
}

async function getLobStats(client, tableName, pathColumns) {
  const stats = {};
  for (const pathCol of pathColumns) {
    const baseCol = pathCol.replace(/_path$/, '');
    try {
      const r = await client.query(
        `SELECT
           COUNT(*) FILTER (WHERE "${baseCol}" IS NOT NULL AND "${baseCol}"::text <> '') as in_db,
           COUNT(*) FILTER (WHERE "${pathCol}" IS NOT NULL AND "${pathCol}" <> '') as in_file,
           COALESCE(SUM(OCTET_LENGTH("${baseCol}")) FILTER (WHERE "${baseCol}" IS NOT NULL), 0)::bigint as bytes_in_db
         FROM ${PG_SCHEMA}.${tableName}`,
        []
      );
      const row = r.rows[0];
      stats[baseCol] = {
        rowsWithContentInDb: parseInt(row.in_db || 0, 10),
        rowsWithPath: parseInt(row.in_file || 0, 10),
        bytesInDb: row.bytes_in_db != null ? Number(row.bytes_in_db) : 0
      };
    } catch (e) {
      try {
        const r = await client.query(
          `SELECT
             COUNT(*) FILTER (WHERE "${baseCol}" IS NOT NULL) as in_db,
             COUNT(*) FILTER (WHERE "${pathCol}" IS NOT NULL AND "${pathCol}" <> '') as in_file
             FROM ${PG_SCHEMA}.${tableName}`,
          []
        );
        const row = r.rows[0];
        stats[baseCol] = {
          rowsWithContentInDb: parseInt(row.in_db || 0, 10),
          rowsWithPath: parseInt(row.in_file || 0, 10),
          bytesInDb: null
        };
      } catch {
        stats[baseCol] = { rowsWithContentInDb: null, rowsWithPath: null, bytesInDb: null };
      }
    }
  }
  return stats;
}

async function getOracleCount(conn, tableName) {
  try {
    const r = await conn.execute(
      `SELECT COUNT(*) as CNT FROM ${SCHEMA}.${tableName}`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return parseInt(r.rows[0].CNT, 10);
  } catch (e) {
    return null;
  }
}

async function main() {
  console.log('=== Verificación completa de migración Oracle -> PostgreSQL ===');
  if (IS_SPU) console.log('(Modo SPU)\n');
  else console.log('(Modo SMA)\n');
  if (SIZES_ONLY) console.log('Solo tamaños en PG (sin comparar con Oracle).\n');

  const progress = (() => {
    try {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    } catch {
      return { completedTables: [] };
    }
  })();

  const pgClient = new Client(pgConfig);
  await pgClient.connect();

  let tableList = progress.completedTables || [];
  if (tableList.length === 0) {
    tableList = await getPgTables(pgClient);
    if (tableList.length === 0) {
      console.log('No hay tablas en progreso ni en PG. Ejecuta el backup primero.');
      await pgClient.end();
      process.exit(1);
    }
    console.log(`Usando lista de tablas desde PG (${tableList.length} tablas).\n`);
  }

  let oracleConn = null;
  if (!SIZES_ONLY) {
    try {
      oracledb.initOracleClient();
    } catch (e) {}
    try {
      oracleConn = await oracledb.getConnection(oracleConfig);
      console.log('Oracle: conectado');
    } catch (e) {
      console.log('Oracle: no disponible -', e.message);
      console.log('Se reportarán solo conteos y tamaños desde PG.\n');
    }
  }

  console.log('PostgreSQL: conectado\n');

  const results = [];
  let okCount = 0;
  let failCount = 0;

  console.log('| Tabla | Filas Oracle | Filas PG | Estado | Tamaño PG | LOB (en DB / en archivo) |');
  console.log('|-------|--------------|----------|--------|-----------|---------------------------|');

  for (const tableName of tableList) {
    const pgTable = tableName.toLowerCase();
    const rec = {
      table: tableName,
      oracleRows: null,
      pgRows: null,
      countMatch: null,
      pgSizeBytes: null,
      lobStats: null
    };

    let pgCnt = null;
    let oracleCnt = null;

    try {
      pgCnt = await getPgCount(pgClient, pgTable);
      rec.pgRows = pgCnt;
    } catch (e) {
      rec.pgRows = null;
      rec.countMatch = false;
      failCount++;
    }

    if (oracleConn && tableName) {
      oracleCnt = await getOracleCount(oracleConn, tableName);
      rec.oracleRows = oracleCnt;
      if (pgCnt != null && oracleCnt != null) {
        rec.countMatch = oracleCnt === pgCnt;
        if (rec.countMatch) okCount++; else failCount++;
      }
    } else if (pgCnt != null) {
      okCount++;
    }

    let sizeBytes = null;
    try {
      sizeBytes = await getPgTableSize(pgClient, pgTable);
      rec.pgSizeBytes = sizeBytes;
    } catch (_) {}

    const pathColumns = await getPathColumns(pgClient, pgTable); // pgTable ya en minúsculas
    let lobStr = '-';
    if (pathColumns.length > 0) {
      const lobStats = await getLobStats(pgClient, pgTable, pathColumns);
      rec.lobStats = lobStats;
      const parts = [];
      for (const [col, s] of Object.entries(lobStats)) {
        const inDb = s.rowsWithContentInDb != null ? formatNum(s.rowsWithContentInDb) : '?';
        const inFile = s.rowsWithPath != null ? formatNum(s.rowsWithPath) : '?';
        const bytes = s.bytesInDb != null ? formatBytes(s.bytesInDb) : '';
        parts.push(`${col}: ${inDb} / ${inFile}${bytes ? ` (${bytes})` : ''}`);
      }
      lobStr = parts.join('; ') || '-';
    }

    const status = rec.countMatch === false ? 'DIFERENCIA' : (rec.countMatch === true ? 'OK' : 'OK');
    const icon = rec.countMatch === false ? '✗' : '✓';
    const sizeStr = sizeBytes != null ? formatBytes(sizeBytes) : '?';
    console.log(`| ${tableName} | ${formatNum(oracleCnt)} | ${formatNum(pgCnt)} | ${icon} ${status} | ${sizeStr} | ${lobStr} |`);
    results.push(rec);
  }

  if (oracleConn) try { await oracleConn.close(); } catch (e) {}
  await pgClient.end();

  const totalTables = results.length;
  const withDiff = results.filter(r => r.countMatch === false);
  const totalPgBytes = results.reduce((s, r) => s + (r.pgSizeBytes || 0), 0);

  console.log('\n--- Resumen ---');
  console.log(`Tablas: ${totalTables}`);
  if (!SIZES_ONLY && oracleConn) {
    console.log(`Conteo OK: ${okCount}`);
    console.log(`Con discrepancias: ${failCount}`);
  }
  console.log(`Tamaño total en PG (tablas): ${formatBytes(totalPgBytes)}`);

  if (withDiff.length > 0) {
    console.log('\nTablas con diferencia de filas:');
    withDiff.forEach(r => console.log(`  ${r.table}: Oracle=${formatNum(r.oracleRows)} vs PG=${formatNum(r.pgRows)}`));
  }

  const reportPath = path.join(BACKUP_DIR, `verification_full_${IS_SPU ? 'spu' : 'sma'}_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`);
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    schema: PG_SCHEMA,
    totalTables,
    okCount,
    failCount,
    totalPgBytes,
    results
  }, null, 2), 'utf8');
  console.log(`\nReporte guardado: ${reportPath}`);

  process.exit(withDiff.length > 0 ? 1 : 0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
