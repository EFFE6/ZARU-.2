#!/usr/bin/env node
/**
 * Revisión detallada de tablas LOB marcadas "revisar":
 * - Desglose: filas con contenido solo en DB, solo en archivo (_path), ambos, ninguno.
 * - Comprueba que los archivos referenciados en _path existan en disco.
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

const TABLES_TO_REVIEW = [
  { table: 't_beneficiarios', baseCol: 't_beneficiarioscert1', pathCol: 't_beneficiarioscert1_path' },
  { table: 't_cronogramaactividades', baseCol: 't_cronogramaactividadesdoc', pathCol: 't_cronogramaactividadesdoc_path' }
];

function qt(s) {
  return '"' + String(s).replace(/"/g, '""') + '"';
}

async function main() {
  const client = new Client(pgConfig);
  await client.connect();
  const lobDir = path.join(BACKUP_DIR, 'lobs', SCHEMA);

  console.log('\n=== Revisión detallada LOB (tablas "revisar") ===\n');

  for (const { table, baseCol, pathCol } of TABLES_TO_REVIEW) {
    console.log('---', table, '---');
    const tableQt = qt(table);
    const baseQt = qt(baseCol);
    const pathQt = qt(pathCol);

    const hasBase = `(${baseQt} IS NOT NULL AND ${baseQt}::text <> '')`;
    const hasPath = `(${pathQt} IS NOT NULL AND ${pathQt} <> '')`;

    const q = await client.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE ${hasBase} AND NOT ${hasPath}) AS only_db,
        COUNT(*) FILTER (WHERE ${hasPath} AND NOT ${hasBase}) AS only_file,
        COUNT(*) FILTER (WHERE ${hasBase} AND ${hasPath}) AS both,
        COUNT(*) FILTER (WHERE NOT ${hasBase} AND NOT ${hasPath}) AS neither
      FROM ${qt(SCHEMA)}.${tableQt}
    `);
    const r = q.rows[0];
    const total = parseInt(r.total, 10);
    const onlyDb = parseInt(r.only_db, 10);
    const onlyFile = parseInt(r.only_file, 10);
    const both = parseInt(r.both, 10);
    const neither = parseInt(r.neither, 10);

    console.log('  Total filas:', total);
    console.log('  Solo contenido en DB (inline):', onlyDb);
    console.log('  Solo _path (archivo):', onlyFile);
    console.log('  Ambos (DB + _path):', both);
    console.log('  Ninguno (LOB y _path null):', neither);

    const withData = onlyDb + onlyFile + both;
    if (neither > 0) {
      console.log('  -> Las', neither, 'filas sin LOB ni _path suelen ser normales si la columna es opcional en Oracle.');
    }
    if (withData !== total) {
      console.log('  -> Conteo con dato:', withData, '| Sin dato:', neither);
    }

    if (onlyFile + both > 0) {
      const pathsQ = await client.query(`
        SELECT ${pathQt} AS p FROM ${qt(SCHEMA)}.${tableQt}
        WHERE ${hasPath} LIMIT 20
      `);
      let found = 0;
      let missing = 0;
      const missingPaths = [];
      for (const row of pathsQ.rows) {
        const relPath = row.p;
        if (!relPath) continue;
        const absPath = path.join(BACKUP_DIR, relPath);
        if (fs.existsSync(absPath)) found++;
        else { missing++; if (missingPaths.length < 5) missingPaths.push(relPath); }
      }
      console.log('  Muestra de archivos _path (hasta 20): existen', found, '| no encontrados', missing);
      if (missingPaths.length) {
        console.log('  Rutas no encontradas (ej.):', missingPaths.slice(0, 3).join(', '));
      }
    }
    console.log('');
  }

  await client.end();
  console.log('Revisión terminada. Si "Ninguno" es alto, suele ser columna LOB opcional en origen.\n');
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
