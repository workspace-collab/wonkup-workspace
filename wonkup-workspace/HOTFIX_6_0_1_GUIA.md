# Hotfix 6.0.1 - Pantalla en blanco

## Causa

Un error de sintaxis en `js/views/client-portal-view.js` impedía que el navegador analizara el grafo de módulos. Como `app.js` importa esa vista al iniciar, la aplicación completa quedaba en blanco.

## Corrección

- Se corrigió la cadena HTML del estado vacío en el portal del cliente.
- Se actualizó el import a `client-portal-view.js?v=6.0.1`.
- Se actualizó `index.html` para cargar `app.js?v=6.0.1` y evitar caché de la versión defectuosa.

## Instalación

Sube los archivos manteniendo las carpetas y reemplaza los existentes. Después espera GitHub Pages, cierra la pestaña y vuelve a abrir el sitio.
