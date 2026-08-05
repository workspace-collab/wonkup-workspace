# WonkUp Workspace

Centro operativo de WonkUp para la gestión de proyectos, innovación, entregables, finanzas y reportes.

## Estado actual

- Entregas 0 a 9: aprobadas.
- Ajuste 8.1: aprobado.
- Entrega 10 — Kanban colaborativo en Firestore: código listo para despliegue y validación real.

## Módulos funcionales

- Panel Maestro y workspaces.
- Acceso híbrido: códigos demo y cuentas Firebase.
- Proyectos, clientes, personas, recursos e hitos en Firestore para cuentas reales.
- Altas rápidas de clientes y personas.
- Kanban híbrido, configurable y colaborativo en tiempo real.
- Actividad y notificaciones del Kanban.
- Innovation Toolkit y Canvas Engine.
- Portal del cliente y entregables.
- Finanzas, ingresos, costos, horas y rentabilidad.
- Dashboard ejecutivo y reportes CSV/PDF.
- Cloud Foundation: diagnóstico, respaldos, migración, verificación y activación de usuarios.
- Temas claro, oscuro y sistema.

## Configuración activa

```javascript
mode: 'mock',
authMode: 'hybrid',
projectMode: 'hybrid',
kanbanMode: 'hybrid',
canvasMode: 'mock',
deliverableMode: 'mock',
financeMode: 'mock',
reportMode: 'aggregate',
foundationMode: 'connected'
```

Las cuentas Firebase usan Firestore en Proyectos y Kanban. Los códigos de demostración conservan `localStorage`.

## Arquitectura de datos

- Cloud Firestore: fuente de verdad de usuarios, workspaces, proyectos y Kanban migrado.
- Firebase Authentication: identidad real por UID.
- Google Sheets: reportes y exportaciones, no base transaccional.
- Apps Script: integraciones futuras con Drive, Gmail y Calendar.
- `localStorage`: continuidad de sesiones demo y módulos aún no migrados.

## Instalación de Entrega 10

Consulta:

- `ENTREGA_10_GUIA.md`
- `CLOUD_KANBAN_ARCHITECTURE_10.md`
- `TEST_RESULTS_10.md`

Después de subir el código, publica manualmente `firebase/firestore.rules` desde Firebase Console.

No coloques cuentas de servicio, contraseñas, tokens, claves privadas ni claves de Gemini en el frontend.
