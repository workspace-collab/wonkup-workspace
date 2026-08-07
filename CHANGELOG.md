## 12.0.1 — Canvas Engine colaborativo en Firebase

- Se activó `canvasMode: hybrid`.
- Las cuentas Firebase usan Cloud Firestore y los códigos demo conservan `localStorage`.
- Se implementó `FirebaseCanvasAdapter` para canvases, notas, comentarios, historial, versiones y enlaces.
- Se incorporó sincronización en tiempo real con `onSnapshot`.
- Se habilitó presencia por pestaña en Realtime Database.
- Se añadieron snapshots públicos sanitizados con vencimiento y revocación.
- Los permisos del Canvas usan la membresía específica del proyecto.
- La eliminación física fue reemplazada por archivo lógico y trazabilidad.
- Se incorporó la Migración 12.1 con respaldo, simulación, confirmación y verificación.
- Se actualizaron reglas Firestore y Realtime Database.
- La Entrega 11 y el Hotfix 11.0.1 quedan aprobados y cerrados.
- Caché actualizada a 12.0.1.

## 11.0.1 — Hotfix de permisos y sincronización de entregables

- Los permisos usan el rol específico de cada proyecto.
- La sesión Firebase actualiza `projectRoles` desde las membresías reales.
- Las reglas distinguen miembros internos de revisor, cliente e invitado.
- Se agregó un reintento seguro para entregables visibles ante sesiones obsoletas.
- Caché actualizada a 11.0.1.

# Changelog

## Entrega 11 — Entregables y aprobaciones en Firestore

- Se activó `deliverableMode: hybrid`.
- Se incorporó `FirebaseDeliverableAdapter` reutilizando el singleton Firebase.
- Los entregables de cuentas reales se almacenan por proyecto en Cloud Firestore.
- Se añadieron versiones, checklist, comentarios, revisión, aprobación, solicitud de cambios, archivo y restauración en la nube.
- El Portal del Cliente utiliza la misma fuente Firestore y respeta la visibilidad del entregable.
- Se incorporó sincronización en tiempo real con `onSnapshot`.
- Se agregaron notificaciones para revisión, comentarios, aprobación y cambios solicitados.
- Se publicaron reglas específicas por rol, visibilidad y campos modificables.
- Se incorporó Migración 11.1 con respaldo, simulación, escritura idempotente y verificación.
- Se actualizó ReportService para agregar entregables proyecto por proyecto.
- Se versionaron los módulos y recursos locales en `11.0.1`.
- Canvas y Finanzas permanecen en modo local.

## Entrega 10 — Cierre y Hotfix 10.0.1

- Kanban Cloud validado entre cuentas y navegadores reales.
- Se corrigieron destinatarios de notificaciones para tarjetas sin responsable.
- Entrega 10 aprobada.

## Entrega 9 — Cloud Foundation

- Se incorporó Firebase Authentication con acceso por correo y contraseña.
- Se agregó modo híbrido para conservar los códigos demo durante la migración.
- Se incorporó Cloud Firestore como base operativa para workspaces, clientes, personas y proyectos.
- Se agregó adaptador Firebase para proyectos, miembros, recursos e hitos.
- Se publicaron reglas de seguridad por UID, workspace, proyecto y rol.
- Se añadió el módulo superadministrativo Cloud Foundation.
- Se agregó diagnóstico de configuración, SDK, Auth, perfil, Firestore, caché y App Check.
- Se incorporó respaldo JSON obligatorio antes de migrar.
- Se incorporó plan de migración determinista, simulación, lotes de 400, auditoría y verificación.
- Se agregó activación de usuarios reales por UID con mínimo privilegio.
- Se añadió configuración de App Check con reCAPTCHA Enterprise, desactivada por defecto.
- Se mantuvo la persistencia web en memoria por tratar datos sensibles.
- Se agregó un bootstrap resiliente que muestra diagnóstico ante errores de módulos.
- Se versionaron los recursos locales con `9.0.0` para evitar caché obsoleta en GitHub Pages.
- Kanban, Canvas, Entregables y Finanzas permanecen en modo mock.

## 0.4.2 - Ajuste 4.2: responsive, accesibilidad y endurecimiento UI

### Criticos corregidos
- Reflow de la ficha interna de proyecto sin propagacion de ancho minimo.
- Kanban embebido con overflow aislado, sin expandir toda la pagina.
- Focus trap, fondo inerte y restauracion del foco en modales.
- Colores de accion y textos secundarios ajustados a contraste WCAG AA.

