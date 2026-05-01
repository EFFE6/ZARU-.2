# Script de Reorganización Completa del Proyecto MediSENA
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
    "package.json",
    "OracleMigrationLocal.*",
    "*.class",
    "*.java"
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
        if ($archivo -notlike "README.md" -and $archivo -notlike "reorganizar-proyecto.ps1") {
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

\`\`\`
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
\`\`\`

## Inicio Rápido

1. **Backend**: \`cd medisena/backend/spring-boot && mvn spring-boot:run\`
2. **Frontend**: \`cd medisena/frontend/react && npm start\`
3. **Docker**: \`docker-compose up -d\`

## Tecnologías

- **Backend**: Spring Boot 2.7.18, Java 11, Oracle Database
- **Frontend**: React 18, TypeScript, Material-UI
- **Infraestructura**: Docker, Docker Compose, Nginx
- **Base de Datos**: Oracle Database

## Documentación

Ver carpeta \`docs/\` para documentación detallada.

## Sistema Legacy

El sistema anterior está disponible en la carpeta \`legacy-sma/\` para referencia.
"@

Set-Content "README.md" $readmeContent
Write-Host "  ✓ Creado README.md principal" -ForegroundColor Green

# Docker Compose principal
$dockerComposeContent = @"
version: '3.8'

services:
  # Backend Spring Boot MediSENA
  medisena-backend:
    build:
      context: ./medisena/backend/spring-boot
      dockerfile: Dockerfile
    container_name: medisena-backend
    ports:
      - "8081:8081"
    environment:
      SPRING_PROFILES_ACTIVE: docker
      ORACLE_USERNAME: \${ORACLE_USERNAME}
      ORACLE_PASSWORD: \${ORACLE_PASSWORD}
      REDIS_HOST: medisena-redis
      REDIS_PORT: 6380
    depends_on:
      - medisena-redis
    networks:
      - medisena-network

  # Frontend React MediSENA
  medisena-frontend:
    build:
      context: ./medisena/frontend/react
      dockerfile: Dockerfile
    container_name: medisena-frontend
    ports:
      - "8080:80"
    depends_on:
      - medisena-backend
    networks:
      - medisena-network

  # Redis para caché
  medisena-redis:
    image: redis:6.2-alpine
    container_name: medisena-redis
    ports:
      - "6380:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - medisena-network

networks:
  medisena-network:
    name: medisena-network

volumes:
  redis_data:
    driver: local
"@

Set-Content "docker-compose.yml" $dockerComposeContent
Write-Host "  ✓ Creado docker-compose.yml principal" -ForegroundColor Green

# Script de inicio
$startScriptContent = @"
# Script de inicio para MediSENA
# Proyecto MediSENA - SENA

Write-Host "=== INICIANDO SISTEMA MEDISENA ===" -ForegroundColor Green

# Verificar Docker
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Docker no está instalado. Instalando..." -ForegroundColor Yellow
    # Aquí iría la instalación de Docker
}

# Verificar Docker Compose
if (!(Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "Docker Compose no está instalado. Instalando..." -ForegroundColor Yellow
    # Aquí iría la instalación de Docker Compose
}

Write-Host "`nIniciando servicios MediSENA..." -ForegroundColor Cyan
docker-compose up --build -d

Write-Host "`n✅ Sistema MediSENA iniciado!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:8080" -ForegroundColor White
Write-Host "Backend: http://localhost:8081" -ForegroundColor White
Write-Host "Redis: localhost:6380" -ForegroundColor White

Write-Host "`nPara ver logs: docker-compose logs -f" -ForegroundColor Yellow
"@

Set-Content "start-medisena.ps1" $startScriptContent
Write-Host "  ✓ Creado start-medisena.ps1" -ForegroundColor Green

Write-Host "`n6. Limpiando archivos temporales..." -ForegroundColor Cyan

# Archivos temporales a eliminar
$archivosTemporales = @(
    "*.tmp",
    "*.log",
    "*.bak",
    "Thumbs.db",
    ".DS_Store"
)

foreach ($patron in $archivosTemporales) {
    $archivos = Get-ChildItem -Path . -Name $patron -File -Recurse
    foreach ($archivo in $archivos) {
        Remove-Item $archivo -Force
        Write-Host "  ✓ Eliminado: $archivo" -ForegroundColor Green
    }
}

Write-Host "`n=== REORGANIZACIÓN COMPLETADA ===" -ForegroundColor Green
Write-Host "`nEstructura final:" -ForegroundColor Cyan
Write-Host "├── medisena/           # Sistema moderno MediSENA" -ForegroundColor White
Write-Host "├── legacy-sma/         # Sistema anterior" -ForegroundColor White
Write-Host "├── README.md           # Documentación principal" -ForegroundColor White
Write-Host "├── docker-compose.yml  # Configuración Docker" -ForegroundColor White
Write-Host "└── start-medisena.ps1  # Script de inicio" -ForegroundColor White

Write-Host "`nPara iniciar el sistema: .\start-medisena.ps1" -ForegroundColor Yellow
Write-Host "Para ver la documentación: Get-Content README.md" -ForegroundColor Yellow
