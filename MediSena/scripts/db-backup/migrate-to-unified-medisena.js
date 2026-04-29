#!/usr/bin/env node
/**
 * @deprecated La unificación actual es directa Oracle SMA/SPU -> medisena (run-full-resync-to-medisena.ps1).
 * Este script era para migrar desde bases intermedias medisena_backup/spu_backup.
 *
 * Migración a base unificada MediSENA.
 * - Crea DB medisena y schema medisena.
 * - Unifica 4 pares (mismo nombre normalizado) y 41 pares (coincidencia parcial).
 * - Cada tabla unificada: origen ('sma'|'spu'), columnas sma_* y spu_* (prefijo para evitar choque).
 * - Cruce para evitar duplicados: donde exista clave comparable (ej. documento), se evita insertar duplicado desde SPU.
 * - Conserva integridad: PK única por (origen, pk_origen); se reportan candidatos a duplicado.
 *
 * Requiere: PostgreSQL local con medisena_backup y spu_backup. Lee backups/schema_analysis_report.json.
 * Uso: node migrate-to-unified-medisena.js
 */
const path = require('path');
const root = path.join(__dirname, '../..');
['.env', 'config-puertos-libres.env'].forEach(f => {
  require('dotenv').config({ path: path.join(root, f) });
});
const { Client } = require('pg');
const fs = require('fs');

const pgBase = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5433', 10),
  user: process.env.POSTGRES_USER || 'medisena',
  password: process.env.POSTGRES_PASSWORD || 'medisena_local'
};

const { BACKUP_DIR } = require('./config');
const MEDISENA_DB = process.env.MEDISENA_DB || 'medisena';
const REPORT_PATH = path.join(BACKUP_DIR, 'schema_analysis_report.json');
const SUMMARY_PATH = path.join(BACKUP_DIR, 'unified_migration_summary.json');

/** Dedup: cruce documento+letra para evitar mismo beneficiario en SMA y SPU */
const DEDUP_KEYS = {
  beneficiarios: {
    smaKey: ['iden_ben', 'letra_ben'],
    spuKey: ['t_beneficiariosdocumento', 't_beneficiariosletra']
  }
};
const BATCH_SIZE = 500;
const PROTECTED_TABLE_PREFIXES = ['auth_', 'rbac_'];

function isProtectedTable(tableName) {
  const name = String(tableName || '').toLowerCase();
  return PROTECTED_TABLE_PREFIXES.some(prefix => name.startsWith(prefix));
}

function pgType(c) {
  const t = (c.udt || c.type || '').toLowerCase();
  if (t === 'numeric') return 'NUMERIC';
  if (t === 'integer' || t === 'bigint' || t === 'smallint') return 'BIGINT';
  if (t === 'text' || t === 'character varying' || t === 'varchar') return 'TEXT';
  if (t === 'timestamp without time zone' || t === 'timestamp') return 'TIMESTAMP';
  if (t === 'bytea') return 'BYTEA';
  if (t === 'real' || t === 'double precision') return 'REAL';
  return 'TEXT';
}

