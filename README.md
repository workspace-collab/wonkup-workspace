# WonkUp Workspace

Centro operativo de WonkUp para gestión de proyectos, innovación y colaboración.

## Estado actual

**Ajuste 5.8 en revisión:** encabezado de marca, menú lateral colapsable, paleta visual de notas y alarma del timer.

## Núcleo estable

La reconstrucción 5.6 eliminó el reemplazo completo del lienzo durante las operaciones de notas. El editor:

- inserta notas nuevas en la sección correspondiente;
- actualiza únicamente la nota modificada;
- mueve el mismo elemento entre secciones;
- conserva la ruta;
- revierte el movimiento visual si falla la persistencia;
- utiliza delegación de eventos para evitar listeners duplicados.

## Experiencia 5.7 y 5.8

- Crear notas directamente con el `+` de cada sección.
- Editar contenido inline sin modal para el flujo básico.
- Mostrar colores y eliminar al pasar el mouse o enfocar.
- Mantener edición avanzada, comentarios, vinculación y Kanban en `•••`.
- Compartir con enlace y QR listos al abrir.
- Imprimir / PDF sin modal intermedio.
- Cerrar diálogos con Escape sin abandonar el modo inmersivo.
- Personalizar el encabezado automáticamente con el color del proyecto.
- Ocultar o mostrar el menú lateral desde las tres líneas.
- Elegir colores con paleta y códigos desde el detalle de la nota.
- Recibir sonido y alerta visual al finalizar el timer.

## Módulos funcionales

- Panel Maestro y workspaces.
- Acceso por códigos y roles.
- Proyectos, clientes, equipo y recursos.
- Kanban configurable.
- Innovation Toolkit.
- Business Model Canvas.
- Lean Canvas.
- Mapa de Empatía.
- Lienzo de Propuesta de Valor.
- Matriz de Priorización.
- Pitch Canvas.
- Notas, comentarios, historial y versiones.
- Conversión de notas a tareas.
- Enlaces de consulta con QR y vencimiento.
- Exportación A4 resumen y detalle.
- Menú lateral colapsable, modo inmersivo y timer con alarma.

## Configuración del MVP

```javascript
mode: 'mock',
kanbanMode: 'mock',
canvasMode: 'mock'
```

En modo mock, los cambios, enlaces y versiones se guardan en el navegador. Firebase y Apps Script se conectarán en fases posteriores.

## Verificación 5.8

El script `tests/canvas-ux-smoke-5-8.py` reproduce el flujo real del Lean Canvas de TaxiChurro y valida sidebar, encabezado de marca, alta inline, colores, arrastre, Escape, compartir, impresión, paleta detallada y alarma del timer.

## Publicación

GitHub Pages puede desplegar directamente la rama `main` desde la carpeta raíz. Después de actualizar, el editor debe mostrar `Motor 5.9.0`.
