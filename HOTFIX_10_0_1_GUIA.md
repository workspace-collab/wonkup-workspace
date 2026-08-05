# Hotfix 10.0.1 — Notificaciones del Kanban

## Problema corregido

Las operaciones del Kanban funcionaban en Firestore, pero la campana no recibía avisos en algunos casos. El caso observado tenía una tarjeta sin responsable ni participantes. El código anterior enviaba los comentarios únicamente al responsable y a los participantes; cuando ambos campos estaban vacíos, la lista de destinatarios quedaba vacía.

También se reforzó la relación entre personas del directorio y cuentas Firebase para usuarios activados mediante UID, persona o correo.

## Correcciones

- Los comentarios notifican al creador de la tarjeta y a quienes ya participaron en la conversación.
- Si una tarjeta no tiene responsable, participante ni creador identificable, el comentario avisa a los miembros Firebase activos del proyecto, excepto a quien realizó la acción.
- Los movimientos de tarjeta y cambios de fecha incluyen al creador entre los destinatarios.
- Las tarjetas nuevas guardan `createdById` y `createdByUid`.
- La resolución de destinatarios reconoce vínculos por `personId`, `authUid` y correo normalizado.
- Los destinatarios se deduplican y nunca se notifica al mismo actor que ejecutó la acción.
- La campana mantiene escucha en tiempo real y actualiza el contador sin recargar.
- Se actualizó el caché a `10.0.1`, incluyendo el Kanban abierto dentro de la ficha del proyecto.

## Instalación

1. Descomprime el ZIP.
2. En GitHub abre la raíz del repositorio, donde aparecen `index.html`, `js`, `css`, `data` y `firebase`.
3. Selecciona **Add file → Upload files**.
4. Arrastra directamente el contenido extraído.
5. Permite reemplazar los archivos existentes.
6. Usa el commit:

```text
Hotfix 10.0.1: corregir notificaciones del Kanban
```

7. Espera el despliegue de GitHub Pages.
8. Abre `https://workspace-collab.github.io/wonkup-workspace/?v=1001`.
9. Realiza una recarga forzada.

No es necesario publicar nuevamente las reglas de Firestore.

## Prueba recomendada

1. Abre el mismo proyecto con dos cuentas Firebase.
2. Con la cuenta A crea una tarjeta sin responsable.
3. Con la cuenta B agrega un comentario.
4. La cuenta A debe mostrar un contador rojo en la campana.
5. Abre la campana y confirma el aviso **Nuevo comentario en una tarea**.
6. Abre el aviso: debe llevar al Kanban correspondiente.
7. Marca la notificación como leída y confirma que el contador disminuya.

También prueba una tarjeta asignada a la cuenta B: al crearla o reasignarla, la cuenta B debe recibir **Nueva tarea asignada**.
