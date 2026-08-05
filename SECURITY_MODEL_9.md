# Modelo de seguridad — Entrega 9

## Capas

La seguridad no depende de ocultar la configuración pública de Firebase. Se aplica mediante:

1. Firebase Authentication;
2. perfil activo en `users/{uid}`;
3. membresía del workspace;
4. membresía del proyecto;
5. reglas de Cloud Firestore;
6. validaciones del frontend como apoyo de experiencia, no como barrera definitiva;
7. App Check en una fase posterior.

## Roles

| Rol | Alcance principal |
|---|---|
| `superadmin` | Todos los workspaces y operaciones de fundación |
| `workspace_admin` | Administración de su workspace |
| `project_lead` | Gestión de proyectos asignados |
| `collaborator` | Operación interna en proyectos asignados |
| `client` | Consulta y acciones autorizadas del portal |
| `guest` | Consulta limitada |

## Identidad y directorio

Se distinguen dos conceptos:

- **Cuenta de acceso:** registro en Firebase Authentication, identificado por UID.
- **Persona del directorio:** registro en `workspaces/{workspaceId}/people/{personId}`.

Crear una persona desde el modal de proyecto no crea una contraseña. Para conceder acceso real:

1. crear la cuenta en Firebase Authentication;
2. copiar su UID;
3. abrir Cloud Foundation;
4. vincular el UID, el rol, los workspaces, los proyectos y opcionalmente la persona existente;
5. simular permisos;
6. activar el usuario.

## Perfil base

```text
users/{uid}
```

Campos relevantes:

- `uid`;
- `email`;
- `name`;
- `role`;
- `status`;
- `workspaceIds`;
- `projectIds`;
- `workspaceRoles`;
- `projectRoles`;
- `schemaVersion`.

El primer superadministrador se crea manualmente una sola vez desde Firestore Console. Después, la activación de otros usuarios se realiza desde el módulo Cloud Foundation.

## Reglas importantes

- una persona sin autenticar no puede leer ni escribir datos;
- una cuenta sin perfil activo queda bloqueada;
- un usuario no puede obtener datos de otro workspace por cambiar la URL;
- los roles de proyecto dependen de documentos de membresía cuyo ID es el UID;
- clientes e invitados solo consultan recursos e hitos con visibilidad autorizada;
- tarifas, costos y rentabilidad permanecen restringidos;
- la migración y la activación requieren un perfil `superadmin` activo;
- las eliminaciones físicas quedan bloqueadas durante Cloud Foundation.

## Datos sensibles y caché

La persistencia de Firestore en disco queda desactivada por defecto:

```javascript
enablePersistentCache: false
```

La aplicación usa caché en memoria. La persistencia multiventana debe activarse únicamente después de incorporar una confirmación de “dispositivo de confianza”, debido a que el Workspace contiene información financiera y del cliente.

## App Check

La integración con reCAPTCHA Enterprise está preparada, pero inicialmente desactivada:

```javascript
enableAppCheck: false
```

Ruta recomendada:

1. registrar la app y el dominio;
2. habilitar App Check sin enforcement;
3. observar métricas de solicitudes válidas y no verificadas;
4. corregir dominios o flujos;
5. activar enforcement de manera gradual.

Activarlo directamente sin observar métricas puede bloquear usuarios legítimos.

## Claves

Permitido en el frontend:

- objeto público de configuración Firebase;
- API key restringida a APIs de Firebase;
- app ID, project ID y sender ID.

Prohibido en GitHub:

- claves privadas de cuentas de servicio;
- archivos JSON de service account;
- contraseñas;
- claves de Gemini o Generative Language API;
- tokens de sesión;
- secretos de Apps Script o webhooks.

## Validación obligatoria en Firebase Console

Antes de activar el modo híbrido:

- usar Rules Playground;
- comprobar que un usuario anónimo sea rechazado;
- comprobar acceso de superadministrador;
- comprobar aislamiento por workspace;
- comprobar aislamiento por proyecto;
- comprobar que cliente e invitado no lean información financiera;
- comprobar que una cuenta inactiva sea rechazada.
