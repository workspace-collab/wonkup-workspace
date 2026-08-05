# Arquitectura — Entregables Cloud 11

## Principio de transición

Entrega 11 utiliza un adaptador híbrido. La selección de fuente depende de la sesión:

```text
Cuenta Firebase → FirebaseDeliverableAdapter → Cloud Firestore
Código demo     → MockDeliverableAdapter     → localStorage
```

## Componentes

```text
DeliverablesView / ClientPortalView
              ↓
       DeliverableService
       ↙             ↘
MockDeliverable      FirebaseDeliverable
Adapter              Adapter
   ↓                     ↓
localStorage          Cloud Firestore
```

`FirebaseDeliverableAdapter` reutiliza `getFirebaseClient()` y la única instancia Firebase compartida. No inicializa otra aplicación ni otra instancia Firestore.

## Modelo documental

```text
workspaces/{workspaceId}/projects/{projectId}/deliverables/{deliverableId}
```

Campos principales:

```text
id
workspaceId
projectId
title
type
description
status
visibility
priority
dueDate
ownerId
ownerName
archived
checklist[]
versions[]
comments[]
history[]
schemaVersion
createdAt
updatedAt
```

Estados admitidos:

```text
draft
in_review
changes_requested
approved
```

Visibilidad:

```text
internal
client
```

## Tiempo real

La vista activa registra un `onSnapshot` sobre la colección de entregables del proyecto.

- Usuarios internos consultan todos los entregables del proyecto.
- Cliente, revisor e invitado consultan únicamente `visibility == 'client'`.
- Los listeners se cierran al salir de la vista para evitar lecturas acumulativas.

## Seguridad

La autorización real reside en `firebase/firestore.rules`.

- La lectura requiere membresía activa en el proyecto.
- Los usuarios externos solo pueden leer entregables visibles para cliente.
- La creación y gestión completa corresponde a roles internos.
- El cliente puede modificar solamente estado, campos de aprobación/cambios, comentarios e historial.
- El revisor puede comentar, pero no aprobar ni editar el contenido operativo.
- El invitado es de solo lectura.
- La eliminación física está bloqueada; se utiliza archivo lógico.

## Notificaciones

Rutas:

```text
users/{uid}/notifications/{notificationId}
```

Audiencias:

- Envío a revisión → clientes y revisores.
- Aprobación o solicitud de cambios → equipo interno.
- Comentario externo → equipo interno.
- Comentario interno → clientes y revisores.

El actor de la operación se excluye de los destinatarios.

## Migración

La migración lee `wonkup.e6.deliverables` o, si no existe, usa el conjunto demo.

Cada entregable produce una ruta determinista. Los documentos se escriben en lotes pequeños compatibles con las reglas. Al terminar se actualiza:

```text
system/schema
system/schema/migrations/{migrationId}
```

## Decisión sobre datos embebidos

Versiones, comentarios e historial permanecen embebidos en esta entrega para:

- conservar compatibilidad con la interfaz estable;
- reducir complejidad de migración;
- evitar múltiples listeners;
- permitir una sola actualización atómica por interacción.

Antes de superar los límites prácticos del documento Firestore deberán migrarse a subcolecciones. Los adaptadores ya mantienen contratos que permiten esa evolución sin cambiar la interfaz pública de `DeliverableService`.
