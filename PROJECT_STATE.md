# PROJECT STATE

## Proyecto
WonkUp Workspace

## Fase actual
Ajuste 4.1 — Usabilidad, clientes y Kanban configurable

## Estado
Construcción técnica completada. Pendiente de validación del usuario en GitHub Pages.

## Entregas
- Entrega 0 — Blueprint: APROBADA
- Entrega 1 — Núcleo visual: APROBADA
- Entrega 2 — Workspaces y acceso: APROBADA
- Entrega 3 — Proyectos y Drive: APROBADA
- Entrega 4 — Kanban: EN REVISIÓN
- Ajuste 4.1: EN REVISIÓN

## Implementado en el Ajuste 4.1
- Vista de tarjetas archivadas.
- Restauración a la columna anterior o a otra columna seleccionada.
- Eliminación definitiva solo para administradores y desde archivo.
- Configurador visual de columnas y límites WIP.
- Plantillas Básico (4), Ágil (5), Producto digital (6) y WonkUp completo (9).
- Nombre, orden, color, etapa final y activación de columnas.
- Edición, archivo, restauración y eliminación controlada de clientes.
- Buscador global funcional con resultados autorizados.
- Notificaciones locales con estado leído/no leído.
- Menús compactos y mutuamente excluyentes.
- Confirmación de cierre de sesión.
- Corrección del menú móvil y tamaños de iconos.
- Adaptadores y contratos actualizados.

## Decisiones
- Las columnas no son obligatoriamente nueve; cada proyecto define su flujo.
- Una columna con tarjetas no puede desactivarse hasta mover su contenido.
- Debe existir al menos una columna marcada como etapa final.
- `wipLimit: 0` significa sin límite.
- Las tarjetas y clientes se archivan antes de considerar una eliminación definitiva.
- La eliminación definitiva de tarjetas y clientes queda restringida a administradores.
- El modo predeterminado continúa siendo `mock`.

## Próxima entrega
Entrega 5 — Innovation Toolkit y Canvas Engine, después de aprobar la Entrega 4 y el Ajuste 4.1.
