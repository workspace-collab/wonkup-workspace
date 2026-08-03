import { DemoService } from '../services/demo-service.js';
import { icon } from '../utils/icons.js';
import { escapeHtml } from '../utils/format.js';
export function renderKanban(container,workspaceId,projectId=null,embedded=false){
  const project=projectId?DemoService.getProject(projectId):DemoService.getProjects(workspaceId)[0];
  const board=DemoService.getKanban(project?.id);
  container.innerHTML=`<section class="${embedded?'':'page'}" style="${embedded?'margin-top:18px':''}">${embedded?'':`<div class="page-header"><div><h1>Kanban</h1><p>Vista global demostrativa del trabajo en curso.</p></div><div class="page-header-actions"><button class="button button-primary">${icon('plus')} Nueva tarjeta</button></div></div>`}<div class="toolbar" style="margin-bottom:16px"><label class="search-box">${icon('search')}<input placeholder="Buscar tarjetas..."></label><select class="select"><option>Todos los responsables</option></select><select class="select"><option>Todas las prioridades</option></select></div><div class="kanban-board">${board.map(col=>`<section class="kanban-column"><div class="kanban-column-head"><strong>${escapeHtml(col.name)}</strong><span class="kanban-count">${col.cards.length}</span></div><div class="kanban-cards">${col.cards.map(card=>`<article class="kanban-card"><h4>${escapeHtml(card.title)}</h4>${priority(card.priority)}<div class="kanban-card-footer"><span class="kanban-avatar">${card.owner}</span><small>${escapeHtml(card.dueDate)}</small></div></article>`).join('')}</div></section>`).join('')}</div></section>`;
}
function priority(p){const m={high:['Alta','badge-red'],medium:['Media','badge-gold'],low:['Baja','badge-green']};const v=m[p]||['Normal','badge-gray'];return `<span class="badge ${v[1]}">${v[0]}</span>`;}
