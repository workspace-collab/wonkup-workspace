# Test Checklist - Ajuste 4.2

## Condición de salida

- [ ] Cero desbordamiento horizontal del documento en los cinco breakpoints.
- [ ] Cero hallazgos críticos abiertos.
- [ ] Cero hallazgos altos abiertos.
- [ ] Contraste WCAG 2.2 AA en tema claro y oscuro.
- [ ] Navegación completa con teclado.
- [ ] Reflow funcional con texto al 200 %.
- [ ] Las acciones visibles ejecutan una función real o aparecen deshabilitadas como Próximamente.

## Matriz de resoluciones

Ejecutar cada flujo en:

- [ ] 320 x 700 px.
- [ ] 390 x 844 px.
- [ ] 768 x 1024 px.
- [ ] 1280 x 800 px.
- [ ] 1440 x 1000 px.

## P0 - Responsive y reflow

- [ ] La ficha interna de proyecto no amplía el ancho del documento.
- [ ] El hero del proyecto aparece antes de la información administrativa en móvil.
- [ ] Las pestañas se desplazan dentro de su propio contenedor.
- [ ] La pestaña activa se desplaza hasta quedar visible.
- [ ] El Kanban embebido no amplía la página.
- [ ] El scroll horizontal queda contenido dentro del tablero.
- [ ] En móvil, Kanban inicia en vista lista.
- [ ] La vista tablero muestra señal de más columnas, contador y controles de desplazamiento.
- [ ] El formulario de acceso aparece antes de los beneficios en móvil.
- [ ] Proyectos y Clientes no generan overflow a 320 px.
- [ ] Toolbars y controles permiten wrap con texto al 200 %.

## P0 - Modales y foco

Probar Nuevo proyecto, Editar proyecto, Nueva tarjeta, Detalle de tarjeta, Configurar tablero, Archivadas, Clientes y confirmaciones.

- [ ] El foco inicial llega al primer campo significativo.
- [ ] Tab no permite salir del modal.
- [ ] Shift + Tab no permite salir del modal.
- [ ] Escape cierra el modal.
- [ ] El fondo no recibe interacción mientras el modal está abierto.
- [ ] Al cerrar, el foco regresa al botón disparador.
- [ ] Título y descripción del diálogo tienen asociación ARIA.

## P0 - Contraste y tema

- [ ] El botón primario con texto blanco utiliza el azul accesible.
- [ ] El cielo WonkUp se usa como marca o fondo decorativo, no como fondo de texto blanco pequeño.
- [ ] Texto normal alcanza 4.5:1.
- [ ] Texto grande alcanza 3:1.
- [ ] Texto secundario y muted es legible.
- [ ] Badges de éxito, advertencia, error e información son legibles.
- [ ] El globo de notificaciones es legible.
- [ ] Hover, focus, active y disabled mantienen contraste.
- [ ] Tema oscuro conserva contraste en Dashboard, Proyectos, Proyecto y Kanban.

## P1 - Formularios y nombres accesibles

- [ ] Búsqueda global tiene nombre accesible específico.
- [ ] Búsqueda de proyectos tiene nombre accesible específico.
- [ ] Búsqueda de clientes tiene nombre accesible específico.
- [ ] Búsqueda Kanban tiene nombre accesible específico.
- [ ] Campos obligatorios incluyen `required` y `aria-required`.
- [ ] Campos inválidos incluyen `aria-invalid=true`.
- [ ] Cada error está asociado mediante `aria-describedby`.
- [ ] El foco se dirige al primer error del formulario.
- [ ] Los mensajes globales se anuncian en una región dedicada.

## P1 - Menús y navegación

