# ============================================
# MediSENA - Validacion de requisitos locales
# ============================================
# Comprueba archivos, versiones (PowerShell, Node/npm, Podman, Python/pip, Compose, opcionales), .env, disco, puertos, espacio.
# Uso (desde la raiz del repo):
#   .\scripts\validate-medisena-prerequisites.ps1
#   .\scripts\validate-medisena-prerequisites.ps1 -Strict    # WARN cuenta como fallo (exit 1)

param(
    [switch]$Strict
)

$ErrorActionPreference = 'Continue'
$script:Fail = 0
$script:Warn = 0
$RepoRoot = Split-Path -Parent $PSScriptRoot

function Write-Check {
    param(
        [ValidateSet('OK', 'WARN', 'FAIL')]
        [string]$Level,
        [string]$Message
    )
    $prefix = switch ($Level) {
        'OK' { '[OK] ' }
        'WARN' { '[!] ' }
        'FAIL' { '[X] ' }
    }
    $color = switch ($Level) {
        'OK' { 'Green' }
        'WARN' { 'Yellow' }
        'FAIL' { 'Red' }
    }
    Write-Host ($prefix + $Message) -ForegroundColor $color
    if ($Level -eq 'FAIL') { $script:Fail++ }
    elseif ($Level -eq 'WARN') { $script:Warn++ }
}

function Test-NodeMeetsMinimum {
    param([string]$VersionLine)
    if ($VersionLine -notmatch 'v(\d+)\.') { return $false }
    $major = [int]$Matches[1]
    return $major -ge 18
}

function Test-PodmanMeetsMinimum {
    param([string]$VersionLine)
    if ($VersionLine -notmatch '(\d+)\.(\d+)') { return $true }
    $major = [int]$Matches[1]
    return $major -ge 4
}

function Test-NpmMeetsMinimum {
    param([string]$VersionLine)
    if ($VersionLine -notmatch '^(\d+)') { return $true }
    $major = [int]$Matches[1]
    return $major -ge 8
}

function Test-PythonMeetsMinimum {
    param([string]$VersionLine)
    if ($VersionLine -notmatch '(\d+)\.(\d+)') { return $true }
    $major = [int]$Matches[1]
    $minor = [int]$Matches[2]
    if ($major -gt 3) { return $true }
    if ($major -eq 3 -and $minor -ge 8) { return $true }
    return $false
}

function Get-PythonExecutable {
    foreach ($name in @('python', 'python3')) {
        $c = Get-Command $name -ErrorAction SilentlyContinue
        if ($c) { return @{ Cmd = $name; UsePyLauncher = $false } }
    }
    $py = Get-Command py -ErrorAction SilentlyContinue
    if ($py) { return @{ Cmd = 'py'; UsePyLauncher = $true } }
    return $null
}

Write-Host ''
Write-Host '========================================================' -ForegroundColor Cyan
Write-Host ' MediSENA - Validacion de requisitos del sistema' -ForegroundColor Cyan
Write-Host '========================================================' -ForegroundColor Cyan
Write-Host ''
Write-Host ('Raiz del repo: ' + $RepoRoot) -ForegroundColor Gray
Write-Host ('PowerShell: ' + $PSVersionTable.PSVersion) -ForegroundColor Gray
Write-Host ('OS: ' + [System.Environment]::OSVersion.VersionString) -ForegroundColor Gray
$psv = $PSVersionTable.PSVersion
if ($psv.Major -lt 5 -or ($psv.Major -eq 5 -and $psv.Minor -lt 1)) {
    Write-Check WARN ('PowerShell ' + $psv + ' (se recomienda 5.1 o superior, p. ej. Windows PowerShell actual)')
} else {
    Write-Check OK ('PowerShell ' + $psv + ' cumple minimo 5.1')
}
Write-Host ''

