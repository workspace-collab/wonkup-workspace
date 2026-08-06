# Test Checklist - Ajuste 4.2

## Condición de salida

- [ ] Cero desbordamiento horizontal del documento en los cinco breakpoints.
- [ ] Cero hallazgos críticos abiertos.
- [ ] Cero hallazgos altos abiertos.
- [ ] Contraste WCAG 2.2 AA en tema claro y oscuro.
- [ ] Navegación completa con teclado.
- [ ] Reflow funcional con texto al 200 %.
- [ ] Las acciones visibles ejecutan una función real o aparecen deshabilitadas como Próximamente.

## Matriz de resoluciones

Ejecutar cada flujo en:

- [ ] 320 x 700 px.
- [ ] 390 x 844 px.
- [ ] 768 x 1024 px.
- [ ] 1280 x 800 px.
- [ ] 1440 x 1000 px.

## P0 - Responsive y reflow

- [ ] La ficha interna de proyecto no amplía el ancho del documento.
- [ ] El hero del proyecto aparece antes de la información administrativa en móvil.
- [ ] Las pestañas se desplazan dentro de su propio contenedor.
- [ ] La pestaña activa se desplaza hasta quedar visible.
- [ ] El Kanban embebido no amplía la página.
- [ ] El scroll horizontal queda contenido dentro del tablero.
- [ ] En móvil, Kanban inicia en vista lista.
- [ ] La vista tablero muestra señal de más columnas, contador y controles de desplazamiento.
- [ ] El formulario de acceso aparece antes de los beneficios en móvil.
- [ ] Proyectos y Clientes no generan overflow a 320 px.
- [ ] Toolbars y controles permiten wrap con texto al 200 %.

## P0 - Modales y foco

Probar Nuevo proyecto, Editar proyecto, Nueva tarjeta, Detalle de tarjeta, Configurar tablero, Archivadas, Clientes y confirmaciones.

- [ ] El foco inicial llega al primer campo significativo.
- [ ] Tab no permite salir del modal.
- [ ] Shift + Tab no permite salir del modal.
- [ ] Escape cierra el modal.
- [ ] El fondo no recibe interacción mientras el modal está abierto.
- [ ] Al cerrar, el foco regresa al botón disparador.
- [ ] Título y descripción del diálogo tienen asociación ARIA.

## P0 - Contraste y tema

- [ ] El botón primario con texto blanco utiliza el azul accesible.
- [ ] El cielo WonkUp se usa como marca o fondo decorativo, no como fondo de texto blanco pequeño.
- [ ] Texto normal alcanza 4.5:1.
- [ ] Texto grande alcanza 3:1.
- [ ] Texto secundario y muted es legible.
- [ ] Badges de éxito, advertencia, error e información son legibles.
- [ ] El globo de notificaciones es legible.
- [ ] Hover, focus, active y disabled mantienen contraste.
- [ ] Tema oscuro conserva contraste en Dashboard, Proyectos, Proyecto y Kanban.

## P1 - Formularios y nombres accesibles

- [ ] Búsqueda global tiene nombre accesible específico.
- [ ] Búsqueda de proyectos tiene nombre accesible específico.
- [ ] Búsqueda de clientes tiene nombre accesible específico.
- [ ] Búsqueda Kanban tiene nombre accesible específico.
- [ ] Campos obligatorios incluyen `required` y `aria-required`.
- [ ] Campos inválidos incluyen `aria-invalid=true`.
- [ ] Cada error está asociado mediante `aria-describedby`.
- [ ] El foco se dirige al primer error del formulario.
- [ ] Los mensajes globales se anuncian en una región dedicada.

## P1 - Menús y navegación

