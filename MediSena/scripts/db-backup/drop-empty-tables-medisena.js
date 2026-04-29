#!/usr/bin/env node
/**
 * En el esquema unificado medisena: lista tablas vacías y las elimina
 * solo si ninguna otra tabla tiene FK que las referencie (integridad relacional).
 *
 * Uso:
 *   node drop-empty-tables-medisena.js           # eliminar tablas vacías seguras
 *   node drop-empty-tables-medisena.js --dry-run # solo listar, no eliminar
 */
const path = require('path');
const root = path.join(__dirname, '../..');
['.env', 'config-puertos-libres.env'].forEach(f => {
  require('dotenv').config({ path: path.join(root, f) });
});
const { Client } = require('pg');

const pgBase = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5433', 10),
  user: process.env.POSTGRES_USER || 'medisena',
  password: process.env.POSTGRES_PASSWORD || 'medisena_local'
};
const DB = process.env.MEDISENA_DB || process.env.POSTGRES_DB || 'medisena';
const SCHEMA = 'medisena';
const DRY_RUN = process.argv.includes('--dry-run');

async function getEmptyTables(client) {
  const tables = await client.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = $1 AND table_type = 'BASE TABLE'
     AND table_name NOT LIKE 'auth_%' AND table_name NOT LIKE 'rbac_%'
     ORDER BY table_name`,
    [SCHEMA]
  );
  const empty = [];
  for (const r of tables.rows) {
    const name = r.table_name;
    const res = await client.query(
      `SELECT 1 FROM ${SCHEMA}.${name} LIMIT 1`
    );
    if (!res.rows || res.rows.length === 0) empty.push(name);
  }
  return empty;
}

/** Tablas que tienen al menos un FK apuntando hacia ellas (referenced). */
async function getReferencedTables(client) {
  const res = await client.query(`
    SELECT DISTINCT c.confrelid::regclass::text AS ref_table
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE c.contype = 'f' AND n.nspname = $1
  `, [SCHEMA]);
  const refSet = new Set();
  for (const row of res.rows || []) {
    let t = row.ref_table || '';
    if (t.includes('.')) t = t.split('.')[1];
    refSet.add(t);
  }
  return refSet;
}

async function main() {
  console.log('=== Tablas vacías en medisena (sin afectar integridad relacional) ===\n');
  if (DRY_RUN) console.log('Modo --dry-run: solo listar, no eliminar.\n');

  const client = new Client({ ...pgBase, database: DB });
  await client.connect();
  try {
    const [emptyTables, referencedTables] = await Promise.all([
      getEmptyTables(client),
      getReferencedTables(client)
    ]);

    const safeToDrop = emptyTables.filter(t => !referencedTables.has(t));
    const referencedEmpty = emptyTables.filter(t => referencedTables.has(t));

    if (emptyTables.length === 0) {
      console.log('No hay tablas vacías en el esquema medisena.');
      return;
    }

    console.log(`Tablas vacías: ${emptyTables.length}`);
    if (referencedEmpty.length > 0) {
      console.log(`  Referenciadas por FK (no se eliminan): ${referencedEmpty.length}`);
      referencedEmpty.forEach(t => console.log(`    - ${t}`));
    }
    console.log(`  Sin referencias (se pueden eliminar): ${safeToDrop.length}`);
    safeToDrop.forEach(t => console.log(`    - ${t}`));

    if (safeToDrop.length === 0) {
      console.log('\nNinguna tabla vacía puede eliminarse sin afectar FKs.');
      return;
    }

    if (!DRY_RUN) {
      console.log('');
      for (const tableName of safeToDrop) {
        await client.query(`DROP TABLE IF EXISTS ${SCHEMA}.${tableName} CASCADE`);
        console.log(`  Eliminada: ${tableName}`);
      }
      console.log(`\n${safeToDrop.length} tabla(s) eliminada(s).`);
    } else {
      console.log('\n(Use sin --dry-run para eliminar.)');
    }
  } finally {
    await client.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
