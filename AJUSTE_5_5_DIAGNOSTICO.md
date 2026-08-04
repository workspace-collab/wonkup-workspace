# DIAGNÓSTICO TÉCNICO - Canvas Engine 5.5

## Error reproducido

```text
TypeError: Cannot read properties of null (reading 'focus')
```

Origen: `js/components/modal.js`, restauración asíncrona del foco después de cerrar un modal.

## Por qué era intermitente

El error dependía del orden entre:

- el cierre del modal;
- el reemplazo del contenido del canvas;
- el siguiente `requestAnimationFrame`;
- el estado del elemento que abrió el modal.

Por eso podía funcionar algunas veces y fallar en otras.

## Riesgo adicional eliminado

La versión anterior intentaba evitar salidas accidentales manipulando el hash y bloqueando clics durante intervalos temporales. Esa estrategia agregaba estados de carrera y podía dejar la ruta y la vista desincronizadas. La versión 5.5 elimina esa capa por completo.

## Criterio de aceptación

No se considera corregido con una sola prueba exitosa. Debe soportar secuencias repetidas de creación, edición y movimiento sin cambiar de ruta ni perder funcionalidad.
