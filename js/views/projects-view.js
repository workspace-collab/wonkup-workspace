import { ProjectService } from '../services/project-service.js?v=9.0.4';
import { canArchiveProject, canCreateProject, canEditProject } from '../utils/permissions.js?v=9.0.4';
import { icon } from '../utils/icons.js?v=9.0.4';
import { escapeHtml, formatDate } from '../utils/format.js?v=9.0.4';
import { openProjectForm } from '../components/project-form.js?v=9.0.4';
import { confirmModal } from '../components/modal.js?v=9.0.4';
import { showToast } from '../components/toast.js?v=9.0.4';

const STATUS = Object.freeze({
  draft: ['Borrador', 'badge-gray'],
  planned: ['Planeamiento', 'badge-violet'],
  active: ['En desarrollo', 'badge-blue'],
  pending_client: ['Esperando cliente', 'badge-orange'],
  on_hold: ['En pausa', 'badge-gold'],
  blocked: ['Bloqueado', 'badge-red'],
  completed: ['Completado', 'badge-green'],
  archived: ['Archivado', 'badge-gray']
});

export function renderProjects(container, workspaceId, session) {
  container.innerHTML = `<section class="page">
    <div class="page-header"><div><span class="page-kicker">GESTIÓN DE PROYECTOS</span><h1>Mis proyectos</h1><p>Crea, edita, consulta y organiza los proyectos incluidos en tu alcance.</p></div>${canCreateProject(session) ? `<div class="page-header-actions"><button class="button button-primary" id="new-project">${icon('plus')} Nuevo proyecto</button></div>` : ''}</div>
    <div class="toolbar" style="margin-bottom:18px">
      <label class="search-box" for="project-search"><span class="sr-only">Buscar proyectos por nombre, código o cliente</span>${icon('search')}<input id="project-search" type="search" placeholder="Buscar proyecto, código o cliente..." aria-label="Buscar proyectos"></label>
      <select class="select" id="status-filter"><option value="">Todos los estados</option>${Object.entries(STATUS).map(([key, value]) => `<option value="${key}">${value[0]}</option>`).join('')}</select>
      <label class="check-inline"><input type="checkbox" id="include-archived"> Mostrar archivados</label>
      <span class="service-mode">Fuente: ${ProjectService.mode === 'mock' ? 'demo local' : 'Google Apps Script'}</span>
    </div>
    <div id="projects-content"><div class="loading-panel"><span class="spinner spinner-blue"></span><p>Cargando proyectos...</p></div></div>
  </section>`;

  const state = { projects: [], query: '', status: '', includeArchived: false };
  const content = container.querySelector('#projects-content');

  const load = async () => {
    content.innerHTML = '<div class="loading-panel"><span class="spinner spinner-blue"></span><p>Cargando proyectos...</p></div>';
    try {
      state.projects = await ProjectService.listProjects({ workspaceId, session, includeArchived: state.includeArchived });
      renderGrid();
    } catch (error) {
      content.innerHTML = errorState(error.message, load);
      content.querySelector('[data-retry]')?.addEventListener('click', load);
    }
  };

  const renderGrid = () => {
    const query = state.query.toLowerCase();
    const filtered = state.projects.filter(project => {
      const haystack = `${project.name} ${project.code} ${project.client} ${project.description}`.toLowerCase();
      return (!query || haystack.includes(query)) && (!state.status || project.status === state.status);
    });

    content.innerHTML = filtered.length
      ? `<div class="projects-grid">${filtered.map(project => projectCard(project, session)).join('')}</div>`
      : `<div class="empty-state"><div class="empty-state-icon">${icon('search')}</div><h2>No encontramos proyectos</h2><p>Cambia los filtros o crea un proyecto nuevo.</p></div>`;

    content.querySelectorAll('[data-project-edit]').forEach(button => {
      button.addEventListener('click', async () => {
        const project = state.projects.find(item => item.id === button.dataset.projectEdit);
        if (!project) return;
        await openProjectForm({
          session,
          workspaceId,
          project,
          onSaved: async saved => {
            state.projects = state.projects.map(item => item.id === saved.id ? saved : item);
            renderGrid();
          }
        });
      });
    });

    content.querySelectorAll('[data-project-archive]').forEach(button => {
      button.addEventListener('click', async () => {
        const project = state.projects.find(item => item.id === button.dataset.projectArchive);
        if (!project) return;
        const confirmed = await confirmModal({
          title: 'Archivar proyecto',
          message: `El proyecto <strong>${escapeHtml(project.name)}</strong> dejará de aparecer en la vista principal.`,
          confirmLabel: 'Archivar',
          danger: true
        });
        if (!confirmed) return;
        try {
          await ProjectService.archiveProject({ projectId: project.id, session });
          showToast('Proyecto archivado.');
          await load();
        } catch (error) {
          showToast(error.message || 'No se pudo archivar el proyecto.');
        }
      });
    });


    content.querySelectorAll('[data-project-restore]').forEach(button => {
      button.addEventListener('click', async () => {
        const project = state.projects.find(item => item.id === button.dataset.projectRestore);
        if (!project) return;
        const confirmed = await confirmModal({
          title: 'Restaurar proyecto',
          message: `El proyecto <strong>${escapeHtml(project.name)}</strong> volverá a su estado anterior y aparecerá nuevamente en la vista principal.`,
          confirmLabel: 'Restaurar'
        });
        if (!confirmed) return;
        try {
          await ProjectService.restoreProject({ projectId: project.id, session });
          showToast('Proyecto restaurado.');
          await load();
        } catch (error) {
          showToast(error.message || 'No se pudo restaurar el proyecto.');
        }
      });
    });
  };

  container.querySelector('#project-search').addEventListener('input', event => {
    state.query = event.target.value;
    renderGrid();
  });
  container.querySelector('#status-filter').addEventListener('change', event => {
    state.status = event.target.value;
    renderGrid();
  });
  container.querySelector('#include-archived').addEventListener('change', async event => {
    state.includeArchived = event.target.checked;
    await load();
  });

  const openCreate = () => openProjectForm({
    session,
    workspaceId,
    onSaved: saved => {
      location.hash = `#/w/${saved.workspaceId}/p/${saved.id}/summary`;
    }
  });

  container.querySelector('#new-project')?.addEventListener('click', openCreate);

  if (sessionStorage.getItem('wonkup.intent.newProject') === '1' && canCreateProject(session)) {
    sessionStorage.removeItem('wonkup.intent.newProject');
    setTimeout(openCreate, 0);
  }

  load();
}

