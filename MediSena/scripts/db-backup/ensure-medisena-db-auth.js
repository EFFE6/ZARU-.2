#!/usr/bin/env node
/**
 * Asegura la base de datos medisena y ejecuta los SQL de RBAC y tokens (05, 06).
 * Uso: node ensure-medisena-db-auth.js
 * Requiere: backend/sql/05-create-rbac-tables-medisena.sql y 06-create-auth-token-security.sql
 */
const path = require('path');
const root = path.join(__dirname, '../..');
const preserveDb = { MEDISENA_DB: process.env.MEDISENA_DB, POSTGRES_DB: process.env.POSTGRES_DB };
['.env', 'config-puertos-libres.env'].forEach(f => {
  require('dotenv').config({ path: path.join(root, f) });
});
if (preserveDb.MEDISENA_DB) process.env.MEDISENA_DB = preserveDb.MEDISENA_DB;
if (preserveDb.POSTGRES_DB) process.env.POSTGRES_DB = preserveDb.POSTGRES_DB;
const { Client } = require('pg');
const fs = require('fs');

const pgBase = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5433', 10),
  user: process.env.POSTGRES_USER || 'medisena',
  password: process.env.POSTGRES_PASSWORD || 'medisena_local'
};

const MEDISENA_DB = process.env.MEDISENA_DB || process.env.POSTGRES_DB || 'medisena';
const SQL_05 = path.join(root, 'backend', 'sql', '05-create-rbac-tables-medisena.sql');
const SQL_06 = path.join(root, 'backend', 'sql', '06-create-auth-token-security.sql');

const PG_STARTING_UP = '57P03';
const MAX_CONNECT_ATTEMPTS = 24;  // 24 * 5s = 2 min max
const CONNECT_RETRY_MS = 5000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function connectWithRetry(client, label = 'PostgreSQL') {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_CONNECT_ATTEMPTS; attempt++) {
    try {
      await client.connect();
      return;
    } catch (err) {
      lastErr = err;
      const code = err.code || '';
      const msg = (err.message || '').toLowerCase();
      const isStartingUp = code === PG_STARTING_UP || /starting up|system is starting/i.test(msg);
      const isRefused = /ECONNREFUSED|connect.*refused/i.test(msg);
      if ((isStartingUp || isRefused) && attempt < MAX_CONNECT_ATTEMPTS) {
        console.warn(`  ${label} aun no listo (${err.message}). Reintento ${attempt}/${MAX_CONNECT_ATTEMPTS} en ${CONNECT_RETRY_MS / 1000}s...`);
        await sleep(CONNECT_RETRY_MS);
      } else {
        throw err;
      }
    }
  }
  throw lastErr;
}

async function ensureDatabase() {
  const admin = new Client({ ...pgBase, database: 'postgres' });
  await connectWithRetry(admin, 'PostgreSQL (admin)');
  try {
    const r = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [MEDISENA_DB]);
    if (r.rows.length === 0) {
      await admin.query(`CREATE DATABASE ${MEDISENA_DB}`);
      console.log('  Base de datos', MEDISENA_DB, 'creada.');
    } else {
      console.log('  Base de datos', MEDISENA_DB, 'ya existe.');
    }
  } finally {
    await admin.end();
  }
}

async function runSqlFile(client, filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn('  No encontrado:', filePath);
    return;
  }
  let sql = fs.readFileSync(filePath, 'utf8');
  sql = sql.replace(/--[^\n]*/g, '').trim();
  const statements = sql
    .split(/\s*;\s*\n\s*/)
    .map(s => s.trim())
    .filter(s => s.length > 2 && !/^\s*\)\s*$/.test(s));
  for (const stmt of statements) {
    const q = stmt + (stmt.endsWith(';') ? '' : ';');
    try {
      await client.query(q);
    } catch (err) {
      if (/already exists|duplicate key/i.test(err.message)) {
        // objeto ya existe o ON CONFLICT DO NOTHING
      } else {
        throw err;
      }
    }
  }
  console.log('  Ejecutado:', path.basename(filePath));
}

async function main() {
  console.log('=== Asegurar DB medisena y tablas auth/RBAC ===\n');
  await ensureDatabase();

  const client = new Client({ ...pgBase, database: MEDISENA_DB });
  await connectWithRetry(client, 'PostgreSQL (medisena)');
  try {
    await runSqlFile(client, SQL_05);
    await runSqlFile(client, SQL_06);
    console.log('\nListo.');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
