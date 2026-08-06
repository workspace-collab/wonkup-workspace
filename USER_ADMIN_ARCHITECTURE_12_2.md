# Arquitectura 12.2 — Administración de usuarios

## Frontera de seguridad

El navegador no recibe credenciales de servicio ni permisos del Firebase Admin SDK. Las operaciones privilegiadas se ejecutan en Cloud Functions de segunda generación.

```text
Superadministrador autenticado
        ↓ callable + ID token
Cloud Function us-central1
        ↓ verifica users/{uid}: role=superadmin, status=active
Firebase Admin SDK
        ├── Authentication
        └── Cloud Firestore
```

## Funciones

| Función | Propósito |
|---|---|
| `wonkupUserAdminHealth` | Comprueba despliegue, región y autorización |
| `wonkupListManagedUsers` | Lista Authentication y combina perfiles Firestore |
| `wonkupInviteUser` | Crea identidad, perfil, membresías e índice de proyectos |
| `wonkupUpdateManagedUser` | Actualiza nombre, correo, rol y alcances |
| `wonkupSetManagedUserStatus` | Desactiva o reactiva Authentication y membresías |

## Controles

- Requiere Firebase Authentication.
- Requiere perfil Firestore activo con rol `superadmin`.
- No permite administrar cuentas `superadmin` desde la interfaz.
- Valida roles, correos, workspaces y proyectos.
- No devuelve la contraseña temporal al navegador.
- Revierte una identidad recién creada si falla la escritura del grafo de acceso.
- Registra auditoría en `system/schema/userAdminAudit/{auditId}`.
- Limita la función a tres instancias como protección operativa inicial.

## Grafo de acceso

```text
users/{uid}
users/{uid}/projectAssignments/{projectId}
workspaces/{workspaceId}/members/{uid}
workspaces/{workspaceId}/projects/{projectId}/members/{uid}
workspaces/{workspaceId}/people/{personId}   (cuando existe vínculo)
```

Los alcances retirados se marcan como `inactive`; no se eliminan físicamente.

## Invitación

La función crea una contraseña aleatoria no expuesta. El frontend solicita a Firebase Authentication el correo de restablecimiento. La persona establece una contraseña privada sin que el superadministrador la conozca.

## Limitaciones de la primera versión

- Lista hasta 250 identidades por ejecución.
- App Check permanece opcional hasta su activación global.
- La plantilla del correo se personaliza una vez en Firebase Console.
- El despliegue requiere el plan Blaze.
