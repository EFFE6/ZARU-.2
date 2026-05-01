#!/usr/bin/env node
/**
 * Lista en Oracle SPU las filas duplicadas por la restricción indicada (PK o única),
 * para entender qué claves causaron "duplicate key" en la sincronización a PostgreSQL.
 *
 * Uso:
 *   node list-oracle-duplicate-keys.js T_DOCBENEFICIARIOS sys_c008784
 *   node list-oracle-duplicate-keys.js T_DOCBENEFICIARIOS   # infiere constraint por defecto
 *   node list-oracle-duplicate-keys.js --all                # revisa tablas con posible discrepancia (requiere backup_progress_spu.json)
 */
const path = require('path');
const root = path.join(__dirname, '../..');
['.env', 'config-puertos-libres.env'].forEach(f => {
  require('dotenv').config({ path: path.join(root, f) });
});

const oracledb = require('oracledb');
const fs = require('fs');

const SCHEMA = process.env.ORACLE_SPU_SCHEMA || 'SPUSMA';
const spuHost = process.env.ORACLE_SPU_HOST || '';
const spuPort = process.env.ORACLE_SPU_PORT || '1521';
const spuService = process.env.ORACLE_SPU_SERVICE_NAME || '';
const spuConnectString = (spuHost && spuService)
  ? `${spuHost}:${spuPort}/${spuService}`
  : (process.env.ORACLE_SPU_CONNECT_STRING || '');

const config = {
  user: process.env.ORACLE_SPU_USER || 'SPUSMA',
  password: process.env.ORACLE_SPU_PASS || process.env.ORACLE_SPU_PASSWORD || '',
  connectString: spuConnectString,
  poolMin: 0,
  poolMax: 1
};

