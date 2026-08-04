# Test Checklist — Entrega 3

## Regresión de Entrega 2
- [ ] Todos los códigos siguen funcionando.
- [ ] Los alcances por workspace y proyecto se mantienen.
- [ ] Tema claro, oscuro y sistema funcionan.
- [ ] Cerrar sesión funciona.

## Proyectos en modo mock
- [ ] `WONKUP-ADMIN` puede crear un proyecto en cualquier workspace.
- [ ] `AGORA-ADMIN` solo puede crear dentro de Ágora.
- [ ] El código se genera correlativamente.
- [ ] El proyecto nuevo aparece en la lista y en el Dashboard.
- [ ] El proyecto puede editarse.
- [ ] Una fecha de entrega anterior al inicio muestra error.
- [ ] Una URL inválida muestra error.
- [ ] Archivar oculta el proyecto de la vista principal.
- [ ] “Mostrar archivados” permite consultarlo.

## Clientes
- [ ] El módulo Clientes lista los registros autorizados.
- [ ] Un administrador puede crear un cliente.
- [ ] El cliente nuevo aparece en el formulario de proyectos.
- [ ] Un correo inválido se rechaza.

## Proyecto
- [ ] Resumen carga correctamente.
- [ ] Cronograma muestra hitos.
- [ ] Documentos muestra recursos.
- [ ] Se puede registrar y retirar un recurso.
- [ ] Equipo muestra miembros.
- [ ] Se puede asignar y retirar un miembro.
- [ ] Configuración permite editar y archivar.

## Drive
- [ ] En modo mock se muestra la estructura simulada.
- [ ] En Apps Script se crea `WONKUP_WORKSPACE`.
- [ ] Se crea la carpeta del workspace.
- [ ] Se crea la carpeta del proyecto y las subcarpetas.
- [ ] La carpeta permanece privada por defecto.
- [ ] Repetir la acción no duplica la estructura.

## Permisos
- [ ] `TAXI-LIDER` puede editar TaxiChurro, pero no crear ni archivar proyectos.
- [ ] `TAXI-CLIENTE` sigue viendo solo el resumen autorizado.
- [ ] Un cliente no puede invocar endpoints de creación.
- [ ] Apps Script rechaza un workspace fuera del alcance.
