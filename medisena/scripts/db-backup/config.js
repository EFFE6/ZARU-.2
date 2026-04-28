/**
 * Ruta base para todo lo relacionado con DBs (backups, dumps, progreso).
 * Si MEDISENA_DB_STORAGE está definido (ej. D:\MediSENA_DBs), se usa esa carpeta.
 * Subcarpetas: backups/, postgres_data/, redis_data/ (bind mounts en podman-compose).
 */
const path = require('path');
const root = path.join(__dirname, '../..');
require('dotenv').config({ path: path.join(root, '.env') });
require('dotenv').config({ path: path.join(root, 'config-puertos-libres.env') });

const STORAGE_ROOT = (process.env.MEDISENA_DB_STORAGE || '').trim().replace(/\\/g, '/');
const BACKUP_DIR = STORAGE_ROOT
  ? path.join(STORAGE_ROOT.replace(/\//g, path.sep), 'backups')
  : path.join(__dirname, 'backups');

module.exports = { STORAGE_ROOT, BACKUP_DIR };
