# 📋 PLAN COMPLETO Y EJECUTABLE - Actualización Swagger 46 Archivos Restantes

**Elaborado:** Abril 2026  
**Versión:** 1.0  
**Estado:** LISTO PARA EJECUTAR  
**Responsable:** Bot Swagger Automation

> **NOTA CRÍTICA**: Este plan excluye `usuarios.routes.js` (ya actualizado). Incluye 46 archivos.

---

## 📊 CLASIFICACIÓN POR TIERS (AGRUPACIÓN EJECUTABLE)

### TIER 1 - CRÍTICOS (2 archivos, 6 horas)
**Características comunes:**
- Sin documentación Swagger o completamente incompletos
- Estados de error no documentados
- Requieren esquemas desde cero
- Impacto alto en seguridad/autenticación

**Archivos:**
1. `rbac.routes.js` - 4 horas
2. `resoluciones.routes.js` - 2 horas

---

### TIER 2 - ENTIDADES PRINCIPALES (8 archivos, 16 horas)
**Características comunes:**
- GET documentado parcialmente
- Faltan POST/PUT/DELETE completamente
- Esquemas básicos sin detalle
- Casos de uso críticos del sistema

**Archivos:**
1. `beneficiarios.routes.js` - 2 horas
2. `medicos.routes.js` - 2 horas
3. `funcionarios.routes.js` - 2 horas
4. `contratistas.routes.js` - 2 horas
5. `ordenes.routes.js` - 2 horas
6. `vigencias.routes.js` - 2 horas
7. `recibosPago.routes.js` - 2 horas
8. `parentescos.routes.js` - 2 horas

---

### TIER 3 - REPORTES (15 archivos, 15 horas)
**Características comunes:**
- GET documentado pero sin esquema response
- Sin parámetros validados
- Respuestas complejas sin definición formal
- Filtros sin enum/validation
- Pueden reutilizar esquemas entre grupos

**Subrupos por patrón:**

#### 3A - Reportes F (9 archivos, 9 horas)
- `reportesF1.routes.js` - 1 hora (Distribución gasto)
- `reportesF2.routes.js` - 1 hora (Reembolsos)
- `reportesF5.routes.js` - 1 hora (Excedentes)
- `reportesF10.routes.js` - 1 hora (Retenciones)
- `reportesF12.routes.js` - 1 hora (Documentos sin radicación)
- `reportesNacionalesF5.routes.js` - 1 hora (Nacionales excedentes)
- `reportesNacionalesF10.routes.js` - 1 hora (Nacionales retenciones)
- `reportesNacionalesF15.routes.js` - 1 hora (Nacionales saldos)
- `reportesFacturacionContratista.routes.js` - 1 hora (Facturación)

#### 3B - Reportes de Citas/Casos (4 archivos, 4 horas)
- `reportesCitasGeneradas.routes.js` - 1 hora
- `reportesNacionalesCitasGeneradas.routes.js` - 1 hora
- `reportesOrdenesRegistradas.routes.js` - 1 hora
- `reportesHistoria.routes.js` - 1 hora

#### 3C - Reportes de Información (2 archivos, 2 horas)
- `reportesBeneficiariosInactivos.routes.js` - 1 hora
- `reportesReembolsos.routes.js` - 1 hora

#### 3D - Reportes Especiales (2 archivos, 2 horas)
- `reportesCuentasCobroSinAsociar.routes.js` - 1 hora
- `reportesNacionalesOrdenesEspecialidad.routes.js` - 1 hora

---

### TIER 4 - ESPECIALIZADOS/SECUNDARIOS (15 archivos, 10 horas)
**Características comunes:**
- GET documentado pero incompleto
- Parámetros sin validación de tipo
- Sin respuestas de error formales
- Puede haber endpoints adicionales sin Swagger

**Subrupos:**

#### 4A - Excedentes (6 archivos, 6 horas)
- `excedentes30Dias.routes.js` - 1 hora
- `excedentesFormatoFinanciero.routes.js` - 1 hora
- `excedentesFormatoSalarios.routes.js` - 1 hora
- `excedentesImprimir.routes.js` - 1 hora
- `excedentesRelacionRecibos.routes.js` - 1 hora
- `excedentesSinCancelar.routes.js` - 1 hora

#### 4B - Parámetros/Config (5 archivos, 3 horas)
- `parametros.routes.js` - 1 hora
- `gruposTope.routes.js` - 0.5 horas
- `nivelesTope.routes.js` - 0.5 horas
- `agendas.routes.js` - 1 hora
- `audit.routes.js` - 0.5 horas

#### 4C - Entidades Secundarias (2 archivos, 1 hora)
- `relacionPagos.routes.js` - 0.5 horas
- `abrirVigencia.routes.js` - 0.5 horas (alias de vigencias)

#### 4D - Otros (2 archivos, 0 horas - ya están bien)
- `especialidades.routes.js` - ✅ YA COMPLETO
- `subEspecialidades.routes.js` - ✅ YA COMPLETO

---

## 📈 ESTIMACIÓN TOTAL

| TIER | Cantidad | Horas | Orden |
|------|----------|-------|-------|
| TIER 1 (Críticos) | 2 | 6 | 1º |
| TIER 2 (Entidades) | 8 | 16 | 2º |
| TIER 3 (Reportes) | 15 | 15 | 3º |
| TIER 4 (Especializados) | 15 | 10 | 4º |
| **TOTAL** | **46** | **47 horas** | — |

