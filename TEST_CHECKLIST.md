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
