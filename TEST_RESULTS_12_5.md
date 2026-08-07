# TEST RESULTS — Ajuste 12.5

Fecha de validación local: 2026-08-07

## Resultado

```text
Node test suite: 66/66 PASS
Canvas Engine smoke 5.9: PASS
JavaScript syntax checks: PASS
```

## Validaciones específicas 12.5

- Credencial Gemini permanece solo en Secret Manager.
- Modelo predeterminado `gemini-2.5-flash-lite`.
- Eliminados límites WonkUp de 30 consultas/usuario y 1,000 globales/día.
- `unlimitedPerUser=true` en contrato y configuración.
- `usageMetadata` se captura para tokens y costo estimado.
- Se registra evento por interacción en `aiUsageEvents`.
- Se agregan métricas diarias globales y por usuario.
- Se registra aceptación de propuestas de forma transaccional e idempotente.
- Se calcula tasa de aceptación.
- Se agregan filtros por usuario, workspace, proyecto y Lienzo.
- Se agrega vista Superadmin `IA y consumo`.
- Se agrega indicador por usuario Normal/Intensivo/Excepcional.
- Presupuesto predeterminado USD 10 y acción `alert_only`.
- Firestore bloquea acceso directo del navegador a `aiUsage` y `aiUsageEvents`.
- La terminología visible principal usa Lienzo/Lienzos.
- Las rutas internas `canvas` se mantienen para compatibilidad.
- Structured output 12.4.1 permanece sin regresiones.

## Smoke test del Motor de Lienzos

Salida:

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

- desplegar Functions 12.5 y reglas en el proyecto Firebase real;
- confirmar que el parámetro `GEMINI_MODEL` quede en `gemini-2.5-flash-lite`;
- generar consultas reales con Gemini;
- validar tokens/costo contra `usageMetadata` real;
- validar el panel IA y consumo con al menos dos usuarios;
- validar que una nota aceptada incremente la tasa de aceptación;
- confirmar que el proveedor Gemini dispone de cuota/capacidad suficiente para el piloto.
