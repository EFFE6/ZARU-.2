# Limpieza y tamaño del proyecto

## Resumen rápido

| Ubicación | Típico tamaño | En .gitignore | Acción |
|-----------|----------------|---------------|--------|
| `scripts/db-backup/backups/` | **~30+ GB** | Sí | Usar `clean-backups.js` (ver abajo). |
| `frontend/node_modules/`, `backend/node_modules/` | Cientos de MB | Sí | No borrar; `npm install` los regenera. |
| `frontend/dist/` | MB | Revisar | Build de producción; se puede borrar y regenerar con `npm run build`. |
| `_legacy/` | Variable | Sí | Código legacy; no borrar hasta finalizar modernización. |
| `portal/logs/`, `portal/temp/` | Variable | Sí | Temporales; se pueden vaciar si existen. |
| `coverage/`, `test-results/` | Variable | Sí | Salida de tests; se puede borrar. |

La mayor ganancia de espacio suele ser **backups/** (~31 GB recuperables con el script de limpieza).

---

## 1. Carpeta de backups

Si está definido `MEDISENA_DB_STORAGE` (ej. `D:\MediSENA_DBs`), los backups están en `MEDISENA_DB_STORAGE/backups/`. Si no, en `scripts/db-backup/backups/`. Puede crecer mucho (decenas de GB). **No se sube a Git** (está en `.gitignore`), pero sí ocupa disco.

## Qué hay y qué se puede borrar

| Contenido | Uso | ¿Borrar? |
|-----------|-----|----------|
| `medisena_backup_*.sql` | Dumps completos de PostgreSQL (medisena_backup). | Sí, salvo el último (1–2) si quieres conservar un respaldo. |
| `SMA_*.json`, `spu_*.json` | Copia en JSON de tablas; los datos ya están en PG. | Sí, son redundantes una vez migrado. |
| `backup_*.json`, `backup_spu_*.json` | Metadata de cada ejecución de backup. | Sí, salvo los más recientes si quieres auditoría. |
| `backup_progress.json`, `backup_progress_spu.json` | Progreso para backup incremental. | **No** borrar si vas a seguir haciendo backups incrementales. |
| `schema_analysis_report.json` | Lo usa `migrate-to-unified-medisena.js`. | **No** borrar si vas a ejecutar la migración unificada. |
| `unified_migration_summary.json` | Resumen de la última migración unificada. | Opcional (solo histórico). |
| `skip_empty_tables_*.json` | Lista de tablas vacías excluidas. | **No** borrar si usas los scripts de backup. |
| `verification_*.json` | Reportes de verificación. | Sí, son temporales. |
| `lobs/` (SPU) | Archivos LOB (documentos, etc.) exportados de Oracle. | Solo si ya subiste los LOB a PG con `upload-lob-files-to-pg.js`. |

## Script de limpieza

```bash
cd scripts/db-backup
node clean-backups.js              # solo listar tamaños (dry-run)
node clean-backups.js --dry-run    # listar qué se borraría
node clean-backups.js --apply      # borrar realmente (pide confirmación)
```

- **Por defecto** solo muestra tamaños por categoría.
- **`--dry-run`**: muestra qué archivos/carpetas se eliminarían, sin borrar.
- **`--apply`**: ejecuta la limpieza (elimina dumps antiguos, JSON de tablas, metadata vieja; mantiene progress, schema_analysis_report, skip_empty_tables).

## Usar disco D: (por defecto)

Todo el almacenamiento de DBs (PostgreSQL, Redis, backups, dumps) está configurado para usar **D:\\MediSENA_DBs**:

1. En **.env** (o copia de `.env.example`) define `MEDISENA_DB_STORAGE=D:/MediSENA_DBs` (con barras `/`).
2. Usa **`start-medisena.ps1`** para levantar servicios (carga `.env`, crea `backups/`, `postgres_data/` y `redis_data/` bajo `MEDISENA_DB_STORAGE`). PostgreSQL y Redis del stack usan volúmenes nombrados definidos en `podman-compose.yml`.
3. En Windows, añade D: en Podman Desktop → *Settings → Resources → File sharing*.
4. Si migras desde volúmenes nombrados antiguos (C:), tras confirmar que todo funciona con D:, puedes eliminar los volúmenes con `podman volume rm medisena_postgres_data medisena_redis_data` (con contenedores parados).

## Reducir tamaño en futuras ejecuciones

- Los scripts ya **no escriben JSON** para tablas con más de 50 000 filas (SMA). Las tablas muy grandes solo van a PostgreSQL.
- Los dumps `.sql` los genera `backup-pg-dump.js` o el flujo de resync; si no los necesitas, no los generes o bórralos con el script de limpieza.

---

## 2. Otras carpetas temporales o regenerables

- **`frontend/dist/`**, **`backend/dist/`** (si existen): salida de build. Se regeneran con `npm run build`. Puedes borrarlas para liberar espacio.
- **`coverage/`**, **`test-results/`**, **`allure-results/`**, **`screenshots/`**: salida de tests. En `.gitignore`; se pueden borrar.
- **`portal/logs/`**, **`portal/temp/`**: en `.gitignore`; se pueden vaciar si el portal ya no se usa.
- **`node_modules/`**: no eliminar salvo que quieras forzar una reinstalación limpia (`npm ci`); ocupan mucho pero son necesarios.
