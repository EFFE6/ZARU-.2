#!/usr/bin/env node
/**
 * Verificación de migración Oracle -> PostgreSQL
 * Compara conteos por tabla y opcionalmente muestra discrepancias
 * Uso: cd scripts/db-backup && node verify-migration.js
 * SPU: VERIFY_SPU=1 node verify-migration.js   o   npm run verify:spu
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

const spuHost = process.env.ORACLE_SPU_HOST || '';
const spuPort = process.env.ORACLE_SPU_PORT || '1521';
const spuService = process.env.ORACLE_SPU_SERVICE_NAME || '';
const spuConnectString = (spuHost && spuService)
  ? `${spuHost}:${spuPort}/${spuService}`
  : (process.env.ORACLE_SPU_CONNECT_STRING || '');

const oracleConfig = IS_SPU
  ? {
      user: process.env.ORACLE_SPU_USER || 'SPUSMA',
      password: process.env.ORACLE_SPU_PASS || process.env.ORACLE_SPU_PASSWORD || '',
      connectString: spuConnectString
    }
  : {
      user: process.env.ORACLE_USER || process.env.ORACLE_USERNAME || 'sma',
      password: process.env.ORACLE_PASS || process.env.ORACLE_PASSWORD || 'S3na2021',
      connectString: process.env.ORACLE_CONNECT_STRING || process.env.ORACLE_URL ||
        (process.env.ORACLE_PROD_HOST && process.env.ORACLE_PROD_SERVICE_NAME
          ? `${process.env.ORACLE_PROD_HOST}:${process.env.ORACLE_PROD_PORT || 1521}/${process.env.ORACLE_PROD_SERVICE_NAME}`
          : '172.24.247.124:1521/SMEDICO1_PDB_SMEDICO1.paas.oracle.com')
    };

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
      port: process.env.POSTGRES_PORT || 5433,
      user: process.env.POSTGRES_USER || 'medisena',
      password: process.env.POSTGRES_PASSWORD || 'medisena_local',
      database: process.env.POSTGRES_DB || 'medisena_backup'
    };

const { BACKUP_DIR } = require('./config');
const SCHEMA = IS_SPU ? (process.env.ORACLE_SPU_SCHEMA || 'SPUSMA') : (process.env.ORACLE_SCHEMA || 'SMA');
const PG_SCHEMA = IS_SPU ? 'spu' : 'sma';
const PROGRESS_FILE = path.join(BACKUP_DIR, IS_SPU ? 'backup_progress_spu.json' : 'backup_progress.json');
const SAMPLE_ROWS = parseInt(process.env.VERIFY_SAMPLE_ROWS || '5', 10);

async function getOracleConnection() {
  try { oracledb.initOracleClient(); } catch (e) {}
  return oracledb.getConnection(oracleConfig);
}

async function getOracleTables(conn) {
  const r = await conn.execute(
    `SELECT TABLE_NAME FROM ALL_TABLES WHERE OWNER = :owner AND TABLE_NAME LIKE 'SMA_%' ORDER BY TABLE_NAME`,
    { owner: SCHEMA },
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );
  return r.rows.map(x => x.TABLE_NAME);
}

async function getOracleCount(conn, tableName) {
  const r = await conn.execute(
    `SELECT COUNT(*) as CNT FROM ${SCHEMA}.${tableName}`,
    [],
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );
  return parseInt(r.rows[0].CNT, 10);
}

async function getPgCount(client, tableName) {
  const pgTable = tableName.toLowerCase();
  const r = await client.query(`SELECT COUNT(*) as cnt FROM ${PG_SCHEMA}.${pgTable}`);
  return parseInt(r.rows[0].cnt, 10);
}

function formatNum(n) {
  return n.toLocaleString('es-CO');
}

async function main() {
  console.log('=== Verificación de migración Oracle -> PostgreSQL ===');
  if (IS_SPU) console.log('(Modo SPU)\n');
  else console.log('');

  const progress = (() => {
    try {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
    } catch {
      return { completedTables: [] };
    }
  })();

  const tablesToVerify = progress.completedTables || [];
  if (tablesToVerify.length === 0) {
    console.log('No hay tablas en backup_progress. Ejecuta el backup primero.');
    process.exit(1);
  }

  let oracleConn;
  let pgClient;

  try {
    // Conectar Oracle
    console.log('Conectando a Oracle...');
    oracleConn = await getOracleConnection();
    console.log('  OK\n');

    // Conectar PostgreSQL
    console.log('Conectando a PostgreSQL...');
    pgClient = new Client(pgConfig);
    await pgClient.connect();
    console.log('  OK\n');

    console.log('Comparando conteos por tabla:\n');
    console.log('| Tabla | Oracle | PostgreSQL | Estado |');
    console.log('|-------|--------|------------|--------|');

    const results = [];
    let ok = 0;
    let fail = 0;

    for (const tableName of tablesToVerify) {
      let oracleCnt, pgCnt;
      try {
        oracleCnt = await getOracleCount(oracleConn, tableName);
        pgCnt = await getPgCount(pgClient, tableName);
      } catch (err) {
        results.push({ table: tableName, oracle: '?', pg: '?', status: 'ERROR', err: err.message });
        fail++;
        continue;
      }

      const match = oracleCnt === pgCnt;
      const status = match ? 'OK' : 'DIFERENCIA';
      if (match) ok++; else fail++;

      results.push({
        table: tableName,
        oracle: oracleCnt,
        pg: pgCnt,
        diff: oracleCnt - pgCnt,
        status
      });

      const statusIcon = match ? '✓' : '✗';
      const diffStr = match ? '' : ` (${oracleCnt > pgCnt ? '-' : '+'}${Math.abs(oracleCnt - pgCnt)})`;
      console.log(`| ${tableName} | ${formatNum(oracleCnt)} | ${formatNum(pgCnt)} | ${statusIcon} ${status}${diffStr} |`);
    }

    // Resumen
    console.log('\n--- Resumen ---');
    console.log(`Total tablas: ${tablesToVerify.length}`);
    console.log(`Coinciden: ${ok}`);
    console.log(`Discrepancias: ${fail}`);

    if (fail > 0) {
      const diffs = results.filter(r => r.status === 'DIFERENCIA');
      console.log('\nTablas con discrepancia:');
      diffs.forEach(r => {
        console.log(`  ${r.table}: Oracle=${formatNum(r.oracle)} vs PG=${formatNum(r.pg)} (diff: ${r.diff})`);
      });
    }

    // Guardar reporte
    const reportPath = path.join(BACKUP_DIR, `verification_${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`);
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      total: tablesToVerify.length,
      ok,
      fail,
      results
    }, null, 2), 'utf8');
    console.log(`\nReporte guardado: ${reportPath}`);

    process.exit(fail > 0 ? 1 : 0);

  } catch (err) {
    console.error('\nError:', err.message);
    process.exit(1);
  } finally {
    if (oracleConn) try { await oracleConn.close(); } catch (e) {}
    if (pgClient) try { await pgClient.end(); } catch (e) {}
  }
}

main();
