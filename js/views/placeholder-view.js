import { icon } from '../utils/icons.js';
export function renderPlaceholder(container,section='modulo'){
  const names={calendar:'Calendario',team:'Equipo',clients:'Clientes',documents:'Documentos',reports:'Reportes',settings:'Configuracion'};
  container.innerHTML=`<section class="page"><div class="page-header"><div><h1>${names[section]||'Modulo'}</h1><p>La navegacion y el espacio visual estan preparados para la entrega correspondiente.</p></div></div><div class="empty-state"><div class="empty-state-icon">${icon('layers')}</div><h3>Modulo en preparacion</h3><p>Esta Entrega 1 construye el nucleo visual. La funcionalidad de ${names[section]||section} se implementara sin romper la estructura aprobada.</p></div></section>`;
}
