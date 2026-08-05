# PROJECT STATE

## Proyecto

WonkUp Workspace

## Fase actual

Entrega 11 — Entregables y aprobaciones en Firestore

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
- Entrega 10 — Kanban colaborativo en Firestore, incluido Hotfix 10.0.1.

## Construido en Entrega 11

- `deliverableMode: 'hybrid'`.
- Adaptador de entregables Firestore sobre el singleton Firebase validado.
- Entregables bajo cada proyecto.
- Creación, edición, versiones, checklist, comentarios, revisión, aprobación y solicitud de cambios.
- Portal del Cliente conectado a la misma fuente Firestore.
- Sincronización en tiempo real entre navegadores.
- Notificaciones para equipo, clientes y revisores.
- Visibilidad interna y cliente protegida mediante reglas.
- Archivo lógico y restauración.
- Migración idempotente desde Cloud Foundation.
- Respaldo, simulación, confirmación visible y verificación.
- Reportes compatibles con listados proyecto por proyecto.

## Fuente de datos

| Dominio | Cuenta Firebase | Código demo |
|---|---|---|
| Acceso | Firebase Authentication | Adaptador mock |
| Proyectos | Cloud Firestore | localStorage |
| Kanban | Cloud Firestore | localStorage |
| Entregables | Cloud Firestore | localStorage |
| Canvas | localStorage | localStorage |
| Finanzas | localStorage | localStorage |

## Condición de cierre

La Entrega 11 se cierra después de:

1. publicar las reglas Firestore 11;
2. migrar y verificar los entregables;
3. validar creación, edición, versiones, checklist, archivo y restauración;
4. validar comentarios y estados entre dos navegadores;
5. confirmar aprobación y solicitud de cambios con una cuenta cliente;
6. confirmar notificaciones;
7. confirmar que los códigos demo conservan los datos locales.
