# Crea Issue retrospectivo para documentar cambios doc sin Issue previo (cumplimiento ProjectRules)
# Ejecutar UNA vez. Requiere: env.gitlab-sync con GITLAB_TOKEN
# Uso: .\scripts\crear-issue-retrospectivo-docs.ps1

$ErrorActionPreference = "Stop"
$projectPath = "sena%2Fmedisena"
$baseUrl = "https://git.sacriud.com/api/v4"

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

$milestones = Invoke-RestMethod -Uri "$baseUrl/projects/$projectPath/milestones" -Headers @{ "PRIVATE-TOKEN" = $token }
$milestoneId = ($milestones | Where-Object { $_.title -match "v1.2" }).id

$desc = @"
## Documentacion retrospectiva (cumplimiento ProjectRules)

Cambios documentales realizados sin Issue asociado previo. Se crea este Issue para trazabilidad.

### Commits afectados

| Commit | Descripcion |
|--------|-------------|
| 6354ba4 | Actualizar fechas: inicio oct 2025, paso a produccion 2 mar 2026 |
| 8aa3025 | 45 issues validacion: 1 por modulo con descripcion desde legacy |
| 22090dd | Ajustar fechas con historico: inicio 1 oct 2024, produccion 2 mar 2025 |
| 9c53419 | Fechas proyecto: inicio 1 oct 2025, paso a produccion 2 mar 2026 |
| d1af470 | Plan entrega 2 mar: milestones, 45 modulos validacion, WBS, PERT, Gantt |
| 6e9f3d6 | MediSENA v3.0 - Sistema de Medicina Asistencial del SENA |

### Archivos modificados

docs/acta-constitucion.md, docs/PLANIFICACION_GITLAB.md, docs/wbs.md, docs/pert.md, docs/gantt.md, docs/planificacion-export.csv, docs/context/system-context.md, scripts/sync-milestones-gitlab.ps1, scripts/sync-wiki-gitlab.ps1

### Accion correctiva

- Creado docs/CONTRIBUCION.md con proceso doc↔Issue
- Templates actualizados con criterio Wiki antes de cerrar
- Script sync-labels-gitlab.ps1 para etiquetas estándar

**Estado**: Cerrado - trabajo documentado y proceso correctivo aplicado.
"@

$body = @{
    title        = "Doc: Trazabilidad retrospectiva - cambios planificacion y fechas"
    description  = $desc
    milestone_id = $milestoneId
    labels       = "documentation,medium"
} | ConvertTo-Json

Write-Host "Creando Issue retrospectivo en GitLab..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/projects/$projectPath/issues" -Method Post `
        -Headers @{ "PRIVATE-TOKEN" = $token; "Content-Type" = "application/json" } `
        -Body ([System.Text.Encoding]::UTF8.GetBytes($body))
    $issueIid = $response.iid
    Write-Host "Creado: Issue #$issueIid" -ForegroundColor Green
    # Cerrar (trabajo ya realizado)
    $closeBody = '{"state_event":"close"}' 
    Invoke-RestMethod -Uri "$baseUrl/projects/$projectPath/issues/$issueIid" -Method Put `
        -Headers @{ "PRIVATE-TOKEN" = $token; "Content-Type" = "application/json" } `
        -Body ([System.Text.Encoding]::UTF8.GetBytes($closeBody)) | Out-Null
    Write-Host "Cerrado (trabajo documentado)" -ForegroundColor Green
    Write-Host "URL: $($response.web_url)" -ForegroundColor Cyan
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}
