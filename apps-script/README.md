# Apps Script — Entrega 2

Esta carpeta contiene la API inicial para accesos, sesiones y listado de workspaces.

## Instalación sin terminal

1. Crea un Google Sheets llamado `WONKUP_MASTER`.
2. Abre **Extensiones → Apps Script**.
3. Crea archivos con los mismos nombres de esta carpeta y copia su contenido.
4. Ejecuta `setupWonkUpMaster()` una sola vez y autoriza los permisos.
5. Revisa que se creen las hojas y datos demostrativos.
6. Ve a **Implementar → Nueva implementación → Aplicación web**.
7. Ejecutar como: **Tú**.
8. Acceso: **Cualquier persona**.
9. Copia la URL terminada en `/exec`.
10. En `js/config/api-config.js`, cambia `mode` a `apps-script` y coloca la URL.

## Advertencia

Los códigos incluidos son demostrativos. Cámbialos antes de usar datos reales. La API guarda únicamente hashes con una clave secreta interna (pepper) para códigos y sesiones.
