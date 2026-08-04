# Diagnóstico del Ajuste 5.8

## Espacio superior

El encabezado anterior distribuía identidad y acciones en una misma fila alineada hacia abajo. Cuando había muchas acciones, el bloque del título se comprimía y el resto de la cabecera quedaba visualmente vacío.

Se cambió a una composición compacta de dos niveles dentro de un banner de marca. El color se obtiene de `project.brandColor` y se combina con `template.color`.

## Menú lateral

El botón de tres líneas solo se mostraba en resoluciones menores a 981 px. En escritorio no existía un control global para contraer el sidebar; por eso el Canvas Engine había incorporado un Modo enfoque separado.

Se creó un control único:

- móvil: modifica `sidebarOpen`;
- escritorio: modifica la clase `sidebar-collapsed` y persiste `wonkup.sidebar.collapsed`.

## Paleta de color

El detalle de la nota utilizaba un `select` textual. Se reemplazó por radios visuales con el mismo catálogo `CANVAS_NOTE_COLORS`, evitando duplicar la fuente de verdad.

## Timer

La versión 5.7 mostraba toast y vibración, pero no emitía sonido. En 5.8 se añadió Web Audio API. El contexto de audio se habilita al iniciar el temporizador mediante una interacción del usuario.
