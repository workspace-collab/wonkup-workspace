# Arquitectura Cloud Foundation — Entrega 9

## Decisión técnica

WonkUp Workspace adopta una arquitectura híbrida y reversible:

```text
GitHub Pages
│
├── Firebase Authentication
│   └── identidad real por UID
│
├── Cloud Firestore
│   ├── usuarios y permisos
│   ├── workspaces
│   ├── clientes y personas
│   └── proyectos y membresías
│
├── Adaptadores locales
│   ├── Kanban
│   ├── Canvas Engine
│   ├── Entregables
│   └── Finanzas
│
└── Google Apps Script — siguiente fase
    ├── Drive
    ├── Gmail
    ├── Calendar
    └── Sheets
```

Cloud Firestore es la fuente de verdad operativa para los módulos migrados. Google Sheets queda reservado para exportaciones, reportes y control administrativo; no se usa como base transaccional.

## Alcance de la Entrega 9

Se habilita la infraestructura para:

- cuentas reales de Firebase Authentication;
- perfiles y roles en `users/{uid}`;
- workspaces y membresías;
- clientes y directorio de personas;
- proyectos, miembros, recursos e hitos;
- diagnóstico desde el navegador;
- respaldo local previo;
- simulación de migración;
- migración idempotente por lotes;
- verificación posterior;
- activación de usuarios reales por UID.

Permanecen locales:

- Kanban;
- Canvas Engine;
- Entregables;
- Finanzas;
- Reportes derivados de esos módulos.

## Modos operativos

### Modo seguro inicial

```javascript
authMode: 'mock',
projectMode: 'mock',
foundationMode: 'diagnostic'
```

La plataforma funciona exactamente como antes y Cloud Foundation solo muestra el estado de preparación.

### Diagnóstico con Firebase configurado

```javascript
authMode: 'hybrid',
projectMode: 'mock',
foundationMode: 'diagnostic'
```

Permite iniciar sesión con una cuenta Firebase y comprobar configuración, identidad, perfil y reglas, pero los proyectos siguen usando datos locales.

### Híbrido validado

```javascript
authMode: 'hybrid',
projectMode: 'hybrid',
foundationMode: 'connected'
```

- sesión iniciada con código demo: proyectos locales;
- sesión iniciada con Firebase: proyectos de Firestore.

Esto permite probar la nube sin interrumpir las demostraciones ni migrar todos los módulos a la vez.

## Principios aplicados

1. **Migración progresiva:** un dominio funcional a la vez.
2. **Mínimo privilegio:** cada usuario recibe solo los workspaces y proyectos necesarios.
3. **UID como identidad:** los permisos productivos se vinculan al UID de Authentication.
4. **Sin eliminación física:** en esta fase se archivan registros para reducir pérdida accidental.
5. **Consultas compatibles con reglas:** no se confía en que las reglas filtren resultados.
6. **Respaldo antes de escritura:** la interfaz ofrece exportación JSON obligatoria.
7. **Simulación previa:** el plan muestra rutas, cantidades y duplicados antes de migrar.
8. **Idempotencia:** las mismas rutas se actualizan mediante `merge`, evitando duplicados por repetición.
9. **Inicio resiliente:** cualquier fallo de importación muestra un diagnóstico visible y no una pantalla en blanco.
10. **Reversión inmediata:** cambiar `authMode` y `projectMode` a `mock` devuelve la operación al navegador sin borrar Firestore.

## Estructura principal

```text
users/{uid}

system/schema
system/schema/migrations/{migrationId}
system/schema/userActivations/{activationId}

workspaces/{workspaceId}
  members/{uid}
  people/{personId}
  clients/{clientId}
  projects/{projectId}
    members/{uid}
    resources/{resourceId}
    milestones/{milestoneId}
```

Las colecciones de Kanban, Canvas, Entregables y Finanzas ya aparecen en las reglas para preparar las siguientes migraciones, pero sus modos continúan en `mock`.

## Escalamiento previsto

Después de validar esta base entre dos dispositivos:

1. migrar Kanban;
2. migrar Entregables y comentarios;
3. migrar Canvas Engine con estrategia de concurrencia;
4. migrar Finanzas con reglas más estrictas y auditoría;
5. conectar Apps Script para Drive, Gmail, Calendar y Sheets;
6. activar App Check después de observar métricas;
7. incorporar automatizaciones e IA mediante backend confiable.