- [ ] Crear, Tema, Notificaciones, Perfil y menú móvil actualizan `aria-expanded`.
- [ ] Cada disparador tiene `aria-controls`.
- [ ] Solo un menú puede permanecer abierto.
- [ ] Escape cierra el menú y restaura el foco.
- [ ] Clic exterior cierra el menú.
- [ ] El botón hamburguesa se oculta en escritorio.
- [ ] En móvil abre y cierra el sidebar.
- [ ] La pestaña activa usa `aria-current=page`.
- [ ] La jerarquía de encabezados no salta de h1 a h3.
- [ ] `#app` no usa `aria-live` global.

## P1 - Objetivos de interacción

- [ ] Ningún objetivo problemático mide menos de 24 x 24 CSS px.
- [ ] Acciones principales móviles miden al menos 44 x 44 px.
- [ ] Checkboxes y radios tienen un área de interacción suficiente.
- [ ] Tabs, icon buttons y enlaces frecuentes son cómodos al tacto.

## P1 - Fidelidad funcional

- [ ] La búsqueda global muestra resultados reales y permite navegar.
- [ ] Los resultados respetan workspace, proyecto y rol.
- [ ] Notificaciones abre un panel funcional.
- [ ] El contador representa solo notificaciones no leídas.
- [ ] Calendario, Equipo, Documentos, Reportes y Configuración se muestran como Próximamente y no como enlaces falsos.
- [ ] Nueva tarea abre un flujo real.
- [ ] Nueva proyecto abre un flujo real.
- [ ] Nueva canvas no se ofrece como acción operativa hasta que exista su flujo.

## Kanban

- [ ] Plantilla Básico genera 4 columnas.
- [ ] Plantilla Ágil genera 5 columnas.
- [ ] Plantilla Producto digital genera 6 columnas.
- [ ] Plantilla WonkUp completo genera 9 columnas.
- [ ] Se puede cambiar nombre, color, orden y límite WIP.
- [ ] No se desactiva una columna que contiene tarjetas.
- [ ] Límite WIP bloquea el exceso y explica el motivo.
- [ ] Crear, editar, mover y reordenar tarjeta funciona.
- [ ] Checklist, comentarios, historial, horas y dependencias funcionan.
- [ ] Archivar conserva columna y posición previas.
- [ ] Restaurar respeta el límite WIP.
- [ ] Vista lista y vista tablero mantienen el mismo contenido.

## Clientes y proyectos

- [ ] Crear, editar, archivar y restaurar proyecto funciona.
- [ ] Crear, editar, archivar y restaurar cliente funciona.
- [ ] La eliminación definitiva exige superadministrador.
- [ ] No se elimina un cliente con proyectos vinculados.
- [ ] Prioridades técnicas se muestran en español.
- [ ] Salud del proyecto incluye texto y no depende solo del color.

## Permisos

Ejecutar las pruebas con:

- [ ] `WONKUP-ADMIN`.
- [ ] `AGORA-ADMIN`.
- [ ] `TAXI-LIDER`.
- [ ] `TAXI-CLIENTE`.
- [ ] `HUELLITAS-INVITADO`.

Validar:

- [ ] No aparecen resultados de búsqueda no autorizados.
- [ ] Cambiar la URL no permite abrir otro workspace o proyecto.
- [ ] Cliente e invitado no reciben datos financieros ni controles internos.
- [ ] Líder solo opera los proyectos asignados.

## Movimiento y zoom

- [ ] `prefers-reduced-motion: reduce` desactiva animaciones no esenciales.
- [ ] El scroll no se fuerza de forma suave con movimiento reducido.
- [ ] Texto al 200 % no corta contenido ni crea scroll horizontal de documento.

## Regresión general

- [ ] Los códigos de acceso funcionan.
- [ ] Tema claro, oscuro y sistema funcionan.
- [ ] Sesión permanece al recargar.
- [ ] Cerrar sesión funciona y solicita confirmación.
- [ ] Dashboard, Proyectos, Clientes, Drive simulado y Kanban conservan la funcionalidad previa.
- [ ] No hay errores en la consola del navegador.
- [ ] `mode: 'mock'` y `kanbanMode: 'mock'` permanecen activos.

## Ajuste 5.1

### Geometría metodológica

