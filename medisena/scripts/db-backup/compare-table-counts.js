#!/usr/bin/env node
/**
 * Compara cantidad de filas entre una tabla en Oracle SPU (origen) y PostgreSQL Medisena (destino).
 * Uso: node compare-table-counts.js T_CERTIFICADOS
 */
const path = require('path');
const root = path.join(__dirname, '../..');
['.env', 'config-puertos-libres.env'].forEach(f => {
  require('dotenv').config({ path: path.join(root, f) });
});

const oracledb = require('oracledb');
const { Client } = require('pg');
const fs = require('fs');

const SCHEMA_ORACLE = process.env.ORACLE_SPU_SCHEMA || 'SPUSMA';
const PG_SCHEMA = 'medisena';
const PG_DATABASE = process.env.MEDISENA_DB || process.env.POSTGRES_DB || 'medisena';

const oracleConfig = {
  user: process.env.ORACLE_SPU_USER || 'SPUSMA',
  password: process.env.ORACLE_SPU_PASS || process.env.ORACLE_SPU_PASSWORD || '',
  connectString: (process.env.ORACLE_SPU_HOST && process.env.ORACLE_SPU_SERVICE_NAME)
    ? `${process.env.ORACLE_SPU_HOST}:${process.env.ORACLE_SPU_PORT || '1521'}/${process.env.ORACLE_SPU_SERVICE_NAME}`
    : process.env.ORACLE_SPU_CONNECT_STRING || '',
  poolMin: 0,
  poolMax: 1
};

const pgConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5433', 10),
  user: process.env.POSTGRES_USER || 'medisena',
  password: process.env.POSTGRES_PASSWORD || 'medisena_local',
  database: PG_DATABASE
};

async function getOracleCount(conn, tableName) {
  const fullTable = `${SCHEMA_ORACLE}.${tableName}`;
  const r = await conn.execute(
    `SELECT COUNT(*) AS CNT FROM ${fullTable}`,
    [],
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );
  return Number((r.rows && r.rows[0]) ? r.rows[0].CNT : 0);
}

async function getPgCount(client, tableName) {
  const pgTable = tableName.toLowerCase();
  const r = await client.query(
    `SELECT COUNT(*) AS cnt FROM ${PG_SCHEMA}.${pgTable}`
  );
  return Number((r.rows && r.rows[0]) ? r.rows[0].cnt : 0);
}

async function main() {
  const tableName = (process.argv[2] || 'T_CERTIFICADOS').toUpperCase();
  const pgTable = tableName.toLowerCase();

  console.log(`\n=== Comparación origen (Oracle SPU) vs destino (PostgreSQL MediSENA) ===`);
  console.log(`Tabla: ${tableName} / ${pgTable}\n`);

  if (!oracleConfig.connectString || !oracleConfig.password) {
    console.error('Falta configurar ORACLE_SPU_* y ORACLE_SPU_PASS.');
    process.exit(1);
  }

  let oracleCount = null;
  let pgCount = null;

  try {
    if (typeof oracledb.initOracleClient === 'function') {
      try { oracledb.initOracleClient(); } catch (e) { if (!e.message.includes('already been called')) {} }
    }
  } catch (e) {}

  const conn = await oracledb.getConnection(oracleConfig);
  try {
    oracleCount = await getOracleCount(conn, tableName);
    console.log(`  Origen (Oracle SPU ${SCHEMA_ORACLE}.${tableName}): ${oracleCount} filas`);
  } finally {
    await conn.close();
  }

  const pgClient = new Client(pgConfig);
  await pgClient.connect();
  try {
    pgCount = await getPgCount(pgClient, tableName);
    console.log(`  Destino (PostgreSQL ${PG_SCHEMA}.${pgTable}):    ${pgCount} filas`);
  } finally {
    await pgClient.end();
  }

  const diff = (oracleCount || 0) - (pgCount || 0);
  console.log(`  Diferencia (origen - destino): ${diff}\n`);

  if (diff === 0) {
    console.log('No hay diferencia; las cantidades coinciden.\n');
    return;
  }

  console.log('Posibles causas de la diferencia:\n');
  console.log('1. T_CERTIFICADOS tiene columnas LOB (CLOB/BLOB). En el script de sincronización');
  console.log('   esta tabla está en LOB_ALWAYS_TO_FILE_TABLES: cada LOB se escribe a archivo.');
  console.log('   Si alguna fila falla al leer el LOB o al insertar (ej. valor demasiado grande,');
  console.log('   error de conversión), esa fila se omite o se inserta con LOB en NULL.');
  console.log('');
  console.log('2. Filas con error en inserción: el script usa inserción fila a fila para tablas');
  console.log('   sensibles; si una fila falla tras reintentar con columnas sensibles en NULL,');
  console.log('   no se inserta y se cuenta como "failedRows".');
  console.log('');
  console.log('3. Duplicados por clave única: si una fila repite PK o índice único, solo se');
  console.log('   inserta la primera y el resto se omiten.');
  console.log('');
  console.log('4. Sincronización interrumpida: si el proceso se detuvo antes de terminar la');
  console.log('   tabla, el destino tendrá menos filas.');
  console.log('');

  const { BACKUP_DIR } = require('./config');
  const progressPath = path.join(BACKUP_DIR, 'backup_progress_spu.json');
  if (fs.existsSync(progressPath)) {
    const progress = JSON.parse(fs.readFileSync(progressPath, 'utf8'));
    const meta = (progress.tablesMeta || {})[tableName];
    if (meta) {
      console.log('Datos del último sync (backup_progress_spu.json):');
      console.log('  Filas leídas (export):', meta.rows);
      console.log('  Filas insertadas:     ', meta.inserted);
      if (meta.error) console.log('  Error registrado:     ', meta.error);
      console.log('');
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
