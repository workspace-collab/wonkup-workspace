import { DemoService } from '../services/demo-service.js';
import { canViewFinancials, isReadOnlyRole } from '../utils/permissions.js';
import { icon } from '../utils/icons.js';
import { escapeHtml, formatDate, formatCurrency } from '../utils/format.js';
import { renderKanban } from './kanban-view.js';
import { renderToolkit } from './toolkit-view.js';

const baseTabs = [
  ['summary', 'Resumen'],
  ['innovation', 'Canvases'],
  ['kanban', 'Kanban'],
  ['timeline', 'Cronograma'],
  ['documents', 'Documentos'],
  ['team', 'Equipo'],
  ['finance', 'Finanzas'],
  ['hours', 'Horas'],
  ['activity', 'Actividad']
];

export function renderProject(container, { projectId, tab = 'summary' }, session) {
  const project = DemoService.getProjectForSession(projectId, session);
  if (!project) {
    container.innerHTML = '<div class="empty-state"><h3>Proyecto no encontrado o no autorizado</h3></div>';
    return;
  }

  const readOnly = isReadOnlyRole(session);
  const tabs = readOnly
    ? [['summary', 'Resumen']]
    : baseTabs.filter(([key]) => key !== 'finance' || canViewFinancials(session));

  container.innerHTML = `<section class="page"><div class="content-grid-project"><div><article class="project-hero"><div class="project-hero-top"><div class="project-hero-logo">${project.logo ? `<img src="${project.logo}" alt="">` : escapeHtml(project.name.slice(0, 2).toUpperCase())}</div><div class="project-hero-title">${!readOnly ? `<a class="panel-link" href="#/w/${project.workspaceId}/projects">${icon('arrowLeft')} Volver a proyectos</a>` : '<span class="page-kicker">VISTA COMPARTIDA</span>'}<h1>${escapeHtml(project.name)}</h1><p>${escapeHtml(project.tagline)}</p></div><span class="badge ${readOnly ? 'badge-gold' : 'badge-blue'}">${readOnly ? session.roleLabel : `${project.progress}% completado`}</span></div><nav class="project-tabs">${tabs.map(([key, label]) => `<a class="project-tab ${tab === key ? 'active' : ''}" href="#/w/${project.workspaceId}/p/${project.id}/${key}">${label}</a>`).join('')}</nav></article><div id="project-tab-content"></div></div><aside class="project-aside"><h2>Información del proyecto</h2><div class="info-list"><div class="info-row"><span>Estado</span><strong>En desarrollo</strong></div><div class="info-row"><span>Cliente</span><strong>${escapeHtml(project.client)}</strong></div><div class="info-row"><span>Responsable</span><strong>${escapeHtml(project.owner)}</strong></div><div class="info-row"><span>Prioridad</span><strong>${escapeHtml(project.priority)}</strong></div><div class="info-row"><span>Inicio</span><strong>${formatDate(project.startDate)}</strong></div><div class="info-row"><span>Entrega</span><strong>${formatDate(project.dueDate)}</strong></div>${canViewFinancials(session) ? `<div class="info-row"><span>Presupuesto</span><strong>${formatCurrency(project.budget)}</strong></div>` : ''}</div><button class="button button-primary drive-button" id="drive-demo">${icon('external')} Abrir en Drive</button>${readOnly ? '<p class="aside-note">Solo se muestran datos autorizados para el cliente o invitado.</p>' : ''}</aside></div></section>`;

  const slot = document.querySelector('#project-tab-content');
  if (tab === 'kanban') renderKanban(slot, project.workspaceId, project.id, true, session);
  else if (tab === 'innovation') renderToolkit(slot, project.workspaceId, project.id, true, session);
  else renderTab(slot, project, tab, session);

  document.querySelector('#drive-demo')?.addEventListener('click', () => alert('La integración real con Google Drive se implementará en la Entrega 3.'));
}

function renderTab(slot, project, tab, session) {
  if (tab !== 'summary') {
    slot.innerHTML = `<div class="empty-state" style="margin-top:18px"><div class="empty-state-icon">${icon('layers')}</div><h3>${baseTabs.find(item => item[0] === tab)?.[1] || 'Módulo'}</h3><p>La estructura visual está preparada. La funcionalidad real se conectará en su entrega correspondiente.</p></div>`;
    return;
  }

  const readOnly = isReadOnlyRole(session);
  slot.innerHTML = `<div class="project-summary-grid"><article class="panel"><div class="panel-header"><div><h2>Objetivo y alcance</h2><p>Resumen ejecutivo del proyecto.</p></div></div><div class="panel-body"><p style="margin:0;color:var(--text-muted)">${escapeHtml(project.description)}</p><div style="margin-top:18px"><div class="progress-head"><span>Avance general</span><strong>${project.progress}%</strong></div><div class="progress-track"><div class="progress-bar" style="width:${project.progress}%"></div></div></div></div></article><article class="panel"><div class="panel-header"><div><h2>${readOnly ? 'Estado visible' : 'Salud del proyecto'}</h2><p>${readOnly ? 'Información autorizada para consulta.' : 'Indicadores demostrativos.'}</p></div></div><div class="panel-body"><div class="info-list"><div class="info-row"><span>Tiempo</span><strong>En rango</strong></div>${canViewFinancials(session) ? `<div class="info-row"><span>Costo</span><strong>${formatCurrency(project.cost)} ejecutado</strong></div>` : ''}<div class="info-row"><span>Alcance</span><strong>Estable</strong></div>${!readOnly ? `<div class="info-row"><span>Horas</span><strong>${project.hours} h</strong></div>` : ''}</div></div></article><article class="panel"><div class="panel-header"><div><h2>Próximos hitos</h2></div></div><div class="panel-body task-list"><div class="task-row"><span class="task-check"></span><span class="list-copy"><strong>Validar entregable principal</strong><small>Responsable: ${escapeHtml(project.owner)}</small></span></div><div class="task-row"><span class="task-check"></span><span class="list-copy"><strong>Actualizar documentación</strong><small>Antes de ${formatDate(project.dueDate)}</small></span></div></div></article><article class="panel"><div class="panel-header"><div><h2>Recursos autorizados</h2></div></div><div class="panel-body"><div class="toolbar"><button class="button button-secondary">${icon('folder')} Drive</button>${!readOnly ? `<button class="button button-secondary">${icon('external')} GitHub</button><button class="button button-secondary">${icon('layers')} Figma</button>` : ''}</div></div></article></div>`;
}