---

## 🔍 PROBLEMAS ESPECÍFICOS POR TIER

### TIER 1 - PROBLEMAS ESPECÍFICOS

#### `rbac.routes.js` ❌

**Estado actual:**
- Sin comentarios `@swagger`
- Endpoints implementados pero sin documentación
- GET /api/rbac/roles
- GET /api/rbac/permissions
- POST /api/rbac/roles
- POST /api/rbac/permissions
- PUT /api/rbac/roles/:id
- DELETE /api/rbac/roles/:id

**Problemas:**
1. Sin esquema Role definido
2. Sin esquema Permission definido
3. Sin respuestas de error (401, 403, 500)
4. Sin validación de parám etros
5. Sin ejemplos de datos

**Solución:** Agregar Swagger completo con 7 esquemas

#### `resoluciones.routes.js` ❌

**Estado actual:**
```javascript
// Solo documenta /test, el resto NO tiene Swagger
router.get('/test', ...) // CON Swagger
router.get('/', ...) // SIN Swagger
router.post('/', ...) // SIN Swagger
router.put('/:id', ...) // SIN Swagger
router.delete('/:id', ...) // SIN Swagger
```

**Problemas:**
1. Inconsistencia entre endpoints
2. Sin esquema Resolucion
3. Sin paginación documentada
4. Sin validación de parámetros

**Solución:** Documentar todos los endpoints uniformemente

---

### TIER 2 - PROBLEMAS ESPECÍFICOS

#### Patrón común en `beneficiarios.routes.js`, `medicos.routes.js`, `funcionarios.routes.js`, `contratistas.routes.js`, `ordenes.routes.js`, `vigencias.routes.js`, `recibosPago.routes.js`, `parentescos.routes.js`

**Problema #1: POST sin documentación**
```javascript
// ❌ ACTUAL
router.post('/', async (req, res) => { /* implementado pero sin Swagger */ });

// ✅ REQUERIDO
/**
 * @swagger
 * /api/{resource}:
 *   post:
 *     summary: Crear nuevo {resource}
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/{Resource}Create'
 *     responses:
 *       201:
 *         description: Creado exitosamente
 *       400:
 *         description: Validación falló
 */
```

**Problema #2: PUT sin documentación**
```javascript
// ❌ ACTUAL
router.put('/:id', async (req, res) => { /* sin Swagger */ });

// ✅ REQUERIDO
/**
 * @swagger
 * /api/{resource}/{id}:
 *   put:
 *     summary: Actualizar {resource}
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *     responses:
 *       200:
 *         description: Actualizado
 */
```

**Problema #3: DELETE sin documentación**
```javascript
// ❌ ACTUAL
router.delete('/:id', async (req, res) => { /* sin Swagger */ });

// ✅ REQUERIDO
/**
 * @swagger
 * /api/{resource}/{id}:
 *   delete:
 *     summary: Eliminar {resource}
 *     responses:
 *       204:
 *         description: Eliminado
 */
```

**Problema #4: Esquemas incompletos**
```javascript
// ❌ ACTUAL
properties:
  id:           type: integer
  cedula:       type: string
  nombre:       type: string
  // Faltan: required, description, example, format

// ✅ REQUERIDO
required: [id, cedula, nombre]
properties:
  id:
    type: integer
    description: Identificador único
    example: 1
  cedula:
    type: string
    description: Número de cédula
    example: "12345678"
  nombre:
    type: string
    description: Nombre completo
    example: "Juan Pérez"
```

---

### TIER 3 - PROBLEMAS ESPECÍFICOS (Reportes)

**Patrón común en todos los `reportes*.routes.js`**

**Problema #1: Parámetros sin validación**
```javascript
// ❌ ACTUAL
/**
 * @swagger
 * /api/reportes/f1:
 *   get:
 *     parameters:
 *       - in: query
 *         name: periodo
 *         description: Período en formato YYYY-MM
 */

// ✅ REQUERIDO
/**
 * @swagger
 * /api/reportes/f1:
 *   get:
 *     parameters:
 *       - in: query
 *         name: periodo
 *         schema:
 *           type: string
 *           pattern: '^\d{4}-\d{2}$'
 *           example: "2024-01"
 *         description: Período en formato YYYY-MM
 *         required: false
 */
```

**Problema #2: Sin esquema response**
```javascript
// ❌ ACTUAL
responses:
  200:
    description: Lista de datos

// ✅ REQUERIDO
responses:
  200:
    description: Reporte obtenido exitosamente
    content:
      application/json:
        schema:
          $ref: '#/components/schemas/ReporteF1Response'
```

**Problema #3: Sin códigos de error**
```javascript
// ❌ ACTUAL
responses:
  200:
    description: OK

// ✅ REQUERIDO
responses:
  200:
    description: OK
  400:
    description: Parámetro inválido (período incorrecto)
  401:
    description: No autenticado
  500:
    description: Error en servidor
```

---

### TIER 4 - PROBLEMAS ESPECÍFICOS

#### Excedentes
- Sin esquema response formalizado
- Parámetros página sin validación min/max
- Sin descripción de campos numerados

