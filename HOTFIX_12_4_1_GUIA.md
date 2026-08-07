# Hotfix 12.4.1 — Gemini structured output

## Incidencia
WonkUp AI Coach abría correctamente, pero la primera consulta a Gemini devolvía:

`Invalid value at 'generation_config.response_format.text.mime_type' ... "application/json"`

## Causa
La función `wonkupCanvasAiCoach` estaba enviando la configuración de salida estructurada con `generationConfig.responseFormat.text.mimeType`. Ese formato no corresponde al contrato REST `generateContent` usado por esta función.

## Corrección
La llamada REST ahora usa:

```js
generationConfig: {
  temperature: ...,
  maxOutputTokens: ...,
  responseMimeType: 'application/json',
  responseJsonSchema: aiResponseSchema(action)
}
```

Se conserva Gemini 2.5 Flash, la API key de Secret Manager, las cuotas y el frontend 12.4. Además, si Gemini rechaza una consulta antes de generar respuesta, el intento se descuenta nuevamente para no consumir cuota por errores de integración.

## Instalación
1. Subir el contenido del ZIP de cambios a la raíz del repositorio y reemplazar archivos.
2. En Cloud Shell:

```bash
cd ~/wonkup-workspace
git pull
cd functions
npm install
cd ..
firebase deploy --only functions:wonkupCanvasAiCoach --project wonkup-workspace
```

3. Esperar `Deploy complete!`.
4. No volver a crear `GEMINI_API_KEY` ni `GEMINI_MODEL`.
5. No es necesario desplegar Firestore rules, Realtime Database ni Vercel para este hotfix de backend.
6. Probar nuevamente `✨ Guíame con IA`.
