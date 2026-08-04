# PROJECT STATE

## Proyecto
WonkUp Workspace

## Fase actual
Entrega 3 — Proyectos y Google Drive

## Estado
Completada técnicamente y pendiente de validación del usuario.

## Entregas
- Entrega 0 — Blueprint: APROBADA
- Entrega 1 — Núcleo visual: APROBADA
- Entrega 2 — Workspaces y acceso: APROBADA
- Entrega 3 — Proyectos y Drive: EN REVISIÓN

## Implementado
- CRUD lógico de proyectos: crear, consultar, editar y archivar.
- Códigos correlativos por workspace.
- Persistencia local demostrativa.
- Adaptador real para Apps Script.
- Ficha de proyecto ampliada.
- Clientes por workspace.
- Equipo por proyecto.
- Recursos vinculados.
- Hitos demostrativos.
- Estructura estándar de Google Drive.
- Creación real de carpetas mediante Apps Script.
- Auditoría de acciones críticas en Apps Script.
- Validación de roles en frontend y backend.

## Decisiones
- No se elimina físicamente un proyecto; se archiva.
- El modo `mock` permite validar la UX sin configurar servicios externos.
- En modo real, Sheets es la fuente de verdad para proyectos, clientes, equipo y recursos.
- Drive conserva permisos privados por defecto.
- Solo superadministrador y administrador de workspace crean o archivan proyectos.
- El líder de proyecto puede editar los proyectos que tiene autorizados.

## Pendientes conocidos
- Los hitos todavía no tienen formulario CRUD.
- El modo mock no comparte cambios entre dispositivos.
- Kanban real corresponde a la Entrega 4.
- Canvases colaborativos corresponden a la Entrega 5.
- Portal del cliente y entregables corresponden a la Entrega 6.

## Próxima entrega
Entrega 4 — Kanban colaborativo con Firebase.
