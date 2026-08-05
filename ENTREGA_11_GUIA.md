# Entrega 11 — Entregables y aprobaciones en Firestore

## Objetivo

Migrar el módulo de entregables y el Portal del Cliente a Cloud Firestore sin afectar los códigos demo ni los módulos que todavía permanecen locales.

La Entrega 11 parte de la versión estable 10.0.1 y conserva el singleton Firebase validado en las Entregas 9 y 10.

## Configuración activa

```javascript
release: '11.0.1',
authMode: 'hybrid',
projectMode: 'hybrid',
kanbanMode: 'hybrid',
canvasMode: 'mock',
deliverableMode: 'hybrid',
financeMode: 'mock',
reportMode: 'aggregate',
foundationMode: 'connected'
```

- Cuenta WonkUp: proyectos, Kanban y entregables usan Firestore.
- Código demo: conserva proyectos, Kanban y entregables en `localStorage`.
- Canvas y Finanzas todavía permanecen locales.

## Funciones incorporadas

- CRUD de entregables en Firestore.
- Versiones mediante enlaces a Drive, Figma, web, PDF o video.
- Checklist de aceptación.
- Envío a revisión.
- Aprobación y solicitud de cambios.
- Comentarios internos y del cliente.
- Archivo y restauración.
- Sincronización en tiempo real entre navegadores.
- Notificaciones por revisión, aprobación, cambios y comentarios.
- Portal del cliente conectado al mismo entregable Firestore.
- Migración idempotente desde Cloud Foundation.

## Ruta Firestore

```text
workspaces/{workspaceId}
  projects/{projectId}
    deliverables/{deliverableId}
```

Las versiones, comentarios, checklist e historial permanecen embebidos dentro del documento del entregable durante esta fase. Esto reduce consultas y conserva compatibilidad con la interfaz existente.

## Instalación sin terminal

1. Descomprime `WonkUp_Workspace_Entrega_11_ENTREGABLES_CLOUD_CAMBIOS_RAIZ.zip`.
2. Abre la raíz del repositorio en GitHub.
3. Confirma que allí aparecen `index.html`, `js`, `css`, `data` y `firebase`.
4. Selecciona **Add file → Upload files**.
5. Arrastra directamente todo el contenido extraído.
6. Permite reemplazar los archivos existentes.
7. Usa este commit:

```text
Entrega 11: entregables y aprobaciones en Firestore
```

8. Espera el despliegue de GitHub Pages.
9. Abre la aplicación con `?v=1100` y realiza una recarga forzada.

## Publicar reglas Firestore

Este paso es obligatorio. Subir `firebase/firestore.rules` a GitHub no actualiza Firebase Console.

1. En GitHub abre `firebase/firestore.rules`.
2. Copia todo el archivo.
3. En Firebase abre **Firestore Database → Reglas**.
4. Reemplaza las reglas anteriores.
5. Pulsa **Publicar**.

Las reglas nuevas conservan Kanban Cloud e incorporan permisos para entregables visibles e internos.

## Migración 11.1

Utiliza el navegador donde todavía se encuentran los entregables locales originales.

1. Inicia sesión mediante **Cuenta WonkUp** con el superadministrador.
2. Abre **Cloud Foundation**.
3. Busca **Migración 11.1 — Entregables y aprobaciones**.
4. Pulsa **Exportar entregables** y conserva el JSON.
5. Selecciona los workspaces requeridos.
6. Pulsa **Simular entregables**.
7. Confirma que no existan rutas duplicadas.
8. Pulsa **Migrar entregables**.
9. El botón cambiará a **Confirmar entregables**.
10. Pulsa nuevamente dentro de 20 segundos.
11. Espera el resultado de la operación.
12. Pulsa **Verificar entregables**.

Con el conjunto demostrativo se esperan:

```text
6 entregables
5 versiones
2 comentarios
6 documentos Firestore
```

La migración usa rutas deterministas y `merge: true`, por lo que puede repetirse sin crear duplicados.

## Matriz de permisos

| Rol | Visibilidad | Acciones |
|---|---|---|
| Superadministrador | Internos y cliente | Control completo |
| Administrador de workspace | Internos y cliente | Control completo en su workspace |
| Líder de proyecto | Internos y cliente | Crear, editar, versionar y gestionar revisión |
| Colaborador | Internos y cliente | Crear, editar, versionar y comentar |
| Revisor | Solo visibles para cliente | Consultar y comentar |
| Cliente | Solo visibles para cliente | Comentar, aprobar o solicitar cambios |
| Invitado | Solo visibles para cliente | Solo lectura |

## Validación recomendada

### Cuenta interna

```text
Crear entregable: funciona / no funciona
Editar entregable: funciona / no funciona
Agregar versión: funciona / no funciona
Checklist: funciona / no funciona
Enviar a revisión: funciona / no funciona
Archivo y restauración: funciona / no funciona
```

### Cuenta cliente

```text
Portal muestra entregable: funciona / no funciona
Versión abre correctamente: funciona / no funciona
Comentario se sincroniza: funciona / no funciona
Aprobar: funciona / no funciona
Solicitar cambios: funciona / no funciona
Información interna permanece oculta: funciona / no funciona
```

### Dos navegadores

```text
Nuevo entregable aparece en tiempo real: funciona / no funciona
Comentario aparece en tiempo real: funciona / no funciona
Cambio de estado aparece en tiempo real: funciona / no funciona
Notificación llega al destinatario: funciona / no funciona
Código demo conserva datos locales: funciona / no funciona
```

## Reversión

Ante una incidencia, cambia temporalmente:

```javascript
deliverableMode: 'mock'
```

No borres documentos Firestore durante la validación. El cambio permite continuar usando los entregables locales mientras se revisa el problema.