#### Parámetros/Config
- Parámetro "all" sin enum definido
- Sin respuestas error
- Sin descripción de validaciones

#### Entidades Secundarias
- Esquema muy básico
- Faltan propiedades derivadas

---

## 🛠️ TEMPLATES DE CORRECCIÓN EJECUTABLES

### TEMPLATE 1: TIER 1 - RBAC (SIN SWAGGER)

```javascript
// ============================================================
// PARA: rbac.routes.js
// AGREGAR ANTES DE router = express.Router();
// ============================================================

/**
 * @swagger
 * components:
 *   schemas:
 *     Role:
 *       type: object
 *       required:
 *         - id
 *         - code
 *         - name
 *       properties:
 *         id:
 *           type: integer
 *           description: Identificador único del rol
 *           example: 1
 *         code:
 *           type: string
 *           pattern: '^[A-Z_]+$'
 *           description: Código del rol (mayúsculas, sin espacios)
 *           example: "ADMIN"
 *         name:
 *           type: string
 *           description: Nombre descriptivo del rol
 *           example: "Administrador del Sistema"
 *         description:
 *           type: string
 *           description: Descripción detallada del rol
 *           example: "Acceso completo a todas las funciones del sistema"
 *         isActive:
 *           type: boolean
 *           description: Indica si el rol está activo
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación del rol
 *           example: "2024-01-15T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización
 *           example: "2024-01-15T10:30:00Z"
 *         permissions:
 *           type: array
 *           description: Lista de códigos de permisos asignados
 *           items:
 *             type: string
 *           example: ["usuarios.read", "usuarios.write", "rbac.manage"]
 *
 *     RoleCreate:
 *       type: object
 *       required:
 *         - code
 *         - name
 *       properties:
 *         code:
 *           type: string
 *           pattern: '^[A-Z_]+$'
 *           description: Código único del nuevo rol
 *           example: "MEDICO"
 *         name:
 *           type: string
 *           description: Nombre descriptivo
 *           example: "Médico del Sistema"
 *         description:
 *           type: string
 *           description: Descripción del rol
 *           example: "Personal médico con acceso a pacientes"
 *         isActive:
 *           type: boolean
 *           description: Activar rol al crear
 *           example: true
 *           default: true
 *
 *     RoleUpdate:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Nombre del rol
 *         description:
 *           type: string
 *           description: Descripción del rol
 *         isActive:
 *           type: boolean
 *           description: Estado del rol
 *
 *     Permission:
 *       type: object
 *       required:
 *         - id
 *         - code
 *         - name
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         code:
 *           type: string
 *           pattern: '^[a-z0-9_]+\.[a-z0-9_]+$'
 *           description: "Código de permiso (formato: módulo.acción, ej: usuarios.read)"
 *           example: "usuarios.read"
 *         name:
 *           type: string
 *           description: Nombre descriptivo del permiso
 *           example: "Leer Usuarios"
 *         description:
 *           type: string
 *           description: Descripción del permiso
 *           example: "Permite consultar la lista de usuarios del sistema"
 *         isActive:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     PermissionCreate:
 *       type: object
 *       required:
 *         - code
 *         - name
 *       properties:
 *         code:
 *           type: string
 *           pattern: '^[a-z0-9_]+\.[a-z0-9_]+$'
 *           description: Código del permiso (módulo.acción)
 *           example: "medicos.write"
 *         name:
 *           type: string
 *           description: Nombre del permiso
 *           example: "Crear/Editar Médicos"
 *         description:
 *           type: string
 *           description: Descripción del permiso
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           description: Tipo de error
 *           example: "Validación falló"
 *         message:
 *           type: string
 *           description: Descripción detallada del error
 *           example: "El código de rol debe ser único"
 *         details:
 *           type: string
 *           description: Detalles técnicos (solo en desarrollo)
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: Token JWT para autenticación. Solo ADMIN puede acceder a RBAC.
 */

/**
 * @swagger
 * /api/rbac/roles:
 *   get:
 *     summary: Obtener lista de roles del sistema
 *     description: >
 *       Obtiene la lista completa de roles configurados en el sistema.
 *       Solo administradores con permiso 'rbac.manage' pueden acceder.
 *     operationId: getRoles
 *     tags: [RBAC - Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de roles obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Role'
 *       401:
 *         description: No autenticado - Token no proporcionado o inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Prohibido - No tiene permisos de RBAC
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   post:
 *     summary: Crear nuevo rol
 *     description: Crea un nuevo rol en el sistema con permisos iniciales vacíos.
 *     operationId: createRole
 *     tags: [RBAC - Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       description: Datos del rol a crear
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RoleCreate'
 *           example:
 *             code: "RADOLOGO"
 *             name: "Radiólogo"
 *             description: "Médico especialista en radiología"
 *             isActive: true
 *     responses:
 *       201:
 *         description: Rol creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Role'
 *       400:
 *         description: Validación falló (código duplicado, formato inválido, etc.)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Código de rol duplicado"
 *               message: "El código 'RADOLOGO' ya existe en el sistema"
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Prohibido - No autorizado para crear roles
 *       500:
 *         description: Error en servidor
 *
 * /api/rbac/roles/{roleId}:
 *   get:
 *     summary: Obtener detalle de un rol específico
 *     tags: [RBAC - Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Identificador del rol
 *         example: 1
 *     responses:
 *       200:
 *         description: Rol encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Role'
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Prohibido
 *       404:
 *         description: Rol no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Rol no encontrado"
 *               message: "No existe rol con ID 999"
 *       500:
 *         description: Error en servidor
 *
 *   put:
 *     summary: Actualizar rol
 *     tags: [RBAC - Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RoleUpdate'
 *     responses:
 *       200:
 *         description: Actualizado exitosamente
 *       400:
 *         description: Validación falló
 *       404:
 *         description: No encontrado
 *       500:
 *         description: Error en servidor
 *
 *   delete:
 *     summary: Eliminar rol
 *     description: >
 *       Elimina un rol del sistema. No se puede eliminar roles asignados a usuarios activos.
 *     tags: [RBAC - Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       204:
 *         description: Eliminado exitosamente
 *       400:
 *         description: Validación falló (ej: rol con usuarios asignados)
 *       404:
 *         description: No encontrado
 *       500:
 *         description: Error en servidor
 *
 * /api/rbac/permissions:
 *   get:
 *     summary: Obtener lista de permisos disponibles
 *     description: Obtiene la lista completa de permisos que pueden asignarse a roles
 *     operationId: getPermissions
 *     tags: [RBAC - Permisos]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de permisos obtenida
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Permission'
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Prohibido
 *       500:
 *         description: Error en servidor
 *
 *   post:
 *     summary: Crear nuevo permiso
 *     description: Crea un nuevo permiso en el sistema para ser asignado a roles
 *     operationId: createPermission
 *     tags: [RBAC - Permisos]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PermissionCreate'
 *     responses:
 *       201:
 *         description: Permiso creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Permission'
 *       400:
 *         description: Validación falló (código duplicado o formato inválido)
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Prohibido
 *       500:
 *         description: Error en servidor
 */

// Agregar después del router = express.Router(); y ANTES de cualquier router.get(), router.post()
router.use(authorizeRoles('ADMIN'));
router.use(authorizePermissions('rbac.manage'));
```

