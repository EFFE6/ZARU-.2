#!/usr/bin/env node
/**
 * @deprecated Esquemas sma/spu en DBs medisena_backup y spu_backup ya no se usan.
 * Use drop-empty-tables-medisena.js para el esquema unificado medisena.
 *
 * Lista tablas vacías en PostgreSQL (sma y/o spu) y las elimina.
 * Guarda la lista en skip_empty_tables_<schema>.json para que el script de
 * sincronización no las vuelva a crear (no sincroniza tablas vacías).
 *
 * Uso:
 *   node drop-empty-tables-pg.js           # SMA + SPU (según env)
 *   node drop-empty-tables-pg.js --sma      # solo schema sma (medisena_backup)
 *   node drop-empty-tables-pg.js --spu      # solo schema spu (spu_backup)
 *   node drop-empty-tables-pg.js --list     # solo listar, no eliminar
 */
const path = require('path');
const root = path.join(__dirname, '../..');
['.env', 'config-puertos-libres.env'].forEach(f => {
  require('dotenv').config({ path: path.join(root, f) });
});
const fs = require('fs');
const { Client } = require('pg');
const { BACKUP_DIR } = require('./config');
const pgBase = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5433', 10),
  user: process.env.POSTGRES_USER || 'medisena',
  password: process.env.POSTGRES_PASSWORD || 'medisena_local'
};

const LIST_ONLY = process.argv.includes('--list');
const ONLY_SMA = process.argv.includes('--sma');
const ONLY_SPU = process.argv.includes('--spu');
const RUN_SMA = ONLY_SMA || (!ONLY_SMA && !ONLY_SPU);
const RUN_SPU = ONLY_SPU || (!ONLY_SMA && !ONLY_SPU);

async function getEmptyTables(client, schema) {
  const tables = await client.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = $1 AND table_type = 'BASE TABLE'
     ORDER BY table_name`,
    [schema]
  );
  const empty = [];
  for (const r of tables.rows) {
    const name = r.table_name;
    const res = await client.query(
      `SELECT 1 FROM ${schema}.${name} LIMIT 1`,
      []
    );
    if (!res.rows || res.rows.length === 0) empty.push(name.toUpperCase());
  }
  return empty;
}

async function runForSchema(dbName, schema, skipFileName) {
  const client = new Client({ ...pgBase, database: dbName });
  await client.connect();
  try {
    const empty = await getEmptyTables(client, schema);
    if (empty.length === 0) {
      console.log(`  [${schema}] No hay tablas vacías.`);
      return;
    }
    console.log(`  [${schema}] Tablas vacías: ${empty.length}`);
    empty.forEach(t => console.log(`    - ${t}`));

    if (!LIST_ONLY) {
      for (const tableName of empty) {
        const q = `DROP TABLE IF EXISTS ${schema}.${tableName.toLowerCase()} CASCADE`;
        await client.query(q);
        console.log(`    Eliminada: ${tableName}`);
      }
      const skipPath = path.join(BACKUP_DIR, skipFileName);
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
      const data = {
        tables: empty,
        droppedAt: new Date().toISOString(),
        schema,
        database: dbName
      };
      fs.writeFileSync(skipPath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`  Lista guardada en ${skipFileName} (no se sincronizarán en próximas ejecuciones).`);
    }
  } finally {
    await client.end();
  }
}

async function main() {
  console.log('=== Depurar tablas vacías en PostgreSQL ===\n');
  if (LIST_ONLY) console.log('Modo: solo listar (--list). No se elimina nada.\n');

  try {
    if (RUN_SMA) {
      const db = process.env.POSTGRES_DB || 'medisena_backup';
      console.log(`Base: ${db}, esquema: sma`);
      await runForSchema(db, 'sma', 'skip_empty_tables_sma.json');
      console.log('');
    }
    if (RUN_SPU) {
      const db = process.env.PG_SPU_DB || process.env.POSTGRES_SPU_DB || 'spu_backup';
      console.log(`Base: ${db}, esquema: spu`);
      await runForSchema(db, 'spu', 'skip_empty_tables_spu.json');
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
