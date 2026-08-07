import { ProjectService } from '../services/project-service.js?v=12.3.0';
import { DeliverableService } from '../services/deliverable-service.js?v=12.3.0';
import { renderDeliverables } from './deliverables-view.js?v=12.3.0';
import { escapeHtml, formatDate } from '../utils/format.js?v=12.3.0';
import { icon } from '../utils/icons.js?v=12.3.0';
import { isInternalUser } from '../utils/permissions.js?v=12.3.0';

const STATUS_LABELS = Object.freeze({
  draft: 'Borrador', in_review: 'En revisión', changes_requested: 'Cambios solicitados', approved: 'Aprobado'
});

function safeColor(value) {
  return /^#[0-9a-f]{6}$/i.test(String(value || '')) ? value : '#50a8f3';
}

function projectStatusLabel(status) {
  const labels = {
    draft: 'Borrador', planned: 'Planeamiento', active: 'En desarrollo',
    pending_client: 'Esperando revisión', on_hold: 'En pausa', blocked: 'Bloqueado',
    completed: 'Completado', archived: 'Archivado'
  };
  return labels[status] || status;
}

export function renderClientPortal(container, { workspaceId, projectId, section = 'overview' }, session) {
  container.innerHTML = `<section class="client-portal"><div class="loading-panel"><span class="spinner spinner-blue"></span><p>Preparando portal del cliente...</p></div></section>`;
  loadPortal(container, { workspaceId, projectId, section }, session);
}

async function loadPortal(container, context, session) {
  try {
    const [project, deliverables, milestones] = await Promise.all([
      ProjectService.getProject({ projectId: context.projectId, session }),
      DeliverableService.listDeliverables({ projectId: context.projectId, workspaceId: context.workspaceId, session }),
      ProjectService.listMilestones({ projectId: context.projectId, session })
    ]);
    if (!container.isConnected) return;
    if (!project) throw new Error('Proyecto no encontrado.');

    const allowedSections = ['overview', 'deliverables', 'timeline'];
    const section = allowedSections.includes(context.section) ? context.section : 'overview';
    const brand = safeColor(project.brandColor);
    const visibleMilestones = milestones.filter(item => item.visibility !== 'internal');
    const reviewCount = deliverables.filter(item => item.status === 'in_review').length;
    const changesCount = deliverables.filter(item => item.status === 'changes_requested').length;
    const approvedCount = deliverables.filter(item => item.status === 'approved').length;

    container.innerHTML = `<section class="client-portal" style="--portal-brand:${brand}">
      <header class="client-portal-hero">
        <div class="client-portal-brand">
          <div class="client-portal-logo">${project.logo ? `<img src="${escapeHtml(project.logo)}" alt="Logo de ${escapeHtml(project.name)}">` : escapeHtml(project.name.slice(0, 2).toUpperCase())}</div>
          <div><span class="client-portal-label">Portal del cliente</span><h1>${escapeHtml(project.name)}</h1><p>${escapeHtml(project.tagline || project.description)}</p></div>
        </div>
        <div class="client-portal-hero-meta">
          <span class="portal-status">${escapeHtml(projectStatusLabel(project.status))}</span>
          <div class="portal-progress"><strong>${Number(project.progress || 0)}%</strong><span>avance general</span></div>
          ${isInternalUser(session) ? `<a class="button button-secondary" href="#/w/${project.workspaceId}/p/${project.id}/summary">${icon('arrowLeft')} Volver al proyecto</a>` : ''}
        </div>
      </header>

      <nav class="client-portal-tabs" aria-label="Secciones del portal">
        <a href="#/portal/w/${project.workspaceId}/p/${project.id}/overview" class="${section === 'overview' ? 'active' : ''}" ${section === 'overview' ? 'aria-current="page"' : ''}>${icon('home')} Resumen</a>
        <a href="#/portal/w/${project.workspaceId}/p/${project.id}/deliverables" class="${section === 'deliverables' ? 'active' : ''}" ${section === 'deliverables' ? 'aria-current="page"' : ''}>${icon('file')} Entregables <span>${deliverables.length}</span></a>
        <a href="#/portal/w/${project.workspaceId}/p/${project.id}/timeline" class="${section === 'timeline' ? 'active' : ''}" ${section === 'timeline' ? 'aria-current="page"' : ''}>${icon('calendar')} Cronograma</a>
      </nav>
      <div class="client-portal-content" id="client-portal-content"></div>
    </section>`;

    const slot = container.querySelector('#client-portal-content');
    if (section === 'deliverables') {
      renderDeliverables(slot, { workspaceId: project.workspaceId, projectId: project.id, portal: true }, session);
    } else if (section === 'timeline') {
      renderPortalTimeline(slot, visibleMilestones, project);
    } else {
      renderPortalOverview(slot, { project, deliverables, milestones: visibleMilestones, reviewCount, changesCount, approvedCount, session });
    }
  } catch (error) {
    if (!container.isConnected) return;
    container.innerHTML = `<section class="page"><div class="empty-state"><div class="empty-state-icon">${icon('alert')}</div><h1>No se pudo abrir el portal</h1><p>${escapeHtml(error.message)}</p></div></section>`;
  }
}