- [ ] Crear, Tema, Notificaciones, Perfil y menú móvil actualizan `aria-expanded`.
- [ ] Cada disparador tiene `aria-controls`.
- [ ] Solo un menú puede permanecer abierto.
- [ ] Escape cierra el menú y restaura el foco.
- [ ] Clic exterior cierra el menú.
- [ ] El botón hamburguesa se oculta en escritorio.
- [ ] En móvil abre y cierra el sidebar.
- [ ] La pestaña activa usa `aria-current=page`.
- [ ] La jerarquía de encabezados no salta de h1 a h3.
- [ ] `#app` no usa `aria-live` global.

## P1 - Objetivos de interacción

- [ ] Ningún objetivo problemático mide menos de 24 x 24 CSS px.
- [ ] Acciones principales móviles miden al menos 44 x 44 px.
- [ ] Checkboxes y radios tienen un área de interacción suficiente.
- [ ] Tabs, icon buttons y enlaces frecuentes son cómodos al tacto.

## P1 - Fidelidad funcional

- [ ] La búsqueda global muestra resultados reales y permite navegar.
- [ ] Los resultados respetan workspace, proyecto y rol.
- [ ] Notificaciones abre un panel funcional.
- [ ] El contador representa solo notificaciones no leídas.
- [ ] Calendario, Equipo, Documentos, Reportes y Configuración se muestran como Próximamente y no como enlaces falsos.
- [ ] Nueva tarea abre un flujo real.
- [ ] Nueva proyecto abre un flujo real.
- [ ] Nueva canvas no se ofrece como acción operativa hasta que exista su flujo.

## Kanban

- [ ] Plantilla Básico genera 4 columnas.
- [ ] Plantilla Ágil genera 5 columnas.
- [ ] Plantilla Producto digital genera 6 columnas.
- [ ] Plantilla WonkUp completo genera 9 columnas.
- [ ] Se puede cambiar nombre, color, orden y límite WIP.
- [ ] No se desactiva una columna que contiene tarjetas.
- [ ] Límite WIP bloquea el exceso y explica el motivo.
- [ ] Crear, editar, mover y reordenar tarjeta funciona.
- [ ] Checklist, comentarios, historial, horas y dependencias funcionan.
- [ ] Archivar conserva columna y posición previas.
- [ ] Restaurar respeta el límite WIP.
- [ ] Vista lista y vista tablero mantienen el mismo contenido.

## Clientes y proyectos

- [ ] Crear, editar, archivar y restaurar proyecto funciona.
- [ ] Crear, editar, archivar y restaurar cliente funciona.
- [ ] La eliminación definitiva exige superadministrador.
- [ ] No se elimina un cliente con proyectos vinculados.
- [ ] Prioridades técnicas se muestran en español.
- [ ] Salud del proyecto incluye texto y no depende solo del color.

## Permisos

Ejecutar las pruebas con:

- [ ] `WONKUP-ADMIN`.
- [ ] `AGORA-ADMIN`.
- [ ] `TAXI-LIDER`.
- [ ] `TAXI-CLIENTE`.
- [ ] `HUELLITAS-INVITADO`.

Validar:

- [ ] No aparecen resultados de búsqueda no autorizados.
- [ ] Cambiar la URL no permite abrir otro workspace o proyecto.
- [ ] Cliente e invitado no reciben datos financieros ni controles internos.
- [ ] Líder solo opera los proyectos asignados.

## Movimiento y zoom

- [ ] `prefers-reduced-motion: reduce` desactiva animaciones no esenciales.
- [ ] El scroll no se fuerza de forma suave con movimiento reducido.
- [ ] Texto al 200 % no corta contenido ni crea scroll horizontal de documento.

## Regresión general

- [ ] Los códigos de acceso funcionan.
- [ ] Tema claro, oscuro y sistema funcionan.
- [ ] Sesión permanece al recargar.
- [ ] Cerrar sesión funciona y solicita confirmación.
- [ ] Dashboard, Proyectos, Clientes, Drive simulado y Kanban conservan la funcionalidad previa.
- [ ] No hay errores en la consola del navegador.
- [ ] `mode: 'mock'` y `kanbanMode: 'mock'` permanecen activos.
