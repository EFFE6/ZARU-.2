# Crea 45 issues en GitLab (uno por modulo) para validacion
# Descripciones interpretadas desde legacy (ANALISIS_FUNCIONALIDADES_LEGACY.md)
# Requiere: env.gitlab-sync con GITLAB_TOKEN, curl
# Uso: .\scripts\crear-issues-validacion-modulos.ps1

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

# Obtener milestone ID
$milestones = Invoke-RestMethod -Uri "$baseUrl/projects/$projectPath/milestones" -Headers @{ "PRIVATE-TOKEN" = $token }
$milestoneId = ($milestones | Where-Object { $_.title -match "v1.2" }).id

# Descripciones por modulo (Legacy)
$modulos = @(
    @{ id="V001"; n="auth"; r="/api/auth"; d="Funcionalidad (Legacy: Autenticacion): Login, logout, verify JWT, cambio contrasenas. Roles: ADMIN, MEDICO, FUNCIONARIO, BENEFICIARIO. Validar: token valido, endpoints protegidos, roles, auditoria login/logout, no exponer datos sensibles. Estimado: 20 min" },
    @{ id="V002"; n="usuarios"; r="/api/usuarios"; d="Funcionalidad (Legacy: Usuarios): CRUD, filtros, roles. Validar: CRUD OK, solo ADMIN gestiona, contrasenas no expuestas, auditoria. Estimado: 20 min" },
    @{ id="V003"; n="beneficiarios"; r="/api/beneficiarios"; d="Funcionalidad (Legacy: Beneficiarios): CRUD, busqueda, afiliacion, parentesco. Validar: CRUD OK, filtros, datos personales protegidos, relacion parentescos. Estimado: 20 min" },
    @{ id="V004"; n="funcionarios"; r="/api/funcionarios"; d="Funcionalidad (Legacy: Funcionarios): CRUD, cargos, datos laborales. Validar: CRUD OK, cargos correctos, autorizacion. Estimado: 20 min" },
    @{ id="V005"; n="medicos"; r="/api/medicos"; d="Funcionalidad (Legacy: Medicos): CRUD, vinculacion especialidades. Validar: CRUD OK, relacion especialidades, roles. Estimado: 20 min" },
    @{ id="V006"; n="ordenes"; r="/api/ordenes"; d="Funcionalidad (Legacy: Ordenes Medicas): CRUD, cancelar, filtros concepto/estado. Validar: CRUD OK, cancelacion con validaciones, relacion beneficiario-medico. Estimado: 25 min" },
    @{ id="V007"; n="contratistas"; r="/api/contratistas"; d="Funcionalidad (Legacy: Contratos): CRUD contratistas, vinculacion recibos. Validar: CRUD OK, datos contrato, autorizacion. Estimado: 20 min" },
    @{ id="V008"; n="parentescos"; r="/api/parentescos"; d="Funcionalidad (Legacy: Parentescos): Maestra CRUD. Validar: CRUD OK, consistencia beneficiarios, solo ADMIN. Estimado: 15 min" },
    @{ id="V009"; n="vigencias"; r="/api/vigencias"; d="Funcionalidad (Legacy: Parametros): Abrir vigencia anual, periodos. Validar: consulta/creacion, solo ADMIN, periodos logicos. Estimado: 20 min" },
    @{ id="V010"; n="recibos-pago"; r="/api/recibos-pago"; d="Funcionalidad (Legacy: Reembolsos): CRUD recibos, relacion cuentas. Validar: CRUD OK, relacion contratistas, datos financieros protegidos, auditoria. Estimado: 20 min" },
    @{ id="V011"; n="resoluciones"; r="/api/resoluciones"; d="Funcionalidad (Legacy: Resoluciones): CRUD normativas. Validar: CRUD OK, numeracion/fechas, roles. Estimado: 20 min" },
    @{ id="V012"; n="especialidades"; r="/api/especialidades"; d="Funcionalidad (Legacy: Medicos): Maestra especialidades. Validar: CRUD OK, jerarquia sub-especialidades, solo ADMIN. Estimado: 15 min" },
    @{ id="V013"; n="sub-especialidades"; r="/api/sub-especialidades"; d="Funcionalidad (Legacy: Medicos): Maestra sub-especialidades. Validar: CRUD OK, relacion especialidades, integridad. Estimado: 15 min" },
    @{ id="V014"; n="contratos"; r="/api/contratos"; d="Funcionalidad (Legacy: Contratos): CRUD, vinculacion contratistas. Validar: CRUD OK, relacion, vigencia. Estimado: 20 min" },
    @{ id="V015"; n="cuentas-cobro"; r="/api/cuentas-cobro"; d="Funcionalidad (Legacy: Cuentas Cobro): CRUD, liquidar, certificados. Validar: CRUD OK, liquidacion, datos financieros protegidos, auditoria. Estimado: 25 min" },
    @{ id="V016"; n="grupos-tope"; r="/api/grupos-tope"; d="Funcionalidad (Legacy: Topes): Grupos limites jerarquicos. Validar: CRUD OK, jerarquia niveles, solo ADMIN. Estimado: 20 min" },
    @{ id="V017"; n="niveles-tope"; r="/api/niveles-tope"; d="Funcionalidad (Legacy: Topes): Niveles por grupo. Validar: CRUD OK, relacion grupos, validacion limites. Estimado: 20 min" },
    @{ id="V018"; n="parametros"; r="/api/parametros"; d="Funcionalidad (Legacy: Parametros): Config sistema. Validar: consulta OK, solo ADMIN, valores sensibles no expuestos. Estimado: 20 min" },
    @{ id="V019"; n="relacion-pagos"; r="/api/relacion-pagos"; d="Funcionalidad (Legacy: Cuentas): Relacion pagos, vinculacion recibos-cuentas. Validar: endpoints OK, relacion coherente, datos protegidos. Estimado: 20 min" },
    @{ id="V020"; n="dashboard"; r="/api/dashboard"; d="Funcionalidad (Legacy: Reportes): Metricas tiempo real, indicadores. Validar: metricas correctas, roles, datos agregados, rendimiento. Estimado: 20 min" },
    @{ id="V021"; n="agendas"; r="/api/agendas"; d="Funcionalidad (Legacy: Agendas): Agenda, citas, programacion. Validar: consulta OK, programacion citas, relacion ordenes/medicos, datos protegidos. Estimado: 25 min" },
    @{ id="V022"; n="audit"; r="/api/audit"; d="Funcionalidad (Legacy: Auditoria): Logs acciones criticas. Validar: logs registran, solo ADMIN consulta, no modificables, datos ofuscados. Estimado: 20 min" },
    @{ id="V023"; n="excedentes-30-dias"; r="/api/excedentes-30-dias"; d="Funcionalidad (Legacy: Excedentes): Excedentes >30 dias. Validar: reporte OK, criterios 30 dias, roles, datos financieros. Estimado: 20 min" },
    @{ id="V024"; n="excedentes-formato-financiero"; r="/api/excedentes-formato-financiero"; d="Funcionalidad (Legacy): Export formato financiero. Validar: formato OK, datos coherentes, roles. Estimado: 20 min" },
    @{ id="V025"; n="excedentes-formato-salarios"; r="/api/excedentes-formato-salarios"; d="Funcionalidad (Legacy): Export formato salarios. Validar: formato OK, datos coherentes, roles. Estimado: 20 min" },
    @{ id="V026"; n="excedentes-imprimir"; r="/api/excedentes-imprimir"; d="Funcionalidad (Legacy): Impresion excedentes. Validar: impresion/export OK, formato, roles. Estimado: 20 min" },
    @{ id="V027"; n="excedentes-relacion-recibos"; r="/api/excedentes-relacion-recibos"; d="Funcionalidad (Legacy): Relacion excedentes-recibos. Validar: relacion OK, datos coherentes, roles. Estimado: 20 min" },
    @{ id="V028"; n="excedentes-sin-cancelar"; r="/api/excedentes-sin-cancelar"; d="Funcionalidad (Legacy): Excedentes pendientes. Validar: listado OK, criterios estado, roles. Estimado: 20 min" },
    @{ id="V029"; n="reportes/beneficiarios-inactivos"; r="/api/reportes/beneficiarios-inactivos"; d="Funcionalidad (Legacy): Reporte beneficiarios inactivos. Validar: reporte OK, criterios inactividad, roles, datos personales protegidos. Estimado: 20 min" },
    @{ id="V030"; n="reportes/citas-generadas"; r="/api/reportes/citas-generadas"; d="Funcionalidad (Legacy): Reporte citas generadas. Validar: reporte OK, filtros, roles. Estimado: 20 min" },
    @{ id="V031"; n="reportes/cuentas-cobro-sin-asociar"; r="/api/reportes/cuentas-cobro-sin-asociar"; d="Funcionalidad (Legacy): Cuentas sin asociar. Validar: reporte OK, criterios, roles. Estimado: 20 min" },
    @{ id="V032"; n="reportes/f1"; r="/api/reportes/f1"; d="Funcionalidad (Legacy): Reporte F1 institucional. Validar: formato F1 OK, datos coherentes, roles, datos sensibles ofuscados. Estimado: 25 min" },
    @{ id="V033"; n="reportes/f2"; r="/api/reportes/f2"; d="Funcionalidad (Legacy): Reporte F2 institucional. Validar: formato F2 OK, datos coherentes, roles. Estimado: 25 min" },
    @{ id="V034"; n="reportes/f5"; r="/api/reportes/f5"; d="Funcionalidad (Legacy): Reporte F5 institucional. Validar: formato F5 OK, datos coherentes, roles. Estimado: 25 min" },
    @{ id="V035"; n="reportes/f10"; r="/api/reportes/f10"; d="Funcionalidad (Legacy): Reporte F10 institucional. Validar: formato F10 OK, datos coherentes, roles. Estimado: 25 min" },
    @{ id="V036"; n="reportes/f12"; r="/api/reportes/f12"; d="Funcionalidad (Legacy): Reporte F12 institucional. Validar: formato F12 OK, datos coherentes, roles. Estimado: 25 min" },
    @{ id="V037"; n="reportes/facturacion-contratista"; r="/api/reportes/facturacion-contratista"; d="Funcionalidad (Legacy): Facturacion por contratista. Validar: reporte OK, datos financieros, roles. Estimado: 20 min" },
    @{ id="V038"; n="reportes/historia"; r="/api/reportes/historia"; d="Funcionalidad (Legacy: Historia Clinica): Historial beneficiario. Validar: reporte OK, solo medicos/admin, datos salud protegidos, auditoria. Estimado: 25 min" },
    @{ id="V039"; n="reportes/ordenes-registradas"; r="/api/reportes/ordenes-registradas"; d="Funcionalidad (Legacy): Ordenes registradas. Validar: reporte OK, filtros, roles, datos protegidos. Estimado: 20 min" },
    @{ id="V040"; n="reportes/reembolsos"; r="/api/reportes/reembolsos"; d="Funcionalidad (Legacy): Reporte reembolsos. Validar: reporte OK, datos financieros, roles. Estimado: 20 min" },
    @{ id="V041"; n="reportes-nacionales/citas-generadas"; r="/api/reportes-nacionales/citas-generadas"; d="Funcionalidad (Legacy): Citas nivel nacional. Validar: reporte OK, agregacion, roles, datos agregados. Estimado: 20 min" },
    @{ id="V042"; n="reportes-nacionales/f5"; r="/api/reportes-nacionales/f5"; d="Funcionalidad (Legacy): F5 nivel nacional. Validar: formato OK, agregacion, roles. Estimado: 20 min" },
    @{ id="V043"; n="reportes-nacionales/f10"; r="/api/reportes-nacionales/f10"; d="Funcionalidad (Legacy): F10 nivel nacional. Validar: formato OK, agregacion, roles. Estimado: 20 min" },
    @{ id="V044"; n="reportes-nacionales/f15"; r="/api/reportes-nacionales/f15"; d="Funcionalidad (Legacy): F15 nivel nacional. Validar: formato OK, agregacion, roles. Estimado: 20 min" },
    @{ id="V045"; n="reportes-nacionales/ordenes-especialidad"; r="/api/reportes-nacionales/ordenes-especialidad"; d="Funcionalidad (Legacy): Ordenes por especialidad nacional. Validar: reporte OK, agregacion, roles. Estimado: 20 min" }
)

Write-Host "Creando 45 issues de validacion (1 por modulo) en GitLab..." -ForegroundColor Cyan
$creados = 0
foreach ($m in $modulos) {
    $titulo = "[$($m.id)] Validar modulo $($m.n)"
    $body = @{
        title = $titulo
        description = $m.desc
        milestone_id = $milestoneId
        labels = "ruta-critica,validacion"
    } | ConvertTo-Json
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/projects/$projectPath/issues" -Method Post `
            -Headers @{ "PRIVATE-TOKEN" = $token; "Content-Type" = "application/json" } `
            -Body ([System.Text.Encoding]::UTF8.GetBytes($body))
        $creados++
        Write-Host "  Creado: $($m.id) $($m.nombre)" -ForegroundColor Green
    } catch {
        Write-Host "  Error: $($m.id) $($m.nombre) - $($_.Exception.Message)" -ForegroundColor Red
    }
}
Write-Host "`nCreados: $creados/45 issues" -ForegroundColor Cyan
Write-Host "Issues: https://git.sacriud.com/sena/medisena/-/issues" -ForegroundColor Cyan
