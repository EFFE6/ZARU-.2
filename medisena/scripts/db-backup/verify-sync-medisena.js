#!/usr/bin/env node
/**
 * Verificación rápida de sincronización: schema medisena (sma_* + t_* + auth_*).
 * Conexión: POSTGRES_HOST, POSTGRES_PORT (default localhost:5433), DB medisena.
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

async function main() {
  const client = new Client(pgConfig);
  await client.connect();

  console.log('\n=== Verificación sincronización MediSENA ===');
  console.log('DB:', pgConfig.database, '| Host:', pgConfig.host + ':' + pgConfig.port);
  console.log('');

  const tables = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'medisena' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  const names = tables.rows.map(r => r.table_name);
  const sma = names.filter(n => n.startsWith('sma_'));
  const t = names.filter(n => n.startsWith('t_'));
  const auth = names.filter(n => n.startsWith('auth_'));

  console.log('Tablas en schema medisena:', names.length);
  console.log('  - sma_* (SMA):', sma.length);
  console.log('  - t_* (SPU):', t.length);
  console.log('  - auth_*:', auth.length);
  console.log('');

  let totalRows = 0;
  const counts = [];
  for (const name of names) {
    try {
      const r = await client.query(`SELECT COUNT(*) AS c FROM medisena."${name.replace(/"/g, '""')}"`);
      const n = parseInt(r.rows[0].c, 10);
      totalRows += n;
      counts.push({ name, n });
    } catch (e) {
      counts.push({ name, n: -1, error: e.message });
    }
  }
  counts.sort((a, b) => (b.n || 0) - (a.n || 0));
  console.log('Top 15 tablas por filas:');
  counts.slice(0, 15).forEach(({ name, n }) => {
    console.log('  ', name.padEnd(40), n >= 0 ? n.toLocaleString('es-CO') : 'error');
  });
  console.log('');
  console.log('Total filas (todas las tablas):', totalRows.toLocaleString('es-CO'));
  const withError = counts.filter(x => x.error);
  if (withError.length) {
    console.log('\nTablas con error:', withError.length);
    withError.forEach(x => console.log('  ', x.name, x.error));
  }

  const pks = await client.query(`
    SELECT COUNT(*) AS c FROM information_schema.table_constraints
    WHERE table_schema = 'medisena' AND constraint_type = 'PRIMARY KEY'
  `);
  const fks = await client.query(`
    SELECT COUNT(*) AS c FROM information_schema.table_constraints
    WHERE table_schema = 'medisena' AND constraint_type = 'FOREIGN KEY'
  `);
  console.log('\nIntegridad: PKs:', pks.rows[0].c, '| FKs:', fks.rows[0].c);
  console.log('');
  await client.end();
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
