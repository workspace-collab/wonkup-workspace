# Hotfix 9.0.4 - Inicializacion unica de Cloud Firestore

## Problema corregido

Al ejecutar la migracion aparecia:

`initializeFirestore() has already been called with different options`

La aplicacion cargaba `firebase-client.js` con diferentes parametros de version (`v=9.0.0` y `v=9.0.3`). El navegador trata esas direcciones como modulos distintos. Cada copia mantenia su propia promesa e intentaba inicializar Firestore nuevamente.

## Correccion

- Se incorporo una promesa singleton compartida mediante `globalThis`.
- Todas las importaciones internas usan la version `9.0.4`.
- Si Firestore ya fue inicializado por otro modulo, el cliente reutiliza `getFirestore(app)`.
- Se conserva Authentication, la configuracion publica, el modo hibrido y la cache en memoria.

## Instalacion

1. Descomprime el ZIP.
2. Abre la raiz del repositorio en GitHub.
3. Sube directamente `index.html`, la carpeta `js` y esta guia.
4. Permite reemplazar los archivos existentes.
5. Commit recomendado: `Hotfix 9.0.4: unificar inicializacion de Firestore`.
6. Espera GitHub Pages.
7. Abre `https://workspace-collab.github.io/wonkup-workspace/?v=904`.
8. Realiza una recarga forzada.
9. Ingresa con Cuenta WonkUp.
10. En Cloud Foundation pulsa `Migrar a Firestore`, confirma y espera el resultado.

## Resultado esperado

Durante el proceso:

- `Migracion en curso`
- `Iniciando la escritura de 41 documentos`

Al finalizar:

- `Operacion completada`
- un identificador `migration-...`
- `47 escrituras confirmadas`

Luego pulsa `Verificar datos`.
