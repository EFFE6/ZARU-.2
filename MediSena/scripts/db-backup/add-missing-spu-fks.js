#!/usr/bin/env node
/**
 * Añade FKs faltantes en medisena.t_* consultando Oracle SPU.
 * Útil cuando la sincronización no creó FKs (p. ej. tablas vacías referenciadas) o para reparar integridad.
 * Uso: node add-missing-spu-fks.js [--dry-run] [--not-valid]
 *   --not-valid: crea la FK sin validar filas existentes (útil si hay datos huérfanos).
 */
const path = require('path');
const root = path.join(__dirname, '../..');
['.env', 'config-puertos-libres.env'].forEach(f => {
  require('dotenv').config({ path: path.join(root, f) });
});
const oracledb = require('oracledb');
const { Client } = require('pg');

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

const DRY_RUN = process.argv.includes('--dry-run');
const NOT_VALID = process.argv.includes('--not-valid');

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

async function addForeignKey(client, tableName, fk) {
  if (!fk || !fk.columns || fk.columns.length === 0 || !fk.refTable || !fk.refColumns || fk.refColumns.length === 0) return;
  const pgTable = tableName.toLowerCase();
  const refTable = fk.refTable.toLowerCase();
  const cols = fk.columns.map(c => `"${c.toLowerCase()}"`).join(', ');
  const refCols = fk.refColumns.map(c => `"${c.toLowerCase()}"`).join(', ');
  const name = (fk.constraintName || `fk_${pgTable}_${refTable}`).toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 63);
  const notValidSuffix = NOT_VALID ? ' NOT VALID' : '';
  await client.query(`ALTER TABLE ${PG_SCHEMA}.${pgTable} ADD CONSTRAINT ${name} FOREIGN KEY (${cols}) REFERENCES ${PG_SCHEMA}.${refTable} (${refCols})${notValidSuffix}`);
}

async function main() {
  const pg = new Client(pgConfig);
  await pg.connect();

  const tablesRes = await pg.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = $1 AND table_type = 'BASE TABLE' AND table_name LIKE 't_%' ORDER BY table_name`,
    [PG_SCHEMA]
  );
  const pgTables = (tablesRes.rows || []).map(r => r.table_name);
  const pgTableSet = new Set(pgTables);

  const existingFksRes = await pg.query(`
    SELECT tc.table_name, tc.constraint_name,
           string_agg(kcu.column_name, ',' ORDER BY kcu.ordinal_position) AS columns,
           ccu.table_name AS ref_table,
           string_agg(ccu.column_name, ',' ORDER BY kcu.ordinal_position) AS ref_columns
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
    WHERE tc.table_schema = $1 AND tc.constraint_type = 'FOREIGN KEY' AND tc.table_name LIKE 't_%'
    GROUP BY tc.table_name, tc.constraint_name, ccu.table_name
  `, [PG_SCHEMA]);
  const existingFkSigs = new Set();
  for (const r of (existingFksRes.rows || [])) {
    const cols = (r.columns || '').split(',').map(c => c.trim().toLowerCase()).sort().join(',');
    const refCols = (r.ref_columns || '').split(',').map(c => c.trim().toLowerCase()).sort().join(',');
    existingFkSigs.add(`${r.table_name}|${r.ref_table}|${cols}|${refCols}`);
  }

  console.log('\n=== Añadir FKs faltantes SPU (medisena.t_*) ===\n');
  console.log('Tablas t_* en medisena:', pgTables.length);
  console.log('FKs existentes en PG:', existingFkSigs.size);

  let oracleConn;
  try {
    oracleConn = await oracledb.getConnection(oracleConfig);
  } catch (e) {
    console.error('No se pudo conectar a Oracle SPU:', e.message);
    console.log('Configure ORACLE_SPU_* en .env. Solo puede listar FKs existentes en PG sin Oracle.');
    await pg.end();
    process.exit(1);
  }

  const toAdd = [];
  for (const pgTable of pgTables) {
    const oraTable = pgTable.toUpperCase();
    const fks = await getForeignKeys(oracleConn, oraTable);
    for (const fk of fks) {
      const refLower = (fk.refTable || '').toLowerCase();
      if (!pgTableSet.has(refLower)) continue;
      const sig = `${pgTable}|${refLower}|${(fk.columns || []).map(c => c.toLowerCase()).sort().join(',')}|${(fk.refColumns || []).map(c => c.toLowerCase()).sort().join(',')}`;
      if (existingFkSigs.has(sig)) continue;
      toAdd.push({ tableName: pgTable, fk });
    }
  }
  await oracleConn.close();

  console.log('FKs en Oracle que faltan en PG (ref en medisena):', toAdd.length);
  if (toAdd.length === 0) {
    console.log('Nada que añadir.');
    await pg.end();
    return;
  }

  if (DRY_RUN) {
    toAdd.forEach(({ tableName, fk }) => console.log(`  ${tableName}.${fk.constraintName} -> ${fk.refTable} (${(fk.columns || []).join(', ')})`));
    console.log('\nEjecute sin --dry-run para aplicar.');
    await pg.end();
    return;
  }

  let added = 0;
  for (const { tableName, fk } of toAdd) {
    try {
      await addForeignKey(pg, tableName, fk);
      added++;
      console.log(`  OK ${tableName}.${(fk.constraintName || '').toLowerCase()} -> ${fk.refTable.toLowerCase()}`);
    } catch (e) {
      console.warn(`  Error ${tableName}.${fk.constraintName}: ${e.message}`);
    }
  }
  console.log('\nAñadidas:', added, 'de', toAdd.length);
  await pg.end();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
