# Data Dictionary — Entrega 3.1

## Project

| Campo frontend | Campo Sheets | Tipo | Obligatorio | Descripción |
|---|---|---|---:|---|
| id | id | UUID/string | Sí | Identificador técnico |
| workspaceId | workspace_id | string | Sí | Workspace propietario |
| clientId | client_id | string | No | Cliente vinculado |
| code | code | string | Sí | Código correlativo humano |
| name | name | string(120) | Sí | Nombre del proyecto |
| tagline | tagline | string(180) | No | Frase breve |
| description | description | string(2000) | No | Alcance y objetivo |
| status | status | enum | Sí | Estado operativo |
| stage | stage | enum | Sí | Etapa metodológica |
| priority | priority | enum | Sí | Prioridad |
| health | health | enum | Sí | green, amber o red |
| progress | progress | number 0–100 | Sí | Avance |
| ownerUserId | owner_user_id | string | Sí | Responsable |
| startDate | start_date | date ISO | No | Inicio |
| dueDate | due_date | date ISO | No | Entrega estimada |
| budget | budget | number | No | Presupuesto demostrativo |
| logo | logo_url | URL/ruta assets | No | Logotipo compacto del proyecto |
| coverImage | cover_image_url | URL/ruta assets | No | Portada horizontal del hero |
| brandColor | brand_color | HEX #RRGGBB | Sí | Color de fallback de la portada |
| statusBeforeArchive | status_before_archive | enum | No | Estado conservado antes de archivar |
| archivedAt | archived_at | datetime ISO | No | Fecha de archivo |
| archivedBy | archived_by | string | No | Usuario que archivó |
| restoredAt | restored_at | datetime ISO | No | Fecha de restauración |
| restoredBy | restored_by | string | No | Usuario que restauró |
| driveFolderId | drive_folder_id | string | No | ID de carpeta principal |
| driveUrl | drive_folder_url | URL | No | URL de Drive |
| githubUrl | github_url | URL | No | Repositorio |
| figmaUrl | figma_url | URL | No | Prototipo |
| hostingUrl | hosting_url | URL | No | Publicación |
| domain | domain | string | No | Dominio asociado |

## Client

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID/string | Identificador |
| workspaceId | string | Workspace propietario |
| name | string | Nombre comercial o persona |
| contactName | string | Contacto principal |
| email | email | Correo |
| phone | string | Teléfono |
| status | enum | active o inactive |

## Project Member

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID/string | Identificador de asignación |
| projectId | string | Proyecto |
| userId | string | Usuario |
| role | enum | project_lead, collaborator o reviewer |
| allocation | number 0–100 | Dedicación estimada |
| status | enum | active o inactive |

## Resource

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID/string | Identificador |
| projectId | string | Proyecto |
| type | enum | document, prototype, github, website, other |
| name | string | Nombre visible |
| url | URL HTTP/HTTPS | Enlace |
| visibility | enum | internal, client, restricted |
| status | enum | active o inactive |

## Milestone

| Campo | Tipo | Descripción |
|---|---|---|
| id | UUID/string | Identificador |
| projectId | string | Proyecto |
| name | string | Nombre del hito |
| dueDate | date | Fecha |
| status | enum | planned, active, completed |
| visibility | enum | internal o client |

## Drive Folder

| Campo | Tipo | Descripción |
|---|---|---|
| drive_id | string | ID de Google Drive |
| workspace_id | string | Workspace |
| project_id | string | Proyecto |
| folder_type | string | Tipo de carpeta |
| url | URL | Enlace a Drive |
