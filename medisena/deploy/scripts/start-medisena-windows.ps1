<#
.SYNOPSIS
  Arranca backend (8081) y frontend Vite (5173) en Windows y verifica Postgres antes de iniciar.

.PARAMETER SkipDbCheck
  No ejecuta la verificación de base de datos.

.PARAMETER LocalPostgres
  Fuerza POSTGRES_HOST=127.0.0.1 para esta sesión (útil si en backend.env tienes host.docker.internal y corres sin Docker).

.NOTES
  Requiere Node.js y npm en PATH. Ejecutar: npm install en backend/ y frontend/ al menos una vez (en una máquina con red o copiando node_modules).
  Ajusta deploy/env/backend.env según tu Postgres (host, puerto, usuario, contraseña, MEDISENA_DB).
#>
param(
  [switch]$SkipDbCheck,
  [switch]$LocalPostgres
)

$ErrorActionPreference = 'Stop'

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$BackendDir = Join-Path $RepoRoot 'backend'
$FrontendDir = Join-Path $RepoRoot 'frontend'
$EnvFile = Join-Path $RepoRoot 'deploy\env\backend.env'

function Read-EnvValue {
  param([string]$Path, [string]$Key)
  if (-not (Test-Path -LiteralPath $Path)) { return $null }
  foreach ($line in Get-Content -LiteralPath $Path) {
    $t = $line.Trim()
    if ($t.StartsWith('#') -or $t -eq '') { continue }
    $i = $t.IndexOf('=')
    if ($i -lt 1) { continue }
    $k = $t.Substring(0, $i).Trim()
    if ($k -eq $Key) { return $t.Substring($i + 1).Trim() }
  }
  return $null
}

Write-Host "Raíz del repo: $RepoRoot" -ForegroundColor Cyan

if (-not (Test-Path -LiteralPath $BackendDir)) {
  throw "No se encontró backend en: $BackendDir"
}
if (-not (Test-Path -LiteralPath $FrontendDir)) {
  throw "No se encontró frontend en: $FrontendDir"
}

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
  throw "Node.js no está en el PATH. Instálalo o añádelo al PATH."
}

if (-not (Test-Path -LiteralPath (Join-Path $BackendDir 'node_modules'))) {
  throw "Falta backend\node_modules. En una maquina con red: cd backend; npm ci (o npm install). Sin red: copia la carpeta backend\node_modules completa desde esa maquina."
}
if (-not (Test-Path -LiteralPath (Join-Path $FrontendDir 'node_modules'))) {
  throw "Falta frontend\node_modules. En una maquina con red: cd frontend; npm ci (o npm install). Sin red: copia la carpeta frontend\node_modules completa desde esa maquina."
}

$viteEntry = Join-Path $FrontendDir 'node_modules\vite\bin\vite.js'
if (-not (Test-Path -LiteralPath $viteEntry)) {
  throw "frontend\node_modules esta incompleto: no existe vite\bin\vite.js. La carpeta node_modules suele ser una copia parcial o de otra version de Node. Solucion: en una PC con red, dentro de frontend ejecuta npm ci (o npm install), verifica que exista node_modules\vite\bin\vite.js, y copia TODA la carpeta frontend\node_modules a este servidor (misma version mayor de Node recomendada)."
}

$expressPkg = Join-Path $BackendDir 'node_modules\express\package.json'
if (-not (Test-Path -LiteralPath $expressPkg)) {
  throw "backend\node_modules esta incompleto (no se encontro express). Ejecuta npm ci en backend con red, o copia backend\node_modules completo."
}

if (-not (Test-Path -LiteralPath $EnvFile)) {
  Write-Warning "No existe $EnvFile - se usaran valores por defecto de pg.js (localhost:5433)."
  $EnvFileForNode = ''
} else {
  $EnvFileForNode = ($EnvFile -replace '\\', '/')
}

if ($LocalPostgres) {
  $env:POSTGRES_HOST = '127.0.0.1'
  Write-Host "POSTGRES_HOST forzado a 127.0.0.1 (-LocalPostgres)." -ForegroundColor Yellow
}

if (-not $SkipDbCheck) {
  Write-Host "`n--- Verificación PostgreSQL ---" -ForegroundColor Cyan
  Push-Location $BackendDir
  try {
    if ($EnvFileForNode) {
      & node -r dotenv/config "scripts/checkDatabase.js" "dotenv_config_path=$EnvFileForNode"
    } else {
      & node "scripts/checkDatabase.js"
    }
    if ($LASTEXITCODE -ne 0) {
      throw "checkDatabase.js terminó con código $LASTEXITCODE. Revisa deploy/env/backend.env y que Postgres esté en marcha."
    }
  } finally {
    Pop-Location
  }
  Write-Host "--- Fin verificación BD ---`n" -ForegroundColor Cyan
}

$bePort = Read-EnvValue -Path $EnvFile -Key 'PORT'
if (-not $bePort) { $bePort = '8081' }

Write-Host "Iniciando backend en nueva ventana (puerto $bePort)..." -ForegroundColor Green
$beLoc = $BackendDir.Replace("'", "''")
$beLines = [System.Collections.Generic.List[string]]::new()
$beLines.Add("Set-Location -LiteralPath '$beLoc'")
$beLines.Add('$env:NODE_ENV = ''development''')
if ($LocalPostgres) {
  $beLines.Add('$env:POSTGRES_HOST = ''127.0.0.1''')
}
if ($EnvFileForNode) {
  $cfg = $EnvFileForNode.Replace("'", "''")
  $beLines.Add("node -r dotenv/config server.js dotenv_config_path='$cfg'")
}
else {
  $beLines.Add('node server.js')
}
$beScript = ($beLines -join "`n")

Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoExit', '-Command', $beScript) -WorkingDirectory $BackendDir

Write-Host "Esperando arranque del API..." -ForegroundColor DarkGray
$healthUrl = "http://127.0.0.1:$bePort/health"
$ok = $false
for ($i = 0; $i -lt 30; $i++) {
  try {
    $r = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 2
    if ($r.StatusCode -eq 200) {
      $ok = $true
      Write-Host "[OK] Backend responde: $healthUrl" -ForegroundColor Green
      break
    }
  } catch {
    Start-Sleep -Milliseconds 500
  }
}
if (-not $ok) {
  Write-Warning "No se pudo confirmar $healthUrl a tiempo. Revisa la ventana del backend (¿puerto ocupado o error de Postgres?)."
}

Write-Host "Iniciando frontend (Vite) en nueva ventana - http://127.0.0.1:5173 ..." -ForegroundColor Green
$feLoc = $FrontendDir.Replace("'", "''")
$feScript = @("Set-Location -LiteralPath '$feLoc'", 'npm run dev') -join "`n"
Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoExit', '-Command', $feScript) -WorkingDirectory $FrontendDir

Write-Host "`nListo. Abre el navegador en: http://127.0.0.1:5173" -ForegroundColor Cyan
Write-Host "API (directo): http://127.0.0.1:$bePort/health" -ForegroundColor Cyan
Write-Host "Si Postgres está en esta misma máquina sin Docker, suele hacer falta: -LocalPostgres" -ForegroundColor DarkYellow
