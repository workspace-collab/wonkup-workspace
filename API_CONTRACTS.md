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
