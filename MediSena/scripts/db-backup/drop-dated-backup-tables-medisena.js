#!/usr/bin/env node
/**
 * Elimina del schema medisena las tablas sma_* que terminan en 8 dígitos (copias con fecha).
 * Ej.: sma_cargos04072023 = copia de sma_cargos; información repetida. La canónica es sma_cargos.
 * No se sincronizan (backup-oracle-to-postgres.js las excluye). Se invoca en paso 1.5 de
 * run-full-resync-to-medisena.ps1 y run-sync-faltantes-to-medisena.ps1.
 * Uso: node drop-dated-backup-tables-medisena.js [--dry-run]
 */
const path = require('path');
const root = path.join(__dirname, '../..');
['.env', 'config-puertos-libres.env'].forEach(f => {
  require('dotenv').config({ path: path.join(root, f) });
});
const { Client } = require('pg');

const pgConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5433', 10),
  user: process.env.POSTGRES_USER || 'medisena',
  password: process.env.POSTGRES_PASSWORD || 'medisena_local',
  database: process.env.MEDISENA_DB || process.env.POSTGRES_DB || 'medisena'
};
const SCHEMA = 'medisena';
const DATED_PATTERN = /^sma_[a-z0-9_]+\d{8}$/; // sma_* + 8 dígitos al final

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  const client = new Client(pgConfig);
  await client.connect();

  const r = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = $1 AND table_type = 'BASE TABLE' AND table_name LIKE 'sma_%'
    ORDER BY table_name
  `, [SCHEMA]);
  const allSma = (r.rows || []).map(x => x.table_name);
  const tables = allSma.filter(t => DATED_PATTERN.test(t));

  if (tables.length === 0) {
    console.log('\nNo hay tablas sma_* con fecha (8 dígitos) en el schema', SCHEMA);
    await client.end();
    return;
  }

  console.log('\nTablas sma_* con fecha (copia/respaldo) en', SCHEMA + ':', tables.join(', '));
  console.log('(Información repetida; tabla canónica es la sin fecha. La sincronización ya no las incluye.)\n');

  if (DRY_RUN) {
    console.log('Modo --dry-run: no se elimina nada. Ejecute sin --dry-run para borrarlas.');
    await client.end();
    return;
  }

  const qt = (s) => '"' + String(s).replace(/"/g, '""') + '"';
  for (const table of tables) {
    try {
      await client.query(`DROP TABLE IF EXISTS ${qt(SCHEMA)}.${qt(table)} CASCADE`);
      console.log('  Eliminada:', table);
    } catch (e) {
      console.error('  Error eliminando', table + ':', e.message);
    }
  }
  console.log('\nListo.');
  await client.end();
}

main().catch(e => {
  console.error(e.message);
  process.exit(1);
});
