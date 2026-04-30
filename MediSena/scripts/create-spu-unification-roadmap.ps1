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

if (-not $gitlabUrl -or -not $token -or -not $projectPath) {
    Write-Host "Error: faltan variables GITLAB_URL, GITLAB_TOKEN o GITLAB_PROJECT_ID" -ForegroundColor Red
    exit 1
}

$baseUrl = "$gitlabUrl/api/v4"
$headers = @{
    "PRIVATE-TOKEN" = $token
    "Content-Type" = "application/json"
}

function Get-OrCreateMilestone {
    param(
        [string]$Title,
        [string]$Description,
        [string]$StartDate,
        [string]$DueDate
    )

    $milestones = Invoke-RestMethod -Method Get -Uri "$baseUrl/projects/$projectPath/milestones?state=active&per_page=100" -Headers $headers
    $existing = $milestones | Where-Object { $_.title -eq $Title } | Select-Object -First 1
    if ($existing) {
        Write-Host "Milestone existente: $Title (#$($existing.id))" -ForegroundColor Gray
        return $existing.id
    }

    $body = @{
        title = $Title
        description = $Description
        start_date = $StartDate
        due_date = $DueDate
    } | ConvertTo-Json -Depth 4

    $created = Invoke-RestMethod -Method Post -Uri "$baseUrl/projects/$projectPath/milestones" -Headers $headers -Body $body
    Write-Host "Milestone creado: $Title (#$($created.id))" -ForegroundColor Green
    return $created.id
}

