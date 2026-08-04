# ENTREGA 6 - Portal del Cliente y Gestión de Entregables

## Objetivo

Habilitar un espacio de consulta para clientes e invitados y un flujo operativo para publicar, revisar, comentar y aprobar entregables del proyecto.

## Funcionalidades incluidas

### Portal del cliente

- Página de bienvenida con identidad visual del proyecto.
- Resumen de avance sin mostrar costos, horas ni información interna.
- Indicadores de entregables pendientes, con cambios y aprobados.
- Entregables que requieren atención.
- Próximo hito visible.
- Comentarios recientes.
- Enlaces del proyecto autorizados.
- Cronograma visible para el cliente.

### Gestión de entregables

- Creación y edición de entregables.
- Tipos: documento, prototipo, sitio web, diseño, presentación y otro.
- Prioridad, fecha límite y visibilidad.
- Checklist de aceptación.
- Registro de versiones mediante URL.
- Envío a revisión.
- Aprobación por el cliente.
- Solicitud de cambios con feedback obligatorio.
- Comentarios del equipo y del cliente.
- Archivo y restauración.
- Búsqueda global de entregables.

### Estados

```text
Borrador
   ↓
En revisión
   ├──→ Aprobado
   └──→ Cambios solicitados
             ↓
          Borrador / nueva versión
```

## Códigos de validación

### Equipo interno

```text
WONKUP-ADMIN
AGORA-ADMIN
TAXI-LIDER
```

Ruta recomendada:

```text
Ágora Education > TaxiChurro > Entregables
```

### Cliente

```text
TAXI-CLIENTE
```

El acceso abre directamente:

```text
Portal del cliente > TaxiChurro
```

### Invitado

```text
HUELLITAS-INVITADO
```

El invitado puede consultar el portal y los entregables visibles, pero no aprobar ni comentar.

## Configuración vigente

Mantén en `js/config/runtime-config.js`:

```javascript
mode: 'mock',
kanbanMode: 'mock',
canvasMode: 'mock',
deliverableMode: 'mock'
```

En modo mock, la información se conserva en `localStorage` y se sincroniza entre pestañas del mismo navegador.

## Instalación en GitHub

1. Descarga el paquete **Solo cambios**.
2. Descomprime el ZIP.
3. Abre el repositorio `wonkup-workspace`.
4. Selecciona **Add file > Upload files**.
5. Arrastra el contenido de la carpeta `wonkup-workspace`.
6. Permite reemplazar los archivos existentes.
7. Usa el commit:

```text
Entrega 6: portal del cliente y entregables
```

8. Espera GitHub Pages.
9. Cierra la pestaña antigua y realiza `Ctrl + Shift + R` o `Cmd + Shift + R`.

## Pruebas prioritarias

### Equipo interno

- Abrir TaxiChurro > Entregables.
- Crear un entregable.
- Editar su información.
- Registrar una versión con URL.
- Completar checklist.
- Enviar a revisión.
- Abrir Vista cliente.
- Archivar y restaurar un entregable.

### Cliente

- Ingresar con `TAXI-CLIENTE`.
- Ver el portal de TaxiChurro.
- Abrir Entregables.
- Revisar una versión.
- Agregar comentario.
- Aprobar un entregable en revisión.
- Solicitar cambios en otro entregable.
- Confirmar que no se muestran finanzas, horas, Kanban ni canvases internos.

## Limitaciones deliberadas

- Los archivos se registran mediante enlaces; no se suben binarios al repositorio.
- Las notificaciones por correo se habilitarán al conectar Apps Script o Firebase.
- La aprobación es local en modo demostrativo y no constituye firma digital.