async function getConstraintColumns(conn, constraintName, tableName) {
  const cname = (constraintName || '').toUpperCase();
  const tname = (tableName || '').toUpperCase();
  let r;
  if (cname) {
    r = await conn.execute(
      `SELECT c.TABLE_NAME, c.CONSTRAINT_NAME, c.CONSTRAINT_TYPE, cc.COLUMN_NAME, cc.POSITION
       FROM ALL_CONSTRAINTS c
       JOIN ALL_CONS_COLUMNS cc ON c.OWNER = cc.OWNER AND c.TABLE_NAME = cc.TABLE_NAME AND c.CONSTRAINT_NAME = cc.CONSTRAINT_NAME
       WHERE c.OWNER = :owner AND c.CONSTRAINT_NAME = :cname
       ORDER BY cc.POSITION`,
      { owner: SCHEMA, cname },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
  } else if (tname) {
    r = await conn.execute(
      `SELECT c.TABLE_NAME, c.CONSTRAINT_NAME, c.CONSTRAINT_TYPE, cc.COLUMN_NAME, cc.POSITION
       FROM ALL_CONSTRAINTS c
       JOIN ALL_CONS_COLUMNS cc ON c.OWNER = cc.OWNER AND c.TABLE_NAME = cc.TABLE_NAME AND c.CONSTRAINT_NAME = cc.CONSTRAINT_NAME
       WHERE c.OWNER = :owner AND c.TABLE_NAME = :tname AND c.CONSTRAINT_TYPE IN ('P','U')
       ORDER BY c.CONSTRAINT_NAME, cc.POSITION`,
      { owner: SCHEMA, tname },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const rows = (r.rows || []);
    if (rows.length === 0) return null;
    const firstConstraint = rows[0].CONSTRAINT_NAME;
    const forFirst = rows.filter(x => x.CONSTRAINT_NAME === firstConstraint);
    return {
      tableName: forFirst[0].TABLE_NAME,
      constraintName: forFirst[0].CONSTRAINT_NAME,
      type: forFirst[0].CONSTRAINT_TYPE,
      columns: forFirst.map(x => x.COLUMN_NAME)
    };
  }
  const rows = (r.rows || []);
  if (rows.length === 0) return null;
  return {
    tableName: rows[0].TABLE_NAME,
    constraintName: rows[0].CONSTRAINT_NAME,
    type: rows[0].CONSTRAINT_TYPE,
    columns: rows.map(x => x.COLUMN_NAME)
  };
}

async function findDuplicatesForConstraint(conn, tableName, constraintName) {
  const info = await getConstraintColumns(conn, constraintName, tableName);
  if (!info || info.columns.length === 0) {
    console.error(`No se encontró la restricción "${constraintName || '(PK/U)'}" para tabla "${tableName || ''}" en el esquema ${SCHEMA}.`);
    return null;
  }
  if (tableName && info.tableName !== tableName.toUpperCase()) {
    console.warn(`La restricción pertenece a ${info.tableName}. Usando ${info.tableName}.`);
  }
  const table = info.tableName;
  const cols = info.columns;
  const quotedCols = cols.map(c => `"${c}"`).join(', ');
  const fullTable = `${SCHEMA}.${table}`;
  const sql = `SELECT ${quotedCols}, COUNT(*) AS CNT FROM ${fullTable} GROUP BY ${quotedCols} HAVING COUNT(*) > 1 ORDER BY COUNT(*) DESC`;
  const result = await conn.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
  const rows = result.rows || [];
  return { table, constraintName: info.constraintName, type: info.type, columns: cols, duplicates: rows };
}

async function run() {
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const allMode = process.argv.includes('--all');
  let tableName = args[0];
  let constraintName = args[1];

  if (!config.connectString || !config.password) {
    console.error('Configure ORACLE_SPU_* y ORACLE_SPU_PASS en .env');
    process.exit(1);
  }

  try {
    if (typeof oracledb.initOracleClient === 'function') {
      try { oracledb.initOracleClient(); } catch (e) { if (!e.message.includes('already been called')) {} }
    }
  } catch (e) {}

  const conn = await oracledb.getConnection(config);

  try {
    if (allMode) {
      const { BACKUP_DIR } = require('./config');
      const progressPath = path.join(BACKUP_DIR, 'backup_progress_spu.json');
      if (!fs.existsSync(progressPath)) {
        console.error('Modo --all requiere backup_progress_spu.json en', progressPath);
        process.exit(1);
      }
      const progress = JSON.parse(fs.readFileSync(progressPath, 'utf8'));
      const meta = progress.tablesMeta || {};
      const tablesWithLess = Object.entries(meta).filter(([t, m]) => m && typeof m.rows === 'number' && typeof m.inserted === 'number' && m.inserted < m.rows);
      console.log('=== Tablas con filas insertadas < filas leídas (posibles duplicados u otros fallos) ===\n');
      for (const [t, m] of tablesWithLess) {
        console.log(`${t}: leídas=${m.rows}, insertadas=${m.inserted}, diferencia=${m.rows - m.inserted}`);
      }
      if (tablesWithLess.length === 0) {
        console.log('No hay tablas con discrepancia en el progreso guardado.');
      }
      return;
    }

    if (!tableName) {
      console.log('Uso: node list-oracle-duplicate-keys.js <TABLA> [CONSTRAINT_NAME]');
      console.log('     node list-oracle-duplicate-keys.js --all');
      console.log('');
      console.log('Ejemplo: node list-oracle-duplicate-keys.js T_DOCBENEFICIARIOS sys_c008784');
      process.exit(1);
    }
    tableName = tableName.toUpperCase();
    if (!constraintName && tableName === 'T_DOCBENEFICIARIOS') constraintName = 'SYS_C008784';

    const out = await findDuplicatesForConstraint(conn, tableName, constraintName);
    if (!out) process.exit(1);

    console.log(`\n=== Duplicados por restricción ${out.constraintName} (${out.type}) en ${out.table} ===`);
    console.log(`Columnas de la clave: ${out.columns.join(', ')}\n`);
    console.log(`Total de grupos duplicados: ${out.duplicates.length}`);
    const totalDuplicateRows = out.duplicates.reduce((s, r) => s + (Number(r.CNT) || 0), 0);
    const extraRows = out.duplicates.reduce((s, r) => s + (Number(r.CNT) || 0) - 1, 0);
    console.log(`Filas que repetían clave (omitidas en PG): ${extraRows}\n`);
    console.log('Listado (clave -> cantidad de veces que aparece):');
    console.log('-'.repeat(80));
    const colKeys = out.columns;
    for (const row of out.duplicates.slice(0, 200)) {
      const keyVals = colKeys.map(c => row[c]).join('\t');
      console.log(`${keyVals}\t-> ${row.CNT} veces`);
    }
    if (out.duplicates.length > 200) {
      console.log(`... y ${out.duplicates.length - 200} grupos más.`);
    }
  } finally {
    await conn.close();
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
