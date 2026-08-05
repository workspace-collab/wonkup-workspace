# Resultados de pruebas — Entrega 9

Fecha técnica: 2026-08-05

## Pruebas automatizadas

| Prueba | Resultado |
|---|---|
| Sintaxis de 80 archivos JavaScript | Aprobada |
| Importaciones relativas | Aprobada, 0 rutas faltantes |
| Balance de CSS | Aprobado |
| Balance estructural de reglas Firestore | Aprobado |
| Configuración Firebase vacía por defecto | Aprobada |
| Escaneo de claves privadas y API keys reales | Sin hallazgos |
| Plan de migración determinista | Aprobado |
| Rutas de migración únicas | Aprobado |
| Filtro por workspace | Aprobado |
| Migración modular segura | Aprobada |
| Enrutamiento híbrido de cuenta Firebase | Aprobado |
| Conservación de códigos demo en local | Aprobada |
| Plan de activación con mínimo privilegio | Aprobado |
| Rechazo de proyecto fuera del workspace | Aprobado |
| Exigencia de proyecto para roles limitados | Aprobada |
| Regresión de alta rápida 8.1 | Aprobada |
| Regresión de entregables | Aprobada |
| Regresión de reportes | Aprobada |

Resultado Node Test Runner:

```text
12 pruebas aprobadas
0 fallidas
```

## Pruebas visuales automatizadas

| Flujo | Resultado |
|---|---|
| Cloud Foundation con configuración pendiente | Aprobado |
| Respaldo y simulación de migración | Aprobados |
| Simulación de activación de usuario | Aprobada |
| Pantalla de error de inicio resiliente | Aprobada |
| Alta rápida de cliente | Aprobada |
| Alta rápida de persona y asignación | Aprobada |

Evidencias:

- `tests/cloud-foundation-ui-9.png`
- `tests/startup-fallback-ui-9.png`
- `tests/quick-create-ui-8-1.png`

## Reglas y nube

Las reglas se validaron estructuralmente y las consultas del adaptador se diseñaron para coincidir con sus restricciones. No se realizó una compilación contra un proyecto Firebase real porque la Entrega 9 no contiene credenciales ni un proyecto del usuario.

Validación pendiente en Firebase Console:

- publicación de `firestore.rules`;
- Rules Playground;
- inicio de sesión real;
- escritura real por lotes;
- lectura desde dos dispositivos;
- métricas de App Check.

## Restricción del entorno de prueba

La navegación directa a un servidor `localhost` fue bloqueada administrativamente en este entorno. Las pruebas visuales se ejecutaron con un harness de navegador e importaciones controladas. Por ello, la validación definitiva del backend corresponde al proyecto Firebase y al dominio real de GitHub Pages.

## Estado

Código de Cloud Foundation: **LISTO**.

Conexión real a Firebase: **EN CONFIGURACIÓN / EN REVISIÓN** hasta completar la guía sin terminal.
