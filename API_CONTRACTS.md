# API Contracts — Entrega 3.1

La API recibe `POST` con `URLSearchParams`:

- `action`: operación.
- `payload`: JSON serializado.

Todas las operaciones protegidas reciben `sessionToken`.

## Proyectos

- `projects.list`: `{ sessionToken, workspaceId, includeArchived }`
- `projects.get`: `{ sessionToken, projectId }`
- `projects.create`: `{ sessionToken, input }`
- `projects.update`: `{ sessionToken, projectId, patch }`
- `projects.archive`: `{ sessionToken, projectId }`
- `projects.restore`: `{ sessionToken, projectId }`

## Clientes

- `clients.list`: `{ sessionToken, workspaceId }`
- `clients.create`: `{ sessionToken, input }`

## Equipo

- `users.listForWorkspace`: `{ sessionToken, workspaceId }`
- `projectMembers.list`: `{ sessionToken, projectId }`
- `projectMembers.assign`: `{ sessionToken, projectId, input }`
- `projectMembers.remove`: `{ sessionToken, projectId, memberId }`

## Recursos e hitos

- `resources.list`: `{ sessionToken, projectId }`
- `resources.create`: `{ sessionToken, projectId, input }`
- `resources.remove`: `{ sessionToken, projectId, resourceId }`
- `milestones.list`: `{ sessionToken, projectId }`

## Google Drive

- `drive.createProjectStructure`: `{ sessionToken, projectId }`

Salida:

```json
{
  "mode": "apps-script",
  "folderId": "...",
  "folderName": "PROY-AGO-005_Nombre",
  "folderUrl": "https://drive.google.com/...",
  "folders": ["00_Resumen", "01_Investigación"]
}
```

## Respuesta estándar

```json
{ "ok": true, "data": {} }
```

```json
{ "ok": false, "error": "Mensaje seguro" }
```
