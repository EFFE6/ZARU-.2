# ============================================
# MediSENA - Arranque local (Podman + Compose)
# ============================================
# Fuente de verdad del stack: podman-compose.yml
# Equivale a: podman compose -f podman-compose.yml up -d [--build]
# Cargar .env en la raiz (POSTGRES_*, JWT_*, FRONTEND_PORT, MEDISENA_DB_STORAGE, etc.)

param(
    [switch]$Build,
    [switch]$Down,
    [switch]$Logs,
    [switch]$Status,
    [switch]$Install,
    [string]$Service
)

$ErrorActionPreference = 'Stop'

$ComposeFile = 'podman-compose.yml'
$UseNativeCompose = $false

Write-Host ''
Write-Host '========================================================' -ForegroundColor Cyan
Write-Host '          MediSENA - Sistema de Salud SENA' -ForegroundColor Cyan
Write-Host '          Stack: podman-compose.yml (Podman)' -ForegroundColor Cyan
Write-Host '========================================================' -ForegroundColor Cyan
Write-Host ''

function Install-Podman {
    Write-Host '=== Instalacion de Podman ===' -ForegroundColor Cyan
    $wingetPath = Get-Command winget -ErrorAction SilentlyContinue
    if ($wingetPath) {
        Write-Host 'Instalando Podman via winget...' -ForegroundColor Yellow
        winget install -e --id RedHat.Podman
        Write-Host ''
        Write-Host '[OK] Podman instalado. Reinicie la terminal y ejecute:' -ForegroundColor Green
        Write-Host '   podman machine init' -ForegroundColor White
        Write-Host '   podman machine start' -ForegroundColor White
        Write-Host '   .\start-medisena.ps1' -ForegroundColor White
    } else {
        Write-Host 'Descargando Podman desde GitHub...' -ForegroundColor Yellow
        $podmanUrl = 'https://github.com/containers/podman/releases/latest/download/podman-setup-windows-amd64.exe'
        $installerPath = "$env:TEMP\podman-setup.exe"
        Invoke-WebRequest -Uri $podmanUrl -OutFile $installerPath
        Write-Host 'Ejecutando instalador...' -ForegroundColor Yellow
        Start-Process -FilePath $installerPath -Wait
        Write-Host ''
        Write-Host '[OK] Instalacion completada. Reinicie la terminal.' -ForegroundColor Green
    }
    exit 0
}

if ($Install) {
    Install-Podman
}

$podmanPath = Get-Command podman -ErrorAction SilentlyContinue
if (-not $podmanPath) {
    Write-Host '[X] Podman no esta instalado.' -ForegroundColor Red
    Write-Host ''
    Write-Host '   Opciones:' -ForegroundColor Yellow
    Write-Host '   1. Ejecute: .\start-medisena.ps1 -Install' -ForegroundColor White
    Write-Host '   2. O: winget install RedHat.Podman' -ForegroundColor White
    Write-Host ''
    exit 1
}

$podmanVersion = podman --version 2>$null
Write-Host "[OK] $podmanVersion" -ForegroundColor Green

# Raiz del repo (obligatorio antes de .env y compose)
$projectDir = $PSScriptRoot
Set-Location $projectDir

$envFile = Join-Path $projectDir '.env'
if (Test-Path $envFile) {
    Get-Content $envFile | Where-Object { $_ -match '^[A-Za-z_][A-Za-z0-9_]*=' } | ForEach-Object {
        $p = $_ -split '=', 2
        if ($p[1]) { [Environment]::SetEnvironmentVariable($p[0].Trim(), $p[1].Trim(), 'Process') }
    }
}
if (-not $env:MEDISENA_DB_STORAGE) { $env:MEDISENA_DB_STORAGE = 'D:/MediSENA_DBs' }

