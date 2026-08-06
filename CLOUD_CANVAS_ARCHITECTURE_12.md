# Arquitectura Cloud del Canvas Engine — Entrega 12

## Objetivo

Migrar el Innovation Toolkit y el Canvas Engine a Firebase para las cuentas reales de WonkUp, conservando los códigos demo en `localStorage` y manteniendo las funciones aprobadas en los ajustes 5.1 a 5.9.

## Estrategia híbrida

| Tipo de sesión | Fuente del Canvas |
|---|---|
| Cuenta Firebase | Cloud Firestore + Realtime Database |
| Código demo | `localStorage` |

La selección se realiza con `canvasMode: 'hybrid'`. Cambiar temporalmente a `mock` revierte las cuentas a la fuente local sin eliminar la información ya migrada.

## Modelo Firestore

```text
workspaces/{workspaceId}
  projects/{projectId}
    canvases/{canvasId}
      notes/{noteId}
        comments/{commentId}
      history/{eventId}
      versions/{versionId}
      shareLinks/{shareId}

canvasShares/{shareCode}
```

### Documento de canvas

Conserva metadatos, contadores, plantilla, estado, versión y trazabilidad. Las notas no se incrustan en el documento principal para evitar que dos usuarios sobrescriban el canvas completo.

### Notas y comentarios

Cada nota es un documento independiente. Los comentarios se almacenan bajo su nota. Los movimientos usan una posición numérica fraccionaria, por lo que no es necesario reescribir toda la sección al arrastrar una tarjeta.

### Historial y versiones

- `history`: eventos inmutables con actor y fecha.
- `versions`: puntos de control completos para restauración.
- La restauración está limitada al superadministrador.
- Antes de restaurar se crea un respaldo del estado actual.
- La restauración se bloquea si excede el límite seguro de una operación atómica.

## Presencia en Realtime Database

```text
presence/{workspaceId}/{projectId}/{canvasId}/{uid}/{clientId}
```

Cada pestaña registra una conexión distinta. La desconexión elimina automáticamente la presencia de esa pestaña. Los datos se limitan a UID, identificador interno, nombre, iniciales, cliente y última actividad.

Instancia configurada:

```text
https://wonkup-workspace-default-rtdb.firebaseio.com
```

## Enlaces públicos sanitizados

La ruta pública se conserva:

```text
#/share/canvas/{code}
```

El navegador consulta `canvasShares/{code}`, que contiene únicamente:

- título y plantilla;
- versión y contadores;
- notas visibles;
- fecha de vencimiento;
- estado activo.

No incluye comentarios, historial, miembros, UID, permisos ni versiones internas. La colección no se puede listar y los documentos no se eliminan físicamente; al revocar, el acceso queda inactivo.

## Permisos

| Rol del proyecto | Lectura | Crear instancia | Editar notas | Administrar canvas | Restaurar versión |
|---|---:|---:|---:|---:|---:|
| Superadministrador | Sí | Sí | Sí | Sí | Sí |
| Administrador de workspace | Sí | Sí | Sí | Sí | No |
| Líder de proyecto | Sí | Sí | Sí | Sí | No |
| Colaborador | Sí | Sí | Sí | No | No |
| Revisor | No | No | No | No | No |
| Cliente | Solo enlace público | No | No | No | No |
| Invitado | Solo enlace público | No | No | No | No |

Los permisos se calculan con la membresía específica del proyecto, no únicamente con el rol general del perfil.

## Sincronización

- Firestore `onSnapshot` notifica cambios del canvas a otras pestañas.
- Cada mutación se ejecuta mediante transacción o lote controlado.
- La vista vuelve a consultar el canvas sin reconstrucciones intermedias innecesarias.
- La presencia se actualiza con Realtime Database.

## Migración 12.1

Cloud Foundation incorpora:

1. exportación del respaldo local;
2. selección de workspaces;
3. simulación y detección de rutas duplicadas;
4. migración por etapas con `merge`;
5. conversión de vencimientos a `Timestamp`;
6. registro en `system/schema/migrations`;
7. verificación de canvases, notas, comentarios, historial, versiones y enlaces.

Las rutas son deterministas. Repetir la migración actualiza los mismos documentos en lugar de crear copias con identificadores distintos.

## Reversión

Ante un bloqueo operativo:

```javascript
canvasMode: 'mock'
```

La aplicación vuelve a los canvases locales. Los documentos existentes en Firebase permanecen disponibles para diagnóstico y no se eliminan.
