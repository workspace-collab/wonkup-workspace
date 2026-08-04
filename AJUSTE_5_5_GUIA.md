# AJUSTE 5.5 - Corrección raíz de notas y arrastre

## Diagnóstico confirmado

Se identificaron dos causas estructurales:

1. `modal.js` programaba la restauración del foco usando la variable global `lastTrigger` y la establecía en `null` antes de ejecutarse el `requestAnimationFrame`. Esto producía el error no controlado `Cannot read properties of null (reading focus)` después de cerrar el formulario de notas.
2. `canvas-view.js` mantenía una capa compleja de guardas de navegación, restauración de hash y bloqueo posterior al drag. Esa capa podía dejar la URL y la vista desincronizadas. Además, toda la tarjeta era arrastrable, incluyendo áreas cercanas a los controles de edición.

## Solución aplicada

- Se captura de forma inmutable el elemento al que debe regresar el foco.
- Se valida que el modal siga conectado antes de enfocar su primer control.
- `modal.close()` acepta `{ restoreFocus: false }` cuando el control que abrió el modal será reemplazado.
- Se retiró completamente la guarda global de navegación del Canvas Engine.
- Crear, editar y comentar cierran primero el modal y luego actualizan el lienzo.
- Solo la barra superior del post-it funciona como asa de arrastre.
- El movimiento se guarda primero y luego se vuelve a pintar el área del canvas.
- No se modifica ni restaura el hash durante una mutación.
- El botón Volver al Toolkit permanece deshabilitado mientras una operación está activa.
- Se actualizó el versionado de recursos a `5.5.0`.

## Prueba automatizada ejecutada

Se utilizó un navegador Chromium controlado mediante Playwright con el código real de la aplicación cargado como módulos ES.

Resultado:

- 20 notas creadas consecutivamente.
- 20 movimientos consecutivos entre secciones.
- 0 cambios inesperados de hash.
- 0 salidas al Toolkit.
- 0 errores JavaScript relacionados con modales, notas o drag and drop.
- La cantidad de notas se conservó después de los movimientos.

## Interacción de arrastre

Para mover una nota, arrastra desde la barra superior donde aparece el icono de seis puntos y el nombre del color. El lápiz sigue reservado para editar.

## Validación manual

1. Abre Lean Canvas.
2. Crea diez notas seguidas.
3. Arrastra notas desde el asa superior hacia diferentes secciones.
4. Repite dentro y fuera de pantalla completa.
5. Confirma que la URL no cambia y que el canvas no se cierra.