- [ ] BMC muestra nueve bloques en la distribución de Osterwalder.
- [ ] BMC incluye emojis en todos los encabezados.
- [ ] Mapa de Empatía muestra dos columnas y tres filas en escritorio.
- [ ] Lean Canvas respeta sus bloques verticales y fila económica.
- [ ] Propuesta de Valor separa Mapa de Valor y Perfil del Cliente.
- [ ] Matriz muestra ejes Deseabilidad y Factibilidad.
- [ ] Pitch Canvas conserva su estructura.

### Navegación y edición

- [ ] Agregar nota no cambia de ruta.
- [ ] Volver al Toolkit y Abrir carga el mismo canvas.
- [ ] Abrir usa un enlace navegable incluso después de recargar.
- [ ] Drag and drop conserva notas y sección.
- [ ] El porcentaje cambia al agregar, mover y eliminar información.

### Compartir

- [ ] Genera enlace de 1, 7, 15 y 30 días.
- [ ] Genera enlace con fecha personalizada.
- [ ] Bloquea una fecha pasada.
- [ ] Copiar enlace funciona o selecciona el campo como fallback.
- [ ] Muestra QR.
- [ ] Lista enlaces activos, vencidos y revocados.
- [ ] Revocar enlace impide abrirlo.

### Visualización y PDF

- [ ] Modo enfoque oculta y recupera la barra lateral.
- [ ] Pantalla completa funciona y sale con Escape.
- [ ] Resumen A4 usa orientación horizontal.
- [ ] Detalle A4 continúa en varias páginas cuando corresponde.
- [ ] Los controles de edición no aparecen en impresión.

### Versiones

- [ ] Crea un punto de control manual.
- [ ] Registra versiones después de cambios.
- [ ] Un rol no superadmin no puede restaurar.
- [ ] Superadmin restaura una versión.
- [ ] La restauración conserva respaldo del estado anterior.

## Ajuste 5.2 - Estabilidad del Canvas Engine

### Pantalla completa y overlays

- [ ] Historial se muestra sobre el canvas fullscreen.
- [ ] Compartir se muestra sobre el canvas fullscreen.
- [ ] Exportar se muestra sobre el canvas fullscreen.
- [ ] Nueva nota se muestra sobre el canvas fullscreen.
- [ ] Editar nota se muestra sobre el canvas fullscreen.
- [ ] Los toasts son visibles en fullscreen.
- [ ] Escape cierra el modal antes de salir de fullscreen.

### Notas y arrastre

- [ ] Nueva nota prioriza el campo Contenido.
- [ ] Opciones de sección y color están contraídas inicialmente.
- [ ] Agregar nota guarda y confirma.
- [ ] El lápiz abre Detalle de nota.
- [ ] Arrastrar una nota no cambia la ruta.
- [ ] Arrastrar una nota no regresa al Toolkit.
- [ ] El canvas continúa operativo sin recargar manualmente.

### Compartir

- [ ] Copiar muestra `Enlace copiado`.
- [ ] La confirmación se ve dentro del modal.
- [ ] El QR se amplía al hacer clic.
- [ ] El visor presenta código, URL y acciones.

### Versiones

- [ ] Punto de control crea una versión correlativa.
- [ ] El modal de historial se refresca.
- [ ] Restaurar conserva abierto el canvas.
- [ ] Restaurar conserva la ruta.

### TIMER

- [ ] Solo aparece en pantalla completa.
- [ ] Permite seleccionar duración.
- [ ] Inicia y descuenta.
- [ ] Pausa conservando el tiempo.
- [ ] Reinicia a la duración seleccionada.
- [ ] Muestra aviso al finalizar.

## Ajuste 5.3