# --- Archivos del proyecto ---
Write-Host '-- Archivos del proyecto --' -ForegroundColor Cyan
$required = @(
    @{ Path = 'podman-compose.yml'; Desc = 'Orquestacion Compose' }
    @{ Path = 'backend\Dockerfile'; Desc = 'Imagen backend' }
    @{ Path = 'frontend\Dockerfile'; Desc = 'Imagen frontend' }
    @{ Path = 'frontend\package.json'; Desc = 'Frontend npm' }
    @{ Path = 'backend\package.json'; Desc = 'Backend npm' }
)
foreach ($r in $required) {
    $full = Join-Path $RepoRoot $r.Path
    if (Test-Path -LiteralPath $full) {
        Write-Check OK ($r.Desc + ': ' + $r.Path)
    } else {
        Write-Check FAIL ('Falta ' + $r.Path + ' (' + $r.Desc + ')')
    }
}

$envPath = Join-Path $RepoRoot '.env'
$envExample = Join-Path $RepoRoot '.env.example'
if (Test-Path -LiteralPath $envPath) {
    Write-Check OK 'Archivo .env presente'
} else {
    if (Test-Path -LiteralPath $envExample) {
        Write-Check WARN 'No hay .env; copie .env.example a .env antes de produccion local'
    } else {
        Write-Check FAIL 'No hay .env ni .env.example'
    }
}

# Cargar .env para puertos y almacenamiento (misma regla que start-medisena.ps1)
if (Test-Path -LiteralPath $envPath) {
    Get-Content -LiteralPath $envPath | Where-Object { $_ -match '^[A-Za-z_][A-Za-z0-9_]*=' } | ForEach-Object {
        $p = $_ -split '=', 2
        if ($p[1]) { [Environment]::SetEnvironmentVariable($p[0].Trim(), $p[1].Trim(), 'Process') }
    }
}
if (-not $env:POSTGRES_HOST_PORT) { $env:POSTGRES_HOST_PORT = '5433' }
if (-not $env:FRONTEND_PORT) { $env:FRONTEND_PORT = '8080' }
if (-not $env:REDIS_HOST_PORT) { $env:REDIS_HOST_PORT = '6380' }
if (-not $env:BACKEND_PORT) { $env:BACKEND_PORT = '8081' }
if (-not $env:MEDISENA_DB_STORAGE) { $env:MEDISENA_DB_STORAGE = 'D:/MediSENA_DBs' }

# --- Node.js y npm (build del frontend / tooling) ---
Write-Host ''
Write-Host '-- Node.js y npm --' -ForegroundColor Cyan
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
$npmCmd = Get-Command npm -ErrorAction SilentlyContinue
if (-not $nodeCmd) {
    Write-Check FAIL 'Node.js no esta en PATH (se recomienda LTS 18 o superior)'
} else {
    $verLine = (& node --version 2>$null)
    if (Test-NodeMeetsMinimum $verLine) {
        Write-Check OK ('Node.js ' + $verLine.Trim())
    } else {
        Write-Check WARN ('Node.js ' + $verLine.Trim() + ' (se recomienda v18+)')
    }
}
if (-not $npmCmd) {
    Write-Check FAIL 'npm no esta en PATH'
} else {
    $npmVer = (& npm --version 2>$null).Trim()
    if (Test-NpmMeetsMinimum $npmVer) {
        Write-Check OK ('npm ' + $npmVer)
    } else {
        Write-Check WARN ('npm ' + $npmVer + ' (se recomienda 8+ para proyectos recientes)')
    }
}

$distPath = Join-Path $RepoRoot 'frontend\dist'
if (Test-Path -LiteralPath $distPath) {
    Write-Check OK 'frontend\dist existe (imagen nginx puede construirse)'
} else {
    Write-Check WARN 'frontend\dist no existe; start-medisena.ps1 ejecutara npm run build'
}

