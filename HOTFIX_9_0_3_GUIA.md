# Hotfix 9.0.3 - Boton Migrar a Firestore

## Problema corregido

El boton `Migrar a Firestore` recibia el clic, pero la confirmacion construida con el modal interno no aparecia en el despliegue publicado. La operacion no llegaba a ejecutar `CloudFoundationService.migrate()`.

## Solucion

- Se reemplazo la confirmacion interna por una confirmacion nativa del navegador.
- Se agrego un estado visible `Migracion en curso` antes de iniciar las escrituras.
- Se muestra el error real en pantalla si Firestore rechaza la operacion.
- Se actualizo el cache interno a `9.0.3` para forzar la carga del codigo corregido.
- Se aplico la misma confirmacion resiliente a la activacion futura de usuarios.

## Instalacion

Sube el contenido del ZIP directamente a la raiz del repositorio y permite reemplazar los archivos existentes.

Commit sugerido:

`Hotfix 9.0.3: corregir ejecucion de migracion Firestore`

Luego abre:

`https://workspace-collab.github.io/wonkup-workspace/?v=903`

Realiza una recarga forzada y entra con `Cuenta WonkUp`.

## Prueba

1. Abre `Cloud Foundation`.
2. Verifica que el respaldo JSON ya este descargado.
3. Pulsa `Migrar a Firestore`.
4. Acepta la confirmacion nativa del navegador.
5. Debe aparecer inmediatamente `Migracion en curso`.
6. Espera `Operacion completada` antes de usar `Verificar datos`.

No cierres ni recargues la pestaña durante la escritura.
