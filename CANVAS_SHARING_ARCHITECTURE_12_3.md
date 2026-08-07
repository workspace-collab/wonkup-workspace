# Arquitectura 12.3 — Compartir Canvas por persona

## Objetivo

Permitir que el propietario o líder de un Canvas conceda acceso individual a una Cuenta WonkUp activa sin convertir a la persona en miembro del proyecto completo.

## Modal Compartir

El modal diferencia dos mecanismos:

1. **Acceso personalizado:** autenticado, revocable y con permisos granulares.
2. **Enlace público:** anónimo y siempre de solo lectura.

## Permisos

| Permiso | Lectura en vivo | Comentarios | Crear/editar/mover notas | Administrar Canvas |
|---|---:|---:|---:|---:|
| `viewer` | Sí | No | No | No |
| `commenter` | Sí | Sí | No | No |
| `editor` | Sí | Sí | Sí | No |

Los accesos compartidos no habilitan historial, versiones, vinculación con otros canvases, creación de tareas, archivo del Canvas ni administración del proyecto.

## Modelo Firestore

```text
workspaces/{workspaceId}/projects/{projectId}/canvases/{canvasId}
  access/{uid}
  shareLinks/person-{uid}
  notes/{noteId}/comments/{commentId}
  history/{eventId}

canvasShareAccess/{token}
```

- `access/{uid}` es la fuente de autorización consultada por las reglas.
- `shareLinks/person-{uid}` conserva metadatos administrativos internos.
- `canvasShareAccess/{token}` permite resolver el enlace desde una Cloud Function; el navegador no puede leer esta colección directamente.
- Los enlaces públicos siguen usando `canvasShares/{code}` con snapshots sanitizados.

## Cloud Functions

- `wonkupCreateCanvasShareAccess`
- `wonkupListCanvasShareAccess`
- `wonkupUpdateCanvasShareAccess`
- `wonkupRevokeCanvasShareAccess`
- `wonkupResolveCanvasShareAccess`

Las cuatro primeras requieren superadministrador, administrador del workspace o líder del proyecto. La función de resolución valida token, vigencia, estado, UID autorizado, perfil activo y documento de acceso.

## Seguridad

- El token es aleatorio y no sustituye la autenticación.
- Un usuario autenticado con otro UID recibe denegación.
- El acceso vence automáticamente según `expiresAt`.
- La revocación desactiva el grant, el enlace interno y el índice privado.
- Las escrituras administrativas se realizan con Firebase Admin SDK.
- Las reglas permiten al comentarista modificar únicamente contadores y crear comentarios propios.
- Los enlaces personalizados se excluyen de la actualización de snapshots públicos.

## Tiempo real

Firestore mantiene notas y comentarios sincronizados con `onSnapshot`. Realtime Database mantiene presencia efímera por pestaña mediante `onDisconnect()`.