if (-not $env:POSTGRES_USER) { $env:POSTGRES_USER = 'medisena' }
if (-not $env:POSTGRES_PASSWORD) { $env:POSTGRES_PASSWORD = 'medisena_local' }
if (-not $env:POSTGRES_DB) { $env:POSTGRES_DB = 'medisena' }
if (-not $env:MEDISENA_DB) { $env:MEDISENA_DB = $env:POSTGRES_DB }
if (-not $env:POSTGRES_HOST_PORT) { $env:POSTGRES_HOST_PORT = '5433' }
if (-not $env:FRONTEND_PORT) { $env:FRONTEND_PORT = '8080' }
if (-not $env:REDIS_HOST_PORT) { $env:REDIS_HOST_PORT = '6380' }
if (-not $env:BACKEND_PORT) { $env:BACKEND_PORT = '8081' }
if (-not $env:JWT_SECRET) { $env:JWT_SECRET = 'MEDISENA_JWT_SECRET_KEY_2025_SENA_MEDICINA_ASISTENCIAL_LOCAL' }
if (-not $env:JWT_REFRESH_SECRET) { $env:JWT_REFRESH_SECRET = 'MEDISENA_JWT_REFRESH_SECRET_2025_SENA_LOCAL' }
if (-not $env:DB_TYPE) { $env:DB_TYPE = 'postgres' }

# En la red compose el backend debe usar el servicio Postgres (puerto 5432 interno).
# .env a menudo define POSTGRES_HOST=localhost y POSTGRES_PORT=5433 para scripts en el host.
$env:POSTGRES_HOST = 'medisena-postgres'
$env:POSTGRES_PORT = '5432'

# Maquina Podman (Windows): no abortar si machine list falla
if ($IsWindows -or $env:OS -eq 'Windows_NT') {
    $prevEap = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'SilentlyContinue'
        $machineList = podman machine list --format '{{.Name}},{{.Running}}' 2>$null
        if ($machineList) {
            $isRunning = $machineList -match ',true'
            if (-not $isRunning) {
                Write-Host '[!] La maquina Podman no esta corriendo. Iniciando...' -ForegroundColor Yellow
                $machineExists = podman machine list --format '{{.Name}}' 2>$null
                if (-not $machineExists) {
                    Write-Host '   Inicializando maquina Podman (primera vez, puede tardar)...' -ForegroundColor Cyan
                    $ErrorActionPreference = 'Continue'
                    podman machine init --cpus 2 --memory 4096
                }
                $ErrorActionPreference = 'Continue'
                podman machine start
                Start-Sleep -Seconds 5
                Write-Host '   [OK] Maquina Podman iniciada' -ForegroundColor Green
            }
        }
    } catch {
        Write-Host '[!] No se pudo comprobar podman machine. Si podman falla: podman machine start' -ForegroundColor Yellow
    } finally {
        $ErrorActionPreference = $prevEap
    }
}

