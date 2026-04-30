#!/usr/bin/env node
/**
 * Unifica datos de T_CARGOS (Oracle SPU) en sma_cargos (medisena).
 * - Añade columna "origen" a sma_cargos si no existe (default 'sma').
 * - Añade columnas spu_<nombre> para cada columna de T_CARGOS no mapeada a cod_car/nomb_car.
 * - Inserta filas de T_CARGOS en sma_cargos con origen='spu' y mapeo de columnas.
 * Mantiene toda la data y la integridad: una sola tabla de cargos con origen SMA y SPU.
 *
 * Mapeo por defecto: primera columna T_CARGOS -> cod_car; columna de nombre (NOMBRECARGO, NOMBRE_CARGO o T_CARGOSNOMBRECARGO) -> nomb_car.
 * En conflicto por cod_car: se actualiza nomb_car desde T_CARGOS (insert o update según exista la fila).
 * Override con env CARGOS_SPU_TO_SMA_MAPPING='{"NOMBRE_COL_ORACLE":"cod_car","OTRA":"nomb_car"}'.
 *
 * Uso: node merge-spu-cargos-into-sma.js [--dry-run]
 */
const path = require('path');
const root = path.join(__dirname, '../..');
['.env', 'config-puertos-libres.env'].forEach(f => {
  require('dotenv').config({ path: path.join(root, f) });
});
const oracledb = require('oracledb');
const { Client } = require('pg');

const SCHEMA_ORACLE = process.env.ORACLE_SPU_SCHEMA || 'SPUSMA';
const ORACLE_TABLE = 'T_CARGOS';
const PG_SCHEMA = 'medisena';
const PG_TABLE = 'sma_cargos';

const spuHost = process.env.ORACLE_SPU_HOST || '';
const spuPort = process.env.ORACLE_SPU_PORT || '1521';
const spuService = process.env.ORACLE_SPU_SERVICE_NAME || '';
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

const pgConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5433', 10),
  user: process.env.POSTGRES_USER || 'medisena',
  password: process.env.POSTGRES_PASSWORD || 'medisena_local',
  database: process.env.MEDISENA_DB || process.env.POSTGRES_DB || 'medisena'
};

const DRY_RUN = process.argv.includes('--dry-run');

function oracleTypeToPg(t) {
  const u = (t || '').toUpperCase();
  if (u.includes('NUMBER')) return 'NUMERIC';
  if (u.includes('VARCHAR') || u.includes('CHAR')) return 'TEXT';
  if (u.includes('DATE') || u.includes('TIMESTAMP')) return 'TIMESTAMP';
  if (u.includes('CLOB') || u.includes('BLOB')) return 'TEXT';
  return 'TEXT';
}

function parseMapping() {
  const raw = process.env.CARGOS_SPU_TO_SMA_MAPPING;
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.warn('CARGOS_SPU_TO_SMA_MAPPING inválido, se usa mapeo por nombre.');
    }
  }
  return null;
}

/** Detecta columna de nombre de cargo en T_CARGOS (para mapear a nomb_car / comparar con NOMB_CAR). */
function findNombCarColumn(spuColumns) {
  const upper = (s) => (s || '').toUpperCase();
  const candidates = ['T_CARGOSNOMBRECARGO', 'NOMBRECARGO', 'NOMBRE_CARGO', 'NOMBRE', 'DESCRIPCION'];
  for (const cand of candidates) {
    const col = spuColumns.find(c => upper(c.name) === cand);
    if (col) return col.name;
  }
  const withNombreCargo = spuColumns.find(c => {
    const n = upper(c.name);
    return n.includes('NOMBRE') && n.includes('CARGO');
  });
  if (withNombreCargo) return withNombreCargo.name;
  if (spuColumns.length >= 2) return spuColumns[1].name;
  return null;
}

