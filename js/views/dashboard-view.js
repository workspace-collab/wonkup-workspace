import { DemoService } from '../services/demo-service.js';
import { ProjectService } from '../services/project-service.js';
import { canViewFinancials } from '../utils/permissions.js';
import { icon } from '../utils/icons.js';
import { escapeHtml, formatCurrency, formatDate } from '../utils/format.js';

function statusBadge(status) {
  const map = {
    active: ['En desarrollo', 'badge-blue'],
    pending_client: ['En revisión', 'badge-orange'],
    planned: ['Planeamiento', 'badge-violet'],
    completed: ['Completado', 'badge-green'],
    blocked: ['Bloqueado', 'badge-red'],
    archived: ['Archivado', 'badge-gray']
  };
  const value = map[status] || ['Borrador', 'badge-gray'];
  return `<span class="badge ${value[1]}">${value[0]}</span>`;
}

function projectLogo(project) {
  return project.logo
    ? `<img src="${escapeHtml(project.logo)}" alt="">`
    : escapeHtml(project.name.slice(0, 2).toUpperCase());
}

export function renderDashboard(container, workspaceId, session) {
  container.innerHTML = `<section class="page"><div class="loading-panel"><span class="spinner spinner-blue"></span><p>Cargando dashboard...</p></div></section>`;
  loadDashboard(container, workspaceId, session);
}