# --- Podman ---
Write-Host ''
Write-Host '-- Podman --' -ForegroundColor Cyan
$podman = Get-Command podman -ErrorAction SilentlyContinue
if (-not $podman) {
    Write-Check FAIL 'Podman no instalado o no esta en PATH'
    Write-Host '       Instalar: .\start-medisena.ps1 -Install o winget install RedHat.Podman' -ForegroundColor Gray
} else {
    $pv = (podman --version 2>$null).Trim()
    if (Test-PodmanMeetsMinimum $pv) {
        Write-Check OK $pv
    } else {
        Write-Check WARN ($pv + ' (se recomienda Podman 4.x o superior)')
    }

    $prevEap = $ErrorActionPreference
    $ErrorActionPreference = 'SilentlyContinue'
    $null = podman info 2>$null
    $ErrorActionPreference = $prevEap
    if ($LASTEXITCODE -eq 0) {
        Write-Check OK 'Podman responde (podman info)'
    } else {
        Write-Check WARN 'Podman no responde bien; en Windows: podman machine start o Podman Desktop'
    }

    if ($IsWindows -or $env:OS -eq 'Windows_NT') {
        $ErrorActionPreference = 'SilentlyContinue'
        $ml = podman machine list --format '{{.Name}},{{.Running}}' 2>$null
        $ErrorActionPreference = $prevEap
        if (-not $ml) {
            Write-Check WARN 'No se pudo leer podman machine list (WSL/servicio)'
        } elseif ($ml -match ',true') {
            Write-Check OK 'Maquina Podman en ejecucion'
        } else {
            Write-Check WARN 'Maquina Podman no esta corriendo; ejecute podman machine start'
        }
    }
}

# --- Compose (podman compose o podman-compose) ---
Write-Host ''
Write-Host '-- Compose --' -ForegroundColor Cyan
$hasCompose = $false
$nativeCompose = $false
$prevEap = $ErrorActionPreference
$ErrorActionPreference = 'SilentlyContinue'
$null = podman compose version 2>$null
$ErrorActionPreference = $prevEap
if ($LASTEXITCODE -eq 0) {
    $ErrorActionPreference = 'SilentlyContinue'
    $cvLines = podman compose version 2>&1 | Select-Object -First 4
    $ErrorActionPreference = $prevEap
    $cvOne = ($cvLines | ForEach-Object { $_.ToString().Trim() } | Where-Object { $_ }) -join ' | '
    if ($cvOne) {
        Write-Check OK ('podman compose (integrado) - ' + $cvOne)
    } else {
        Write-Check OK 'podman compose (integrado) disponible'
    }
    $hasCompose = $true
    $nativeCompose = $true
}
$pc = Get-Command podman-compose -ErrorAction SilentlyContinue
if ($pc) {
    $pcVer = & podman-compose --version 2>$null
    $pcLine = 'podman-compose'
    if ($null -ne $pcVer) {
        $pcLine = (($pcVer | ForEach-Object { $_.ToString() }) -join ' ').Trim()
        if (-not $pcLine) { $pcLine = 'podman-compose' }
    }
    Write-Check OK ('podman-compose en PATH - ' + $pcLine)
    $hasCompose = $true
}
if (-not $hasCompose) {
    Write-Check WARN 'Ni podman compose ni podman-compose; instale el plugin o: pip install podman-compose'
}

$composeYml = Join-Path $RepoRoot 'podman-compose.yml'
if ($hasCompose -and (Test-Path -LiteralPath $composeYml)) {
    Push-Location $RepoRoot
    $configOk = $false
    $ErrorActionPreference = 'SilentlyContinue'
    if ($nativeCompose) {
        $null = & podman compose -f podman-compose.yml config 2>$null
        if ($LASTEXITCODE -eq 0) { $configOk = $true }
    }
    if (-not $configOk -and $pc) {
        $null = & podman-compose -f podman-compose.yml config 2>$null
        if ($LASTEXITCODE -eq 0) { $configOk = $true }
    }
    $ErrorActionPreference = $prevEap
    Pop-Location
    if ($configOk) {
        Write-Check OK 'podman-compose.yml valido (compose config)'
    } else {
        Write-Check WARN 'No se pudo validar compose config (revise YAML, Podman activo y variables)'
    }
}