- [ ] La cabecera fullscreen no genera una zona blanca sobredimensionada.
- [ ] El título no se divide palabra por palabra.
- [ ] Copiar enlace cambia el texto del botón.
- [ ] La confirmación aparece dentro del visor QR.
- [ ] El fallback selecciona el enlace cuando Clipboard API falla.
- [ ] Arrastrar una nota no cambia la ruta.
- [ ] Arrastrar una nota no cierra fullscreen.
- [ ] Arrastrar una nota no destruye los listeners del editor.
- [ ] La nota conserva su nueva sección después de recargar.
- [ ] El lápiz sigue funcionando después de un drag.

## Ajuste 5.4 - Prueba de estabilidad

- [ ] Crear 10 notas consecutivas sin salir del canvas.
- [ ] Mover una misma nota 10 veces entre secciones.
- [ ] Mover 5 notas diferentes consecutivamente.
- [ ] Editar una nota inmediatamente después de moverla.
- [ ] Repetir creación y drag en pantalla completa.
- [ ] La ruta no cambia durante una mutación.
- [ ] El listado del Toolkit solo aparece al usar Volver al Toolkit.
- [ ] La URL y la vista nunca quedan desincronizadas.

## Ajuste 5.5 - Estabilidad repetitiva

- [ ] Crear 10 notas consecutivas sin cambiar de ruta.
- [ ] Mover una nota 10 veces desde el asa superior.
- [ ] Mover 5 notas diferentes.
- [ ] Editar después de mover.
- [ ] Repetir en pantalla completa.
- [ ] Confirmar cero errores en la consola.

## Ajuste 5.6 - Reconstrucción estable

### Integración automatizada completada

- [x] Iniciar sesión con `WONKUP-ADMIN`.
- [x] Abrir Ágora Education > TaxiChurro > Canvases > Lean Canvas.
- [x] Confirmar la ruta `#/w/w-agora/p/p-taxichurro/canvas/canvas-taxi-lean`.
- [x] Activar pantalla completa.
- [x] Crear 20 notas consecutivas sin reemplazar el workspace.
- [x] Conservar la misma ruta después de cada alta.
- [x] Mover una nota 20 veces mediante eventos reales de puntero.
- [x] Conservar la misma ruta después de cada movimiento.
- [x] Editar la nota después de moverla.
- [x] Recrear la ruta y comprobar persistencia.
- [x] Confirmar cero errores de página.

### Validación pendiente en GitHub Pages

- [ ] La publicación muestra `Motor 5.6.0`.
- [ ] Crear 10 notas consecutivas mantiene abierto el canvas.
- [ ] Mover una nota 10 veces mantiene abierto el canvas.
- [ ] Mover mediante mouse, trackpad y selector funciona.
- [ ] Editar después de mover funciona.
- [ ] Repetir en pantalla completa funciona.
- [ ] La URL no cambia durante ninguna operación.
- [ ] El Toolkit solo aparece al pulsar deliberadamente Volver al Toolkit.

## Ajuste 5.7 - Interacción ágil

- [ ] El `+` de una sección crea una nota inline sin modal.
- [ ] La nota se guarda al salir, con Guardar o Ctrl/Cmd + Enter.
- [ ] Los colores aparecen en hover/focus.
- [ ] El nombre del color no aparece dentro de la tarjeta.
- [ ] Eliminar nota funciona desde la acción rápida.
- [ ] El menú de tres puntos abre los detalles avanzados.
- [ ] Compartir muestra un enlace listo inmediatamente.
- [ ] Copiar enlace muestra confirmación.
- [ ] Imprimir / PDF abre directamente el diálogo de impresión.
- [ ] Escape cierra el diálogo antes de salir del modo inmersivo.
- [ ] Escape sale del modo inmersivo cuando no hay diálogo.

## Ajuste 5.8 - Encabezado, navegación y timer

- [ ] El encabezado usa el color de marca del proyecto.
- [ ] El título dispone de ancho suficiente y no deja un gran espacio vacío.
- [ ] El botón de tres líneas aparece en escritorio.
- [ ] El botón oculta y muestra el menú lateral.
- [ ] La preferencia del menú se conserva al recargar.
- [ ] El botón Modo enfoque ya no aparece en el canvas.
- [ ] Detalle de nota muestra seis colores con códigos hexadecimales.
- [ ] El color seleccionado queda claramente marcado.
- [ ] Guardar cambios aplica el color elegido.
- [ ] Al terminar, el timer emite tres tonos.
- [ ] Al terminar, el timer cambia de estado visual.
- [ ] Al terminar, aparece un aviso aunque el audio esté bloqueado.

