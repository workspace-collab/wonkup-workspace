# PROJECT STATE

## Proyecto
WonkUp Workspace

## Fase actual
Entrega 2 — Workspaces y acceso

## Estado
Completada técnicamente y pendiente de revisión del usuario.

## Entregas
- Entrega 0 — Blueprint: APROBADA
- Entrega 1 — Núcleo visual: APROBADA
- Entrega 2 — Workspaces y acceso: EN REVISIÓN

## Implementado
- Acceso por código.
- Sesión temporal en `sessionStorage`.
- Cinco perfiles demostrativos.
- Alcance por workspace y proyecto.
- Protección de rutas.
- Navegación filtrada por rol.
- Vista limitada de cliente e invitado.
- Cierre de sesión.
- Adaptador mock.
- Adaptador Google Apps Script.
- API inicial y setup del Sheets maestro.

## Decisiones
- El frontend inicia en modo `mock` para facilitar pruebas.
- Apps Script será la fuente real para códigos y sesiones cuando se configure.
- Los códigos no se almacenan en el navegador.
- Apps Script guarda hashes SHA-256 de códigos y sesiones.
- Cliente e invitado solo pueden abrir el resumen de su proyecto durante esta entrega.

## Pendientes conocidos
- La administración visual de usuarios y códigos se incorporará después.
- Los proyectos aún provienen de datos demo estáticos.
- Google Drive real corresponde a la Entrega 3.
- Firebase no se utiliza todavía.

## Próxima entrega
Entrega 3 — Proyectos y Google Drive.