# --- Python y pip (opcional; instalacion de podman-compose por pip) ---
Write-Host ''
Write-Host '-- Python y pip --' -ForegroundColor Cyan
$pyInfo = Get-PythonExecutable
if (-not $pyInfo) {
    if (-not $hasCompose) {
        Write-Check WARN 'Python no en PATH; se recomienda 3.8+ y pip para: pip install podman-compose'
    } else {
        Write-Host '[..] Python no en PATH (opcional si usa podman compose integrado)' -ForegroundColor Gray
    }
} else {
    $verLine = $null
    if ($pyInfo.UsePyLauncher) {
        $verLine = (& py -3 --version 2>$null)
        if (-not $verLine) { $verLine = (& py --version 2>$null) }
    } else {
        $verLine = (& $pyInfo.Cmd --version 2>$null)
    }
    $verLine = ($verLine | Out-String).Trim()
    if (-not $verLine) {
        Write-Check WARN 'No se pudo leer version de Python'
    } elseif (Test-PythonMeetsMinimum $verLine) {
        Write-Check OK $verLine
    } else {
        Write-Check WARN ($verLine + ' (se recomienda Python 3.8+)')
    }

    $pipLine = $null
    if ($pyInfo.UsePyLauncher) {
        $pipLine = (& py -3 -m pip --version 2>$null)
    } else {
        $pipLine = (& $pyInfo.Cmd -m pip --version 2>$null)
    }
    if ($pipLine) {
        $pipStr = (($pipLine | ForEach-Object { $_.ToString() }) -join ' ').Trim()
        if ($pipStr) {
            Write-Check OK $pipStr
        } else {
            Write-Check WARN 'pip no devolvio version legible'
        }
    } else {
        $pipOnly = Get-Command pip -ErrorAction SilentlyContinue
        if ($pipOnly) {
            $pl2 = & pip --version 2>$null
            $pipStr2 = (($pl2 | ForEach-Object { $_.ToString() }) -join ' ').Trim()
            if ($pipStr2) {
                Write-Check OK $pipStr2
            } else {
                Write-Check WARN 'pip no responde'
            }
        } else {
            Write-Check WARN 'pip no encontrado (python -m pip); necesario para instalar podman-compose via pip'
        }
    }
}

