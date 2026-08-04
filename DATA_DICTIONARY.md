# Data Dictionary — Entrega 4

Las entidades administrativas de la Entrega 3.1 se mantienen sin cambios. Esta entrega añade el modelo colaborativo del Kanban.

## Kanban Board

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---:|---|
| id | string | Sí | Identificador del tablero |
| projectId | string | Sí | Proyecto propietario |
| name | string | Sí | Nombre del tablero |
| version | number | Sí | Versión incremental |
| columns | array | Sí | Configuración de columnas |
| createdAt | datetime ISO | Sí | Creación |
| updatedAt | datetime ISO | Sí | Última modificación |

## Kanban Column

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---:|---|
| id | string | Sí | Identificador estable |
| name | string | Sí | Nombre visible |
| order | number | Sí | Orden horizontal |
| wipLimit | number | Sí | Límite de trabajo; 0 significa sin límite |
| tone | enum | Sí | Tono visual de la columna |

## Kanban Card

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---:|---|
| id | UUID/string | Sí | Identificador de tarjeta |
| columnId | string | Sí | Columna actual |
| position | number | Sí | Posición dentro de la columna |
| title | string(120) | Sí | Título |
| description | string(1500) | No | Detalle |
| priority | enum | Sí | high, medium o low |
| assigneeId | string | No | Responsable |
| participantIds | array<string> | No | Participantes |
| labels | array<object> | No | Etiquetas con nombre y color |
| startDate | date ISO | No | Inicio |
| dueDate | date ISO | No | Vencimiento |
| estimatedHours | number | No | Horas estimadas |
| actualHours | number | No | Horas reales |
| visibility | enum | Sí | internal, client o restricted |
| dependencies | array<string> | No | IDs de tarjetas relacionadas |
| checklist | array<object> | No | Lista de verificación |
| comments | array<object> | No | Comentarios |
| history | array<object> | No | Historial reciente |
| archived | boolean | Sí | Archivo lógico |
| createdAt | datetime ISO | Sí | Creación |
| updatedAt | datetime ISO | Sí | Actualización |

## Checklist Item

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID/string | Identificador |
| text | string(160) | Contenido |
| completed | boolean | Estado |

## Comment

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID/string | Identificador |
| authorId | string | Autor |
| text | string(1000) | Comentario |
| createdAt | datetime ISO | Fecha |

## History Event

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID/string | Identificador |
| type | enum | created, updated, moved, reordered, commented, checklist o archived |
| title | string | Descripción breve |
| actorId | string | Usuario responsable |
| createdAt | datetime ISO | Fecha |
| meta | object | Datos adicionales no sensibles |