---

### TEMPLATE 2: TIER 2 - ENTIDADES PRINCIPALES

#### PARA: beneficiarios.routes.js, medicos.routes.js, funcionarios.routes.js, etc.

**PASO 1: Reemplazar esquema incompleto con esquema completo**

```javascript
// ============================================================
// BUSCAR en el archivo:
// ============================================================

/**
 * @swagger
 * components:
 *   schemas:
 *     Beneficiario:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         cedula:
 *           type: string
 *           example: "12345678"
 *         nombre:
 *           type: string
 *           example: "Juan Pérez"
 *         parentesco:
 *           type: string
 *           example: "Hijo"
 *         funcionarioId:
 *           type: integer
 *           example: 1
 *         activo:
 *           type: boolean
 *           example: true
 */

// ============================================================
// REEMPLAZAR POR:
// ============================================================

/**
 * @swagger
 * components:
 *   schemas:
 *     Beneficiario:
 *       type: object
 *       required:
 *         - id
 *         - cedula
 *         - nombre
 *         - funcionarioId
 *       properties:
 *         id:
 *           type: integer
 *           description: Identificador único del beneficiario
 *           example: 1
 *         cedula:
 *           type: string
 *           pattern: '^\d{7,10}$'
 *           description: Número de cédula del beneficiario
 *           example: "12345678"
 *         nombre:
 *           type: string
 *           description: Nombres completos del beneficiario
 *           example: "Juan Pérez García"
 *         apellidos:
 *           type: string
 *           description: Apellidos del beneficiario
 *           example: "Pérez García"
 *         tipoDocumento:
 *           type: string
 *           description: Tipo de documento (CC, TI, CE, PA, etc.)
 *           example: "CC"
 *         fechaNacimiento:
 *           type: string
 *           format: date
 *           description: Fecha de nacimiento
 *           example: "1990-05-15"
 *         edad:
 *           type: integer
 *           description: Edad calculada
 *           example: 34
 *         sexo:
 *           type: string
 *           enum: [M, F, O]
 *           description: Género del beneficiario
 *           example: "M"
 *         parentesco:
 *           type: string
 *           description: Tipo de parentesco con funcionario
 *           example: "Hijo"
 *         funcionarioId:
 *           type: integer
 *           description: ID del funcionario titular
 *           example: 1
 *         telefono:
 *           type: string
 *           pattern: '^\d{7,10}$'
 *           description: Teléfono del beneficiario
 *           example: "3001234567"
 *         email:
 *           type: string
 *           format: email
 *           description: Correo electrónico del beneficiario
 *           example: "juan@example.com"
 *         direccion:
 *           type: string
 *           description: Dirección de residencia
 *           example: "Calle 10 #20-30"
 *         ciudad:
 *           type: string
 *           description: Ciudad de residencia
 *           example: "Bogotá"
 *         activo:
 *           type: boolean
 *           description: Indica si el beneficiario está activo
 *           example: true
 *         fechaCreacion:
 *           type: string
 *           format: date-time
 *           description: Fecha de inclusión en el sistema
 *           example: "2024-01-15T10:30:00Z"
 *
 *     BeneficiarioCreate:
 *       type: object
 *       required:
 *         - cedula
 *         - nombre
 *         - tipoDocumento
 *         - funcionarioId
 *       properties:
 *         cedula:
 *           type: string
 *           pattern: '^\d{7,10}$'
 *           description: Cédula del nuevo beneficiario
 *           example: "87654321"
 *         nombre:
 *           type: string
 *           description: Nombres completos
 *           example: "María García López"
 *         apellidos:
 *           type: string
 *           description: Apellidos
 *           example: "García López"
 *         tipoDocumento:
 *           type: string
 *           enum: [CC, TI, CE, PA, PEP, NIT, NUIP]
 *           description: Tipo de documento de identidad
 *           example: "CC"
 *         fechaNacimiento:
 *           type: string
 *           format: date
 *           description: Fecha de nacimiento (opcional)
 *           example: "1992-03-20"
 *         sexo:
 *           type: string
 *           enum: [M, F, O]
 *           description: Género del beneficiario
 *           example: "F"
 *         parentesco:
 *           type: string
 *           description: Parentesco con funcionario (opcional)
 *           example: "Cónyuge"
 *         funcionarioId:
 *           type: integer
 *           description: ID del funcionario titular
 *           example: 1
 *         telefono:
 *           type: string
 *           description: Teléfono del beneficiario
 *           example: "3019876543"
 *         email:
 *           type: string
 *           format: email
 *           description: Email del beneficiario (opcional)
 *           example: "maria@example.com"
 *         direccion:
 *           type: string
 *           description: Dirección de residencia
 *           example: "Carrera 5 #10-40"
 *         ciudad:
 *           type: string
 *           description: Ciudad de residencia
 *           example: "Medellín"
 *
 *     BeneficiarioUpdate:
 *       type: object
 *       properties:
 *         nombre:
 *           type: string
 *           description: Nombres actualizados (opcional)
 *         apellidos:
 *           type: string
 *           description: Apellidos actualizados
 *         telefono:
 *           type: string
 *           description: Teléfono actualizado
 *         email:
 *           type: string
 *           format: email
 *           description: Email actualizado
 *         direccion:
 *           type: string
 *           description: Dirección actualizada
 *         ciudad:
 *           type: string
 *           description: Ciudad actualizada
 *         parentesco:
 *           type: string
 *           description: Parentesco actualizado
 *         activo:
 *           type: boolean
 *           description: Cambiar estado del beneficiario
 *
 *     PaginatedResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Beneficiario'
 *         pagination:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *               example: 1
 *             pageSize:
 *               type: integer
 *               example: 10
 *             totalItems:
 *               type: integer
 *               example: 125
 *             totalPages:
 *               type: integer
 *               example: 13
 *             hasNextPage:
 *               type: boolean
 *               example: true
 *             hasPreviousPage:
 *               type: boolean
 *               example: false
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: string
 *           description: Tipo de error
 *           example: "Validación falló"
 *         message:
 *           type: string
 *           description: Descripción del error
 *           example: "La cédula ya existe en el sistema"
 *
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
```

