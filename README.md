# WonkUp Workspace

Centro operativo de WonkUp para la gestión de proyectos, innovación, entregables, finanzas y reportes.

## Estado actual

- Entregas 0 a 11: aprobadas.
- Entrega 11 cerrada con Hotfix 11.0.1.
- Entrega 12 — Motor de Lienzos colaborativo en Firebase: validación real en curso.
- Ajuste 12.2 — Usuarios e invitaciones: código listo; requiere desplegar Cloud Functions.

## Módulos funcionales

- Panel Maestro y workspaces.
- Acceso híbrido: códigos demo y cuentas Firebase.
- Proyectos, clientes, personas, recursos e hitos en Firestore para cuentas reales.
- Altas rápidas de clientes y personas.
- Kanban híbrido, configurable y colaborativo en tiempo real.
- Innovation Toolkit y Motor de Lienzos híbrido con Firestore y presencia en Realtime Database.
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

Las cuentas Firebase usan Firestore en Proyectos, Kanban, Entregables y Lienzos. Los códigos demo conservan `localStorage`. La presencia de los Lienzos utiliza Realtime Database.

## Arquitectura de datos

- Cloud Firestore: usuarios, workspaces, proyectos, Kanban, entregables y Lienzos.
- Realtime Database: presencia efímera de participantes de los Lienzos.
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

Para validar colaboración entre cuentas en proyectos creados directamente en Firestore, aplica `HOTFIX_12_0_1_GUIA.md`. La migración de lienzos no debe repetirse.


## Ajuste 12.2 — Administración de usuarios

Consulta:

- `AJUSTE_12_2_GUIA.md`
- `USER_ADMIN_ARCHITECTURE_12_2.md`
- `TEST_RESULTS_12_2.md`

El frontend de producción se despliega en Vercel. La creación administrativa de identidades se ejecuta mediante Cloud Functions y Firebase Admin SDK; por ello, el proyecto debe usar el plan Blaze.

## Ajuste 12.3 — Colaboración por enlace en Lienzos

El propietario o líder de un Lienzo puede compartirlo de dos formas:

- enlace público anónimo, siempre de solo lectura;
- acceso personalizado para una Cuenta WonkUp activa con permiso `viewer`, `commenter` o `editor`.

Los accesos personalizados requieren autenticación, tienen vencimiento, se pueden cambiar o revocar y conservan sincronización en tiempo real. Consulta `AJUSTE_12_3_GUIA.md` y `CANVAS_SHARING_ARCHITECTURE_12_3.md`.

## WonkUp AI Coach (Ajuste 12.4)

El Motor de Lienzos incorpora un facilitador basado en Gemini para generar preguntas guía, revisar bloques y proponer notas candidatas. La clave de Gemini no se guarda en el frontend. Configúrala con Firebase Secret Manager:

```bash
firebase functions:secrets:set GEMINI_API_KEY --project wonkup-workspace
firebase deploy --only functions,firestore:rules --project wonkup-workspace
```

Modelo operativo del piloto desde el Hotfix 12.5.1: `gemini-3.1-flash-lite`. El contenido propuesto por IA siempre requiere validación humana antes de agregarse al Lienzo.


## Ajuste 12.5 — Lienzos y control de uso de IA

- La interfaz orientada al usuario usa **Lienzo/Lienzos**; las rutas y claves internas `canvas` se conservan para compatibilidad.
- WonkUp no impone límite de consultas por usuario durante el piloto. Los límites técnicos o de facturación del proveedor Gemini siguen aplicando.
- El modelo operativo del piloto es `gemini-3.1-flash-lite`; el Hotfix 12.5.1 incorpora su tarifa al estimador de costos y recompone eventos históricos con costo cero.
- Cada interacción registra tokens, costo estimado, usuario, workspace, proyecto, Lienzo, acción y estado de éxito/error.
- Cuando el usuario incorpora propuestas al Lienzo, se registra cuántas notas fueron aceptadas para calcular la tasa de aceptación.
- El superadministrador dispone de **Administración → IA y consumo** con filtros, ranking por usuario, indicadores Normal/Intensivo/Excepcional, costo estimado mensual y presupuesto de referencia.
- El presupuesto es solo informativo: llegar al 100% no bloquea automáticamente la IA. El superadministrador conserva un interruptor de emergencia.
- WonkUp no almacena los prompts ni las respuestas completas en la analítica de uso.

Consulta `AJUSTE_12_5_GUIA.md`, `AI_USAGE_CONTROL_ARCHITECTURE_12_5.md` y `TEST_RESULTS_12_5.md`.
