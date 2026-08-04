# ENTREGA 5 - Innovation Toolkit y Canvas Engine

## Objetivo

Integrar las metodologias de innovacion dentro de WonkUp Workspace mediante un motor reutilizable, accesible y preparado para colaboracion en Firebase.

## Incluye

- Canvas Engine comun para seis plantillas.
- Mapa de Empatia.
- Lienzo de Propuesta de Valor.
- Lean Canvas.
- Business Model Canvas.
- Matriz de Priorizacion.
- Pitch Canvas.
- Creacion de canvases por proyecto.
- Notas con autor, fecha, color y comentarios.
- Movimiento de notas entre secciones mediante drag and drop.
- Vista Canvas y vista Lista para moviles.
- Historial de actividad.
- Presencia y sincronizacion entre pestanas en modo mock.
- Vinculacion de resultados entre canvases.
- Conversion de notas a tarjetas Kanban.
- Enlaces de consulta temporales en modo demostrativo.
- Exportacion mediante impresion optimizada para guardar como PDF.
- Archivo, restauracion y eliminacion controlada de canvases.
- Busqueda global de canvases y notas.
- Reglas de Firestore preparadas para la futura conexion.

## Configuracion vigente

Mantener en `js/config/runtime-config.js`:

```javascript
mode: 'mock',
kanbanMode: 'mock',
canvasMode: 'mock'
```

No activar Firebase todavia. La sincronizacion de esta entrega funciona entre pestanas del mismo navegador mediante `BroadcastChannel` y `localStorage`.

## Actualizacion en GitHub

1. Descargar el paquete de cambios.
2. Descomprimir el archivo.
3. Abrir `wonkup-workspace` en GitHub.
4. Seleccionar **Add file > Upload files**.
5. Arrastrar el contenido extraido.
6. Permitir que GitHub reemplace los archivos existentes.
7. Usar el commit: `Entrega 5: Innovation Toolkit y Canvas Engine`.
8. Esperar GitHub Pages y recargar con `Ctrl + Shift + R` o `Cmd + Shift + R`.

## Pruebas principales

Ingresar con `WONKUP-ADMIN` y revisar:

- Innovation Toolkit global.
- Agora Education > TaxiChurro > Canvases.
- Apertura del Mapa de Empatia y Lean Canvas existentes.
- Creacion de un canvas nuevo.
- Creacion, edicion, cambio de color y eliminacion de notas.
- Movimiento de notas entre secciones.
- Comentarios.
- Vista Canvas y Lista.
- Historial.
- Conversion de una nota en tarea Kanban.
- Vinculacion de una nota a otro canvas del proyecto.
- Generacion de enlace compartido.
- Exportacion a PDF.
- Archivo y restauracion del canvas.
- Persistencia al recargar.
- Sincronizacion entre dos pestanas.
- Comportamiento en 390 px y tema oscuro.

## Limitacion deliberada

Los enlaces compartidos y la presencia son demostrativos y dependen del almacenamiento local del navegador. La colaboracion real entre usuarios y dispositivos se habilitara cuando se configure Firebase Authentication, Firestore y el broker de acceso de Apps Script.