function safeCol(name) {
  return '"' + String(name).replace(/"/g, '""') + '"';
}

function toNumberSafe(s) {
  if (s == null || typeof s !== 'string') return null;
  let s2 = String(s).trim()
    .replace(/,/g, '.')
    .replace(/[\s\u00A0\u202F]/g, '')
    .replace(/[\u066B\u066C\u201A\uFE10\uFE50\uFF0C]/g, '.');
  let n = Number(s2);
  if (Number.isFinite(n)) return n;
  s2 = String(s).trim().replace(/[^\d.eE+-]/g, '');
  n = Number(s2);
  return Number.isFinite(n) ? n : null;
}

function normalizeValue(v, col) {
  if (v == null) return null;
  if (typeof v === 'number') {
    if (Number.isFinite(v)) return v;
    return null;
  }
  if (typeof v === 'string' && /[eE][+-]?\d/.test(v)) {
    const n = toNumberSafe(v);
    if (n !== null) return n;
  }
  const t = (col.udt || col.type || '').toLowerCase();
  const isNumeric = t === 'numeric' || t === 'integer' || t === 'bigint' || t === 'real' || t === 'double precision' || t === 'smallint';
  if (isNumeric && typeof v === 'string') {
    const n = toNumberSafe(v);
    if (n !== null) return n;
  }
  return v;
}

function rowToValues(row, cols) {
  return cols.map(c => {
    const key = Object.keys(row).find(k => k.toLowerCase() === c.name.toLowerCase()) || c.name;
    return normalizeValue(row[key], c);
  });
}

function colTypesForUnified(smaCols, spuCols) {
  return ['text', ...smaCols.map(c => (c.udt || c.type || 'text').toLowerCase()), ...spuCols.map(c => (c.udt || c.type || 'text').toLowerCase())];
}

function sanitizeNumericStrings(flatValues, colTypesPerRow, nCols) {
  if (!colTypesPerRow || colTypesPerRow.length !== nCols) return flatValues;
  return flatValues.map((v, i) => {
    if (typeof v !== 'string') return v;
    const t = colTypesPerRow[i % nCols];
    const isNum = t === 'numeric' || t === 'integer' || t === 'bigint' || t === 'real' || t === 'double precision' || t === 'smallint';
    if (isNum || /[eE][+-]?\d/.test(v)) {
      const n = toNumberSafe(v);
      if (n !== null) return n;
    }
    return v;
  });
}

async function batchInsert(clientMed, fullName, colList, rowsValues, colTypes) {
  if (rowsValues.length === 0) return;
  const nCols = rowsValues[0].length;
  const placeholders = rowsValues.map((_, i) =>
    '(' + Array.from({ length: nCols }, (_, j) => '$' + (i * nCols + j + 1)).join(', ') + ')'
  ).join(', ');
  let flat = rowsValues.flat();
  if (colTypes && colTypes.length === nCols) {
    flat = sanitizeNumericStrings(flat, colTypes, nCols);
  }
  await clientMed.query(
    `INSERT INTO ${fullName} (${colList}) VALUES ${placeholders}`,
    flat
  );
}

async function ensureDatabase() {
  const admin = new Client({ ...pgBase, database: 'postgres' });
  await admin.connect();
  try {
    const r = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [MEDISENA_DB]);
    if (r.rows.length === 0) {
      await admin.query(`CREATE DATABASE ${MEDISENA_DB}`);
      console.log('  Base de datos', MEDISENA_DB, 'creada.');
    }
  } finally {
    await admin.end();
  }
}

