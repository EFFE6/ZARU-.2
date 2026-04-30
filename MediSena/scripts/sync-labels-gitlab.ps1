# Sincroniza etiquetas en GitLab segun estandar ProjectRules (gitlab-workflow.mdc)
# Crea etiquetas si no existen. Requiere: env.gitlab-sync con GITLAB_TOKEN
# Uso: .\scripts\sync-labels-gitlab.ps1

$ErrorActionPreference = "Stop"
$projectPath = "sena%2Fmedisena"
$baseUrl = "https://git.sacriud.com/api/v4"

# Cargar token
if (-not (Test-Path "env.gitlab-sync")) {
    Write-Host "Error: env.gitlab-sync no encontrado" -ForegroundColor Red
    exit 1
}
Get-Content env.gitlab-sync | Where-Object { $_ -match '^GITLAB_TOKEN=' } | ForEach-Object {
    $parts = $_ -split '=', 2
    if ($parts[1]) { $script:token = $parts[1].Trim() }
}
if (-not $token) {
    Write-Host "Error: GITLAB_TOKEN no configurado" -ForegroundColor Red
    exit 1
}

$headers = @{
    "PRIVATE-TOKEN" = $token
    "Content-Type"  = "application/json"
}

# Obtener etiquetas existentes
$existingLabels = @{}
try {
    $labels = Invoke-RestMethod -Uri "$baseUrl/projects/$projectPath/labels" -Headers @{ "PRIVATE-TOKEN" = $token }
    foreach ($l in $labels) { $existingLabels[$l.name] = $true }
} catch {
    Write-Host "Advertencia: no se pudieron listar etiquetas existentes" -ForegroundColor Yellow
}

# Etiquetas segun ProjectRules + MediSENA (gitlab-workflow.mdc, GITLAB-PLANNING.md)
$labelsToCreate = @(
    # Por tipo
    @{ name = "feature"; color = "#00a854"; desc = "Nueva funcionalidad" },
    @{ name = "bug"; color = "#d9534f"; desc = "Error o defecto" },
    @{ name = "enhancement"; color = "#5bc0de"; desc = "Mejora de funcionalidad existente" },
    @{ name = "documentation"; color = "#0099cc"; desc = "Cambios a documentacion" },
    @{ name = "refactor"; color = "#f0ad4e"; desc = "Refactorizacion sin cambio de comportamiento" },
    @{ name = "infra"; color = "#777777"; desc = "Infraestructura, CI/CD, despliegue" },
    # Por prioridad
    @{ name = "critical"; color = "#d9534f"; desc = "Prioridad critica" },
    @{ name = "high"; color = "#f0ad4e"; desc = "Prioridad alta" },
    @{ name = "medium"; color = "#5bc0de"; desc = "Prioridad media" },
    @{ name = "low"; color = "#5cb85c"; desc = "Prioridad baja" },
    # Por componente (MediSENA)
    @{ name = "api"; color = "#337ab7"; desc = "API Backend" },
    @{ name = "auth"; color = "#8e44ad"; desc = "Autenticacion/autorizacion" },
    @{ name = "storage"; color = "#16a085"; desc = "Almacenamiento, BD" },
    @{ name = "frontend"; color = "#3498db"; desc = "Frontend React" },
    @{ name = "backend"; color = "#2ecc71"; desc = "Backend Node.js" },
    # Por fase
    @{ name = "MVP"; color = "#2ecc71"; desc = "Fase MVP" },
    @{ name = "post-MVP"; color = "#95a5a6"; desc = "Post MVP" },
    # Por estado
    @{ name = "blocked"; color = "#e74c3c"; desc = "Bloqueado" },
    @{ name = "needs-review"; color = "#f39c12"; desc = "Requiere revision" },
    @{ name = "ready"; color = "#27ae60"; desc = "Listo para implementar" },
    @{ name = "ruta-critica"; color = "#c0392b"; desc = "Actividad en ruta critica" },
    # Especificos MediSENA
    @{ name = "validacion"; color = "#9b59b6"; desc = "Validacion de modulo/funcionalidad" },
    @{ name = "seguridad"; color = "#e74c3c"; desc = "Aspectos de seguridad" },
    # Por recurso
    @{ name = "senior-dev"; color = "#1abc9c"; desc = "Recurso senior" },
    @{ name = "mid-dev"; color = "#3498db"; desc = "Recurso mid" },
    @{ name = "devops"; color = "#9b59b6"; desc = "DevOps" },
    @{ name = "qa"; color = "#e67e22"; desc = "QA" }
)

Write-Host "Sincronizando etiquetas en GitLab (ProjectRules)..." -ForegroundColor Cyan
$creadas = 0
$existentes = 0

foreach ($lb in $labelsToCreate) {
    if ($existingLabels.ContainsKey($lb.name)) {
        Write-Host "  [OK] $($lb.name) (existente)" -ForegroundColor Gray
        $existentes++
    } else {
        try {
            $body = @{
                name        = $lb.name
                color       = $lb.color
                description = $lb.desc
            } | ConvertTo-Json
            Invoke-RestMethod -Uri "$baseUrl/projects/$projectPath/labels" -Method Post -Headers $headers -Body $body | Out-Null
            Write-Host "  [CREADO] $($lb.name)" -ForegroundColor Green
            $creadas++
        } catch {
            Write-Host "  [ERROR] $($lb.name): $_" -ForegroundColor Red
        }
    }
}

Write-Host "`nResumen: $creadas creadas, $existentes ya existian" -ForegroundColor Cyan
Write-Host "Labels: https://git.sacriud.com/sena/medisena/-/labels" -ForegroundColor Cyan
