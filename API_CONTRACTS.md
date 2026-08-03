# API CONTRACTS

Estado: No implementado en Entrega 1.

## Adaptador actual

`DemoService` expone:

- getWorkspaces()
- getWorkspace(id)
- getProjects(workspaceId)
- getProject(id)
- getActivities(workspaceId)
- getTasks(workspaceId)
- getKanban(projectId)
- getCanvasTemplates()

## Contratos previstos para Entrega 2

- auth.exchangeInvite
- auth.refreshSession
- workspaces.list
- workspaces.get
- workspaces.create
- workspaces.update

## Regla de continuidad

Las vistas no deben leer directamente Google Sheets ni Firebase. Deben consumir servicios o adaptadores.
