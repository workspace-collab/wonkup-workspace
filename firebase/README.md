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
