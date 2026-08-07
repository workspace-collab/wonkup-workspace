# AJUSTE 12.4 — WonkUp AI Coach con Gemini

## Objetivo

Incorporar un facilitador metodológico dentro del Canvas Engine para ayudar a usuarios que no dominan Lean Canvas, Business Model Canvas, Value Proposition Canvas, Mapa de Empatía, Priorización o Pitch Canvas.

El asistente puede:

1. formular preguntas guía contextualizadas al bloque actual;
2. revisar la calidad metodológica de las notas existentes;
3. convertir el contexto aportado por el usuario en notas candidatas;
4. agregar al Canvas únicamente las notas que el usuario seleccione y confirme.

La IA nunca inserta contenido automáticamente.

## Arquitectura

```text
WonkUp Workspace en Vercel
        ↓ Firebase Authentication
WonkUp AI Coach UI
        ↓ callable autenticada
Cloud Function wonkupCanvasAiCoach
        ↓ secreto GEMINI_API_KEY
Gemini Developer API
        ↓ JSON estructurado
WonkUp AI Coach UI
        ↓ selección humana
CanvasService.createNote()
        ↓
Cloud Firestore
```

La clave de Gemini no se coloca en `runtime-config.js`, Vercel, GitHub ni el navegador.

## Modelo

Modelo predeterminado:

```text
gemini-2.5-flash
```

Se eligió por su relación costo/rendimiento y baja latencia. El modelo se puede cambiar posteriormente mediante el parámetro `GEMINI_MODEL` sin rediseñar el frontend.

## Límites iniciales

- 30 consultas de IA por usuario por día.
- 1,000 consultas globales por día.
- máximo 4,000 caracteres de contexto aportado por el usuario por solicitud.
- máximo 20 notas de la sección y 40 notas de contexto adicional enviadas al modelo.
- no se guardan prompts ni respuestas en la colección de métricas `aiUsage`.

Los límites se aplican en Cloud Functions, no en el navegador.

---

# INSTALACIÓN

## Paso 1 — Subir el Ajuste 12.4 al repositorio

Descomprime `WonkUp_Workspace_Ajuste_12_4_CAMBIOS.zip` y sube su contenido a la raíz del repositorio.

Commit sugerido:

```text
Ajuste 12.4: WonkUp AI Coach con Gemini
```

Vercel deberá crear automáticamente el deployment de producción desde la rama principal.

## Paso 2 — Crear la API key de Gemini

En Google AI Studio:

1. abre la sección de API keys;
2. selecciona el proyecto de Google Cloud `wonkup-workspace`;
3. crea una nueva API key para Gemini;
4. copia la clave una sola vez.

No pegues la clave en ChatGPT, GitHub, Vercel ni archivos del frontend.

### Importante sobre una cuenta Gemini pagada

Una suscripción de usuario como Gemini Advanced/Google AI no debe asumirse como facturación de la API. Para la integración importa el proyecto de Google Cloud asociado a la API key y el nivel de facturación configurado para Gemini API.

Para pruebas puedes utilizar el Free Tier si tu proyecto lo tiene disponible. Para información empresarial o de clientes se recomienda el Paid Tier de Gemini API.

## Paso 3 — Guardar la clave en Firebase Secret Manager

Abre Cloud Shell y ejecuta:

```bash
cd ~/wonkup-workspace
git pull
firebase functions:secrets:set GEMINI_API_KEY --project wonkup-workspace
```

Cloud Shell solicitará el valor del secreto. Pega la API key y presiona Enter.

La clave no se mostrará en el frontend.

## Paso 4 — Desplegar la función y las reglas

Ejecuta:

```bash
firebase deploy --only functions:wonkupCanvasAiCoach,firestore:rules --project wonkup-workspace
```

Resultado esperado:

```text
functions[wonkupCanvasAiCoach(us-central1)] Successful create operation.
Deploy complete!
```

Si prefieres sincronizar todas las funciones con el release 12.4:

```bash
firebase deploy --only functions,firestore:rules --project wonkup-workspace
```

## Paso 5 — Confirmar Vercel

En Vercel → Deployments verifica:

```text
Ajuste 12.4
Estado: Listo
Entorno: Producción
```

La URL de producción continúa siendo la misma.

## Paso 6 — Prueba funcional

1. inicia sesión como Superadministrador o Colaborador;
2. abre un Canvas almacenado en Firestore;
3. verifica el nuevo botón `✨ Guíame con IA`;
4. selecciona un bloque;
5. pulsa `🧭 Preguntas guía`;
6. responde en `Cuéntale a la IA lo que sabes`;
7. pulsa `✨ Proponer notas`;
8. revisa las notas sugeridas;
9. desmarca cualquier propuesta que no corresponda;
10. pulsa `+ Agregar seleccionadas al Canvas`.

Las notas deben aparecer inmediatamente en el Canvas y sincronizarse con los otros usuarios conectados.

## Paso 7 — Probar revisión metodológica

En un bloque con varias notas pulsa:

```text
🔎 Revisar sección
```

Debe devolver:

- puntuación 0–100;
- fortalezas;
- vacíos;
- recomendaciones;
- siguiente pregunta de validación.

## Paso 8 — Validar cuota

Cada respuesta muestra cuántas consultas le quedan al usuario ese día.

Firestore utiliza internamente:

```text
aiUsage/{YYYY-MM-DD}
aiUsage/{YYYY-MM-DD}/users/{uid}
```

Estas rutas no son accesibles directamente desde el navegador.

---

# CRITERIOS DE APROBACIÓN

El Ajuste 12.4 queda aprobado cuando:

- la API key no existe en ningún archivo público;
- la Cloud Function responde correctamente;
- un colaborador con permiso de edición puede usar el Coach;
- un usuario sin acceso al Canvas recibe `permission-denied`;
- `Preguntas guía` devuelve preguntas específicas al bloque;
- `Revisar sección` analiza las notas existentes;
- `Proponer notas` distingue evidencia, inferencia e hipótesis;
- ninguna propuesta se agrega automáticamente;
- las notas seleccionadas se guardan en Firestore;
- las notas aparecen en tiempo real en otro navegador;
- la cuota diaria se muestra y se respeta;
- el Canvas Engine 5.9 continúa sin regresiones.

## Rollback

Si Gemini presenta una incidencia, el Canvas continúa funcionando normalmente. El botón de IA puede quedar temporalmente sin servicio sin afectar edición, comentarios, historial, compartir, impresión o sincronización.

Para retirar solo la función:

```bash
firebase functions:delete wonkupCanvasAiCoach --region us-central1 --project wonkup-workspace
```

El resto de WonkUp Workspace permanece operativo.