function New-IssueIfMissing {
    param(
        [string]$Title,
        [string]$Description,
        [int]$MilestoneId,
        [string]$Labels
    )

    $encodedTitle = [uri]::EscapeDataString($Title)
    $existing = Invoke-RestMethod -Method Get -Uri "$baseUrl/projects/$projectPath/issues?state=all&search=$encodedTitle&in=title&per_page=100" -Headers $headers
    $exact = $existing | Where-Object { $_.title -eq $Title } | Select-Object -First 1
    if ($exact) {
        Write-Host "Issue existente: $Title (!$($exact.iid))" -ForegroundColor Gray
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

$milestonesDef = @(
    @{
        key = "M1"
        title = "M1 - Descubrimiento SPU y Gap Funcional"
        start = "2026-03-10"
        due = "2026-03-14"
        desc = "Inventario funcional de SPU, mapeo con MediSENA y matriz Actualizar/Reemplazar/Nuevo."
    },
    @{
        key = "M2"
        title = "M2 - Migracion y Unificacion de DB"
        start = "2026-03-17"
        due = "2026-03-28"
        desc = "Consolidacion del modelo de datos unificado SMA+SPU, integridad y performance."
    },
    @{
        key = "M3"
        title = "M3 - Implementacion Backend Unificado"
        start = "2026-03-31"
        due = "2026-04-11"
        desc = "Implementacion API sobre esquema unificado, compatibilidad legacy y seguridad."
    },
    @{
        key = "M4"
        title = "M4 - Implementacion Frontend y UX/UI"
        start = "2026-04-07"
        due = "2026-04-18"
        desc = "Modernizacion de UX/UI y paridad funcional FE con SPU sobre API unificada."
    },
    @{
        key = "M5"
        title = "M5 - Pruebas Integrales y Salida"
        start = "2026-04-21"
        due = "2026-05-01"
        desc = "Pruebas automatizadas y funcionales, regresion, UAT, plan de salida y rollback."
    }
)

$milestoneIds = @{}
foreach ($m in $milestonesDef) {
    $milestoneIds[$m.key] = Get-OrCreateMilestone -Title $m.title -Description $m.desc -StartDate $m.start -DueDate $m.due
}

$issues = @(
    @{
        title = "DB-01 Inventario SPU real y mapeo de entidades"
        milestone = "M1"
        labels = "refactor,critical,storage,MVP,ready,ruta-critica"
        description = @"
## Objetivo
Levantar inventario real de SPU y mapear entidades/atributos/reglas contra MediSENA.

## Alcance
- Recorrer modulos y submodulos de SPU.
- Identificar tablas/entidades implicadas por cada pantalla.
- Definir matriz de equivalencia SMA/SPU/MediSENA.

## Criterios de aceptacion
- Matriz de mapeo completa y validada por negocio.
- Lista de brechas por modulo (Actualizar/Reemplazar/Nuevo).
"@
    },
    @{
        title = "DB-02 Cerrar modelo canonico unificado SMA-SPU"
        milestone = "M2"
        labels = "refactor,critical,storage,MVP,ready,ruta-critica"
        description = @"
## Objetivo
Definir y cerrar el modelo canonico de datos unificado en PostgreSQL.

## Alcance
- Reglas de deduplicacion por entidad.
- Definicion de claves, integridad y trazabilidad de origen.
- Validacion de relaciones y constraints.

## Criterios de aceptacion
- Modelo aprobado por equipo tecnico/funcional.
- Script de creacion reproducible del esquema unificado.
"@
    },
    @{
        title = "DB-03 Migracion incremental y reconciliacion de datos"
        milestone = "M2"
        labels = "feature,high,storage,MVP,ready,ruta-critica"
        description = @"
## Objetivo
Migrar datos SMA y SPU al esquema unificado con control de calidad y reconciliacion.

## Alcance
- Cargas incrementales y re-ejecutables.
- Reporte de diferencias y excepciones.
- Estrategia de rollback de migracion.

## Criterios de aceptacion
- Ejecucion sin perdida de integridad.
- Reporte de reconciliacion con conteos origen/destino.
"@
    },
    @{
        title = "DB-04 Optimizacion de indices y rendimiento de consultas"
        milestone = "M2"
        labels = "enhancement,high,storage,MVP,ready"
        description = @"
## Objetivo
Asegurar rendimiento de consultas operativas y reportes sobre base unificada.

## Alcance
- Diseno de indices por consultas criticas.
- Analisis de planes de ejecucion.
- Ajustes de constraints y mantenimiento.

## Criterios de aceptacion
- Consultas criticas dentro de umbrales definidos.
- Evidencia de optimizacion en pruebas de carga.
"@
    },
    @{
        title = "DB-05 Pruebas automatizadas de validacion post-migracion"
        milestone = "M5"
        labels = "feature,high,storage,MVP,ready,qa"
        description = @"
## Objetivo
Automatizar validaciones de calidad de datos post-migracion.

## Alcance
- Pruebas de conteo, integridad y consistencia.
- Validacion de reglas de deduplicacion.
- Integracion en pipeline CI.

## Criterios de aceptacion
- Suite ejecutable en CI con reportes.
- Cobertura de entidades criticas.
"@
    },
    @{
        title = "BE-01 Refactor capa de acceso a datos al esquema unificado"
        milestone = "M3"
        labels = "refactor,critical,api,backend,MVP,ready,ruta-critica"
        description = @"
## Objetivo
Adaptar backend para operar sobre el modelo unificado sin romper contratos actuales.

## Alcance
- Abstraccion de acceso a datos.
- Eliminacion de acoplamientos directos a esquema SMA.
- Compatibilidad temporal con rutas legacy.

## Criterios de aceptacion
- Endpoints prioritarios operando en esquema unificado.
- Sin regresiones funcionales criticas.
"@
    },
    @{
        title = "BE-02 Paridad de endpoints SPU priorizados"
        milestone = "M3"
        labels = "feature,critical,api,backend,MVP,ready,ruta-critica"
        description = @"
## Objetivo
Implementar paridad funcional en API para modulos SPU prioritarios.

## Alcance
- Beneficiarios, ordenes, agendas, cuentas de cobro y reportes base.
- Contratos y respuestas versionadas.
- Validaciones de negocio y manejo de errores.

## Criterios de aceptacion
- Endpoints documentados y probados.
- Cobertura de casos felices y negativos.
"@
    },
    @{
        title = "BE-03 Compatibilidad legacy y plan de deprecacion"
        milestone = "M3"
        labels = "enhancement,high,api,backend,MVP,ready"
        description = @"
## Objetivo
Mantener continuidad operativa mientras se retira gradualmente la capa legacy.

## Alcance
- Alias temporales de endpoints.
- Telemetria de uso de rutas legacy.
- Plan de retiro por fases con comunicacion.

## Criterios de aceptacion
- Compatibilidad asegurada para consumidores vigentes.
- Fechas de deprecacion definidas por modulo.
"@
    },
    @{
        title = "BE-04 Hardening de autenticacion y auditoria"
        milestone = "M3"
        labels = "bug,critical,auth,backend,MVP,ready,ruta-critica,seguridad"
        description = @"
## Objetivo
Fortalecer seguridad de autenticacion/autorizacion y trazabilidad.

## Alcance
- Verificacion robusta JWT y expiracion.
- Endurecimiento de manejo de sesiones/tokens.
- Registro de auditoria para eventos criticos.

## Criterios de aceptacion
- Pruebas de seguridad y permisos superadas.
- Auditoria disponible para acciones criticas.
"@
    },
    @{
        title = "BE-05 Suite de pruebas backend (unitarias/integracion/contratos)"
        milestone = "M5"
        labels = "feature,high,api,backend,MVP,ready,qa"
        description = @"
## Objetivo
Contar con pruebas automaticas backend para soporte del release.

## Alcance
- Pruebas unitarias de servicios.
- Integracion con DB unificada.
- Pruebas de contrato de API.

## Criterios de aceptacion
- Pipeline CI verde.
- Cobertura minima acordada en dominios criticos.
"@
    },
    @{
        title = "FE-01 Matriz FE actual vs SPU (actualizar/reemplazar/nuevo)"
        milestone = "M1"
        labels = "refactor,high,frontend,MVP,ready"
        description = @"
## Objetivo
Definir la estrategia modulo a modulo en frontend para paridad SPU.

## Alcance
- Inventario de pantallas actuales de MediSENA.
- Mapeo contra pantallas SPU.
- Decision por modulo: actualizar, reemplazar o crear.

## Criterios de aceptacion
- Matriz validada y priorizada por negocio.
- Dependencias FE-BE claras por modulo.
"@
    },
    @{
        title = "FE-02 Modernizacion UX/UI y navegacion unificada"
        milestone = "M4"
        labels = "enhancement,high,frontend,MVP,ready"
        description = @"
## Objetivo
Modernizar experiencia de usuario y estandarizar componentes visuales.

## Alcance
- Navegacion unica por dominios.
- Patrones de formularios y tablas consistentes.
- Mejoras de accesibilidad y responsive.

## Criterios de aceptacion
- Design system aplicado en modulos priorizados.
- Validacion UX funcional con usuarios clave.
"@
    },
    @{
        title = "FE-03 Sustitucion de modulos mock y consolidacion de duplicados"
        milestone = "M4"
        labels = "refactor,high,frontend,MVP,ready"
        description = @"
## Objetivo
Eliminar modulos mock/duplicados y consolidar implementaciones reales.

## Alcance
- Retiro de pantallas no operativas.
- Consolidacion de rutas y componentes duplicados.
- Alineacion con contratos BE definitivos.

## Criterios de aceptacion
- Sin rutas duplicadas o mock en produccion.
- Flujo navegable coherente de extremo a extremo.
"@
    },
    @{
        title = "FE-04 Implementar flujos criticos end-to-end"
        milestone = "M4"
        labels = "feature,critical,frontend,MVP,ready,ruta-critica"
        description = @"
## Objetivo
Implementar y estabilizar flujos operativos criticos en frontend.

## Alcance
- Agenda -> Orden -> Cuenta de cobro -> Reporte.
- Validaciones de estado y trazabilidad de transacciones.
- Manejo robusto de errores y feedback al usuario.

## Criterios de aceptacion
- Flujos criticos completos sin bloqueantes.
- Evidencia funcional sobre datos reales de prueba.
"@
    },
    @{
        title = "FE-05 Pruebas frontend automatizadas y smoke funcional"
        milestone = "M5"
        labels = "feature,high,frontend,MVP,ready,qa"
        description = @"
## Objetivo
Asegurar calidad frontend con pruebas automatizadas y smoke funcional.

## Alcance
- Pruebas de componentes y flujos.
- Integracion FE-BE en ambiente staging.
- Smoke test previo a salida.

## Criterios de aceptacion
- Suite automatizada estable en CI.
- Smoke funcional aprobado por QA.
"@
    },
    @{
        title = "QA-01 Pruebas funcionales UAT por modulo y flujo"
        milestone = "M5"
        labels = "feature,critical,infra,qa,MVP,ready,ruta-critica"
        description = @"
## Objetivo
Validar funcionalmente la solucion completa con usuarios de negocio.

## Alcance
- Casos de prueba por modulo.
- Validacion de flujos criticos y reglas de negocio.
- Registro y priorizacion de defectos.

## Criterios de aceptacion
- UAT aprobado en modulos de alcance MVP.
- Defectos criticos cerrados.
"@
    },
    @{
        title = "QA-02 Regresion E2E automatizada pre-release"
        milestone = "M5"
        labels = "feature,critical,infra,qa,MVP,ready,ruta-critica"
        description = @"
## Objetivo
Ejecutar regresion integral automatizada antes del corte de release.

## Alcance
- Escenarios E2E de rutas prioritarias.
- Validacion de seguridad basica y permisos.
- Reporte de estabilidad del release candidate.

## Criterios de aceptacion
- Ejecucion E2E con resultados trazables.
- Cero defectos criticos abiertos al cierre.
"@
    },
    @{
        title = "REL-01 Checklist de salida y plan de rollback"
        milestone = "M5"
        labels = "infra,critical,devops,MVP,ready,ruta-critica"
        description = @"
## Objetivo
Formalizar liberacion a produccion con controles operativos y contingencia.

## Alcance
- Checklist tecnico y funcional de salida.
- Plan de rollback probado.
- Ventana y responsables de despliegue.

## Criterios de aceptacion
- Go/No-Go firmado por lideres tecnicos y funcionales.
- Plan de rollback documentado y verificable.
"@
    }
)

Write-Host "`nCreando issues del roadmap SPU + MediSENA..." -ForegroundColor Cyan
foreach ($it in $issues) {
    New-IssueIfMissing -Title $it.title -Description $it.description -MilestoneId $milestoneIds[$it.milestone] -Labels $it.labels
}

Write-Host "`nCompletado." -ForegroundColor Green
Write-Host "Milestones: $gitlabUrl/$($envData['GITLAB_PROJECT_ID'])/-/milestones" -ForegroundColor Cyan
Write-Host "Issues: $gitlabUrl/$($envData['GITLAB_PROJECT_ID'])/-/issues" -ForegroundColor Cyan