### Accesibilidad
- Etiquetas programaticas para las busquedas.
- aria-invalid y aria-describedby en formularios de proyecto, cliente y acceso.
- aria-expanded, aria-controls y aria-current en menus, sidebar y tabs.
- Regiones live dedicadas para estados y alertas.
- Objetivos tactiles ampliados y checkboxes de 24 px.
- Jerarquia de encabezados mejorada.
- Soporte para prefers-reduced-motion.

### Responsive y Kanban
- Acceso principal colocado antes de los beneficios en movil.
- Hero y tabs antes de la informacion administrativa del proyecto.
- Vista lista de Kanban, contador de columnas, scroll-snap y controles laterales.
- Toolbars y grids preparados para zoom de texto y pantallas estrechas.

### Sistema visual y UX
- Tokens semanticos de color, tipografia, radios y tamanos de control.
- Contraste reforzado en tema oscuro, badges, avatares y notificaciones.
- Prioridades y salud del proyecto localizadas al español.
- Modulos futuros marcados como Proximamente.
- Acciones rapidas limitadas a flujos funcionales.
- Etiquetas internas de entregas retiradas de la interfaz.

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

## Ajuste 5.1 - Canvases especializados y colaboración mejorada

- Se incorporaron layouts metodológicos específicos para BMC, Lean Canvas, Mapa de Empatía, Propuesta de Valor y Matriz de Priorización.
- Se conservó la estructura del Pitch Canvas.
- Se corrigieron los flujos Agregar nota y Abrir canvas.
- Se reemplazó el avance genérico por una fórmula 70/30 basada en cobertura y profundidad.
- Se agregaron Modo enfoque y Pantalla completa.
- Se añadieron enlaces con vencimiento flexible, QR, copia con fallback, listado y revocación.
- Se añadió exportación A4 horizontal en modo resumen y detalle.
- Se incorporaron snapshots, puntos de control y restauración de versiones para superadministrador.

## Ajuste 5.2 - Estabilidad del Canvas Engine

- Se corrigió la capa de modales y toasts en pantalla completa.
- Fullscreen ahora usa un contenedor estable y soporta rerender sin cerrarse.
- Se simplificó el formulario Nueva nota.
- Se recuperó la edición mediante el botón de lápiz.
- Se eliminaron recargas locales duplicadas durante drag and drop.
- Se añadió confirmación visible al copiar enlaces.
- Se incorporó ampliación de QR con código y URL.
- Punto de control incrementa correctamente la versión.
- Restaurar versión mantiene abierto el canvas.
- Se incorporó un TIMER de ideación para pantalla completa.

## Ajuste 5.3 - Estabilidad de drag, copia y fullscreen

- Se compactó la cabecera del editor en pantalla completa.
- Se corrigió la confirmación asíncrona del botón Copiar enlace del QR ampliado.
- Se añadió feedback persistente de copia dentro del modal.
- Se eliminó el rerender completo después de mover una nota.
- Se añadió protección contra el clic residual posterior al drag.
- Se actualizan métricas y versión sin destruir el lienzo.

## Ajuste 5.4 - Estabilidad transaccional del Canvas Engine

- Se eliminó la reconstrucción completa del editor después de mutaciones de notas.
- Se incorporó actualización parcial del workspace del canvas.
- Se reemplazó el enlace de retorno por navegación explícita controlada.
- Se añadió un guard del router para bloquear salidas accidentales durante mutaciones y drag.
- Se corrigió el estado inconsistente URL/canvas provocado por `history.replaceState`.
- Se reforzó creación, edición, comentarios, eliminación, restauración y movimiento de notas.

## Ajuste 5.5 - Corrección raíz del Canvas Engine

- Corregido error asíncrono de restauración de foco en modales.
- Eliminadas guardas temporales de navegación y manipulación de hash.
- Arrastre limitado a un asa explícita del post-it.
- Flujo de guardado y renderizado estabilizado.
- Prueba automatizada de 20 altas y 20 movimientos sin salidas de ruta.

## Ajuste 5.6 - Reconstrucción estable del Canvas Engine

- Se trabajó sobre el ZIP real publicado después del Ajuste 5.5.
- Se eliminó el reemplazo de `innerHTML` del workspace durante altas, ediciones y movimientos.
- Se añadió `CanvasWorkspaceController` con delegación de eventos y actualización incremental del DOM.
- Las notas nuevas se insertan sin destruir las existentes.
- Las notas editadas se actualizan de manera localizada.
- El movimiento traslada el mismo nodo y revierte el cambio si falla la persistencia.
- Se aisló cada ruta mediante un `route-host` independiente.
- Se impidió que respuestas asíncronas de rutas anteriores sobrescriban la vista activa.
- Se añadieron ciclos de limpieza para Canvas, Toolkit y Kanban.
- El adaptador mock diferencia mutaciones locales y sincronización entre pestañas.
- Se corrigieron errores secundarios en fallbacks de imágenes.
- Se añadió identificación visible `Motor 5.6.0`.
- Se añadió una prueba Chromium de la aplicación completa con 20 altas y 20 movimientos sin cambios de ruta ni errores.