# --- MEDISENA_DB_STORAGE y unidad ---
Write-Host ''
Write-Host '-- Almacenamiento (MEDISENA_DB_STORAGE) --' -ForegroundColor Cyan
$storageWin = $env:MEDISENA_DB_STORAGE.TrimEnd('\', '/').Replace('/', '\')
$drive = Split-Path -Path $storageWin -Qualifier
if (-not $drive) {
    Write-Check WARN ('MEDISENA_DB_STORAGE=' + $env:MEDISENA_DB_STORAGE + ' (ruta no tipica)')
} elseif (Test-Path -LiteralPath $drive) {
    Write-Check OK ('Unidad accesible: ' + $drive + ' -> ' + $storageWin)
} else {
    Write-Check WARN ('Unidad no disponible: ' + $drive + ' (scripts en D: fallaran hasta montar la unidad)')
}

# --- Espacio en disco (raiz del repo) ---
Write-Host ''
Write-Host '-- Espacio en disco --' -ForegroundColor Cyan
try {
    $driveInfo = (Get-Item -LiteralPath $RepoRoot).PSDrive.Name
    $psd = Get-PSDrive -Name $driveInfo -ErrorAction Stop
    if ($psd.Free -gt 5GB) {
        Write-Check OK ('Libre en ' + $driveInfo + ': ~' + [math]::Round($psd.Free / 1GB, 1) + ' GB')
    } else {
        Write-Check WARN ('Poco espacio en ' + $driveInfo + ': ~' + [math]::Round($psd.Free / 1GB, 1) + ' GB (recomendado > 5 GB para imagenes)')
    }
} catch {
    Write-Check WARN 'No se pudo comprobar espacio libre en disco'
}

# --- Puertos usados por el stack ---
Write-Host ''
Write-Host '-- Puertos locales (deben estar libres o ya usados por MediSENA) --' -ForegroundColor Cyan
$ports = @(
    @{ N = 'BACKEND'; P = [int]$env:BACKEND_PORT }
    @{ N = 'Postgres host'; P = [int]$env:POSTGRES_HOST_PORT }
    @{ N = 'Frontend'; P = [int]$env:FRONTEND_PORT }
    @{ N = 'Redis'; P = [int]$env:REDIS_HOST_PORT }
)
$netCmd = Get-Command Get-NetTCPConnection -ErrorAction SilentlyContinue
if (-not $netCmd) {
    Write-Check WARN 'Comprobacion de puertos omitida (Get-NetTCPConnection no disponible)'
} else {
    foreach ($x in $ports) {
        $conn = Get-NetTCPConnection -LocalPort $x.P -State Listen -ErrorAction SilentlyContinue
        if ($conn) {
            Write-Check WARN ('Puerto ' + $x.P + ' (' + $x.N + ') en uso por otro proceso')
        } else {
            Write-Check OK ('Puerto ' + $x.P + ' (' + $x.N + ') libre')
        }
    }
}

# --- Opcionales ---
Write-Host ''
Write-Host '-- Opcionales (otras herramientas / versiones) --' -ForegroundColor Cyan
if (Get-Command git -ErrorAction SilentlyContinue) {
    Write-Check OK ((git --version 2>$null).ToString().Trim())
} else {
    Write-Check WARN 'git no en PATH (recomendado para desarrollo)'
}

$wg = Get-Command winget -ErrorAction SilentlyContinue
if ($wg) {
    $wgVer = (winget --version 2>$null).ToString().Trim()
    if ($wgVer) {
        Write-Check OK ('winget ' + $wgVer)
    } else {
        Write-Check OK 'winget disponible'
    }
} else {
    Write-Host '[..] winget no en PATH (opcional; facilitate instalar Podman en Windows)' -ForegroundColor Gray
}

$dk = Get-Command docker -ErrorAction SilentlyContinue
if ($dk) {
    Write-Check OK ((docker --version 2>$null).ToString().Trim() + ' (alternativa documentada: Podman)')
} else {
    Write-Host '[..] Docker no en PATH (opcional; arranque recomendado con Podman)' -ForegroundColor Gray
}

Write-Host ''
Write-Host '========================================================' -ForegroundColor Cyan
if ($script:Fail -eq 0 -and ($script:Warn -eq 0 -or -not $Strict)) {
    Write-Host ' Resumen: sin fallos bloqueantes.' -ForegroundColor Green
    if ($script:Warn -gt 0) {
        Write-Host (' Advertencias: ' + $script:Warn + ' (use -Strict para fallar si las quiere corregir)') -ForegroundColor Yellow
    }
    Write-Host ' Siguiente paso: .\start-medisena.ps1' -ForegroundColor Cyan
    exit 0
}
if ($script:Fail -eq 0 -and $Strict -and $script:Warn -gt 0) {
    Write-Host (' Resumen: ' + $script:Warn + ' advertencia(s); -Strict activo -> exit 1') -ForegroundColor Yellow
    exit 1
}
Write-Host (' Resumen: ' + $script:Fail + ' fallo(s), ' + $script:Warn + ' advertencia(s)') -ForegroundColor Red
Write-Host ' Corrija los [X] y vuelva a ejecutar este script.' -ForegroundColor Red
exit 1