## Entrega 6 - Portal del cliente y entregables

### Equipo interno

- [ ] Crear entregable.
- [ ] Editar entregable.
- [ ] Registrar versión.
- [ ] Completar checklist.
- [ ] Enviar a revisión.
- [ ] Archivar y restaurar.
- [ ] Abrir Vista cliente.

### Cliente

- [ ] TAXI-CLIENTE abre directamente el portal.
- [ ] Ve resumen, entregables y cronograma.
- [ ] No ve finanzas, horas ni módulos internos.
- [ ] Abre la última versión.
- [ ] Agrega comentarios.
- [ ] Aprueba un entregable en revisión.
- [ ] Solicita cambios con feedback.

### Invitado

- [ ] HUELLITAS-INVITADO abre el portal.
- [ ] Puede consultar entregables visibles.
- [ ] No puede comentar ni aprobar.

### Responsive y accesibilidad

- [ ] Portal usable a 320, 390, 768 y 1280 px.
- [ ] Modales navegables con teclado.
- [ ] Estados no dependen solo del color.
- [ ] Tema oscuro conserva contraste.

## Entrega 7 - Finanzas

### Acceso y permisos

- [ ] Finanzas aparece para superadministrador.
- [ ] Finanzas aparece para administrador de workspace.
- [ ] Finanzas aparece para líder del proyecto.
- [ ] Colaborador solo ve sus horas.
- [ ] Cliente no ve Finanzas.
- [ ] Invitado no ve Finanzas.
- [ ] Líder no ve Rentabilidad ni Configuración.

### Configuración

- [ ] Cambiar moneda.
- [ ] Cambiar monto contratado.
- [ ] Cambiar presupuesto interno.
- [ ] Cambiar descuento e impuesto.
- [ ] Cambiar horas planificadas.
- [ ] Cambiar margen objetivo.
- [ ] Editar tarifas del equipo.

### Ingresos y costos

- [ ] Crear ingreso.
- [ ] Editar ingreso.
- [ ] Marcar ingreso pagado.
- [ ] Anular ingreso.
- [ ] Registrar costo.
- [ ] Editar costo.
- [ ] Eliminar costo.
- [ ] Abrir comprobante.

### Horas

- [ ] Registrar horas manualmente.
- [ ] Editar horas.
- [ ] Eliminar horas.
- [ ] Iniciar temporizador.
- [ ] Pausar temporizador.
- [ ] Registrar tiempo del temporizador.
- [ ] Mantener timer al recargar.

### Métricas

- [ ] Total facturable correcto.
- [ ] Saldo por cobrar correcto.
- [ ] Costo laboral correcto.
- [ ] Costo real correcto.
- [ ] Utilidad correcta.
- [ ] Margen correcto.
- [ ] Alertas correctas.

## Entrega 8 - Dashboard y reportes

### Dashboard ejecutivo

- [ ] Carga para Panel Maestro.
- [ ] Carga para un workspace.
- [ ] Muestra proyectos, avance, riesgos y entregables.
- [ ] Muestra finanzas solo a administradores.
- [ ] Abre proyectos desde la tabla prioritaria.
- [ ] Abre el módulo Reportes.

### Reportes

- [ ] Filtro de periodo actualiza la información.
- [ ] Filtro de estado actualiza la información.
- [ ] Pestaña Ejecutivo funciona.
- [ ] Pestaña Proyectos funciona.
- [ ] Pestaña Entregables funciona.
- [ ] Pestaña Finanzas solo aparece a administradores.
- [ ] Exportación CSV descarga datos visibles.
- [ ] CSV de líder no incluye rentabilidad privada.
- [ ] Imprimir / PDF usa A4 horizontal.
- [ ] Los enlaces de proyecto funcionan.
- [ ] Los cambios financieros actualizan el reporte.
- [ ] Los cambios de entregables actualizan el reporte.

