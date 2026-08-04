# AJUSTE 5.2 - Estabilidad del Canvas Engine

## Objetivo

Corregir los errores detectados durante la validación del Ajuste 5.1, especialmente en pantalla completa, modales, edición de notas, historial, drag and drop y enlaces compartidos.

## Cambios principales

### Overlays en pantalla completa

- Los modales se montan dentro del elemento que se encuentra en pantalla completa.
- Los avisos emergentes también se muestran dentro de la vista fullscreen.
- Historial, Compartir, Exportar PDF, Nueva nota y Editar nota ya no deben aparecer detrás del canvas.
- `Escape` cierra primero el modal visible; sin modal, sale de pantalla completa.

### Pantalla completa estable

- La Fullscreen API ahora utiliza `#main-view`, un contenedor estable.
- Guardar, mover, editar o restaurar ya no reemplaza el nodo fullscreen.
- El canvas debe permanecer abierto y conservar su ruta después de cada operación.

### Notas

- El formulario prioriza el campo Contenido.
- Sección y color quedan dentro de `Opciones de nota`, cerrado inicialmente.
- El botón Agregar muestra estado de guardado y confirmación.
- El botón de lápiz no participa en el arrastre y vuelve a abrir el editor correctamente.

### Drag and drop

- Se eliminaron recargas duplicadas ocasionadas por eventos locales del adaptador mock.
- El movimiento utiliza el estado retornado por el servicio.
- El evento drop no se propaga hacia otros controles.
- La ruta y el canvas deben mantenerse estables.

### Compartir

- El botón Copiar cambia a `Enlace copiado` y presenta confirmación visible dentro del modal.
- El toast se muestra sobre la pantalla completa.
- El QR puede ampliarse dentro de un visor con:
  - QR grande;
  - código;
  - URL;
  - copiar enlace;
  - abrir imagen.

### Historial y versiones

- Punto de control incrementa la versión y refresca el modal.
- Las versiones nuevas dejan de repetir el mismo número.
- Restaurar crea el respaldo y actualiza el canvas sin regresar al Toolkit.
- Se muestra estado de proceso y errores dentro del modal.

### TIMER de ideación

En pantalla completa aparece un temporizador con:

- 5, 10, 15, 20 o 30 minutos;
- iniciar;
- pausar;
- reiniciar;
- persistencia local durante recargas;
- aviso visible al terminar.

## Configuración

Mantén:

```javascript
mode: 'mock',
kanbanMode: 'mock',
canvasMode: 'mock'
```

## Actualización en GitHub

1. Descarga `WonkUp_Workspace_Ajuste_5_2_CAMBIOS.zip`.
2. Descomprime el archivo.
3. En GitHub abre `wonkup-workspace`.
4. Selecciona **Add file > Upload files**.
5. Sube el contenido descomprimido y reemplaza los archivos existentes.
6. Usa el commit:

```text
Ajuste 5.2: estabilidad de canvases, overlays y timer
```

7. Espera GitHub Pages.
8. Recarga con `Ctrl + Shift + R` o `Cmd + Shift + R`.

## Validación prioritaria

- [ ] Copiar enlace confirma dentro del modal.
- [ ] QR se amplía y muestra el código.
- [ ] Historial funciona en pantalla completa.
- [ ] Compartir funciona en pantalla completa.
- [ ] Exportar funciona en pantalla completa.
- [ ] Nueva nota funciona en pantalla completa.
- [ ] Editar nota funciona en pantalla completa.
- [ ] Punto de control crea una versión nueva.
- [ ] Restaurar no regresa al listado de canvases.
- [ ] Arrastrar una nota no cierra el canvas.
- [ ] La ruta no cambia después de guardar o mover.
- [ ] El formulario Nueva nota prioriza el contenido.
- [ ] El TIMER inicia, pausa y reinicia.
