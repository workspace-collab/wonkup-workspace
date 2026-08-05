# Arquitectura — Kanban Cloud 10

## Patrón híbrido

`KanbanService` selecciona el adaptador según la sesión:

```text
session.source = firebase → FirebaseKanbanAdapter
session.source = mock     → MockKanbanAdapter
```

La decisión está centralizada y evita mezclar datos cloud y locales dentro de una misma sesión.

## Instancia Firebase

El adaptador reutiliza el singleton creado por `firebase-client.js`. No inicializa otra aplicación ni otra instancia de Firestore.

## Consistencia y concurrencia

- Las tarjetas tienen rutas e identificadores deterministas durante la migración.
- Los movimientos recalculan posiciones de la columna.
- Las actualizaciones masivas de tarjetas se dividen en lotes pequeños de cuatro documentos para respetar las evaluaciones de reglas.
- El tablero y la actividad se actualizan en un lote independiente.
- Los listeners `onSnapshot` observan el tablero y sus tarjetas.

## Modelo de autorización

Las reglas validan:

- usuario autenticado y perfil activo;
- membresía activa en workspace y proyecto;
- rol autorizado;
- coincidencia de `workspaceId`, `projectId` e ID del documento;
- esquema, título, columna, posición y estado de archivo.

El revisor puede leer el directorio necesario del Kanban y agregar comentarios, pero no modificar campos operativos ni actualizar la configuración del tablero.

## Notificaciones

Las notificaciones se guardan en:

```text
users/{recipientUid}/notifications/{notificationId}
```

El usuario destinatario puede leerlas y marcar `read/readAt`. La creación exige que el actor tenga acceso al proyecto asociado.

## Actividad

Cada acción relevante registra un documento inmutable en:

```text
workspaces/{workspaceId}/projects/{projectId}/activity/{eventId}
```

Incluye actor, tipo, tarjeta, fecha y metadatos de la operación.

## Migración

`kanban-migration-plan.js`:

- lee `wonkup.e4.1.kanban` y la clave heredada;
- utiliza el tablero demo como respaldo seguro;
- normaliza columnas y tarjetas al esquema 10;
- genera las rutas de tableros y tarjetas;
- detecta duplicados antes de escribir.

Cloud Foundation escribe primero los tableros y luego las tarjetas, registra auditoría y verifica los conteos en Firestore.
