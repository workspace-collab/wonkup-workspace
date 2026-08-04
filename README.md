# WonkUp Workspace

Centro operativo de WonkUp para gestión de proyectos, innovación y colaboración.

## Estado actual

**Ajuste 5.7 en revisión:** interacción ágil del Canvas Engine, compartir simplificado, impresión directa y modo inmersivo estable.

## Núcleo estable

La reconstrucción 5.6 eliminó el reemplazo completo del lienzo durante las operaciones de notas. El editor:

- inserta notas nuevas en la sección correspondiente;
- actualiza únicamente la nota modificada;
- mueve el mismo elemento entre secciones;
- conserva la ruta;
- revierte el movimiento visual si falla la persistencia;
- utiliza delegación de eventos para evitar listeners duplicados.

## Experiencia 5.7

- Crear notas directamente con el `+` de cada sección.
- Editar contenido inline sin modal para el flujo básico.
- Mostrar colores y eliminar al pasar el mouse o enfocar.
- Mantener edición avanzada, comentarios, vinculación y Kanban en `•••`.
- Compartir con enlace y QR listos al abrir.
- Imprimir / PDF sin modal intermedio.
- Cerrar diálogos con Escape sin abandonar el modo inmersivo.

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
- Modo enfoque, modo inmersivo y timer.

## Configuración del MVP

```javascript
mode: 'mock',
kanbanMode: 'mock',
canvasMode: 'mock'
```

En modo mock, los cambios, enlaces y versiones se guardan en el navegador. Firebase y Apps Script se conectarán en fases posteriores.

## Verificación 5.7

El script `tests/canvas-ux-smoke-5-7.py` reproduce el flujo real del Lean Canvas de TaxiChurro y valida alta inline, colores, arrastre, Escape, compartir, QR, impresión y eliminación rápida sin errores de página.

## Publicación

GitHub Pages puede desplegar directamente la rama `main` desde la carpeta raíz. Después de actualizar, el editor debe mostrar `Motor 5.7.0`.
