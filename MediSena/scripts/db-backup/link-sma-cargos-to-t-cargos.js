#!/usr/bin/env node
/**
 * Establece la relación entre sma_cargos y t_cargos. Quedan las dos tablas relacionadas:
 *
 * - t_cargos (SPU): tabla del nombre del cargo. PK t_cargosid; nombre en t_cargonombrecargo.
 * - sma_cargos (SMA): tabla de vigencia y sueldo (relación cargo–sueldo–vigencia). Se relaciona con t_cargos por FK.
 *
 * Este script:
 * 1. Añade columna t_cargosid en sma_cargos si no existe (FK a t_cargos.t_cargosid).
 * 2. Actualiza sma_cargos.t_cargosid comparando sma_cargos.nomb_car con t_cargos.t_cargonombrecargo
 *    (coincidencia por texto; se toma el t_cargosid correspondiente).
 * 3. Añade la FK sma_cargos.t_cargosid -> t_cargos.t_cargosid (NOT VALID si hay huérfanos).
 *
 * Uso: node link-sma-cargos-to-t-cargos.js [--dry-run] [--apply]
 */
const path = require('path');
const root = path.join(__dirname, '../..');
['.env', 'config-puertos-libres.env'].forEach(f => {
  require('dotenv').config({ path: path.join(root, f) });
});
const { Client } = require('pg');

const PG_SCHEMA = 'medisena';
const pgConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5433', 10),
  user: process.env.POSTGRES_USER || 'medisena',
  password: process.env.POSTGRES_PASSWORD || 'medisena_local',
  database: process.env.MEDISENA_DB || process.env.POSTGRES_DB || 'medisena'
};

const DRY_RUN = process.argv.includes('--dry-run');
const APPLY = process.argv.includes('--apply');

// Nombre de la columna en t_cargos que contiene el nombre del cargo (Oracle: T_CARGOSNOMBRECARGO -> t_cargosnombrecargo)
const T_CARGOS_NOMBRE_COL = 't_cargosnombrecargo';
const T_CARGOS_PK = 't_cargosid';

async function main() {
  const client = new Client(pgConfig);
  await client.connect();

  const tableSma = `${PG_SCHEMA}.sma_cargos`;
  const tableT = `${PG_SCHEMA}.t_cargos`;

  const tExists = await client.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema = $1 AND table_name = 't_cargos'`,
    [PG_SCHEMA]
  );
  if (tExists.rows.length === 0) {
    console.log('t_cargos no existe en medisena. Sincronice SPU primero.');
    await client.end();
    return;
  }

  const colsT = await client.query(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = $1 AND table_name = 't_cargos'`,
    [PG_SCHEMA]
  );
  const nombreColT = (colsT.rows || []).find(r => {
    const c = (r.column_name || '').toLowerCase();
    return c === 't_cargosnombrecargo' || c === 't_cargonombrecargo' || c === 'nombrecargo';
  });
  const nombreColTName = nombreColT ? nombreColT.column_name : T_CARGOS_NOMBRE_COL;

  const pkT = await client.query(
    `SELECT kcu.column_name FROM information_schema.table_constraints tc
     JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
     WHERE tc.table_schema = $1 AND tc.table_name = 't_cargos' AND tc.constraint_type = 'PRIMARY KEY'
     ORDER BY kcu.ordinal_position LIMIT 1`,
    [PG_SCHEMA]
  );
  const pkColT = (pkT.rows && pkT.rows[0]) ? pkT.rows[0].column_name : T_CARGOS_PK;

  const colsSma = await client.query(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = $1 AND table_name = 'sma_cargos'`,
    [PG_SCHEMA]
  );
  const smaHasNombCar = (colsSma.rows || []).some(r => (r.column_name || '').toLowerCase() === 'nomb_car');
  const smaHasTCargosId = (colsSma.rows || []).some(r => (r.column_name || '').toLowerCase() === 't_cargosid');

  if (!smaHasNombCar) {
    console.log('sma_cargos no tiene columna nomb_car. Nada que enlazar.');
    await client.end();
    return;
  }

  const pkType = (colsT.rows || []).find(r => (r.column_name || '').toLowerCase() === pkColT.toLowerCase());
  const fkType = (pkType && pkType.data_type) ? pkType.data_type.toUpperCase() : 'NUMERIC';
  const pgFkType = fkType.includes('INT') ? 'BIGINT' : 'NUMERIC';

  if (!smaHasTCargosId && (APPLY && !DRY_RUN)) {
    await client.query(`ALTER TABLE ${tableSma} ADD COLUMN IF NOT EXISTS "t_cargosid" ${pgFkType}`);
    console.log('Columna t_cargosid añadida a sma_cargos.');
  } else if (!smaHasTCargosId) {
    console.log('(dry-run) Se añadiría columna t_cargosid a sma_cargos.');
  }

  const updateSql = `
    UPDATE ${tableSma} s
    SET "t_cargosid" = (
      SELECT t."${pkColT}" FROM ${tableT} t
      WHERE TRIM(LOWER(NULLIF(t."${nombreColTName}", ''))) = TRIM(LOWER(NULLIF(s."nomb_car", '')))
      LIMIT 1
    )
    WHERE NULLIF(TRIM(s."nomb_car"), '') IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM ${tableT} t
        WHERE TRIM(LOWER(NULLIF(t."${nombreColTName}", ''))) = TRIM(LOWER(NULLIF(s."nomb_car", '')))
      )
  `;
  if (APPLY && !DRY_RUN) {
    const res = await client.query(updateSql);
    console.log('Filas de sma_cargos actualizadas con t_cargosid:', res.rowCount);
  } else {
    const countRes = await client.query(`
      SELECT COUNT(*) AS n FROM ${tableSma} s
      INNER JOIN ${tableT} t ON TRIM(LOWER(NULLIF(s."nomb_car", ''))) = TRIM(LOWER(NULLIF(t."${nombreColTName}", '')))
    `);
    console.log('(dry-run) Filas de sma_cargos con match nomb_car <-> t_cargos.' + nombreColTName + ':', countRes.rows[0]?.n || 0);
  }

  const fkName = 'fk_sma_cargos_t_cargos';
  const hasFk = await client.query(
    `SELECT 1 FROM information_schema.table_constraints WHERE table_schema = $1 AND table_name = 'sma_cargos' AND constraint_name = $2`,
    [PG_SCHEMA, fkName]
  );
  if (hasFk.rows.length === 0 && (APPLY && !DRY_RUN)) {
    try {
      await client.query(
        `ALTER TABLE ${tableSma} ADD CONSTRAINT ${fkName} FOREIGN KEY ("t_cargosid") REFERENCES ${tableT} ("${pkColT}") NOT VALID`
      );
      console.log('FK sma_cargos.t_cargosid -> t_cargos.' + pkColT + ' creada (NOT VALID).');
    } catch (e) {
      console.warn('No se pudo crear la FK:', e.message);
    }
  } else if (hasFk.rows.length === 0) {
    console.log('(dry-run) Se crearía FK sma_cargos.t_cargosid -> t_cargos.' + pkColT);
  }

  await client.end();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
