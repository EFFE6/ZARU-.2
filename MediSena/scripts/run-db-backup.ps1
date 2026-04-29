# MediSENA - Backup Oracle -> PostgreSQL local
# 1. Levanta PostgreSQL (podman compose)
# 2. Ejecuta migración Oracle -> Postgres
# 3. Genera dump SQL
# Uso: .\scripts\run-db-backup.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

Write-Host "=== MediSENA - Proceso de Backup DB ===" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar/levantar PostgreSQL (Podman)
Write-Host "[1/4] Verificando PostgreSQL..." -ForegroundColor Yellow
$ea = $ErrorActionPreference
$ErrorActionPreference = "SilentlyContinue"
$pgRunning = podman ps --filter "name=medisena-postgres" --format "{{.Names}}" 2>&1
if ($LASTEXITCODE -eq 0 -and -not ($pgRunning -match "Cannot connect|Error")) {
    if (-not $pgRunning) {
        Write-Host "  Levantando PostgreSQL (podman compose)..." -ForegroundColor Gray
        podman compose -f podman-compose.yml up -d medisena-postgres 2>$null
        Start-Sleep -Seconds 5
    }
    Write-Host "  PostgreSQL ya está corriendo (Podman)" -ForegroundColor Green
} else {
    Write-Host "  Podman no disponible; se asume PostgreSQL en ejecución." -ForegroundColor Gray
}
$ErrorActionPreference = $ea

# 2. Cargar .env si existe (no sobrescribir MEDISENA_DB/POSTGRES_DB si ya vienen del resync unificado)
$preserveDb = @{}
if ($env:MEDISENA_DB) { $preserveDb['MEDISENA_DB'] = $env:MEDISENA_DB }
if ($env:POSTGRES_DB) { $preserveDb['POSTGRES_DB'] = $env:POSTGRES_DB }
if (Test-Path ".env") {
    Get-Content .env | Where-Object { $_ -match '^[A-Z_]+=' } | ForEach-Object {
        $p = $_ -split '=', 2
        if ($p[1]) { [Environment]::SetEnvironmentVariable($p[0], $p[1].Trim(), 'Process') }
    }
}
foreach ($k in $preserveDb.Keys) { [Environment]::SetEnvironmentVariable($k, $preserveDb[$k], 'Process') }

# 3. Ejecutar backup Oracle -> Postgres (streaming para tablas grandes, evita OOM)
Write-Host ""
Write-Host "[2/4] Ejecutando backup Oracle -> PostgreSQL..." -ForegroundColor Yellow
$backupDir = Join-Path $root "scripts\db-backup"
Set-Location $backupDir
if (-not (Test-Path "node_modules")) {
    npm install
}
$env:NODE_OPTIONS = "--max-old-space-size=4096"
node backup-oracle-to-postgres.js
$oracleExit = $LASTEXITCODE
if ($oracleExit -ne 0) {
    Write-Host "  Backup Oracle finalizó con errores (puede ser desconexión)." -ForegroundColor Yellow
    Write-Host "  Re-ejecuta este script para continuar de forma incremental." -ForegroundColor Gray
}

# 4. Generar dump SQL (misma DB; salida en MEDISENA_DB_STORAGE\backups si esta definido)
Write-Host ""
Write-Host "[3/4] Generando dump PostgreSQL..." -ForegroundColor Yellow
$dumpDb = if ($env:MEDISENA_DB) { $env:MEDISENA_DB } elseif ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "medisena" }
$ts = Get-Date -Format 'yyyy-MM-ddTHH-mm-ss'
$backupOutputDir = if ($env:MEDISENA_DB_STORAGE) { Join-Path $env:MEDISENA_DB_STORAGE "backups" } else { Join-Path $backupDir "backups" }
$outPath = Join-Path $backupOutputDir "${dumpDb}_$ts.sql"
$dumpOk = $false
try {
    if (-not (Test-Path $backupOutputDir)) { New-Item -ItemType Directory -Path $backupOutputDir -Force | Out-Null }
    $pgDump = Get-Command pg_dump -ErrorAction SilentlyContinue
    if ($pgDump) {
        $env:PGDUMP_DB = $dumpDb; npm run backup:pg-dump 2>$null
        if (-not $LASTEXITCODE) { $dumpOk = $true; Write-Host "  Dump generado: $outPath" -ForegroundColor Green }
    } else {
        Write-Host "  Usando pg_dump desde contenedor Podman (DB: $dumpDb)..." -ForegroundColor Gray
        $dumpOut = podman exec medisena-postgres pg_dump -U medisena $dumpDb 2>&1
        if ($LASTEXITCODE -eq 0) {
            $dumpOut | Out-File -FilePath $outPath -Encoding utf8 -ErrorAction Stop
            if (Test-Path $outPath) { $dumpOk = $true; Write-Host "  Dump generado: $outPath" -ForegroundColor Green }
        }
    }
} catch {
    Write-Host "  Dump en ruta principal fallo: $($_.Exception.Message)" -ForegroundColor Yellow
    $fallbackDir = Join-Path $backupDir "backups"
    $outPathFallback = Join-Path $fallbackDir "${dumpDb}_$ts.sql"
    try {
        if (-not (Test-Path $fallbackDir)) { New-Item -ItemType Directory -Path $fallbackDir -Force | Out-Null }
        $dumpOut = podman exec medisena-postgres pg_dump -U medisena $dumpDb 2>&1
        if ($LASTEXITCODE -eq 0) { $dumpOut | Out-File -FilePath $outPathFallback -Encoding utf8 -ErrorAction Stop; $dumpOk = $true; Write-Host "  Dump generado (fallback): $outPathFallback" -ForegroundColor Green }
    } catch {
        Write-Host "  No se pudo generar dump: $($_.Exception.Message)" -ForegroundColor Red
    }
}
if (-not $dumpOk) { Write-Host "  Dump omitido o fallido (resincronizacion continuara)." -ForegroundColor Gray }

Write-Host ""
Write-Host "[4/4] Completado" -ForegroundColor Green
Write-Host "  Backups en: $backupOutputDir" -ForegroundColor Cyan
Set-Location $root
