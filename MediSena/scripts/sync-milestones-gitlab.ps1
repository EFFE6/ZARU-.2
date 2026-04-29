# Sincroniza milestones e issues en GitLab con la planificación
# Requiere: env.gitlab-sync con GITLAB_TOKEN (glab opcional)
# Uso: .\scripts\sync-milestones-gitlab.ps1

$ErrorActionPreference = "Stop"
$projectPath = "sena%2Fmedisena"
$baseUrl = "https://git.sacriud.com/api/v4"

# Cargar token
if (-not (Test-Path "env.gitlab-sync")) {
    Write-Host "Error: env.gitlab-sync no encontrado" -ForegroundColor Red
    exit 1
}
Get-Content env.gitlab-sync | Where-Object { $_ -match '^GITLAB_' } | ForEach-Object {
    $parts = $_ -split '=', 2
    if ($parts[1]) { [Environment]::SetEnvironmentVariable($parts[0], $parts[1].Trim(), 'Process') }
}
$token = $env:GITLAB_TOKEN
if (-not $token) {
    Write-Host "Error: GITLAB_TOKEN no configurado en env.gitlab-sync" -ForegroundColor Red
    exit 1
}

$headers = @{
    "PRIVATE-TOKEN" = $token
    "Content-Type"  = "application/json"
}

Write-Host "Sincronizando milestones en GitLab..." -ForegroundColor Cyan

# Listar milestones
$milestones = Invoke-RestMethod -Uri "$baseUrl/projects/$projectPath/milestones" -Headers $headers -Method Get

foreach ($m in $milestones) {
    $id = $m.id
    $title = $m.title
    $due = $m.due_date

    if ($title -match "v1.2") {
        Write-Host "  Actualizando v1.2: Paso a produccion, due 2026-03-02" -ForegroundColor Yellow
        $body = @{
            title       = "v1.2 - Paso a produccion"
            due_date    = "2026-03-02"
            description = "Validacion modulos, seguridad, anonimizacion DBs, funcionalidades, merge a main"
        } | ConvertTo-Json
        Invoke-RestMethod -Uri "$baseUrl/projects/$projectPath/milestones/$id" -Headers $headers -Method Put -Body $body | Out-Null
        Write-Host "  OK: v1.2 actualizado" -ForegroundColor Green
    }
    elseif ($title -match "v1.0") { Write-Host "  v1.0: $due" -ForegroundColor Gray }
    elseif ($title -match "v1.1") { Write-Host "  v1.1: $due" -ForegroundColor Gray }
}

Write-Host "`nActualizando issues..." -ForegroundColor Cyan

$issues = @(
    @{ iid = 8; title = "Validar 45 modulos: funcionalidad y criterios de seguridad"; description = "Epic: 1 issue por modulo. Validar funcionalidad + auth/roles + auditoria. Ver docs/MODULOS_BACKEND.md. Estimado: 15h total. Fechas: 19-25 feb 2026." },
    @{ iid = 9; title = $null; description = "Modulos pendientes. Estimado: 12h. Fechas: 26 feb - 1 mar 2026." },
    @{ iid = 11; title = $null; description = "Version estable, paso a produccion. Estimado: 1h. Fecha: 2 mar 2026." }
)

foreach ($issue in $issues) {
    $body = @{}
    if ($issue.title) { $body.title = $issue.title }
    if ($issue.description) { $body.description = $issue.description }
    if ($body.Count -eq 0) { continue }
    $jsonBody = $body | ConvertTo-Json
    try {
        Invoke-RestMethod -Uri "$baseUrl/projects/$projectPath/issues/$($issue.iid)" -Headers $headers -Method Put -Body $jsonBody | Out-Null
        Write-Host "  #$($issue.iid) actualizado" -ForegroundColor Green
    } catch {
        Write-Host "  #$($issue.iid): $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host "`nMilestones: https://git.sacriud.com/sena/medisena/-/milestones" -ForegroundColor Cyan
Write-Host "Issues: https://git.sacriud.com/sena/medisena/-/issues" -ForegroundColor Cyan
