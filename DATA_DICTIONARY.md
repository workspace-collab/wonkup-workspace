# Data Dictionary — Entrega 2

## Session

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---:|---|
| token | string | Sí | Token opaco entregado una sola vez |
| source | enum | Sí | `mock` o `apps-script` |
| issuedAt | datetime ISO | Sí | Inicio de sesión |
| expiresAt | datetime ISO | Sí | Vencimiento |
| role | enum | Sí | Rol técnico |
| roleLabel | string | Sí | Nombre visible |
| user | object | Sí | Usuario seguro para frontend |
| scopes.workspaceIds | string[] | Sí | Workspaces autorizados o `*` |
| scopes.projectIds | string[] | Sí | Proyectos autorizados o `*` |

## Access Grant

| Campo | Tipo | Fuente | Descripción |
|---|---|---|---|
| id | UUID | Sheets | Identificador |
| code_hash | SHA-256 | Sheets | Hash con pepper del código; nunca el código plano |
| user_id | UUID/string | Sheets | Usuario asociado |
| role | enum | Sheets | Rol concedido |
| workspace_ids_json | JSON array | Sheets | Alcance de workspaces |
| project_ids_json | JSON array | Sheets | Alcance de proyectos |
| expires_at | datetime | Sheets | Vencimiento |
| status | enum | Sheets | active, revoked, expired |
| last_used_at | datetime | Sheets | Último intercambio |

## Server Session

| Campo | Tipo | Fuente | Descripción |
|---|---|---|---|
| id | UUID | Sheets | Identificador interno |
| session_hash | SHA-256 | Sheets | Hash con pepper del token de sesión |
| user_id | string | Sheets | Usuario |
| role | enum | Sheets | Rol |
| workspace_ids_json | JSON array | Sheets | Alcance |
| project_ids_json | JSON array | Sheets | Alcance |
| expires_at | datetime | Sheets | Vencimiento |
| status | enum | Sheets | active, revoked, expired |
| last_seen_at | datetime | Sheets | Última validación |

## Roles

`superadmin`, `workspace_admin`, `project_lead`, `collaborator`, `client`, `guest`.
