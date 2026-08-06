import { icon } from '../utils/icons.js?v=12.0.1';
export function renderPlaceholder(container,section='modulo'){
  const names={calendar:'Calendario',team:'Equipo',clients:'Clientes',documents:'Documentos',reports:'Reportes',settings:'Configuracion'};
  container.innerHTML=`<section class="page"><div class="page-header"><div><h1>${names[section]||'Modulo'}</h1><p>La navegacion y el espacio visual estan preparados para la entrega correspondiente.</p></div></div><div class="empty-state"><div class="empty-state-icon">${icon('layers')}</div><h2>Módulo próximamente</h2><p>El núcleo visual está preparado. La funcionalidad de ${names[section]||section} se implementara sin romper la estructura aprobada.</p></div></section>`;
}
