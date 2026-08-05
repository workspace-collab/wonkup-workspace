# Hotfix 9.0.5 — Migración compatible con Firestore Rules

## Diagnóstico confirmado

La migración ya llega a Cloud Firestore. El mensaje `permission-denied` se producía por dos incompatibilidades reales del código:

1. Se intentaban escribir hasta 41 documentos en un solo lote, mientras las reglas consultan el perfil de acceso para autorizar cada escritura. Firestore limita las llamadas `get()`, `exists()` y `getAfter()` a 20 por escritura en lote.
2. El formulario de miembros permite el rol `reviewer`, pero las reglas publicadas no lo aceptaban como rol de proyecto.

## Correcciones

- Lotes pequeños de máximo 4 documentos.
- Migración ordenada por etapas: Workspaces, membresías del superadministrador, clientes, personas, proyectos y miembros.
- Confirmación visible de dos clics dentro de WonkUp.
- Normalización de estados y roles heredados.
- Rol `reviewer` admitido por las reglas como revisor de solo lectura.
- Mensaje exacto con etapa y rutas si una regla vuelve a rechazar una escritura.
- Caché renovada a `9.0.5`.

## Instalación sin terminal

1. Descomprime el ZIP.
2. En GitHub abre la raíz del repositorio, donde aparecen `index.html`, `js`, `css` y `firebase`.
3. Selecciona **Add file → Upload files**.
4. Sube directamente `index.html`, `js`, `firebase` y esta guía.
5. Permite reemplazar los archivos.
6. Commit sugerido:

   `Hotfix 9.0.5: corregir reglas y lotes de migración`

## Paso obligatorio: volver a publicar las reglas

El archivo de GitHub no actualiza automáticamente Firebase Console.

1. En GitHub abre `firebase/firestore.rules`.
2. Copia todo el contenido.
3. En Firebase abre **Firestore Database → Reglas**.
4. Reemplaza el contenido completo.
5. Pulsa **Publicar**.

## Ejecutar la migración

1. Abre `https://workspace-collab.github.io/wonkup-workspace/?v=905`.
2. Haz recarga forzada.
3. Ingresa con **Cuenta WonkUp**.
4. Abre **Cloud Foundation**.
5. Pulsa **Migrar a Firestore**.
6. El mismo botón cambiará a **Confirmar migración**.
7. Pulsa **Confirmar migración** dentro de 20 segundos.
8. Espera sin recargar.
9. Resultado esperado: 47 escrituras confirmadas.
10. Pulsa **Verificar datos**.

La operación usa rutas deterministas y `merge`, por lo que puede repetirse sin duplicar los registros.