function projectCard(project, session) {
  const status = STATUS[project.status] || STATUS.draft;
  const healthColor = { green: 'var(--success)', amber: 'var(--warning)', red: 'var(--danger)' }[project.health] || 'var(--text-muted)';
  const healthLabel = { green: 'Salud estable', amber: 'Salud en riesgo', red: 'Salud crítica' }[project.health] || 'Salud sin evaluar';
  const canEdit = canEditProject(session, project.id, project.workspaceId) && project.status !== 'archived';
  const canArchive = canArchiveProject(session, project.workspaceId) && project.status !== 'archived';
  const canRestore = canArchiveProject(session, project.workspaceId) && project.status === 'archived';

  return `<article class="project-card ${project.status === 'archived' ? 'project-card-archived' : ''}">
    <div class="project-card-top">
      <div class="project-card-logo">${project.logo ? `<img src="${escapeHtml(project.logo)}" alt="">` : escapeHtml(project.name.slice(0, 2).toUpperCase())}</div>
      <div class="project-card-copy"><h2>${escapeHtml(project.name)}</h2><p>${escapeHtml(project.code)} · ${escapeHtml(project.client || 'Sin cliente')}</p></div>
      <span class="badge ${status[1]}">${status[0]}</span>
    </div>
    <div class="project-card-progress"><div class="progress-head"><span>Progreso</span><strong>${Number(project.progress || 0)}%</strong></div><div class="progress-track"><div class="progress-bar" style="width:${Number(project.progress || 0)}%"></div></div></div>
    <div class="project-card-meta">
      <div class="meta-row"><span>Responsable</span><strong>${escapeHtml(project.owner || 'Sin responsable')}</strong></div>
      <div class="meta-row"><span>Entrega estimada</span><strong>${formatDate(project.dueDate)}</strong></div>
      <div class="meta-row"><span>Drive</span><strong>${project.driveFolderId ? 'Estructura creada' : 'Pendiente'}</strong></div>
    </div>
    <div class="project-card-footer">
      <span class="health"><span class="health-dot" style="background:${healthColor}" aria-hidden="true"></span>${escapeHtml(healthLabel)}</span>
      <div class="card-actions">
        ${canEdit ? `<button class="icon-button" data-project-edit="${project.id}" aria-label="Editar">${icon('edit')}</button>` : ''}
        ${canArchive ? `<button class="icon-button icon-button-danger" data-project-archive="${project.id}" aria-label="Archivar">${icon('archive')}</button>` : ''}
        ${canRestore ? `<button class="button button-gold button-compact" data-project-restore="${project.id}">${icon('refresh')} Restaurar</button>` : ''}
        <a class="button button-secondary" href="#/w/${project.workspaceId}/p/${project.id}/summary">Abrir ${icon('arrowRight')}</a>
      </div>
    </div>
  </article>`;
}

function errorState(message) {
  return `<div class="empty-state"><div class="empty-state-icon">${icon('alert')}</div><h2>No se pudieron cargar los proyectos</h2><p>${escapeHtml(message || 'Revisa la conexión e inténtalo nuevamente.')}</p><button class="button button-primary" data-retry>${icon('refresh')} Reintentar</button></div>`;
}
