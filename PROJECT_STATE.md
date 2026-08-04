# PROJECT STATE

## Proyecto
WonkUp Workspace

## Fase actual
Entrega 3 — Proyectos y Google Drive

## Estado
Ajuste 3.1 completado técnicamente y pendiente de validación del usuario.

## Entregas
- Entrega 0 — Blueprint: APROBADA
- Entrega 1 — Núcleo visual: APROBADA
- Entrega 2 — Workspaces y acceso: APROBADA
- Entrega 3 — Proyectos y Drive: EN REVISIÓN

## Implementado
- CRUD lógico de proyectos: crear, consultar, editar, archivar y restaurar.
- Códigos correlativos por workspace.
- Persistencia local demostrativa.
- Adaptador real para Apps Script.
- Ficha de proyecto ampliada con portada horizontal configurable por URL y logo compacto.
- Clientes por workspace.
- Equipo por proyecto.
- Recursos vinculados.
- Hitos demostrativos.
- Estructura estándar de Google Drive.
- Creación real de carpetas mediante Apps Script.
- Auditoría de acciones críticas en Apps Script.
- Validación de roles en frontend y backend.

## Decisiones
- No se elimina físicamente un proyecto; se archiva y puede restaurarse al estado previo.
- El modo `mock` permite validar la UX sin configurar servicios externos.
- En modo real, Sheets es la fuente de verdad para proyectos, clientes, equipo y recursos.
- Drive conserva permisos privados por defecto.
- Solo superadministrador y administrador de workspace crean o archivan proyectos.
- El líder de proyecto puede editar los proyectos que tiene autorizados.

## Ajuste 3.1
- Se corrigió el tamaño descontrolado del icono de regreso.
- Se reemplazó la cabecera plana por un hero horizontal responsive.
- Se añadieron `coverImage` y `brandColor`.
- Se añadió restauración desde la lista y desde Configuración.
- Se registran estado previo, fechas y usuarios de archivo/restauración.

## Pendientes conocidos
- Los hitos todavía no tienen formulario CRUD.
- El modo mock no comparte cambios entre dispositivos.
- Kanban real corresponde a la Entrega 4.
- Canvases colaborativos corresponden a la Entrega 5.
- Portal del cliente y entregables corresponden a la Entrega 6.

## Próxima entrega
Entrega 4 — Kanban colaborativo con Firebase.
