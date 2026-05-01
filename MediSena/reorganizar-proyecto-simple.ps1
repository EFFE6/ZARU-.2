# Script de Reorganización Simple del Proyecto MediSENA
# Proyecto MediSENA - SENA
# Fecha: 2025-01-27

Write-Host "=== REORGANIZACIÓN COMPLETA DEL PROYECTO MEDISENA ===" -ForegroundColor Green
Write-Host "Moviendo archivos antiguos a legacy-sma y organizando estructura moderna..." -ForegroundColor Yellow

# Crear estructura de directorios
Write-Host "`n1. Creando estructura de directorios..." -ForegroundColor Cyan

# Directorios principales
$directorios = @(
    "legacy-sma",
    "medisena",
    "medisena/backend",
    "medisena/frontend", 
    "medisena/infrastructure",
    "medisena/docs",
    "medisena/scripts",
    "medisena/migration",
    "medisena/tests"
)

foreach ($dir in $directorios) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "  ✓ Creado: $dir" -ForegroundColor Green
    } else {
        Write-Host "  - Ya existe: $dir" -ForegroundColor Yellow
    }
}

Write-Host "`n2. Moviendo archivos antiguos a legacy-sma..." -ForegroundColor Cyan

# Archivos y carpetas antiguos a mover
$archivosAntiguos = @(
    "conf",
    "config", 
    "lib",
    "lib-modern",
    "logs",
    "portal",
    "scripts",
    "sql-init",
    "sql-init-postgres",
    "tests",
    "docs",
    "node_modules",
    "package-lock.json",
    "package.json"
)

foreach ($archivo in $archivosAntiguos) {
    if (Test-Path $archivo) {
        $destino = "legacy-sma/$archivo"
        if ($archivo -like "*.*") {
            # Es un archivo
            Copy-Item $archivo $destino -Force
            Write-Host "  ✓ Movido archivo: $archivo" -ForegroundColor Green
        } else {
            # Es un directorio
            if (!(Test-Path $destino)) {
                Copy-Item $archivo $destino -Recurse -Force
                Write-Host "  ✓ Movido directorio: $archivo" -ForegroundColor Green
            }
        }
    }
}

Write-Host "`n3. Moviendo archivos de documentación antigua..." -ForegroundColor Cyan

# Archivos de documentación antigua
$docsAntiguos = @(
    "*.md",
    "*.txt",
    "*.ps1",
    "*.bat",
    "*.sql",
    "*.yml",
    "*.yaml",
    "Dockerfile*"
)

foreach ($patron in $docsAntiguos) {
    $archivos = Get-ChildItem -Path . -Name $patron -File
    foreach ($archivo in $archivos) {
        if ($archivo -notlike "README.md" -and $archivo -notlike "reorganizar-proyecto-simple.ps1") {
            $destino = "legacy-sma/docs/$archivo"
            Copy-Item $archivo $destino -Force
            Write-Host "  ✓ Movido doc: $archivo" -ForegroundColor Green
        }
    }
}

Write-Host "`n4. Organizando estructura moderna MediSENA..." -ForegroundColor Cyan

# Mover backend Spring Boot
if (Test-Path "sma-spring-backend") {
    Copy-Item "sma-spring-backend" "medisena/backend/spring-boot" -Recurse -Force
    Write-Host "  ✓ Movido backend Spring Boot" -ForegroundColor Green
}

# Mover frontend React
if (Test-Path "sma-modern/frontend") {
    Copy-Item "sma-modern/frontend" "medisena/frontend/react" -Recurse -Force
    Write-Host "  ✓ Movido frontend React" -ForegroundColor Green
}

# Mover infraestructura
if (Test-Path "medisena-modern/infrastructure") {
    Copy-Item "medisena-modern/infrastructure" "medisena/infrastructure" -Recurse -Force
    Write-Host "  ✓ Movido infraestructura" -ForegroundColor Green
}

# Mover migración
if (Test-Path "medisena-modern/migration") {
    Copy-Item "medisena-modern/migration" "medisena/migration" -Recurse -Force
    Write-Host "  ✓ Movido migración" -ForegroundColor Green
}

Write-Host "`n5. Creando archivos de configuración principales..." -ForegroundColor Cyan

# README principal
$readmeContent = @"
# Sistema de Medicina Asistencial MediSENA

## Descripción
Sistema moderno de medicina asistencial desarrollado con Spring Boot y React.

## Estructura del Proyecto

```
medisena/
├── backend/                 # Backend Spring Boot
│   └── spring-boot/
├── frontend/                 # Frontend React
│   └── react/
├── infrastructure/           # Configuración de infraestructura
├── migration/               # Scripts de migración
├── docs/                    # Documentación
├── scripts/                 # Scripts de automatización
└── tests/                   # Pruebas

legacy-sma/                  # Sistema anterior (legacy)
└── [archivos del sistema anterior]
```

## Inicio Rápido

1. Backend: cd medisena/backend/spring-boot && mvn spring-boot:run
2. Frontend: cd medisena/frontend/react && npm start
3. Docker: docker-compose up -d

## Tecnologías

- Backend: Spring Boot 2.7.18, Java 11, Oracle Database
- Frontend: React 18, TypeScript, Material-UI
- Infraestructura: Docker, Docker Compose, Nginx
- Base de Datos: Oracle Database

## Documentación

Ver carpeta docs/ para documentación detallada.

## Sistema Legacy

El sistema anterior está disponible en la carpeta legacy-sma/ para referencia.
"@

Set-Content "README.md" $readmeContent
Write-Host "  ✓ Creado README.md principal" -ForegroundColor Green

Write-Host "`n=== REORGANIZACIÓN COMPLETADA ===" -ForegroundColor Green
Write-Host "`nEstructura final:" -ForegroundColor Cyan
Write-Host "├── medisena/           # Sistema moderno MediSENA" -ForegroundColor White
Write-Host "├── legacy-sma/         # Sistema anterior" -ForegroundColor White
Write-Host "└── README.md           # Documentación principal" -ForegroundColor White

Write-Host "`nPara ver la documentación: Get-Content README.md" -ForegroundColor Yellow
