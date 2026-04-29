#!/usr/bin/env node
/**
 * Verifica el estado de columnas LOB/BLOB en el schema medisena (unificado).
 * - Tablas con columna *_path: LOB guardado en archivo (BACKUP_DIR/lobs/medisena/).
 * - Conteo: filas con contenido en DB vs filas con _path (archivo) vs total.
 * - Opcional: comprobar que los archivos referenciados existan en disco.
 */
const path = require('path');
const fs = require('fs');
const root = path.join(__dirname, '../..');
['.env', 'config-puertos-libres.env'].forEach(f => {
  require('dotenv').config({ path: path.join(root, f) });
});
const { Client } = require('pg');
const { BACKUP_DIR } = require('./config');

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

  console.log('\n=== Verificación LOB/BLOB en schema medisena ===');
  console.log('DB:', pgConfig.database, '| Host:', pgConfig.host + ':' + pgConfig.port);
  console.log('Directorio LOBs (archivos):', path.join(BACKUP_DIR, 'lobs', SCHEMA));
  console.log('');

  const pathCols = await client.query(`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = $1 AND column_name LIKE '%_path'
    ORDER BY table_name, column_name
  `, [SCHEMA]);

  if (pathCols.rows.length === 0) {
    console.log('No hay columnas *_path en el schema. Los LOBs se guardaron inline (TEXT/BYTEA) o no hay tablas SPU con LOB a archivo.');
    await client.end();
    return;
  }

  const byTable = {};
  for (const r of pathCols.rows) {
    if (!byTable[r.table_name]) byTable[r.table_name] = [];
    byTable[r.table_name].push(r.column_name);
  }

  let totalInDb = 0;
  let totalInFile = 0;
  let totalRows = 0;
  const lobDir = path.join(BACKUP_DIR, 'lobs', SCHEMA);
  let dirExists = false;
  let fileCount = 0;
  try {
    dirExists = fs.existsSync(lobDir);
    if (dirExists) {
      const walk = (p) => {
        let n = 0;
        try {
          const entries = fs.readdirSync(p, { withFileTypes: true });
          for (const e of entries) {
            if (e.isDirectory()) n += walk(path.join(p, e.name));
            else n += 1;
          }
        } catch (_) {}
        return n;
      };
      fileCount = walk(lobDir);
    }
  } catch (_) {}

  console.log('Tablas con columnas LOB en archivo (_path):\n');

  for (const [tableName, columns] of Object.entries(byTable)) {
    const baseCol = columns[0].replace(/_path$/, '');
    try {
      const qt = (s) => '"' + String(s).replace(/"/g, '""') + '"';
      const q = await client.query(
        `SELECT
           COUNT(*) AS total,
           COUNT(*) FILTER (WHERE ${qt(baseCol)} IS NOT NULL AND ${qt(baseCol)}::text <> '') AS in_db,
           COUNT(*) FILTER (WHERE ${qt(columns[0])} IS NOT NULL AND ${qt(columns[0])} <> '') AS in_file
         FROM ${qt(SCHEMA)}.${qt(tableName)}`
      );
      const r = q.rows[0];
      const total = parseInt(r.total, 10);
      const inDb = parseInt(r.in_db, 10);
      const inFile = parseInt(r.in_file, 10);
      totalRows += total;
      totalInDb += inDb;
      totalInFile += inFile;
      const status = total === 0 ? '-' : (inFile > 0 && inDb + inFile < total ? 'revisar' : 'OK');
      console.log(`  ${tableName}`);
      console.log(`    Columna LOB: ${baseCol} | _path: ${columns[0]}`);
      console.log(`    Filas: total=${total} | con contenido en DB=${inDb} | con path a archivo=${inFile} | ${status}`);
      console.log('');
    } catch (e) {
      console.log(`  ${tableName}: Error ${e.message}\n`);
    }
  }

  console.log('--- Resumen ---');
  console.log('  Filas con LOB en DB (inline):', totalInDb.toLocaleString('es-CO'));
  console.log('  Filas con LOB en archivo (_path):', totalInFile.toLocaleString('es-CO'));
  console.log('  Directorio LOBs existe:', dirExists ? 'Sí' : 'No', dirExists ? `(${fileCount} archivos)` : '');
  if (totalInFile > 0 && !dirExists) {
    console.log('  Aviso: hay filas con _path pero el directorio de LOBs no existe o no es accesible.');
  }
  if (totalInFile > 0 && dirExists && fileCount === 0) {
    console.log('  Aviso: hay filas con _path pero el directorio está vacío.');
  }
  console.log('');
  await client.end();
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
