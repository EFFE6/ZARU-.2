#!/usr/bin/env node
/**
 * Revisa Oracle para confirmar si SMA_RECIBOS_PAGO existe y cómo está configurada.
 * Valida qué faltó migrar a PostgreSQL.
 * Uso: cd scripts/db-backup && node check-oracle-recibos.js
 */

const path = require('path');
const root = path.join(__dirname, '../..');
['.env', 'config-puertos-libres.env'].forEach(f => {
  require('dotenv').config({ path: path.join(root, f) });
});

const oracledb = require('oracledb');
const { Client } = require('pg');
const { BACKUP_DIR } = require('./config');

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

const SCHEMA = process.env.ORACLE_SCHEMA || 'SMA';

async function getOracleConnection() {
  try {
    oracledb.initOracleClient();
  } catch (e) {
    if (!e.message.includes('already been called')) {
      console.warn('Oracle Init:', e.message);
    }
  }
  return oracledb.getConnection(oracleConfig);
}

async function main() {
  console.log('=== Revisión Oracle: SMA_RECIBOS_PAGO y tablas relacionadas ===\n');

  let oracleConn;
  let pgClient;

  try {
    // 1. Conectar Oracle
    console.log('Conectando a Oracle...');
    oracleConn = await getOracleConnection();
    console.log('  OK\n');

    // 2. Tablas SMA_* que contienen RECIBO, PAGO o EXCEDENTE
    const tablesLike = await oracleConn.execute(
      `SELECT TABLE_NAME FROM ALL_TABLES 
       WHERE OWNER = :owner AND TABLE_NAME LIKE 'SMA_%' 
         AND (TABLE_NAME LIKE '%RECIBO%' OR TABLE_NAME LIKE '%PAGO%' OR TABLE_NAME LIKE '%EXCEDENTE%')
       ORDER BY TABLE_NAME`,
      { owner: SCHEMA },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    console.log('1. Tablas en Oracle (RECIBO/PAGO/EXCEDENTE):');
    if (!tablesLike.rows || tablesLike.rows.length === 0) {
      console.log('   (ninguna encontrada)\n');
    } else {
      tablesLike.rows.forEach(r => console.log('   -', r.TABLE_NAME));
      console.log('');
    }

    // 3. ¿Existe SMA_RECIBOS_PAGO específicamente?
    const existsRecibosPago = tablesLike.rows.some(r => r.TABLE_NAME === 'SMA_RECIBOS_PAGO');
    if (!existsRecibosPago) {
      console.log('2. SMA_RECIBOS_PAGO: NO EXISTE en Oracle\n');
      console.log('   Las rutas de excedentes esperan esta tabla legacy.');
      console.log('   En Oracle los datos podrían estar en otra tabla (ej. SMA_RECIBOS_CAJA).\n');
    } else {
      console.log('2. SMA_RECIBOS_PAGO: EXISTE en Oracle\n');

      // Columnas
      const cols = await oracleConn.execute(
        `SELECT COLUMN_NAME, DATA_TYPE, DATA_LENGTH 
         FROM ALL_TAB_COLUMNS 
         WHERE OWNER = :owner AND TABLE_NAME = 'SMA_RECIBOS_PAGO' 
         ORDER BY COLUMN_ID`,
        { owner: SCHEMA },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      console.log('3. Columnas de SMA_RECIBOS_PAGO:');
      cols.rows.forEach(r => console.log(`   - ${r.COLUMN_NAME} (${r.DATA_TYPE})`));
      console.log('');

      // Conteo
      const count = await oracleConn.execute(
        `SELECT COUNT(*) as CNT FROM ${SCHEMA}.SMA_RECIBOS_PAGO`,
        [],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      const cnt = parseInt(count.rows[0].CNT, 10);
      console.log('4. Registros en SMA_RECIBOS_PAGO:', cnt.toLocaleString('es-CO'));
      if (cnt > 0) {
        const sample = await oracleConn.execute(
          `SELECT * FROM (SELECT * FROM ${SCHEMA}.SMA_RECIBOS_PAGO WHERE ROWNUM <= 1)`,
          [],
          { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        console.log('\n5. Muestra (1 fila):');
        console.log(JSON.stringify(sample.rows[0], null, 2));
      }
      console.log('');
    }

    // 4. Estado en PostgreSQL
    console.log('6. Estado en PostgreSQL:');
    pgClient = new Client(pgConfig);
    await pgClient.connect();

    const pgExists = await pgClient.query(`
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'sma' AND table_name = 'sma_recibos_pago'
    `);
    if (pgExists.rows.length === 0) {
      console.log('   sma.sma_recibos_pago: NO EXISTE');
    } else {
      const pgCount = await pgClient.query('SELECT COUNT(*) as n FROM sma.sma_recibos_pago');
      console.log('   sma.sma_recibos_pago: EXISTE,', parseInt(pgCount.rows[0].n, 10).toLocaleString('es-CO'), 'registros');
    }

    // 5. Backup progress: ¿se intentó migrar?
    const fs = require('fs');
    const progressPath = path.join(BACKUP_DIR, 'backup_progress.json');
    try {
      const progress = JSON.parse(fs.readFileSync(progressPath, 'utf8'));
      const completed = progress.completedTables || [];
      const hasRecibosPago = completed.includes('SMA_RECIBOS_PAGO');
      console.log('\n7. Backup progreso:');
      console.log('   SMA_RECIBOS_PAGO en completedTables:', hasRecibosPago ? 'SÍ' : 'NO');
      if (progress.tablesMeta && progress.tablesMeta['SMA_RECIBOS_PAGO']) {
        console.log('   Meta:', JSON.stringify(progress.tablesMeta['SMA_RECIBOS_PAGO'], null, 2));
      }
    } catch (e) {
      console.log('\n7. No se pudo leer backup_progress.json');
    }

    // Resumen
    console.log('\n--- Resumen ---');
    if (!existsRecibosPago) {
      console.log('SMA_RECIBOS_PAGO no existe en Oracle. Los datos de excedentes pueden estar en:');
      console.log('  - SMA_RECIBOS_CAJA (recibos de caja)');
      console.log('  - SMA_REP_EXCEDENTES_* (vistas/reportes)');
      console.log('\nOpciones:');
      console.log('  1. Adaptar rutas para usar sma_recibos_caja u otras tablas existentes en PG');
      console.log('  2. Crear vista/alias en Oracle que simule SMA_RECIBOS_PAGO');
    } else {
      if (pgExists.rows.length === 0) {
        console.log('SMA_RECIBOS_PAGO existe en Oracle pero NO fue migrada a PostgreSQL.');
        console.log('Ejecute: npm run backup (en scripts/db-backup) para incluirla.');
      } else {
        console.log('La tabla existe en ambos. Verificar datos si hay discrepancias.');
      }
    }

  } catch (err) {
    console.error('\nError:', err.message);
    if (err.message && err.message.includes('Cannot locate Oracle Client')) {
      console.log('\nRequerido: Oracle Instant Client en PATH para oracledb.');
    }
    process.exit(1);
  } finally {
    if (oracleConn) try { await oracleConn.close(); } catch (e) {}
    if (pgClient) try { await pgClient.end(); } catch (e) {}
  }
}

main();
