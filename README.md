# WonkUp Workspace

Centro operativo de WonkUp para la gestion de proyectos, innovacion y colaboracion.

## Estado actual

- Entrega 0: Blueprint aprobado.
- Entrega 1: Nucleo visual aprobado.
- Entrega 2: Workspaces y accesos aprobados.
- Entrega 3: Proyectos y Google Drive aprobado.
- Entrega 4: Kanban funcional aprobado.
- Ajustes 4.1 y 4.2: usabilidad, responsive y accesibilidad validados.
- Entrega 5: Innovation Toolkit y Canvas Engine en revision.

## Modulos funcionales

- Panel Maestro y workspaces.
- Acceso mediante codigos y roles.
- Proyectos, clientes, equipo y recursos.
- Google Drive simulado y servicio Apps Script preparado.
- Kanban configurable.
- Innovation Toolkit.
- Canvas Engine con seis plantillas.
- Notas, comentarios, historial y presencia local.
- Conversion de notas a tareas.
- Enlaces compartidos demostrativos.
- Temas claro, oscuro y sistema.

## Plantillas del Innovation Toolkit

1. Mapa de Empatia.
2. Lienzo de Propuesta de Valor.
3. Lean Canvas.
4. Business Model Canvas.
5. Matriz de Priorizacion.
6. Pitch Canvas.

## Publicacion sin terminal

1. Crear o abrir el repositorio `wonkup-workspace`.
2. Subir el contenido conservando la estructura.
3. En **Settings > Pages** seleccionar **Deploy from a branch**.
4. Elegir `main` y la carpeta raiz.
5. Abrir la URL generada por GitHub Pages.

## Configuracion del MVP

```javascript
mode: 'mock',
kanbanMode: 'mock',
canvasMode: 'mock'
```

Google Sheets, Apps Script, Firebase y Google Drive real se conectaran progresivamente. No colocar secretos ni claves privadas en el frontend.
