# Firebase — Cloud Foundation 12

## Propósito

Esta carpeta contiene los archivos que se publican manualmente desde Firebase Console, sin terminal:

- `firestore.rules`: autorización de usuarios, workspaces, proyectos, Kanban, entregables y Canvas;
- `realtime-database.rules.json`: presencia colaborativa del Canvas;
- `firestore.indexes.json`: índices compuestos previstos;
- `BOOTSTRAP_SUPERADMIN.json`: perfil inicial de ejemplo;
- `RUNTIME_CONFIG_EXAMPLE.js`: configuración pública de ejemplo;
- `USER_ACTIVATION_EXAMPLE.json`: ejemplo de asignación de permisos.

## Estado de los módulos

| Dominio | Estado Entrega 12 |
|---|---|
| Authentication | Activo en modo híbrido |
| Usuarios y roles | Cloud Firestore |
| Workspaces, clientes y personas | Cloud Firestore |
| Proyectos y miembros | Cloud Firestore |
| Kanban | Híbrido; Firestore para cuentas reales |
| Entregables | Híbrido; Firestore para cuentas reales |
| Canvas Engine | Híbrido; Firestore para cuentas reales |
| Presencia Canvas | Realtime Database |
| Finanzas | Continúa local |

## Rutas Canvas

```text
workspaces/{workspaceId}/projects/{projectId}/canvases/{canvasId}
workspaces/{workspaceId}/projects/{projectId}/canvases/{canvasId}/notes/{noteId}
workspaces/{workspaceId}/projects/{projectId}/canvases/{canvasId}/notes/{noteId}/comments/{commentId}
workspaces/{workspaceId}/projects/{projectId}/canvases/{canvasId}/history/{eventId}
workspaces/{workspaceId}/projects/{projectId}/canvases/{canvasId}/versions/{versionId}
workspaces/{workspaceId}/projects/{projectId}/canvases/{canvasId}/shareLinks/{shareId}
canvasShares/{shareCode}
```

## Ruta de presencia

```text
presence/{workspaceId}/{projectId}/{canvasId}/{uid}/{clientId}
```

## Publicación sin terminal

1. Publica `firestore.rules` en Firestore Database → Reglas.
2. Publica `realtime-database.rules.json` en Realtime Database → Reglas.
3. Sube el código de Entrega 12 a GitHub Pages.
4. Ejecuta la Migración 12.1 desde Cloud Foundation.

Subir las reglas al repositorio no las publica automáticamente en Firebase.

## Precauciones

- No subas cuentas de servicio ni claves privadas.
- No abras Realtime Database en modo de prueba.
- No agregues datos de presencia manualmente.
- No habilites eliminación física de canvases desde el navegador.
- App Check continúa sin enforcement hasta finalizar las pruebas reales.
