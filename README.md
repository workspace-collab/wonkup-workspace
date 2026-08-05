# WonkUp Workspace

Centro operativo de WonkUp para la gestión de proyectos, innovación, entregables, finanzas y reportes.

## Estado actual

- Entregas 0 a 7: aprobadas.
- Entrega 8: Dashboard ejecutivo y reportes en revisión.

## Módulos funcionales

- Panel Maestro y workspaces.
- Acceso mediante códigos y roles.
- Proyectos, clientes, equipo y recursos.
- Google Drive simulado y Apps Script preparado.
- Kanban configurable.
- Innovation Toolkit y Canvas Engine.
- Portal del cliente y entregables.
- Finanzas, ingresos, costos, horas y rentabilidad.
- Dashboard ejecutivo.
- Reportes comparativos y exportación CSV/PDF.
- Temas claro, oscuro y sistema.

## Configuración del MVP

```javascript
mode: 'mock',
kanbanMode: 'mock',
canvasMode: 'mock',
deliverableMode: 'mock',
financeMode: 'mock',
reportMode: 'aggregate'
```

Los datos se mantienen en el navegador hasta conectar Google Sheets, Apps Script o Firebase. No coloques secretos ni claves privadas en el frontend.
