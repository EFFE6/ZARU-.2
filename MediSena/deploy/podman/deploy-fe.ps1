param(
    [string]$NetworkName = "medisena-projecthub-net",
    [string]$ContainerName = "medisena-fe",
    [string]$ImageName = "localhost/medisena-projecthub-fe:latest",
    [int]$HostPort = 8080
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

podman build -f deploy/container/frontend.Containerfile -t $ImageName $RepoRoot

podman rm -f $ContainerName 2>$null
podman run -d `
    --name $ContainerName `
    --network $NetworkName `
    --replace `
    -p "${HostPort}:80" `
    $ImageName

Write-Host "Frontend: http://127.0.0.1:${HostPort}/ (API via /api hacia medisena-be)"
