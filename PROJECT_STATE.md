# PROJECT STATE

## Proyecto

WonkUp Workspace

## Fase actual

Entrega 12 — Canvas Engine colaborativo + Ajustes 12.2–12.4

## Estado

AJUSTE 12.4 CÓDIGO LISTO / CONFIGURACIÓN GEMINI Y VALIDACIÓN REAL PENDIENTES

## Fases cerradas

- Entregas 0 a 10 y sus ajustes/hotfixes aprobados.
- Entrega 11 — Entregables y aprobaciones en Firestore.
- Hotfix 11.0.1 — permisos por proyecto y sincronización de entregables, validado y cerrado.

## Construido en Entrega 12

- `canvasMode: 'hybrid'`.
- Adaptador Firestore completo para cuentas Firebase.
- Persistencia local intacta para códigos demo.
- Canvases, notas y comentarios en subcolecciones independientes.
- Historial y puntos de control.
- Restauración exclusiva del superadministrador con respaldo previo.
- Archivo lógico sin borrado físico.
- Sincronización mediante `onSnapshot`.
- Presencia por conexión en Realtime Database.
- Enlaces públicos sanitizados con vencimiento y revocación.
- Permisos basados en la membresía específica del proyecto.
- Migración 12.1 con respaldo, simulación, rutas deterministas, confirmación y verificación.
- Realtime Database configurada en `https://wonkup-workspace-default-rtdb.firebaseio.com`.

## Fuente de datos

| Dominio | Cuenta Firebase | Código demo |
|---|---|---|
| Acceso | Firebase Authentication | Adaptador mock |
| Proyectos | Cloud Firestore | localStorage |
| Kanban | Cloud Firestore | localStorage |
| Entregables | Cloud Firestore | localStorage |
| Canvas | Cloud Firestore + presencia RTDB | localStorage |
| Finanzas | localStorage | localStorage |

## Condición de cierre

La Entrega 12 se cierra después de:

1. publicar las reglas Firestore 12;
2. publicar las reglas de Realtime Database;
3. desplegar el código 12.2.0;
4. ejecutar respaldo, simulación, migración y verificación 12.1;
5. validar edición simultánea entre dos navegadores;
6. validar presencia y desconexión;
7. validar enlaces vigentes, vencidos y revocados;
8. validar permisos por proyecto;
9. confirmar que los códigos demo conservan los canvases locales;
10. confirmar que el smoke test Canvas 5.9 no presenta regresiones.

## Incidencia 12.0.1

Durante la validación con dos cuentas se confirmó que una cuenta colaboradora no descubría canvases de un proyecto creado directamente en Firestore. El Hotfix 12.0.1 incorpora un índice de asignaciones por usuario y requiere volver a asignar al colaborador al proyecto de prueba, renovar la sesión y repetir la validación colaborativa.


## Ajuste 12.2 — Usuarios e invitaciones

- Ruta `#/master/users` exclusiva de superadministrador.
- Creación de cuentas mediante Cloud Functions y Firebase Admin SDK.
- Correo para que la persona defina su contraseña.
- Listado, edición, reenvío, desactivación y reactivación.
- Asignación de workspaces, proyectos y roles.
- Auditoría administrativa.
- Botón de actualización del frontend en el menú del perfil.
- Requiere migrar el proyecto Firebase de Spark a Blaze para desplegar funciones.

## Ajuste 12.3 — Compartir Canvas por persona

Estado: DESPLEGADO / VALIDACIÓN FUNCIONAL EN CURSO.

- Permisos: `viewer`, `commenter`, `editor`.
- Acceso vinculado al UID de una Cuenta WonkUp activa.
- Enlace personalizado con vencimiento y revocación.
- Edición y comentarios sincronizados mediante Firestore.
- Presencia compartida mediante Realtime Database.
- Enlaces públicos anónimos preservados como solo lectura.
- Cloud Functions de creación, listado, actualización, revocación y resolución.

## Ajuste 12.4 — WonkUp AI Coach

Estado: CÓDIGO Y PRUEBAS LOCALES COMPLETADOS / SECRETO GEMINI Y VALIDACIÓN REAL PENDIENTES.

- Facilitador IA dentro del Canvas Engine para Mapa de Empatía, Propuesta de Valor, Lean Canvas, Business Model Canvas, Priorización y Pitch Canvas.
- Acciones: preguntas guía, revisión metodológica y propuesta de notas.
- Las propuestas se agregan solo después de selección y confirmación explícita del usuario.
- `GEMINI_API_KEY` se mantiene en Firebase Secret Manager.
- Modelo predeterminado: `gemini-2.5-flash`, configurable mediante `GEMINI_MODEL`.
- Cuotas iniciales: 30 consultas por usuario/día y 1,000 globales/día.
- Firestore conserva únicamente métricas de consumo; no se guardan prompts ni respuestas de IA en `aiUsage`.
- La IA está habilitada para miembros internos con edición y accesos personalizados `commenter/editor`; solo quienes pueden editar pueden insertar notas.
