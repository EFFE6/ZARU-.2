#!/usr/bin/env node
/**
 * Lista PK y FK del esquema SMA en PostgreSQL (medisena_backup).
 * Uso: node check-pg-keys.js
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
  database: process.env.POSTGRES_DB || 'medisena_backup'
};

async function main() {
  const client = new Client(pgConfig);
  await client.connect();
  try {
    const schema = 'sma';
    const pk = await client.query(`
      SELECT tc.table_name, tc.constraint_name, string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) AS columns
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      WHERE tc.table_schema = $1 AND tc.constraint_type = 'PRIMARY KEY'
      GROUP BY tc.table_name, tc.constraint_name
      ORDER BY tc.table_name
    `, [schema]);
    const fk = await client.query(`
      SELECT tc.table_name, tc.constraint_name,
             string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) AS columns,
             (SELECT ccu.table_name FROM information_schema.constraint_column_usage ccu
              WHERE ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema LIMIT 1) AS ref_table
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      WHERE tc.table_schema = $1 AND tc.constraint_type = 'FOREIGN KEY'
      GROUP BY tc.table_name, tc.constraint_name, tc.table_schema
      ORDER BY tc.table_name
    `, [schema]);
    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = $1 AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `, [schema]);

    console.log('=== PostgreSQL SMA (medisena_backup, schema sma) - Keys ===\n');
    console.log('Tablas:', tables.rows.length);
    console.log('\n--- Claves primarias (PK) ---');
    if (pk.rows.length === 0) {
      console.log('  (ninguna definida)');
    } else {
      pk.rows.forEach(r => console.log('  ', r.table_name, '->', r.constraint_name, '(', r.columns, ')'));
    }
    console.log('\n--- Claves foráneas (FK) ---');
    if (fk.rows.length === 0) {
      console.log('  (ninguna definida)');
    } else {
      fk.rows.forEach(r => console.log('  ', r.table_name, '.', r.constraint_name, ':', r.columns, '->', r.ref_table));
    }
    console.log('\nResumen: PK =', pk.rows.length, ', FK =', fk.rows.length);
  } finally {
    await client.end();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
