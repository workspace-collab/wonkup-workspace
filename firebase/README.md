# Firebase - Entrega 4

El Kanban funciona por defecto en `mock`, con persistencia en `localStorage` y sincronización entre pestañas mediante `BroadcastChannel`.

## No activar todavía sin Access Broker

Para usar Firestore se requiere:

1. Crear el proyecto en Firebase Console.
2. Activar Firestore.
3. Publicar `firestore.rules`.
4. Crear documentos de membresía por workspace y proyecto.
5. Generar un Firebase Custom Token desde Google Apps Script después de validar el código de acceso.
6. Completar `js/config/runtime-config.js`.
7. Cambiar `kanbanMode` de `mock` a `firebase`.

La configuración pública de Firebase puede estar en el frontend. La clave privada de servicio nunca debe subirse a GitHub.

## Colecciones

```text
workspaces/{workspaceId}
  members/{userId}
  projects/{projectId}
    members/{userId}
    boards/main
      cards/{cardId}
```

Los comentarios, checklist e historial se almacenan dentro de cada documento de tarjeta durante el MVP. Si una tarjeta crece demasiado, deberán migrarse a subcolecciones.

## Entrega 5 - Canvas Engine

La estructura prevista para colaboración en tiempo real es:

```text
workspaces/{workspaceId}/projects/{projectId}/canvases/{canvasId}
  notes/{noteId}
    comments/{commentId}
  history/{eventId}
```

La versión publicada continúa en `canvasMode: 'mock'`. No actives las reglas de Canvas hasta configurar Firebase Authentication y el broker de tokens de Apps Script. Los enlaces públicos de consulta del modo demo no representan todavía un mecanismo de seguridad productivo.

## Entrega 7 - Finanzas

Estructura prevista:

```text
workspaces/{workspaceId}/projects/{projectId}/finance/summary
  incomes/{incomeId}
  costs/{costId}
  timeEntries/{entryId}
  rates/{userId}
```

Las reglas incluidas separan:

- administración financiera;
- registro de horas;
- tarifas privadas;
- acceso de líderes y colaboradores.

La versión publicada continúa en `financeMode: 'mock'`.
