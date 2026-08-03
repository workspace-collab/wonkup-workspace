import { DemoService } from '../services/demo-service.js';
import { icon } from '../utils/icons.js';
import { escapeHtml, formatCurrency, formatDate } from '../utils/format.js';

function statusBadge(status) {
  const map = {
    active: ['En desarrollo','badge-blue'],
    pending_client: ['En revision','badge-orange'],
    planned: ['Planeamiento','badge-violet'],
    completed: ['Completado','badge-green'],
    blocked: ['Bloqueado','badge-red']
  };
  const value = map[status] || ['Borrador','badge-gray'];
  return `<span class="badge ${value[1]}">${value[0]}</span>`;
}

function projectLogo(project) {
  return project.logo ? `<img src="${project.logo}" alt="">` : escapeHtml(project.name.slice(0,2).toUpperCase());
}

export function renderDashboard(container, workspaceId) {
  const projects = DemoService.getProjects(workspaceId);
  const activities = DemoService.getActivities(workspaceId).slice(0,4);
  const tasks = DemoService.getTasks(workspaceId).slice(0,4);
  const active = projects.filter(p => p.status === 'active').length;
  const attention = projects.filter(p => ['pending_client','blocked'].includes(p.status) || p.health === 'amber').length;
  const completed = projects.filter(p => p.status === 'completed').length;
  const avgProgress = projects.length ? Math.round(projects.reduce((a,p)=>a+p.progress,0)/projects.length) : 0;
  const budget = projects.reduce((a,p)=>a+p.budget,0);
  const cost = projects.reduce((a,p)=>a+p.cost,0);
  const hours = projects.reduce((a,p)=>a+p.hours,0);
  const margin = budget ? Math.round(((budget-cost)/budget)*100) : 0;

  container.innerHTML = `<section class="page">
    <div class="page-header"><div><h1>Dashboard</h1><p>Resumen general de tu portafolio y de los proyectos que requieren atencion.</p></div><div class="page-header-actions"><a class="button button-primary" href="${workspaceId==='all'?'#/master/projects':`#/w/${workspaceId}/projects`}">${icon('folder')} Ver proyectos</a></div></div>
    <div class="metrics-grid">
      ${metric('blue','briefcase',projects.length,'Proyectos totales','Portafolio visible')}
      ${metric('blue','activity',active,'En ejecucion','Trabajo activo')}
      ${metric('red','alert',attention,'Requieren atencion','Revision o riesgo')}
      ${metric('green','check',completed,'Completados','Cierre confirmado')}
    </div>
    <div class="dashboard-middle-grid">
      <article class="panel"><div class="panel-header"><div><h2>Proyectos recientes</h2><p>Estado actual de las iniciativas principales.</p></div><a class="panel-link" href="${workspaceId==='all'?'#/master/projects':`#/w/${workspaceId}/projects`}">Ver todos</a></div><div class="panel-body project-list">${projects.slice(0,5).map(p=>`<a class="project-list-row" href="#/w/${p.workspaceId}/p/${p.id}/summary"><span class="project-logo-sm">${projectLogo(p)}</span><span class="list-copy"><strong>${escapeHtml(p.name)}</strong><small>${escapeHtml(p.owner)} · ${p.progress}%</small></span>${statusBadge(p.status)}</a>`).join('') || emptyInline('No hay proyectos')}</div></article>
      <article class="panel"><div class="panel-header"><div><h2>Progreso del portafolio</h2><p>Distribucion demostrativa por estado.</p></div></div><div class="panel-body donut-layout"><div class="donut-wrap"><div class="donut"><div class="donut-center"><strong>${avgProgress}%</strong><span>Avance general</span></div></div></div><div class="legend"><div class="legend-row"><span class="legend-dot" style="background:var(--success)"></span><span>Completados</span><strong>25%</strong></div><div class="legend-row"><span class="legend-dot" style="background:var(--wonkup-sky)"></span><span>En desarrollo</span><strong>37%</strong></div><div class="legend-row"><span class="legend-dot" style="background:var(--warning)"></span><span>En revision</span><strong>19%</strong></div><div class="legend-row"><span class="legend-dot" style="background:var(--violet)"></span><span>Planeamiento</span><strong>19%</strong></div></div></div></article>
    </div>
    <div class="dashboard-bottom-grid">
      <article class="panel"><div class="panel-header"><div><h2>Actividad reciente</h2><p>Actualizaciones del equipo.</p></div></div><div class="panel-body activity-list">${activities.map(a=>`<div class="activity-row"><span class="activity-avatar">${a.initials}</span><span class="list-copy"><strong>${escapeHtml(a.action)}</strong><small>${escapeHtml(a.time)}</small></span></div>`).join('') || emptyInline('Sin actividad')}</div></article>
      <article class="panel"><div class="panel-header"><div><h2>Tareas pendientes</h2><p>Proximos vencimientos del portafolio.</p></div></div><div class="panel-body task-list">${tasks.map(t=>`<div class="task-row"><span class="task-check"></span><span class="list-copy"><strong>${escapeHtml(t.title)}</strong><small>${priorityBadge(t.priority)}</small></span><span class="task-date">${formatDate(t.dueDate,{year:false})}</span></div>`).join('') || emptyInline('Sin tareas')}</div></article>
    </div>
    <div class="metrics-grid" style="margin-top:18px">
      ${metric('blue','wallet',formatCurrency(budget),'Presupuesto demo','Consolidado autorizado')}
      ${metric('gold','chart',formatCurrency(cost),'Costos demo','Datos ficticios')}
      ${metric('blue','clock',hours,'Horas registradas','Acumulado demo')}
      ${metric('green','activity',`${margin}%`,'Margen estimado','Solo administradores')}
    </div>
  </section>`;
}

function metric(color, ico, value, label, note) {
  return `<article class="metric-card metric-${color}"><div class="metric-top"><span class="metric-icon">${icon(ico)}</span></div><div class="metric-value">${value}</div><div class="metric-label">${label}</div><div class="metric-note">${note}</div></article>`;
}
function priorityBadge(p) { const map={high:['Alta','badge-red'],medium:['Media','badge-gold'],low:['Baja','badge-green']}; const v=map[p]||['Normal','badge-gray']; return `<span class="badge ${v[1]}">${v[0]}</span>`; }
function emptyInline(text){ return `<div style="padding:16px;color:var(--text-muted)">${text}</div>`; }
