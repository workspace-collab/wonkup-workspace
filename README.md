# WonkUp Workspace

Centro operativo de WonkUp para la gestión de proyectos, innovación y colaboración.

## Estado actual

**Entrega 4 + Ajuste 4.2 - Kanban funcional, responsive y accesible.**

- Entrega 0 - Blueprint: APROBADA.
- Entrega 1 - Núcleo visual: APROBADA.
- Entrega 2 - Workspaces y acceso: APROBADA.
- Entrega 3 - Proyectos y Drive: APROBADA.
- Entrega 4 - Kanban: EN REVISIÓN.
- Ajuste 4.1 - Usabilidad y Kanban configurable: VALIDADO FUNCIONALMENTE.
- Ajuste 4.2 - Responsive, accesibilidad y endurecimiento UI: EN REVISIÓN.

## Funcionalidades disponibles

- Acceso por códigos y permisos demostrativos.
- Panel maestro y selector multiworkspace.
- Gestión de proyectos, clientes, miembros y recursos.
- Portadas de proyecto y Google Drive simulado.
- Kanban configurable con plantillas de 4, 5, 6 y 9 columnas.
- Límites WIP, checklist, comentarios, historial, dependencias y horas.
- Archivo y restauración de proyectos, clientes y tarjetas.
- Buscador global y notificaciones locales.
- Temas claro, oscuro y sistema.
- Vista Kanban alternativa en lista para móviles.
- Navegación por teclado y tratamiento accesible de modales y formularios.

## Ajuste 4.2

Este ciclo corrige los hallazgos críticos y altos de la auditoría profesional de interfaz:

- reflow de la ficha interna de proyecto;
- desbordamiento horizontal del Kanban embebido;
- foco contenido y restaurado en modales;
- contraste WCAG AA de acciones y textos;
- objetivos táctiles, etiquetas accesibles y estados ARIA;
- orden de contenido móvil;
- navegación futura marcada como Próximamente;
- escala tipográfica, radios y colores semánticos consolidados.

Consulta `AJUSTE_4_2_GUIA.md`, `AUDITORIA_UI_REMEDIACION.md` y `DESIGN_SYSTEM.md`.

## Publicación sin terminal

1. Crea o abre el repositorio `wonkup-workspace` en GitHub.
2. Sube el contenido conservando la estructura de carpetas.
3. En **Settings > Pages**, selecciona **Deploy from a branch**.
4. Elige la rama `main` y la carpeta raíz `/`.
5. Espera el despliegue y abre la URL de GitHub Pages.
6. Realiza una recarga forzada: `Ctrl + Shift + R` o `Cmd + Shift + R`.

## Configuración del MVP

Mantén en `js/config/runtime-config.js`:

```js
mode: 'mock',
kanbanMode: 'mock'
```

Firebase, Apps Script, Google Sheets y Google Drive real todavía no deben activarse. Los adaptadores permanecerán preparados para entregas posteriores.

## Códigos de prueba

- `WONKUP-ADMIN`
- `AGORA-ADMIN`
- `TAXI-LIDER`
- `TAXI-CLIENTE`
- `HUELLITAS-INVITADO`

## Logotipo oficial

Coloca el archivo oficial en:

```text
assets/brand/logo-wonkup.png
```

La interfaz utiliza un respaldo visual mientras el archivo no exista.

## Validación requerida

Antes de aprobar el Ajuste 4.2, verifica tema claro y oscuro, teclado, permisos, texto al 200 % y estas anchuras:

```text
320 px
390 px
768 px
1280 px
1440 px
```
