# ============================================
# MediSENA - Instalación de Podman para Windows
# ============================================

Write-Host "=== Instalación de Podman para MediSENA ===" -ForegroundColor Cyan
Write-Host ""

# Verificar si Podman ya está instalado
$podmanInstalled = Get-Command podman -ErrorAction SilentlyContinue

if ($podmanInstalled) {
    Write-Host "✅ Podman ya está instalado:" -ForegroundColor Green
    podman --version
    Write-Host ""
    Write-Host "Para iniciar MediSENA ejecute: .\start-medisena-podman.ps1" -ForegroundColor Yellow
    exit 0
}

Write-Host "Podman no está instalado. Instalando..." -ForegroundColor Yellow
Write-Host ""

# Opción 1: Usar winget (recomendado)
$wingetAvailable = Get-Command winget -ErrorAction SilentlyContinue

if ($wingetAvailable) {
    Write-Host "Instalando Podman mediante winget..." -ForegroundColor Cyan
    winget install -e --id RedHat.Podman
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Podman instalado correctamente" -ForegroundColor Green
        Write-Host ""
        Write-Host "IMPORTANTE: Cierre y vuelva a abrir PowerShell para que los cambios surtan efecto." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Después de reiniciar PowerShell, ejecute:" -ForegroundColor Cyan
        Write-Host "  1. podman machine init    # Inicializar máquina virtual" -ForegroundColor White
        Write-Host "  2. podman machine start   # Iniciar máquina virtual" -ForegroundColor White
        Write-Host "  3. .\start-medisena-podman.ps1  # Iniciar MediSENA" -ForegroundColor White
        exit 0
    }
}

# Opción 2: Descargar instalador manualmente
Write-Host ""
Write-Host "No se pudo instalar automáticamente. Por favor instale Podman manualmente:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Descargue el instalador desde:" -ForegroundColor White
Write-Host "   https://github.com/containers/podman/releases" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Busque el archivo: podman-X.X.X-setup.exe (la versión más reciente)" -ForegroundColor White
Write-Host ""
Write-Host "3. Ejecute el instalador y siga las instrucciones" -ForegroundColor White
Write-Host ""
Write-Host "4. Después de instalar, abra PowerShell y ejecute:" -ForegroundColor White
Write-Host "   podman machine init" -ForegroundColor Cyan
Write-Host "   podman machine start" -ForegroundColor Cyan
Write-Host ""
Write-Host "5. Finalmente ejecute: .\start-medisena-podman.ps1" -ForegroundColor White

# Abrir página de descargas
$openBrowser = Read-Host "¿Desea abrir la página de descargas de Podman? (S/N)"
if ($openBrowser -eq "S" -or $openBrowser -eq "s") {
    Start-Process "https://github.com/containers/podman/releases"
}

