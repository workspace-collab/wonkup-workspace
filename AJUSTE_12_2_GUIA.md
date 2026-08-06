# Ajuste 12.2 — Usuarios e invitaciones desde WonkUp

## Objetivo

Permitir que el superadministrador cree y administre cuentas reales desde **Administración → Usuarios**, sin crear primero cada identidad en Firebase Console.

## Qué incorpora

- Creación segura de identidades mediante Firebase Admin SDK.
- Envío de correo para que cada persona defina su propia contraseña.
- Asignación de rol, workspaces y proyectos desde WonkUp.
- Edición de permisos y alcance.
- Desactivación y reactivación sin eliminar historial.
- Reenvío del correo de acceso.
- Directorio de cuentas con estado, rol, workspaces y último ingreso.
- Auditoría administrativa en Firestore.
- Botón **Actualizar aplicación** dentro del menú del perfil.
- Formulario manual por UID conservado como contingencia en Cloud Foundation.

## Requisito obligatorio

El proyecto Firebase está actualmente en el plan **Spark**. Para desplegar Cloud Functions debe cambiarse una sola vez al plan **Blaze** y vincular una cuenta de facturación.

El ajuste no puede crear cuentas desde WonkUp mientras las funciones no estén desplegadas.

## Instalación

### 1. Conservar el respaldo estable

Guarda la versión 12.0.1 y el ZIP completo antes de reemplazar archivos.

### 2. Cambiar Firebase a Blaze

1. Abre Firebase Console.
2. En la esquina inferior izquierda, pulsa **Actualizar**.
3. Selecciona **Blaze: pago por uso**.
4. Vincula o crea una cuenta de facturación.
5. Configura una alerta de presupuesto en Google Cloud Billing.

La función se configura con máximo tres instancias y sin instancias mínimas.

### 3. Actualizar GitHub Pages

1. Descomprime `WonkUp_Workspace_Ajuste_12_2_CAMBIOS.zip`.
2. Copia su contenido en la raíz del repositorio.
3. Conserva la estructura de carpetas.
4. Reemplaza los archivos existentes.
5. No subas el ZIP como un solo archivo.
6. Confirma que aparezcan las carpetas `functions/` y `firebase/`, además de `firebase.json` y `.firebaserc`.

Commit recomendado:

```text
Ajuste 12.2: usuarios e invitaciones desde WonkUp
```

### 4. Desplegar las funciones una sola vez

La vía más sencilla es Google Cloud Shell, que funciona desde el navegador.

```bash
git clone https://github.com/workspace-collab/wonkup-workspace.git
cd wonkup-workspace
npm install -g firebase-tools
firebase use wonkup-workspace
cd functions
npm install
cd ..
firebase deploy --only functions,firestore:rules
```

Si el repositorio ya estaba clonado:

```bash
cd wonkup-workspace
git pull
cd functions
npm install
cd ..
firebase deploy --only functions,firestore:rules
```

El despliegue debe crear estas funciones en `us-central1`:

- `wonkupUserAdminHealth`
- `wonkupListManagedUsers`
- `wonkupInviteUser`
- `wonkupUpdateManagedUser`
- `wonkupSetManagedUserStatus`

### 5. Personalizar el correo

En Firebase:

**Authentication → Plantillas → Restablecimiento de contraseña**

Texto recomendado:

- Asunto: `Activa tu acceso a WonkUp Workspace`
- Remitente visible: `WonkUp Workspace`
- Mensaje: indicar que la persona fue invitada y debe definir su contraseña.

WonkUp utiliza el flujo seguro de restablecimiento para que el administrador nunca conozca la contraseña del usuario.

### 6. Validar el backend

1. Ingresa como superadministrador.
2. Abre **Cloud Foundation**.
3. Pulsa **Probar conexión**.
4. Debe aparecer `Cloud Functions — Correcto`.

### 7. Crear la primera cuenta desde WonkUp

1. Abre **Administración → Usuarios**.
2. Pulsa **Invitar usuario**.
3. Completa nombre y correo.
4. Selecciona el rol.
5. Selecciona uno o más workspaces.
6. Para roles de proyecto, selecciona al menos un proyecto.
7. Pulsa **Crear e invitar**.

El sistema realizará automáticamente:

1. creación en Firebase Authentication;
2. creación del perfil Firestore;
3. creación de membresías e índices de proyectos;
4. envío del correo para definir contraseña.

## Roles disponibles

| Rol | Alcance principal |
|---|---|
| Administrador de workspace | Administra los workspaces asignados y sus proyectos |
| Líder de proyecto | Gestiona proyectos concretos, equipo, Kanban, Canvas y entregables |
| Colaborador | Ejecuta tareas, notas, comentarios y entregables en proyectos asignados |
| Revisor | Consulta y comenta recursos autorizados |
| Cliente | Revisa, comenta, aprueba o solicita cambios en entregables |
| Invitado | Lectura limitada de recursos compartidos |

La cuenta `superadmin` no se crea ni se desactiva desde este módulo para evitar perder el acceso maestro.

## Actualizaciones futuras

Desde esta versión, el menú del perfil incluye **Actualizar aplicación**. El botón agrega automáticamente un identificador de actualización y recarga el frontend sin borrar sesiones demo ni `localStorage`.

## Reversión

- Restaurar el frontend 12.0.1 desactiva visualmente el módulo nuevo.
- Las funciones desplegadas no modifican datos por sí solas; solo responden a solicitudes autenticadas de un superadministrador.
- No elimines usuarios de Authentication para revertir. Puedes desactivarlos desde el módulo o Firebase.

## Validación requerida

- Cloud Functions aparece como correcta en diagnóstico.
- Usuarios lista las cuentas existentes.
- Una invitación crea Authentication y perfil Firestore.
- El correo llega y permite definir contraseña.
- La cuenta ingresa y solo ve los workspaces/proyectos asignados.
- Desactivar impide el ingreso sin eliminar el historial.
- Reactivar restablece el acceso.