async function main() {
  let oracleConn;
  const pgClient = new Client(pgConfig);
  await pgClient.connect();

  try {
    try {
      oracledb.initOracleClient();
    } catch (e) {
      if (!e.message.includes('already been called')) {}
    }
    oracleConn = await oracledb.getConnection(oracleConfig);
  } catch (e) {
    console.error('No se pudo conectar a Oracle SPU:', e.message);
    await pgClient.end();
    process.exit(1);
  }

  const mappingOverride = parseMapping();

  const colRes = await oracleConn.execute(
    `SELECT COLUMN_NAME, DATA_TYPE FROM ALL_TAB_COLUMNS WHERE OWNER = :owner AND TABLE_NAME = :tbl ORDER BY COLUMN_ID`,
    { owner: SCHEMA_ORACLE, tbl: ORACLE_TABLE },
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );
  const spuColumns = (colRes.rows || []).map(r => ({ name: r.COLUMN_NAME, type: r.DATA_TYPE }));
  if (spuColumns.length === 0) {
    console.log('T_CARGOS no encontrada o sin columnas en Oracle SPU.');
    await oracleConn.close();
    await pgClient.end();
    return;
  }

  const pgCols = await pgClient.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 ORDER BY ordinal_position`,
    [PG_SCHEMA, PG_TABLE]
  );
  const pgColumnSet = new Set((pgCols.rows || []).map(r => r.column_name.toLowerCase()));

  const mapToCodCar = mappingOverride
    ? (Object.entries(mappingOverride).find(([, v]) => v === 'cod_car') || [])[0]
    : (spuColumns[0] && spuColumns[0].name);
  const mapToNombCar = mappingOverride
    ? (Object.entries(mappingOverride).find(([, v]) => v === 'nomb_car') || [])[0]
    : findNombCarColumn(spuColumns);
  if (mapToNombCar) console.log('Mapeo nomb_car <- T_CARGOS.' + mapToNombCar);

  if (!pgColumnSet.has('origen')) {
    if (DRY_RUN) {
      console.log('(dry-run) Se añadiría columna "origen" a', PG_TABLE);
    } else {
      await pgClient.query(`ALTER TABLE ${PG_SCHEMA}.${PG_TABLE} ADD COLUMN IF NOT EXISTS "origen" TEXT DEFAULT 'sma'`);
      await pgClient.query(`UPDATE ${PG_SCHEMA}.${PG_TABLE} SET "origen" = 'sma' WHERE "origen" IS NULL`);
      console.log('Columna origen añadida/actualizada en', PG_TABLE);
    }
  }

  for (const col of spuColumns) {
    const c = col.name.toLowerCase();
    const spuColName = 'spu_' + c;
    if (c === (mapToCodCar || '').toLowerCase() || c === (mapToNombCar || '').toLowerCase()) continue;
    if (pgColumnSet.has(spuColName)) continue;
    if (DRY_RUN) {
      console.log('(dry-run) Se añadiría columna', spuColName, 'a', PG_TABLE);
    } else {
      const pgType = oracleTypeToPg(col.type);
      await pgClient.query(`ALTER TABLE ${PG_SCHEMA}.${PG_TABLE} ADD COLUMN IF NOT EXISTS "${spuColName}" ${pgType}`);
      console.log('Columna', spuColName, 'añadida a', PG_TABLE);
    }
    pgColumnSet.add(spuColName);
  }

  const selectList = spuColumns.map(c => `"${c.name}"`).join(', ');
  const result = await oracleConn.execute(
    `SELECT ${selectList} FROM ${SCHEMA_ORACLE}.${ORACLE_TABLE}`,
    [],
    { outFormat: oracledb.OUT_FORMAT_OBJECT }
  );
  const rows = result.rows || [];
  if (rows.length === 0) {
    console.log('T_CARGOS tiene 0 filas en Oracle. Nada que insertar.');
    await oracleConn.close();
    await pgClient.end();
    return;
  }

  const colsForInsert = ['origen'];
  if (mapToCodCar) colsForInsert.push('cod_car');
  if (mapToNombCar) colsForInsert.push('nomb_car');
  spuColumns.forEach(col => {
    const c = col.name.toLowerCase();
    if (c === (mapToCodCar || '').toLowerCase() || c === (mapToNombCar || '').toLowerCase()) return;
    colsForInsert.push('spu_' + c);
  });

  const placeholders = colsForInsert.map((_, i) => `$${i + 1}`).join(', ');
  const updateSet = [];
  if (colsForInsert.includes('nomb_car')) updateSet.push('"nomb_car" = EXCLUDED."nomb_car"');
  if (colsForInsert.includes('origen')) updateSet.push('"origen" = EXCLUDED."origen"');
  const conflictSql = updateSet.length > 0
    ? ` ON CONFLICT (cod_car) DO UPDATE SET ${updateSet.join(', ')}`
    : ' ON CONFLICT (cod_car) DO NOTHING';
  const insertSql = `INSERT INTO ${PG_SCHEMA}.${PG_TABLE} (${colsForInsert.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders})${conflictSql}`;

  if (DRY_RUN) {
    console.log('(dry-run) Se insertarían/actualizarían', rows.length, 'filas de T_CARGOS en', PG_TABLE, '(nomb_car desde T_CARGOS)');
    await oracleConn.close();
    await pgClient.end();
    return;
  }

  let inserted = 0;
  let updated = 0;
  for (const row of rows) {
    const codCarVal = mapToCodCar ? (row[mapToCodCar] ?? row[mapToCodCar.toUpperCase()]) : null;
    if (codCarVal == null) continue;
    const values = ['spu'];
    const nombCarVal = mapToNombCar ? (row[mapToNombCar] ?? row[mapToNombCar.toUpperCase()]) : null;
    if (mapToCodCar) values.push(codCarVal);
    if (mapToNombCar) values.push(nombCarVal);
    spuColumns.forEach(col => {
      const c = col.name;
      if (c === mapToCodCar || c === mapToNombCar) return;
      values.push(row[c] ?? row[c.toUpperCase()] ?? null);
    });
    try {
      const before = await pgClient.query(
        `SELECT 1 FROM ${PG_SCHEMA}.${PG_TABLE} WHERE "cod_car" = $1`,
        [codCarVal]
      );
      const res = await pgClient.query(insertSql, values);
      if (res.rowCount > 0) {
        if (before.rows.length > 0) updated++;
        else inserted++;
      }
    } catch (e) {
      if (/unique|duplicate|conflict/i.test(e.message)) { /* skip */ } else console.warn('Fila no insertada:', e.message);
    }
  }
  console.log('Insertadas', inserted, 'filas; actualizadas', updated, 'filas de T_CARGOS en', PG_TABLE, '(nomb_car comparado/actualizado desde T_CARGOS).');
  await oracleConn.close();
  await pgClient.end();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
