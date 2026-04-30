#!/usr/bin/env node
/**
 * Fase 2: subir a PostgreSQL los LOBs que quedaron en archivos locales (_path).
 * Se ejecuta después de la migración SPU; lee desde backups/lobs/ por trozos
 * y hace UPDATE para poner el contenido en la columna y vaciar _path.
 * Uso: npm run upload:lobs
 */

const path = require('path');
const fs = require('fs');
const root = path.join(__dirname, '../..');
['.env', 'config-puertos-libres.env'].forEach(f => {
  require('dotenv').config({ path: path.join(root, f) });
});
const { Client } = require('pg');

const pgBaseConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5433', 10),
  user: process.env.POSTGRES_USER || 'medisena',
  password: process.env.POSTGRES_PASSWORD || 'medisena_local'
};
const { BACKUP_DIR } = require('./config');
const SPU_DB = process.env.POSTGRES_SPU_DB || 'spu_backup';
const PG_SCHEMA = 'spu';
const MAX_UPLOAD_MB = parseInt(process.env.MAX_UPLOAD_INLINE_MB || '50', 10);
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;
const READ_CHUNK = 1024 * 1024;

function readFileInChunks(filePath, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    const stream = fs.createReadStream(filePath, { highWaterMark: READ_CHUNK });
    stream.on('data', (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        stream.destroy();
        reject(new Error(`File exceeds ${maxBytes} bytes`));
        return;
      }
      chunks.push(chunk);
    });
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

async function getTablesWithPathColumns(client) {
  const r = await client.query(
    `SELECT table_name, column_name
     FROM information_schema.columns
     WHERE table_schema = $1 AND column_name LIKE '%_path'
     ORDER BY table_name, ordinal_position`,
    [PG_SCHEMA]
  );
  const byTable = {};
  for (const row of r.rows) {
    const tbl = row.table_name;
    if (!byTable[tbl]) byTable[tbl] = [];
    const baseCol = row.column_name.replace(/_path$/, '');
    byTable[tbl].push({ pathCol: row.column_name, baseCol });
  }
  return byTable;
}

async function uploadTable(client, tableName, pathColumns) {
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  for (const { pathCol, baseCol } of pathColumns) {
    const fullTable = `${PG_SCHEMA}.${tableName}`;
    const pathColQ = `"${pathCol}"`;
    const baseColQ = `"${baseCol}"`;
    const r = await client.query(
      `SELECT ctid, ${pathColQ} AS path_val FROM ${fullTable} WHERE ${pathColQ} IS NOT NULL AND ${pathColQ} != ''`
    );
    for (const row of r.rows) {
      const relPath = (row.path_val || '').trim().replace(/^\/+/, '');
      const absPath = path.join(BACKUP_DIR, relPath);
      try {
        if (!fs.existsSync(absPath)) {
          console.warn(`    File missing: ${relPath}`);
          errors++;
          continue;
        }
        const stat = fs.statSync(absPath);
        if (stat.size > MAX_UPLOAD_BYTES) {
          skipped++;
          continue;
        }
        const buffer = await readFileInChunks(absPath, MAX_UPLOAD_BYTES);
        await client.query(
          `UPDATE ${fullTable} SET ${baseColQ} = $1, ${pathColQ} = NULL WHERE ctid = $2::tid`,
          [buffer, row.ctid]
        );
        updated++;
      } catch (e) {
        if (errors < 5) console.warn(`    Error ${relPath}: ${e.message}`);
        errors++;
      }
    }
  }
  return { updated, skipped, errors };
}

async function main() {
  console.log('=== Subir LOBs desde archivos locales a PostgreSQL (Fase 2) ===\n');
  console.log('BACKUP_DIR:', BACKUP_DIR);
  console.log('MAX_UPLOAD_INLINE_MB:', MAX_UPLOAD_MB, '(archivos más grandes se dejan en disco)\n');

  const client = new Client({ ...pgBaseConfig, database: SPU_DB });
  await client.connect();

  try {
    const tables = await getTablesWithPathColumns(client);
    const tableNames = Object.keys(tables);
    if (tableNames.length === 0) {
      console.log('No hay tablas con columnas _path. Ejecute antes la migración SPU (Fase 1).');
      return;
    }
    console.log(`Tablas con columnas _path: ${tableNames.length}\n`);

    let totalUpdated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    for (const tableName of tableNames) {
      process.stdout.write(`  ${tableName}... `);
      const { updated, skipped, errors } = await uploadTable(client, tableName, tables[tableName]);
      totalUpdated += updated;
      totalSkipped += skipped;
      totalErrors += errors;
      console.log(`updated=${updated} skipped=${skipped} errors=${errors}`);
    }

    console.log('\n--- Resumen ---');
    console.log(`Filas actualizadas (contenido en DB): ${totalUpdated}`);
    console.log(`Filas omitidas (archivo > ${MAX_UPLOAD_MB} MB): ${totalSkipped}`);
    console.log(`Errores: ${totalErrors}`);
    if (totalSkipped > 0) {
      console.log(`\nPara subir archivos más grandes, aumente MAX_UPLOAD_INLINE_MB (actual: ${MAX_UPLOAD_MB}).`);
    }
  } finally {
    await client.end();
  }
  console.log('\n=== Fin Fase 2 ===');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
