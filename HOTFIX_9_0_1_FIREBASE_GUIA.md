# Hotfix 9.0.1 - Firebase Authentication

Este paquete corrige la configuracion publica de Firebase y fuerza a GitHub Pages a cargar la version nueva sin reutilizar la configuracion anterior del navegador.

## Archivos principales

- `index.html`
- `js/config/runtime-config.js`
- `js/bootstrap.js`
- `js/cloud/firebase-client.js`
- `js/cloud/firebase-sdk-loader.js`
- `js/adapters/firebase-access-adapter.js`
- `js/adapters/firebase-project-adapter.js`
- `js/services/cloud-foundation-service.js`

## Instalacion

1. Descomprime el ZIP.
2. En GitHub abre la raiz del repositorio, donde aparecen `index.html`, `js`, `css` y `firebase`.
3. Selecciona **Add file > Upload files**.
4. Arrastra directamente `index.html`, `js` y `HOTFIX_9_0_1_FIREBASE_GUIA.md`.
5. Permite reemplazar los archivos existentes.
6. Commit sugerido: `Hotfix 9.0.1: corregir configuracion Firebase Auth`.
7. Espera el despliegue de GitHub Pages.
8. Abre `https://workspace-collab.github.io/wonkup-workspace/?v=901`.
9. Realiza una recarga forzada y prueba **Cuenta WonkUp**.

## Nota

No pegues el bloque `import { initializeApp } from "firebase/app"` que muestra Firebase Console. WonkUp ya carga e inicializa el SDK desde `js/cloud/firebase-client.js`. Solo necesita los valores publicos dentro de `runtime-config.js`.
