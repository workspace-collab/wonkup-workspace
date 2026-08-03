# DATA DICTIONARY - DEMO

## Workspace

| Campo | Tipo | Descripcion |
|---|---|---|
| id | string | Identificador estable del workspace |
| code | string | Codigo humano |
| name | string | Nombre visible |
| shortName | string | Nombre corto |
| description | string | Descripcion |
| color | string | Color identificador |
| logo | string | Ruta del logotipo |
| status | string | Estado |

## Project

| Campo | Tipo | Descripcion |
|---|---|---|
| id | string | Identificador estable |
| code | string | Codigo humano |
| workspaceId | string | Workspace propietario |
| name | string | Nombre del proyecto |
| tagline | string | Mensaje corto |
| description | string | Descripcion ejecutiva |
| status | string | Estado operativo |
| stage | string | Etapa metodologica |
| priority | string | Prioridad |
| health | string | Salud green, amber o red |
| progress | number | Porcentaje de avance |
| owner | string | Responsable demo |
| client | string | Cliente demo |
| startDate | date | Fecha inicial ISO |
| dueDate | date | Fecha final ISO |
| budget | number | Presupuesto demo |
| cost | number | Costo demo |
| hours | number | Horas demo |
| pendingTasks | number | Tareas pendientes |
| logo | string | Ruta de imagen |

## Task y Activity

Son entidades demostrativas. Sus contratos definitivos se definiran al conectar Apps Script y Firebase.
