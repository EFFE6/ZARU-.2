#!/usr/bin/env node
/**
 * Lista el tamaño de backups/ y opcionalmente limpia archivos temporales/redundantes.
 * - Por defecto: solo muestra tamaños por categoría.
 * - --dry-run: muestra qué se borraría, sin borrar.
 * - --apply: borra (pide confirmación). Mantiene: backup_progress*.json, schema_analysis_report.json, skip_empty_tables_*.json.
 * Uso: node clean-backups.js [--dry-run|--apply]
 */
const path = require('path');
const fs = require('fs');
const { BACKUP_DIR } = require('./config');

const KEEP = new Set([
  'backup_progress.json',
  'backup_progress_spu.json',
  'schema_analysis_report.json',
  'unified_migration_summary.json',
  'skip_empty_tables_sma.json',
  'skip_empty_tables_spu.json'
]);

function formatBytes(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + ' GB';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + ' MB';
  if (n >= 1e3) return (n / 1e3).toFixed(2) + ' KB';
  return n + ' B';
}

function dirSize(dir, stats = { bytes: 0, files: 0 }) {
  if (!fs.existsSync(dir)) return stats;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) dirSize(full, stats);
    else { stats.bytes += fs.statSync(full).size; stats.files++; }
  }
  return stats;
}

function collectDeletable() {
  const deletable = [];
  if (!fs.existsSync(BACKUP_DIR)) return deletable;

  const sqlFiles = [];
  const entries = fs.readdirSync(BACKUP_DIR, { withFileTypes: true });

  for (const e of entries) {
    const name = e.name;
    const full = path.join(BACKUP_DIR, name);

    if (e.isDirectory()) {
      if (name === 'lobs') {
        const st = dirSize(full, { bytes: 0, files: 0 });
        deletable.push({ path: full, bytes: st.bytes, files: st.files, label: 'lobs/' });
      }
      continue;
    }

    if (KEEP.has(name)) continue;

    let bytes = 0;
    try { bytes = fs.statSync(full).size; } catch (_) {}
    if (name.endsWith('.sql')) {
      sqlFiles.push({ path: full, bytes, files: 1, label: 'dump ' + name });
    } else {
      deletable.push({ path: full, bytes, files: 1, label: name });
    }
  }

  // Dumps .sql: mantener los 2 más recientes, el resto se pueden borrar
  if (sqlFiles.length > 2) {
    sqlFiles.sort((a, b) => fs.statSync(b.path).mtimeMs - fs.statSync(a.path).mtimeMs);
    deletable.push(...sqlFiles.slice(2));
  }

  return deletable;
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const apply = args.includes('--apply');

  console.log('=== MediSENA - Limpieza de backups ===\n');
  console.log('Directorio:', BACKUP_DIR);

  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('No existe la carpeta backups.');
    return;
  }

  const total = dirSize(BACKUP_DIR, { bytes: 0, files: 0 });
  console.log('Tamaño total:', formatBytes(total.bytes), '| Archivos:', total.files);
  console.log('');

  const deletable = collectDeletable();
  const sumBytes = deletable.reduce((s, d) => s + d.bytes, 0);
  const sumFiles = deletable.reduce((s, d) => s + d.files, 0);

  if (deletable.length === 0) {
    console.log('Nada que limpiar (solo se conservan progress, schema_analysis, skip_empty_tables).');
    return;
  }

  console.log('Se puede borrar (redundante o antiguo):');
  console.log('  Total:', formatBytes(sumBytes), '| Elementos:', sumFiles);
  console.log('');

  if (dryRun || apply) {
    const byLabel = {};
    deletable.forEach(d => {
      let key = 'otros';
      if (d.path.endsWith('.sql')) key = 'dumps .sql (antiguos)';
      else if (d.files > 1 || d.label === 'lobs/') key = 'lobs/';
      else if (d.label.startsWith('dump ')) key = 'dumps .sql';
      else if (path.basename(d.path).startsWith('SMA_') || path.basename(d.path).startsWith('spu_')) key = 'tablas .json';
      else if (path.basename(d.path).startsWith('backup_') && path.basename(d.path).endsWith('.json')) key = 'metadata backup_*.json';
      else if (path.basename(d.path).startsWith('verification_')) key = 'verification_*.json';
      if (!byLabel[key]) byLabel[key] = { bytes: 0, files: 0 };
      byLabel[key].bytes += d.bytes;
      byLabel[key].files += d.files;
    });
    Object.entries(byLabel).forEach(([label, { bytes, files }]) => {
      console.log('  -', label, ':', formatBytes(bytes), `(${files} items)`);
    });
  }

  if (apply) {
    console.log('\n¿Borrar estos archivos/carpetas? (escribe "si" para confirmar)');
    const readline = require('readline').createInterface({ input: process.stdin, output: process.stdout });
    readline.question('> ', (answer) => {
      readline.close();
      if ((answer || '').trim().toLowerCase() !== 'si') {
        console.log('Cancelado.');
        return;
      }
      let removed = 0;
      for (const d of deletable) {
        try {
          if (fs.statSync(d.path).isDirectory()) {
            fs.rmSync(d.path, { recursive: true });
          } else {
            fs.unlinkSync(d.path);
          }
          removed++;
        } catch (e) {
          console.warn('  Error borrando', d.path, ':', e.message);
        }
      }
      console.log('Eliminados:', removed, 'elementos.');
    });
    return;
  }

  if (dryRun) {
    console.log('(Ejecuta con --apply para borrar realmente.)');
  }
}

main();
