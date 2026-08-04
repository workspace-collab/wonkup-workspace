# AJUSTE 5.3 - Estabilidad de drag, copia y pantalla completa

## Objetivo

Corregir tres incidencias bloqueantes detectadas después del Ajuste 5.2:

1. Exceso de espacio en la cabecera cuando el canvas usa pantalla completa.
2. Falta de respuesta visible al copiar el enlace desde el visor QR.
3. Salida accidental del lienzo al arrastrar una nota entre secciones.

## Correcciones

### Cabecera de pantalla completa

- La identidad y las acciones se organizan en una cabecera compacta.
- Se oculta la descripción larga mientras el navegador está en fullscreen.
- El título utiliza elipsis en lugar de dividirse palabra por palabra.
- Los botones, avatar, progreso y timer reducen su altura.
- El toolbar deja de superponerse en resoluciones intermedias.

### Copiar enlace

- Se corrigió el uso asíncrono del botón del visor QR.
- El botón cambia a `Copiando...` y luego a `Enlace copiado`.
- Aparece una confirmación dentro del mismo visor, no detrás del modal.
- Se conserva un fallback por selección manual cuando el navegador bloquea el portapapeles.
- El enlace ampliado se muestra en un campo seleccionable.

### Arrastrar notas

- El lienzo ya no se vuelve a renderizar completamente después de un drop.
- La nota se mueve de forma optimista dentro del DOM.
- Se actualizan progreso, versión, número de notas y fecha sin destruir el editor.
- Se bloquea durante unos milisegundos el clic residual que podía activar `Volver al Toolkit`.
- La ruta activa se conserva durante toda la operación.

## Actualización en GitHub

1. Descarga `WonkUp_Workspace_Ajuste_5_3_CAMBIOS.zip`.
2. Descomprime el archivo.
3. En GitHub abre **Add file > Upload files**.
4. Arrastra el contenido extraído.
5. Usa el commit:

```text
Ajuste 5.3: estabilidad de drag, copia y fullscreen
```

6. Espera GitHub Pages y recarga con `Ctrl + Shift + R` o `Cmd + Shift + R`.

## Pruebas prioritarias

- Abrir Propuesta de Valor y activar pantalla completa.
- Verificar que la cabecera sea compacta.
- Compartir, ampliar el QR y pulsar `Copiar enlace`.
- Verificar el texto `Enlace copiado` y el aviso dentro del visor.
- Arrastrar una nota a otra sección cinco veces consecutivas.
- Confirmar que la URL, el fullscreen y el editor permanezcan abiertos.
- Abrir el lápiz después de mover la nota.
- Recargar y comprobar que la nueva sección se conserve.
