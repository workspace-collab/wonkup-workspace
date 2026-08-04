# Ajuste 5.6 - Reconstrucción estable del Canvas Engine

## Objetivo

Eliminar el cierre intermitente del lienzo al crear o mover notas, trabajando sobre el ZIP exacto publicado por el usuario.

## Cambios principales

- Host DOM aislado para cada ruta.
- Limpieza explícita del Toolkit y Kanban al navegar.
- Descarte de cargas asíncronas antiguas.
- Controlador estable de notas con delegación de eventos.
- Ningún `innerHTML` sobre el workspace después de crear, editar o mover.
- Arrastre optimista con rollback.
- Botón Volver protegido frente a clics residuales.
- Sincronización local y entre pestañas diferenciada.
- Identificador visible `Motor 5.6.0` en el pie del canvas.

## Instalación

1. Descarga `WonkUp_Workspace_Ajuste_5_6_CAMBIOS.zip`.
2. Descomprime el archivo.
3. Abre el repositorio `wonkup-workspace` en GitHub.
4. Selecciona **Add file > Upload files**.
5. Arrastra el contenido de la carpeta `wonkup-workspace`.
6. Acepta el reemplazo de los archivos existentes.
7. Usa el commit:

```text
Ajuste 5.6: reconstrucción estable del Canvas Engine
```

8. Espera el despliegue de GitHub Pages.
9. Cierra la pestaña anterior y abre nuevamente la URL.
10. Comprueba que el pie del canvas muestre `Motor 5.6.0`.

## Validación manual obligatoria

Usa el flujo real:

```text
Ágora Education
  > TaxiChurro
  > Canvases
  > Lean Canvas
```

Después valida:

- crear 10 notas seguidas;
- usar también el botón + de una sección;
- mover una nota 10 veces;
- mover cinco notas distintas;
- editar con el lápiz después de mover;
- repetir en pantalla completa;
- comprobar que la URL nunca cambia;
- recargar y verificar la persistencia.

## Configuración

Mantener:

```javascript
mode: 'mock',
kanbanMode: 'mock',
canvasMode: 'mock'
```