## Ajuste 5.7 - Interacción ágil del Canvas Engine

- Compartir reutiliza o genera automáticamente un enlace principal.
- Vigencia y administración de enlaces se movieron a opciones secundarias.
- Imprimir / PDF abre directamente el diálogo del navegador.
- Las notas se crean inline dentro de la sección.
- Colores y eliminación aparecen al pasar el mouse o enfocar la nota.
- Se retiró el nombre permanente del color en los post-its.
- El menú de tres puntos conserva edición, comentarios, vinculación y Kanban.
- La pantalla completa nativa se reemplazó por modo inmersivo controlado.
- Escape cierra primero el diálogo y conserva la vista ampliada.

## Ajuste 5.8 - Encabezado de marca, sidebar y paleta de notas

- Se convirtió el encabezado del canvas en un banner compacto basado en el color de marca del proyecto.
- Se combinó el color del proyecto con el color metodológico de cada canvas.
- El botón de tres líneas ahora colapsa el menú lateral también en escritorio.
- La preferencia del sidebar se conserva localmente.
- Se retiró el botón Modo enfoque del Canvas Engine.
- El detalle de nota muestra una paleta visual con nombre y código hexadecimal.
- El timer ahora emite tres tonos, muestra una alerta y mantiene vibración compatible al finalizar.
- Se añadió identificación visible `Motor 5.8.0`.

## Ajuste 5.9 - Selector compacto de color

- Se reemplazó la cuadrícula de seis colores del detalle de nota por un selector compacto tipo Color de marca.
- Se añadió soporte para colores personalizados en formato hexadecimal.
- El texto de la nota adapta automáticamente su contraste al color seleccionado.
- Los colores rápidos del post-it continúan disponibles y restablecen el preset elegido.
- Se actualizó la identificación visible a Motor 5.9.0.

## Entrega 6 - Portal del Cliente y Gestión de Entregables

- Se creó un portal de cliente por proyecto.
- Se agregó acceso directo para roles cliente e invitado.
- Se incorporaron entregables, versiones y checklist de aceptación.
- Se implementó el flujo borrador, revisión, cambios y aprobación.
- Se habilitaron comentarios del cliente y del equipo.
- Se añadieron archivo y restauración de entregables.
- Se incorporó una vista cliente para usuarios internos.
- Se amplió la búsqueda global para incluir entregables.
- Se añadió sincronización local entre pestañas.

## Entrega 7 - Finanzas, horas y rentabilidad

- Se agregó la pestaña Finanzas dentro de los proyectos.
- Se implementó configuración comercial y presupuesto interno.
- Se incorporaron ingresos, pagos y saldos.
- Se incorporaron costos directos y comprobantes.
- Se agregó registro manual de horas.
- Se agregó temporizador persistente.
- Se incorporaron tarifas internas y facturables.
- Se calcularon costo real, utilidad y margen.
- Se agregaron alertas financieras.
- Se aplicaron permisos diferenciados por rol.
- El módulo se carga dinámicamente para aislar fallos del núcleo.
- Se prepararon adaptadores para Apps Script y Firebase.

## Entrega 8 - Dashboard ejecutivo y reportes

- Se convirtió el Dashboard en una vista ejecutiva consolidada.
- Se habilitó el módulo Reportes en el menú lateral.
- Se agregaron filtros por periodo y estado.
- Se incorporó comparación de proyectos, riesgos y vencimientos.
- Se agregó reporte de entregables.
- Se agregó reporte financiero restringido a administradores.
- Se incorporaron tendencias de ingresos, costos y horas.
- Se habilitó exportación CSV e impresión/PDF A4 horizontal.
- Se añadió actualización automática frente a cambios de Finanzas y Entregables.
- Se agregó `reportMode: aggregate` a la configuración pública.

## Ajuste 8.1 - Altas rápidas contextuales

- Se añadió `+ Nuevo cliente` dentro del formulario de proyecto.
- El cliente se crea sin cerrar el modal principal y queda seleccionado automáticamente.
- Se añadió `+ Nueva persona` dentro del formulario de asignación de equipo.
- La persona se registra en el workspace, queda seleccionada y puede asignarse inmediatamente.
- Se incorporó persistencia local de personas creadas y validación de correos duplicados.
- Se añadió el contrato `users.create` para Google Apps Script.
- Se corrigió el fallback sintáctico del Portal del Cliente para evitar pantallas en blanco en paquetes completos.
- Se actualizó el versionado de caché a `8.1.0`.

