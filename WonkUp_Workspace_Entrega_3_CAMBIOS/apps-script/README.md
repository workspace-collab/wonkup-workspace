# Apps Script — Entrega 3

API para accesos, workspaces, proyectos, clientes, equipo, recursos, hitos y Google Drive.

## Instalación sin terminal

1. Crea o abre el Google Sheets `WONKUP_MASTER`.
2. Abre **Extensiones → Apps Script**.
3. Copia todos los archivos `.gs` y `appsscript.json` de esta carpeta.
4. Ejecuta `setupWonkUpMaster()` y autoriza.
5. Ejecuta `setupWonkUpDriveRoot()` y autoriza Google Drive.
6. Comprueba las hojas `Proyectos`, `Clientes`, `Miembros_Proyecto`, `Recursos`, `Hitos`, `Carpetas_Drive` y `Actividad`.
7. Ve a **Implementar → Nueva implementación → Aplicación web**.
8. Ejecutar como: **Tú**.
9. Acceso: **Cualquier persona**.
10. Copia la URL `/exec`.
11. Configura `js/config/api-config.js`.

## Actualización desde Entrega 2

Vuelve a ejecutar `setupWonkUpMaster()`. La función agrega las columnas y hojas faltantes sin borrar columnas existentes ni reemplazar valores ya registrados.

## Seguridad

- Los códigos y sesiones se almacenan como hashes con pepper.
- Cada acción valida nuevamente la sesión y el alcance.
- Drive conserva permisos privados por defecto.
- No guardes la URL de implementación dentro de repositorios privados si contiene parámetros adicionales.
