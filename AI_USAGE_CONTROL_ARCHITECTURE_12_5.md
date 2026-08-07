# Arquitectura 12.5 — AI Usage Control Center

## Principio

El piloto prioriza **observabilidad antes que restricciones**. WonkUp no impone un límite diario por usuario; mide uso, costo aproximado y valor generado para decidir políticas futuras con evidencia.

## Flujo

```text
Usuario en Lienzo
   │
   ├─ Preguntas guía
   ├─ Proponer notas
   └─ Revisar sección
   │
   ▼
wonkupCanvasAiCoach
   │
   ├─ valida autenticación y permisos del Lienzo
   ├─ consulta Gemini
   ├─ recibe usageMetadata
   ├─ calcula costo estimado
   ├─ agrega contador diario global
   ├─ agrega contador diario por usuario
   └─ crea aiUsageEvents/{interactionId}
          │
          └─ si el usuario inserta propuestas
                ▼
          wonkupRecordAiAcceptance
                │
                └─ actualiza acceptedNotes transaccionalmente
```

## Colecciones

```text
system/aiSettings
aiUsage/{YYYY-MM-DD}
aiUsage/{YYYY-MM-DD}/users/{uid}
aiUsageEvents/{interactionId}
```

Todas las escrituras de analítica se ejecutan con Admin SDK. Las reglas del cliente niegan lectura y escritura directa a `aiUsage` y `aiUsageEvents`.

## Resumen administrativo

`wonkupAiUsageSummary` consulta eventos de 1, 7 o 30 días y agrega:

- consultas exitosas y fallidas;
- tokens;
- costo estimado;
- acciones AI Coach;
- usuario;
- workspace;
- proyecto;
- Lienzo;
- propuestas y aceptaciones;
- tasa de aceptación;
- participación porcentual por usuario;
- promedio diario por usuario;
- Lienzos con mayor uso.

La ruta frontend es:

```text
#/master/ai
```

solo para superadministradores.

## Indicador por usuario

Se calcula sobre `averageRequestsPerDay`:

```text
<= 50     Normal
51–150    Intensivo
> 150     Excepcional
```

Es un semáforo de observación, no una cuota ni un bloqueo.

## Costo estimado

El backend usa una tabla versionada por modelo. Para 12.5:

```text
gemini-3.1-flash-lite: input 0.25 USD / 1M, output 1.50 USD / 1M
gemini-2.5-flash-lite: input 0.10 USD / 1M, output 0.40 USD / 1M
gemini-2.5-flash:      input 0.30 USD / 1M, output 2.50 USD / 1M
```

Los tokens de razonamiento reportados se incluyen en el componente de salida. Desde el Hotfix 12.5.1, si un evento histórico quedó con `estimatedCostUsd = 0` por no existir todavía una tarifa local para su modelo, el resumen administrativo recalcula el costo a partir de `model` + tokens sin modificar el evento original. Los eventos que ya tienen un costo mayor a cero conservan su estimación histórica. El costo de WonkUp es **estimado** y se usa para producto/operación; la factura de Google Cloud prevalece para conciliación financiera.

## Presupuesto

`system/aiSettings` contiene:

```text
enabled: true
unlimitedPerUser: true
monthlyBudgetUsd: 10
alertThresholds: [50, 75, 90, 100]
budgetAction: alert_only
```

No existe corte automático al 100%. `enabled=false` es un mecanismo manual de emergencia.

## Privacidad

La analítica no persiste:

- prompts completos;
- respuestas completas de Gemini;
- razonamientos generados.

Registra metadatos suficientes para consumo y producto.

## Terminología

La experiencia visible usa **Lienzo/Lienzos**. Para evitar una migración destructiva, permanecen sin cambios:

- rutas `#/.../canvas/...`;
- colecciones Firestore `canvases`;
- nombres de clases/variables internas;
- nombres propios de metodologías como Business Model Canvas, Lean Canvas y Value Proposition Canvas.