## Entrega 9 - Cloud Foundation

- Se conectó Firebase Authentication mediante cuentas reales.
- Se publicó el modelo de reglas por UID, workspace, proyecto y rol.
- Se migraron workspaces, clientes, personas, proyectos y membresías.
- Se habilitó el modo híbrido para conservar los códigos demo.
- Se añadió respaldo, simulación, migración y verificación sin terminal.
- Se validó persistencia entre navegadores y usuarios con alcance limitado.

## Entrega 10 - Kanban colaborativo en Firestore

- Se activó `kanbanMode: hybrid`.
- Se reemplazó el adaptador Firebase heredado por un adaptador sobre el singleton validado.
- Se incorporaron tableros y tarjetas por proyecto en Cloud Firestore.
- Se habilitaron creación, edición, movimiento, checklist, comentarios, archivo, restauración y eliminación autorizada.
- Se añadieron columnas configurables, límites WIP y plantillas.
- Se agregó sincronización en tiempo real mediante listeners de Firestore.
- Se añadió actividad por proyecto y notificaciones por usuario.
- Se incorporó el rol revisor para lectura y comentarios sin edición operativa.
- Se añadió una migración Kanban controlada, idempotente y verificable en Cloud Foundation.
- Se dividieron movimientos y migraciones en lotes pequeños compatibles con las reglas.
- Se actualizó el esquema y el versionado de caché a `10.0.0`.

## 10.0.1 — Hotfix de notificaciones Kanban

- Se corrigió el envío de comentarios en tarjetas sin responsable ni participantes.
- Se incorporaron como destinatarios el creador y los comentaristas previos.
- Se añadió fallback a miembros Firebase activos del proyecto.
- Se reforzó el vínculo de personas con cuentas Firebase por UID, persona y correo.
- Se añadieron metadatos de creación a las tarjetas nuevas.
- Se actualizó la cadena de caché del Kanban y la campana a 10.0.1.

## 12.0.1 — Hotfix de asignaciones dinámicas y acceso compartido al Canvas

- Se corrigió la visibilidad de canvases para usuarios asignados a proyectos creados directamente en Firestore.
- Se añadió `users/{uid}/projectAssignments/{projectId}` como índice de asignaciones dinámicas.
- La asignación de equipo escribe de forma atómica la membresía del proyecto y el índice del usuario.
- La retirada de un miembro inactiva ambos registros.
- La sesión Firebase combina alcances históricos e índices dinámicos antes de calcular permisos.
- Cloud Foundation crea el índice al activar nuevas cuentas.
- Innovation Toolkit diferencia entre canvases del proyecto y canvases accesibles del workspace.
- Se actualizó la caché del frontend a `12.0.1`.


## 12.2.0 — Usuarios e invitaciones desde WonkUp

- Se añadió la ruta exclusiva `#/master/users`.
- Se incorporó un directorio de cuentas con estados activo, invitado e inactivo.
- Se agregó creación de identidades mediante Cloud Functions y Firebase Admin SDK.
- Se habilitó el correo para que cada usuario defina su propia contraseña.
- Se incorporó edición de rol, workspaces y proyectos.
- Se habilitaron desactivación, reactivación y reenvío de acceso.
- Se protegieron las cuentas superadministradoras contra cambios desde el módulo.
- Se añadió auditoría administrativa en Firestore.
- Se conservó la activación manual por UID como contingencia.
- Se agregó `Actualizar aplicación` al menú del perfil.
- Se actualizó la cadena de caché a `12.2.0`.

## 12.3.0 — Acceso personalizado y colaboración en Canvas

- Se añadieron permisos por persona: lector, comentarista y editor.
- Se incorporó administración de personas desde el modal Compartir del Canvas.
- Los enlaces personalizados requieren una Cuenta WonkUp activa y validan el UID autorizado.
- Los editores pueden crear, editar, mover y archivar notas en tiempo real.
- Los comentaristas pueden consultar y comentar sin modificar las notas.
- Los lectores acceden en vivo sin permisos de escritura.
- Se añadieron vencimiento, reactivación, cambio de permiso y revocación inmediata.
- Se conservaron los enlaces públicos anónimos como solo lectura.
- Se impidió que un acceso personalizado se copie a la colección pública sanitizada.
- Se incorporaron cinco Cloud Functions y reglas Firestore de mínimo privilegio.
- Se actualizó la cadena de caché a `12.3.0`.
