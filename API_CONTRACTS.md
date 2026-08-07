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

## Entrega 11 — DeliverableService híbrido

Todas las operaciones Cloud reciben explícitamente contexto de workspace y proyecto:

```text
listDeliverables({ workspaceId, projectId, session, includeArchived })
getDeliverable({ workspaceId, projectId, deliverableId, session })
createDeliverable({ workspaceId, projectId, input, session })
updateDeliverable({ workspaceId, projectId, deliverableId, patch, session })
addVersion({ workspaceId, projectId, deliverableId, input, session })
requestReview({ workspaceId, projectId, deliverableId, session })
approve({ workspaceId, projectId, deliverableId, session })
requestChanges({ workspaceId, projectId, deliverableId, feedback, session })
addComment({ workspaceId, projectId, deliverableId, text, session })
toggleChecklist({ workspaceId, projectId, deliverableId, checklistId, done, session })
archiveDeliverable({ workspaceId, projectId, deliverableId, session })
restoreDeliverable({ workspaceId, projectId, deliverableId, session })
startRealtime({ workspaceId, projectId, session })
subscribe(listener)
```

Selección de adaptador:

```text
deliverableMode = hybrid + sesión Firebase → FirebaseDeliverableAdapter
deliverableMode = hybrid + código demo       → MockDeliverableAdapter
```

Ruta Firestore:

```text
workspaces/{workspaceId}/projects/{projectId}/deliverables/{deliverableId}
```

## Entrega 12 — CanvasService híbrido

Todas las operaciones internas reciben contexto explícito de workspace y proyecto.

```text
listInstances({ workspaceId, projectId, includeArchived, session })
getInstance({ canvasId, workspaceId, projectId, session })
createInstance({ workspaceId, projectId, templateId, title, session })
updateInstance({ canvasId, workspaceId, projectId, patch, session })
archiveInstance({ canvasId, workspaceId, projectId, session })
restoreInstance({ canvasId, workspaceId, projectId, session })

createNote({ canvasId, workspaceId, projectId, sectionId, input, session })
updateNote({ canvasId, workspaceId, projectId, noteId, patch, session })
moveNote({ canvasId, workspaceId, projectId, noteId, toSectionId, toIndex, session })
deleteNote({ canvasId, workspaceId, projectId, noteId, session })
addComment({ canvasId, workspaceId, projectId, noteId, text, session })

createShareToken({ canvasId, workspaceId, projectId, expiresAt, label, session })
listShareTokens({ canvasId, workspaceId, projectId, session })
revokeShareToken({ canvasId, workspaceId, projectId, tokenId, session })
getSharedInstance({ token })

listVersions({ canvasId, workspaceId, projectId, session })
createVersion({ canvasId, workspaceId, projectId, label, session })
restoreVersion({ canvasId, workspaceId, projectId, snapshotId, session })

startRealtime({ canvasId, workspaceId, projectId, session })
startPresence({ canvasId, workspaceId, projectId, session, onChange })
```

### Reglas operativas

- `canvasMode: hybrid` selecciona Firestore solo para sesiones Firebase.
- Los códigos demo siempre usan el adaptador local.
- Las notas se archivan lógicamente; no se eliminan físicamente.
- Crear una instancia y editar notas requiere un rol interno del proyecto. Archivar, restaurar, compartir y crear puntos de control requiere rol de administración del proyecto.
- Editar notas y comentar requiere un rol interno del proyecto.
- Restaurar una versión requiere `superadmin`.
- Los enlaces públicos consultan un snapshot sanitizado y no exponen subcolecciones internas.
- `startRealtime` y `startPresence` retornan funciones de limpieza.



## Ajuste 12.2 — ManagedUsersService

```text
health()
list()
invite({ name, email, role, workspaceIds, projectIds, allocation })
update({ uid, name, email, role, workspaceIds, projectIds, allocation, status })
setStatus(uid, status)
sendInvitationEmail(email)
```

Funciones callable:

```text
wonkupUserAdminHealth
wonkupListManagedUsers
wonkupInviteUser
wonkupUpdateManagedUser
wonkupSetManagedUserStatus
```

Todas las funciones requieren un ID token válido y un documento `users/{uid}` con `role=superadmin` y `status=active`. Las operaciones privilegiadas se ejecutan con Firebase Admin SDK; el navegador nunca recibe credenciales de servicio.

