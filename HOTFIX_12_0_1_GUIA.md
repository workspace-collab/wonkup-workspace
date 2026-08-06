# Hotfix 12.0.1 — Acceso compartido a canvases por proyecto

## Incidencia confirmada

La cuenta superadministradora podía abrir un canvas de un proyecto creado en Firestore, mientras una cuenta colaboradora del mismo workspace mostraba `0 activos` en Innovation Toolkit.

No era una pérdida de datos ni un fallo del listener del Canvas. Los canvases son recursos del proyecto, no del workspace completo. La cuenta colaboradora no tenía reconstruido en su sesión el alcance del proyecto `Proyecto de Prueba Cloud 9`.

Además, la versión 12.0.0 guardaba la membresía en:

```text
workspaces/{workspaceId}/projects/{projectId}/members/{uid}
```

pero no generaba un índice consultable por la propia cuenta para proyectos creados directamente en la nube. Por eso, aunque el miembro se asignara desde el proyecto, una nueva sesión podía seguir sin descubrirlo.

## Corrección aplicada

1. Se añadió el índice por usuario:

```text
users/{uid}/projectAssignments/{projectId}
```

2. Al asignar un miembro con una Cuenta WonkUp vinculada, el sistema escribe en una sola operación:
   - la membresía del proyecto;
   - el índice de asignación del usuario.
3. Al retirar un miembro, ambos registros quedan inactivos.
4. Al iniciar sesión, la cuenta combina:
   - los proyectos históricos de su perfil;
   - los proyectos del nuevo índice;
   - el rol real de la membresía del proyecto.
5. Cloud Foundation crea también este índice al activar nuevos usuarios.
6. Innovation Toolkit aclara que, en vista de workspace, muestra únicamente `Canvases accesibles`.
7. Se actualizó el versionado de caché a `12.0.1`.

## Instalación

### 1. No volver a migrar canvases

La migración 12.1 ya terminó correctamente. Este hotfix no cambia ni duplica canvases, notas, comentarios, versiones o enlaces.

### 2. Publicar primero las reglas de Firestore

1. Firebase Console → Firestore Database → Reglas.
2. Reemplaza las reglas actuales con `firebase/firestore.rules` del hotfix.
3. Pulsa **Publicar**.

Realtime Database no requiere cambios para este hotfix.

### 3. Actualizar GitHub Pages

1. Descomprime `WonkUp_Workspace_Hotfix_12_0_1_CAMBIOS.zip`.
2. Sube su contenido a la raíz del repositorio.
3. Permite reemplazar los archivos existentes.
4. Usa este commit:

```text
Hotfix 12.0.1: sincronizar asignaciones de proyecto y acceso a canvases
```

5. Espera el despliegue de GitHub Pages.

### 4. Renovar las sesiones

En ambos navegadores:

1. cierra sesión;
2. abre la aplicación con `?v=1201`;
3. realiza una recarga forzada;
4. inicia sesión nuevamente.

## Reparar la asignación del proyecto de prueba

Desde la cuenta superadministradora:

1. Entra a **Mis proyectos**.
2. Abre **Proyecto de Prueba Cloud 9**.
3. Entra a la pestaña **Equipo**.
4. Pulsa **Agregar miembro**.
5. Selecciona **Edinson Gonzales Pérez**.
6. Asigna el rol **Colaborador**.
7. Guarda.

Si Edinson ya aparecía en el equipo, vuelve a asignarlo mediante **Agregar miembro**. La operación usa `merge` y crea el nuevo índice sin duplicar a la persona.

Después, en la sesión de Edinson, cierra sesión e ingresa nuevamente para reconstruir sus permisos.

## Validación

1. Ambas cuentas deben mostrar el mismo canvas del proyecto.
2. Abre el mismo canvas en ambos navegadores.
3. Crea o edita una nota en una sesión.
4. El cambio debe aparecer en la otra sin recargar.
5. Agrega un comentario y mueve una nota.
6. Revisa Realtime Database mientras ambas pestañas estén abiertas.
7. Deben aparecer dos participantes bajo la misma ruta de `presence`.
8. Al cerrar una pestaña, su conexión debe desaparecer.

## Resultado esperado

```text
Superadministrador ve el canvas: sí
Colaborador asignado ve el mismo canvas: sí
Edición en tiempo real: sí
Presencia RTDB: dos participantes
Migración adicional: no requerida
```