### Permisos

- [ ] Superadministrador ve reportes maestros.
- [ ] Administrador ve reportes de su workspace.
- [ ] Líder ve reportes operativos sin rentabilidad.
- [ ] Colaborador ve únicamente su alcance autorizado.
- [ ] Cliente e invitado no acceden a Reportes.

# Entrega 9 — Cloud Foundation

## Regresión local antes de configurar Firebase

- [ ] La aplicación abre sin pantalla en blanco.
- [ ] `WONKUP-ADMIN` conserva acceso completo.
- [ ] Códigos de workspace, líder, cliente e invitado continúan funcionando.
- [ ] Proyectos y altas rápidas funcionan en modo mock.
- [ ] Kanban funciona en modo mock.
- [ ] Canvas Engine funciona en modo mock.
- [ ] Entregables funcionan en modo mock.
- [ ] Finanzas y Reportes funcionan en modo mock/agregado.
- [ ] Cloud Foundation solo aparece para superadmin.
- [ ] Exportar respaldo descarga JSON.
- [ ] Simular migración reporta cero rutas duplicadas.
- [ ] Simular activación reporta solo las rutas autorizadas.

## Firebase Console

- [ ] Proyecto Firebase creado.
- [ ] App Web registrada sin Firebase Hosting.
- [ ] Firestore creado en ubicación revisada y aprobada.
- [ ] `firebase/firestore.rules` publicado.
- [ ] Rules Playground rechaza acceso anónimo.
- [ ] Authentication Email/Password habilitado.
- [ ] Política de contraseña configurada.
- [ ] Primera cuenta administrativa creada.
- [ ] Perfil `users/{uid}` creado con rol `superadmin` y estado `active`.
- [ ] Dominio de GitHub Pages autorizado en Authentication.

## Diagnóstico

- [ ] Configuración pública correcta.
- [ ] SDK 12.16.0 carga desde CDN.
- [ ] Firebase App se inicializa.
- [ ] Authentication inicia sesión.
- [ ] Perfil Firestore es legible.
- [ ] Documento `system/schema` es accesible o figura pendiente antes de migrar.
- [ ] Persistencia en disco permanece desactivada.
- [ ] App Check aparece preparado y no forzado.

## Migración

- [ ] Respaldo descargado y almacenado fuera del navegador.
- [ ] Workspaces correctos seleccionados.
- [ ] Conjuntos de datos correctos seleccionados.
- [ ] Simulación revisada.
- [ ] Cero rutas duplicadas.
- [ ] Migración completada sin errores de permisos.
- [ ] `system/schema` creado.
- [ ] Auditoría de migración creada.
- [ ] Verificación devuelve cantidades esperadas.
- [ ] Repetir migración no genera documentos duplicados.

## Modo híbrido

- [ ] Código demo sigue leyendo datos locales.
- [ ] Cuenta Firebase lee proyectos Firestore.
- [ ] Crear proyecto con cuenta Firebase persiste en Firestore.
- [ ] Editar proyecto con cuenta Firebase persiste en Firestore.
- [ ] Cliente y persona nuevos persisten en el workspace correcto.
- [ ] Proyecto creado desde navegador A aparece en navegador B.
- [ ] Cambiar a `projectMode: 'mock'` restaura el comportamiento local.

## Usuarios y permisos

- [ ] Usuario creado previamente en Firebase Authentication.
- [ ] UID copiado correctamente.
- [ ] Simular permisos muestra perfil y membresías esperadas.
- [ ] Un proyecto fuera del workspace seleccionado es rechazado.
- [ ] Roles de proyecto requieren al menos un proyecto.
- [ ] Activación crea auditoría.
- [ ] Workspace admin no obtiene otros workspaces.
- [ ] Líder no obtiene otros proyectos.
- [ ] Colaborador no administra configuración.
- [ ] Cliente no ve información interna ni financiera.
- [ ] Invitado permanece en lectura limitada.
- [ ] Cuenta sin perfil activo es rechazada.

