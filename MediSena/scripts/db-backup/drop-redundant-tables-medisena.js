#!/usr/bin/env node
/**
 * Elimina del schema medisena tablas redundantes (información repetida respecto a la canónica).
 * - sma_beneficiarios_activos: subconjunto de sma_beneficiarios (estado activo); la app usa sma_beneficiarios + WHERE estado_ben.
 * - t_articulo: no necesaria (no se sincroniza T_ARTICULO desde SPU).
 * Nota: t_cargos no se elimina; es el maestro de cargos (SPU). sma_cargos es la relación cargo-sueldo-vigencia con FK a t_cargos.
 * Se invoca en paso 1.5 de los scripts de sincronización.
 * Uso: node drop-redundant-tables-medisena.js [--dry-run]
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

const REDUNDANT_TABLES = ['sma_beneficiarios_activos', 't_articulo'];

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  const client = new Client(pgConfig);
  await client.connect();

  const existing = [];
  for (const table of REDUNDANT_TABLES) {
    const r = await client.query(
      `SELECT 1 FROM information_schema.tables WHERE table_schema = $1 AND table_name = $2`,
      [SCHEMA, table]
    );
    if (r.rows.length > 0) existing.push(table);
  }

  if (existing.length === 0) {
    console.log('\nNo hay tablas redundantes configuradas en el schema', SCHEMA);
    await client.end();
    return;
  }

  console.log('\nTablas redundantes en', SCHEMA + ':', existing.join(', '));
  console.log('(Información repetida; usar tabla canónica. La sincronización ya no las incluye.)\n');

  if (DRY_RUN) {
    console.log('Modo --dry-run: no se elimina nada. Ejecute sin --dry-run para borrarlas.');
    await client.end();
    return;
  }

  const qt = (s) => '"' + String(s).replace(/"/g, '""') + '"';
  for (const table of existing) {
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
