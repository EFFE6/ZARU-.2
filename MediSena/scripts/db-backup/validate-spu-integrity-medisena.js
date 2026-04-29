#!/usr/bin/env node
/**
 * Valida integridad relacional (PK/FK) de tablas de origen SPU (medisena.t_*) en PostgreSQL.
 * Opción 1: --pg-only  → solo lista PK/FK de t_* en medisena.
 * Opción 2: sin flags  → compara con Oracle SPU y reporta PK/FK faltantes o inconsistentes.
 * Uso: node validate-spu-integrity-medisena.js [--pg-only] [--table nombre_tabla]
 *   --table: solo reporta PK/FK de esa tabla (ej. t_detorden o t_det_orden).
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

const PG_ONLY = process.argv.includes('--pg-only');
const TABLE_FILTER = (() => {
  const i = process.argv.indexOf('--table');
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1].toLowerCase().trim() : null;
})();

function norm(s) {
  return (s || '').toLowerCase().trim();
}
function normCols(arr) {
  return (arr || []).map(c => norm(c)).sort().join(',');
}

async function getPgTables(client) {
  const r = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = $1 AND table_type = 'BASE TABLE' AND table_name LIKE 't_%'
    ORDER BY table_name
  `, [PG_SCHEMA]);
  return (r.rows || []).map(x => x.table_name);
}

async function getPgPks(client) {
  const r = await client.query(`
    SELECT tc.table_name, tc.constraint_name,
           string_agg(kcu.column_name, ',' ORDER BY kcu.ordinal_position) AS columns
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    WHERE tc.table_schema = $1 AND tc.constraint_type = 'PRIMARY KEY' AND tc.table_name LIKE 't_%'
    GROUP BY tc.table_name, tc.constraint_name
  `, [PG_SCHEMA]);
  return (r.rows || []).map(x => ({
    table: x.table_name,
    name: x.constraint_name,
    columns: (x.columns || '').split(',').map(c => c.trim()).filter(Boolean)
  }));
}

async function getPgFks(client) {
  const r = await client.query(`
    SELECT tc.table_name, tc.constraint_name,
           string_agg(kcu.column_name, ',' ORDER BY kcu.ordinal_position) AS columns,
           ccu.table_name AS ref_table,
           string_agg(ccu.column_name, ',' ORDER BY kcu.ordinal_position) AS ref_columns
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
    WHERE tc.table_schema = $1 AND tc.constraint_type = 'FOREIGN KEY' AND tc.table_name LIKE 't_%'
    GROUP BY tc.table_name, tc.constraint_name, ccu.table_name
  `, [PG_SCHEMA]);
  return (r.rows || []).map(x => ({
    table: x.table_name,
    name: x.constraint_name,
    columns: (x.columns || '').split(',').map(c => c.trim()).filter(Boolean),
    refTable: x.ref_table,
    refColumns: (x.ref_columns || '').split(',').map(c => c.trim()).filter(Boolean)
  }));
}

async function getOracleTables(conn) {
  const r = await conn.execute(
    `SELECT TABLE_NAME FROM ALL_TABLES WHERE OWNER = :owner AND TABLE_NAME LIKE 'T_%' ORDER BY TABLE_NAME`,
    { owner: SCHEMA_ORACLE },
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );
  return (r.rows || []).map(x => x.TABLE_NAME);
}

async function getOraclePks(conn, tableName) {
  const r = await conn.execute(
    `SELECT c.CONSTRAINT_NAME, cc.COLUMN_NAME, cc.POSITION
     FROM ALL_CONSTRAINTS c
     JOIN ALL_CONS_COLUMNS cc ON c.OWNER = cc.OWNER AND c.TABLE_NAME = cc.TABLE_NAME AND c.CONSTRAINT_NAME = cc.CONSTRAINT_NAME
     WHERE c.OWNER = :owner AND c.TABLE_NAME = :tn AND c.CONSTRAINT_TYPE = 'P'
     ORDER BY cc.POSITION`,
    { owner: SCHEMA_ORACLE, tn: tableName },
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );
  if (!r.rows || r.rows.length === 0) return [];
  const byName = {};
  for (const row of r.rows) {
    const n = row.CONSTRAINT_NAME;
    if (!byName[n]) byName[n] = [];
    byName[n].push(row.COLUMN_NAME);
  }
  return Object.entries(byName).map(([name, columns]) => ({ table: tableName, name, columns }));
}

async function getOracleFks(conn, tableName) {
  const r = await conn.execute(
    `SELECT c.CONSTRAINT_NAME, c.R_OWNER, c.R_CONSTRAINT_NAME, cc.COLUMN_NAME, cc.POSITION, rc.TABLE_NAME AS R_TABLE_NAME
     FROM ALL_CONSTRAINTS c
     JOIN ALL_CONS_COLUMNS cc ON c.OWNER = cc.OWNER AND c.TABLE_NAME = cc.TABLE_NAME AND c.CONSTRAINT_NAME = cc.CONSTRAINT_NAME
     JOIN ALL_CONSTRAINTS rc ON c.R_OWNER = rc.OWNER AND c.R_CONSTRAINT_NAME = rc.CONSTRAINT_NAME
     WHERE c.OWNER = :owner AND c.TABLE_NAME = :tn AND c.CONSTRAINT_TYPE = 'R'
     ORDER BY c.CONSTRAINT_NAME, cc.POSITION`,
    { owner: SCHEMA_ORACLE, tn: tableName },
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );
  if (!r.rows || r.rows.length === 0) return [];
  const byName = {};
  for (const row of r.rows) {
    const n = row.CONSTRAINT_NAME;
    if (!byName[n]) byName[n] = { columns: [], refTable: row.R_TABLE_NAME, rOwner: row.R_OWNER, rConstraintName: row.R_CONSTRAINT_NAME };
    byName[n].columns.push(row.COLUMN_NAME);
  }
  const fkList = Object.entries(byName).map(([name, v]) => ({ table: tableName, name, columns: v.columns, refTable: v.refTable, rOwner: v.rOwner, rConstraintName: v.rConstraintName, refColumns: [] }));
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

async function main() {
  const pg = new Client(pgConfig);
  await pg.connect();

  const pgTables = await getPgTables(pg);
  const pgPks = await getPgPks(pg);
  const pgFks = await getPgFks(pg);

  const pgTableSet = new Set(pgTables);
  const pgPkByTable = new Map();
  for (const pk of pgPks) {
    const key = norm(pk.table);
    if (!pgPkByTable.has(key)) pgPkByTable.set(key, []);
    pgPkByTable.get(key).push(pk);
  }
  const pgFkByTable = new Map();
  for (const fk of pgFks) {
    const key = norm(fk.table);
    if (!pgFkByTable.has(key)) pgFkByTable.set(key, []);
    pgFkByTable.get(key).push(fk);
  }

  const tablesToShow = TABLE_FILTER
    ? pgTables.filter(t => t === TABLE_FILTER || t.replace(/_/g, '') === TABLE_FILTER.replace(/_/g, ''))
    : pgTables;
  if (TABLE_FILTER && tablesToShow.length === 0) {
    console.log('\nTabla no encontrada:', TABLE_FILTER, '(tablas t_*:', pgTables.filter(t => t.includes('det') || t.includes('orden')).join(', ') || 'ninguna con det/orden', ')');
    await pg.end();
    return;
  }

  console.log('\n=== Integridad relacional SPU (medisena.t_*) ===\n');
  if (TABLE_FILTER) console.log('Filtro tabla:', TABLE_FILTER, '->', tablesToShow.join(', ') || '(ninguna)');
  console.log('Tablas t_* en medisena:', pgTables.length);
  console.log('PKs en tablas t_*:', pgPks.length);
  console.log('FKs en tablas t_*:', pgFks.length);

  if (PG_ONLY) {
    console.log('\n--- PK por tabla (t_*) ---');
    for (const t of tablesToShow.sort()) {
      const pks = pgPkByTable.get(t) || [];
      pks.forEach(pk => console.log(`  ${t}: ${pk.name} (${pk.columns.join(', ')})`));
      if (pks.length === 0) console.log(`  ${t}: (sin PK)`);
    }
    console.log('\n--- FK por tabla (t_*) ---');
    for (const t of tablesToShow.sort()) {
      const fks = pgFkByTable.get(t) || [];
      fks.forEach(fk => console.log(`  ${t}.${fk.name} -> ${fk.refTable} (${fk.columns.join(', ')})`));
    }
    await pg.end();
    return;
  }

  let oracleConn;
  try {
    oracleConn = await oracledb.getConnection(oracleConfig);
  } catch (e) {
    console.log('\nNo se pudo conectar a Oracle SPU:', e.message);
    console.log('Ejecute con --pg-only para ver solo el estado en PostgreSQL.');
    await pg.end();
    process.exit(1);
  }

  const oraTables = await getOracleTables(oracleConn);
  const oraTableSetLower = new Set(oraTables.map(t => norm(t)));
  const oraPks = [];
  const oraFks = [];
  for (const t of oraTables) {
    const pks = await getOraclePks(oracleConn, t);
    oraPks.push(...pks);
    const fks = await getOracleFks(oracleConn, t);
    oraFks.push(...fks);
  }
  await oracleConn.close();

  const pgFkSig = (fk) => `${norm(fk.table)}|${normCols(fk.columns)}|${norm(fk.refTable)}|${normCols(fk.refColumns)}`;
  const pgFkSet = new Set(pgFks.map(pf => pgFkSig(pf)));
  const oraFkSig = (fk) => `${norm(fk.table)}|${normCols(fk.columns)}|${norm(fk.refTable)}|${normCols(fk.refColumns)}`;
  const missingFks = [];
  for (const ofk of oraFks) {
    const sig = oraFkSig(ofk);
    if (pgFkSet.has(sig)) continue;
    const pgRefExists = pgTableSet.has(norm(ofk.refTable));
    missingFks.push({ ...ofk, refExistsInPg: pgRefExists });
  }

  const tablesInOraNotInPg = oraTables.filter(t => !pgTableSet.has(norm(t)));
  const tablesInPgNotInOra = pgTables.filter(t => !oraTableSetLower.has(t));

  console.log('\n--- Comparación con Oracle SPU ---');
  console.log('Tablas T_* en Oracle:', oraTables.length);
  console.log('PKs en Oracle (T_*):', oraPks.length);
  console.log('FKs en Oracle (T_*):', oraFks.length);

  if (tablesInOraNotInPg.length) {
    console.log('\nTablas en Oracle SPU que NO están en medisena (vacías o no sincronizadas):', tablesInOraNotInPg.length);
    tablesInOraNotInPg.slice(0, 20).forEach(t => console.log('  ', t));
    if (tablesInOraNotInPg.length > 20) console.log('  ... y', tablesInOraNotInPg.length - 20, 'más');
  }
  if (tablesInPgNotInOra.length) {
    console.log('\nTablas en medisena t_* que no están en Oracle (raro):', tablesInPgNotInOra.length);
    tablesInPgNotInOra.forEach(t => console.log('  ', t));
  }

  const oraPkByTable = new Map();
  for (const pk of oraPks) {
    const key = norm(pk.table);
    if (!oraPkByTable.has(key)) oraPkByTable.set(key, []);
    oraPkByTable.get(key).push(pk);
  }
  const missingPks = [];
  const tablesForPk = TABLE_FILTER ? tablesToShow : oraTables;
  for (const t of tablesForPk) {
    const tl = norm(t);
    if (!pgTableSet.has(tl)) continue;
    const oraPkList = oraPkByTable.get(tl) || [];
    const pgPkList = pgPkByTable.get(tl) || [];
    if (oraPkList.length > 0 && pgPkList.length === 0) missingPks.push({ table: t, oracle: oraPkList });
    else if (oraPkList.length > 0 && pgPkList.length > 0) {
      const oraCols = normCols(oraPkList[0].columns);
      const pgCols = normCols(pgPkList[0].columns);
      if (oraCols !== pgCols) missingPks.push({ table: t, oracle: oraPkList, pg: pgPkList, mismatch: true });
    }
  }

  if (TABLE_FILTER && tablesToShow.length > 0) {
    const t = tablesToShow[0];
    const tl = norm(t);
    const oraKey = [...oraPkByTable.keys()].find(k => k === tl || k.replace(/_/g, '') === tl.replace(/_/g, ''));
    console.log('\n--- Tabla', t, '(Oracle: ' + (oraKey || '?') + ') ---');
    const oraPkList = (oraKey && oraPkByTable.get(oraKey)) || [];
    console.log('Oracle PK:', oraPkList.map(p => p.name + ' (' + p.columns.join(', ') + ')').join('; ') || '(ninguna)');
    console.log('PG PK:', (pgPkByTable.get(t) || []).map(p => p.name + ' (' + p.columns.join(', ') + ')').join('; ') || '(ninguna)');
    console.log('Oracle FKs:', (oraFks.filter(f => norm(f.table) === tl || norm(f.table).replace(/_/g, '') === tl.replace(/_/g, ''))).map(f => f.name + ' -> ' + f.refTable + ' (' + f.columns.join(',') + ')').join('; ') || '(ninguna)');
    console.log('PG FKs:', (pgFkByTable.get(t) || []).map(f => f.name + ' -> ' + f.refTable + ' (' + f.columns.join(',') + ')').join('; ') || '(ninguna)');
  }

  if (missingPks.length) {
    const toShow = TABLE_FILTER ? missingPks.filter(m => tablesToShow.includes(norm(m.table))) : missingPks;
    if (toShow.length) {
      console.log('\nPK faltantes o distintas en medisena (tablas t_*):', toShow.length);
      toShow.forEach(m => console.log('  ', m.table, m.mismatch ? 'columnas distintas' : 'sin PK', m.oracle?.[0]?.columns));
    }
  }

  const missingFksFiltered = TABLE_FILTER ? missingFks.filter(f => tablesToShow.includes(norm(f.table))) : missingFks;
  if (missingFksFiltered.length) {
    console.log('\nFK faltantes en medisena (existían en Oracle SPU):', missingFksFiltered.length);
    const refMissing = missingFksFiltered.filter(f => !f.refExistsInPg);
    const refExists = missingFksFiltered.filter(f => f.refExistsInPg);
    if (refMissing.length) {
      console.log('  Referencian tabla que no está en PG (tabla vacía/no sincronizada):', refMissing.length);
      refMissing.slice(0, 15).forEach(f => console.log('    ', f.table, '.', f.name, '->', f.refTable));
    }
    if (refExists.length) {
      console.log('  Referencian tabla que SÍ está en PG (FK no creada):', refExists.length);
      refExists.forEach(f => console.log('    ', f.table, '.', f.name, '->', f.refTable, '(', f.columns.join(','), ')'));
    }
  }

  if (missingPks.length === 0 && missingFks.filter(f => f.refExistsInPg).length === 0 && tablesInOraNotInPg.length === 0) {
    console.log('\nIntegridad OK: PK y FK de tablas t_* coinciden con Oracle SPU (salvo FKs a tablas no presentes en PG).');
  }

  console.log('');
  await pg.end();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
