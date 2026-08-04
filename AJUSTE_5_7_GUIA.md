# AJUSTE 5.7 - Interacción ágil del Canvas Engine

## Objetivo

Reducir pasos en las operaciones frecuentes del Canvas Engine y corregir el comportamiento de Escape cuando existe un diálogo sobre la vista ampliada.

## Cambios incluidos

### Compartir en un solo flujo

- Al pulsar **Compartir**, WonkUp reutiliza un enlace activo o crea automáticamente uno con vigencia de 7 días.
- El enlace, el botón de copia y el QR aparecen inmediatamente.
- El QR sigue siendo ampliable y muestra el código de acceso.
- La vigencia personalizada y la creación de enlaces adicionales quedan dentro de **Cambiar vigencia o crear otro enlace**.
- La administración y desactivación de enlaces queda dentro de **Administrar enlaces**.
- Revocar o desactivar un enlace sirve para impedir inmediatamente su uso cuando se compartió por error o terminó la revisión.

### Impresión directa

- **Imprimir / PDF** abre directamente el diálogo de impresión en formato resumen A4 horizontal.
- En el navegador se selecciona **Guardar como PDF**.
- La opción detallada multipágina queda en el menú de tres puntos del canvas.

### Notas rápidas

- El botón `+` de cada sección crea un post-it directamente dentro de esa sección.
- Ya no se abre un modal para la creación básica.
- La nota se guarda al pulsar **Guardar**, `Ctrl/Cmd + Enter` o al salir del post-it con contenido.
- `Escape` cancela una nota rápida vacía o en edición.
- Los detalles avanzados continúan disponibles mediante el botón de tres puntos de cada nota.

### Colores y eliminación

- Al pasar el mouse o enfocar un post-it aparecen los colores y el botón de eliminar.
- Se eliminó el nombre del color dentro de la tarjeta.
- El asa de arrastre permanece separada de las acciones rápidas.

### Pantalla completa estable

- La vista ampliada ahora utiliza un modo inmersivo controlado por WonkUp, no la Fullscreen API nativa del navegador.
- Cuando existe un diálogo, `Escape` cierra primero el diálogo y mantiene el canvas ampliado.
- Cuando no existe ningún diálogo, `Escape` sale del modo inmersivo.
- El temporizador continúa disponible en el modo inmersivo.

## Instalación

1. Descarga el paquete **Solo cambios**.
2. Descomprime el ZIP.
3. Sube el contenido a la raíz del repositorio `wonkup-workspace`.
4. Permite reemplazar los archivos existentes.
5. Usa el commit:

```text
Ajuste 5.7: interacción ágil de canvases y Escape estable
```

6. Espera GitHub Pages.
7. Cierra la pestaña anterior y vuelve a abrir la plataforma.
8. Realiza una recarga forzada con `Cmd + Shift + R` o `Ctrl + Shift + R`.
9. Confirma que el editor muestre `Motor 5.7.0`.

## Validación

- Pulsar `+` en una sección crea un post-it inline.
- Escribir y salir de la nota la guarda sin abrir un modal.
- Los colores aparecen al pasar el mouse.
- El nombre del color no aparece en la tarjeta.
- Eliminar funciona desde la acción rápida.
- Arrastrar continúa funcionando.
- Compartir muestra un enlace listo sin pulsar Generar enlace.
- Copiar muestra confirmación visible.
- Imprimir / PDF abre directamente la impresión.
- En modo inmersivo, abrir Historial y pulsar Escape cierra Historial sin salir del canvas ampliado.
