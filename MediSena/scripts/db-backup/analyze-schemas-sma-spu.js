#!/usr/bin/env node
/**
 * Análisis de esquemas SMA y SPU para diseño de esquema unificado MediSENA.
 * Se ejecuta 100% en local usando solo las bases PostgreSQL (sin Oracle ni redes externas).
 *
 * - Conecta a medisena_backup (schema sma) y spu_backup (schema spu).
 * - Extrae tablas, columnas, tipos, PK y conteos desde information_schema y consultas COUNT.
 * - Compara nombres normalizados (SMA_* vs T_*) y columnas en común.
 *
 * Requiere: PostgreSQL local en marcha (puerto 5433 por defecto).
 * Uso: node analyze-schemas-sma-spu.js
 * Salida: backups/schema_analysis_report.json y reporte en consola.
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
const REPORT_PATH = path.join(BACKUP_DIR, 'schema_analysis_report.json');

async function getTablesAndColumns(client, schema) {
  const tables = await client.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = $1 AND table_type = 'BASE TABLE'
     ORDER BY table_name`,
    [schema]
  );
  const result = {};
  for (const r of tables.rows) {
    const tableName = r.table_name;
    const cols = await client.query(
      `SELECT column_name, data_type, udt_name, is_nullable
       FROM information_schema.columns
       WHERE table_schema = $1 AND table_name = $2
       ORDER BY ordinal_position`,
      [schema, tableName]
    );
    const pk = await client.query(
      `SELECT string_agg(kcu.column_name, ',' ORDER BY kcu.ordinal_position) as cols
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu
         ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
       WHERE tc.table_schema = $1 AND tc.table_name = $2 AND tc.constraint_type = 'PRIMARY KEY'`,
      [schema, tableName]
    );
    const countResult = await client.query(
      `SELECT COUNT(*)::bigint as cnt FROM ${schema}.${tableName}`
    ).catch(() => ({ rows: [{ cnt: null }] }));
    result[tableName] = {
      columns: cols.rows.map(c => ({
        name: c.column_name,
        type: c.data_type,
        udt: c.udt_name,
        nullable: c.is_nullable === 'YES'
      })),
      primaryKey: pk.rows[0]?.cols || null,
      rowCount: countResult.rows[0]?.cnt != null ? parseInt(countResult.rows[0].cnt, 10) : null
    };
  }
  return result;
}

/** Normaliza nombre de tabla para comparación: quita prefijo SMA_ / T_ y pasa a mayúsculas */
function normalizeTableName(name, source) {
  const u = name.toUpperCase();
  if (source === 'sma' && u.startsWith('SMA_')) return u.slice(4);
  if (source === 'spu' && u.startsWith('T_')) return u.slice(2);
  return u;
}

/** Similitud por nombre: mismo normalizado o uno contiene al otro */
function tableNameSimilarity(smaName, spuName) {
  const nSma = normalizeTableName(smaName, 'sma');
  const nSpu = normalizeTableName(spuName, 'spu');
  if (nSma === nSpu) return 'same_normalized';
  if (nSma.includes(nSpu) || nSpu.includes(nSma)) return 'partial';
  return null;
}

function columnOverlap(colsSma, colsSpu) {
  const setSma = new Set(colsSma.map(c => c.name.toLowerCase()));
  const setSpu = new Set(colsSpu.map(c => c.name.toLowerCase()));
  const common = [...setSma].filter(c => setSpu.has(c));
  const onlySma = [...setSma].filter(c => !setSpu.has(c));
  const onlySpu = [...setSpu].filter(c => !setSma.has(c));
  return { common, onlySma, onlySpu, pctCommon: setSma.size ? (common.length / setSma.size) * 100 : 0 };
}

