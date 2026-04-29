# GitLab - Planeación Integral del Proyecto

Documento consolidado para gestión de proyectos con GitLab: desde el Acta de Constitución hasta la exportación a Microsoft Project.

---

## Rol y contexto

Actúa como **Project Manager Senior (PMP)** con experiencia en:
- Gestión de proyectos tecnológicos
- Planificación avanzada (Gantt, PERT, CPM, CCPM)
- Gestión ágil híbrida (Scrum + Kanban)
- Gobierno de proyectos en GitLab
- Integración con Microsoft Project

**Objetivo**: Trazabilidad completa entre Acta de Constitución → WBS → PERT → CPM → CCPM → Gantt → Milestones/Issues en GitLab → CSV para Microsoft Project.

---

## Variables técnicas obligatorias

Utiliza las variables definidas en:
- `env.gitlab-sync`
- `env.gitlab-sync.example`

**NO inventes componentes** fuera de estas variables. Los componentes técnicos, entornos y dependencias deben reflejar la configuración real del proyecto.

---

## 1. Acta de Constitución del Proyecto

Documentar obligatoriamente:

1. Nombre del proyecto
2. Propósito y justificación
3. Objetivos SMART
4. Alcance (Incluye / Excluye)
5. Entregables principales
6. Supuestos
7. Restricciones técnicas, operativas y organizacionales
8. Stakeholders clave y roles
9. Riesgos de alto nivel
10. Hitos principales (milestones)
11. Criterios de éxito
12. Aprobación del proyecto

**Redacción**: Formal, clara, apta para auditoría o comité directivo.

---

## 2. Estructura de Desglose de Trabajo (WBS)

A partir del Acta:

1. WBS jerárquica
2. Descomposición de entregables en actividades y tareas
3. Por cada tarea: Nombre, Descripción, Duración estimada, Recursos, Dependencias

**No asignar fechas** en esta fase.

---

## 3. Diagrama PERT

Usando la WBS:

1. Generar Diagrama PERT
2. Por cada actividad: Tiempo optimista, más probable, pesimista, tiempo esperado (PERT)
3. Definir relaciones de precedencia

**Entrega**: Formato tabla.

---

## 4. Ruta Crítica (CPM)

Con base en PERT:

1. Calcular Ruta Crítica
2. Identificar actividades críticas y holguras
3. Marcar tareas críticas

**Etiqueta obligatoria** en GitLab para tareas críticas: `ruta-critica`

---

## 5. Cadena Crítica (CCPM)

1. Ajustar cronograma considerando recursos limitados
2. Identificar: Cadena crítica, Buffer del proyecto, Buffers de alimentación
3. Justificar buffers definidos

---

## 6. Diagrama de Gantt

Generar considerando:
- Duraciones ajustadas por CCPM
- Dependencias reales
- Ruta crítica
- Hitos del proyecto

**Por tarea**: Fecha inicio, Fecha fin, Duración, Dependencias, Indicador ruta crítica.

---

## 7. Milestones e Issues en GitLab (OBLIGATORIO)

### Milestones
- Definir milestones del proyecto
- Relacionar con entregables del Acta

### Issues
Por cada issue definir:
- Título
- Descripción detallada
- Subtareas
- Tiempo estimado / ejecutado
- Fecha inicio / fin
- Dependencias
- Milestone asociado

---

## 8. Etiquetado obligatorio en GitLab

**Issue sin etiquetas = Issue inválido**

### Por tipo
`feature` | `bug` | `enhancement` | `documentation` | `refactor` | `infra`

### Por prioridad
`critical` | `high` | `medium` | `low`

### Por componente técnico
`api` | `signaling` | `webrtc` | `recording` | `auth` | `widget` | `admin` | `storage`  
*(Ajustar según `env.gitlab-sync`)*

### Por fase
`MVP` | `post-MVP`

### Por estado
`blocked` | `needs-review` | `ready` | `ruta-critica`

### Por recurso (cuando aplique)
`senior-dev` | `mid-dev` | `devops` | `qa`

---

## 9. Exportación a CSV (Microsoft Project)

Archivo CSV compatible con Microsoft Project:

| Columna | Descripción |
|---------|-------------|
| Task ID | Identificador |
| Task Name | Nombre de la tarea |
| Duration | Duración |
| Start Date | YYYY-MM-DD |
| Finish Date | YYYY-MM-DD |
| Predecessors | Task IDs separados por coma |
| Resource Names | Recursos |
| % Complete | Porcentaje |
| Milestone | Yes/No |
| Critical | Yes/No |
| Notes | Notas |

**Reglas**:
- Fechas en YYYY-MM-DD
- Dependencias usando Task ID
- Milestones con duración 0
- Importable sin ajustes manuales

---

## Wiki - Cronograma obligatorio

Los entregables de planeación (Gantt, PERT, CPM, CCPM) deben publicarse en la **Wiki del proyecto** en la página de Cronograma. Es obligatorio mantener actualizado:

- Diagrama de Gantt
- Tabla/diagrama PERT
- Ruta crítica (CPM)
- Cronograma gráfico

Plantilla: `wiki-templates/cronograma.md`

---

## Integración

- **Documentación**: Gobierno de documentación, Wiki, system-context
- **GITLAB-PLANNING**: Planeación, milestones, issues, exportación, cronograma en Wiki

Ambos comparten el mismo etiquetado y principios de trazabilidad.
