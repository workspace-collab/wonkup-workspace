# Test Checklist — Entrega 4

## Regresión
- [ ] Los códigos de acceso siguen funcionando.
- [ ] Dashboard, proyectos, clientes y Drive mantienen el comportamiento aprobado.
- [ ] Archivar y restaurar proyectos sigue funcionando.
- [ ] Tema claro, oscuro y sistema funcionan.

## Kanban
- [ ] TaxiChurro muestra nueve columnas.
- [ ] Se puede crear una tarjeta.
- [ ] Se puede editar una tarjeta.
- [ ] Se puede arrastrar una tarjeta a otra columna.
- [ ] Se puede reordenar dentro de la misma columna.
- [ ] Un límite WIP bloquea el movimiento excedido.
- [ ] Búsqueda y filtros funcionan.
- [ ] La fecha vencida muestra alerta visual.
- [ ] Se pueden registrar responsable, participantes y etiquetas.
- [ ] Se pueden registrar horas estimadas y reales.
- [ ] Se pueden definir dependencias.
- [ ] Se puede archivar una tarjeta.

## Colaboración
- [ ] Se puede agregar un elemento a la checklist.
- [ ] Se puede completar y reabrir un elemento.
- [ ] Se puede eliminar un elemento.
- [ ] Se puede agregar un comentario.
- [ ] El historial registra creación, edición, movimiento, checklist y comentario.
- [ ] Dos pestañas del mismo navegador reciben los cambios.
- [ ] Los cambios permanecen al recargar.

## Permisos
- [ ] `WONKUP-ADMIN` puede modificar cualquier tablero autorizado.
- [ ] `AGORA-ADMIN` solo accede a proyectos de Ágora.
- [ ] `TAXI-LIDER` puede operar TaxiChurro.
- [ ] `TAXI-CLIENTE` no accede al Kanban.
- [ ] Cambiar manualmente la URL no permite abrir un proyecto no autorizado.

## Firebase preparado
- [ ] `runtime-config.js` permanece en `kanbanMode: 'mock'` durante la validación.
- [ ] No existen claves privadas en GitHub.
- [ ] Las reglas de Firestore están en la carpeta `firebase`.
- [ ] El adaptador muestra un error seguro si Firebase no está configurado.

## Ajuste 4.1

### Encabezado

- [ ] Los iconos de Crear, Tema, Notificaciones y Perfil son compactos.
- [ ] Solo un menú puede permanecer abierto.
- [ ] Los menús cierran al pulsar fuera.
- [ ] Los menús cierran con Escape.
- [ ] Cerrar sesión solicita confirmación.
- [ ] El botón hamburguesa solo aparece en móvil/tableta.
- [ ] El botón hamburguesa abre y cierra el sidebar.

### Búsqueda y notificaciones

- [ ] `Cmd + K` o `Ctrl + K` enfoca el buscador.
- [ ] La búsqueda encuentra proyectos, tareas y clientes autorizados.
- [ ] Los resultados respetan el workspace y los permisos.
- [ ] La campana abre notificaciones.
- [ ] El contador muestra solo no leídas.
- [ ] Marcar todas como leídas actualiza el contador.

### Clientes

- [ ] Crear cliente funciona.
- [ ] Editar cliente funciona.
- [ ] Archivar cliente lo oculta de la vista activa.
- [ ] Mostrar archivados permite encontrarlo.
- [ ] Restaurar cliente lo devuelve a la vista activa.
- [ ] Eliminar definitivamente exige superadministrador.
- [ ] No se elimina un cliente con proyectos vinculados.

### Kanban configurable

- [ ] Plantilla Básico genera 4 columnas.
- [ ] Plantilla Ágil genera 5 columnas.
- [ ] Plantilla Producto digital genera 6 columnas.
- [ ] Plantilla WonkUp completo genera 9 columnas.
- [ ] Se puede cambiar nombre, color, orden y límite WIP.
- [ ] Debe existir al menos una etapa final.
- [ ] No se desactiva una columna con tarjetas.
- [ ] `wipLimit: 0` no bloquea movimientos.
- [ ] El límite WIP bloquea una tarjeta adicional.

### Tarjetas archivadas

- [ ] Archivar conserva columna y posición previas.
- [ ] El botón Archivadas muestra el contador correcto.
- [ ] Restaurar vuelve a la columna anterior.
- [ ] Se puede escoger otra columna al restaurar.
- [ ] La restauración respeta el límite WIP.
- [ ] Solo administradores pueden eliminar definitivamente.
