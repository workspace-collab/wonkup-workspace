# Firebase — Cloud Foundation 10

## Propósito

Esta carpeta contiene los archivos que se publican manualmente desde Firebase Console, sin terminal:

- `firestore.rules`: autorización de usuarios, workspaces, proyectos y Kanban;
- `firestore.indexes.json`: índices compuestos previstos;
- `BOOTSTRAP_SUPERADMIN.json`: perfil inicial de ejemplo;
- `RUNTIME_CONFIG_EXAMPLE.js`: configuración pública de ejemplo;
- `USER_ACTIVATION_EXAMPLE.json`: ejemplo de asignación de permisos;
- `realtime-database.rules.json`: reserva técnica para presencia futura.

## Estado de los módulos

| Dominio | Estado Entrega 10 |
|---|---|
| Authentication | Activo en modo híbrido |
| Usuarios y roles | Cloud Firestore |
| Workspaces, clientes y personas | Cloud Firestore |
| Proyectos y miembros | Cloud Firestore |
| Kanban | Híbrido; Firestore para cuentas reales |
| Actividad Kanban | Cloud Firestore |
| Notificaciones Kanban | Cloud Firestore |
| Canvas Engine | Continúa local |
| Entregables | Continúa local |
| Finanzas | Continúa local |

## Rutas Kanban

```text
workspaces/{workspaceId}/projects/{projectId}/boards/main
workspaces/{workspaceId}/projects/{projectId}/boards/main/cards/{cardId}
workspaces/{workspaceId}/projects/{projectId}/activity/{eventId}
users/{uid}/notifications/{notificationId}
```

## Publicación sin terminal

1. Abre `firestore.rules` en GitHub y copia su contenido completo.
2. Firebase Console → Firestore Database → Reglas.
3. Reemplaza las reglas anteriores.
4. Pulsa **Publicar**.
5. Ejecuta la migración Kanban desde Cloud Foundation.

Subir las reglas al repositorio no las publica automáticamente en Firebase.

## Roles Kanban

- `superadmin`, `workspace_admin`: control completo.
- `project_lead`: edición y configuración.
- `collaborator`: operación diaria.
- `reviewer`: lectura y comentarios.
- `client`, `guest`: sin acceso al Kanban interno.

## Precauciones

- No subas cuentas de servicio.
- No uses claves privadas o de Gemini en el frontend.
- No actives persistencia en dispositivos compartidos.
- App Check continúa sin enforcement hasta finalizar las pruebas reales.
- No cambies Canvas, Entregables o Finanzas a Firebase en esta entrega.
