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

## Ajuste 4.1

### KanbanBoard

| Campo | Tipo | Descripción |
|---|---|---|
| `templateId` | string | Plantilla aplicada o `custom` |
| `name` | string | Nombre editable del tablero |
| `columns` | array | Columnas activas |
| `archivedColumns` | array | Columnas desactivadas |
| `archivedCards` | array | Tarjetas archivadas recuperables |

### KanbanColumn

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | string | Identificador estable |
| `name` | string | Nombre visible |
| `order` | number | Orden de izquierda a derecha |
| `wipLimit` | number | Máximo de tarjetas; 0 = sin límite |
| `tone` | string | Color semántico |
| `isDone` | boolean | Indica etapa final |
| `active` | boolean | Columna visible y utilizable |
| `archived` | boolean | Columna desactivada |

### Campos de archivo de KanbanCard

| Campo | Tipo | Descripción |
|---|---|---|
| `columnBeforeArchive` | string | Columna previa al archivo |
| `positionBeforeArchive` | number | Posición previa |
| `archivedAt` | ISO date | Fecha de archivo |
| `archivedBy` | string | Usuario que archivó |
| `restoredAt` | ISO date | Fecha de restauración |
| `restoredBy` | string | Usuario que restauró |

### Campos de archivo de Client

| Campo | Tipo | Descripción |
|---|---|---|
| `status` | string | `active` o `archived` |
| `archivedAt` | ISO date | Fecha de archivo |
| `archivedBy` | string | Usuario que archivó |
| `restoredAt` | ISO date | Fecha de restauración |
| `restoredBy` | string | Usuario que restauró |

## Ajuste 4.2

No se agregan entidades persistentes. La preferencia de vista del Kanban (`board` o `list`) se almacena localmente como preferencia de interfaz y no forma parte de la fuente oficial de verdad del proyecto.

## CanvasShareToken

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---:|---|
| id | string UUID | Sí | Identificador interno |
| code | string | Sí | Código público del enlace |
| label | string | No | Etiqueta administrativa |
| createdBy | string | Sí | Usuario emisor |
| createdAt | ISO 8601 | Sí | Fecha de creación |
| expiresAt | ISO 8601 | Sí | Fecha de vencimiento |
| active | boolean | Sí | Estado del enlace |
| revokedAt | ISO 8601 | No | Fecha de revocación |
| revokedBy | string | No | Usuario que revocó |

## CanvasSnapshot

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---:|---|
| id | string UUID | Sí | Identificador de la versión |
| version | number | Sí | Versión original capturada |
| label | string | Sí | Motivo o nombre del punto de control |
| createdAt | ISO 8601 | Sí | Fecha de captura |
| createdBy | string | Sí | Usuario responsable |
| title | string | Sí | Título del canvas capturado |
| templateId | string | Sí | Plantilla del canvas |
| notes | CanvasNote[] | Sí | Copia completa de las notas |

En modo mock se conservan como máximo 20 snapshots por canvas.

## Ajuste 5.9 - Color personalizado de notas

`CanvasNote` incorpora el campo opcional `colorHex`:

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---:|---|
| colorHex | string hexadecimal | No | Color personalizado de la nota en formato `#RRGGBB`. Cuando está vacío, se utiliza el preset indicado por `colorId`. |

## Deliverable

| Campo | Tipo | Descripción |
|---|---|---|
| id | string | Identificador técnico |
| workspaceId | string | Workspace propietario |
| projectId | string | Proyecto vinculado |
| title | string | Nombre del entregable |
| type | enum | document, prototype, website, design, presentation, other |
| description | string | Alcance visible |
| status | enum | draft, in_review, changes_requested, approved |
| visibility | enum | client o internal |
| priority | enum | low, medium, high, critical |
| dueDate | date | Fecha límite |
| checklist | DeliverableCheck[] | Condiciones de aceptación |
| versions | DeliverableVersion[] | Archivos o enlaces publicados |
| comments | DeliverableComment[] | Conversación del entregable |
| history | DeliverableHistory[] | Registro de acciones |
| archived | boolean | Estado de archivo |

## DeliverableVersion

| Campo | Tipo | Descripción |
|---|---|---|
| number | number | Número correlativo |
| label | string | Nombre de versión |
| fileName | string | Nombre visible |
| fileType | string | Tipo de recurso |
| url | URL | Enlace de consulta |
| notes | string | Notas de versión |
| createdAt | ISO 8601 | Fecha de publicación |
| createdBy | string | Autor |

## FinanceRecord

| Campo | Tipo | Descripción |
|---|---|---|
| id | string | Identificador del registro financiero |
| workspaceId | string | Workspace propietario |
| projectId | string | Proyecto asociado |
| settings | FinanceSettings | Configuración comercial |
| memberRates | MemberRate[] | Tarifas privadas del equipo |
| incomes | IncomeEntry[] | Cobros e ingresos |
| costs | CostEntry[] | Costos directos |
| timeEntries | TimeEntry[] | Horas registradas |
| createdAt | ISO 8601 | Fecha de creación |
| updatedAt | ISO 8601 | Última actualización |

## FinanceSettings

`currency`, `contractedAmount`, `internalBudget`, `taxRate`, `discount`, `plannedHours`, `targetMargin`, `paymentTerms`, `billingNotes`.

## IncomeEntry

`id`, `type`, `status`, `concept`, `amount`, `dueDate`, `paidDate`, `reference`, `evidenceUrl`, `notes`.

## CostEntry

`id`, `category`, `vendor`, `amount`, `date`, `responsible`, `paymentStatus`, `receiptUrl`, `notes`.

## TimeEntry

`id`, `userId`, `userName`, `date`, `hours`, `workType`, `reference`, `description`, `source`, `billable`.

## MemberRate

`userId`, `userName`, `costRate`, `billableRate`, `weeklyCapacity`.

## Fuente de verdad

Durante la Entrega 7 se utiliza `localStorage` mediante `MockFinanceAdapter`.
