# Entrega 9 — Cloud Foundation

## Objetivo

Crear una base cloud viable para WonkUp Workspace sin exigir terminal al usuario y sin poner en riesgo los módulos ya aprobados.

## Alcance entregado

- Firebase Web SDK 12.16.0 mediante módulos ESM del navegador.
- Firebase Authentication con correo y contraseña.
- Inicio de sesión híbrido: códigos demo y cuentas reales.
- Cloud Firestore para usuarios, workspaces, clientes, personas y proyectos.
- Reglas de seguridad por UID, workspace, proyecto y rol.
- Panel Cloud Foundation exclusivo del superadministrador.
- Diagnóstico de configuración, SDK, Auth, perfil, Firestore, caché y App Check.
- Exportación de respaldo JSON antes de migrar.
- Plan de migración determinista e idempotente.
- Simulación previa, escritura por lotes, auditoría y verificación.
- Activación de usuarios reales mediante UID.
- Adaptador híbrido que conserva los códigos demo en modo local.
- Pantalla de recuperación visible si un módulo impide iniciar la aplicación.
- Caché persistente y App Check desactivados por defecto.

## Lo que no se activa todavía

- Kanban en Firestore.
- Canvas Engine en Firestore.
- Entregables en Firestore.
- Finanzas en Firestore.
- Drive, Gmail o Calendar reales.
- creación automática de cuentas Authentication;
- App Check enforcement;
- Firebase Hosting.

## Configuración al instalar

La entrega se publica en modo seguro:

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

Subir el ZIP no cambia la fuente de datos actual.

## Instalación en GitHub

1. Descarga el paquete **Solo cambios, raíz directa**.
2. Descomprímelo.
3. Entra a la raíz del repositorio donde aparecen `index.html`, `js`, `css`, `data` y `firebase`.
4. Selecciona **Add file > Upload files**.
5. Arrastra directamente el contenido extraído.
6. Permite reemplazar los archivos.
7. Usa el commit:

```text
Entrega 9: Cloud Foundation Firebase y migración híbrida
```

8. Espera GitHub Pages.
9. Cierra la pestaña anterior.
10. Abre la aplicación y realiza una recarga forzada.

## Primera validación sin Firebase

Ingresa con:

```text
WONKUP-ADMIN
```

Comprueba:

- aparece **Cloud Foundation** en el menú;
- la página indica configuración pendiente;
- exportar respaldo descarga un JSON;
- simular migración muestra cantidades y cero duplicados;
- simular permisos muestra las escrituras previstas;
- Proyectos, Kanban, Canvas, Entregables, Finanzas y Reportes siguen funcionando;
- una cuenta no superadmin no ve Cloud Foundation.

## Activación de Firebase

Sigue `FIREBASE_SIN_TERMINAL.md`. La secuencia crítica es:

1. proyecto y app Web;
2. Firestore en modo producción;
3. reglas publicadas;
4. Email/Password activado;
5. primera cuenta Auth creada;
6. documento `users/{uid}` superadmin creado;
7. configuración pública pegada;
8. diagnóstico correcto;
9. respaldo;
10. simulación;
11. migración;
12. verificación;
13. cambio a modo híbrido;
14. prueba entre dos dispositivos.

## Criterio de aprobación de la Entrega 9

La entrega se considera aprobada cuando:

- el acceso por códigos continúa operativo;
- el acceso por cuenta Firebase funciona;
- un superadmin accede a Cloud Foundation;
- una cuenta sin perfil es rechazada;
- la migración genera cero rutas duplicadas;
- Firestore contiene los workspaces y proyectos esperados;
- una cuenta Firebase ve solo su alcance;
- un proyecto creado o editado se observa desde otro navegador;
- cliente e invitado no acceden a datos internos;
- volver a `projectMode: 'mock'` restaura inmediatamente el comportamiento local.

## Archivos de referencia

- `CLOUD_ARCHITECTURE_9.md`
- `SECURITY_MODEL_9.md`
- `FIREBASE_SIN_TERMINAL.md`
- `firebase/firestore.rules`
- `firebase/BOOTSTRAP_SUPERADMIN.json`
- `firebase/RUNTIME_CONFIG_EXAMPLE.js`
- `TEST_RESULTS_9.md`
