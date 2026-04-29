# Scripts MediSENA

## Sincronización unificada (Oracle → PostgreSQL medisena)

- **Sincronización full / Resincronización:** [`run-full-resync-to-medisena.ps1`](run-full-resync-to-medisena.ps1)  
  Detalle y uso: [docs/SINCRONIZACION-MEDISENA.md](../docs/SINCRONIZACION-MEDISENA.md).

- **Reanudar tras error (continuar desde última tabla):** [`run-resume-sync-to-medisena.ps1`](run-resume-sync-to-medisena.ps1).

- **Solo datos nuevos (faltantes):** [`run-sync-faltantes-to-medisena.ps1`](run-sync-faltantes-to-medisena.ps1) — no borra tablas; inserta solo filas cuya PK no existe en medisena.

- **Solo SMA:** [`run-db-backup.ps1`](run-db-backup.ps1) (Oracle SMA → `medisena.sma_*`).
- **Solo SPU:** [`run-db-backup-spu.ps1`](run-db-backup-spu.ps1) (Oracle SPU → `medisena.t_*`).

## Otros

- GitLab: `sync-milestones-gitlab.ps1`, `sync-labels-gitlab.ps1`, `sync-wiki-gitlab.ps1`
- Issues: `crear-issues-validacion-modulos.ps1`, `crear-issue-retrospectivo-docs.ps1`, `create-rbac-unifieddb-issues.ps1`, `create-spu-unification-roadmap.ps1`
- Opcional: `backup-sqlserver-spu.ps1` (backup SPU en SQL Server, si aplica).

## db-backup/

Scripts Node usados por los `.ps1` de sincronización y utilidades de diagnóstico/limpieza. Ver `db-backup/README.md`. Comandos útiles: `drop:empty:medisena`, `check:spu`, `clean-backups.js`.
