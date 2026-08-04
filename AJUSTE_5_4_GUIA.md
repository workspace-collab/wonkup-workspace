# Ajuste 5.4 - Estabilidad definitiva del Canvas Engine

## Problema corregido

El cierre intermitente del lienzo tenía dos causas combinadas:

1. Las mutaciones de notas reconstruían todo el editor, destruyendo y recreando el árbol de eventos.
2. El guardado posterior al drag intentaba restaurar la URL con `history.replaceState` después de que el router ya había dibujado el Toolkit. Esto podía dejar la URL del canvas con la pantalla del listado hasta recargar.

## Cambios estructurales

- El botón **Volver al Toolkit** ya no es un enlace HTML susceptible a clics residuales; ahora es una navegación explícita controlada.
- El router consulta un guard de navegación antes de desmontar el Canvas Engine.
- Las operaciones crear, editar, comentar, eliminar, restaurar y mover activan un bloqueo transaccional temporal.
- Las notas ya no reconstruyen todo el editor. Solo se actualiza `#canvas-workspace` y los indicadores de avance, versión y fecha.
- El drag se mueve de forma optimista y persiste en el adaptador; si falla, restaura únicamente el área del canvas.
- El guard posterior al drag ya no cambia la URL silenciosamente.
- Se evita el clic residual que podía activar la salida del canvas.

## Instalación

1. Descarga `WonkUp_Workspace_Ajuste_5_4_CAMBIOS.zip`.
2. Descomprime el archivo.
3. En GitHub selecciona **Add file > Upload files**.
4. Sube el contenido respetando las rutas.
5. Usa el commit:

```text
Ajuste 5.4: estabilidad transaccional de notas y drag
```

6. Espera GitHub Pages y recarga con `Ctrl + Shift + R` o `Cmd + Shift + R`.

## Prueba de estrés requerida

Realiza cada caso al menos diez veces:

- Crear una nota desde el botón general.
- Crear una nota desde el botón de una sección.
- Mover una nota entre secciones.
- Editar una nota después de moverla.
- Crear y mover notas en BMC, Lean Canvas, Propuesta de Valor, Empatía y Priorización.
- Repetir en pantalla completa.
- Confirmar que la URL y el canvas visible siempre correspondan.

No debe aparecer el listado de canvases salvo al pulsar deliberadamente **Volver al Toolkit**.
