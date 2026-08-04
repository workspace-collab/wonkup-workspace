# Test Checklist — Entrega 2

## Acceso mock
- [ ] `WONKUP-ADMIN` abre el Panel Maestro.
- [ ] `AGORA-ADMIN` abre únicamente Ágora Education.
- [ ] `TAXI-LIDER` solo ve TaxiChurro.
- [ ] `TAXI-CLIENTE` solo abre el resumen de TaxiChurro.
- [ ] `HUELLITAS-INVITADO` solo abre el resumen de Huellitas.
- [ ] Un código incorrecto muestra un error.
- [ ] El código no queda guardado en localStorage ni sessionStorage.

## Permisos
- [ ] Un cliente no puede abrir `#/master/dashboard`.
- [ ] Un cliente no puede abrir Kanban, Canvases ni Finanzas.
- [ ] Un administrador de Ágora no puede abrir NIJA modificando la URL.
- [ ] Los indicadores financieros solo aparecen a administradores.
- [ ] El selector muestra únicamente workspaces autorizados.

## Sesión
- [ ] La sesión persiste al recargar la pestaña.
- [ ] La sesión desaparece al cerrar la pestaña o navegador.
- [ ] Cerrar sesión devuelve a `#/access`.
- [ ] Una sesión vencida obliga a ingresar nuevamente.

## Temas y responsive
- [ ] Claro, oscuro y sistema funcionan en acceso y plataforma.
- [ ] El login funciona en móvil.
- [ ] El sidebar móvil conserva el cierre mediante backdrop.

## Apps Script
- [ ] `setupWonkUpMaster()` crea todas las hojas.
- [ ] Los códigos se guardan como hashes.
- [ ] `auth.exchangeCode` crea una sesión.
- [ ] `auth.validate` valida una sesión vigente.
- [ ] `auth.revoke` revoca una sesión.
- [ ] `workspaces.list` filtra por alcance.