# Carpetas bajo MEDISENA_DB_STORAGE para backups/sync (Postgres/Redis en compose = volumenes nombrados)
$storageRoot = $env:MEDISENA_DB_STORAGE.TrimEnd('\', '/').Replace('\', '/')
$storageWin = $storageRoot.Replace('/', '\')
$usaDiscoD = $storageRoot -match '^[Dd]:' -or $storageWin -match '^[Dd]:\\'
$storageDrive = Split-Path -Path $storageWin -Qualifier
if ($storageDrive -and (Test-Path -LiteralPath $storageDrive)) {
    foreach ($sub in @('backups', 'postgres_data', 'redis_data')) {
        $dirWin = Join-Path $storageWin $sub
        if (-not (Test-Path $dirWin)) {
            New-Item -ItemType Directory -Path $dirWin -Force | Out-Null
            Write-Host "Creado: $dirWin" -ForegroundColor Gray
        }
    }
    Write-Host "MEDISENA_DB_STORAGE (auxiliar): $storageWin" -ForegroundColor Cyan
} else {
    Write-Host "[!] No se pudo usar MEDISENA_DB_STORAGE=$storageWin (unidad no disponible). Backups locales pueden fallar; ajuste .env o el disco." -ForegroundColor Yellow
}

$postgresDataPath = $null
$tieneDatosPostgres = $false
if ($storageDrive -and (Test-Path -LiteralPath $storageDrive)) {
    $postgresDataPath = Join-Path $storageWin 'postgres_data'
    $tieneDatosPostgres = (Test-Path (Join-Path $postgresDataPath 'PG_VERSION')) -or (Test-Path (Join-Path $postgresDataPath 'base'))
}
if ($tieneDatosPostgres -and $usaDiscoD -and ($IsWindows -or $env:OS -eq 'Windows_NT')) {
    Write-Host ''
    Write-Host 'Nota: Hay datos legacy en postgres_data bajo MEDISENA_DB_STORAGE; compose usa volumen nombrado para Postgres.' -ForegroundColor Gray
    Write-Host ''
}

# Resolver podman compose vs podman-compose
$useNativeCompose = $false
$prevEap = $ErrorActionPreference
$ErrorActionPreference = 'SilentlyContinue'
$null = podman compose version 2>&1
$ErrorActionPreference = $prevEap
if ($LASTEXITCODE -eq 0) {
    $UseNativeCompose = $true
    Write-Host 'Usando: podman compose (nativo)' -ForegroundColor Green
} else {
    $podmanComposePath = Get-Command podman-compose -ErrorAction SilentlyContinue
    if ($podmanComposePath) {
        Write-Host 'Usando: podman-compose' -ForegroundColor Green
    } else {
        Write-Host 'podman-compose no encontrado. Instalando con pip...' -ForegroundColor Yellow
        $pipEap = $ErrorActionPreference
        $ErrorActionPreference = 'Continue'
        try { pip install podman-compose } finally { $ErrorActionPreference = $pipEap }
    }
}

function Invoke-MedisenaCompose {
    param([string[]]$Arguments)
    if ($UseNativeCompose) {
        $all = @('compose', '-f', $ComposeFile) + $Arguments
        & podman @all
    } else {
        $all = @('-f', $ComposeFile) + $Arguments
        & podman-compose @all
    }
}

# Aviso socket Podman (Windows)
if ($IsWindows -or $env:OS -eq 'Windows_NT') {
    $ea = $ErrorActionPreference
    $ErrorActionPreference = 'SilentlyContinue'
    $testConn = podman ps 2>&1
    $ErrorActionPreference = $ea
    if ($LASTEXITCODE -ne 0 -or "$testConn" -match 'Cannot connect|Error|refused') {
        Write-Host ''
        Write-Host 'AVISO: Podman no acepta conexiones (socket). Abra Podman Desktop o: podman machine stop; podman machine start' -ForegroundColor Yellow
        Write-Host '  docs/PODMAN-CONTENEDORES-WINDOWS.md' -ForegroundColor Gray
        Write-Host ''
    }
}

function Resolve-ComposeServiceName {
    param([string]$Name)
    if (-not $Name) { return $null }
    $n = $Name.Trim().ToLowerInvariant()
    switch ($n) {
        'backend' { return 'medisena-backend' }
        'frontend' { return 'medisena-frontend' }
        'redis' { return 'medisena-redis' }
        'postgres' { return 'medisena-postgres' }
        default {
            if ($n -match '^medisena-') { return $n }
            return $Name
        }
    }
}

function Show-Status {
    Write-Host ''
    Write-Host '=== Estado (compose) ===' -ForegroundColor Cyan
    Invoke-MedisenaCompose @('ps')
    Write-Host ''
    Write-Host '=== Contenedores medisena-* ===' -ForegroundColor Cyan
    podman ps -a --filter 'name=medisena' --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' 2>$null
    Write-Host ''
}

function Show-Logs {
    param([string]$ServiceName)
    $svc = Resolve-ComposeServiceName -Name $ServiceName
    if (-not $svc) {
        Write-Host 'Use -Service: backend, frontend, redis, postgres (nombres compose: medisena-*)' -ForegroundColor Yellow
        Write-Host 'Ejemplo: .\start-medisena.ps1 -Logs -Service backend' -ForegroundColor White
        return
    }
    Write-Host "Logs de $svc (Ctrl+C para salir)..." -ForegroundColor Yellow
    Invoke-MedisenaCompose @('logs', '-f', $svc)
}

function Stop-Services {
    Write-Host 'Deteniendo stack (compose down)...' -ForegroundColor Yellow
    $prevEap = $ErrorActionPreference
    $ErrorActionPreference = 'SilentlyContinue'
    try {
        Invoke-MedisenaCompose @('down') 2>&1 | Out-Null
    } finally {
        $ErrorActionPreference = $prevEap
    }
    Write-Host '[OK] Servicios detenidos' -ForegroundColor Green
}

function Start-Services {
    param([switch]$Rebuild)
    Write-Host ''
    Write-Host 'Iniciando servicios MediSENA...' -ForegroundColor Cyan
    Write-Host ('  DB_TYPE: ' + $env:DB_TYPE) -ForegroundColor Gray
    if ($usaDiscoD -and ($IsWindows -or $env:OS -eq 'Windows_NT')) {
        Write-Host '  Backups/sync en disco D: (MEDISENA_DB_STORAGE).' -ForegroundColor Gray
    }
    Write-Host ''

    $frontendDist = Join-Path $projectDir 'frontend\dist'
    if ((-not (Test-Path $frontendDist)) -or $Rebuild) {
        Write-Host 'Construyendo frontend (npm run build)...' -ForegroundColor Yellow
        Push-Location (Join-Path $projectDir 'frontend')
        $ea = $ErrorActionPreference
        $ErrorActionPreference = 'SilentlyContinue'
        try {
            if (-not (Test-Path 'node_modules')) { npm install 2>&1 | Out-Null }
            npm run build 2>&1 | Out-Null
            if ($LASTEXITCODE -ne 0) {
                Write-Host '  AVISO: build frontend fallo. Use dist previo o corrija el proyecto.' -ForegroundColor Yellow
            } else {
                Write-Host '  [OK] Frontend construido' -ForegroundColor Green
            }
        } finally {
            $ErrorActionPreference = $ea
            Pop-Location
        }
        Write-Host ''
    }

    if ($Rebuild) {
        Invoke-MedisenaCompose @('up', '-d', '--build')
    } else {
        Invoke-MedisenaCompose @('up', '-d')
    }

    Write-Host ''
    $ea = $ErrorActionPreference
    $ErrorActionPreference = 'SilentlyContinue'
    $containers = podman ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' 2>&1
    $ErrorActionPreference = $ea
    if ($LASTEXITCODE -eq 0 -and "$containers" -match 'medisena') {
        Write-Host 'Contenedores:' -ForegroundColor Green
        Write-Host $containers -ForegroundColor Gray
    }

    Start-Sleep -Seconds 8
    try {
        $null = Invoke-RestMethod -Uri ('http://localhost:{0}/health' -f $env:BACKEND_PORT) -TimeoutSec 10
        Write-Host '   [OK] Backend health' -ForegroundColor Green
    } catch {
        Write-Host '   [!] Backend aun iniciando (health)' -ForegroundColor Yellow
    }

    Write-Host ''
    Write-Host '=======================================================' -ForegroundColor Green
    Write-Host '  [OK] MediSENA iniciado (compose)' -ForegroundColor Green
    Write-Host '=======================================================' -ForegroundColor Green
    Write-Host ''
    Write-Host ('  Frontend:    http://localhost:' + $env:FRONTEND_PORT) -ForegroundColor Cyan
    Write-Host ('  Backend:     http://localhost:' + $env:BACKEND_PORT) -ForegroundColor Cyan
    Write-Host ('  PostgreSQL:  localhost:' + $env:POSTGRES_HOST_PORT) -ForegroundColor Cyan
    Write-Host ('  Redis:       localhost:' + $env:REDIS_HOST_PORT) -ForegroundColor Cyan
    Write-Host ('  Health:      http://localhost:' + $env:BACKEND_PORT + '/health') -ForegroundColor Cyan
    Write-Host ''
    Write-Host '  Comandos:' -ForegroundColor Yellow
    Write-Host '    .\start-medisena.ps1 -Status' -ForegroundColor White
    Write-Host '    .\start-medisena.ps1 -Build' -ForegroundColor White
    Write-Host '    .\start-medisena.ps1 -Down' -ForegroundColor White
    Write-Host '    .\start-medisena.ps1 -Logs -Service backend' -ForegroundColor White
    Write-Host ''
}

if ($Status) {
    Show-Status
} elseif ($Down) {
    Stop-Services
} elseif ($Logs) {
    Show-Logs -ServiceName $Service
} else {
    Start-Services -Rebuild:$Build
}
