# Test Results — Hotfix 12.5.1

Fecha: 2026-08-07

## Resultado

- Suite Node completa: **69/69 pruebas aprobadas**.
- `node --check functions/index.js`: **OK**.
- Smoke test Motor de Lienzos 5.9: **OK**.
- Errores de página en smoke test: **0**.

## Cobertura específica 12.5.1

- Tarifa de `gemini-3.1-flash-lite` presente: entrada 0.25 / salida 1.50 USD por 1M tokens.
- `GEMINI_MODEL` tiene fallback `gemini-3.1-flash-lite`.
- Eventos con costo histórico > 0 conservan el valor almacenado.
- Eventos con costo 0 se recalculan desde modelo + tokens.
- Totales por usuario, total del periodo y Lienzos usan el costo recalculado.
- Presupuesto mensual se recalcula desde eventos exitosos.
- Sin cambios de permisos, reglas Firestore o frontend.
