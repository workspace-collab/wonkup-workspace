# WonkUp Workspace

**Entrega 4 + Ajuste 4.1 — Kanban funcional, configurable y mejoras de usabilidad.**

## Estado

- Entrega 0 — Blueprint: APROBADA.
- Entrega 1 — Núcleo visual: APROBADA.
- Entrega 2 — Workspaces y acceso: APROBADA.
- Entrega 3 — Proyectos y Drive: APROBADA.
- Entrega 4 — Kanban: EN REVISIÓN.
- Ajuste 4.1 — Usabilidad y configuración: EN REVISIÓN.

## Incluye

- Tablero Kanban por proyecto.
- Plantillas de 4, 5, 6 y 9 columnas.
- Configuración visual de nombre, orden, color y límite WIP.
- Crear, editar, mover, reordenar, archivar y restaurar tarjetas.
- Checklist, comentarios, historial, horas y dependencias.
- Clientes editables, archivables y restaurables.
- Buscador global.
- Notificaciones locales.
- Menús compactos sin superposición.
- Temas claro, oscuro y sistema.

## Prueba rápida

1. Ingresa con `WONKUP-ADMIN`.
2. Abre TaxiChurro → Kanban.
3. Selecciona **Configurar tablero**.
4. Aplica **Básico — 4 columnas**.
5. Define un límite WIP y prueba superarlo.
6. Archiva una tarjeta y restáurala desde **Archivadas**.
7. En Clientes, edita, archiva y restaura un registro.
8. Prueba la búsqueda con `Cmd + K` o `Ctrl + K`.
9. Revisa Tema, Crear, Notificaciones y Perfil: solo debe abrirse un menú a la vez.

## Configuración

Mantén en `js/config/runtime-config.js`:

```js
mode: 'mock',
kanbanMode: 'mock'
```

No actives Firebase hasta completar el Access Broker con custom tokens.
