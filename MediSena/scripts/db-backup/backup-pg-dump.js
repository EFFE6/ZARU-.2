#!/usr/bin/env node
/**
 * Genera dump (backup) de PostgreSQL local
 * Requiere: pg_dump en PATH, PostgreSQL corriendo
 * Uso: npm run backup:pg-dump
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { BACKUP_DIR } = require('./config');

const dumpDb = process.env.PGDUMP_DB || process.env.MEDISENA_DB || process.env.POSTGRES_DB || 'medisena';
const pgConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5433,
  user: process.env.POSTGRES_USER || 'medisena',
  password: process.env.POSTGRES_PASSWORD || 'medisena_local',
  database: dumpDb
};

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const dumpFile = path.join(BACKUP_DIR, `${dumpDb}_${timestamp}.sql`);

fs.mkdirSync(BACKUP_DIR, { recursive: true });

console.log('Generando dump PostgreSQL...');
console.log(`  DB: ${pgConfig.database}@${pgConfig.host}:${pgConfig.port}`);
console.log(`  Archivo: ${dumpFile}\n`);

try {
  process.env.PGPASSWORD = pgConfig.password;
  execSync(
    `pg_dump -h ${pgConfig.host} -p ${pgConfig.port} -U ${pgConfig.user} -d ${pgConfig.database} -F p -f "${dumpFile}"`,
    { stdio: 'inherit' }
  );
  console.log('\nDump generado:', dumpFile);
} catch (err) {
  console.error('Error. Verifica que pg_dump esté instalado y PostgreSQL accesible.');
  process.exit(1);
}