async function loadDashboard(container, workspaceId, session) {
  try {
    const projects = await ProjectService.listProjects({ workspaceId, session, includeArchived: false });
    const activities = DemoService.getActivities(workspaceId, session).slice(0, 4);
    const tasks = DemoService.getTasks(workspaceId, session).slice(0, 4);
    const active = projects.filter(project => project.status === 'active').length;
    const attention = projects.filter(project => ['pending_client', 'blocked'].includes(project.status) || project.health === 'amber').length;
    const completed = projects.filter(project => project.status === 'completed').length;
    const avgProgress = projects.length
      ? Math.round(projects.reduce((total, project) => total + Number(project.progress || 0), 0) / projects.length)
      : 0;
    const budget = projects.reduce((total, project) => total + Number(project.budget || 0), 0);
    const cost = projects.reduce((total, project) => total + Number(project.cost || 0), 0);
    const hours = projects.reduce((total, project) => total + Number(project.hours || 0), 0);
    const margin = budget ? Math.round(((budget - cost) / budget) * 100) : 0;
    const projectsHref = workspaceId === 'all' ? '#/master/projects' : `#/w/${workspaceId}/projects`;

    container.innerHTML = `<section class="page">
      <div class="page-header">
        <div><span class="page-kicker">${escapeHtml(session.roleLabel)}</span><h1>Dashboard</h1><p>Resumen del portafolio autorizado para tu sesión actual.</p></div>
        <div class="page-header-actions"><a class="button button-primary" href="${projectsHref}">${icon('folder')} Ver proyectos</a></div>
      </div>

      <div class="session-banner"><span>${icon('shield')}</span><div><strong>Acceso controlado por rol</strong><small>Sesión temporal activa hasta ${new Date(session.expiresAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}.</small></div></div>

      <div class="metrics-grid">
        ${metric('blue', 'briefcase', projects.length, 'Proyectos visibles', 'Según tu alcance')}
        ${metric('blue', 'activity', active, 'En ejecución', 'Trabajo activo')}
        ${metric('red', 'alert', attention, 'Requieren atención', 'Revisión o riesgo')}
        ${metric('green', 'check', completed, 'Completados', 'Cierre confirmado')}
      </div>

      <div class="dashboard-middle-grid">
        <article class="panel"><div class="panel-header"><div><h2>Proyectos recientes</h2><p>Estado actual de las iniciativas autorizadas.</p></div><a class="panel-link" href="${projectsHref}">Ver todos</a></div><div class="panel-body project-list">${projects.slice(0, 5).map(project => `<a class="project-list-row" href="#/w/${project.workspaceId}/p/${project.id}/summary"><span class="project-logo-sm">${projectLogo(project)}</span><span class="list-copy"><strong>${escapeHtml(project.name)}</strong><small>${escapeHtml(project.owner || 'Sin responsable')} · ${Number(project.progress || 0)}%</small></span>${statusBadge(project.status)}</a>`).join('') || emptyInline('No hay proyectos asignados')}</div></article>
        <article class="panel"><div class="panel-header"><div><h2>Progreso del portafolio</h2><p>Promedio de los proyectos visibles.</p></div></div><div class="panel-body donut-layout"><div class="donut-wrap"><div class="donut"><div class="donut-center"><strong>${avgProgress}%</strong><span>Avance general</span></div></div></div><div class="legend"><div class="legend-row"><span class="legend-dot" style="background:var(--success)"></span><span>Completados</span><strong>${completed}</strong></div><div class="legend-row"><span class="legend-dot" style="background:var(--wonkup-sky)"></span><span>En desarrollo</span><strong>${active}</strong></div><div class="legend-row"><span class="legend-dot" style="background:var(--warning)"></span><span>Con atención</span><strong>${attention}</strong></div><div class="legend-row"><span class="legend-dot" style="background:var(--violet)"></span><span>Total visible</span><strong>${projects.length}</strong></div></div></div></article>
      </div>

      <div class="dashboard-bottom-grid">
        <article class="panel"><div class="panel-header"><div><h2>Actividad reciente</h2><p>Actualizaciones de proyectos visibles.</p></div></div><div class="panel-body activity-list">${activities.map(activity => `<div class="activity-row"><span class="activity-avatar">${activity.initials}</span><span class="list-copy"><strong>${escapeHtml(activity.action)}</strong><small>${escapeHtml(activity.time)}</small></span></div>`).join('') || emptyInline('Sin actividad')}</div></article>
        <article class="panel"><div class="panel-header"><div><h2>Tareas pendientes</h2><p>Próximos vencimientos autorizados.</p></div></div><div class="panel-body task-list">${tasks.map(task => `<div class="task-row"><span class="task-check"></span><span class="list-copy"><strong>${escapeHtml(task.title)}</strong><small>${priorityBadge(task.priority)}</small></span><span class="task-date">${formatDate(task.dueDate, { year: false })}</span></div>`).join('') || emptyInline('Sin tareas')}</div></article>
      </div>

      ${canViewFinancials(session) ? `<div class="metrics-grid" style="margin-top:18px">
        ${metric('blue', 'wallet', formatCurrency(budget), 'Presupuesto demo', 'Consolidado autorizado')}
        ${metric('gold', 'chart', formatCurrency(cost), 'Costos demo', 'Datos ficticios')}
        ${metric('blue', 'clock', hours, 'Horas registradas', 'Acumulado demo')}
        ${metric('green', 'activity', `${margin}%`, 'Margen estimado', 'Solo administradores')}
      </div>` : ''}
    </section>`;
  } catch (error) {
    container.innerHTML = `<section class="page"><div class="empty-state"><div class="empty-state-icon">${icon('alert')}</div><h2>No se pudo cargar el dashboard</h2><p>${escapeHtml(error.message)}</p></div></section>`;
  }
}

function metric(color, iconName, value, label, note) {
  return `<article class="metric-card metric-${color}"><div class="metric-top"><span class="metric-icon">${icon(iconName)}</span></div><div class="metric-value">${value}</div><div class="metric-label">${label}</div><div class="metric-note">${note}</div></article>`;
}

function priorityBadge(priority) {
  const map = { high: ['Alta', 'badge-red'], medium: ['Media', 'badge-gold'], low: ['Baja', 'badge-green'] };
  const value = map[priority] || ['Normal', 'badge-gray'];
  return `<span class="badge ${value[1]}">${value[0]}</span>`;
}

function emptyInline(text) {
  return `<div style="padding:16px;color:var(--text-muted)">${text}</div>`;
}
