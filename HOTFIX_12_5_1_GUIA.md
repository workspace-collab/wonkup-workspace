# Hotfix 12.5.1 — Costeo real de IA

## Objetivo

Corregir el panel **Administración → IA y consumo**, que mostraba `US$0.0000` para interacciones ejecutadas con `gemini-3.1-flash-lite` aunque Gemini sí reportaba tokens.

## Causa

El Ajuste 12.5 tenía una tabla local de tarifas para modelos 2.5. El piloto cambió posteriormente a `gemini-3.1-flash-lite`, por lo que el backend reconocía los tokens pero no encontraba una tarifa para ese modelo y registraba costo estimado `0`.

## Corrección

- Modelo predeterminado de Functions: `gemini-3.1-flash-lite`.
- Tarifa estándar pagada configurada: **USD 0.25 / 1M tokens de entrada** y **USD 1.50 / 1M tokens de salida**. Los thinking tokens se suman al componente de salida.
- Nuevas interacciones guardan su costo correctamente.
- Eventos históricos con costo `0` se recalculan al consultar el panel usando `model`, `inputTokens`, `outputTokens` y `thinkingTokens`.
- Si un evento histórico ya tiene un costo mayor a cero, se conserva ese valor.
- El costo mensual se obtiene de los eventos exitosos, por lo que también se corrige el indicador de presupuesto sin migrar documentos.

> El valor mostrado por WonkUp es una estimación operativa. La facturación de Google Cloud / Google AI Studio es la fuente contable definitiva.

## Instalación

### 1. Actualiza GitHub

Descomprime `WonkUp_Workspace_Hotfix_12_5_1_CAMBIOS.zip` y sube su contenido a la raíz del repositorio.

Commit sugerido:

```text
Hotfix 12.5.1: corregir costeo de Gemini 3.1 Flash-Lite
```

### 2. Despliega únicamente Functions

En Cloud Shell:

```bash
cd ~/wonkup-workspace
git pull
cd functions
npm install
printf 'GEMINI_MODEL=gemini-3.1-flash-lite\n' > .env.wonkup-workspace
cd ..
firebase deploy --only functions:wonkupCanvasAiCoach,functions:wonkupAiUsageSummary --project wonkup-workspace
```

Si Firebase decide actualizar una función auxiliar relacionada con métricas por dependencia de código compartido, es correcto.

**No necesitas:**

- cambiar `GEMINI_API_KEY`;
- publicar reglas Firestore;
- modificar Realtime Database;
- redeplegar Vercel;
- migrar o reescribir `aiUsageEvents`;
- generar nuevas consultas para que aparezcan los costos históricos.

## Validación

1. Espera `Deploy complete!`.
2. Abre **Administración → IA y consumo**.
3. Actualiza el panel.
4. Comprueba que los usuarios con tokens ya no aparezcan con `US$0.0000` si sus eventos usan un modelo con tarifa conocida.
5. Comprueba que **Lienzos con mayor uso** y **Presupuesto IA del mes** también muestren costos coherentes.
6. Ejecuta una nueva consulta de AI Coach y confirma que el costo se acumule.

No se espera ningún cambio visual adicional en los Lienzos.

## Reversión

Si fuera necesario, restaura `functions/index.js` y `functions/package.json` de 12.5.0 y redespliega Functions. Los datos de analítica no requieren reversión.
