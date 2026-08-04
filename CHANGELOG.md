# Changelog

## 0.3.1 — Ajustes de Entrega 3

### Añadido
- Portada horizontal opcional por URL o ruta `assets/...`.
- Color de marca por proyecto y fallback visual sin imagen.
- Logo compacto integrado en el hero del proyecto.
- Acción **Restaurar** en proyectos archivados.
- Registro de estado previo, archivo y restauración.
- Endpoint `projects.restore` en Google Apps Script.

### Corregido
- Tamaño del icono “Volver a proyectos”, que podía ocupar gran parte de la cabecera.
- Jerarquía visual y comportamiento responsive de la ficha del proyecto.

## 0.3.0 — Entrega 3

### Añadido
- Servicio de proyectos con adaptadores mock y Apps Script.
- Creación, edición y archivo lógico de proyectos.
- Formulario completo de proyecto.
- Generación automática de códigos por workspace.
- Directorio y alta de clientes.
- Pestañas funcionales de cronograma, documentos, equipo y configuración.
- Registro y retiro de recursos.
- Asignación y retiro de miembros.
- Estructura documental simulada en modo mock.
- Creación real de carpetas en Google Drive mediante Apps Script.
- Endpoints para proyectos, clientes, miembros, recursos, hitos y Drive.
- Nuevas hojas del Sheets maestro.

### Cambiado
- El Dashboard y el portafolio consumen `ProjectService`.
- El botón rápido “Nuevo proyecto” abre el flujo funcional.
- La navegación de Clientes dejó de ser una pantalla provisional.
- Las reglas de permisos se ampliaron para edición, equipo y recursos.

### Seguridad
- Roles validados nuevamente en Apps Script.
- Proyectos archivados en vez de eliminados.
- URLs limitadas a HTTP/HTTPS.
- Drive no publica carpetas automáticamente.

## 0.2.0 — Entrega 2
- Acceso mediante códigos, sesiones, roles y workspaces.

## 0.1.0 — Entrega 1
- Núcleo visual navegable.
