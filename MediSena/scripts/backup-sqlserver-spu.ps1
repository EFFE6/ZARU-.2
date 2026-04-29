# MediSENA - Backup de la base de datos SPU en SQL Server (opcional)
# Solo si tiene una instancia SPU en SQL Server; la sincronizacion unificada usa Oracle SPU.
# Genera un archivo .bak de la base SPU.
# Uso: .\scripts\backup-sqlserver-spu.ps1
#
# Configure en .env o variables de entorno:
#   SQLSERVER_SPU_SERVER  = instancia (ej: localhost, .\SQLEXPRESS, servidor\instancia)
#   SQLSERVER_SPU_DB      = nombre de la base (por defecto: SPU)
#   SQLSERVER_SPU_USER    = usuario (opcional; si no se usa, autenticación Windows)
#   SQLSERVER_SPU_PASS    = contraseña (opcional)
#   SQLSERVER_SPU_BACKUP_PATH = ruta en el SERVIDOR donde escribir el .bak (debe ser accesible por el servicio SQL Server). Si no se define, se usa backups\ del proyecto (solo válido si SQL Server es local y tiene acceso a esa ruta).

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$backupDir = Join-Path $root "backups"
$timestamp = Get-Date -Format "yyyy-MM-ddTHH-mm-ss"

# Cargar .env si existe
if (Test-Path (Join-Path $root ".env")) {
    Get-Content (Join-Path $root ".env") | Where-Object { $_ -match '^[A-Za-z0-9_]+=' } | ForEach-Object {
        $p = $_ -split '=', 2
        if ($p[1]) { [Environment]::SetEnvironmentVariable($p[0].Trim(), $p[1].Trim(), 'Process') }
    }
}

$server = $env:SQLSERVER_SPU_SERVER
$dbName = $env:SQLSERVER_SPU_DB
if (-not $dbName) { $dbName = "SPU" }
$sqlUser = $env:SQLSERVER_SPU_USER
$sqlPass = $env:SQLSERVER_SPU_PASS
$serverBackupPath = $env:SQLSERVER_SPU_BACKUP_PATH

if (-not $server) {
    Write-Host "Falta configurar SQLSERVER_SPU_SERVER (instancia de SQL Server)." -ForegroundColor Red
    Write-Host "Ejemplo en .env: SQLSERVER_SPU_SERVER=localhost" -ForegroundColor Gray
    Write-Host "               SQLSERVER_SPU_DB=SPU" -ForegroundColor Gray
    exit 1
}

New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
$bakName = "SPU_$timestamp.bak"
if ($serverBackupPath) {
    $bakFileOnServer = Join-Path $serverBackupPath.TrimEnd('\') $bakName
} else {
    $bakFileOnServer = Join-Path $backupDir $bakName
}
$bakFile = Join-Path $backupDir $bakName

Write-Host "=== Backup base de datos SPU (SQL Server) ===" -ForegroundColor Cyan
Write-Host "  Servidor: $server" -ForegroundColor Gray
Write-Host "  Base:     $dbName" -ForegroundColor Gray
Write-Host "  Destino:  $bakFileOnServer" -ForegroundColor Gray
Write-Host ""

try {
    $pathForSql = $bakFileOnServer -replace "'", "''"
    $query = "BACKUP DATABASE [$dbName] TO DISK = N'$pathForSql' WITH NOFORMAT, NOINIT, COMPRESSION, SKIP, REWIND, NOUNLOAD, STATS = 10"
    $params = @{
        ServerInstance = $server
        Query          = $query
        QueryTimeout   = 3600
    }
    if ($sqlUser) {
        $params["Username"] = $sqlUser
        $params["Password"] = $sqlPass
    }

    if (Get-Command Invoke-Sqlcmd -ErrorAction SilentlyContinue) {
        Invoke-Sqlcmd @params
    } elseif (Get-Command sqlcmd -ErrorAction SilentlyContinue) {
        $auth = if ($sqlUser) { "-U `"$sqlUser`" -P `"$sqlPass`"" } else { "-E" }
        $sqlcmdArgs = "-S `"$server`" -Q `"$($query -replace '"', '\"')`" $auth -t 3600"
        Invoke-Expression "sqlcmd $sqlcmdArgs"
    } else {
        Write-Host "No se encontró Invoke-Sqlcmd (módulo SqlServer) ni sqlcmd.exe." -ForegroundColor Red
        Write-Host "Instale el módulo: Install-Module -Name SqlServer -Scope CurrentUser" -ForegroundColor Gray
        Write-Host "O agregue sqlcmd al PATH (SQL Server Tools)." -ForegroundColor Gray
        exit 1
    }

    # La ruta del backup es en el servidor SQL; si el script se ejecuta en el mismo equipo, podemos comprobar el archivo
    $finalFile = $bakFileOnServer
    if (Test-Path $bakFileOnServer) {
        $size = (Get-Item $bakFileOnServer).Length / 1MB
        Write-Host ""
        Write-Host "Backup generado correctamente." -ForegroundColor Green
        Write-Host "  $finalFile" -ForegroundColor White
        Write-Host "  Tamaño: $([math]::Round($size, 2)) MB" -ForegroundColor Gray
    } else {
        Write-Host ""
        Write-Host "Backup ejecutado. Si el script corre en otro equipo, el archivo está en el servidor:" -ForegroundColor Green
        Write-Host "  $bakFileOnServer" -ForegroundColor White
        Write-Host "Asegúrese de que la ruta sea accesible por el servicio SQL Server." -ForegroundColor Gray
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}
