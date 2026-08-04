# Changelog

## 0.4.1 — Ajuste 4.1: usabilidad y Kanban configurable

### Añadido
- Restauración y eliminación controlada de tarjetas archivadas.
- Configuración visual de columnas y límites WIP.
- Plantillas Kanban de 4, 5, 6 y 9 columnas.
- Edición, archivo, restauración y eliminación controlada de clientes.
- Buscador global con `Ctrl + K` y `Cmd + K`.
- Notificaciones locales y contador de no leídas.
- Gestión centralizada de popovers y menús.

### Corregido
- Iconos sobredimensionados en Tema, Crear y Cerrar sesión.
- Superposición entre menús del encabezado.
- Botón de menú lateral sin función en determinadas resoluciones.
- Campana y lupa sin comportamiento.

### Cambiado
- Las nueve columnas dejan de ser obligatorias.
- La configuración del tablero deja de depender de editar código.
- La versión cambia a `0.4.1-usability`.

## 0.4.0 — Entrega 4: Kanban

### Añadido
- Tablero funcional por proyecto con nueve columnas estándar.
- CRUD lógico de tarjetas y archivo no destructivo.
- Drag and drop y reordenamiento dentro de columnas.
- Límites WIP con bloqueo de movimientos excedidos.
- Filtros por texto, responsable, prioridad y etiqueta.
- Checklist, comentarios, dependencias e historial.
- Registro de horas estimadas y reales por tarjeta.
- Indicadores de avance, retrasos y carga de horas.
- Persistencia local y sincronización entre pestañas.
- `KanbanService` con adaptadores mock y Firebase.
- Configuración pública en `runtime-config.js`.
- Reglas iniciales de Firestore y Realtime Database.

### Seguridad
- Validación de alcance por workspace y proyecto.
- Edición limitada a roles internos.
- Firebase preparado para custom tokens y documentos de membresía.
- Tarjetas archivadas en vez de eliminadas físicamente.

### Cambiado
- El Kanban demostrativo fue reemplazado por un módulo operativo.
- La versión de la aplicación cambia a `0.4.0-kanban`.

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
