# Ajuste 4.1 — Usabilidad, clientes y Kanban configurable

## Objetivo

Completar la experiencia de la Entrega 4 antes de aprobarla, corrigiendo acciones incompletas y controles visuales del encabezado.

## Cambios principales

- Restauración y eliminación controlada de tarjetas archivadas.
- Configuración visual de columnas, colores, orden y límites WIP.
- Plantillas Kanban de 4, 5, 6 y 9 columnas.
- Edición, archivo, restauración y eliminación controlada de clientes.
- Iconos compactos en el encabezado y en los menús.
- Un solo popover abierto a la vez; cierre al pulsar fuera o Escape.
- Buscador global funcional con `Ctrl + K` o `Cmd + K`.
- Notificaciones locales funcionales y contador de no leídas.
- Confirmación de cierre de sesión.
- Botón de menú lateral activo solo en móvil y tableta.

## Actualización en GitHub

1. Descarga el paquete `WonkUp_Workspace_Ajuste_4_1_CAMBIOS.zip`.
2. Descomprímelo.
3. En GitHub usa **Add file → Upload files**.
4. Arrastra todo el contenido conservando las rutas.
5. Usa el commit:

```text
Ajuste 4.1: Kanban configurable y mejoras de usabilidad
```

6. Espera GitHub Pages y recarga con `Cmd + Shift + R` o `Ctrl + Shift + R`.

## Pruebas rápidas

- Abre Tema y luego Crear: solo debe quedar un menú abierto.
- Prueba el buscador con `Taxi`, `Diseño` o `Ágora`.
- Abre la campana, marca notificaciones y verifica que el contador cambie.
- En Clientes, edita y archiva un registro; luego activa **Mostrar archivados** y restáuralo.
- En Kanban, abre **Configurar tablero** y aplica la plantilla **Básico — 4 columnas**.
- Cambia el límite WIP de una columna y verifica el bloqueo.
- Archiva una tarjeta, abre **Archivadas** y restáurala.

## Configuración

Mantén:

```js
mode: 'mock'
kanbanMode: 'mock'
```

Firebase y Apps Script real siguen preparados, pero no deben activarse durante esta revisión.