async function main() {
  console.log('=== Análisis de esquemas SMA y SPU para diseño MediSENA unificado ===\n');

  const clientSma = new Client({ ...pgBase, database: process.env.POSTGRES_DB || 'medisena_backup' });
  const clientSpu = new Client({ ...pgBase, database: process.env.POSTGRES_SPU_DB || 'spu_backup' });

  await clientSma.connect();
  await clientSpu.connect();

  let schemaSma, schemaSpu;
  try {
    console.log('Extrayendo schema sma (medisena_backup)...');
    schemaSma = await getTablesAndColumns(clientSma, 'sma');
    console.log(`  Tablas: ${Object.keys(schemaSma).length}\n`);

    console.log('Extrayendo schema spu (spu_backup)...');
    schemaSpu = await getTablesAndColumns(clientSpu, 'spu');
    console.log(`  Tablas: ${Object.keys(schemaSpu).length}\n`);
  } finally {
    await clientSma.end();
    await clientSpu.end();
  }

  const smaTables = Object.keys(schemaSma);
  const spuTables = Object.keys(schemaSpu);

  const possibleOverlap = [];
  for (const st of smaTables) {
    for (const pt of spuTables) {
      const sim = tableNameSimilarity(st, pt);
      if (sim) {
        const overlap = columnOverlap(schemaSma[st].columns, schemaSpu[pt].columns);
        possibleOverlap.push({
          smaTable: st,
          spuTable: pt,
          similarity: sim,
          smaColumns: schemaSma[st].columns.length,
          spuColumns: schemaSpu[pt].columns.length,
          commonColumns: overlap.common.length,
          commonColumnNames: overlap.common,
          onlySma: overlap.onlySma.length,
          onlySpu: overlap.onlySpu.length,
          pctCommon: overlap.pctCommon.toFixed(1),
          rowCountSma: schemaSma[st].rowCount,
          rowCountSpu: schemaSpu[pt].rowCount
        });
      }
    }
  }

  const bySameNormalized = possibleOverlap.filter(o => o.similarity === 'same_normalized');
  const byPartial = possibleOverlap.filter(o => o.similarity === 'partial');

  const report = {
    generatedAt: new Date().toISOString(),
    schemas: {
      sma: {
        database: 'medisena_backup',
        schema: 'sma',
        tableCount: smaTables.length,
        tables: smaTables,
        details: schemaSma
      },
      spu: {
        database: 'spu_backup',
        schema: 'spu',
        tableCount: spuTables.length,
        tables: spuTables,
        details: schemaSpu
      }
    },
    analysis: {
      tablesWithSameNormalizedName: bySameNormalized.map(o => ({
        smaTable: o.smaTable,
        spuTable: o.spuTable,
        commonColumns: o.commonColumnNames,
        onlySma: o.onlySma,
        onlySpu: o.onlySpu,
        rowCountSma: o.rowCountSma,
        rowCountSpu: o.rowCountSpu
      })),
      tablesWithPartialNameMatch: byPartial.map(o => ({
        smaTable: o.smaTable,
        spuTable: o.spuTable,
        commonColumns: o.commonColumnNames.length,
        commonColumnNames: o.commonColumnNames
      })),
      smaOnlyTables: smaTables.filter(t => !spuTables.some(pt => normalizeTableName(pt, 'spu') === normalizeTableName(t, 'sma'))),
      spuOnlyTables: spuTables.filter(pt => !smaTables.some(t => normalizeTableName(t, 'sma') === normalizeTableName(pt, 'spu')))
    }
  };

  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');
  console.log('Reporte JSON guardado:', REPORT_PATH);

  console.log('\n--- Tablas con mismo nombre normalizado (posible duplicado conceptual) ---');
  if (bySameNormalized.length === 0) {
    console.log('  Ninguna (los prefijos SMA_ y T_ generan nombres distintos).');
  } else {
    bySameNormalized.forEach(o => {
      console.log(`  ${o.smaTable} (sma) <-> ${o.spuTable} (spu)`);
      console.log(`    Columnas en común: ${o.commonColumnNames.length} [${o.commonColumnNames.slice(0, 8).join(', ')}${o.commonColumnNames.length > 8 ? '...' : ''}]`);
      console.log(`    Solo en SMA: ${o.onlySma}, Solo en SPU: ${o.onlySpu}. Filas SMA: ${o.rowCountSma}, SPU: ${o.rowCountSpu}`);
    });
  }

  console.log('\n--- Coincidencias parciales de nombre ---');
  if (byPartial.length === 0) {
    console.log('  Ninguna.');
  } else {
    byPartial.slice(0, 20).forEach(o => {
      console.log(`  ${o.smaTable} <-> ${o.spuTable} (común: ${o.commonColumnNames.length} columnas)`);
    });
    if (byPartial.length > 20) console.log(`  ... y ${byPartial.length - 20} más.`);
  }

  console.log('\n--- Resumen ---');
  console.log(`  SMA: ${smaTables.length} tablas`);
  console.log(`  SPU: ${spuTables.length} tablas`);
  console.log(`  Mismo nombre normalizado: ${bySameNormalized.length}`);
  console.log(`  Coincidencia parcial: ${byPartial.length}`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
