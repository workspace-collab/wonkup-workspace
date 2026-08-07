# TEST RESULTS — Ajuste 12.4

Fecha: 2026-08-06

## Resultado automatizado

```text
59 tests
59 passed
0 failed
```

## Validaciones incluidas

- secreto Gemini únicamente en Cloud Functions;
- ausencia de `GEMINI_API_KEY` en runtime público;
- autenticación y autorización del AI Coach;
- límites diarios por usuario y globales;
- soporte metodológico para los Canvas WonkUp;
- preguntas guía, revisión y generación de propuestas;
- inserción de notas solo después de selección explícita;
- denegación de acceso del navegador a `aiUsage`;
- cache busting 12.4.0;
- regresiones completas de Entregas/Ajustes anteriores.

## Smoke test Canvas Engine

```text
DESKTOP_SIDEBAR_TOGGLE_OK
BRANDED_HEADER_OK
INLINE_ADD_OK
QUICK_COLOR_OK
DRAG_OK
ESC_MODAL_PRESERVES_IMMERSIVE_OK
SHARE_ONE_STEP_OK
DIRECT_PRINT_OK
TIMER_ALARM_OK
DETAIL_COLOR_COMPACT_OK
QUICK_DELETE_OK
ESC_EXITS_IMMERSIVE_OK
PAGE_ERRORS []
CANVAS_UX_5_9_OK
```

## Pendiente de validación real

No se ejecutó una llamada real a Gemini porque el paquete no contiene ni debe contener la API key del usuario.

Pruebas pendientes en producción:

1. configurar `GEMINI_API_KEY`;
2. desplegar `wonkupCanvasAiCoach`;
3. ejecutar preguntas guía;
4. generar sugerencias;
5. agregar propuestas seleccionadas;
6. verificar tiempo real entre dos navegadores;
7. verificar cuota y errores 429;
8. validar comportamiento con colaborador y usuario sin permiso.
