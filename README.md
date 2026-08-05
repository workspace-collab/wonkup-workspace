# WonkUp Workspace

Centro operativo de WonkUp para la gestión de proyectos, innovación, entregables, finanzas y reportes.

## Estado actual

- Entregas 0 a 8: aprobadas.
- Ajuste 8.1: aprobado.
- Entrega 9 — Cloud Foundation: código listo; conexión real a Firebase en configuración y revisión.

## Módulos funcionales

- Panel Maestro y workspaces.
- Acceso por códigos demo y preparación para cuentas Firebase.
- Proyectos, clientes, equipo, recursos e hitos.
- Altas rápidas de clientes y personas.
- Kanban configurable.
- Innovation Toolkit y Canvas Engine.
- Portal del cliente y entregables.
- Finanzas, ingresos, costos, horas y rentabilidad.
- Dashboard ejecutivo y reportes CSV/PDF.
- Cloud Foundation: diagnóstico, respaldo, migración, verificación y activación de usuarios.
- Temas claro, oscuro y sistema.

## Configuración segura al instalar

```javascript
mode: 'mock',
authMode: 'mock',
projectMode: 'mock',
kanbanMode: 'mock',
canvasMode: 'mock',
deliverableMode: 'mock',
financeMode: 'mock',
reportMode: 'aggregate',
foundationMode: 'diagnostic'
```

La Entrega 9 no activa Firebase automáticamente. Consulta `FIREBASE_SIN_TERMINAL.md` para conectar Authentication y Firestore desde el navegador.

## Arquitectura de datos

- Cloud Firestore: base operativa de los módulos migrados.
- Firebase Authentication: identidad real por UID.
- Google Sheets: reportes y exportaciones, no base transaccional.
- Apps Script: integraciones futuras con Drive, Gmail y Calendar.
- `localStorage`: continuidad temporal de módulos aún no migrados.

No coloques claves privadas, cuentas de servicio, contraseñas ni claves de Gemini en el frontend.
