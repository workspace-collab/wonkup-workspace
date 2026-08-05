# Hotfix 9.0.2 — Firebase Authentication

## Causa confirmada

La API key copiada en `js/config/runtime-config.js` tenía un carácter adicional.

- Incorrecta: `...W1I1YTN2...` (40 caracteres)
- Correcta: `...W1IYTN2...` (39 caracteres)

Firebase rechazaba el inicio de sesión con `auth/api-key-not-valid`.

## Archivos incluidos

- `index.html`
- `js/bootstrap.js`
- `js/config/runtime-config.js`

## Instalación

1. Sube el contenido directamente a la raíz del repositorio.
2. Permite reemplazar los tres archivos.
3. Commit: `Hotfix 9.0.2: corregir API key de Firebase`
4. Abre `https://workspace-collab.github.io/wonkup-workspace/?v=902`
5. Realiza una recarga forzada.
6. Ingresa mediante **Cuenta WonkUp**.

No modifiques Firebase Console.