## Ajuste 12.3 — Accesos personalizados al Canvas

CanvasService incorpora:

```text
createPersonShare({ canvasId, workspaceId, projectId, email, permission, expiresAt, session })
listPersonShares({ canvasId, workspaceId, projectId, session })
updatePersonShare({ canvasId, workspaceId, projectId, targetUid, permission, expiresAt, session })
revokePersonShare({ canvasId, workspaceId, projectId, targetUid, session })
resolvePersonShare({ token, session })
getSharedCollaborativeInstance({ token, session, access })
```

Funciones callable:

```text
wonkupCreateCanvasShareAccess
wonkupListCanvasShareAccess
wonkupUpdateCanvasShareAccess
wonkupRevokeCanvasShareAccess
wonkupResolveCanvasShareAccess
```

`viewer` permite lectura en vivo; `commenter` añade comentarios; `editor` permite crear, editar, mover y archivar notas. La administración del acceso requiere superadministrador, administrador del workspace o líder del proyecto.

## Ajuste 12.4 — WonkUp AI Coach

Servicio frontend:

```text
AiCoachService.askQuestions({ instance, sectionId, session })
AiCoachService.suggestNotes({ instance, sectionId, userInput, session })
AiCoachService.reviewSection({ instance, sectionId, session })
```

Función callable:

```text
wonkupCanvasAiCoach({
  action: 'questions' | 'suggest' | 'review',
  workspaceId, projectId, canvasId, sectionId, userInput?
})
```

La función requiere Firebase Authentication, perfil WonkUp activo y acceso autorizado al Lienzo. Usa `GEMINI_API_KEY` desde Firebase Secret Manager y no expone la credencial al navegador. Desde el Ajuste 12.5 el modelo por defecto es `gemini-2.5-flash-lite`. Las respuestas estructuradas distinguen evidencia, inferencia e hipótesis. El piloto 12.5 no impone cuotas diarias desde WonkUp; las cuotas del proveedor continúan aplicando.

## Ajuste 12.5 — AI Usage Control Center

El callable principal conserva su contrato y añade analítica de uso:

```text
wonkupCanvasAiCoach(...) -> {
  ok,
  model,
  action,
  guide,
  canAddNotes,
  unlimitedPerUser: true,
  usage: {
    interactionId,
    inputTokens,
    outputTokens,
    thinkingTokens,
    totalTokens,
    estimatedCostUsd,
    suggestionsProposed
  },
  result
}
```

WonkUp no impone un límite diario por usuario durante el piloto. Los límites técnicos, de cuota y facturación del proveedor Gemini permanecen externos al contrato de WonkUp.

### Registrar aceptación de propuestas

```text
wonkupRecordAiAcceptance({ interactionId, acceptedCount })
```

- Requiere Firebase Authentication.
- Solo el usuario dueño de la interacción puede registrar aceptación.
- Solo aplica a `action='suggest'` exitosa.
- El cambio se aplica con transacción y es idempotente; repetir la misma cifra no duplica métricas.

Servicio frontend:

```text
AiCoachService.recordAcceptance(interactionId, acceptedCount)
```

### Resumen administrativo de consumo

```text
wonkupAiUsageSummary({
  days: 1 | 7 | 30,
  uid?, workspaceId?, projectId?, canvasId?
})
```

- Exclusivo de superadministrador.
- Devuelve totales, errores, tokens, costo estimado, acciones, ranking por usuario, tasa de aceptación, Lienzos con mayor uso, dimensiones de filtro y consumo mensual contra presupuesto.

Servicio frontend:

```text
AiUsageService.summary(filters)
```

### Configuración administrativa de IA

```text
wonkupUpdateAiSettings({
  monthlyBudgetUsd,
  enabled
})
```

- Exclusivo de superadministrador.
- `unlimitedPerUser` se conserva en `true` durante el piloto.
- Umbrales informativos: 50%, 75%, 90%, 100%.
- `budgetAction='alert_only'`: alcanzar el presupuesto no bloquea consultas.
- `enabled=false` funciona como pausa manual de emergencia.

Servicio frontend:

```text
AiUsageService.updateSettings(input)
```