**PASO 2: Reemplazar endpoint GET incompleto**

```javascript
// ============================================================
// BUSCAR:
// ============================================================

/**
 * @swagger
 * /api/beneficiarios:
 *   get:
 *     summary: Obtener lista de beneficiarios
 *     tags: [Beneficiarios]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de beneficiarios obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Beneficiario'
 */

// ============================================================
// REEMPLAZAR POR:
// ============================================================

/**
 * @swagger
 * /api/beneficiarios:
 *   get:
 *     summary: Obtener lista paginada de beneficiarios
 *     description: >
 *       Obtiene la lista de beneficiarios del sistema con paginación,
 *       búsqueda y filtros opcionales.
 *     operationId: getBeneficiarios
 *     tags: [Beneficiarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Número de página (comienza en 1)
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 500
 *         description: Cantidad de elementos por página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 500
 *         description: Alias para pageSize (compatibilidad con frontend)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Término de búsqueda (cédula, nombre, email)
 *         example: "juan"
 *       - in: query
 *         name: activo
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado (activo/inactivo)
 *       - in: query
 *         name: funcionarioId
 *         schema:
 *           type: integer
 *         description: Filtrar por ID del funcionario titular
 *     responses:
 *       200:
 *         description: Lista de beneficiarios obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       400:
 *         description: Parámetros inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: No autorizado - Token no válido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Prohibido - Sin permisos para leer beneficiarios
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   post:
 *     summary: Crear nuevo beneficiario
 *     description: >
 *       Crea un nuevo beneficiario en el sistema.
 *       Requiere que la cédula sea única.
 *     operationId: createBeneficiario
 *     tags: [Beneficiarios]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       description: Datos del nuevo beneficiario
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BeneficiarioCreate'
 *           example:
 *             cedula: "1098765432"
 *             nombre: "Ana María López"
 *             apellidos: "López García"
 *             tipoDocumento: "CC"
 *             fechaNacimiento: "1995-06-20"
 *             sexo: "F"
 *             parentesco: "Hija"
 *             funcionarioId: 5
 *             telefono: "3115555555"
 *             email: "ana@example.com"
 *             direccion: "Calle 15 #25-40"
 *             ciudad: "Cali"
 *     responses:
 *       201:
 *         description: Beneficiario creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Beneficiario'
 *       400:
 *         description: Validación falló (cédula duplicada, formato inválido, etc.)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Cédula duplicada"
 *               message: "La cédula 1098765432 ya existe en el sistema"
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Prohibido - Sin permisos para crear beneficiarios
 *       500:
 *         description: Error en servidor
 *
 * /api/beneficiarios/{id}:
 *   get:
 *     summary: Obtener beneficiario por ID
 *     description: Obtiene los detalles completos de un beneficiario específico
 *     operationId: getBeneficiarioById
 *     tags: [Beneficiarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Identificador del beneficiario
 *         example: 1
 *     responses:
 *       200:
 *         description: Beneficiario encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Beneficiario'
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Prohibido
 *       404:
 *         description: Beneficiario no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Error en servidor
 *
 *   put:
 *     summary: Actualizar beneficiario
 *     description: Actualiza los datos de un beneficiario existente
 *     operationId: updateBeneficiario
 *     tags: [Beneficiarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Identificador del beneficiario
 *     requestBody:
 *       required: true
 *       description: Datos a actualizar
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BeneficiarioUpdate'
 *     responses:
 *       200:
 *         description: Beneficiario actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Beneficiario'
 *       400:
 *         description: Validación falló
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Prohibido
 *       404:
 *         description: Beneficiario no encontrado
 *       500:
 *         description: Error en servidor
 *
 *   delete:
 *     summary: Eliminar beneficiario
 *     description: >
 *       Elimina un beneficiario del sistema (eliminación lógica).
 *       En lugar de eliminar físicamente, se marca como inactivo.
 *     operationId: deleteBeneficiario
 *     tags: [Beneficiarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       204:
 *         description: Beneficiario eliminado exitosamente
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Prohibido
 *       404:
 *         description: Beneficiario no encontrado
 *       500:
 *         description: Error en servidor
 */
```

