# Ajuste 5.6 - Diagnóstico raíz del cierre intermitente del Canvas

## Base analizada

- ZIP descargado del repositorio publicado por el usuario después del Ajuste 5.5.
- Ruta reproducida:

```text
#/w/w-agora/p/p-taxichurro/canvas/canvas-taxi-lean
```

## Por qué los parches 5.2 a 5.5 no fueron suficientes

Las versiones anteriores modificaron el foco, el tipo de arrastre y algunas guardas de navegación, pero conservaron tres problemas estructurales.

### 1. El workspace se destruía durante cada mutación

Después de crear, editar o mover una nota, `canvas-view.js` ejecutaba:

```javascript
workspace.innerHTML = renderCanvasBoard(...);
bindCanvasWorkspaceEvents(...);
```

Esto eliminaba todos los post-its y listeners mientras todavía concluía la secuencia de interacción del navegador. El efecto podía ser distinto según mouse, trackpad, velocidad de clic y pantalla completa.

### 2. Todas las rutas escribían sobre el mismo contenedor

Las vistas asíncronas recibían directamente `#main-view`. Una vista anterior podía terminar después de una navegación más reciente y escribir sobre la pantalla activa.

El problema era especialmente riesgoso en las transiciones:

```text
Proyecto > Canvases > Abrir canvas
```

### 3. Toolkit y Kanban no tenían un ciclo de vida completo

Sus suscripciones podían continuar activas después de abandonar una vista. Además, una carga asíncrona anterior podía terminar después de la limpieza y volver a registrar una suscripción.

## Corrección aplicada

### Host independiente por ruta

Cada navegación crea un `route-host` nuevo. Las vistas anteriores conservan únicamente un nodo separado del documento, por lo que ya no pueden reemplazar la pantalla actual.

### Limpieza y generaciones

- `cleanupToolkitView()` cancela la suscripción del Toolkit.
- `cleanupKanbanView()` cancela eventos y realtime.
- Toolkit y Kanban usan identificadores de generación para descartar respuestas asíncronas antiguas.
- Project View verifica que su contenedor siga conectado antes de renderizar.

### Controlador estable del workspace

Se agregó `canvas-workspace-controller.js`:

- un único conjunto de listeners por workspace;
- delegación de eventos;
- creación y edición sin reconstruir el lienzo;
- movimiento optimista del mismo nodo DOM;
- persistencia posterior;
- rollback visual si el guardado falla;
- soporte para mouse, trackpad y táctil mediante Pointer Events.

### Navegación intencional

El botón Volver solo acepta:

- activación por teclado; o
- una secuencia real `pointerdown + click` iniciada sobre el propio botón.

Los clics residuales posteriores a un modal o arrastre no pueden activar la salida.

## Diferencia frente a la prueba anterior

La prueba 5.5 no reproducía suficientemente el ciclo real de navegación. La prueba 5.6 ejecuta:

```text
Acceso
  > Proyecto TaxiChurro
  > pestaña Canvases
  > Abrir Lean Canvas
  > Pantalla completa
  > crear 20 notas
  > mover una nota 20 veces
  > editarla
  > volver a renderizar la ruta
```

En cada operación se verifica:

- misma URL;
- canvas presente;
- datos persistentes;
- ausencia de errores JavaScript.
