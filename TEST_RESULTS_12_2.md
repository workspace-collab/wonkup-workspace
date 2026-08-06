# Resultados de pruebas — Ajuste 12.2

## Resultado

- Pruebas Node del proyecto: **46/46 aprobadas**.
- Prueba UI de Usuarios e invitaciones: **aprobada**.
- Validación sintáctica de módulos JavaScript: **aprobada**.
- Validación sintáctica de `functions/index.js`: **aprobada**.
- Cadena de caché: todos los imports usan `12.2.0`.

## Cobertura añadida

- Autorización exclusiva de superadministrador.
- Creación de identidad y grafo de acceso.
- No exposición de contraseña temporal en la respuesta.
- Ruta y navegación del módulo Usuarios.
- Crear, editar, reenviar invitación, desactivar y reactivar.
- Diseño de escritorio y modal de invitación.
- Conservación de las pruebas de Canvas, Kanban, Entregables y Cloud Foundation.

## Evidencia visual

`tests/users-admin-ui-12-2.png`

## Pendiente en entorno real

El entorno aislado de construcción no permitió descargar los paquetes `firebase-admin` y `firebase-functions` desde su registro interno. Por ello, quedan pendientes en Firebase real:

1. `npm install` dentro de `functions/`;
2. despliegue de Cloud Functions;
3. llamada real con ID token;
4. recepción del correo;
5. creación, desactivación y reactivación de cuentas reales.

Estas validaciones forman parte del cierre del Ajuste 12.2.
