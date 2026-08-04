# WonkUp Workspace

Centro operativo de WonkUp para gestión de proyectos, innovación y colaboración.

## Estado actual

**Ajuste 5.6 en revisión:** reconstrucción estable del Canvas Engine basada en el repositorio real publicado después del Ajuste 5.5.

## Corrección principal

Las operaciones de notas ya no reconstruyen todo el lienzo. El editor utiliza un controlador estable que:

- inserta notas nuevas en la sección correspondiente;
- actualiza únicamente la nota editada;
- mueve el mismo elemento entre secciones;
- conserva la ruta y la pantalla completa;
- revierte el movimiento visual si falla la persistencia;
- utiliza delegación de eventos para evitar listeners duplicados.

Cada ruta se renderiza dentro de un host independiente. Una vista asíncrona anterior no puede reemplazar el contenido de la ruta activa.

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
- Modo enfoque, pantalla completa y timer.

## Configuración del MVP

```javascript
mode: 'mock',
kanbanMode: 'mock',
canvasMode: 'mock'
```

En modo mock, los cambios, enlaces y versiones se guardan en el navegador. Firebase y Apps Script se conectarán en fases posteriores.

## Verificación 5.6

El script `tests/canvas-engine-smoke.py` reproduce el recorrido completo hasta el Lean Canvas de TaxiChurro y ejecuta 20 altas, 20 movimientos, edición y persistencia sin cambios de ruta ni errores de página.

## Publicación

GitHub Pages puede desplegar directamente la rama `main` desde la carpeta raíz. Después de actualizar, debe mostrarse `Motor 5.6.0` dentro del editor.