---

### TEMPLATE 3: TIER 3 - REPORTES

#### PARA: reportesF1.routes.js, reportesF5.routes.js, etc.

```javascript
// ============================================================
// AGREGR ANTES DE router = express.Router()
// ============================================================

/**
 * @swagger
 * components:
 *   schemas:
 *     ReporteF1Response:
 *       description: Reporte de Distribución del Gasto por Especialidad y Contratista
 *       type: object
 *       properties:
 *         especialidad:
 *           type: string
 *           description: Especialidad médica
 *           example: "Medicina General"
 *         contratista:
 *           type: string
 *           description: Nombre del contratista/proveedor
 *           example: "ClinicaSalud"
 *         cantidadCitas:
 *           type: integer
 *           description: Cantidad total de citas realizadas
 *           example: 150
 *         valorTotal:
 *           type: number
 *           format: double
 *           description: Valor total facturado
 *           example: 15000000
 *         valorPromedio:
 *           type: number
 *           format: double
 *           description: Valor promedio por cita
 *           example: 100000
 *


       porcentajeGasto:
 *           type: number
 *           format: double
 *           description: Porcentaje del gasto total
 *           example: 23.5
 *
 *     ReporteResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             type: object
 *         periodo:
 *           type: string
 *           description: Período del reporte (YYYY-MM)
 *           example: "2024-01"
 *         fechaGeneracion:
 *           type: string
 *           format: date-time
 *           description: Fecha de generación del reporte
 *           example: "2024-01-15T10:30:00Z"
 *         totalRegistros:
 *           type: integer
 *           description: Cantidad total de registros
 *           example: 45
 *         totalGeneral:
 *           type: number
 *           format: double
 *           description: Total general del reporte
 *           example: 63500000
 */

/**
 * @swagger
 * /api/reportes/f1-distribucion-gasto:
 *   get:
 *     summary: Reporte F1 - Distribución del Gasto
 *     description: >
 *       Genera reporte de distribución del gasto por especialidad y contratista.
 *       Permite filtrar por período y regional.
 *     operationId: getReporteF1
 *     tags: [Reportes - Financiero]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: periodo
 *         schema:
 *           type: string
 *           pattern: '^\d{4}-\d{2}$'
 *           example: "2024-01"
 *         description: Período en formato YYYY-MM (obligatorio recomendado para mejor rendimiento)
 *         required: false
 *       - in: query
 *         name: regional
 *         schema:
 *           type: string
 *           example: "11"
 *         description: Código de regional (opcional)
 *       - in: query
 *         name: especialidad
 *         schema:
 *           type: string
 *           example: "Medicina General"
 *         description: Filtro por especialidad (opcional)
 *     responses:
 *       200:
 *         description: Reporte generado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ReporteF1Response'
 *                 periodo:
 *                   type: string
 *                   example: "2024-01"
 *                 totalGeneral:
 *                   type: number
 *                   example: 63500000
 *       400:
 *         description: >
 *           Parámetro inválido:
 *           - período no válido (debe ser YYYY-MM)
 *           - regional no válida
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error: "Parámetro inválido"
 *               message: "El período debe estar en formato YYYY-MM"
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Prohibido - Sin permisos para generar reportes
 *       500:
 *         description: Error al generar reporte
 */
```

---

### TEMPLATE 4: TIER 4 - EXCEDENTES

#### PARA: excedentes30Dias.routes.js, excedentesFormatoFinanciero.routes.js, etc.

