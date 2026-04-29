$ErrorActionPreference = "Stop"

if (-not (Test-Path "env.gitlab-sync")) {
    Write-Host "Error: env.gitlab-sync no encontrado" -ForegroundColor Red
    exit 1
}

$envData = @{}
Get-Content "env.gitlab-sync" | Where-Object { $_ -match '^GITLAB_' } | ForEach-Object {
    $parts = $_ -split '=', 2
    if ($parts[1]) {
        $envData[$parts[0]] = $parts[1].Trim()
    }
}

$gitlabUrl = $envData["GITLAB_URL"]
$token = $envData["GITLAB_TOKEN"]
$projectPath = [uri]::EscapeDataString($envData["GITLAB_PROJECT_ID"])
$baseUrl = "$gitlabUrl/api/v4"
$headers = @{
    "PRIVATE-TOKEN" = $token
    "Content-Type" = "application/json"
}

function GetMilestoneIdByTitle {
    param([string]$Title)
    $milestones = Invoke-RestMethod -Method Get -Uri "$baseUrl/projects/$projectPath/milestones?state=active&per_page=100" -Headers $headers
    $m = $milestones | Where-Object { $_.title -eq $Title } | Select-Object -First 1
    if (-not $m) { throw "No existe milestone: $Title" }
    return $m.id
}

function NewIssueIfMissing {
    param(
        [string]$Title,
        [string]$Description,
        [int]$MilestoneId,
        [string]$Labels
    )
    $encoded = [uri]::EscapeDataString($Title)
    $existing = Invoke-RestMethod -Method Get -Uri "$baseUrl/projects/$projectPath/issues?state=all&search=$encoded&in=title&per_page=100" -Headers $headers
    $exact = $existing | Where-Object { $_.title -eq $Title } | Select-Object -First 1
    if ($exact) {
        Write-Host "Issue existente: !$($exact.iid) $Title" -ForegroundColor Gray
        return
    }

    $body = @{
        title = $Title
        description = $Description
        milestone_id = $MilestoneId
        labels = $Labels
    } | ConvertTo-Json -Depth 6

    $created = Invoke-RestMethod -Method Post -Uri "$baseUrl/projects/$projectPath/issues" -Headers $headers -Body $body
    Write-Host "Issue creada: !$($created.iid) $Title" -ForegroundColor Green
}

$m2 = GetMilestoneIdByTitle "M2 - Migracion y Unificacion de DB"
$m3 = GetMilestoneIdByTitle "M3 - Implementacion Backend Unificado"
$m4 = GetMilestoneIdByTitle "M4 - Implementacion Frontend y UX/UI"

$issues = @(
    @{
        title = "SEC-01 Modelo RBAC unificado (roles-persona-permisos)"
        milestone = $m2
        labels = "feature,critical,auth,api,storage,MVP,ready,ruta-critica,seguridad"
        description = @"
## Objetivo
Diseñar e implementar el modelo RBAC unificado para MediSENA usando una única base PostgreSQL `medisena`.

## Contexto validado
- SPU contiene entidades de rol/persona (`t_rol`, `t_rolpersona`).
- MediSENA actual depende principalmente de `ROL_USUA` (columna) y no de permisos por módulo/acción.

## Alcance
- Definir tablas canónicas: roles, permisos, rol_permiso, usuario_rol (y/o persona_rol), modulo_permiso.
- Reglas de migración desde SMA/SPU hacia el modelo canónico.
- Semillas iniciales por rol institucional (ADMIN, MEDICO, FUNCIONARIO, BENEFICIARIO).

## Criterios de aceptación
- Modelo RBAC documentado y desplegado en `medisena`.
- Trazabilidad de asignación rol->permiso->módulo.
"@
    },
    @{
        title = "BE-06 Backend 100% sobre esquema unico medisena (sin hardcode sma)"
        milestone = $m3
        labels = "refactor,critical,api,backend,storage,MVP,ready,ruta-critica"
        description = @"
## Objetivo
Eliminar acoplamiento a `sma.*` en backend y operar exclusivamente con esquema/base unificada `medisena`.

## Contexto validado
- `backend/utils/pg.js` fija `SCHEMA = 'sma'` y traduce SQL legacy a `sma.*`.

## Alcance
- Reemplazar traducción legacy por capa de repositorio orientada a tablas canónicas unificadas.
- Actualizar rutas críticas (auth, usuarios, ordenes, cuentas, agendas, reportes) a contratos de datos unificados.
- Mantener compatibilidad temporal controlada donde aplique.

## Criterios de aceptación
- Endpoints críticos no dependen de `sma.*`.
- Evidencia en pruebas de integración contra `medisena`.
"@
    },
    @{
        title = "BE-07 Autorizacion por permisos en middleware (RBAC real)"
        milestone = $m3
        labels = "feature,critical,auth,api,backend,MVP,ready,ruta-critica,seguridad"
        description = @"
## Objetivo
Aplicar autorización por permisos en API (no solo por rol nominal).

## Contexto validado
- `authorizeRoles` existe pero no se usa de forma transversal en rutas.

## Alcance
- Middleware `authorizePermissions` por recurso/acción.
- Matriz de permisos por endpoint y método HTTP.
- Auditoría de denegaciones y accesos sensibles.

## Criterios de aceptación
- Endpoints protegidos por permisos explícitos.
- Pruebas automáticas de autorización (allow/deny) por rol.
"@
    },
    @{
        title = "FE-06 Menu y rutas dinamicas por permisos RBAC"
        milestone = $m4
        labels = "feature,high,frontend,auth,MVP,ready,seguridad"
        description = @"
## Objetivo
Renderizar módulos/menús/rutas en frontend según permisos efectivos del usuario.

## Contexto validado
- Sidebar actual es estático y no filtra por rol/permisos.

## Alcance
- Cargar permisos del usuario autenticado.
- Filtrar menú y navegación por permiso.
- Guardas de ruta por permiso y manejo UX de acceso denegado.

## Criterios de aceptación
- Cada rol ve únicamente módulos autorizados.
- Validación funcional de navegación por perfiles.
"@
    }
)

foreach ($i in $issues) {
    NewIssueIfMissing -Title $i.title -Description $i.description -MilestoneId $i.milestone -Labels $i.labels
}

Write-Host "Completado. Revisar: $gitlabUrl/$($envData['GITLAB_PROJECT_ID'])/-/issues" -ForegroundColor Cyan
