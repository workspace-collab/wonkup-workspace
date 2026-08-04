# PROJECT STATE

## Proyecto
WonkUp Workspace

## Fase actual
Entrega 4 — Kanban funcional y colaboración preparada para Firebase

## Estado
Construcción técnica completada. Pendiente de validación del usuario en GitHub Pages.

## Entregas
- Entrega 0 — Blueprint: APROBADA
- Entrega 1 — Núcleo visual: APROBADA
- Entrega 2 — Workspaces y acceso: APROBADA
- Entrega 3 — Proyectos y Drive: APROBADA
- Entrega 4 — Kanban: EN REVISIÓN

## Implementado en Entrega 4
- Tablero por proyecto con nueve columnas estándar.
- Creación, edición, movimiento y archivo lógico de tarjetas.
- Drag and drop entre columnas y reordenamiento interno.
- Límites WIP por columna con validación.
- Búsqueda y filtros por responsable, prioridad y etiqueta.
- Responsable, participantes, fechas, horas, etiquetas, visibilidad y dependencias.
- Checklist interactiva.
- Comentarios por tarjeta.
- Historial de cambios por tarjeta.
- Indicadores de tarjetas, completadas, atrasadas y horas.
- Persistencia en `localStorage` en modo demo.
- Sincronización entre pestañas mediante `BroadcastChannel`.
- Adaptador preparado para Firestore y reglas iniciales de seguridad.
- Configuración pública separada en `js/config/runtime-config.js`.

## Decisiones
- El modo predeterminado sigue siendo `mock` hasta configurar Firebase Authentication mediante custom tokens.
- Los clientes e invitados no acceden al Kanban en el MVP actual.
- Las tarjetas se archivan; no se eliminan físicamente.
- Los límites WIP se validan antes de aceptar un movimiento.
- Los comentarios, checklist e historial se almacenan dentro de la tarjeta durante el MVP.
- Firebase requiere documentos de membresía por workspace y proyecto.

## Pendientes conocidos
- Activar Firebase real requiere crear el proyecto, publicar reglas y completar el Access Broker en Apps Script.
- La presencia de usuarios conectados se implementará junto con la colaboración avanzada.
- Los adjuntos binarios seguirán en Google Drive; el Kanban solo almacenará referencias.
- El portal del cliente y entregables corresponden a la Entrega 6.

## Próxima entrega
Entrega 5 — Innovation Toolkit y Canvas Engine.
