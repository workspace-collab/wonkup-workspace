# Entrega 10 — Kanban colaborativo en Firestore

## Objetivo

Migrar el Kanban operativo a Cloud Firestore sin afectar los módulos que todavía permanecen locales.

La fuente de datos se selecciona según la sesión:

```text
Cuenta WonkUp (Firebase) → Cloud Firestore
Código de demostración    → localStorage
```

## Alcance funcional

- Tablero principal y columnas configurables.
- Creación, edición y movimiento de tarjetas.
- Límites WIP.
- Checklist y comentarios.
- Archivo, restauración y eliminación definitiva autorizada.
- Plantillas de tablero.
- Sincronización en tiempo real entre navegadores.
- Actividad por proyecto.
- Notificaciones en la campana para asignaciones, comentarios, movimientos y cambios de fecha.
- Rol `reviewer`: lectura y comentarios sin editar la tarjeta.
- Migración y verificación desde Cloud Foundation.

## Rutas Firestore

```text
workspaces/{workspaceId}/projects/{projectId}/boards/main
workspaces/{workspaceId}/projects/{projectId}/boards/main/cards/{cardId}
workspaces/{workspaceId}/projects/{projectId}/activity/{eventId}
users/{uid}/notifications/{notificationId}
```

## Configuración activa

```javascript
authMode: 'hybrid',
projectMode: 'hybrid',
kanbanMode: 'hybrid',
canvasMode: 'mock',
deliverableMode: 'mock',
financeMode: 'mock'
```

## Instalación sin terminal

1. Descarga y descomprime `WonkUp_Workspace_Entrega_10_KANBAN_CLOUD_CAMBIOS_RAIZ.zip`.
2. Abre la raíz del repositorio GitHub, donde aparecen `index.html`, `js`, `css`, `data` y `firebase`.
3. Selecciona **Add file → Upload files**.
4. Arrastra directamente el contenido extraído.
5. Permite reemplazar los archivos existentes.
6. Usa el commit:

```text
Entrega 10: Kanban colaborativo en Firestore
```

7. Espera el despliegue de GitHub Pages.

## Publicación obligatoria de reglas

Subir `firebase/firestore.rules` a GitHub no actualiza Firebase.

1. Abre `firebase/firestore.rules` en GitHub y copia todo su contenido.
2. En Firebase Console entra a **Firestore Database → Reglas**.
3. Reemplaza las reglas anteriores.
4. Pulsa **Publicar**.

No ejecutes la migración Kanban antes de publicar estas reglas.

## Migración Kanban

Realiza la migración desde el navegador y perfil donde se encuentran los tableros locales que deseas conservar.

1. Abre `https://workspace-collab.github.io/wonkup-workspace/?v=1000`.
2. Realiza una recarga forzada.
3. Ingresa mediante **Cuenta WonkUp** con el superadministrador.
4. Abre **Cloud Foundation**.
5. En **Migración 10.1 — Kanban colaborativo**, pulsa **Exportar Kanban**.
6. Selecciona los workspaces.
7. Pulsa **Simular Kanban**.
8. Verifica tableros, tarjetas, documentos y ausencia de rutas duplicadas.
9. Pulsa **Migrar Kanban**.
10. Pulsa nuevamente **Confirmar Kanban**.
11. Espera el mensaje de finalización.
12. Pulsa **Verificar Kanban**.

La migración usa rutas deterministas y `merge`, por lo que puede repetirse sin duplicar tarjetas.

## Prueba colaborativa

1. Abre el mismo proyecto con dos cuentas Firebase en navegadores distintos.
2. Crea una tarjeta en el primer navegador.
3. Confirma que aparece automáticamente en el segundo.
4. Mueve la tarjeta, agrega checklist y comentario.
5. Verifica la actividad y las notificaciones.
6. Recarga ambos navegadores y confirma persistencia.

## Permisos esperados

| Rol | Kanban |
|---|---|
| Superadministrador | Control completo |
| Administrador de workspace | Control completo en su workspace |
| Líder de proyecto | Crear, editar, mover y configurar |
| Colaborador | Crear, editar, mover, checklist y comentarios |
| Revisor | Ver y comentar; no editar ni mover |
| Cliente | Sin acceso al Kanban interno |
| Invitado | Sin acceso |

## Reversión

Los accesos mediante códigos continúan usando el Kanban local. Si se necesita detener temporalmente el uso cloud, cambia únicamente:

```javascript
kanbanMode: 'mock'
```

en `js/config/runtime-config.js` y publica el cambio. Los documentos de Firestore no se eliminan.

## Módulos que permanecen locales

- Canvas Engine.
- Entregables.
- Finanzas y horas.
- Reportes financieros derivados de esos módulos.
