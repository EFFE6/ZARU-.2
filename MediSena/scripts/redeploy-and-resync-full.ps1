# MediSENA - Redesplegar contenedores (todo en disco D) y ejecutar resync full
# Ejecutar en la máquina donde existan D: y Podman.
# Uso: .\scripts\redeploy-and-resync-full.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

# Todo en disco D:
$storage = "D:/MediSENA_DBs"
$env:MEDISENA_DB_STORAGE = $storage
$env:MEDISENA_DB = "medisena"
$env:POSTGRES_DB = "medisena"

# Crear carpeta en D: para backups y progreso de sincronización (Postgres/Redis usan volúmenes nombrados)
$dirs = @("$storage/backups")
foreach ($d in $dirs) {
    $path = $d -replace '/', [System.IO.Path]::DirectorySeparatorChar
    if (-not (Test-Path $path)) {
        New-Item -ItemType Directory -Force -Path $path | Out-Null
        Write-Host "Creado: $path" -ForegroundColor Gray
    }
}
Write-Host "Almacenamiento en D: $storage" -ForegroundColor Cyan

# Podman: si la máquina no está corriendo, la iniciamos y pedimos abrir terminal nueva
# (en la misma sesión el CLI usa el puerto antiguo 59891 y falla compose)
$ea = $ErrorActionPreference
$ErrorActionPreference = "SilentlyContinue"
$machineList = podman machine list 2>&1
$machineRunning = $machineList -match "Currently running"
$ErrorActionPreference = $ea

if (-not $machineRunning) {
    Write-Host "Máquina Podman no está corriendo." -ForegroundColor Yellow
    Write-Host "Intentando iniciar máquina Podman..." -ForegroundColor Gray
    $ErrorActionPreference = "SilentlyContinue"
    $p = Start-Process -FilePath "podman" -ArgumentList "machine", "start" -Wait -NoNewWindow -PassThru
    $ErrorActionPreference = "Stop"
    if ($p.ExitCode -ne 0) {
        Write-Host ""
        Write-Host "No se pudo iniciar la máquina desde este script (p. ej. error de WSL)." -ForegroundColor Yellow
        Write-Host "Inicia la máquina manualmente:" -ForegroundColor White
        Write-Host "  - Abre Podman Desktop y espera a que la máquina arranque, o" -ForegroundColor Gray
        Write-Host "  - Revisa WSL:  wsl --list  ; luego en otra terminal:  podman machine start" -ForegroundColor Gray
        Write-Host ""
    }
    Write-Host "Cuando la máquina esté en marcha, cierra esta terminal, abre una NUEVA," -ForegroundColor Cyan
    Write-Host "ve al proyecto y ejecuta de nuevo:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  cd $root" -ForegroundColor Green
    Write-Host "  .\scripts\redeploy-and-resync-full.ps1" -ForegroundColor Green
    Write-Host ""
    Write-Host "En la nueva terminal compose y el resync funcionarán." -ForegroundColor Gray
    Write-Host ""
    exit 0
}

# Redesplegar: bajar, borrar volúmenes (evita reutilizar datos corruptos o bind a D:), subir
Write-Host ""
Write-Host "=== Bajando contenedores ===" -ForegroundColor Yellow
$ErrorActionPreference = "SilentlyContinue"
podman compose -f podman-compose.yml down 2>&1 | Out-Null
Write-Host "Eliminando volúmenes Postgres y Redis (resync full repoblará la DB)..." -ForegroundColor Gray
podman volume rm medisena_postgres_data 2>&1 | Out-Null
podman volume rm medisena_redis_data 2>&1 | Out-Null
$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== Levantando contenedores (volúmenes nombrados) ===" -ForegroundColor Yellow
podman compose -f podman-compose.yml up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "Si falla por acceso a D:, en Podman Desktop añade D: en Resources > File sharing." -ForegroundColor Red
    exit 1
}

Write-Host "Esperando a que el contenedor arranque y PostgreSQL acepte conexiones (hasta 60 s)..." -ForegroundColor Gray
Start-Sleep -Seconds 8
$waited = 0
while ($waited -lt 60) {
    $ErrorActionPreference = "SilentlyContinue"
    $null = podman exec medisena-postgres pg_isready -U medisena -d medisena 2>&1
    $ok = ($LASTEXITCODE -eq 0)
    $ErrorActionPreference = "Stop"
    if ($ok) { Write-Host "PostgreSQL listo." -ForegroundColor Green; break }
    Start-Sleep -Seconds 5
    $waited += 5
}
if (-not $ok) {
    Write-Host "PostgreSQL no respondio a tiempo. Revisa: podman logs medisena-postgres" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Resincronizacion full (SMA + SPU -> medisena) ===" -ForegroundColor Cyan
& "$root\scripts\run-full-resync-to-medisena.ps1"

Write-Host ""
Write-Host "=== Listo ===" -ForegroundColor Green
Write-Host "Contenedores en marcha; backups y resync en D:."
