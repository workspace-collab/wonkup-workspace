# Resultados de pruebas — Entrega 12

Fecha de preparación: 2026-08-05

## Resultado general

**APROBADO EN PRUEBAS LOCALES / VALIDACIÓN FIREBASE REAL PENDIENTE**

## Pruebas automatizadas Node

Se ejecutaron todos los archivos `tests/*.test.mjs`.

- Suites: 10
- Pruebas: 42
- Aprobadas: 42
- Fallidas: 0

La nueva suite `canvas-cloud-12.test.mjs` validó:

- rutas deterministas de migración;
- cero duplicados;
- selección híbrida Firebase/demo;
- uso del singleton Firebase;
- transacciones y listeners;
- presencia RTDB;
- reglas de snapshots públicos;
- permisos por proyecto;
- índices dinámicos de asignación por usuario;
- controles de Cloud Foundation.

## Plan de migración local

Resultado con el seed incluido:

| Tipo | Cantidad |
|---|---:|
| Canvases | 4 |
| Notas | 11 |
| Comentarios | 0 |
| Historial | 5 |
| Versiones | 4 |
| Enlaces internos | 0 |
| Snapshots públicos | 0 |
| Total | 24 |
| Rutas duplicadas | 0 |

## Validación de sintaxis

- Todos los módulos de `js/` y `data/` superaron `node --check`.
- `firebase/realtime-database.rules.json` es JSON válido.
- Las llaves, paréntesis y corchetes de las reglas Firestore y RTDB están balanceados.
- Todos los imports JavaScript utilizan la versión de caché `12.0.1`.

## Smoke test Canvas 5.9

Ejecutado en Chromium headless mediante `tests/canvas-engine-smoke.py`.

Controles aprobados:

- menú lateral;
- encabezado de marca;
- creación inline;
- color rápido;
- drag-and-drop;
- modal y modo inmersivo;
- compartir en un paso;
- impresión directa;
- alarma del temporizador;
- color personalizado;
- eliminación rápida;
- salida con Escape.

Errores de página: **0**.

## Seguridad incorporada

- Firestore deniega borrado físico de canvases, notas, historial, versiones y enlaces.
- La colección pública no permite listado.
- Solo se leen snapshots públicos activos y no vencidos.
- Los snapshots públicos excluyen comentarios, historial, UID, miembros y permisos.
- RTDB deniega todo por defecto.
- Cada usuario solo puede escribir presencia bajo su propio UID.
- La restauración de versión se limita a superadministrador.
- Se agregó un límite preventivo de 450 escrituras para restauraciones atómicas.

## Pendientes de validación real

No fue posible ejecutar un compilador local de Firebase Rules porque `firebase-tools` no está disponible en el entorno de pruebas. Por ello, el cierre requiere:

1. publicar ambas reglas desde Firebase Console;
2. ejecutar el diagnóstico Cloud Foundation;
3. migrar y verificar datos reales;
4. probar dos navegadores con cuentas Firebase;
5. confirmar presencia y desconexión;
6. confirmar enlace público vigente y revocado;
7. comprobar permisos de líder, colaborador, revisor, cliente e invitado.
