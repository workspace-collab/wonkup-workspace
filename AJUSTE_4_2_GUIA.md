# Ajuste 4.2 - Responsive, accesibilidad y endurecimiento UI

## Objetivo

Corregir los bloqueantes y riesgos altos registrados en la auditoría profesional de interfaz antes de continuar con Innovation Toolkit.

## Alcance incorporado

### Reflow y móvil

- Contenedores grid y flex con `min-width: 0` y ancho máximo controlado.
- Pestañas de proyecto con scroll interno.
- Kanban aislado del ancho del documento.
- Vista de lista móvil y vista tablero con scroll-snap.
- Indicador de columnas y controles de desplazamiento.
- Hero del proyecto antes de la información administrativa.
- Formulario de acceso antes del contenido comercial en móvil.

### Accesibilidad

- Focus trap en modales.
- Fondo inerte y restauración del foco.
- Escape en diálogos y menús.
- Regiones live dedicadas.
- Etiquetas accesibles para búsquedas.
- `aria-expanded`, `aria-controls`, `aria-current`, `aria-invalid` y `aria-describedby`.
- Controles táctiles de 44 px en móvil.
- Jerarquía de encabezados revisada.
- Soporte para `prefers-reduced-motion`.

### Contraste y sistema visual

- Azul accesible para acciones con texto blanco.
- Color cielo conservado como identidad y decoración.
- Texto secundario y badges con contraste reforzado.
- Tema oscuro revisado.
- Escala tipográfica, radios y tamaños de control consolidados.

### Fidelidad funcional

- Búsqueda global con resultados y navegación.
- Menús futuros deshabilitados con etiqueta Próximamente.
- Acciones rápidas sin flujo eliminadas o deshabilitadas.
- Kanban móvil con alternativa de lista.

## Instalación en GitHub

1. Descarga y descomprime el paquete `CAMBIOS`.
2. En GitHub, abre `wonkup-workspace`.
3. Selecciona **Add file > Upload files**.
4. Arrastra todo el contenido descomprimido.
5. Confirma el reemplazo de archivos existentes.
6. Usa el commit:

```text
Ajuste 4.2: responsive, accesibilidad y endurecimiento UI
```

7. Espera el despliegue de GitHub Pages.
8. Recarga con `Ctrl + Shift + R` o `Cmd + Shift + R`.

## Configuración

No cambies todavía:

```js
mode: 'mock',
kanbanMode: 'mock'
```

## Prueba mínima

1. Entra con `WONKUP-ADMIN`.
2. Revisa Dashboard, Proyectos, TaxiChurro y Kanban en escritorio.
3. Abre DevTools y prueba 320, 390, 768, 1280 y 1440 px.
4. En móvil, confirma que el documento no se desplaza horizontalmente.
5. Abre un modal y recorre sus controles con Tab y Shift + Tab.
6. Cierra con Escape y comprueba que el foco vuelve al disparador.
7. Cambia a tema oscuro.
8. Usa `Ctrl + K` o `Cmd + K` y abre un resultado.
9. Prueba Kanban en vista lista y tablero.
10. Aumenta el texto del navegador al 200 %.

## Estado

El Ajuste 4.2 permanece EN REVISIÓN hasta completar `TEST_CHECKLIST.md` y volver a ejecutar la auditoría en los cinco breakpoints.