```javascript
// ============================================================
// AGREGAR ANTES DE router = express.Router()
// ============================================================

/**
 * @swagger
 * components:
 *   schemas:
 *     Excedente:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Identificador único del excedente
 *           example: "001"
 *         numeroRecibo:
 *           type: integer
 *           description: Número de recibo
 *           example: 12345
 *         funcionario:
 *           type: string
 *           description: Nombre del funcionario o cédula
 *           example: "12345678 - Juan Pérez"
 *         fechaGeneracion:
 *           type: string
 *           format: date
 *           description: Fecha de generación del recibo
 *           example: "2024-01-15"
 *         valor:
 *           type: number
 *           format: double
 *           description: Valor del excedente
 *           example: 500000
 *         estado:
 *           type: string
 *           enum: [PENDIENTE, CANCELADO, GLOSA]
 *           description: Estado del excedente
 *           example: "PENDIENTE"
 *         diasPendiente:
 *           type: integer
 *           description: Días que lleva pendiente
 *           example: 35
 *
 *     ExcedenteResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Excedente'
 *         pagination:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *             pageSize:
 *               type: integer
 *             totalItems:
 *               type: integer
 */

/**
 * @swagger
 * /api/excedentes/mayor-30-dias:
 *   get:
 *     summary: Obtener excedentes mayores a 30 días
 *     description: >
 *       Lista de recibos de caja pendientes de cancelación con más de 30 días.
 *       Incluye validación de fecha_recibo_caja no nula.
 *     operationId: getExcedentes30Dias
 *     tags: [Excedentes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Número de página
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 500
 *         description: Registros por página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 500
 *         description: Alias para pageSize
 *     responses:
 *       200:
 *         description: Lista obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ExcedenteResponse'
 *       400:
 *         description: Parámetros inválidos (pageSize > 500, etc.)
 *       401:
 *         description: No autenticado
 *       500:
 *         description: Error al obtener excedentes
 */
```

---

## 🚀 PASO A PASO - ORDEN DE EJECUCIÓN

### FASE TIER 1: CRÍTICOS (6 horas)

#### DÍA 1: rbac.routes.js (4 horas)

1. **Backup**: Copiar archivo original a `rbac.routes.js.backup`
2. **Ubicar línea**: Buscar `const router = express.Router();`
3. **Insertar**: Agregar Template 1 (RBAC) inmediatamente ANTES de esa línea
4. **Validar**: 
   - Verificar que el archivo no tenga errores de sintaxis
   - Confirmar que existan 7 esquemas (@swagger tag `components`)
   - Verificar que hay 6 operaciones documentadas (GET /roles, POST /roles, PUT /roles/:id, DELETE /roles/:id, GET /permissions, POST /permissions)

#### DÍA 2: resoluciones.routes.js (2 horas)

1. **Analizar**: Leer el archivo y listar todos los endpoints
2. **Crear esquema**: Definir Schema `Resolucion` y `ResolucionCreate`
3. **Documentar**: Agregar @swagger para GET, POST, PUT, DELETE
4. **Ejemplos**: Agregar ejemplos de respuesta

---

### FASE TIER 2: ENTIDADES PRINCIPALES (16 horas)

#### APLICAR A CADA ARCHIVO (PATRÓN REPETIBLE - 2 horas por archivo):

```bash
Para: beneficiarios, medicos, funcionarios, contratistas, ordenes, vigencias, recibosPago, parentescos

1. BUSCAR EN EL ARCHIVO:
   - Esquema actual (incompleto)
   - Endpoint GET (sin POST/PUT/DELETE documentados)

2. REEMPLAZAR SU ESQUEMA:
   - Usar Template 2
   - Reemplazar {Resource} con el nombre correcto (Beneficiario, Medico, etc.)
   - Agregar campos específicos del negocio

3. AGREGAR ENDPOINTS FALTANTES:
   - POST /api/{resource}
   - PUT /api/{resource}/{id}
   - DELETE /api/{resource}/{id}

4. VALIDAR:
   - Verificar que la estructura YAML sea válida
   - Confirmar que hay 5 esquemas (Main, Create, Update, Paginated, Error)
   - Verificar que hay 6 operaciones (GET list, GET by id, POST, GET detail, PUT, DELETE)
```

---

### FASE TIER 3: REPORTES (15 horas)

#### APLICAR A CADA ARCHIVO DE REPORTE (PATRÓN REPETIBLE - 1 hora):

```bash
Para: reportesF1, reportesF2, reportesF5, reportesF10, reportesF12, 
      reportesCitasGeneradas, reportesHistoria,
      reportesNacionalesF5, reportesNacionalesF10, reportesNacionalesF15,
      reportesNacionalesOrdenesEspecialidad, reportesOrdenesRegistradas,
      reportesReembolsos, reportesBeneficiariosInactivos,
      reportesCuentasCobroSinAsociar

1. CREAR ESQUEMA ESPECÍFICO:
   - Analizar la respuesta actual del endpoint
   - Crear esquema ReporteXXXResponse con sus campos
   - Agregar descripción y ejemplos

2. DOCUMENTAR PARÁMETROS:
   - periodo: pattern: '^\d{4}-\d{2}$'
   - regional: type string
   - Otros específicos del reporte

3. AGREGAR RESPUESTAS DE ERROR:
   - 400: Período inválido, regional no válida
   - 401: No autenticado
   - 500: Error en servidor

4. VALIDAR:
   - Verificar que la query de periodo tiene pattern
   - Confirmar que hay esquema response formal
   - Verificar códigos HTTP (200, 400, 401, 500)
```

