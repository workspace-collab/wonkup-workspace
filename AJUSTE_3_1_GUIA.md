# Ajuste 3.1 — Portada y restauración de proyectos

## Objetivo
Corregir la cabecera de la ficha del proyecto y completar el ciclo de archivo/restauración antes de aprobar la Entrega 3.

## Cambios visibles
- Hero horizontal y responsive.
- Logo compacto.
- Portada opcional mediante URL o `assets/...`.
- Color de marca como fallback cuando no existe portada.
- Icono “Volver a proyectos” con tamaño controlado.
- Botón **Restaurar** en proyectos archivados.

## Cómo actualizar GitHub
1. Descomprime el paquete de cambios.
2. En el repositorio abre **Add file → Upload files**.
3. Arrastra el contenido manteniendo las carpetas.
4. Confirma el reemplazo de los archivos existentes.
5. Usa el commit: `Ajuste 3.1: portada y restauración de proyectos`.
6. Espera el despliegue de GitHub Pages y recarga con `Ctrl/Cmd + Shift + R`.

## Prueba de portada
1. Ingresa con `WONKUP-ADMIN`.
2. Abre TaxiChurro y pulsa **Editar**.
3. En **Portada horizontal**, pega una URL HTTPS o una ruta como `assets/projects/taxichurro-cover.webp`.
4. Selecciona el color de marca.
5. Guarda. Si la URL está vacía, se mostrará un degradado con el color del proyecto.

## Prueba de restauración
1. Archiva un proyecto.
2. Regresa a **Mis proyectos**.
3. Activa **Mostrar archivados**.
4. Pulsa **Restaurar**.
5. El proyecto debe recuperar el estado que tenía antes de archivarse.

## Nota sobre datos locales
La Entrega 3 sigue usando `localStorage` en modo mock. Los campos nuevos se completan con valores predeterminados sin borrar los proyectos ya creados.