async function run() {
  console.log('=== Migración a base unificada MediSENA ===\n');

  if (!fs.existsSync(REPORT_PATH)) {
    console.error('Ejecute primero: node analyze-schemas-sma-spu.js');
    process.exit(1);
  }
  const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));
  const smaDetails = report.schemas.sma.details;
  const spuDetails = report.schemas.spu.details;

  await ensureDatabase();

  const clientSma = new Client({ ...pgBase, database: process.env.POSTGRES_DB || 'medisena_backup' });
  const clientSpu = new Client({ ...pgBase, database: process.env.POSTGRES_SPU_DB || 'spu_backup' });
  const clientMed = new Client({ ...pgBase, database: MEDISENA_DB });

  await clientSma.connect();
  await clientSpu.connect();
  await clientMed.connect();

  await clientMed.query('CREATE SCHEMA IF NOT EXISTS medisena');
  const summary = { generatedAt: new Date().toISOString(), sameName: [], partial: [], errors: [] };

  try {
    // ---------- 1.2 Tablas con mismo nombre normalizado (4 pares) ----------
    const sameName = report.analysis.tablesWithSameNormalizedName || [];
    for (const pair of sameName) {
      const smaTable = pair.smaTable;
      const spuTable = pair.spuTable;
      const unifiedName = smaTable.replace(/^sma_/, '').replace(/^t_/, ''); // beneficiarios, cargos, ordenes, prueba
      const smaCols = smaDetails[smaTable]?.columns || [];
      const spuCols = spuDetails[spuTable]?.columns || [];
      const smaPk = (smaDetails[smaTable]?.primaryKey || '').split(',').map(s => s.trim()).filter(Boolean);
      const spuPk = (spuDetails[spuTable]?.primaryKey || '').split(',').map(s => s.trim()).filter(Boolean);

      const cols = ['id SERIAL PRIMARY KEY', 'origen TEXT NOT NULL'];
      smaCols.forEach(c => cols.push(`sma_${c.name} ${pgType(c)}`));
      spuCols.forEach(c => cols.push(`spu_${c.name} ${pgType(c)}`));

      const fullName = `medisena.${unifiedName}`;
      if (isProtectedTable(unifiedName)) {
        console.log(`  [1.2] ${unifiedName}: tabla protegida, se omite para preservar RBAC/seguridad`);
        continue;
      }
      await clientMed.query(`DROP TABLE IF EXISTS ${fullName} CASCADE`);
      await clientMed.query(`CREATE TABLE ${fullName} (${cols.join(', ')})`);

      const smaColList = smaCols.map(c => safeCol('sma_' + c.name)).join(', ');
      const spuColList = spuCols.map(c => safeCol('spu_' + c.name)).join(', ');
      const insertColList = 'origen, ' + smaColList + ', ' + spuColList;
      const smaSrcList = smaCols.map(c => safeCol(c.name)).join(', ');
      const spuSrcList = spuCols.map(c => safeCol(c.name)).join(', ');
      const nCols = 1 + smaCols.length + spuCols.length;
      const unifiedColTypes = colTypesForUnified(smaCols, spuCols);

      let insSma = 0, insSpu = 0, skippedSpu = 0;
      const resSma = await clientSma.query(`SELECT ${smaSrcList} FROM sma.${smaTable}`);
      let batch = [];
      for (const row of resSma.rows) {
        batch.push(['sma', ...rowToValues(row, smaCols), ...spuCols.map(() => null)]);
        if (batch.length >= BATCH_SIZE) {
          await batchInsert(clientMed, fullName, insertColList, batch, unifiedColTypes);
          insSma += batch.length;
          batch = [];
        }
      }
      if (batch.length) {
        await batchInsert(clientMed, fullName, insertColList, batch, unifiedColTypes);
        insSma += batch.length;
      }

      const dedup = DEDUP_KEYS[unifiedName];
      const resSpu = await clientSpu.query(`SELECT ${spuSrcList} FROM spu.${spuTable}`);
      batch = [];
      for (const row of resSpu.rows) {
        if (dedup && dedup.smaKey && dedup.spuKey) {
          const keyVals = dedup.spuKey.map(k => {
            const v = row[k];
            const n = toNumberSafe(v);
            return n !== null ? n : v;
          });
          const existing = await clientMed.query(
            `SELECT 1 FROM ${fullName} WHERE origen = 'sma' AND ${dedup.smaKey.map((c, i) => `sma_${c} = $${i + 1}`).join(' AND ')}`,
            keyVals
          );
          if (existing.rows.length > 0) {
            skippedSpu++;
            continue;
          }
        }
        batch.push(['spu', ...smaCols.map(() => null), ...rowToValues(row, spuCols)]);
        if (batch.length >= BATCH_SIZE) {
          await batchInsert(clientMed, fullName, insertColList, batch, unifiedColTypes);
          insSpu += batch.length;
          batch = [];
        }
      }
      if (batch.length) {
        await batchInsert(clientMed, fullName, insertColList, batch, unifiedColTypes);
        insSpu += batch.length;
      }

      if (smaPk.length) {
        const smaPkCols = smaPk.map(c => safeCol('sma_' + c)).join(', ');
        await clientMed.query(`CREATE UNIQUE INDEX IF NOT EXISTS ${unifiedName}_sma_pk ON ${fullName} (origen, ${smaPkCols}) WHERE origen = 'sma'`).catch(() => {});
      }
      if (spuPk.length) {
        const spuPkCols = spuPk.map(c => safeCol('spu_' + c)).join(', ');
        await clientMed.query(`CREATE UNIQUE INDEX IF NOT EXISTS ${unifiedName}_spu_pk ON ${fullName} (origen, ${spuPkCols}) WHERE origen = 'spu'`).catch(() => {});
      }
      summary.sameName.push({
        unifiedTable: unifiedName,
        smaTable,
        spuTable,
        insertedSma: insSma,
        insertedSpu: insSpu,
        skippedSpuDuplicate: skippedSpu
      });
      console.log(`  [1.2] ${unifiedName}: SMA ${insSma}, SPU ${insSpu} (omitidos por duplicado: ${skippedSpu})`);
    }

    // ---------- 1.3 Coincidencias parciales (41 pares) ----------
    const partial = report.analysis.tablesWithPartialNameMatch || [];
    for (const pair of partial) {
      const smaTable = pair.smaTable;
      const spuTable = pair.spuTable;
      const unifiedName = `${smaTable.replace(/^sma_/, '')}_${spuTable.replace(/^t_/, '')}`.replace(/[^a-z0-9_]/gi, '_').toLowerCase();
      const smaCols = smaDetails[smaTable]?.columns || [];
      const spuCols = spuDetails[spuTable]?.columns || [];

      const cols = ['id SERIAL PRIMARY KEY', 'origen TEXT NOT NULL'];
      smaCols.forEach(c => cols.push(`sma_${c.name} ${pgType(c)}`));
      spuCols.forEach(c => cols.push(`spu_${c.name} ${pgType(c)}`));

      const fullName = `medisena.${unifiedName}`;
      if (isProtectedTable(unifiedName)) {
        console.log(`  [1.3] ${unifiedName}: tabla protegida, se omite para preservar RBAC/seguridad`);
        continue;
      }
      await clientMed.query(`DROP TABLE IF EXISTS ${fullName} CASCADE`);
      await clientMed.query(`CREATE TABLE ${fullName} (${cols.join(', ')})`);

      const smaColList = smaCols.map(c => safeCol('sma_' + c.name)).join(', ');
      const spuColList = spuCols.map(c => safeCol('spu_' + c.name)).join(', ');
      const insertColList = 'origen, ' + smaColList + ', ' + spuColList;
      const smaSrcList = smaCols.map(c => safeCol(c.name)).join(', ');
      const spuSrcList = spuCols.map(c => safeCol(c.name)).join(', ');
      const unifiedColTypes = colTypesForUnified(smaCols, spuCols);

      let insSma = 0, insSpu = 0;
      try {
        const resSma = await clientSma.query(`SELECT ${smaSrcList} FROM sma.${smaTable}`);
        let batch = [];
        for (const row of resSma.rows) {
          batch.push(['sma', ...rowToValues(row, smaCols), ...spuCols.map(() => null)]);
          if (batch.length >= BATCH_SIZE) {
            await batchInsert(clientMed, fullName, insertColList, batch, unifiedColTypes);
            insSma += batch.length;
            batch = [];
          }
        }
        if (batch.length) {
          await batchInsert(clientMed, fullName, insertColList, batch, unifiedColTypes);
          insSma += batch.length;
        }
      } catch (e) {
        summary.errors.push({ table: unifiedName, phase: 'sma', error: e.message });
      }
      try {
        const resSpu = await clientSpu.query(`SELECT ${spuSrcList} FROM spu.${spuTable}`);
        let batch = [];
        for (const row of resSpu.rows) {
          batch.push(['spu', ...smaCols.map(() => null), ...rowToValues(row, spuCols)]);
          if (batch.length >= BATCH_SIZE) {
            await batchInsert(clientMed, fullName, insertColList, batch, unifiedColTypes);
            insSpu += batch.length;
            batch = [];
          }
        }
        if (batch.length) {
          await batchInsert(clientMed, fullName, insertColList, batch, unifiedColTypes);
          insSpu += batch.length;
        }
      } catch (e) {
        summary.errors.push({ table: unifiedName, phase: 'spu', error: e.message });
      }
      summary.partial.push({
        unifiedTable: unifiedName,
        smaTable,
        spuTable,
        insertedSma: insSma,
        insertedSpu: insSpu
      });
      if (summary.errors.some(e => e.table === unifiedName)) return;
      console.log(`  [1.3] ${unifiedName}: SMA ${insSma}, SPU ${insSpu}`);
    }

    // ---------- 1.4 UNIQUE (origen, pk) para que las FK puedan referenciar ----------
    // En PG las FK solo pueden apuntar a PK o UNIQUE; los índices parciales (WHERE origen='sma') no sirven.
    console.log('\n  [1.4] Añadiendo UNIQUE (origen, pk) en tablas unificadas...');
    const allUnified = [];
    for (const pair of sameName) {
      const smaTable = pair.smaTable;
      const spuTable = pair.spuTable;
      const unifiedName = smaTable.replace(/^sma_/i, '').replace(/^t_/i, '');
      if (!isProtectedTable(unifiedName)) allUnified.push({ unifiedName, smaTable, spuTable, kind: 'same' });
    }
    for (const pair of partial) {
      const unifiedName = `${pair.smaTable.replace(/^sma_/i, '')}_${pair.spuTable.replace(/^t_/i, '')}`.replace(/[^a-z0-9_]/gi, '_').toLowerCase();
      if (!isProtectedTable(unifiedName)) allUnified.push({ unifiedName, smaTable: pair.smaTable, spuTable: pair.spuTable, kind: 'partial' });
    }
    for (const { unifiedName, smaTable, spuTable } of allUnified) {
      const fullName = `medisena.${unifiedName}`;
      const smaPk = (smaDetails[smaTable]?.primaryKey || '').split(',').map(s => s.trim()).filter(Boolean);
      const spuPk = (spuDetails[spuTable]?.primaryKey || '').split(',').map(s => s.trim()).filter(Boolean);
      if (smaPk.length) {
        const cols = smaPk.map(c => safeCol('sma_' + c)).join(', ');
        const cname = `unq_${unifiedName}_sma`.toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 63);
        await clientMed.query(`ALTER TABLE ${fullName} ADD CONSTRAINT ${cname} UNIQUE (origen, ${cols})`).catch(e => {
          if (!/already exists/.test(e.message)) console.warn(`    UNIQUE ${unifiedName} (sma):`, e.message);
        });
      }
      if (spuPk.length) {
        const cols = spuPk.map(c => safeCol('spu_' + c)).join(', ');
        const cname = `unq_${unifiedName}_spu`.toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 63);
        await clientMed.query(`ALTER TABLE ${fullName} ADD CONSTRAINT ${cname} UNIQUE (origen, ${cols})`).catch(e => {
          if (!/already exists/.test(e.message)) console.warn(`    UNIQUE ${unifiedName} (spu):`, e.message);
        });
      }
    }

    // ---------- 1.5 Replicar FK desde medisena_backup.sma y spu_backup.spu ----------
    const smaTableToUnified = {};
    for (const pair of sameName) {
      const u = pair.smaTable.replace(/^sma_/i, '').replace(/^t_/i, '');
      smaTableToUnified[pair.smaTable.toLowerCase()] = u;
    }
    for (const pair of partial) {
      const u = `${pair.smaTable.replace(/^sma_/i, '')}_${pair.spuTable.replace(/^t_/i, '')}`.replace(/[^a-z0-9_]/gi, '_').toLowerCase();
      smaTableToUnified[pair.smaTable.toLowerCase()] = u;
    }
    const spuTableToUnified = {};
    for (const pair of sameName) {
      const u = pair.smaTable.replace(/^sma_/i, '').replace(/^t_/i, '');
      spuTableToUnified[pair.spuTable.toLowerCase()] = u;
    }
    for (const pair of partial) {
      const u = `${pair.smaTable.replace(/^sma_/i, '')}_${pair.spuTable.replace(/^t_/i, '')}`.replace(/[^a-z0-9_]/gi, '_').toLowerCase();
      spuTableToUnified[pair.spuTable.toLowerCase()] = u;
    }

    async function getFksFromSchema(client, schema) {
      const q = await client.query(`
        SELECT c.conrelid::regclass::text AS child_table, c.conname AS constraint_name,
               (SELECT array_agg(a.attname ORDER BY array_position(c.conkey, a.attnum)) FROM pg_attribute a
                WHERE a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey) AND NOT a.attisdropped) AS child_cols,
               c.confrelid::regclass::text AS ref_table,
               (SELECT array_agg(a.attname ORDER BY array_position(c.confkey, a.attnum)) FROM pg_attribute a
                WHERE a.attrelid = c.confrelid AND a.attnum = ANY(c.confkey) AND NOT a.attisdropped) AS ref_cols
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace AND n.nspname = $1
        WHERE c.contype = 'f'
      `, [schema]);
      function toArray(v) {
        if (Array.isArray(v)) return v;
        if (v == null) return [];
        if (typeof v === 'string') {
          const s = v.replace(/^\{|\}$/g, '').trim();
          if (!s) return [];
          return s.split(',').map(c => c.replace(/^"|"$/g, '').trim()).filter(Boolean);
        }
        return [];
      }
      return q.rows.map(r => ({
        childTable: r.child_table.replace(/^"?\w+"?\./, '').replace(/^"/, '').replace(/"$/, ''),
        constraintName: r.constraint_name,
        childCols: toArray(r.child_cols),
        refTable: r.ref_table.replace(/^"?\w+"?\./, '').replace(/^"/, '').replace(/"$/, ''),
        refCols: toArray(r.ref_cols)
      }));
    }

    const medTables = await clientMed.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'medisena' AND table_type = 'BASE TABLE'`);
    const medSet = new Set(medTables.rows.map(r => r.table_name));

    let fkAdded = 0;
    const fksSma = await getFksFromSchema(clientSma, 'sma');
    for (const fk of fksSma) {
      const childUnified = smaTableToUnified[fk.childTable.toLowerCase()];
      const parentUnified = smaTableToUnified[fk.refTable.toLowerCase()];
      if (!childUnified || !parentUnified || !medSet.has(childUnified) || !medSet.has(parentUnified)) continue;
      const childColsArr = Array.isArray(fk.childCols) ? fk.childCols : [];
      const refColsArr = Array.isArray(fk.refCols) ? fk.refCols : [];
      const childCols = ['origen', ...childColsArr.map(c => 'sma_' + c)].map(c => safeCol(c)).join(', ');
      const refCols = ['origen', ...refColsArr.map(c => 'sma_' + c)].map(c => safeCol(c)).join(', ');
      const cname = `fk_${childUnified}_${parentUnified}_${(fk.constraintName || 'sma').toLowerCase()}`.replace(/[^a-z0-9_]/g, '_').slice(0, 63);
      try {
        await clientMed.query(`ALTER TABLE medisena.${childUnified} ADD CONSTRAINT ${cname} FOREIGN KEY (${childCols}) REFERENCES medisena.${parentUnified} (${refCols})`);
        fkAdded++;
      } catch (e) {
        if (!/already exists/.test(e.message)) console.warn(`    FK ${childUnified} -> ${parentUnified}:`, e.message);
      }
    }

    const fksSpu = await getFksFromSchema(clientSpu, 'spu');
    for (const fk of fksSpu) {
      const childUnified = spuTableToUnified[fk.childTable.toLowerCase()];
      const parentUnified = spuTableToUnified[fk.refTable.toLowerCase()];
      if (!childUnified || !parentUnified || !medSet.has(childUnified) || !medSet.has(parentUnified)) continue;
      const childColsArr = Array.isArray(fk.childCols) ? fk.childCols : [];
      const refColsArr = Array.isArray(fk.refCols) ? fk.refCols : [];
      const childCols = ['origen', ...childColsArr.map(c => 'spu_' + c)].map(c => safeCol(c)).join(', ');
      const refCols = ['origen', ...refColsArr.map(c => 'spu_' + c)].map(c => safeCol(c)).join(', ');
      const cname = `fk_${childUnified}_${parentUnified}_${(fk.constraintName || 'spu').toLowerCase()}`.replace(/[^a-z0-9_]/g, '_').slice(0, 63);
      try {
        await clientMed.query(`ALTER TABLE medisena.${childUnified} ADD CONSTRAINT ${cname} FOREIGN KEY (${childCols}) REFERENCES medisena.${parentUnified} (${refCols})`);
        fkAdded++;
      } catch (e) {
        if (!/already exists/.test(e.message)) console.warn(`    FK ${childUnified} -> ${parentUnified}:`, e.message);
      }
    }
    console.log(`  [1.5] FK replicadas en medisena: ${fkAdded}`);

  } finally {
    await clientSma.end();
    await clientSpu.end();
    fs.mkdirSync(path.dirname(SUMMARY_PATH), { recursive: true });
    fs.writeFileSync(SUMMARY_PATH, JSON.stringify(summary, null, 2), 'utf8');
    await clientMed.end();
  }

  console.log('\nResumen guardado en', SUMMARY_PATH);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
