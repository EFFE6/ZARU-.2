#!/usr/bin/env node
/**
 * Copia la tabla sma.sma_usua desde medisena_backup a medisena.sma_usua (esquema medisena).
 * Todo debe vivir en el esquema medisena (DB unificada).
 *
 * Uso: node backend/scripts/copy-sma-usua-to-medisena-db.js
 * Requiere: medisena_backup con schema sma; base medisena existente.
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

async function main() {
  const source = new Client({ ...base, database: process.env.POSTGRES_DB || 'medisena_backup' });
  const target = new Client({ ...base, database: process.env.MEDISENA_DB || 'medisena' });

  await source.connect();
  await target.connect();

  try {
    const cols = await source.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_schema = 'sma' AND table_name = 'sma_usua'
      ORDER BY ordinal_position
    `);
    if (cols.rows.length === 0) {
      console.log('No existe sma.sma_usua en la base origen. Nada que copiar.');
      return;
    }
    const colList = cols.rows.map(c => `"${c.column_name}"`).join(', ');
    await target.query(`DROP TABLE IF EXISTS medisena.sma_usua CASCADE`);
    const defs = cols.rows.map(c => {
      const t = (c.udt_name || c.data_type || 'text').toLowerCase();
      let pg = 'TEXT';
      if (t === 'int4' || t === 'integer') pg = 'INTEGER';
      else if (t === 'int8' || t === 'bigint') pg = 'BIGINT';
      else if (t === 'numeric' || t === 'decimal') pg = 'NUMERIC';
      else if (t === 'timestamp' || t.includes('timestamp')) pg = 'TIMESTAMP';
      else if (t === 'bool' || t === 'boolean') pg = 'BOOLEAN';
      return `"${c.column_name}" ${pg}`;
    }).join(', ');
    await target.query(`CREATE TABLE medisena.sma_usua (${defs})`);
    const res = await source.query(`SELECT ${colList} FROM sma.sma_usua`);
    if (res.rows.length === 0) {
      console.log('Tabla sma_usua vacía en origen. Copia estructural lista.');
      return;
    }
    const BATCH = 500;
    let inserted = 0;
    for (let i = 0; i < res.rows.length; i += BATCH) {
      const batch = res.rows.slice(i, i + BATCH);
      const flat = batch.flatMap(row => cols.rows.map(c => row[c.column_name] ?? row[c.column_name.toLowerCase()]));
      const placeholders = batch.map((_, b) => `(${cols.rows.map((_, j) => `$${b * cols.rows.length + j + 1}`).join(', ')})`).join(', ');
      await target.query(`INSERT INTO medisena.sma_usua (${colList}) VALUES ${placeholders}`, flat);
      inserted += batch.length;
    }
    console.log('medisena.sma_usua copiada en DB medisena:', inserted, 'filas.');
  } finally {
    await source.end();
    await target.end();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
