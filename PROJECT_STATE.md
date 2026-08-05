# PROJECT STATE

## Proyecto

WonkUp Workspace

## Fase actual

Entrega 9 — Cloud Foundation

## Estado

CÓDIGO LISTO / CONEXIÓN FIREBASE EN CONFIGURACIÓN

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

## Construido en Entrega 9

- Firebase Web SDK mediante módulos ESM sin build tool.
- Acceso híbrido con códigos demo y Firebase Authentication.
- Adaptador Firestore para workspaces, clientes, personas y proyectos.
- Reglas por UID, workspace, proyecto y rol.
- Cloud Foundation para diagnóstico técnico.
- Respaldo JSON antes de migrar.
- Simulación, migración idempotente y verificación.
- Auditoría de migraciones.
- Activación de usuarios reales con mínimo privilegio.
- Protección de los códigos demo mediante `projectMode: 'hybrid'`.
- Inicio resiliente que reemplaza pantallas en blanco por diagnóstico visible.
- App Check y persistencia en disco preparados, pero desactivados.

## Fuente de datos al instalar

- Acceso: mock.
- Proyectos: mock.
- Kanban: mock.
- Canvases: mock.
- Entregables: mock.
- Finanzas: mock.
- Reportes: agregación local.
- Cloud Foundation: diagnóstico.

## Fuente de datos después de validar Firebase

- Acceso: híbrido.
- Proyectos: híbrido.
- Sesiones Firebase: Firestore.
- Sesiones por código: mock local.
- Kanban, Canvas, Entregables y Finanzas: mock hasta su migración específica.

## Condición de cierre

La fase se cierra después de configurar el proyecto Firebase, publicar reglas, migrar los datos seleccionados, activar al menos dos cuentas y validar el mismo proyecto desde dos dispositivos.
