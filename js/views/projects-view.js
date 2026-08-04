import { DemoService } from '../services/demo-service.js';
import { canCreateProject } from '../utils/permissions.js';
import { icon } from '../utils/icons.js';
import { escapeHtml, formatDate } from '../utils/format.js';

export function renderProjects(container, workspaceId, session) {
  const projects = DemoService.getProjectsForSession(workspaceId, session);
  container.innerHTML = `<section class="page">
    <div class="page-header"><div><span class="page-kicker">ALCANCE AUTORIZADO</span><h1>Mis proyectos</h1><p>Explora únicamente los proyectos incluidos en tu sesión.</p></div>${canCreateProject(session) ? `<div class="page-header-actions"><button class="button button-primary" id="demo-new-project">${icon('plus')} Nuevo proyecto</button></div>` : ''}</div>
    <div class="toolbar" style="margin-bottom:18px"><label class="search-box">${icon('search')}<input id="project-search" type="search" placeholder="Buscar proyecto..."></label><select class="select" id="status-filter"><option value="">Todos los estados</option><option value="active">En desarrollo</option><option value="pending_client">En revisión</option><option value="planned">Planeamiento</option></select></div>
    <div class="projects-grid" id="projects-grid">${projects.map(projectCard).join('')}</div>
  </section>`;

  const renderFiltered = () => {
    const query = document.querySelector('#project-search').value.toLowerCase();
    const status = document.querySelector('#status-filter').value;
    const filtered = projects.filter(project => (!query || `${project.name} ${project.description}`.toLowerCase().includes(query)) && (!status || project.status === status));
    document.querySelector('#projects-grid').innerHTML = filtered.length
      ? filtered.map(projectCard).join('')
      : `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state-icon">${icon('search')}</div><h3>No encontramos proyectos</h3><p>Prueba otra búsqueda o cambia el filtro.</p></div>`;
  };

  document.querySelector('#project-search').addEventListener('input', renderFiltered);
  document.querySelector('#status-filter').addEventListener('change', renderFiltered);
  document.querySelector('#demo-new-project')?.addEventListener('click', () => alert('La creación real de proyectos se implementará en la Entrega 3.'));
}

function projectCard(project) {
  const status = {
    active: ['En desarrollo', 'badge-blue'],
    pending_client: ['En revisión', 'badge-orange'],
    planned: ['Planeamiento', 'badge-violet']
  }[project.status] || ['Borrador', 'badge-gray'];
  const healthColor = { green: 'var(--success)', amber: 'var(--warning)', red: 'var(--danger)' }[project.health] || 'var(--text-muted)';

  return `<article class="project-card"><div class="project-card-top"><div class="project-card-logo">${project.logo ? `<img src="${project.logo}" alt="">` : escapeHtml(project.name.slice(0, 2).toUpperCase())}</div><div class="project-card-copy"><h3>${escapeHtml(project.name)}</h3><p>${escapeHtml(project.code)}</p></div><span class="badge ${status[1]}">${status[0]}</span></div><div class="project-card-progress"><div class="progress-head"><span>Progreso</span><strong>${project.progress}%</strong></div><div class="progress-track"><div class="progress-bar" style="width:${project.progress}%"></div></div></div><div class="project-card-meta"><div class="meta-row"><span>Responsable</span><strong>${escapeHtml(project.owner)}</strong></div><div class="meta-row"><span>Entrega estimada</span><strong>${formatDate(project.dueDate)}</strong></div><div class="meta-row"><span>Tareas pendientes</span><strong>${project.pendingTasks}</strong></div></div><div class="project-card-footer"><span class="health"><span class="health-dot" style="background:${healthColor}"></span>Salud del proyecto</span><a class="button button-secondary" href="#/w/${project.workspaceId}/p/${project.id}/summary">Abrir ${icon('arrowRight')}</a></div></article>`;
}
