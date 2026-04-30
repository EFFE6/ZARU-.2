#!/usr/bin/env node
/**
 * Unifica el tipo de las columnas iden_func / iden_func_* en tablas de reporte
 * al tipo de sma_funcionarios.iden_func para poder crear las FKs.
 * Tablas: sma_rep_excedentes_det_todos (iden_func_ben_orden), sma_rep_excedentes_enc_todos (iden_func),
 *         sma_reporte_excedentes_todos (iden_func).
 * Uso: node normalize-iden-func-types-medisena.js [--dry-run] [--apply]
 */
const path = require('path');
const root = path.join(__dirname, '../..');
['.env', 'config-puertos-libres.env'].forEach(f => {
  require('dotenv').config({ path: path.join(root, f) });
});
const { Client } = require('pg');

const SCHEMA = 'medisena';
const pgConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5433', 10),
  user: process.env.POSTGRES_USER || 'medisena',
  password: process.env.POSTGRES_PASSWORD || 'medisena_local',
  database: process.env.MEDISENA_DB || process.env.POSTGRES_DB || 'medisena'
};

const PARENT_TABLE = 'sma_funcionarios';
const PARENT_COLUMN = 'iden_func';
const CHILD_COLUMNS = [
  { table: 'sma_rep_excedentes_det_todos', column: 'iden_func_ben_orden' },
  { table: 'sma_rep_excedentes_enc_todos', column: 'iden_func' },
  { table: 'sma_reporte_excedentes_todos', column: 'iden_func' },
  { table: 'sma_prueba', column: 'iden_func' }
];

const DRY_RUN = process.argv.includes('--dry-run');
const APPLY = process.argv.includes('--apply');

function baseTypeForCast(formatType) {
  const t = (formatType || '').toLowerCase();
  if (t.startsWith('numeric') || t.startsWith('decimal')) return 'numeric';
  if (t.startsWith('integer') || t === 'int' || t === 'int4' || t.startsWith('bigint') || t === 'int8') return 'integer';
  if (t.startsWith('smallint') || t === 'int2') return 'smallint';
  return t.split('(')[0].trim() || 'numeric';
}

async function main() {
  const client = new Client(pgConfig);
  await client.connect();

  const typeRes = await client.query(`
    SELECT a.attname, format_type(a.atttypid, a.atttypmod) AS pg_type
    FROM pg_attribute a
    JOIN pg_class c ON a.attrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = $1 AND c.relname = $2 AND a.attname = $3
      AND NOT a.attisdropped AND a.attnum > 0
  `, [SCHEMA, PARENT_TABLE, PARENT_COLUMN]);

  const parentRow = typeRes.rows[0];
  if (!parentRow) {
    console.warn('No se encontró columna', PARENT_TABLE + '.' + PARENT_COLUMN);
    await client.end();
    return;
  }
  const parentPgType = parentRow.pg_type;
  const castType = baseTypeForCast(parentPgType);
  console.log('Tipo en', PARENT_TABLE + '.' + PARENT_COLUMN + ':', parentPgType, '(cast:', castType + ')');

  const toAlter = [];
  for (const { table, column } of CHILD_COLUMNS) {
    const r = await client.query(`
      SELECT a.attname, format_type(a.atttypid, a.atttypmod) AS pg_type
      FROM pg_attribute a
      JOIN pg_class c ON a.attrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE n.nspname = $1 AND c.relname = $2 AND a.attname = $3
        AND NOT a.attisdropped AND a.attnum > 0
    `, [SCHEMA, table, column]);
    const row = r.rows[0];
    if (!row) {
      console.log('  (no existe)', table + '.' + column);
      continue;
    }
    const childType = row.pg_type;
    if (childType === parentPgType) {
      console.log('  OK (mismo tipo)', table + '.' + column, childType);
      continue;
    }
    const childBase = baseTypeForCast(childType);
    if (childBase === castType && childType !== parentPgType) {
      toAlter.push({ table, column, from: childType, to: parentPgType, castType });
      continue;
    }
    toAlter.push({ table, column, from: childType, to: parentPgType, castType });
  }

  if (toAlter.length === 0) {
    console.log('\nNada que normalizar.');
    await client.end();
    return;
  }

  console.log('\nColumnas a normalizar a', parentPgType + ':');
  for (const a of toAlter) {
    console.log('  ', a.table + '.' + a.column, a.from, '->', a.to);
  }

  if (!APPLY || DRY_RUN) {
    console.log('\n(dry-run: ejecutar con --apply para alterar)');
    await client.end();
    return;
  }

  for (const a of toAlter) {
    const sql = `ALTER TABLE ${SCHEMA}.${a.table} ALTER COLUMN "${a.column}" TYPE ${a.to} USING "${a.column}"::${a.castType}`;
    try {
      await client.query(sql);
      console.log('  OK', a.table + '.' + a.column);
    } catch (e) {
      console.warn('  Error', a.table + '.' + a.column, e.message);
    }
  }
  await client.end();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
