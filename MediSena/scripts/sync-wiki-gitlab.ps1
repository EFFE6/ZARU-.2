# Sincroniza contenido Wiki con GitLab (UTF-8 correcto)
# Requiere: env.gitlab-sync con GITLAB_TOKEN, curl
# Uso: .\scripts\sync-wiki-gitlab.ps1

$ErrorActionPreference = "Stop"
# Forzar UTF-8 en consola y salida (evita tildes mal codificadas)
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Web
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

# Verificar curl
if (-not (Get-Command curl.exe -ErrorAction SilentlyContinue)) {
    Write-Host "Error: curl no encontrado. Instale curl o use la ruta completa." -ForegroundColor Red
    exit 1
}

function Invoke-GitLabWiki {
    param($title, $contentFile)
    $headers = "PRIVATE-TOKEN: $token"
    $contentPath = (Resolve-Path $contentFile).Path -replace '\\', '/'
    $slugEnc = [System.Web.HttpUtility]::UrlEncode($title)
    $uriPut = "$baseUrl/projects/$projectPath/wikis/$slugEnc"
    $uriPost = "$baseUrl/projects/$projectPath/wikis"
    try {
        # Intentar PUT primero (actualizar existente)
        # --data-urlencode con charset=utf-8 para tildes correctas en GitLab
        $result = curl.exe -s -w "`n%{http_code}" -X PUT $uriPut `
            -H $headers `
            -H "Content-Type: application/x-www-form-urlencoded; charset=utf-8" `
            --data-urlencode "title=$title" `
            --data-urlencode "format=markdown" `
            --data-urlencode "content@$contentPath"
        $lines = $result -split "`n"
        $code = $lines | Select-Object -Last 1
        $body = ($lines | Select-Object -SkipLast 1) -join "`n"
        if ($code -eq "200") {
            Write-Host "  Actualizado: $title" -ForegroundColor Green
            return
        }
        if ($code -eq "404") {
            # Página no existe, crear con POST
            $result = curl.exe -s -w "`n%{http_code}" -X POST $uriPost `
                -H $headers `
                -H "Content-Type: application/x-www-form-urlencoded; charset=utf-8" `
                --data-urlencode "title=$title" `
                --data-urlencode "format=markdown" `
                --data-urlencode "content@$contentPath"
            $lines = $result -split "`n"
            $code = $lines | Select-Object -Last 1
            $body = ($lines | Select-Object -SkipLast 1) -join "`n"
            if ($code -eq "201" -or $code -eq "200") {
                Write-Host "  Creado: $title" -ForegroundColor Green
                return
            }
        }
        Write-Host "  Error: $title (HTTP $code)" -ForegroundColor Red
        if ($body) { Write-Host "    $body" -ForegroundColor DarkGray }
    } catch {
        Write-Host "  Error: $title - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "Sincronizando Wiki con GitLab (UTF-8)..." -ForegroundColor Cyan

# Crear archivos temporales con UTF-8 para curl
$tempDir = Join-Path $env:TEMP "medisena-wiki-temp"
if (-not (Test-Path $tempDir)) { New-Item -ItemType Directory -Path $tempDir | Out-Null }

$homeContent = @"
# MediSENA - Sistema de Medicina Asistencial del SENA

**Inicio del proyecto:** 1 de octubre de 2025  
**Paso a producción:** 2 de marzo de 2026

## Visión general

Sistema de gestión integral de servicios médicos del SENA: beneficiarios, funcionarios, citas, órdenes y reportes.

## Índice de documentación

- [Acta de Constitución](acta-constitucion)
- [WBS - Estructura de Desglose de Trabajo](wbs)
- [PERT - Diagrama PERT](pert)
- [Gantt - Cronograma](gantt)
- [Planificación GitLab](planificacion)
- [Módulos Backend (45)](modulos-backend)
- [Migración Oracle a PostgreSQL](migracion-oracle-postgresql)
- [Arquitectura del Backend](arquitectura-backend)
- [Guía de Contribución (ProjectRules)](contribucion)
- [Contexto del Sistema](https://git.sacriud.com/sena/medisena/-/blob/fresh-main/docs/context/system-context.md)
"@
$homeFile = Join-Path $tempDir "home.md"
[System.IO.File]::WriteAllText($homeFile, $homeContent, [System.Text.UTF8Encoding]::new($false))
Invoke-GitLabWiki -title "home" -contentFile $homeFile

# Copiar archivos docs con UTF-8
$files = @(
    @{ title = "acta-constitucion"; src = "docs/acta-constitucion.md" },
    @{ title = "wbs"; src = "docs/wbs.md" },
    @{ title = "pert"; src = "docs/pert.md" },
    @{ title = "gantt"; src = "docs/gantt.md" },
    @{ title = "planificacion"; src = "docs/PLANIFICACION_GITLAB.md" },
    @{ title = "modulos-backend"; src = "docs/MODULOS_BACKEND.md" },
    @{ title = "migracion-oracle-postgresql"; src = "docs/MIGRACION_ORACLE_A_POSTGRESQL.md" },
    @{ title = "arquitectura-backend"; src = "docs/ARQUITECTURA_BACKEND.md" },
    @{ title = "contribucion"; src = "docs/CONTRIBUCION.md" }
)
foreach ($f in $files) {
    if (Test-Path $f.src) {
        $content = Get-Content $f.src -Raw -Encoding UTF8
        $tempFile = Join-Path $tempDir "$($f.title).md"
        [System.IO.File]::WriteAllText($tempFile, $content, [System.Text.UTF8Encoding]::new($false))
        Invoke-GitLabWiki -title $f.title -contentFile $tempFile
    }
}

Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "`nWiki: https://git.sacriud.com/sena/medisena/-/wikis/home" -ForegroundColor Cyan
