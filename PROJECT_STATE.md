# PROJECT STATE

## Proyecto

WonkUp Workspace

## Fase actual

Entrega 12 — Motor de Lienzos colaborativo + Ajustes 12.2–12.5

## Estado

AJUSTE 12.5 VALIDADO EN PRODUCCIÓN / HOTFIX 12.5.1 DE COSTEO PREPARADO PARA DESPLIEGUE

## Fases cerradas

- Entregas 0 a 10 y sus ajustes/hotfixes aprobados.
- Entrega 11 — Entregables y aprobaciones en Firestore.
- Hotfix 11.0.1 — permisos por proyecto y sincronización de entregables, validado y cerrado.

## Construido en Entrega 12

- `canvasMode: 'hybrid'`.
- Adaptador Firestore completo para cuentas Firebase.
- Persistencia local intacta para códigos demo.
- Lienzos, notas y comentarios en subcolecciones independientes.
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
| Lienzos | Cloud Firestore + presencia RTDB | localStorage |
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
9. confirmar que los códigos demo conservan los lienzos locales;
10. confirmar que el smoke test del Motor de Lienzos 5.9 no presenta regresiones.

## Incidencia 12.0.1

Durante la validación con dos cuentas se confirmó que una cuenta colaboradora no descubría lienzos de un proyecto creado directamente en Firestore. El Hotfix 12.0.1 incorpora un índice de asignaciones por usuario y requiere volver a asignar al colaborador al proyecto de prueba, renovar la sesión y repetir la validación colaborativa.


## Ajuste 12.2 — Usuarios e invitaciones

- Ruta `#/master/users` exclusiva de superadministrador.
- Creación de cuentas mediante Cloud Functions y Firebase Admin SDK.
- Correo para que la persona defina su contraseña.
- Listado, edición, reenvío, desactivación y reactivación.
- Asignación de workspaces, proyectos y roles.
- Auditoría administrativa.
- Botón de actualización del frontend en el menú del perfil.
- Requiere migrar el proyecto Firebase de Spark a Blaze para desplegar funciones.

## Ajuste 12.3 — Compartir Lienzo por persona

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

- Facilitador IA dentro del Motor de Lienzos para Mapa de Empatía, Propuesta de Valor, Lean Canvas, Business Model Canvas, Priorización y Pitch Canvas.
- Acciones: preguntas guía, revisión metodológica y propuesta de notas.
- Las propuestas se agregan solo después de selección y confirmación explícita del usuario.
- `GEMINI_API_KEY` se mantiene en Firebase Secret Manager.
- Modelo operativo actual desde el Hotfix 12.5.1: `gemini-3.1-flash-lite`, configurable mediante `GEMINI_MODEL`.
- Piloto 12.5: sin límite de consultas impuesto por WonkUp; se mantienen los límites del proveedor Gemini.
- Firestore conserva únicamente métricas de consumo; no se guardan prompts ni respuestas de IA en `aiUsage`.
- La IA está habilitada para miembros internos con edición y accesos personalizados `commenter/editor`; solo quienes pueden editar pueden insertar notas.

### Hotfix 12.4.1
WonkUp AI Coach corrige el contrato de salida estructurada de Gemini `generateContent`. Requiere solo redesplegar `wonkupCanvasAiCoach`.


## Ajuste 12.5 — Lienzos + AI Usage Control Center

Estado: VALIDADO EN PRODUCCIÓN; métricas por usuario, acciones, tokens y aceptación confirmadas. Hotfix 12.5.1 corrige el costeo estimado del modelo operativo.

- La terminología visible se estandariza a **Lienzo/Lienzos**. Los identificadores técnicos `canvas` permanecen para no romper enlaces, rutas ni datos existentes.
- AI Coach queda sin límite diario por usuario impuesto por WonkUp durante el piloto.
- Modelo operativo del piloto: `gemini-3.1-flash-lite`.
- Métricas por interacción: usuario, acción, workspace, proyecto, Lienzo, tokens, costo estimado, éxito/error y notas propuestas/aceptadas.
- Métricas por usuario: consultas, participación, tokens, costo, aceptación e indicador Normal/Intensivo/Excepcional según promedio diario.
- Centro Superadmin: `#/master/ai` / **Administración → IA y consumo**.
- Presupuesto mensual de referencia: USD 10 por defecto, con alertas 50/75/90/100 y acción `alert_only`.
- El 100% del presupuesto no bloquea automáticamente; existe pausa manual de emergencia.
- Analítica privada mediante Cloud Functions; `aiUsage` y `aiUsageEvents` no se exponen al navegador.
- No se almacenan prompts ni respuestas completas en la analítica.

### Hotfix 12.5.1 — Costeo real de IA

Estado: CÓDIGO Y PRUEBAS LOCALES COMPLETADOS / DESPLIEGUE PENDIENTE.

- Añade la tarifa estándar actual de `gemini-3.1-flash-lite` al estimador local.
- Recalcula en lectura los eventos históricos con costo cero a partir de modelo y tokens.
- Conserva estimaciones históricas mayores a cero.
- Recalcula el costo mensual desde eventos de interacción exitosos.
- No requiere migración de datos, cambios de reglas, Vercel ni rotación de `GEMINI_API_KEY`.

