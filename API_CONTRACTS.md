# API Contracts — Entrega 4

## Datos administrativos mediante Apps Script

La API recibe `POST` con `URLSearchParams`:

- `action`: operación.
- `payload`: JSON serializado.
- `sessionToken`: sesión validada.

Se mantienen los contratos de proyectos, clientes, equipo, recursos, hitos y Google Drive definidos en la Entrega 3.1.

## KanbanService

El frontend utiliza un contrato único para modo mock y Firebase:

- `getBoard({ projectId, workspaceId, session })`
- `createCard({ projectId, workspaceId, input, session })`
- `updateCard({ projectId, workspaceId, cardId, patch, session })`
- `moveCard({ projectId, workspaceId, cardId, toColumnId, toIndex, session })`
- `archiveCard({ projectId, workspaceId, cardId, session })`
- `addComment({ projectId, workspaceId, cardId, text, session })`
- `addChecklistItem({ projectId, workspaceId, cardId, text, session })`
- `toggleChecklistItem({ projectId, workspaceId, cardId, itemId, completed, session })`
- `deleteChecklistItem({ projectId, workspaceId, cardId, itemId, session })`
- `resetBoard({ projectId, workspaceId, session })` — solo modo mock.
- `subscribe(listener)`
- `startRealtime({ projectId, workspaceId, session })`

## Firebase Access Broker pendiente

Antes de activar `kanbanMode: 'firebase'`, Apps Script deberá devolver un `firebaseCustomToken` asociado al usuario validado. El frontend usará ese token con `signInWithCustomToken`.

Ejemplo de sesión ampliada:

```json
{
  "token": "session-token",
  "firebaseCustomToken": "firebase-custom-token",
  "role": "workspace_admin",
  "scopes": {
    "workspaceIds": ["w-agora"],
    "projectIds": ["*"]
  }
}
```

## Rutas Firestore

```text
workspaces/{workspaceId}/members/{userId}
workspaces/{workspaceId}/projects/{projectId}/members/{userId}
workspaces/{workspaceId}/projects/{projectId}/boards/main
workspaces/{workspaceId}/projects/{projectId}/boards/main/cards/{cardId}
```

## Respuesta estándar de Apps Script

```json
{ "ok": true, "data": {} }
```

```json
{ "ok": false, "error": "Mensaje seguro" }
```

## Ajuste 4.1

### Kanban

#### `kanban.restoreCard`

Entrada:

```json
{
  "projectId": "p-taxichurro",
  "workspaceId": "w-agora",
  "cardId": "card-123",
  "columnId": "todo"
}
```

Restaura una tarjeta archivada. Si `columnId` está vacío, intenta usar `columnBeforeArchive`.

#### `kanban.deleteCard`

Elimina definitivamente una tarjeta archivada. Requiere rol administrativo.

#### `kanban.updateBoardColumns`

Actualiza nombre, orden, color, estado final y límites WIP de las columnas. Reglas:

- mínimo dos columnas activas;
- al menos una columna final;
- una columna con tarjetas no puede desactivarse;
- `wipLimit: 0` significa sin límite.

#### `kanban.applyTemplate`

Aplica una de las plantillas:

- `basic-4`;
- `agile-5`;
- `digital-product-6`;
- `wonkup-9`.

### Clientes

#### `clients.update`

Actualiza nombre, contacto, correo y teléfono.

#### `clients.archive`

Oculta un cliente sin eliminar sus relaciones.

#### `clients.restore`

Restaura un cliente archivado.

#### `clients.delete`

Eliminación definitiva exclusiva del superadministrador. Solo procede si el cliente está archivado y no tiene proyectos vinculados.

## Ajuste 4.2

No se modifican contratos de backend, Google Apps Script ni Firebase. Los cambios pertenecen a presentacion, accesibilidad, navegacion, validacion de formularios y modos de visualizacion del Kanban.

## Ajuste 5.1 - Compartir y versiones

```text
createShareToken({ canvasId, expiresAt, label, session })
listShareTokens({ canvasId, session })
revokeShareToken({ canvasId, tokenId, session })
getSharedInstance({ token })

listVersions({ canvasId, session })
createVersion({ canvasId, label, session })
restoreVersion({ canvasId, snapshotId, session })
```

### Reglas

- `expiresAt` debe ser una fecha futura ISO 8601.
- Revocar un enlace impide nuevas consultas inmediatamente.
- Restaurar una versión requiere rol `superadmin`.
- La restauración crea una versión nueva y conserva un respaldo del estado previo.

## DeliverableService

```text
listDeliverables({ projectId, workspaceId, session, includeArchived })
getDeliverable({ deliverableId, session })
createDeliverable({ workspaceId, projectId, input, session })
updateDeliverable({ deliverableId, patch, session })
addVersion({ deliverableId, input, session })
requestReview({ deliverableId, session })
approve({ deliverableId, session })
requestChanges({ deliverableId, feedback, session })
addComment({ deliverableId, text, session })
toggleChecklist({ deliverableId, checklistId, done, session })
archiveDeliverable({ deliverableId, session })
restoreDeliverable({ deliverableId, session })
subscribe(listener)
resetDemo()
```

