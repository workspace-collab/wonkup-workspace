# Entrega 4 — Guía de actualización

## Objetivo

Reemplazar el Kanban demostrativo por un tablero operativo, persistente y preparado para Firestore.

## Subida a GitHub

1. Descomprime el paquete de cambios.
2. Abre `wonkup-workspace` en GitHub.
3. Selecciona **Add file → Upload files**.
4. Arrastra el contenido conservando las carpetas.
5. Confirma el reemplazo de archivos existentes.
6. Usa el commit:

```text
Entrega 4: Kanban funcional y colaboración
```

7. Espera GitHub Pages.
8. Recarga con `Cmd + Shift + R` o `Ctrl + Shift + R`.

## Configuración durante la prueba

Mantén en `js/config/runtime-config.js`:

```js
mode: 'mock',
kanbanMode: 'mock'
```

En este modo los datos se guardan en el navegador. El botón **Restablecer demo** recupera el tablero inicial del proyecto.

## Validación recomendada

- Crear y editar tarjeta.
- Drag and drop.
- Reordenamiento.
- Límites WIP.
- Filtros.
- Checklist.
- Comentarios.
- Historial.
- Persistencia.
- Sincronización entre pestañas.
- Permisos de administrador, líder y cliente.

Firebase no debe activarse todavía. La carpeta `firebase` y el adaptador quedan preparados para la fase de configuración real.
