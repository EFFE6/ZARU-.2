# MediSENA - Reanudar sincronizacion tras error (modo incremental)
# Mismo flujo que run-full-resync pero SIN RESYNC: SMA y SPU continúan desde el progreso guardado.
# Uso: .\scripts\run-resume-sync-to-medisena.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

if (Test-Path ".env") {
    Get-Content .env | Where-Object { $_ -match '^[A-Z_]+=' } | ForEach-Object {
        $p = $_ -split '=', 2
        if ($p[1]) { [Environment]::SetEnvironmentVariable($p[0], $p[1].Trim(), 'Process') }
    }
}

$env:MEDISENA_DB = "medisena"
$env:POSTGRES_DB = "medisena"
if (-not $env:MEDISENA_DB_STORAGE) { $env:MEDISENA_DB_STORAGE = "D:/MediSENA_DBs" }

$storageRoot = $env:MEDISENA_DB_STORAGE
if ($storageRoot) {
    $storageRoot = $storageRoot.TrimEnd('\', '/').Replace('/', [System.IO.Path]::DirectorySeparatorChar)
    foreach ($sub in @('backups', 'postgres_data', 'redis_data')) {
        $dir = Join-Path $storageRoot $sub
        if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    }
    Write-Host "Almacenamiento DB (disco D): $storageRoot" -ForegroundColor Cyan
}

Write-Host "=== MediSENA - Reanudar sincronizacion (modo incremental) ===" -ForegroundColor Cyan
Write-Host "  SMA y SPU continuaran desde la ultima tabla completada." -ForegroundColor Gray
Write-Host ""

$ea = $ErrorActionPreference
$ErrorActionPreference = "SilentlyContinue"
$pgRunning = podman ps --filter "name=medisena-postgres" --format "{{.Names}}" 2>&1
if ($LASTEXITCODE -eq 0 -and $pgRunning -and -not ($pgRunning -match "Cannot connect|Error")) {
    Write-Host "PostgreSQL (Podman) listo." -ForegroundColor Green
} else {
    Write-Host "Asegurese de que PostgreSQL este en ejecucion (puerto 5433)." -ForegroundColor Yellow
}
$ErrorActionPreference = $ea

try {
    Write-Host "[0/4] Asegurando DB medisena y tablas auth/RBAC..." -ForegroundColor Yellow
    Set-Location "$root\scripts\db-backup"
    node ensure-medisena-db-auth.js
    if ($LASTEXITCODE -ne 0) { throw "Fallo asegurar DB medisena y SQL 05/06" }
    Set-Location $root

    Write-Host ""
    Write-Host "[1/4] Continuando SMA (tablas pendientes)..." -ForegroundColor Yellow
    # Sin RESYNC: usa backup_progress.json y solo procesa tablas no completadas
    .\scripts\run-db-backup.ps1

    Write-Host ""
    Write-Host "[2/4] Continuando SPU (tablas pendientes)..." -ForegroundColor Yellow
    # Sin RESYNC: usa backup_progress_spu.json y solo procesa tablas no completadas
    .\scripts\run-db-backup-spu.ps1

    Write-Host ""
    Write-Host "[3/4] Reaplicando asignaciones RBAC..." -ForegroundColor Yellow
    Set-Location "$root\backend"
    npm run security:seed-user-roles
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  AVISO: seed RBAC fallo. Puede ejecutar en backend: npm run security:seed-user-roles" -ForegroundColor Yellow
    } else {
        Write-Host "  RBAC seed aplicado." -ForegroundColor Green
    }

    Write-Host ""
    Write-Host "Reanudacion completada." -ForegroundColor Green
    Write-Host "Salida: DB 'medisena', schema 'medisena' (sma_* + t_* + auth_*)." -ForegroundColor Cyan
}
catch {
    Write-Host ""
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Puede volver a ejecutar este mismo script para continuar: .\scripts\run-resume-sync-to-medisena.ps1" -ForegroundColor Gray
    throw
}
finally {
    Set-Location $root
}
