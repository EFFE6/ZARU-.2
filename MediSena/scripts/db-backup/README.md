# Backup Oracle → PostgreSQL - MediSENA

Scripts para migrar y resincronizar **SMA** y **SPU** desde Oracle hacia PostgreSQL local.

**Guía completa (migración y resincronización):** [docs/GUIA-MIGRACION-Y-RESINCRONIZACION-POSTGRESQL.md](../../docs/GUIA-MIGRACION-Y-RESINCRONIZACION-POSTGRESQL.md)

---

## Resumen rápido

| Acción | Comando |
|--------|---------|
| Migrar / continuar SMA | `npm run backup` |
| Migrar / continuar SPU | `npm run backup:spu` |
| Resincronizar SMA (todo) | `npm run backup:resync` o `$env:RESYNC="1"; npm run backup` |
| Resincronizar SPU (todo) | `$env:RESYNC="1"; npm run backup:spu` |
| Verificar SMA | `npm run verify` / `npm run verify:full` |
| Verificar SPU | `npm run verify:spu` / `npm run verify:full:spu` |

Requisitos: PostgreSQL en marcha (puerto 5433), Oracle accesible, variables en `.env` (ver `.env.example`).

---

## Bases en PostgreSQL

- **medisena_backup** (schema `sma`) → migración SMA
- **spu_backup** (schema `spu`) → migración SPU

---

## Scripts disponibles

| Script | Uso |
|--------|-----|
| `backup-oracle-to-postgres.js` | Migración SMA (incremental, PK/FK). |
| `backup-oracle-spu-to-postgres.js` | Migración SPU (incremental, LOB a archivo, PK/FK). |
| `verify-migration.js` | Conteos Oracle vs PG (SMA o SPU con `VERIFY_SPU=1`). |
| `verify-migration-full.js` | Conteos + tamaños + estadísticas LOB. |
| `drop-empty-tables-pg.js` | Listar/eliminar tablas vacías y guardar exclusión. |
| `check-pg-keys.js` | Listar PK/FK del schema SMA en PG. |
| `upload-lob-files-to-pg.js` | Subir archivos LOB (desde `_path`) a columnas en PG. |

---

## Variables principales

- **Postgres:** `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_SPU_DB`
- **Oracle SMA:** `ORACLE_USER`, `ORACLE_PASS`, `ORACLE_CONNECT_STRING` (o host/service)
- **Oracle SPU:** `ORACLE_SPU_USER`, `ORACLE_SPU_PASS`, `ORACLE_SPU_HOST`, `ORACLE_SPU_SERVICE_NAME` (o `ORACLE_SPU_CONNECT_STRING`)

Ver `docs/GUIA-MIGRACION-Y-RESINCRONIZACION-POSTGRESQL.md` y `.env.example`.
