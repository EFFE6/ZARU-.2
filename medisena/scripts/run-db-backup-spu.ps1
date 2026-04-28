# MediSENA - Backup Oracle SPU -> PostgreSQL
# Escribe en DB medisena, esquema medisena, tablas medisena.t_* (o en spu_backup si POSTGRES_SPU_DB esta definido).
# Configure: ORACLE_SPU_USER, ORACLE_SPU_PASS, ORACLE_SPU_CONNECT_STRING. Para destino unificado: MEDISENA_DB=medisena
# Uso: .\scripts\run-db-backup-spu.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

Write-Host "=== MediSENA - Backup Oracle SPU -> PostgreSQL ===" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar/levantar PostgreSQL (Podman)
Write-Host "[1/3] Verificando PostgreSQL..." -ForegroundColor Yellow
$ea = $ErrorActionPreference
$ErrorActionPreference = "SilentlyContinue"
$pgRunning = podman ps --filter "name=medisena-postgres" --format "{{.Names}}" 2>&1
if ($LASTEXITCODE -eq 0 -and -not ($pgRunning -match "Cannot connect|Error")) {
    if (-not $pgRunning) {
        Write-Host "  Levantando PostgreSQL (podman compose)..." -ForegroundColor Gray
        podman compose -f podman-compose.yml up -d medisena-postgres 2>$null
        Start-Sleep -Seconds 5
    }
    Write-Host "  PostgreSQL ya esta corriendo (Podman)" -ForegroundColor Green
} else {
    Write-Host "  Podman no disponible; se asume PostgreSQL en ejecucion." -ForegroundColor Gray
}
$ErrorActionPreference = $ea

# 2. Cargar .env (no sobrescribir MEDISENA_DB/POSTGRES_DB/MEDISENA_DB_STORAGE si vienen del resync unificado)
$preserveDb = @{}
if ($env:MEDISENA_DB) { $preserveDb['MEDISENA_DB'] = $env:MEDISENA_DB }
if ($env:POSTGRES_DB) { $preserveDb['POSTGRES_DB'] = $env:POSTGRES_DB }
if ($env:MEDISENA_DB_STORAGE) { $preserveDb['MEDISENA_DB_STORAGE'] = $env:MEDISENA_DB_STORAGE }
if ($env:SYNC_FALTANTES) { $preserveDb['SYNC_FALTANTES'] = $env:SYNC_FALTANTES }
if (Test-Path ".env") {
    Get-Content .env | Where-Object { $_ -match '^[A-Z_]+=' } | ForEach-Object {
        $p = $_ -split '=', 2
        if ($p[1]) { [Environment]::SetEnvironmentVariable($p[0], $p[1].Trim(), 'Process') }
    }
}
if (Test-Path "config-puertos-libres.env") {
    Get-Content config-puertos-libres.env | Where-Object { $_ -match '^[A-Z_]+=' } | ForEach-Object {
        $p = $_ -split '=', 2
        if ($p[1]) { [Environment]::SetEnvironmentVariable($p[0], $p[1].Trim(), 'Process') }
    }
}
foreach ($k in $preserveDb.Keys) { [Environment]::SetEnvironmentVariable($k, $preserveDb[$k], 'Process') }

# 3. Ejecutar migracion SPU -> Postgres
Write-Host ""
Write-Host "[2/3] Ejecutando backup Oracle SPU -> PostgreSQL..." -ForegroundColor Yellow
$backupDir = Join-Path $root "scripts\db-backup"
Set-Location $backupDir
if (-not (Test-Path "node_modules")) {
    npm install
}
$env:NODE_OPTIONS = "--max-old-space-size=4096"
node backup-oracle-spu-to-postgres.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Backup SPU finalizo con errores. Re-ejecute para continuar de forma incremental." -ForegroundColor Yellow
}

$spuDb = if ($env:MEDISENA_DB) { $env:MEDISENA_DB } elseif ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "medisena" }
Write-Host ""
Write-Host "[3/3] Completado" -ForegroundColor Green
Write-Host "  Base SPU en PostgreSQL: $spuDb (schema medisena, tablas t_*)" -ForegroundColor Cyan
Write-Host "  Progreso: scripts/db-backup/backups/backup_progress_spu.json" -ForegroundColor Gray
Write-Host "  Reanudar si se interrumpio: .\scripts\run-db-backup-spu.ps1" -ForegroundColor Gray
Write-Host "  Resincronizar (traer datos nuevos del origen): `$env:RESYNC='1'; .\scripts\run-db-backup-spu.ps1" -ForegroundColor Gray
Write-Host "  Reiniciar desde cero: `$env:RESET_PROGRESS_SPU='1'; .\scripts\run-db-backup-spu.ps1" -ForegroundColor Gray
Set-Location $root