## Seguridad posterior

- [ ] API key restringida a APIs de Firebase.
- [ ] No existen claves privadas en GitHub.
- [ ] No existe clave de Gemini en el frontend.
- [ ] App Check se registra primero sin enforcement.
- [ ] Métricas App Check se observan antes de forzar.
- [ ] Persistencia web solo se habilita con confirmación de dispositivo confiable.

## Entrega 11 — Entregables y aprobaciones Cloud

### Despliegue

- [ ] Paquete de cambios subido directamente a la raíz.
- [ ] GitHub Pages carga recursos `11.0.1`.
- [ ] Reglas `firebase/firestore.rules` publicadas manualmente.
- [ ] Cuenta superadministradora inicia sesión.

### Migración 11.1

- [ ] Respaldo JSON descargado.
- [ ] Simulación sin rutas duplicadas.
- [ ] Migración confirmada con dos clics.
- [ ] Verificación coincide con entregables, versiones y comentarios esperados.

### Operación interna

- [ ] Crear y editar entregable.
- [ ] Agregar versión.
- [ ] Completar checklist.
- [ ] Enviar a revisión.
- [ ] Archivar y restaurar.
- [ ] Cambios visibles en segundo navegador.

### Portal del cliente

- [ ] Solo muestra entregables visibles para cliente.
- [ ] Cliente puede comentar.
- [ ] Cliente puede aprobar.
- [ ] Cliente puede solicitar cambios.
- [ ] Revisor puede consultar y comentar, pero no aprobar.
- [ ] Invitado permanece en solo lectura.
- [ ] Información interna permanece oculta.

### Notificaciones y regresión

- [ ] Revisión notifica al cliente/revisor.
- [ ] Aprobación o cambios notifican al equipo interno.
- [ ] Comentario notifica al lado contrario.
- [ ] Kanban Cloud continúa funcionando.
- [ ] Código demo conserva entregables locales.
- [ ] Canvas y Finanzas continúan en modo local.

# Entrega 12 — Checklist de validación real

## Instalación

- [ ] Respaldo de la versión 11.0.1 conservado.
- [ ] Código 12.0.0 publicado en GitHub Pages.
- [ ] `firebase/firestore.rules` publicado.
- [ ] `firebase/realtime-database.rules.json` publicado.
- [ ] Recarga forzada realizada.

## Cloud Foundation

- [ ] Diagnóstico Firebase correcto.
- [ ] Realtime Database detectada.
- [ ] Respaldo Canvas descargado.
- [ ] Simulación 12.1 sin rutas duplicadas.
- [ ] Migración completada.
- [ ] Verificación con conteos esperados.

## Colaboración

- [ ] Nota creada desde navegador A aparece en navegador B.
- [ ] Edición de texto y color se sincroniza.
- [ ] Movimiento de sección se sincroniza.
- [ ] Comentario se sincroniza.
- [ ] Presencia muestra ambas cuentas.
- [ ] Cerrar una pestaña retira su presencia.

## Enlaces

- [ ] Enlace vigente abre en ventana privada.
- [ ] No se exponen comentarios ni historial.
- [ ] Enlace revocado deja de abrir.
- [ ] Enlace vencido deja de abrir.

## Roles

- [ ] Superadministrador restaura versiones.
- [ ] Administrador y líder administran el Canvas.
- [ ] Colaborador edita notas sin administrar enlaces o versiones.
- [ ] Revisor no accede al Canvas interno.
- [ ] Cliente e invitado solo acceden por enlace público.

## Demo y regresión

- [ ] Código demo conserva `localStorage`.
- [ ] Canvas 5.9 funciona sin regresiones.
- [ ] Kanban y Entregables continúan operativos.
