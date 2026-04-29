#!/usr/bin/env node
/**
 * Copia todo el esquema sma de medisena_backup al esquema medisena de la DB medisena.
 * Crea tablas medisena.sma_* (mismo nombre que en sma.*) para que la app unificada use solo el esquema medisena.
 *
 * Uso: node backend/scripts/copy-schema-sma-to-medisena.js
 * Requiere: medisena_backup con schema sma; base medisena existente con schema medisena.
 */
const path = require('path');
const root = path.join(__dirname, '../..');
['.env', 'config-puertos-libres.env'].forEach(f => {
  try { require('dotenv').config({ path: path.join(root, f) }); } catch (_) {}
});
const { Client } = require('pg');

const base = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5433', 10),
  user: process.env.POSTGRES_USER || 'medisena',
  password: process.env.POSTGRES_PASSWORD || 'medisena_local'
};

const BATCH = 2000;
const EXCLUDE = new Set(['sma_usua']); // sma_usua se copia con copy-sma-usua-to-medisena-db.js

function pgType(udt) {
  const t = (udt || '').toLowerCase();
  if (['int4', 'int8', 'int2'].includes(t)) return t === 'int2' ? 'SMALLINT' : (t === 'int8' ? 'BIGINT' : 'INTEGER');
  if (['numeric', 'decimal', 'float4', 'float8'].includes(t)) return t === 'float4' ? 'REAL' : (t === 'float8' ? 'DOUBLE PRECISION' : 'NUMERIC');
  if (['timestamp', 'timestamptz', 'date', 'time'].some(x => t.includes(x))) return 'TIMESTAMP';
  if (t === 'bool') return 'BOOLEAN';
  if (t === 'bytea') return 'BYTEA';
  return 'TEXT';
}

async function main() {
  const source = new Client({ ...base, database: process.env.POSTGRES_DB || 'medisena_backup' });
  const target = new Client({ ...base, database: process.env.MEDISENA_DB || 'medisena' });
  await source.connect();
  await target.connect();

  await target.query('CREATE SCHEMA IF NOT EXISTS medisena');

  const tables = await source.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'sma' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);

  let done = 0;
  for (const { table_name } of tables.rows) {
    const name = table_name;
    if (EXCLUDE.has(name)) continue;

    const cols = await source.query(`
      SELECT column_name, udt_name FROM information_schema.columns
      WHERE table_schema = 'sma' AND table_name = $1 ORDER BY ordinal_position
    `, [name]);
    if (cols.rows.length === 0) continue;

    const colList = cols.rows.map(c => `"${c.column_name}"`).join(', ');
    const defs = cols.rows.map(c => `"${c.column_name}" ${pgType(c.udt_name)}`).join(', ');
    await target.query(`DROP TABLE IF EXISTS medisena.${name} CASCADE`);
    await target.query(`CREATE TABLE medisena.${name} (${defs})`);

    const res = await source.query(`SELECT ${colList} FROM sma.${name}`);
    if (res.rows.length > 0) {
      const placeholders = res.rows[0] ? `(${cols.rows.map((_, i) => `$${i + 1}`).join(', ')})` : '';
      for (let i = 0; i < res.rows.length; i += BATCH) {
        const batch = res.rows.slice(i, i + BATCH);
        const flat = batch.flatMap(row => cols.rows.map(c => row[c.column_name] ?? row[c.column_name.toLowerCase()]));
        const ph = batch.map((_, b) => `(${cols.rows.map((_, j) => `$${b * cols.rows.length + j + 1}`).join(', ')})`).join(', ');
        await target.query(`INSERT INTO medisena.${name} (${colList}) VALUES ${ph}`, flat);
      }
    }
    done++;
    console.log('  ', name, res.rows.length, 'filas');
  }

  console.log('Tablas copiadas a medisena:', done);
  await source.end();
  await target.end();
}

main().catch(e => { console.error(e); process.exit(1); });
