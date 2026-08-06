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

## PortfolioReport

| Campo | Tipo | Descripción |
|---|---|---|
| generatedAt | ISO 8601 | Momento de generación |
| period | ReportPeriod | Periodo aplicado |
| status | string | Estado de proyecto filtrado |
| projects | Project[] | Proyectos visibles |
| projectRows | ProjectReportRow[] | Comparativo por proyecto |
| deliverables | Deliverable[] | Entregables visibles |
| tasks | Task[] | Tareas visibles |
| trend | ReportTrendPoint[] | Serie mensual de ingresos, costos y horas |
| riskProjects | ProjectReportRow[] | Proyectos priorizados por riesgo |
| upcoming | ReportDeadline[] | Próximos vencimientos |
| statusBreakdown | BreakdownItem[] | Distribución de proyectos |
| deliveryBreakdown | BreakdownItem[] | Distribución de entregables |
| metrics | PortfolioMetrics | Indicadores consolidados |

## ProjectReportRow

Incluye identificación del proyecto, estado, salud, avance, vencimientos, entregables, horas y —solo cuando el rol está autorizado— indicadores financieros y de rentabilidad.

## Fuente de verdad

PortfolioReport es una proyección generada en tiempo real. No reemplaza las colecciones fuente de Proyectos, Entregables o Finanzas.

# Ampliación — Entrega 9 Cloud Foundation

## UserProfile

Ruta: `users/{uid}`

| Campo | Tipo | Descripción |
|---|---|---|
| `uid` | string | UID de Firebase Authentication |
| `name` | string | Nombre visible |
| `email` | string | Correo normalizado |
| `initials` | string | Iniciales de interfaz |
| `role` | string | Rol global o predominante |
| `roleLabel` | string | Etiqueta localizada |
| `status` | string | `active` o `inactive` |
| `workspaceIds` | array<string> | Workspaces autorizados |
| `projectIds` | array<string> | Proyectos autorizados |
| `workspaceRoles` | map | Rol específico por workspace |
| `projectRoles` | map | Rol específico por proyecto |
| `personId` | string | Vínculo opcional con directorio |
| `schemaVersion` | number | Versión de esquema, actualmente 9 |
| `createdAt` | timestamp/string | Fecha de creación |
| `updatedAt` | timestamp/string | Última actualización |

## WorkspaceMembership

Ruta: `workspaces/{workspaceId}/members/{uid}`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | string | UID usado como ID del documento |
| `authUid` | string | UID de Authentication |
| `userId` | string | ID opcional de la persona del directorio |
| `workspaceId` | string | Workspace autorizado |
| `role` | string | Rol dentro del workspace |
| `status` | string | Estado de la membresía |
| `schemaVersion` | number | Versión del esquema |

## ProjectMembershipCloud

Ruta: `workspaces/{workspaceId}/projects/{projectId}/members/{uid}`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | string | UID o identificador migrado |
| `authUid` | string | UID real cuando ya existe cuenta |
| `userId` | string | Persona interna vinculada |
| `workspaceId` | string | Workspace padre |
| `projectId` | string | Proyecto padre |
| `role` | string | Rol dentro del proyecto |
| `allocation` | number | Dedicación porcentual |
| `status` | string | `active` o `inactive` |

## SystemSchema

Ruta: `system/schema`

| Campo | Tipo | Descripción |
|---|---|---|
| `version` | number | Versión activa del esquema |
| `name` | string | Nombre de la fundación cloud |
| `status` | string | Estado |
| `migratedAt` | timestamp | Última migración |
| `migratedBy` | string | UID ejecutor |
| `lastMigrationId` | string | Auditoría asociada |

## MigrationAudit

Ruta: `system/schema/migrations/{migrationId}`

Registra cantidades, workspaces, fecha, ejecutor y origen de cada migración.

## UserActivationAudit

Ruta: `system/schema/userActivations/{activationId}`

Registra UID, correo, rol, workspaces, proyectos, cantidades, fecha y ejecutor de cada activación.

# Ampliación — Entrega 10 Kanban Cloud

## KanbanBoardCloud

Ruta: `workspaces/{workspaceId}/projects/{projectId}/boards/main`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | string | Identificador lógico del tablero |
| `workspaceId` | string | Workspace padre |
| `projectId` | string | Proyecto padre |
| `name` | string | Nombre del tablero |
| `templateId` | string | Plantilla aplicada o `custom` |
| `columns` | array<KanbanColumn> | Columnas activas y archivadas |
| `version` | number | Versión incremental del tablero |
| `schemaVersion` | number | Versión del esquema, actualmente 10 |
| `createdAt` | ISO string | Fecha de creación |
| `updatedAt` | ISO string | Última modificación |
| `updatedBy` | string | UID del último actor |

## KanbanCardCloud

Ruta: `workspaces/{workspaceId}/projects/{projectId}/boards/main/cards/{cardId}`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | string | ID del documento y tarjeta |
| `workspaceId` | string | Workspace padre |
| `projectId` | string | Proyecto padre |
| `title` | string | Título obligatorio |
| `description` | string | Descripción |
| `columnId` | string | Columna actual |
| `position` | number | Orden dentro de la columna |
| `priority` | string | `high`, `medium` o `low` |
| `assigneeId` | string | Persona responsable |
| `participantIds` | array<string> | Participantes |
| `labels` | array | Etiquetas |
| `startDate` | string | Fecha de inicio |
| `dueDate` | string | Fecha límite |
| `estimatedHours` | number | Horas estimadas |
| `actualHours` | number | Horas reales |
| `visibility` | string | Visibilidad declarada |
| `checklist` | array | Elementos y estado |
| `comments` | array | Comentarios embebidos |
| `history` | array | Historial resumido |
| `archived` | boolean | Estado de archivo |
| `schemaVersion` | number | Versión del esquema 10 |
| `createdAt` | ISO string | Creación |
| `updatedAt` | ISO string | Actualización |
| `updatedBy` | string | UID del actor |

