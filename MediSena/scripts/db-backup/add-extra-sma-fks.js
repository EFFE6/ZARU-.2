#!/usr/bin/env node
/**
 * Añade FKs adicionales en medisena para tablas sma_* que no vienen de Oracle.
 * Reglas: (1) Explícitas en EXPLICIT_FKS. (2) iden_func: sma_funcionarios tiene PK iden_func;
 * en toda otra tabla sma_* donde exista columna iden_func o iden_func_* se crea FK a sma_funcionarios.iden_func.
 * (3) Candidatos por convención (columna = PK o prefijo_sufijo de otra tabla).
 * Uso: node add-extra-sma-fks.js [--dry-run] [--apply] [--not-valid]
 *   --not-valid: crear FK sin validar filas existentes (útil si hay datos huérfanos).
 */
const path = require('path');
const root = path.join(__dirname, '../..');
['.env', 'config-puertos-libres.env'].forEach(f => {
  require('dotenv').config({ path: path.join(root, f) });
});
const { Client } = require('pg');

const SCHEMA = 'medisena';
const pgConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5433', 10),
  user: process.env.POSTGRES_USER || 'medisena',
  password: process.env.POSTGRES_PASSWORD || 'medisena_local',
  database: process.env.MEDISENA_DB || process.env.POSTGRES_DB || 'medisena'
};

const DRY_RUN = process.argv.includes('--dry-run');
const APPLY = process.argv.includes('--apply');
const NOT_VALID = process.argv.includes('--not-valid'); // No validar filas existentes; solo inserciones futuras

// FKs explícitos solicitados: [ tabla, columna, ref_tabla, ref_columna ]
const EXPLICIT_FKS = [
  ['sma_adscritos', 'cod_espe_adsc', 'sma_especialidades', 'cod_espe'],
  ['sma_examenes', 'codigo_exa_catalogo_exa', 'sma_examenes_laboratorio', 'cod_exa_lab'],
  ['sma_funcionarios', 'cod_cargo_func', 'sma_cargos', 'cod_car'],
  ['sma_prueba', 'cod_cargo_func', 'sma_cargos', 'cod_car']
];

function constraintName(tableName, refTableName) {
  const name = `fk_${tableName}_${refTableName}_extra`.toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 63);
  return name;
}

