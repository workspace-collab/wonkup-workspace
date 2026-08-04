# WonkUp Workspace

**Entrega 4 — Kanban funcional y colaboración preparada para Firebase.**

## Estado

- Entrega 0 — Blueprint: APROBADA.
- Entrega 1 — Núcleo visual: APROBADA.
- Entrega 2 — Workspaces y acceso: APROBADA.
- Entrega 3 — Proyectos y Drive: APROBADA.
- Entrega 4 — Kanban: EN REVISIÓN.

## Incluye

- Tablero Kanban por proyecto.
- Nueve columnas estándar y límites WIP.
- Crear, editar, mover, reordenar y archivar tarjetas.
- Drag and drop.
- Responsable, participantes, etiquetas, fechas, horas y dependencias.
- Checklist interactiva.
- Comentarios e historial.
- Búsqueda y filtros.
- Persistencia local demostrativa.
- Sincronización entre pestañas del navegador.
- Adaptador para Firestore y reglas iniciales de seguridad.

## Prueba rápida

1. Publica los cambios en GitHub Pages.
2. Ingresa con `WONKUP-ADMIN` o `AGORA-ADMIN`.
3. Abre TaxiChurro y entra a **Kanban**.
4. Crea una tarjeta.
5. Arrástrala entre columnas.
6. Abre la tarjeta y registra checklist, comentario y horas.
7. Abre la plataforma en otra pestaña y comprueba la actualización.
8. Intenta superar un límite WIP.
9. Archiva una tarjeta.
10. Recarga y confirma que los cambios continúan.

## Configuración

`js/config/runtime-config.js` mantiene por defecto:

```js
mode: 'mock'
kanbanMode: 'mock'
```

No actives Firebase hasta completar el Access Broker con custom tokens. Consulta `firebase/README.md`.

## Códigos de prueba

| Código | Rol | Alcance |
|---|---|---|
| `WONKUP-ADMIN` | Superadministrador | Todos los workspaces |
| `AGORA-ADMIN` | Administrador | Ágora Education |
| `TAXI-LIDER` | Líder | TaxiChurro |
| `TAXI-CLIENTE` | Cliente | Resumen de TaxiChurro |
| `HUELLITAS-INVITADO` | Invitado | Resumen de Huellitas |

## Logotipo oficial

Coloca el logotipo en `assets/brand/logo-wonkup.png`.
