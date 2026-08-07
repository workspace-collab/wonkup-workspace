# Ajuste 12.5 — Lienzos + AI Usage Control Center

## Objetivo

Este ajuste convierte el piloto de WonkUp AI Coach en una etapa de observación real:

1. la interfaz visible usa **Lienzo / Lienzos** en lugar de Canvas / Canvases;
2. WonkUp deja de imponer un límite diario de consultas por usuario;
3. se mide el consumo por usuario, workspace, proyecto, Lienzo y tipo de acción;
4. se calcula un costo estimado a partir de los tokens reportados por Gemini;
5. se mide cuántas notas propuestas por IA terminan incorporándose al Lienzo;
6. el superadministrador dispone de **Administración → IA y consumo**.

> “Sin límite” significa que WonkUp no corta consultas por cantidad durante el piloto. Google/Gemini mantiene sus propios límites técnicos, de cuota y de facturación.

## Modelo del piloto

Modelo predeterminado:

```text
gemini-2.5-flash-lite
```

La clave `GEMINI_API_KEY` ya configurada en Firebase Secret Manager se reutiliza. **No debes crear ni volver a pegar la API key.**

## Indicador por usuario

El panel administrativo clasifica el uso según el promedio de consultas por día del periodo seleccionado:

| Indicador | Promedio diario | Efecto |
|---|---:|---|
| Normal | 0–50 | Informativo |
| Intensivo | 51–150 | Informativo |
| Excepcional | Más de 150 | Informativo |

Ningún indicador bloquea al usuario.

## Presupuesto de referencia

Valor inicial: **USD 10/mes**.

Alertas visuales:

```text
50% → seguimiento
75% → advertencia
90% → atención
100% → atención crítica
```

La acción al 100% es `alert_only`: **no se suspende automáticamente AI Coach**. El superadministrador puede pausarlo manualmente si existe una emergencia de costos.

## Datos registrados

Por interacción se guardan únicamente metadatos operativos:

- usuario;
- workspace;
- proyecto;
- Lienzo;
- sección;
- acción de AI Coach;
- modelo;
- tokens de entrada, salida, razonamiento y total;
- costo estimado;
- éxito/error;
- número de propuestas;
- número de propuestas aceptadas.

No se guardan los prompts ni las respuestas completas en las colecciones de analítica.

## Instalación

### 1. Respaldo

Conserva el paquete completo de la versión 12.4.1 antes de reemplazar archivos.

### 2. Actualizar GitHub

Descomprime `WonkUp_Workspace_Ajuste_12_5_CAMBIOS.zip` y sube **su contenido** a la raíz del repositorio, conservando las carpetas y reemplazando los archivos existentes.

Commit sugerido:

```text
Ajuste 12.5: Lienzos y control de uso de IA
```

Vercel debe detectar `main` y publicar automáticamente el frontend.

### 3. Actualizar Cloud Functions y reglas

En Cloud Shell:

```bash
cd ~/wonkup-workspace
git pull
cd functions
npm install
printf 'GEMINI_MODEL=gemini-2.5-flash-lite\n' > .env.wonkup-workspace
cd ..
firebase deploy --only functions,firestore:rules --project wonkup-workspace
```

El archivo `.env.wonkup-workspace` contiene únicamente el nombre del modelo, no la API key. Esto evita que Cloud Shell conserve el valor anterior `gemini-2.5-flash` de un despliegue previo.

No vuelvas a configurar `GEMINI_API_KEY`; continúa almacenada en Secret Manager.

### 4. Resultado esperado

El despliegue debe actualizar o crear, entre otras, estas funciones:

```text
wonkupCanvasAiCoach
wonkupRecordAiAcceptance
wonkupAiUsageSummary
wonkupUpdateAiSettings
```

Al final:

```text
Deploy complete!
```

### 5. Validar frontend

Abre la URL de producción de Vercel y realiza una recarga normal. La aplicación usa cache-busting `12.5.0`.

Comprueba:

- menú **Administración → IA y consumo** para superadministrador;
- botones visibles **Nuevo lienzo**, **Lienzos**, **Compartir lienzo**;
- WonkUp AI Coach muestra “uso libre durante el piloto · métricas activas”;
- no aparece contador de “30 consultas”.

## Prueba funcional recomendada

### Cuenta 1 — usuario operativo

1. Abre un Lienzo.
2. Ejecuta **Preguntas guía**.
3. Ejecuta **Proponer notas**.
4. Selecciona al menos una propuesta y agrégala al Lienzo.
5. Ejecuta **Revisar sección**.

### Cuenta 2 — superadministrador

Entra a **Administración → IA y consumo** y confirma:

- 3 consultas exitosas aproximadamente;
- tokens > 0 si Gemini los reportó;
- costo estimado calculado a partir de los tokens reportados;
- el usuario aparece en la tabla;
- el Lienzo aparece en “Lienzos con mayor uso”;
- la propuesta incorporada aparece en “Notas aceptadas”;
- la tasa de aceptación se calcula;
- el indicador de usuario aparece como Normal/Intensivo/Excepcional.

## Prueba del presupuesto

Pulsa **Configurar** en IA y consumo:

- cambia el presupuesto de referencia si deseas;
- confirma que AI Coach permanece activo;
- no uses el interruptor salvo como pausa manual de emergencia.

## Seguridad

- `GEMINI_API_KEY` permanece en Secret Manager.
- `aiUsage` y `aiUsageEvents` no admiten lectura/escritura directa desde el navegador.
- los resúmenes administrativos se obtienen por Cloud Function y requieren superadministrador.
- la aceptación de notas solo puede registrarla el usuario dueño de la interacción.
- las rutas internas `canvas`/`canvases` se conservan para compatibilidad; el cambio a **Lienzo** es de experiencia de usuario.

## Reversión

Si necesitas volver a 12.4.1:

1. restaura el paquete completo 12.4.1 en GitHub;
2. deja intacto `GEMINI_API_KEY`;
3. vuelve a desplegar Functions y Firestore Rules de 12.4.1.

Los documentos `aiUsageEvents` creados durante 12.5 son analítica adicional y no modifican los Lienzos.
