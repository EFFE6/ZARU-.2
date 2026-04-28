# ============================================
# MediSENA - Detener Servicios
# ============================================

Write-Host ""
Write-Host "🛑 Deteniendo servicios MediSENA..." -ForegroundColor Yellow
Write-Host ""

$containers = @("medisena-backend", "medisena-frontend", "medisena-redis")

foreach ($container in $containers) {
    $exists = podman ps -a --filter "name=$container" --format "{{.Names}}" 2>$null
    if ($exists) {
        podman stop $container 2>$null
        podman rm $container 2>$null
        Write-Host "  ✅ $container detenido" -ForegroundColor Green
    } else {
        Write-Host "  ⚪ $container no estaba corriendo" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "✅ Todos los servicios MediSENA detenidos" -ForegroundColor Green
Write-Host ""




