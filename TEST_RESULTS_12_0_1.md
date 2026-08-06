# Resultados de pruebas — Hotfix 12.0.1

Fecha: 2026-08-05

## Resultado general

**APROBADO EN PRUEBAS LOCALES / VALIDACIÓN FIREBASE REAL PENDIENTE**

## Incidencia cubierta

- Un proyecto creado directamente en Firestore no era descubierto por una cuenta colaboradora cuando su perfil histórico no contenía el nuevo `projectId`.
- La asignación desde la pestaña Equipo escribía la membresía del proyecto, pero no un índice de proyectos consultable por la cuenta.

## Correcciones verificadas

- Lectura de `users/{uid}/projectAssignments` durante la creación de sesión.
- Unión de asignaciones dinámicas con los alcances históricos del perfil.
- Escritura atómica de membresía e índice al asignar miembros.
- Inactivación coordinada al retirar miembros.
- Reglas de lectura propia y escritura autorizada del índice.
- Activación de usuarios actualizada para generar índices.
- Mensajes de Innovation Toolkit aclarados para el alcance por proyecto.
- Caché actualizada a `12.0.1`.

## Pruebas Node

- Pruebas ejecutadas: 42
- Aprobadas: 42
- Fallidas: 0
- Omitidas: 0

La suite incluye una prueba específica que confirma la presencia de:

- `getProjectAssignmentContext`;
- escrituras en `projectAssignments`;
- inactivación del índice;
- reglas `canLeadProject`;
- integración con Cloud Foundation.

## Smoke test Canvas 5.9

Resultado: **APROBADO**

- creación inline: correcto;
- color rápido y personalizado: correcto;
- drag-and-drop: correcto;
- compartir: correcto;
- impresión: correcto;
- temporizador: correcto;
- modales y modo inmersivo: correcto;
- eliminación rápida: correcto;
- errores de página: 0.

## Pendiente de validación real

1. Publicar reglas Firestore 12.0.1.
2. Desplegar el hotfix en GitHub Pages.
3. Volver a asignar a Edinson al `Proyecto de Prueba Cloud 9`.
4. Renovar ambas sesiones.
5. Confirmar que ambos usuarios abren el mismo canvas.
6. Confirmar sincronización y presencia RTDB.
