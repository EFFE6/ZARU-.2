# Prompts para aplicar y mantener ProjectRules

Copia y pega estas instrucciones. Úsalas en **proyectos nuevos** (para instalar) o **proyectos existentes** (para aplicar/mantener de forma periódica).

---

## Prompt 1: Instalación o auditoría inicial

**Cuándo**: Proyecto nuevo o primera vez que aplicas el kit. También para auditoría periódica (mensual/trimestral).

```
Actúa como experto en gobierno de proyectos de software. Necesito aplicar o verificar el kit ProjectRules en este proyecto.

Lee el contenido de la carpeta ProjectRules (o README.md, INSTALACION.md, GITLAB-PLANNING.md si están presentes) y:

1. **Estructura**: Verifica si existen .cursor/rules/, .gitlab/issue_templates/, docs/context/system-context.md, AGENTS.md. Si faltan, créalos según el estándar ProjectRules.

2. **system-context.md**: Si existe pero está incompleto, sugiere qué completar. Si no existe, crea la plantilla con las secciones: Descripción, Objetivo, Usuarios, Arquitectura, Restricciones, Decisiones, Despliegue.

3. **Reglas .cursor/rules/**: Verifica que existan documentation-and-context.mdc, gitlab-workflow.mdc, cursor-prompts.mdc, infrastructure-deployment.mdc. Si faltan, créalas con el contenido mínimo del kit ProjectRules.

4. **Reporte**: Lista qué falta, qué está bien y qué acciones recomiendas. No inventes nada que no esté en el estándar ProjectRules.
```

---

## Prompt 2: Mantenimiento periódico (compliance)

**Cuándo**: Revisión semanal o quincenal. Para verificar que el proyecto sigue las reglas.

```
Revisa este proyecto contra el estándar ProjectRules.

1. **Documentación**: ¿Existe docs/context/system-context.md y está actualizado? ¿Los cambios documentales tienen Issue asociado en GitLab? ¿La Wiki incluye Cronograma (Gantt, PERT, ruta crítica)? ¿Los manuales aplicables (Arquitectura, Modelo de datos/ER, Flujogramas, Instalación, Despliegue, Usuario, Marca) están en la Wiki?

2. **Reglas**: ¿Las reglas en .cursor/rules/ están alineadas con: documentación sin Issue, Wiki actualizada antes de cerrar, no regenerar docs completos, GitLab como fuente de verdad?

3. **Infraestructura**: Si hay contenedores/CI, ¿se usa Podman o Docker? ¿La base de producción es AlmaLinux o Ubuntu (o está documentada la excepción)?

4. **GitLab**: ¿Los Issues tienen etiquetas? ¿Existen templates en .gitlab/issue_templates/?

5. **Entregable**: Lista de ítems cumplidos vs ítems a corregir. Prioriza por impacto. No modifiques nada sin que lo apruebe.
```

---

## Prompt 3: Aplicar reglas en proyecto existente (sin kit)

**Cuándo**: Proyecto viejo que nunca tuvo ProjectRules. Quieres adoptarlo sin romper lo que ya existe.

```
Este proyecto no tiene ProjectRules. Necesito adoptar el estándar sin romper lo existente.

1. **Inventario**: Lista qué documentación ya existe (README, docs/, wiki, etc.) y qué estructura tiene actualmente.

2. **Integración**: Crea la estructura mínima de ProjectRules:
   - docs/context/system-context.md (extrae el contexto del README y código existente)
   - .cursor/rules/ con las 4 reglas del kit
   - .gitlab/issue_templates/ si no existen
   - AGENTS.md apuntando a system-context

3. **No sobrescribas**: Preserva README, docs, y configuración existente. Solo añade o fusiona. Si hay conflicto, sugiere y no apliques sin confirmar.

4. **Reporte**: Qué se creó, qué se preservó, qué pasos manuales quedan (ej: crear etiquetas en GitLab).
```

---

## Prompt 4: Sincronizar con GitLab

**Cuándo**: Después de actualizar el kit o cuando GitLab está desactualizado.

```
Sincroniza ProjectRules con GitLab. Verifica:

1. **Issue templates**: ¿Los archivos en .gitlab/issue_templates/ están subidos al proyecto GitLab? Si no, indica cómo subirlos.

2. **Etiquetas**: ¿Existen las etiquetas: feature, bug, enhancement, documentation, refactor, infra, critical, high, medium, low, MVP, post-MVP, blocked, needs-review, ready, ruta-critica? Lista las que faltan.

3. **system-context**: ¿La sección Infraestructura/Despliegue menciona Podman y AlmaLinux/Ubuntu cuando aplique?

4. **Entregable**: Checklist de acciones para que el usuario las ejecute en GitLab o manualmente.
```

---

## Prompt 5: Manual de Marca (sistemas SaaS/TI)

**Cuándo**: Proyecto nuevo o producto que requiere identidad de marca documentada.

```
Actúa como Lead Brand Designer y Documentalista Técnico Senior especializado en productos SaaS y soluciones TI.

Contexto del Sistema: [INSERTAR nombre y breve descripción desde docs/context/system-context.md]

Tarea: Generar la estructura detallada y el contenido base para un manual de marca del sistema/solución TI.

Desarrolla el manual siguiendo estos pilares:

1. **Identidad Estratégica**: Propósito, visión técnica, valores (ej. eficiencia, seguridad, escalabilidad).

2. **Sistema Visual (UI/UX)**:
   - Logotipo: uso en interfaces (versión responsive, favicon, modo claro/oscuro)
   - Paleta de Colores: códigos HEX, RGB y rol funcional (error, éxito, advertencia, info)
   - Tipografía: jerarquía para documentación técnica y pantallas de usuario

3. **Voz y Tono Técnico**: ¿Tono directo y seco para logs? ¿Empático para mensajes de error al usuario? Incluir tabla "Cómo decir" vs "Cómo no decir".

4. **Componentes y Consistencia**: Espaciado, iconografía (lineal vs sólida), elementos gráficos en diagramas de arquitectura.

5. **Directrices de Documentación**: Estilo Markdown, bloques de código, nomenclatura de variables.

Formato: encabezados claros, tablas para colores, checklists de implementación. Tono profesional, minimalista, orientado a eficiencia.
```

---

## Frecuencia sugerida

| Prompt | Frecuencia |
|--------|------------|
| 1 - Instalación/auditoría | Al inicio de proyecto o al adoptar el kit |
| 2 - Mantenimiento | Semanal o quincenal |
| 3 - Proyecto existente | Una vez, al migrar |
| 4 - Sincronizar GitLab | Semanal o tras cambios en el kit |
| 5 - Manual de Marca | Al definir producto SaaS/TI o al crear identidad |

---

## Tip

Guarda este archivo en la carpeta ProjectRules (o en un lugar accesible) y copia el prompt que necesites cada vez. Puedes crear un recordatorio en tu calendario para ejecutar el Prompt 2 (mantenimiento) de forma periódica.
