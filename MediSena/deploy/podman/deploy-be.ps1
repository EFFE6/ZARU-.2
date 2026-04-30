param(
    [string]$NetworkName = "medisena-projecthub-net",
    [string]$ContainerName = "medisena-be",
    [string]$ImageName = "localhost/medisena-projecthub-be:latest",
    [int]$HostPort = 8081,
    [string]$EnvFile = ""
)

$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path

if (-not (Get-Command podman -ErrorAction SilentlyContinue)) {
    Write-Error "Podman no esta en PATH."
    exit 1
}

$prevErr = $ErrorActionPreference
$ErrorActionPreference = "Continue"
podman network inspect $NetworkName 2>$null | Out-Null
$netOk = ($LASTEXITCODE -eq 0)
$ErrorActionPreference = $prevErr
if (-not $netOk) {
    podman network create $NetworkName
}

Set-Location $RepoRoot

podman build -f deploy/container/backend.Containerfile -t $ImageName $RepoRoot

$runArgs = @(
    "run", "-d",
    "--name", $ContainerName,
    "--network", $NetworkName,
    "--replace",
    "-p", "${HostPort}:8081"
)

if ($EnvFile -ne "" -and (Test-Path $EnvFile)) {
    $runArgs += "--env-file"
    $runArgs += (Resolve-Path $EnvFile).Path
}

# Postgres u otros servicios en el host (Windows/Linux Podman)
$runArgs += "--add-host=host.docker.internal:host-gateway"
$runArgs += "--add-host=host.containers.internal:host-gateway"

$runArgs += $ImageName

podman rm -f $ContainerName 2>$null
& podman @runArgs

Write-Host "Backend: http://127.0.0.1:${HostPort}/health"
