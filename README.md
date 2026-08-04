# WonkUp Workspace

**Entrega 2 — Workspaces, roles y acceso mediante códigos.**

## Incluye

- App Shell con sidebar y header.
- Router por hash compatible con GitHub Pages.
- Tema claro, oscuro y sistema.
- Dashboard visual basado en la infografía aprobada.
- Selector multiworkspace filtrado por permisos.
- Acceso mediante códigos e invitaciones demostrativas.
- Sesión temporal almacenada en `sessionStorage`.
- Roles: superadministrador, administrador, líder, cliente e invitado.
- Protección de rutas en el frontend.
- Vistas limitadas para cliente e invitado.
- Adaptadores `mock` y Google Apps Script.
- API inicial de Apps Script y configuración automática de Google Sheets.

## Códigos de demostración

| Código | Rol | Alcance |
|---|---|---|
| `WONKUP-ADMIN` | Superadministrador | Todos los workspaces |
| `AGORA-ADMIN` | Administrador | Ágora Education |
| `TAXI-LIDER` | Líder | TaxiChurro |
| `TAXI-CLIENTE` | Cliente | Vista limitada de TaxiChurro |
| `HUELLITAS-INVITADO` | Invitado | Vista limitada de Huellitas |

## Publicación sin terminal

1. Sube el contenido de esta carpeta a la raíz del repositorio `wonkup-workspace`.
2. En GitHub abre **Settings → Pages**.
3. Selecciona **Deploy from a branch**.
4. Elige `main` y `/root`.
5. Guarda y espera la URL pública.

## Modos de acceso

El archivo `js/config/api-config.js` utiliza `mock` de forma predeterminada. Esto permite probar todos los roles sin configurar servicios externos.

Para activar Google Apps Script, sigue `apps-script/README.md` y cambia el modo a `apps-script`.

## Logotipo oficial

Coloca el logotipo oficial en:

`assets/brand/logo-wonkup.png`

La aplicación muestra una letra W de respaldo mientras ese archivo no exista.

## Alcance de esta entrega

Los proyectos, tareas y finanzas continúan siendo datos demostrativos. La seguridad real depende de activar la API de Apps Script; el modo `mock` es solo para pruebas visuales y funcionales.
