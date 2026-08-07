# TEST RESULTS — Hotfix 12.4.1

- `node --check functions/index.js`: OK
- `node --test tests/ai-coach-12-4.test.mjs`: 8/8 OK
- Suite Node completa `node --test tests/*.test.mjs`: 60/60 OK

## Regresión cubierta
- La API key permanece exclusivamente en Secret Manager.
- Se mantiene `gemini-2.5-flash`.
- Se mantienen cuotas 30 consultas/usuario/día y 1000 globales/día.
- El frontend 12.4 no cambia.
- `generationConfig.responseFormat` ya no se envía.
- Se usa `responseMimeType: application/json` + `responseJsonSchema`.
- Las llamadas fallidas a Gemini devuelven la reserva de cuota.
