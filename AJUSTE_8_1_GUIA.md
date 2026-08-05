# Ajuste 8.1 — Altas rápidas contextuales

## Objetivo

Permitir registrar un cliente o una persona sin abandonar el formulario en el que se está trabajando.

## Funcionalidades

### Nuevo proyecto

En el campo **Cliente** aparece el botón:

```text
+ Nuevo cliente
```

Al pulsarlo se despliega un formulario compacto dentro del mismo modal. Al guardar:

1. el cliente se registra;
2. el formulario principal permanece abierto;
3. los datos ya escritos del proyecto se conservan;
4. el cliente nuevo queda seleccionado automáticamente.

### Agregar miembro

En el campo **Persona** aparece:

```text
+ Nueva persona
```

Al guardar:

1. la persona se registra en el workspace;
2. queda seleccionada en el formulario;
3. puede asignarse inmediatamente al proyecto.

## Datos solicitados

### Cliente

- Nombre obligatorio.
- Contacto principal opcional.
- Correo opcional, pero válido cuando se completa.
- Teléfono opcional.

### Persona

- Nombre completo obligatorio.
- Correo obligatorio y único.

## Permisos

- Crear cliente: superadministrador y administrador de workspace.
- Crear persona: superadministrador, administrador de workspace y líder de proyecto con acceso al workspace.
- Clientes e invitados no ven estas acciones.

## Instalación sin terminal

1. Descargar el paquete **Solo cambios, raíz directa**.
2. Descomprimirlo.
3. Abrir la raíz del repositorio en GitHub, donde aparecen `index.html`, `js`, `css` y `data`.
4. Elegir **Add file → Upload files**.
5. Arrastrar directamente los archivos y carpetas extraídos.
6. Permitir el reemplazo de archivos existentes.
7. Usar el commit:

```text
Ajuste 8.1: altas rápidas de clientes y personas
```

8. Esperar el despliegue de GitHub Pages.
9. Cerrar la pestaña anterior y abrir nuevamente la plataforma.
10. Realizar una recarga forzada con `Ctrl + Shift + R` o `Cmd + Shift + R`.

## Validación

### Cliente

1. Abrir **Mis proyectos**.
2. Pulsar **Nuevo proyecto**.
3. Escribir un nombre de proyecto.
4. Pulsar **+ Nuevo cliente**.
5. Registrar el cliente.
6. Confirmar que el cliente queda seleccionado y el nombre del proyecto no se pierde.

### Persona

1. Abrir un proyecto.
2. Entrar en **Equipo**.
3. Pulsar **Agregar miembro**.
4. Pulsar **+ Nueva persona**.
5. Registrar nombre y correo.
6. Confirmar que queda seleccionada.
7. Pulsar **Asignar** y verificar que aparece en el equipo.

## Consideración para la futura base de datos

En modo mock, las altas se guardan en `localStorage`. El contrato `users.create` también quedó preparado para Apps Script. La creación de una persona todavía no crea una cuenta de Firebase Authentication ni envía una invitación; eso corresponderá a la Entrega 9 — Cloud Foundation.
