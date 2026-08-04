# Guía de actualización — Entrega 3

## Opción recomendada: subir solo cambios

1. Descomprime `WonkUp_Workspace_Entrega_3_CAMBIOS.zip`.
2. Abre el repositorio `wonkup-workspace`.
3. Selecciona **Add file → Upload files**.
4. Arrastra el contenido extraído conservando carpetas.
5. Confirma el reemplazo de archivos existentes.
6. Usa el commit:

`Entrega 3: proyectos, clientes y Google Drive`

## Validación inmediata

Deja `js/config/api-config.js` en modo `mock` y realiza las pruebas de `TEST_CHECKLIST.md`.

## Activación opcional de Google Apps Script

1. Abre el Apps Script vinculado a `WONKUP_MASTER`.
2. Crea o actualiza todos los archivos de `apps-script/`.
3. Ejecuta `setupWonkUpMaster()`.
4. Ejecuta `setupWonkUpDriveRoot()`.
5. Crea una nueva versión de la implementación web.
6. Copia la URL `/exec` en `js/config/api-config.js`.
7. Cambia `mode` a `apps-script`.

No actives el modo real hasta completar primero las pruebas mock.
