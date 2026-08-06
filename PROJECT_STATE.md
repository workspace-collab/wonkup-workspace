# PROJECT STATE

## Proyecto

WonkUp Workspace

## Fase actual

Entrega 12 — Canvas Engine colaborativo en Firebase

## Estado

CÓDIGO LISTO / DESPLIEGUE Y VALIDACIÓN REAL PENDIENTES

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
3. desplegar el código 12.0.0;
4. ejecutar respaldo, simulación, migración y verificación 12.1;
5. validar edición simultánea entre dos navegadores;
6. validar presencia y desconexión;
7. validar enlaces vigentes, vencidos y revocados;
8. validar permisos por proyecto;
9. confirmar que los códigos demo conservan los canvases locales;
10. confirmar que el smoke test Canvas 5.9 no presenta regresiones.