---

### FASE TIER 4: ESPECIALIZADOS (10 horas)

#### 4A - Excedentes (6 horas - patrón similar a reportes):
```bash
Para: excedentes30Dias, excedentesFormatoFinanciero, excedentesFormatoSalarios,
      excedentesImprimir, excedentesRelacionRecibos, excedentesSinCancelar

1. Crear esquema Excedente común
2. Agregar parámetros: page, pageSize, limit con validaciones
3. Documentar respuestas: 200, 400, 401, 500
4. Agregar ejemplos de datos
```

#### 4B - Parámetros/Config (3 horas):
```bash
Para: parametros, gruposTope, nivelesTope, agendas, audit

1. Crear esquema del recurso específico
2. Documentar: page, pageSize, limit
3. Si hay parámetro "all": cambiar a enum: [true, false]
4. Agregar respuestas: 200, 400, 401, 500
```

#### 4C - Entidades Secundarias (1 hora):
```bash
Para: relacionPagos, abrirVigencia

1. Agregar esquema simple
2. Documentar GET con paginación básica
3. Si es alias: añadir nota en descripción
```

---

## ✅ CHECKLIST DE VALIDACIÓN

Para cada archivo después de actualizar:

```
□ Archivo tiene @swagger en comentarios
□ Tiene esquema con `required` definido
□ Propiedades tienen: type, description, example
□ GET documentado con paginación (page, pageSize, limit)
□ POST documentado (solo si existe en código)
□ PUT documentado (solo si existe en código)
□ DELETE documentado (solo si existe en código)
□ Respuestas: 200, 400, 401, 403, 500
□ SecuritySchemes: bearerAuth definido
□ No hay errores YAML/sintaxis
□ Ejemplos de data son realistas
□ Parámetros: type, schema, description, example, required
□ Mensajes de error descriptivos en 400/500
□ requestBody para POST/PUT definido correctamente
```

---

## 📝 RUTAS A PRIORIDAD

| Ruta | Prioridad | Criticidad | Usuarios | Complejidad | Impacto |
|------|-----------|-----------|----------|------------|---------|
| TIER 1: rbac, resoluciones | 1 | 🔴 CRÍTICO | Admin | Alta | 100% |
| TIER 2: beneficiarios, medicos, funcionarios, etc. | 2 | 🟠 ALTO | Médicos, Admin | Media | 90% |
| TIER 3: Reportes (F1, F5, F10, etc.) | 3 | 🟡 MEDIO | Directivos, Admin | Media | 70% |
| TIER 4: Excedentes, parámetros, secundarios | 4 | 🟡 BAJO | Admin, Control | Baja | 50% |

---

## 📊 ESTIMACIÓN DE TIEMPO TOTAL

| Fase | Archivos | Horas | Días (8h/día) | Recursos |
|------|----------|-------|---------------|----------|
| TIER 1 | 2 | 6 | 1 | 1 Developer |
| TIER 2 | 8 | 16 | 2 | 1 Developer |
| TIER 3 | 15 | 15 | 2 | 1 Developer |
| TIER 4 | 15 | 10 | 1.25 | 1 Developer |
| **TOTAL** | **46** | **47** | **6** | **1 Developer** |

---

## 🔧 ARCHIVOS ESPECIALES (Casos Especiales)

### abrirVigencia.routes.js
- **Tipo**: Alias de vigencias.routes.js
- **Acción**: Revisar si es una copia o referencia
- Solo documentar si es archivo independiente con endpoints

### `usuarios.routes.js` - ⚠️ YA ACTUALIZADO
- **NO modificar** en esta fase
- Usar como referencia/estándar

### `auth.routes.js` - ⚠️ EXCELENTE
- **NO requiere cambios** - Ya está completo

### `dashboard.routes.js` - ⚠️ CASI COMPLETO
- Solo añadir: `securitySchemes: bearerAuth`
- Tiempo: 0.5 horas

### `especialidades.routes.js` y `subEspecialidades.routes.js` - ✅ COMPLETO
- **NO requiere cambios**

---

## 📋 RESUMEN ENTREGABLES

```
✅ ANTES DE INICIAR
  □ Leer este documento completo
  □ Entender los 4 TIERs y sus características
  □ Revisar templates de corrección
  □ Usar usuarios.routes.js como referencia

✅ DURANTE EJECUCIÓN
  □ Seguir orden: TIER 1 → TIER 2 → TIER 3 → TIER 4
  □ Aplicar checklist de validación a cada archivo
  □ Mantener ejemplos de datos realistas
  □ Documentar TODOS los códigos HTTP (200, 400, 401, 403, 500)

✅ AL FINALIZAR
  □ 46 archivos con Swagger documentado
  □ Respuesta paginada uniforme (page, pageSize, totalItems, etc.)
  □ Esquemas reutilizables (ErrorResponse, PaginatedResponse)
  □ Seguridad: bearerAuth en todos
  □ 100% CRUD operaciones documentadas (cuando existen en código)
```

---

**Generado:** Abril 2026  
**Versión:** 1.0 - LISTA PARA EJECUTAR  
**Próximo paso:** Iniciar TIER 1 (rbac.routes.js)
