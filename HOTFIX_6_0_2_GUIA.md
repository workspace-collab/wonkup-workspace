# HOTFIX 6.0.2 - Corrección de despliegue en raíz

## Causa

El Hotfix 6.0.1 fue subido dentro de una carpeta adicional `wonkup-workspace/`. GitHub Pages sirve el `index.html` de la raíz, por lo que continuó cargando el archivo defectuoso 6.0.0.

## Archivos que deben quedar en la raíz del repositorio

- `index.html`
- `js/app.js`
- `js/views/client-portal-view.js`

El ZIP 6.0.2 contiene esos archivos directamente en la raíz, sin carpeta contenedora.

## Commit sugerido

`Hotfix 6.0.2: corregir despliegue raíz del portal`

## Después de subir

1. Espera GitHub Pages.
2. Cierra la pestaña anterior.
3. Abre nuevamente la plataforma.
4. Realiza una recarga forzada.

La carpeta accidental `wonkup-workspace/` puede eliminarse después; no es utilizada por GitHub Pages.
