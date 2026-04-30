#!/usr/bin/env node
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../..', '.env') });
const { Client } = require('pg');

const base = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5433', 10),
  user: process.env.POSTGRES_USER || 'medisena',
  password: process.env.POSTGRES_PASSWORD || 'medisena_local'
};

const targets = [
  { label: 'Backup SMA', db: process.env.POSTGRES_DB || 'medisena_backup', schema: 'sma' },
  { label: 'Backup SPU', db: process.env.POSTGRES_SPU_DB || 'spu_backup', schema: 'spu' },
  { label: 'MediSENA', db: process.env.MEDISENA_DB || 'medisena', schema: 'medisena' }
];

async function getSchemaInfo(target) {
  const client = new Client({ ...base, database: target.db });
  await client.connect();
  try {
    const tables = await client.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = $1 AND table_type = 'BASE TABLE'
       ORDER BY table_name`,
      [target.schema]
    );
    const columns = await client.query(
      `SELECT COUNT(*)::int AS total
       FROM information_schema.columns
       WHERE table_schema = $1`,
      [target.schema]
    );
    return {
      ...target,
      tableCount: tables.rows.length,
      columnCount: columns.rows[0].total,
      tables: tables.rows.map(r => r.table_name)
    };
  } finally {
    await client.end();
  }
}

(async () => {
  for (const t of targets) {
    try {
      const info = await getSchemaInfo(t);
      console.log(`\n=== ${info.label} ===`);
      console.log(`DB: ${info.db}`);
      console.log(`Schema: ${info.schema}`);
      console.log(`Tablas: ${info.tableCount}`);
      console.log(`Columnas totales: ${info.columnCount}`);
      console.log('Listado de tablas:');
      info.tables.forEach(name => console.log(` - ${name}`));
    } catch (e) {
      console.log(`\n=== ${t.label} ===`);
      console.log(`DB: ${t.db}`);
      console.log(`Schema: ${t.schema}`);
      console.log(`Error: ${e.message}`);
    }
  }
})();

