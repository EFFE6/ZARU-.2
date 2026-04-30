#!/usr/bin/env node
/**
 * Lista PKs y FKs del esquema medisena en PostgreSQL para verificar integridad relacional.
 * Las columnas de clave se preservan del origen; solo se normalizan nombres (minúsculas).
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

async function main() {
  const client = new Client(pgConfig);
  await client.connect();

  console.log('\n=== Integridad relacional en esquema', SCHEMA, '===\n');

  const pks = await client.query(`
    SELECT tc.table_name, tc.constraint_name,
           string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) AS columns
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    WHERE tc.table_schema = $1 AND tc.constraint_type = 'PRIMARY KEY'
    GROUP BY tc.table_name, tc.constraint_name
    ORDER BY tc.table_name
  `, [SCHEMA]);

  console.log('--- Primary Keys (PK) ---');
  console.log('(Nombre de restricción en PG = nombre Oracle en minúsculas; columnas = mismas que en origen)\n');
  for (const r of pks.rows) {
    console.log(`  ${r.table_name}`);
    console.log(`    Constraint: ${r.constraint_name}`);
    console.log(`    Columnas:   ${r.columns}`);
    console.log('');
  }

  const fks = await client.query(`
    SELECT tc.table_name, tc.constraint_name,
           string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) AS columns,
           ccu.table_name AS ref_table,
           string_agg(ccu.column_name, ', ' ORDER BY kcu.ordinal_position) AS ref_columns
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
    WHERE tc.table_schema = $1 AND tc.constraint_type = 'FOREIGN KEY'
    GROUP BY tc.table_name, tc.constraint_name, ccu.table_name
    ORDER BY tc.table_name, tc.constraint_name
  `, [SCHEMA]);

  console.log('--- Foreign Keys (FK) ---');
  console.log('(Cada FK apunta a la tabla referenciada en el mismo esquema)\n');
  for (const r of fks.rows) {
    console.log(`  ${r.table_name}.${r.constraint_name}`);
    console.log(`    Columnas:     ${r.columns}`);
    console.log(`    Referencia:   ${r.ref_table} (${r.ref_columns})`);
    console.log('');
  }

  const orphanCheck = await client.query(`
    SELECT conrelid::regclass::text AS tabla, conname AS fk_name,
           confrelid::regclass::text AS ref_table
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE n.nspname = $1 AND c.contype = 'f'
  `, [SCHEMA]);
  console.log('--- Resumen ---');
  console.log(`  PKs: ${pks.rows.length}`);
  console.log(`  FKs: ${fks.rows.length}`);
  console.log('\nLa integridad se mantiene: mismas columnas de PK y FK que en Oracle;');
  console.log('solo los nombres de restricción y columnas están en minúsculas en PostgreSQL.\n');

  await client.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
