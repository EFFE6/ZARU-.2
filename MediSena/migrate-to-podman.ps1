# ============================================
# MediSENA - Migración de Docker a Podman
# ============================================

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║    MediSENA - Migración de Docker a Podman             ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Paso 1: Detener contenedores Docker existentes
Write-Host "[1/4] Deteniendo contenedores Docker existentes..." -ForegroundColor Yellow

$dockerAvailable = Get-Command docker -ErrorAction SilentlyContinue
if ($dockerAvailable) {
    try {
        docker stop medisena-backend medisena-frontend medisena-redis 2>$null
        docker rm medisena-backend medisena-frontend medisena-redis 2>$null
        docker network rm medisena-network 2>$null
        Write-Host "      ✅ Contenedores Docker detenidos" -ForegroundColor Green
    } catch {
        Write-Host "      ⚠️  No había contenedores Docker activos" -ForegroundColor Yellow
    }
} else {
    Write-Host "      ℹ️  Docker no está instalado" -ForegroundColor Cyan
}

# Paso 2: Verificar Podman
Write-Host "[2/4] Verificando instalación de Podman..." -ForegroundColor Yellow

$podmanAvailable = Get-Command podman -ErrorAction SilentlyContinue
if (-not $podmanAvailable) {
    Write-Host "      ❌ Podman no está instalado" -ForegroundColor Red
    Write-Host ""
    Write-Host "      Ejecute: .\install-podman.ps1" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

$podmanVersion = podman --version
Write-Host "      ✅ $podmanVersion" -ForegroundColor Green

# Paso 3: Inicializar máquina Podman
Write-Host "[3/4] Configurando máquina Podman..." -ForegroundColor Yellow

$machineList = podman machine list --format "{{.Name}}" 2>$null
if (-not $machineList) {
    Write-Host "      Inicializando máquina virtual Podman..." -ForegroundColor Cyan
    podman machine init --cpus 2 --memory 4096 --disk-size 50
}

$machineRunning = podman machine list --format "{{.Running}}" 2>$null | Select-Object -First 1
if ($machineRunning -ne "true") {
    Write-Host "      Iniciando máquina Podman..." -ForegroundColor Cyan
    podman machine start
    Start-Sleep -Seconds 5
}

Write-Host "      ✅ Máquina Podman configurada" -ForegroundColor Green

# Paso 4: Información final
Write-Host "[4/4] Migración completada" -ForegroundColor Yellow
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✅ Migración a Podman completada exitosamente" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "  Para iniciar MediSENA con Podman ejecute:" -ForegroundColor White
Write-Host ""
Write-Host "    .\start-medisena-podman.ps1" -ForegroundColor Cyan
Write-Host ""
Write-Host "  O usando podman-compose:" -ForegroundColor White
Write-Host ""
Write-Host "    podman-compose -f podman-compose.yml up -d --build" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Ventajas de Podman sobre Docker:" -ForegroundColor Yellow
Write-Host "    • Sin daemon - más seguro y liviano" -ForegroundColor White
Write-Host "    • Rootless - ejecuta sin privilegios de administrador" -ForegroundColor White
Write-Host "    • Compatible con Docker - mismos comandos e imágenes" -ForegroundColor White
Write-Host "    • Código abierto - sin licencias comerciales" -ForegroundColor White
Write-Host ""

