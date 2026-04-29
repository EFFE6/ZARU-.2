# MediSENA - Resincronizacion completa end-to-end (directo a medisena)
# Flujo: Asegurar DB medisena + auth -> Oracle SMA -> medisena.sma_* -> Oracle SPU -> medisena.t_* -> seed RBAC
# Sin bases intermedias (medisena_backup/spu_backup).
# Uso: .\scripts\run-full-resync-to-medisena.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

# Cargar .env (incluye MEDISENA_DB_STORAGE para D:\MediSENA_DBs si esta definido)
if (Test-Path ".env") {
    Get-Content .env | Where-Object { $_ -match '^[A-Z_]+=' } | ForEach-Object {
        $p = $_ -split '=', 2
        if ($p[1]) { [Environment]::SetEnvironmentVariable($p[0], $p[1].Trim(), 'Process') }
    }
}

# Destino unificado: una sola DB "medisena", un solo schema "medisena" (SMA -> sma_*, SPU -> t_*, auth -> auth_*)
$env:MEDISENA_DB = "medisena"
$env:POSTGRES_DB = "medisena"
# Backups y progreso en D: (SMA y SPU usan BACKUP_DIR = MEDISENA_DB_STORAGE/backups)
if (-not $env:MEDISENA_DB_STORAGE) { $env:MEDISENA_DB_STORAGE = "D:/MediSENA_DBs" }

# Crear carpetas en disco D: (MEDISENA_DB_STORAGE) para backups y progreso de sincronizacion
$storageRoot = $env:MEDISENA_DB_STORAGE
if ($storageRoot) {
    $storageRoot = $storageRoot.TrimEnd('\', '/').Replace('/', [System.IO.Path]::DirectorySeparatorChar)
    foreach ($sub in @('backups', 'postgres_data', 'redis_data')) {
        $dir = Join-Path $storageRoot $sub
        if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null; Write-Host "Creado (disco D): $dir" -ForegroundColor Gray }
    }
    Write-Host "Almacenamiento DB (disco D): $storageRoot" -ForegroundColor Cyan
}

Write-Host "=== MediSENA - Resincronizacion directa a DB/schema medisena ===" -ForegroundColor Cyan
Write-Host ""

# Verificar/levantar PostgreSQL con Podman (si falla, asumir que ya corre)
$ea = $ErrorActionPreference
$ErrorActionPreference = "SilentlyContinue"
$pgRunning = podman ps --filter "name=medisena-postgres" --format "{{.Names}}" 2>&1
if ($LASTEXITCODE -eq 0 -and -not ($pgRunning -match "Cannot connect|Error")) {
    if (-not $pgRunning) {
        Write-Host "Levantando PostgreSQL (podman compose)..." -ForegroundColor Yellow
        podman compose -f podman-compose.yml up -d medisena-postgres 2>$null
        Write-Host "  Esperando a que PostgreSQL acepte conexiones (hasta 30s)..." -ForegroundColor Gray
        Start-Sleep -Seconds 10
    }
    Write-Host "PostgreSQL (Podman) listo." -ForegroundColor Green
} else {
    Write-Host "Podman no disponible; se asume que PostgreSQL ya corre." -ForegroundColor Gray
}
$ErrorActionPreference = $ea

try {
    Write-Host "[0/4] Asegurando DB medisena y tablas auth/RBAC (05, 06)..." -ForegroundColor Yellow
    Set-Location "$root\scripts\db-backup"
    node ensure-medisena-db-auth.js
    if ($LASTEXITCODE -ne 0) { throw "Fallo asegurar DB medisena y SQL 05/06" }
    Set-Location $root

    Write-Host ""
    Write-Host "[1/4] Resincronizando SMA (origen -> medisena.sma_*)..." -ForegroundColor Yellow
    $env:RESYNC = "1"
    .\scripts\run-db-backup.ps1
    Remove-Item Env:RESYNC -ErrorAction SilentlyContinue

    Write-Host ""
    Write-Host "[1.5/4] Depuracion: *_destino, sma_* con fecha, tablas redundantes (beneficiarios_activos)..." -ForegroundColor Yellow
    Set-Location "$root\scripts\db-backup"
    node drop-unused-destino-tables-medisena.js 2>&1 | Out-Null
    node drop-dated-backup-tables-medisena.js 2>&1 | Out-Null
    node drop-redundant-tables-medisena.js 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { Write-Host "  (Sin tablas a depurar o error; se continua.)" -ForegroundColor Gray }
    Set-Location $root

    Write-Host ""
    Write-Host "[2/4] Resincronizando SPU (origen -> medisena.t_*)..." -ForegroundColor Yellow
    $env:RESYNC = "1"
    .\scripts\run-db-backup-spu.ps1
    Remove-Item Env:RESYNC -ErrorAction SilentlyContinue

    Write-Host ""
    Write-Host "[2.1/4] Enlace sma_cargos -> t_cargos (nomb_car = t_cargonombrecargo, FK t_cargosid)..." -ForegroundColor Yellow
    Set-Location "$root\scripts\db-backup"
    node link-sma-cargos-to-t-cargos.js --apply 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { Write-Host "  (t_cargos no existe o sin cambios; se continua.)" -ForegroundColor Gray }
    Set-Location $root

    Write-Host ""
    Write-Host "[2.5/4] Normalizar tipos iden_func (reportes) y FKs adicionales SMA..." -ForegroundColor Yellow
    Set-Location "$root\scripts\db-backup"
    node normalize-iden-func-types-medisena.js --apply 2>&1 | Out-Null
    node add-extra-sma-fks.js --apply --not-valid 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { Write-Host "  (Algunas FKs ya existen o no aplican; se continua.)" -ForegroundColor Gray }
    Set-Location $root

    Write-Host ""
    Write-Host "[3/4] Reaplicando asignaciones RBAC en medisena..." -ForegroundColor Yellow
    Set-Location "$root\backend"
    npm run security:seed-user-roles
    if ($LASTEXITCODE -ne 0) {
        throw "Fallo el seed de roles RBAC"
    }

    Write-Host ""
    Write-Host "Resincronizacion completa finalizada correctamente." -ForegroundColor Green
    Write-Host "Salida: DB 'medisena', schema 'medisena' (sma_* + t_* + auth_*)." -ForegroundColor Cyan
}
catch {
    Remove-Item Env:RESYNC -ErrorAction SilentlyContinue
    Write-Host ""
    Write-Host "Proceso finalizado con error: $($_.Exception.Message)" -ForegroundColor Red
    throw
}
finally {
    Set-Location $root
}
