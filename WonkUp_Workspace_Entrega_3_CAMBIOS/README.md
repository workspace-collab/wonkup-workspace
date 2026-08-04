# WonkUp Workspace

**Entrega 3 — Proyectos, clientes, equipo, recursos y Google Drive.**

## Estado

- Entrega 0 — Blueprint: APROBADA.
- Entrega 1 — Núcleo visual: APROBADA.
- Entrega 2 — Workspaces y acceso: APROBADA.
- Entrega 3 — Proyectos y Drive: EN REVISIÓN.

## Incluye

- Creación y edición de proyectos.
- Código correlativo por workspace.
- Archivo lógico de proyectos sin eliminación destructiva.
- Persistencia demostrativa en `localStorage`.
- Dashboard conectado al repositorio activo de proyectos.
- Directorio y alta de clientes.
- Ficha de proyecto ampliada.
- Cronograma de hitos.
- Equipo por proyecto con roles y dedicación.
- Recursos y enlaces por proyecto.
- Estructura documental de Google Drive.
- Adaptadores `mock` y Google Apps Script.
- API de Apps Script con validación de sesión y permisos.
- Hojas nuevas: `Recursos`, `Hitos` y `Carpetas_Drive`.

## Prueba rápida en GitHub Pages

1. Publica el contenido en la raíz del repositorio.
2. Ingresa con `WONKUP-ADMIN` o `AGORA-ADMIN`.
3. Abre **Mis proyectos**.
4. Crea un proyecto.
5. Edita su información.
6. Abre las pestañas **Cronograma**, **Documentos**, **Equipo** y **Configuración**.
7. Genera la estructura documental.
8. Registra un recurso y asigna un miembro.
9. Comprueba que el proyecto aparezca en el Dashboard.

## Modo demostrativo

`js/config/api-config.js` mantiene `mode: "mock"` de forma predeterminada.

En este modo:

- los cambios se guardan en el navegador;
- no se modifica Google Sheets;
- la estructura de Drive es simulada;
- al borrar los datos del sitio se recuperan los datos demo iniciales.

## Modo Google Apps Script

Sigue `apps-script/README.md`. Cuando la API esté publicada, configura:

```js
mode: 'apps-script'
appsScriptUrl: 'https://script.google.com/macros/s/....../exec'
```

## Códigos de prueba

| Código | Rol | Alcance |
|---|---|---|
| `WONKUP-ADMIN` | Superadministrador | Todos los workspaces |
| `AGORA-ADMIN` | Administrador | Ágora Education |
| `TAXI-LIDER` | Líder | TaxiChurro |
| `TAXI-CLIENTE` | Cliente | Resumen de TaxiChurro |
| `HUELLITAS-INVITADO` | Invitado | Resumen de Huellitas |

## Logotipo oficial

Coloca el logotipo en:

`assets/brand/logo-wonkup.png`