## ProjectActivityCloud

Ruta: `workspaces/{workspaceId}/projects/{projectId}/activity/{eventId}`

Registra el tipo de acción, actor, tarjeta, fecha y metadatos. Los eventos se crean y no se modifican.

## UserNotificationCloud

Ruta: `users/{uid}/notifications/{notificationId}`

| Campo | Tipo | Descripción |
|---|---|---|
| `recipientUid` | string | Usuario destinatario |
| `actorUid` | string | Usuario que generó el evento |
| `type` | string | Tipo de notificación |
| `title` | string | Título visible |
| `message` | string | Resumen |
| `href` | string | Ruta interna de navegación |
| `workspaceId` | string | Workspace relacionado |
| `projectId` | string | Proyecto relacionado |
| `cardId` | string | Tarjeta relacionada |
| `read` | boolean | Estado de lectura |
| `readAt` | ISO string | Momento de lectura |
| `createdAt` | ISO string | Creación |

## Entrega 11 — Deliverable Cloud Document

Ruta:

```text
workspaces/{workspaceId}/projects/{projectId}/deliverables/{deliverableId}
```

| Campo | Tipo | Descripción |
|---|---|---|
| id | string | Identificador determinista del entregable |
| workspaceId | string | Workspace propietario |
| projectId | string | Proyecto propietario |
| title | string | Nombre del entregable |
| type | string | Tipo de recurso |
| description | string | Alcance o descripción |
| status | enum | `draft`, `in_review`, `changes_requested`, `approved` |
| visibility | enum | `internal` o `client` |
| priority | string | Prioridad operativa |
| dueDate | string | Fecha prevista |
| ownerId | string | Responsable interno |
| ownerName | string | Nombre visible del responsable |
| archived | boolean | Archivo lógico |
| checklist | array | Criterios de aceptación |
| versions | array | Versiones publicadas mediante enlaces |
| comments | array | Conversación interna/cliente |
| history | array | Trazabilidad del flujo |
| schemaVersion | int | Versión del esquema, actualmente 11 |
| createdAt | ISO 8601 | Fecha de creación |
| updatedAt | ISO 8601 | Fecha de actualización |

### Fuente de verdad

- Cuenta Firebase: Cloud Firestore.
- Código demo: `localStorage` mediante `MockDeliverableAdapter`.

## Entrega 12 — Canvas Engine Cloud

### Canvas

| Campo | Tipo | Descripción |
|---|---|---|
| id | string | Identificador estable |
| workspaceId | string | Workspace propietario |
| projectId | string | Proyecto propietario |
| templateId | string | Plantilla aplicada |
| title | string | Nombre visible |
| status | enum | `active` o `archived` |
| createdBy | string | Identificador interno del creador |
| createdByUid | string | UID Firebase del creador |
| createdAt | ISO 8601 | Fecha de creación |
| updatedAt | ISO 8601 | Última actualización |
| updatedBy | string | UID que realizó el último cambio |
| version | integer | Versión operativa |
| noteCount | integer | Notas activas |
| activeSectionCount | integer | Secciones con notas activas |
| historyCount | integer | Eventos de historial |
| versionCount | integer | Puntos de control |
| shareCount | integer | Enlaces activos |
| archivedAt | ISO 8601 | Fecha de archivo lógico |
| archivedBy | string | Actor que archivó |
| schemaVersion | integer | Versión de esquema, actualmente 12 |

### CanvasNote Cloud

| Campo | Tipo | Descripción |
|---|---|---|
| id | string | Identificador de la nota |
| canvasId | string | Canvas propietario |
| workspaceId | string | Workspace propietario |
| projectId | string | Proyecto propietario |
| sectionId | string | Sección de la plantilla |
| text | string | Contenido, máximo 1200 caracteres |
| colorId | string | Preset de color |
| colorHex | string | Color personalizado opcional |
| authorId | string | Identificador interno del autor |
| authorUid | string | UID Firebase del autor |
| authorName | string | Nombre visible del autor |
| position | number | Posición ordenable dentro de la sección |
| commentCount | integer | Comentarios registrados |
| sourceCanvasId | string | Canvas de origen de una nota vinculada |
| sourceNoteId | string | Nota de origen |
| archived | boolean | Archivo lógico |
| archivedAt | ISO 8601 | Fecha de archivo |
| archivedBy | string | Actor que archivó |

### CanvasPublicShare

Colección `canvasShares/{code}`. Contiene únicamente datos sanitizados para lectura pública: título, plantilla, versión, contadores, notas visibles, vencimiento y estado. No contiene comentarios, historial, miembros, UID ni permisos internos.

### CanvasPresence

Realtime Database, ruta `presence/{workspaceId}/{projectId}/{canvasId}/{uid}/{clientId}`.

| Campo | Tipo | Descripción |
|---|---|---|
| authUid | string | UID autenticado, debe coincidir con la ruta |
| userId | string | Identificador interno del usuario |
| userName | string | Nombre visible |
| initials | string | Iniciales |
| clientId | string | Identificador de la pestaña/conexión |
| lastChanged | number | Marca de tiempo del servidor |

