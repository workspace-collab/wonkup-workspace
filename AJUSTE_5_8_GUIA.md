# AJUSTE 5.8 - Encabezado de marca, menú colapsable y paleta de notas

## Objetivo

Optimizar el espacio del editor fuera de pantalla completa y mejorar tres interacciones: navegación lateral, selección detallada de colores y aviso de fin del temporizador.

## Cambios

### Encabezado personalizado

- El encabezado del canvas utiliza automáticamente el color de marca configurado en el proyecto.
- El color metodológico del canvas se combina con el color del proyecto en un degradado suave.
- Se eliminó el gran espacio blanco del encabezado.
- El título dispone de más ancho y las acciones se organizan en una fila compacta.

No es necesario configurar el color nuevamente. Se toma del campo **Color de marca** de la ficha del proyecto.

### Menú lateral colapsable

El botón de tres líneas de la barra superior ahora funciona también en escritorio:

- Primer clic: oculta el menú lateral.
- Segundo clic: vuelve a mostrarlo.
- La preferencia se conserva en el navegador.
- En móvil sigue abriendo y cerrando el menú superpuesto.

El botón **Modo enfoque** fue retirado del Canvas Engine porque esta función ahora se resuelve de forma global desde el menú principal.

### Color en Detalle de la nota

El selector desplegable fue reemplazado por una paleta visual con:

- nombre del tono;
- muestra de color;
- código hexadecimal;
- estado seleccionado visible.

### Alarma del timer

Cuando el timer llega a cero:

- emite tres tonos;
- muestra un aviso visible;
- el temporizador cambia temporalmente a estado de alerta;
- intenta vibrar en dispositivos compatibles.

El usuario debe iniciar el timer mediante un clic para que el navegador autorice el audio. Si el equipo está silenciado o el navegador bloquea el sonido, el aviso visual permanece activo.

## Instalación

1. Descarga el paquete **Solo cambios**.
2. Descomprime el ZIP.
3. Sube su contenido a la raíz del repositorio `wonkup-workspace`.
4. Permite reemplazar los archivos existentes.
5. Usa el commit:

```text
Ajuste 5.8: encabezado de marca, sidebar y paleta de notas
```

6. Espera GitHub Pages.
7. Cierra la pestaña antigua y vuelve a abrir la plataforma.
8. Realiza `Cmd + Shift + R` o `Ctrl + Shift + R`.
9. Confirma que el editor muestre `Motor 5.8.0`.

## Validación

- Ocultar y mostrar el menú lateral desde las tres líneas.
- Recargar y comprobar que la preferencia se conserva.
- Abrir un canvas y revisar el degradado según el color del proyecto.
- Confirmar que ya no existe el botón Modo enfoque.
- Abrir `•••` en una nota y revisar la paleta con códigos.
- Cambiar el color y guardar.
- Activar pantalla completa, iniciar el timer y comprobar el aviso final.
