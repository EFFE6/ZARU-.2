#!/usr/bin/env node
/**
 * Lista PK y FK en todas las bases PostgreSQL del flujo MediSENA:
 * - medisena_backup (schema sma)
 * - spu_backup (schema spu)
 * - medisena (schema medisena)
 * Uso: node check-all-pg-keys.js
 */
const path = require('path');
const root = path.join(__dirname, '../..');
['.env', 'config-puertos-libres.env'].forEach(f => {
  require('dotenv').config({ path: path.join(root, f) });
});
const { Client } = require('pg');

const baseConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5433', 10),
  user: process.env.POSTGRES_USER || 'medisena',
  password: process.env.POSTGRES_PASSWORD || 'medisena_local'
};

const targets = [
  { database: process.env.POSTGRES_DB || 'medisena_backup', schema: 'sma', label: 'medisena_backup (sma)' },
  { database: process.env.SPU_BACKUP_DB || 'spu_backup', schema: 'spu', label: 'spu_backup (spu)' },
  { database: process.env.MEDISENA_DB || 'medisena', schema: 'medisena', label: 'medisena (medisena)' }
];

async function getKeys(client, schema) {
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
  return { pk, fk, tables };
}

async function main() {
  console.log('=== MediSENA - PK/FK en todas las bases PostgreSQL ===\n');

  for (const { database, schema, label } of targets) {
    const client = new Client({ ...baseConfig, database });
    try {
      await client.connect();
      const { pk, fk, tables } = await getKeys(client, schema);
      console.log(`--- ${label} ---`);
      console.log('Tablas:', tables.rows.length, '| PK:', pk.rows.length, '| FK:', fk.rows.length);
      if (pk.rows.length < tables.rows.length) {
        const withPk = new Set(pk.rows.map(r => r.table_name));
        const sinPk = tables.rows.filter(r => !withPk.has(r.table_name)).map(r => r.table_name);
        if (sinPk.length) console.log('  Tablas sin PK:', sinPk.join(', '));
      }
      if (pk.rows.length > 0 && pk.rows.length <= 15) {
        pk.rows.forEach(r => console.log('  PK', r.table_name, '->', r.columns));
      }
      if (fk.rows.length > 0 && fk.rows.length <= 20) {
        fk.rows.forEach(r => console.log('  FK', r.table_name, r.columns, '->', r.ref_table));
      }
      if (fk.rows.length > 20) console.log('  FK (solo total):', fk.rows.length);
      console.log('');
    } catch (err) {
      console.log(`--- ${label} ---`);
      console.log('  Error:', err.message, '(base o schema puede no existir aún)\n');
    } finally {
      await client.end();
    }
  }

  console.log('Resumen: Las intermedias (sma/spu) replican PK y FK desde Oracle.');
  console.log('El esquema medisena tiene PK por tabla e índices únicos por origen; no tiene FK entre tablas.');
}

main().catch(e => { console.error(e); process.exit(1); });
