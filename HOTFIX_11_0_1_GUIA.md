# Hotfix 11.0.1 — Sincronización de entregables por rol

## Incidencia corregida

La cuenta superadministradora podía ver los entregables en Firestore, mientras una cuenta asignada al mismo proyecto recibía:

```text
No se pudieron cargar los entregables
Las reglas de Firestore no permiten esta operación sobre el entregable.
```

No era una falla de sincronización de Firestore ni una pérdida de datos. La aplicación calculaba algunos permisos con el rol general del perfil, mientras Firestore validaba el rol específico guardado en la membresía del proyecto. Si ambos valores no coincidían exactamente, el navegador solicitaba una consulta más amplia que la autorizada y Firestore rechazaba toda la lectura.

## Correcciones

1. La sesión Firebase vuelve a leer la membresía real de cada proyecto al iniciar sesión.
2. Los permisos de Entregables utilizan el rol específico del proyecto.
3. Las reglas permiten a los miembros internos leer entregables internos y visibles para cliente.
4. Revisor, cliente e invitado solo leen entregables con `visibility: "client"`.
5. Si existe una sesión antigua con roles desactualizados, el adaptador reintenta una consulta segura de entregables visibles para cliente, en lugar de mostrar una pantalla vacía.
6. Se actualizó la caché a `11.0.1`.

## Instalación

1. Descomprime `WonkUp_Workspace_Hotfix_11_0_1_SINCRONIZACION_ENTREGABLES.zip`.
2. Abre la raíz del repositorio en GitHub.
3. Selecciona **Add file → Upload files**.
4. Arrastra directamente todo el contenido del ZIP.
5. Permite reemplazar los archivos existentes.
6. Usa este commit:

```text
Hotfix 11.0.1: corregir permisos y sincronización de entregables
```

7. Espera el despliegue de GitHub Pages.

## Paso obligatorio: publicar las reglas

Subir `firebase/firestore.rules` a GitHub no modifica Firebase automáticamente.

1. Abre `firebase/firestore.rules` en GitHub.
2. Copia todo el contenido.
3. En Firebase abre **Firestore Database → Reglas**.
4. Reemplaza las reglas anteriores.
5. Pulsa **Publicar**.

## Renovar las sesiones

Después de publicar:

1. Cierra sesión en ambas cuentas.
2. Abre la aplicación con `?v=1101`.
3. Realiza una recarga forzada.
4. Vuelve a iniciar sesión con cada Cuenta WonkUp.

Este paso obliga a reconstruir `projectRoles` desde las membresías reales de Firestore.

## No volver a migrar

No ejecutes nuevamente la migración de entregables. Los documentos ya están en Firestore y el hotfix solo corrige permisos, lectura y sincronización.

## Validación

Con superadministrador y colaborador dentro del mismo proyecto:

```text
El entregable aparece en ambas cuentas: funciona / no funciona
Nuevo entregable aparece en tiempo real: funciona / no funciona
Comentario aparece en tiempo real: funciona / no funciona
El colaborador puede abrir y editar: funciona / no funciona
Cliente o revisor solo ve entregables visibles: funciona / no funciona
```
