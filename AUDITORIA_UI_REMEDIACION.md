# Matriz de remediación de auditoría UI

## Referencia

Auditoría profesional del 4 de agosto de 2026: 250 criterios, 40 hallazgos y decisión NO GO para liberación profesional hasta cerrar P0 y P1.

## Hallazgos críticos

| ID | Hallazgo | Tratamiento en 4.2 | Estado técnico |
|---|---|---|---|
| UI-001 | Ficha de proyecto desborda viewport | `min-width:0`, límites de ancho, tabs con overflow interno y orden móvil corregido | Implementado; pendiente reauditoría |
| UI-002 | Kanban expande la página a más de 2600 px | overflow aislado, contenedores ascendentes limitados, lista móvil y scroll-snap | Implementado; pendiente reauditoría |
| A11Y-001 | Modal no contiene foco | focus trap, fondo inerte, Escape y restauración al disparador | Implementado; pendiente prueba manual |
| A11Y-002 | Contraste AA extendido | azul de acción accesible, textos y badges reforzados, tokens de tema oscuro | Implementado; pendiente reauditoría |

## Hallazgos altos

| ID | Tratamiento | Estado técnico |
|---|---|---|
| UI-003 | Formulario de acceso antes de beneficios en móvil | Implementado |
| UI-004 | Hero y tabs antes del aside administrativo | Implementado |
| A11Y-003 | Etiquetas accesibles en búsquedas | Implementado |
| A11Y-004 | `aria-invalid` y `aria-describedby` en proyecto | Implementado |
| A11Y-005 | Restauración del foco al cerrar modal | Implementado |
| A11Y-006 | Estado ARIA en disparadores de menús | Implementado |
| A11Y-007 | Objetivos mínimos de 24 px | Implementado por tokens y overrides; pendiente medición |
| A11Y-008 | Objetivos frecuentes de 44 px | Implementado en móvil; pendiente medición |
| A11Y-009 | Jerarquía de encabezados | Revisada en vistas principales; pendiente auditoría completa |
| A11Y-010 | Retiro de `aria-live` del root | Implementado con regiones dedicadas |
| UI-005 | Señal de scroll Kanban | Contador, flechas, hint, scroll-snap y vista lista | Implementado |
| UX-001 | Búsqueda global demo | Resultados y navegación reales | Implementado |
| UX-002 | Módulos no implementados | Deshabilitados con etiqueta Próximamente | Implementado |
| UX-003 | Acciones rápidas sin función | Retiradas o sustituidas por flujos reales | Implementado |

## Hallazgos medios y bajos abordados

- Escala tipográfica y radios consolidados.
- Colores semánticos centralizados.
- Salud del proyecto expresada con texto.
- `prefers-reduced-motion` incorporado.
- Wrapping y límites de ancho reforzados para zoom.
- Toasts en región live dedicada.
- Foco inicial significativo en modales.
- Prioridades técnicas traducidas al español.
- Etiquetas internas de entregas retiradas de la interfaz operativa.
- Notificaciones con panel funcional.
- Métricas de icon buttons normalizadas.
- Tabs activas reforzadas visualmente y mediante `aria-current`.
- Códigos demo plegados en la pantalla de acceso.

## Criterio de cierre

Esta matriz no considera los hallazgos cerrados hasta ejecutar nuevamente:

- los cinco breakpoints;
- tema claro y oscuro;
- texto al 200 %;
- teclado completo;
- cinco perfiles de acceso;
- auditoría automatizada y revisión visual.
