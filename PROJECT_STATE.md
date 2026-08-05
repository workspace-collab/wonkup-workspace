# PROJECT STATE

## Proyecto

WonkUp Workspace

## Fase actual

Entrega 10 — Kanban colaborativo en Firestore

## Estado

CÓDIGO LISTO / VALIDACIÓN EN FIREBASE REAL PENDIENTE

## Fases cerradas

- Entrega 0 — Blueprint.
- Entrega 1 — Núcleo visual.
- Entrega 2 — Workspaces y acceso.
- Entrega 3 — Proyectos, clientes y Google Drive.
- Entrega 4 — Kanban funcional.
- Entrega 5 — Innovation Toolkit y Canvas Engine, incluido Ajuste 5.9.
- Entrega 6 — Portal del cliente y entregables, incluido Hotfix 6.0.3.
- Entrega 7 — Finanzas, horas y rentabilidad.
- Entrega 8 — Dashboard ejecutivo y reportes.
- Ajuste 8.1 — Altas rápidas de clientes y personas.
- Entrega 9 — Cloud Foundation, Authentication, Firestore, migración del núcleo y permisos reales.

## Construido en Entrega 10

- `kanbanMode: 'hybrid'`.
- Adaptador Kanban Firestore sobre el singleton Firebase validado.
- Tableros y tarjetas bajo cada proyecto.
- Creación, edición, movimiento, checklist, comentarios, archivo y restauración.
- Configuración de columnas, WIP y plantillas.
- Sincronización en tiempo real entre navegadores.
- Actividad inmutable por proyecto.
- Notificaciones Firestore por usuario.
- Rol revisor con lectura y comentarios sin edición operativa.
- Migración Kanban idempotente desde Cloud Foundation.
- Respaldo, simulación, confirmación visible y verificación.
- Lotes pequeños compatibles con reglas Firestore.

## Fuente de datos

| Dominio | Cuenta Firebase | Código demo |
|---|---|---|
| Acceso | Firebase Authentication | Adaptador mock |
| Proyectos | Cloud Firestore | localStorage |
| Kanban | Cloud Firestore | localStorage |
| Canvas | localStorage | localStorage |
| Entregables | localStorage | localStorage |
| Finanzas | localStorage | localStorage |

## Condición de cierre

La Entrega 10 se cierra después de:

1. publicar las reglas Firestore 10;
2. migrar y verificar el Kanban;
3. validar crear, mover, comentar, checklist, archivo y restauración;
4. confirmar sincronización entre dos navegadores;
5. confirmar notificaciones;
6. validar un usuario revisor.