function renderPortalOverview(slot, { project, deliverables, milestones, reviewCount, changesCount, approvedCount, session }) {
  const attention = deliverables.filter(item => ['in_review', 'changes_requested'].includes(item.status)).slice(0, 4);
  const nextMilestone = milestones
    .filter(item => item.status !== 'completed')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];
  const recentComments = deliverables
    .flatMap(item => (item.comments || []).map(comment => ({ ...comment, deliverableTitle: item.title })))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4);

  slot.innerHTML = `<div class="portal-dashboard">
    <section class="portal-welcome-card">
      <div><span class="eyebrow">Hola, ${escapeHtml(session.user?.name || 'cliente')}</span><h2>Este es el estado actual de ${escapeHtml(project.name)}</h2><p>Desde aquí puedes revisar entregables, dejar observaciones y aprobar versiones sin acceder a información interna del proyecto.</p></div>
      <a class="button button-primary" href="#/portal/w/${project.workspaceId}/p/${project.id}/deliverables">${icon('file')} Revisar entregables</a>
    </section>

    <div class="portal-metrics">
      <article><span class="portal-metric-icon portal-metric-blue">${icon('eye')}</span><div><strong>${reviewCount}</strong><span>Pendientes de revisión</span></div></article>
      <article><span class="portal-metric-icon portal-metric-orange">${icon('edit')}</span><div><strong>${changesCount}</strong><span>Con cambios solicitados</span></div></article>
      <article><span class="portal-metric-icon portal-metric-green">${icon('check')}</span><div><strong>${approvedCount}</strong><span>Aprobados</span></div></article>
    </div>

    <div class="portal-grid">
      <article class="panel portal-attention-panel"><div class="panel-header"><div><h2>Requiere atención</h2><p>Entregables con revisión o ajustes pendientes.</p></div><a class="panel-link" href="#/portal/w/${project.workspaceId}/p/${project.id}/deliverables">Ver todos</a></div><div class="panel-body">${attention.length ? attention.map(item => `<a class="portal-attention-row" href="#/portal/w/${project.workspaceId}/p/${project.id}/deliverables"><span class="portal-attention-icon">${icon(item.status === 'in_review' ? 'eye' : 'edit')}</span><div><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(STATUS_LABELS[item.status] || item.status)} · ${item.dueDate ? formatDate(item.dueDate) : 'Sin fecha'}</small></div>${icon('arrowRight')}</a>`).join('') : `<div class="portal-clear-state">${icon('check')}<strong>Todo al día</strong><span>No hay entregables pendientes de atención.</span></div>`}</div></article>

      <article class="panel"><div class="panel-header"><div><h2>Próximo hito</h2><p>La siguiente fecha visible del proyecto.</p></div></div><div class="panel-body">${nextMilestone ? `<div class="portal-next-milestone"><span>${formatDate(nextMilestone.dueDate)}</span><h3>${escapeHtml(nextMilestone.name)}</h3><p>Estado: ${escapeHtml(nextMilestone.status)}</p><a class="button button-secondary" href="#/portal/w/${project.workspaceId}/p/${project.id}/timeline">Ver cronograma</a></div>` : '<p class="muted-copy">No hay hitos próximos publicados.</p>'}</div></article>

      <article class="panel"><div class="panel-header"><div><h2>Comentarios recientes</h2><p>Última conversación sobre entregables.</p></div></div><div class="panel-body portal-comment-feed">${recentComments.length ? recentComments.map(comment => `<div class="portal-comment-row"><span class="team-avatar">${escapeHtml(comment.authorName?.slice(0, 2).toUpperCase() || 'US')}</span><div><strong>${escapeHtml(comment.deliverableTitle)}</strong><p>${escapeHtml(comment.text)}</p><small>${escapeHtml(comment.authorName)} · ${formatDate(comment.createdAt)}</small></div></div>`).join('') : '<p class="muted-copy">Todavía no hay comentarios.</p>'}</div></article>

      <article class="panel"><div class="panel-header"><div><h2>Enlaces del proyecto</h2><p>Accesos publicados para el cliente.</p></div></div><div class="panel-body resource-shortcuts">${project.hostingUrl ? `<a class="button button-secondary" href="${escapeHtml(project.hostingUrl)}" target="_blank" rel="noopener">${icon('external')} Sitio web</a>` : ''}${project.figmaUrl ? `<a class="button button-secondary" href="${escapeHtml(project.figmaUrl)}" target="_blank" rel="noopener">${icon('layers')} Prototipo</a>` : ''}${project.driveUrl ? `<a class="button button-secondary" href="${escapeHtml(project.driveUrl)}" target="_blank" rel="noopener">${icon('folder')} Carpeta compartida</a>` : ''}${!project.hostingUrl && !project.figmaUrl && !project.driveUrl ? '<p class="muted-copy">El equipo todavía no publicó enlaces adicionales.</p>' : ''}</div></article>
    </div>
  </div>`;
}

function renderPortalTimeline(slot, milestones, project) {
  const sorted = [...milestones].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  slot.innerHTML = `<section class="portal-timeline"><div class="deliverables-toolbar"><div><span class="eyebrow">Plan visible</span><h2>Cronograma del proyecto</h2><p>Hitos compartidos por el equipo de ${escapeHtml(project.name)}.</p></div></div><div class="portal-timeline-list">${sorted.length ? sorted.map(item => `<article class="portal-timeline-item portal-timeline-${escapeHtml(item.status)}"><span class="portal-timeline-marker">${icon(item.status === 'completed' ? 'check' : 'calendar')}</span><div><span>${formatDate(item.dueDate)}</span><h3>${escapeHtml(item.name)}</h3><p>${item.status === 'completed' ? 'Completado' : item.status === 'active' ? 'En curso' : 'Planificado'}</p></div></article>`).join('') : '<div class="deliverables-empty"><h3>Sin hitos publicados</h3><p>El equipo todavía no compartió un cronograma visible.</p></div>'}</div></section>`;
}
