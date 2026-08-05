# Resultados de pruebas — Entrega 11

## Resultado general

```text
APROBADO EN ENTORNO LOCAL DE PRUEBAS
VALIDACIÓN FIREBASE REAL PENDIENTE DEL USUARIO
```

## Pruebas automatizadas

- 37 pruebas ejecutadas.
- 37 aprobadas.
- 0 fallidas.
- 0 omitidas.

Cobertura relevante:

- migración determinista de entregables;
- filtros por workspace;
- selección híbrida de adaptadores;
- singleton Firebase compartido;
- listener Firestore en tiempo real;
- filtro de visibilidad para clientes;
- reglas de lectura, gestión, revisión y comentarios;
- controles de migración en Cloud Foundation;
- contexto workspace/proyecto en operaciones UI;
- regresión de Kanban Cloud y notificaciones;
- regresión de proyectos híbridos, altas rápidas y reportes.

## Sintaxis y estructura

- Todos los archivos JavaScript superaron `node --check`.
- Importaciones de módulos versionadas en `11.0.0`.
- No quedan referencias JavaScript a versiones de caché 10.x.
- Reglas Firestore balanceadas estructuralmente.
- CSS balanceado estructuralmente.
- Importaciones relativas verificadas.

## Prueba visual automatizada

Chromium validó:

- apertura de Cloud Foundation;
- presencia de Migración 11.1;
- simulación de 6 entregables;
- apertura de la pestaña Entregables;
- creación de un entregable en modo demo;
- conservación del layout;
- ausencia de errores JavaScript inesperados.

Captura:

```text
tests/deliverables-cloud-ui-11.png
```

## Límites de la validación

No se ejecutó desde este entorno una operación contra el proyecto Firebase real del usuario. La aprobación definitiva requiere:

1. publicar las reglas 11;
2. migrar y verificar los entregables;
3. probar dos cuentas Firebase;
4. validar Portal del Cliente, comentarios, aprobación, cambios y notificaciones en tiempo real.