El adaptador activo es `MockDeliverableAdapter`. El contrato queda preparado para Apps Script o Firebase.

## FinanceService

```text
getProjectFinance({ projectId, workspaceId, session })
updateSettings({ projectId, workspaceId, input, session })

createIncome({ projectId, workspaceId, input, session })
updateIncome({ projectId, incomeId, input, session })
voidIncome({ projectId, incomeId, session })

createCost({ projectId, workspaceId, input, session })
updateCost({ projectId, costId, input, session })
deleteCost({ projectId, costId, session })

createTimeEntry({ projectId, workspaceId, input, session })
updateTimeEntry({ projectId, timeEntryId, input, session })
deleteTimeEntry({ projectId, timeEntryId, session })

updateMemberRate({ projectId, workspaceId, input, session })
subscribe(listener)
resetDemo()
```

### Adaptadores

- MockFinanceAdapter: activo.
- AppsScriptFinanceAdapter: contrato preparado.
- FirebaseFinanceAdapter: contrato preparado.

## ReportService

```text
getPortfolioReport({ workspaceId, session, period, status })
subscribe(listener)
```

### Comportamiento

- No persiste una base de datos separada.
- Agrega información de ProjectService, FinanceService, DeliverableService y DemoService.
- Respeta el alcance de workspace y proyecto de la sesión.
- Los datos de rentabilidad solo se muestran a roles administrativos.
- `period` acepta: `month`, `30d`, `90d`, `180d`, `year` y `all`.
- `status` acepta los estados de proyecto o `all`.


## Ajuste 8.1 - Altas rápidas contextuales

### `users.create`

Entrada:

```json
{
  "input": {
    "workspaceId": "w-agora",
    "name": "Nueva persona",
    "email": "persona@ejemplo.com"
  }
}
```

Registra una persona interna, crea su membresía básica en el workspace y devuelve:

```json
{
  "id": "uuid",
  "name": "Nueva persona",
  "email": "persona@ejemplo.com",
  "initials": "NP",
  "status": "active"
}
```

Reglas:

- Disponible para `superadmin`, `workspace_admin` y `project_lead` con acceso al workspace.
- El correo debe ser válido y único entre registros activos.
- La creación no genera todavía una cuenta de Firebase Authentication ni envía invitaciones.
- En modo mock se persiste en `localStorage`.

## Entrega 9 — Cloud Foundation

### AccessService

```text
login(code)
loginWithFirebase({ email, password })
sendPasswordReset(email)
logout()
getSession()
```

`authMode` acepta:

- `mock`;
- `firebase`;
- `hybrid`.

En `hybrid`, la sesión conserva `source: 'mock'` o `source: 'firebase'`.

### ProjectService

`projectMode` acepta:

- `mock`;
- `apps-script`;
- `firebase`;
- `hybrid`.

En `hybrid`:

```text
session.source == firebase -> FirebaseProjectAdapter
session.source != firebase -> MockProjectAdapter
```

El contrato funcional existente no cambia:

```text
listProjects
getProject
createProject
updateProject
archiveProject
restoreProject
listClients
createClient
updateClient
archiveClient
restoreClient
listUsers
createUser
listMembers
assignMember
removeMember
listResources
addResource
removeResource
listMilestones
addMilestone
updateMilestone
provisionDrive
```

### CloudFoundationService

```text
getConfiguration()
getBootstrapProfileTemplate(input)
getRuntimeSnippet()
getMigrationPreview(options)
exportLocalBackup()
signIn(email, password)
signOut()
getAccount()
runDiagnostics()
migrate(options)
verifyMigration(workspaceIds)
getActivationDirectory()
getUserActivationPreview(input)
activateUser(input)
```

### Migración

Entrada:

```json
{
  "workspaceIds": ["w-wonkup", "w-agora"],
  "include": {
    "workspaces": true,
    "projects": true,
    "clients": true,
    "people": true,
    "projectMembers": true
  }
}
```

La ejecución:

- requiere cuenta Firebase autenticada;
- requiere `users/{uid}` activo con rol `superadmin`;
- rechaza rutas duplicadas;
- utiliza lotes de máximo 400 operaciones;
- escribe con `merge: true`;
- crea una auditoría en `system/schema/migrations/{migrationId}`.

### Activación de usuario

Entrada:

```json
{
  "uid": "UID_DE_FIREBASE_AUTH",
  "email": "persona@wonkup.pe",
  "name": "Persona",
  "role": "project_lead",
  "personId": "persona-interna-opcional",
  "allocation": 30,
  "workspaceIds": ["w-agora"],
  "projectIds": ["PROY-AGO-001"]
}
```

Roles admitidos:

```text
workspace_admin
project_lead
collaborator
client
guest
```

La activación escribe:

```text
users/{uid}
workspaces/{workspaceId}/members/{uid}
workspaces/{workspaceId}/projects/{projectId}/members/{uid}
workspaces/{workspaceId}/people/{personId}   // solo vínculo authUid opcional
system/schema/userActivations/{activationId}
```

La pantalla no crea la contraseña ni la cuenta Authentication. La cuenta debe existir previamente en Firebase Console.
