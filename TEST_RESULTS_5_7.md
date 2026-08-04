# TEST RESULTS 5.7

## Prueba automatizada

Archivo: `tests/canvas-ux-smoke-5-7.py`

Recorrido ejecutado en Chromium:

1. Acceso con `WONKUP-ADMIN`.
2. Apertura del Lean Canvas de TaxiChurro.
3. Creación de nota inline sin modal.
4. Cambio rápido de color.
5. Arrastre entre secciones.
6. Entrada al modo inmersivo.
7. Apertura de Historial y cierre con Escape sin abandonar el modo inmersivo.
8. Apertura de Compartir con enlace creado automáticamente.
9. Copia del enlace y ampliación del QR.
10. Impresión directa sin modal intermedio.
11. Eliminación rápida de la nota.
12. Salida del modo inmersivo con Escape cuando no hay diálogo.

## Resultado

```text
INLINE_ADD_OK
QUICK_COLOR_OK
DRAG_OK
ESC_MODAL_PRESERVES_IMMERSIVE_OK
SHARE_ONE_STEP_OK
DIRECT_PRINT_OK
QUICK_DELETE_OK
ESC_EXITS_IMMERSIVE_OK
PAGE_ERRORS []
CANVAS_UX_5_7_OK
```

No se detectaron errores JavaScript durante la prueba.
