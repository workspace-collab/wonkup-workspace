# WonkUp Workspace

Centro operativo de WonkUp para la gestión de proyectos, innovación, entregables, finanzas y reportes.

## Estado actual

- Entregas 0 a 11: aprobadas.
- Entrega 11 cerrada con Hotfix 11.0.1.
- Entrega 12 — Canvas Engine colaborativo en Firebase: validación real en curso.
- Ajuste 12.2 — Usuarios e invitaciones: código listo; requiere desplegar Cloud Functions.

## Módulos funcionales

- Panel Maestro y workspaces.
- Acceso híbrido: códigos demo y cuentas Firebase.
- Proyectos, clientes, personas, recursos e hitos en Firestore para cuentas reales.
- Altas rápidas de clientes y personas.
- Kanban híbrido, configurable y colaborativo en tiempo real.
- Innovation Toolkit y Canvas Engine híbrido con Firestore y presencia en Realtime Database.
- Portal del cliente y entregables híbridos en Firestore.
- Finanzas, ingresos, costos, horas y rentabilidad.
- Dashboard ejecutivo y reportes CSV/PDF.
- Usuarios e invitaciones: alta, roles, alcances, desactivación y correos desde WonkUp.
- Cloud Foundation: diagnóstico, respaldos, migraciones, verificación y activación manual de contingencia.
- Temas claro, oscuro y sistema.

## Configuración activa

```javascript
mode: 'mock',
authMode: 'hybrid',
projectMode: 'hybrid',
kanbanMode: 'hybrid',
deliverableMode: 'hybrid',
canvasMode: 'hybrid',
financeMode: 'mock',
reportMode: 'aggregate',
foundationMode: 'connected',
functionsRegion: 'us-central1'
```

Las cuentas Firebase usan Firestore en Proyectos, Kanban, Entregables y Canvas. Los códigos demo conservan `localStorage`. La presencia del Canvas utiliza Realtime Database.

## Arquitectura de datos

- Cloud Firestore: usuarios, workspaces, proyectos, Kanban, entregables y Canvas.
- Realtime Database: presencia efímera de participantes del Canvas.
- Firebase Authentication: identidad real por UID.
- Google Sheets: reportes y exportaciones, no base transaccional.
- Apps Script: integraciones futuras con Drive, Gmail y Calendar.
- `localStorage`: continuidad de sesiones demo y Finanzas aún no migradas.

## Instalación de Entrega 12

Consulta:

- `ENTREGA_12_GUIA.md`
- `CLOUD_CANVAS_ARCHITECTURE_12.md`
- `TEST_RESULTS_12.md`

Después de subir el código, publica manualmente:

- `firebase/firestore.rules` en Firestore;
- `firebase/realtime-database.rules.json` en Realtime Database.

No coloques cuentas de servicio, contraseñas, tokens, claves privadas ni claves de Gemini en el frontend.

## Hotfix vigente

Para validar colaboración entre cuentas en proyectos creados directamente en Firestore, aplica `HOTFIX_12_0_1_GUIA.md`. La migración de canvases no debe repetirse.


## Ajuste 12.2 — Administración de usuarios

Consulta:

- `AJUSTE_12_2_GUIA.md`
- `USER_ADMIN_ARCHITECTURE_12_2.md`
- `TEST_RESULTS_12_2.md`

El frontend continúa en GitHub Pages. La creación administrativa de identidades se ejecuta mediante Cloud Functions y Firebase Admin SDK; por ello, el proyecto debe usar el plan Blaze.
