# Firebase — Cloud Foundation 9

## Propósito

Esta carpeta contiene los archivos que se publican manualmente desde Firebase Console, sin terminal:

- `firestore.rules`: modelo de autorización;
- `firestore.indexes.json`: índices compuestos previstos;
- `BOOTSTRAP_SUPERADMIN.json`: perfil inicial de ejemplo;
- `RUNTIME_CONFIG_EXAMPLE.js`: configuración pública de ejemplo;
- `USER_ACTIVATION_EXAMPLE.json`: ejemplo de asignación de permisos;
- `realtime-database.rules.json`: reserva técnica para presencia futura; no se activa en Entrega 9.

## Estado de los módulos

| Dominio | Estado Entrega 9 |
|---|---|
| Authentication | Preparado para activación real |
| Usuarios y roles | Firestore |
| Workspaces | Migración habilitada |
| Clientes y personas | Migración habilitada |
| Proyectos y miembros | Adaptador Firestore habilitado |
| Recursos e hitos | Adaptador Firestore habilitado |
| Kanban | Continúa mock |
| Canvas Engine | Continúa mock |
| Entregables | Continúa mock |
| Finanzas | Continúa mock |

## Regla de seguridad principal

El UID de Firebase Authentication es la identidad de autorización. Los documentos de membresía productivos utilizan el UID como ID:

```text
workspaces/{workspaceId}/members/{uid}
workspaces/{workspaceId}/projects/{projectId}/members/{uid}
```

Los registros del directorio interno usan `personId` y pueden vincularse mediante `authUid`.

## Publicación sin terminal

1. Firestore Console > Rules.
2. Pega `firestore.rules`.
3. Publica.
4. Usa Rules Playground para probar los roles.
5. No es necesario crear índices compuestos para las consultas de la Entrega 9.

Consulta `../FIREBASE_SIN_TERMINAL.md` para el procedimiento completo.

## Precauciones

- No subas cuentas de servicio.
- No uses una clave de Gemini en el frontend.
- No actives persistencia en dispositivos compartidos.
- No actives App Check enforcement antes de observar métricas.
- No cambies Kanban, Canvas, Entregables o Finanzas a Firebase en esta entrega.