async function main() {
  const client = new Client(pgConfig);
  await client.connect();

  const tablesRes = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = $1 AND table_type = 'BASE TABLE' AND table_name LIKE 'sma_%'
    ORDER BY table_name
  `, [SCHEMA]);
  const tableList = (tablesRes.rows || []).map(r => r.table_name);

  const columnsRes = await client.query(`
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = $1 AND table_name LIKE 'sma_%'
    ORDER BY table_name, ordinal_position
  `, [SCHEMA]);
  const columnsByTable = new Map();
  for (const r of (columnsRes.rows || [])) {
    if (!columnsByTable.has(r.table_name)) columnsByTable.set(r.table_name, []);
    columnsByTable.get(r.table_name).push({ name: r.column_name, type: r.data_type });
  }

  const pkRes = await client.query(`
    SELECT tc.table_name, string_agg(kcu.column_name, ',' ORDER BY kcu.ordinal_position) AS pk_cols
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    WHERE tc.table_schema = $1 AND tc.constraint_type = 'PRIMARY KEY' AND tc.table_name LIKE 'sma_%'
    GROUP BY tc.table_name
  `, [SCHEMA]);
  const pkByTable = new Map();
  for (const r of (pkRes.rows || [])) {
    pkByTable.set(r.table_name, (r.pk_cols || '').split(',').map(c => c.trim()).filter(Boolean));
  }

  const fkRes = await client.query(`
    SELECT tc.table_name, kcu.column_name, ccu.table_name AS ref_table, ccu.column_name AS ref_column
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
    WHERE tc.table_schema = $1 AND tc.constraint_type = 'FOREIGN KEY' AND tc.table_name LIKE 'sma_%'
  `, [SCHEMA]);
  const existingFkSet = new Set();
  for (const r of (fkRes.rows || [])) {
    existingFkSet.add(`${r.table_name}|${r.column_name}|${r.ref_table}|${r.ref_column}`);
  }

  const tableSet = new Set(tableList);
  const skipRefTables = new Set(['sma_prueba']);
  const skipChildTables = new Set(['sma_prueba']);
  tableList.forEach(t => {
    if (t.endsWith('_destino')) { skipRefTables.add(t); skipChildTables.add(t); }
  });
  const toAdd = [];

  for (const [childTable, childCol, refTable, refCol] of EXPLICIT_FKS) {
    if (!tableSet.has(childTable) || !tableSet.has(refTable)) continue;
    const sig = `${childTable}|${childCol}|${refTable}|${refCol}`;
    if (existingFkSet.has(sig)) continue;
    const refPk = pkByTable.get(refTable);
    if (!refPk || refPk.length !== 1 || refPk[0] !== refCol) continue;
    toAdd.push({ childTable, childCol, refTable, refCol, source: 'explicit' });
  }

  // Regla: sma_funcionarios tiene PK iden_func; en todas las demás tablas sma_* donde aparezca iden_func o iden_func_* debe ser FK a sma_funcionarios.iden_func
  // Incluye sma_prueba; solo se excluyen tablas _destino. Tipos: normalize-iden-func-types-medisena.js --apply.
  const FUNCIONARIOS_TABLE = 'sma_funcionarios';
  const FUNCIONARIOS_PK = 'iden_func';
  if (tableSet.has(FUNCIONARIOS_TABLE) && pkByTable.get(FUNCIONARIOS_TABLE)?.includes(FUNCIONARIOS_PK)) {
    for (const childTable of tableList) {
      if (childTable === FUNCIONARIOS_TABLE || childTable.endsWith('_destino')) continue;
      const cols = columnsByTable.get(childTable) || [];
      const childPk = new Set(pkByTable.get(childTable) || []);
      for (const col of cols) {
        if (childPk.has(col.name)) continue;
        const c = col.name.toLowerCase();
        const isIdenFunc = c === FUNCIONARIOS_PK.toLowerCase() || c.startsWith(FUNCIONARIOS_PK.toLowerCase() + '_');
        if (!isIdenFunc) continue;
        const sig = `${childTable}|${col.name}|${FUNCIONARIOS_TABLE}|${FUNCIONARIOS_PK}`;
        if (existingFkSet.has(sig)) continue;
        if (toAdd.some(f => f.childTable === childTable && f.childCol === col.name && f.refTable === FUNCIONARIOS_TABLE)) continue;
        toAdd.push({ childTable, childCol: col.name, refTable: FUNCIONARIOS_TABLE, refCol: FUNCIONARIOS_PK, source: 'iden_func' });
      }
    }
  }

  // Descubrir por convención: columna que coincide con PK de otra tabla (o es prefijo_sufijo, ej. cod_espe_adsc -> cod_espe)
  // Excluir refs a tablas _destino y sma_prueba; excluir también tablas hijas _destino y sma_prueba.
  for (const childTable of tableList) {
    if (skipChildTables.has(childTable)) continue;
    const cols = columnsByTable.get(childTable) || [];
    const childPk = new Set(pkByTable.get(childTable) || []);
    for (const col of cols) {
      if (childPk.has(col.name)) continue;
      const c = col.name.toLowerCase();
      const candidates = [];
      for (const refTable of tableList) {
        if (refTable === childTable || skipRefTables.has(refTable)) continue;
        const refPk = pkByTable.get(refTable);
        if (!refPk || refPk.length !== 1) continue;
        const refCol = refPk[0].toLowerCase();
        const sig = `${childTable}|${col.name}|${refTable}|${refPk[0]}`;
        if (existingFkSet.has(sig)) continue;
        let match = false;
        if (c === refCol) match = true;
        else if (c.startsWith(refCol + '_') && c.length > refCol.length + 1) match = true;
        if (match) candidates.push({ refTable, refCol: refPk[0] });
      }
      if (candidates.length === 0) continue;
      if (candidates.length > 1) {
        candidates.sort((a, b) => {
          const ad = a.refTable.endsWith('_destino') ? 1 : 0;
          const bd = b.refTable.endsWith('_destino') ? 1 : 0;
          if (ad !== bd) return ad - bd;
          if (a.refTable === 'sma_prueba') return 1;
          if (b.refTable === 'sma_prueba') return -1;
          return a.refTable.localeCompare(b.refTable);
        });
      }
      const chosen = candidates[0];
      if (toAdd.some(f => f.childTable === childTable && f.childCol === col.name)) continue;
      toAdd.push({ childTable, childCol: col.name, refTable: chosen.refTable, refCol: chosen.refCol, source: 'discovered' });
    }
  }

  console.log('\n=== FKs adicionales SMA (medisena) ===\n');
  console.log('Explícitos:', EXPLICIT_FKS.length);
  console.log('Regla iden_func (FK a sma_funcionarios.iden_func):', toAdd.filter(f => f.source === 'iden_func').length);
  console.log('Por convención de nombres:', toAdd.filter(f => f.source === 'discovered').length);
  console.log('Total a añadir:', toAdd.length, '\n');

  if (toAdd.length === 0) {
    console.log('Nada que añadir.');
    await client.end();
    return;
  }

  for (const f of toAdd) {
    console.log(`  ${f.source}: ${f.childTable}.${f.childCol} -> ${f.refTable}.${f.refCol}`);
  }

  if (!APPLY && !DRY_RUN) {
    console.log('\nPara aplicar: node add-extra-sma-fks.js --apply');
    await client.end();
    return;
  }

  if (DRY_RUN) {
    console.log('\n(dry-run: no se modificó la base)');
    await client.end();
    return;
  }

  const notValidSuffix = NOT_VALID ? ' NOT VALID' : '';
  let added = 0;
  for (const f of toAdd) {
    const name = constraintName(f.childTable, f.refTable);
    const sql = `ALTER TABLE ${SCHEMA}.${f.childTable} ADD CONSTRAINT ${name} FOREIGN KEY ("${f.childCol}") REFERENCES ${SCHEMA}.${f.refTable} ("${f.refCol}")${notValidSuffix}`;
    try {
      await client.query(sql);
      added++;
      console.log(`  OK ${f.childTable}.${f.childCol} -> ${f.refTable}.${f.refCol}`);
    } catch (e) {
      if (/already exists|duplicate/i.test(e.message)) {
        console.log(`  (ya existe) ${f.childTable}.${f.childCol} -> ${f.refTable}.${f.refCol}`);
      } else {
        console.warn(`  Error ${f.childTable}.${f.childCol}: ${e.message}`);
      }
    }
  }
  console.log('\nAñadidas:', added, 'de', toAdd.length);
  await client.end();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
