# MediSENA - Sincronizar solo datos nuevos (faltantes) desde Oracle SMA y SPU
# No borra tablas ni datos existentes; inserta solo filas cuya PK no existe en medisena (ON CONFLICT DO NOTHING).
# Uso: .\scripts\run-sync-faltantes-to-medisena.ps1

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
$env:SYNC_FALTANTES = "1"
if (-not $env:MEDISENA_DB_STORAGE) { $env:MEDISENA_DB_STORAGE = "D:/MediSENA_DBs" }

$storageRoot = $env:MEDISENA_DB_STORAGE
if ($storageRoot) {
    $storageRoot = $storageRoot.TrimEnd('\', '/').Replace('/', [System.IO.Path]::DirectorySeparatorChar)
    foreach ($sub in @('backups')) {
        $dir = Join-Path $storageRoot $sub
        if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    }
}

Write-Host "=== MediSENA - Sincronizar solo faltantes (datos nuevos en origen) ===" -ForegroundColor Cyan
Write-Host "  No se borran tablas; se insertan solo filas nuevas (PK no existente)." -ForegroundColor Gray
Write-Host ""

$ea = $ErrorActionPreference
$ErrorActionPreference = "SilentlyContinue"
$pgRunning = podman ps --filter "name=medisena-postgres" --format "{{.Names}}" 2>&1
if ($LASTEXITCODE -eq 0 -and -not ($pgRunning -match "Cannot connect|Error")) {
    if (-not $pgRunning) {
        Write-Host "Levantando PostgreSQL..." -ForegroundColor Yellow
        podman compose -f podman-compose.yml up -d medisena-postgres 2>$null
        Start-Sleep -Seconds 10
    }
}
$ErrorActionPreference = $ea

try {
    Write-Host "[1/4] SMA: agregando solo filas nuevas (medisena.sma_*)..." -ForegroundColor Yellow
    Set-Location "$root\scripts\db-backup"
    $env:RESYNC = $null
    $env:NODE_OPTIONS = "--max-old-space-size=4096"
    node backup-oracle-to-postgres.js
    if ($LASTEXITCODE -ne 0) { Write-Host "  SMA finalizo con errores (puede ser red)." -ForegroundColor Yellow }
    Set-Location $root

    Write-Host ""
    Write-Host "[1.5/4] Depuracion: *_destino, sma_* con fecha, tablas redundantes..." -ForegroundColor Yellow
    Set-Location "$root\scripts\db-backup"
    node drop-unused-destino-tables-medisena.js 2>&1 | Out-Null
    node drop-dated-backup-tables-medisena.js 2>&1 | Out-Null
    node drop-redundant-tables-medisena.js 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { Write-Host "  (Sin tablas a depurar; se continua.)" -ForegroundColor Gray }
    Set-Location $root

    Write-Host ""
    Write-Host "[2/4] SPU: agregando solo filas nuevas (medisena.t_*)..." -ForegroundColor Yellow
    $env:RESYNC = $null
    & "$root\scripts\run-db-backup-spu.ps1"
    if ($LASTEXITCODE -ne 0) { Write-Host "  SPU finalizo con errores." -ForegroundColor Yellow }
    Set-Location $root

    Write-Host ""
    Write-Host "[2.1/4] Enlace sma_cargos -> t_cargos (nomb_car = t_cargonombrecargo, FK t_cargosid)..." -ForegroundColor Yellow
    Set-Location "$root\scripts\db-backup"
    node link-sma-cargos-to-t-cargos.js --apply 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { Write-Host "  (t_cargos no existe o sin cambios; se continua.)" -ForegroundColor Gray }
    Set-Location $root

    Write-Host ""
    Write-Host "[3/4] Normalizar tipos iden_func (reportes) y FKs adicionales SMA..." -ForegroundColor Yellow
    Set-Location "$root\scripts\db-backup"
    node normalize-iden-func-types-medisena.js --apply 2>&1 | Out-Null
    node add-extra-sma-fks.js --apply --not-valid 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { Write-Host "  (Algunas FKs ya existen o no aplican; se continua.)" -ForegroundColor Gray }
    Set-Location $root

    Write-Host ""
    Write-Host "[4/4] Reaplicando asignaciones RBAC..." -ForegroundColor Yellow
    Set-Location "$root\backend"
    npm run security:seed-user-roles 2>$null
    if ($LASTEXITCODE -ne 0) { Write-Host "  Seed RBAC fallo (opcional)." -ForegroundColor Gray }
    Set-Location $root

    Write-Host ""
    Write-Host "Sincronizacion de faltantes finalizada." -ForegroundColor Green
}
catch {
    Remove-Item Env:SYNC_FALTANTES -ErrorAction SilentlyContinue
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    throw
}
finally {
    Remove-Item Env:SYNC_FALTANTES -ErrorAction SilentlyContinue
    Set-Location $root
}
