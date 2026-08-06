import { ProjectService } from '../services/project-service.js?v=12.0.1';
import {
  canArchiveProject,
  canEditProject,
  canManageProjectResources,
  canManageProjectTeam,
  canCreateWorkspaceUser,
  canViewFinancials,
  canAccessProjectFinance,
  isReadOnlyRole
} from '../utils/permissions.js?v=12.0.1';
import { icon } from '../utils/icons.js?v=12.0.1';
import { escapeHtml, formatDate, formatCurrency } from '../utils/format.js?v=12.0.1';
import { isValidEmail, normalizeText, normalizeUrl } from '../utils/validation.js?v=12.0.1';
import { renderKanban } from './kanban-view.js?v=12.0.1';
import { renderToolkit } from './toolkit-view.js?v=12.0.1';
import { renderDeliverables } from './deliverables-view.js?v=12.0.1';
import { openProjectForm } from '../components/project-form.js?v=12.0.1';
import { confirmModal, openModal } from '../components/modal.js?v=12.0.1';
import { showToast } from '../components/toast.js?v=12.0.1';

const baseTabs = [
  ['summary', 'Resumen'],
  ['innovation', 'Canvases'],
  ['kanban', 'Kanban'],
  ['timeline', 'Cronograma'],
  ['documents', 'Documentos'],
  ['deliverables', 'Entregables'],
  ['team', 'Equipo'],
  ['finance', 'Finanzas'],
  ['settings', 'Configuración']
];

const STATUS_LABELS = {
  draft: 'Borrador', planned: 'Planeamiento', active: 'En desarrollo', pending_client: 'Esperando cliente',
  on_hold: 'En pausa', blocked: 'Bloqueado', completed: 'Completado', archived: 'Archivado'
};

const PRIORITY_LABELS = {
  low: 'Baja', medium: 'Media', high: 'Alta', critical: 'Crítica'
};

const HEALTH_LABELS = {
  green: 'Salud estable', amber: 'Salud en riesgo', red: 'Salud crítica'
};

function safeBrandColor(value) {
  return /^#[0-9a-fA-F]{6}$/.test(String(value || '')) ? String(value).toLowerCase() : '#50a8f3';
}

function applyProjectCover(element, project) {
  if (!element) return;
  element.style.setProperty('--project-brand', safeBrandColor(project.brandColor));
  const coverImage = String(project.coverImage || '').trim();
  if (!coverImage) return;
  const safeUrl = coverImage.replace(/[\"'\\\r\n]/g, '');
  element.classList.add('has-cover');
  element.style.backgroundImage = `linear-gradient(90deg, rgba(6,12,29,.86), rgba(6,12,29,.42)), url("${safeUrl}")`;
}

export function renderProject(container, { projectId, tab = 'summary' }, session) {
  container.innerHTML = `<section class="page"><div class="loading-panel"><span class="spinner spinner-blue"></span><p>Cargando proyecto...</p></div></section>`;
  loadProject(container, projectId, tab, session);
}

async function loadProject(container, projectId, tab, session) {
  try {
    const project = await ProjectService.getProject({ projectId, session });
    if (!container.isConnected) return;
    if (!project) {
      container.innerHTML = `<section class="page"><div class="empty-state"><div class="empty-state-icon">${icon('lock')}</div><h2>Proyecto no encontrado o no autorizado</h2><p>Revisa tu enlace o vuelve a la lista de proyectos.</p></div></section>`;
      return;
    }
    renderProjectShell(container, project, tab, session);
  } catch (error) {
    if (!container.isConnected) return;
    container.innerHTML = `<section class="page"><div class="empty-state"><div class="empty-state-icon">${icon('alert')}</div><h2>No se pudo cargar el proyecto</h2><p>${escapeHtml(error.message)}</p></div></section>`;
  }
}

function renderProjectShell(container, project, tab, session) {
  const readOnly = isReadOnlyRole(session);
  const editable = canEditProject(session, project.id, project.workspaceId) && project.status !== 'archived';
  const restorable = canArchiveProject(session, project.workspaceId) && project.status === 'archived';
  const tabs = readOnly
    ? [['summary', 'Resumen']]
    : baseTabs.filter(([key]) => key !== 'finance' || canAccessProjectFinance(session, project.id, project.workspaceId));
  const safeTab = tabs.some(([key]) => key === tab) ? tab : 'summary';

  container.innerHTML = `<section class="page"><div class="content-grid-project"><div>
    <article class="project-hero">
      <div class="project-cover" id="project-cover">
        <div class="project-cover-content">
          <div class="project-hero-identity">
            <div class="project-hero-logo">${project.logo ? `<img src="${escapeHtml(project.logo)}" alt="Logo de ${escapeHtml(project.name)}">` : escapeHtml(project.name.slice(0, 2).toUpperCase())}</div>
            <div class="project-hero-title">${!readOnly ? `<a class="panel-link project-back-link" href="#/w/${project.workspaceId}/projects">${icon('arrowLeft')} Volver a proyectos</a>` : '<span class="project-shared-label">VISTA COMPARTIDA</span>'}<h1>${escapeHtml(project.name)}</h1><p>${escapeHtml(project.tagline || project.description)}</p></div>
          </div>
          <div class="project-hero-actions"><span class="project-cover-badge">${project.status === 'archived' ? 'Proyecto archivado' : readOnly ? escapeHtml(session.roleLabel) : `${Number(project.progress || 0)}% completado`}</span>${!readOnly ? `<a class="button project-cover-button" href="#/portal/w/${project.workspaceId}/p/${project.id}/overview">${icon('eye')} Vista cliente</a>` : ''}${editable ? `<button class="button project-cover-button" id="edit-project">${icon('edit')} Editar</button>` : ''}${restorable ? `<button class="button button-gold" id="restore-project">${icon('refresh')} Restaurar</button>` : ''}</div>
        </div>
      </div>
      <nav class="project-tabs" aria-label="Secciones del proyecto">${tabs.map(([key, label]) => `<a class="project-tab ${safeTab === key ? 'active' : ''}" href="#/w/${project.workspaceId}/p/${project.id}/${key}" ${safeTab === key ? 'aria-current="page"' : ''}>${label}</a>`).join('')}</nav>
    </article>
    <div id="project-tab-content"></div>
  </div>
  <aside class="project-aside">
    <h2>Información del proyecto</h2>
    <div class="info-list">
      <div class="info-row"><span>Estado</span><strong>${escapeHtml(STATUS_LABELS[project.status] || project.status)}</strong></div>
      <div class="info-row"><span>Código</span><strong>${escapeHtml(project.code)}</strong></div>
      <div class="info-row"><span>Cliente</span><strong>${escapeHtml(project.client || 'Sin cliente')}</strong></div>
      <div class="info-row"><span>Responsable</span><strong>${escapeHtml(project.owner || 'Sin responsable')}</strong></div>
      <div class="info-row"><span>Prioridad</span><strong>${escapeHtml(PRIORITY_LABELS[project.priority] || project.priority || '-')}</strong></div>
      <div class="info-row"><span>Inicio</span><strong>${formatDate(project.startDate)}</strong></div>
      <div class="info-row"><span>Entrega</span><strong>${formatDate(project.dueDate)}</strong></div>
      ${project.status === 'archived' && project.archivedAt ? `<div class="info-row"><span>Archivado</span><strong>${formatDate(project.archivedAt)}</strong></div>` : ''}
      ${canViewFinancials(session) ? `<div class="info-row"><span>Presupuesto</span><strong>${formatCurrency(project.budget)}</strong></div>` : ''}
    </div>
    ${project.driveUrl ? `<a class="button button-primary drive-button" href="${escapeHtml(project.driveUrl)}" target="_blank" rel="noopener">${icon('external')} Abrir en Drive</a>` : editable ? `<button class="button button-primary drive-button" id="create-drive">${icon('folder')} ${project.driveFolderId ? 'Ver estructura' : 'Crear estructura Drive'}</button>` : ''}
    ${readOnly ? '<p class="aside-note">Solo se muestran datos autorizados para el cliente o invitado.</p>' : `<p class="aside-note">Fuente activa: ${ProjectService.mode === 'mock' ? 'demo local' : 'Google Apps Script'}.</p>`}
  </aside></div></section>`;

  applyProjectCover(container.querySelector('#project-cover'), project);
  requestAnimationFrame(() => container.querySelector('.project-tab.active')?.scrollIntoView({ block: 'nearest', inline: 'center' }));

  const slot = container.querySelector('#project-tab-content');
  if (safeTab === 'kanban') renderKanban(slot, project.workspaceId, project.id, true, session);
  else if (safeTab === 'innovation') renderToolkit(slot, project.workspaceId, project.id, true, session);
  else renderTab(slot, project, safeTab, session);

  container.querySelector('#edit-project')?.addEventListener('click', () => openProjectForm({
    session,
    workspaceId: project.workspaceId,
    project,
    onSaved: () => loadProject(container, project.id, safeTab, session)
  }));

  container.querySelector('#restore-project')?.addEventListener('click', async () => {
    const confirmed = await confirmModal({
      title: 'Restaurar proyecto',
      message: `El proyecto <strong>${escapeHtml(project.name)}</strong> volverá a su estado anterior.`,
      confirmLabel: 'Restaurar'
    });
    if (!confirmed) return;
    try {
      await ProjectService.restoreProject({ projectId: project.id, session });
      showToast('Proyecto restaurado.');
      await loadProject(container, project.id, 'summary', session);
    } catch (error) {
      showToast(error.message || 'No se pudo restaurar el proyecto.');
    }
  });

  container.querySelector('#create-drive')?.addEventListener('click', async event => {
    const button = event.currentTarget;
    button.disabled = true;
    button.innerHTML = '<span class="spinner"></span> Preparando...';
    try {
      const structure = await ProjectService.createDriveStructure({ projectId: project.id, session });
      showDriveStructure(structure);
      await loadProject(container, project.id, 'documents', session);
    } catch (error) {
      showToast(error.message || 'No se pudo crear la estructura de Drive.');
      button.disabled = false;
      button.innerHTML = `${icon('folder')} Crear estructura Drive`;
    }
  });
}

function renderTab(slot, project, tab, session) {
  const renderers = {
    summary: () => renderSummary(slot, project, session),
    timeline: () => renderTimeline(slot, project, session),
    documents: () => renderDocuments(slot, project, session),
    deliverables: () => renderDeliverables(slot, { workspaceId: project.workspaceId, projectId: project.id, embedded: true }, session),
    team: () => renderTeam(slot, project, session),
    finance: async () => {
      slot.innerHTML = loadingTab('Cargando módulo financiero...');
      try {
        const module = await import('./finance-view.js?v=12.0.1');
        if (!slot.isConnected) return;
        module.renderFinance(slot, project, session);
      } catch (error) {
        if (!slot.isConnected) return;
        slot.innerHTML = tabError(`No se pudo cargar Finanzas: ${error.message || 'Error desconocido.'}`);
      }
    },
    settings: () => renderSettings(slot, project, session)
  };
  if (renderers[tab]) {
    renderers[tab]();
    return;
  }
  const label = baseTabs.find(item => item[0] === tab)?.[1] || 'Módulo';
  slot.innerHTML = `<div class="empty-state" style="margin-top:18px"><div class="empty-state-icon">${icon('layers')}</div><h2>${label}</h2><p>Esta sección mantiene su estructura visual y se activará en la entrega funcional correspondiente.</p></div>`;
}

function renderSummary(slot, project, session) {
  const readOnly = isReadOnlyRole(session);
  slot.innerHTML = `<div class="project-summary-grid">
    <article class="panel"><div class="panel-header"><div><h2>Objetivo y alcance</h2><p>Resumen ejecutivo del proyecto.</p></div></div><div class="panel-body"><p class="body-copy">${escapeHtml(project.description || 'Sin descripción registrada.')}</p><div class="progress-block"><div class="progress-head"><span>Avance general</span><strong>${Number(project.progress || 0)}%</strong></div><div class="progress-track"><div class="progress-bar" style="width:${Number(project.progress || 0)}%"></div></div></div></div></article>
    <article class="panel"><div class="panel-header"><div><h2>${readOnly ? 'Estado visible' : 'Salud del proyecto'}</h2><p>${readOnly ? 'Información autorizada para consulta.' : 'Indicadores de gestión.'}</p></div></div><div class="panel-body"><div class="info-list"><div class="info-row"><span>Tiempo</span><strong>${project.health === 'red' ? 'Fuera de rango' : 'En rango'}</strong></div>${canViewFinancials(session) ? `<div class="info-row"><span>Costo</span><strong>${formatCurrency(project.cost)} ejecutado</strong></div>` : ''}<div class="info-row"><span>Alcance</span><strong>${escapeHtml(HEALTH_LABELS[project.health] || 'Salud estable')}</strong></div>${!readOnly ? `<div class="info-row"><span>Horas</span><strong>${Number(project.hours || 0)} h</strong></div>` : ''}</div></div></article>
    <article class="panel"><div class="panel-header"><div><h2>Próximos pasos</h2></div></div><div class="panel-body task-list"><div class="task-row"><span class="task-check"></span><span class="list-copy"><strong>Revisar el avance del proyecto</strong><small>Responsable: ${escapeHtml(project.owner || 'Sin responsable')}</small></span></div><div class="task-row"><span class="task-check"></span><span class="list-copy"><strong>Actualizar documentación</strong><small>Antes de ${formatDate(project.dueDate)}</small></span></div></div></article>
    <article class="panel"><div class="panel-header"><div><h2>Enlaces principales</h2></div></div><div class="panel-body resource-shortcuts">${linkButton('GitHub', project.githubUrl, 'external')}${linkButton('Figma', project.figmaUrl, 'layers')}${linkButton('Hosting', project.hostingUrl, 'external')}${project.driveUrl ? linkButton('Drive', project.driveUrl, 'folder') : '<span class="muted-copy">Drive aún no está vinculado.</span>'}</div></article>
  </div>`;
}

async function renderTimeline(slot, project, session) {
  slot.innerHTML = loadingTab('Cargando cronograma...');
  try {
    const milestones = await ProjectService.listMilestones({ projectId: project.id, session });
    slot.innerHTML = `<article class="panel tab-panel"><div class="panel-header"><div><h2>Cronograma e hitos</h2><p>Fechas principales del proyecto.</p></div></div><div class="panel-body"><div class="timeline-list">${milestones.length ? milestones.map(milestone => `<div class="timeline-item timeline-${milestone.status}"><span class="timeline-marker">${icon(milestone.status === 'completed' ? 'check' : 'calendar')}</span><div><strong>${escapeHtml(milestone.name)}</strong><small>${formatDate(milestone.dueDate)} · ${escapeHtml(milestone.status)}</small></div></div>`).join('') : '<p class="muted-copy">No hay hitos registrados todavía.</p>'}</div></div></article>`;
  } catch (error) {
    slot.innerHTML = tabError(error.message);
  }
}

async function renderDocuments(slot, project, session) {
  slot.innerHTML = loadingTab('Cargando documentos y recursos...');
  try {
    const resources = await ProjectService.listResources({ projectId: project.id, session });
    const canManage = canManageProjectResources(session, project.id, project.workspaceId);
    slot.innerHTML = `<div class="documents-grid tab-panel">
      <article class="panel"><div class="panel-header"><div><h2>Google Drive</h2><p>Carpeta principal y estructura documental.</p></div>${project.driveUrl ? `<a class="panel-link" href="${escapeHtml(project.driveUrl)}" target="_blank" rel="noopener">Abrir Drive</a>` : ''}</div><div class="panel-body"><div class="drive-status ${project.driveFolderId ? 'drive-ready' : ''}"><span>${icon('folder')}</span><div><strong>${project.driveFolderId ? 'Estructura creada' : 'Drive pendiente'}</strong><small>${project.driveFolderId ? (project.driveUrl ? 'Carpeta real vinculada.' : 'Estructura simulada en modo demo.') : 'Crea las carpetas estándar para el proyecto.'}</small></div></div>${canEditProject(session, project.id, project.workspaceId) ? `<button class="button button-primary" id="documents-drive-action">${icon('folder')} ${project.driveFolderId ? 'Ver estructura' : 'Crear estructura'}</button>` : ''}</div></article>
      <article class="panel"><div class="panel-header"><div><h2>Recursos vinculados</h2><p>Documentos, prototipos, repositorios y enlaces.</p></div>${canManage ? `<button class="button button-secondary" id="add-resource">${icon('plus')} Registrar</button>` : ''}</div><div class="panel-body resource-list">${resources.length ? resources.map(resource => resourceRow(resource, canManage)).join('') : '<p class="muted-copy">No hay recursos registrados.</p>'}</div></article>
    </div>`;

    slot.querySelector('#documents-drive-action')?.addEventListener('click', async () => {
      try {
        const structure = await ProjectService.createDriveStructure({ projectId: project.id, session });
        showDriveStructure(structure);
        project.driveFolderId = structure.folderId;
        project.driveUrl = structure.folderUrl || project.driveUrl;
        renderDocuments(slot, project, session);
      } catch (error) {
        showToast(error.message);
      }
    });
    slot.querySelector('#add-resource')?.addEventListener('click', () => openResourceForm({ project, session, onSaved: () => renderDocuments(slot, project, session) }));
    slot.querySelectorAll('[data-remove-resource]').forEach(button => button.addEventListener('click', async () => {
      const confirmed = await confirmModal({ title: 'Retirar recurso', message: 'El enlace dejará de mostrarse dentro del proyecto.', confirmLabel: 'Retirar', danger: true });
      if (!confirmed) return;
      await ProjectService.removeResource({ projectId: project.id, resourceId: button.dataset.removeResource, session });
      showToast('Recurso retirado.');
      renderDocuments(slot, project, session);
    }));
  } catch (error) {
    slot.innerHTML = tabError(error.message);
  }
}

async function renderTeam(slot, project, session) {
  slot.innerHTML = loadingTab('Cargando equipo...');
  try {
    const members = await ProjectService.listMembers({ projectId: project.id, session });
    const canManage = canManageProjectTeam(session, project.id, project.workspaceId);
    slot.innerHTML = `<article class="panel tab-panel"><div class="panel-header"><div><h2>Equipo del proyecto</h2><p>Responsables y nivel de dedicación.</p></div>${canManage ? `<button class="button button-secondary" id="add-member">${icon('userPlus')} Agregar miembro</button>` : ''}</div><div class="panel-body team-list">${members.length ? members.map(member => memberRow(member, canManage)).join('') : '<p class="muted-copy">No hay miembros asignados.</p>'}</div></article>`;
    slot.querySelector('#add-member')?.addEventListener('click', () => openMemberForm({ project, session, onSaved: () => renderTeam(slot, project, session) }));
    slot.querySelectorAll('[data-remove-member]').forEach(button => button.addEventListener('click', async () => {
      const confirmed = await confirmModal({ title: 'Retirar miembro', message: 'La persona dejará de estar asignada al proyecto.', confirmLabel: 'Retirar', danger: true });
      if (!confirmed) return;
      await ProjectService.removeMember({ projectId: project.id, memberId: button.dataset.removeMember, session });
      showToast('Miembro retirado.');
      renderTeam(slot, project, session);
    }));
  } catch (error) {
    slot.innerHTML = tabError(error.message);
  }
}

function renderSettings(slot, project, session) {
  const editable = canEditProject(session, project.id, project.workspaceId) && project.status !== 'archived';
  const archivable = canArchiveProject(session, project.workspaceId) && project.status !== 'archived';
  const restorable = canArchiveProject(session, project.workspaceId) && project.status === 'archived';
  const lifecycleAction = restorable
    ? `<div class="settings-row settings-restore"><div><strong>Restaurar proyecto</strong><small>Devuelve el proyecto a su estado previo al archivo y lo muestra nuevamente en el portafolio.</small></div><button class="button button-gold" id="settings-restore">${icon('refresh')} Restaurar</button></div>`
    : `<div class="settings-row settings-danger"><div><strong>Archivar proyecto</strong><small>Oculta el proyecto de la vista principal sin eliminar su historial.</small></div>${archivable ? `<button class="button button-danger" id="settings-archive">${icon('archive')} Archivar</button>` : '<span class="badge badge-gray">No disponible</span>'}</div>`;

  slot.innerHTML = `<article class="panel tab-panel"><div class="panel-header"><div><h2>Configuración del proyecto</h2><p>Acciones de administración y control.</p></div></div><div class="panel-body settings-list"><div class="settings-row"><div><strong>Editar información</strong><small>Actualiza el cliente, responsable, portada, fechas, estado y enlaces.</small></div>${editable ? `<button class="button button-secondary" id="settings-edit">${icon('edit')} Editar</button>` : '<span class="badge badge-gray">Solo lectura</span>'}</div>${lifecycleAction}</div></article>`;

  slot.querySelector('#settings-edit')?.addEventListener('click', () => openProjectForm({ session, workspaceId: project.workspaceId, project, onSaved: saved => { location.hash = `#/w/${saved.workspaceId}/p/${saved.id}/summary`; } }));
  slot.querySelector('#settings-archive')?.addEventListener('click', async () => {
    const confirmed = await confirmModal({ title: 'Archivar proyecto', message: `Se archivará <strong>${escapeHtml(project.name)}</strong>.`, confirmLabel: 'Archivar', danger: true });
    if (!confirmed) return;
    await ProjectService.archiveProject({ projectId: project.id, session });
    showToast('Proyecto archivado.');
    location.hash = `#/w/${project.workspaceId}/projects`;
  });
  slot.querySelector('#settings-restore')?.addEventListener('click', async () => {
    const confirmed = await confirmModal({ title: 'Restaurar proyecto', message: `Se restaurará <strong>${escapeHtml(project.name)}</strong> a su estado anterior.`, confirmLabel: 'Restaurar' });
    if (!confirmed) return;
    await ProjectService.restoreProject({ projectId: project.id, session });
    showToast('Proyecto restaurado.');
    location.hash = `#/w/${project.workspaceId}/p/${project.id}/summary`;
  });
}

function openResourceForm({ project, session, onSaved }) {
  const modal = openModal({
    title: 'Registrar recurso',
    subtitle: 'Vincula un documento, prototipo, repositorio o enlace externo.',
    body: `<form id="resource-form" class="project-form" novalidate><div class="form-grid form-grid-2"><label class="form-field"><span>Tipo</span><select class="select" name="type"><option value="document">Documento</option><option value="prototype">Prototipo</option><option value="github">GitHub</option><option value="website">Sitio web</option><option value="other">Otro</option></select></label><label class="form-field"><span>Visibilidad</span><select class="select" name="visibility"><option value="internal">Interno</option><option value="client">Cliente</option><option value="restricted">Restringido</option></select></label><label class="form-field form-span-2"><span>Nombre *</span><input class="input" name="name" maxlength="160"><small data-error-for="name"></small></label><label class="form-field form-span-2"><span>URL *</span><input class="input" type="url" name="url" placeholder="https://..."><small data-error-for="url"></small></label></div><div class="form-global-error hidden" id="resource-error"></div><div class="modal-actions"><button class="button button-secondary" type="button" data-modal-close>Cancelar</button><button class="button button-primary" id="resource-submit">Registrar</button></div></form>`,
    size: 'md', closeOnBackdrop: false
  });
  const form = modal.root.querySelector('#resource-form');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const raw = Object.fromEntries(new FormData(form).entries());
    const input = { type: normalizeText(raw.type, 30), visibility: normalizeText(raw.visibility, 30), name: normalizeText(raw.name, 160), url: normalizeUrl(raw.url) };
    form.querySelector('[data-error-for="name"]').textContent = input.name ? '' : 'Escribe un nombre.';
    form.querySelector('[data-error-for="url"]').textContent = input.url ? '' : 'Ingresa una URL válida con https://';
    if (!input.name || !input.url) return;
    try {
      await ProjectService.addResource({ projectId: project.id, input, session });
      modal.close(); showToast('Recurso registrado.'); await onSaved?.();
    } catch (error) {
      const slot = form.querySelector('#resource-error'); slot.textContent = error.message; slot.classList.remove('hidden');
    }
  });
}

async function openMemberForm({ project, session, onSaved }) {
  const users = await ProjectService.listUsers({ workspaceId: project.workspaceId, session });
  const allowQuickUserCreate = canCreateWorkspaceUser(session, project.workspaceId);
  const modal = openModal({
    title: 'Agregar miembro',
    subtitle: 'Asigna una persona y su nivel de participación.',
    body: `<form id="member-form" class="project-form" novalidate>
      <div class="form-grid form-grid-2">
        <div class="form-field form-field-quick-create">
          <div class="form-label-row"><label for="member-user-select">Persona</label>${allowQuickUserCreate ? '<button class="quick-create-trigger" type="button" id="open-quick-user" aria-controls="quick-user-panel" aria-expanded="false">+ Nueva persona</button>' : ''}</div>
          <select class="select" name="userId" id="member-user-select" required>${users.length ? users.map(user => `<option value="${user.id}">${escapeHtml(user.name)}</option>`).join('') : '<option value="">Sin personas disponibles</option>'}</select>
          ${allowQuickUserCreate ? `<section class="quick-create-panel" id="quick-user-panel" aria-label="Registrar nueva persona" hidden>
            <div class="quick-create-heading"><div><strong>Nueva persona</strong><span>Se registrará en el workspace y quedará seleccionada.</span></div></div>
            <div class="quick-create-grid quick-create-grid-single">
              <label><span>Nombre completo *</span><input class="input" id="quick-user-name" maxlength="120" autocomplete="name"></label>
              <label><span>Correo *</span><input class="input" id="quick-user-email" type="email" maxlength="254" autocomplete="email"></label>
            </div>
            <div class="quick-create-error hidden" id="quick-user-error" role="alert"></div>
            <div class="quick-create-actions"><button class="button button-secondary button-compact" type="button" id="cancel-quick-user">Cancelar</button><button class="button button-primary button-compact" type="button" id="save-quick-user">Guardar y seleccionar</button></div>
          </section>` : ''}
        </div>
        <label class="form-field"><span>Rol</span><select class="select" name="role"><option value="project_lead">Líder</option><option value="collaborator" selected>Colaborador</option><option value="reviewer">Revisor</option></select></label>
        <label class="form-field form-span-2"><span>Dedicación estimada (%)</span><input class="input" type="number" name="allocation" min="0" max="100" value="20"></label>
      </div>
      <div class="form-global-error hidden" id="member-error" role="alert"></div>
      <div class="modal-actions"><button class="button button-secondary" type="button" data-modal-close>Cancelar</button><button class="button button-primary" type="submit" id="member-submit">Asignar</button></div>
    </form>`,
    size: 'sm', closeOnBackdrop: false
  });

  const form = modal.root.querySelector('#member-form');
  const userSelect = form.querySelector('#member-user-select');
  const quickUserTrigger = form.querySelector('#open-quick-user');
  const quickUserPanel = form.querySelector('#quick-user-panel');
  const quickUserName = form.querySelector('#quick-user-name');
  const quickUserEmail = form.querySelector('#quick-user-email');
  const quickUserError = form.querySelector('#quick-user-error');
  const quickUserSave = form.querySelector('#save-quick-user');

  function closeQuickUserPanel({ clear = false } = {}) {
    if (!quickUserPanel) return;
    quickUserPanel.hidden = true;
    quickUserTrigger?.setAttribute('aria-expanded', 'false');
    if (clear) {
      if (quickUserName) quickUserName.value = '';
      if (quickUserEmail) quickUserEmail.value = '';
      quickUserError?.classList.add('hidden');
      if (quickUserError) quickUserError.textContent = '';
    }
  }

  quickUserTrigger?.addEventListener('click', () => {
    if (!quickUserPanel) return;
    const opening = quickUserPanel.hidden;
    quickUserPanel.hidden = !opening;
    quickUserTrigger.setAttribute('aria-expanded', String(opening));
    if (opening) requestAnimationFrame(() => quickUserName?.focus());
  });
  form.querySelector('#cancel-quick-user')?.addEventListener('click', () => closeQuickUserPanel({ clear: true }));
  quickUserPanel?.addEventListener('keydown', event => {
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
    event.preventDefault();
    quickUserSave?.click();
  });
  quickUserSave?.addEventListener('click', async () => {
    const input = {
      workspaceId: project.workspaceId,
      name: normalizeText(quickUserName?.value, 120),
      email: normalizeText(quickUserEmail?.value, 254).toLowerCase()
    };
    let message = '';
    if (input.name.length < 2) message = 'Escribe el nombre de la persona.';
    else if (!input.email || !isValidEmail(input.email)) message = 'Escribe un correo válido.';
    if (message) {
      quickUserError.textContent = message;
      quickUserError.classList.remove('hidden');
      (input.name.length < 2 ? quickUserName : quickUserEmail)?.focus();
      return;
    }
    quickUserSave.disabled = true;
    quickUserSave.innerHTML = '<span class="spinner"></span> Guardando...';
    quickUserError.classList.add('hidden');
    try {
      const created = await ProjectService.createUser({ input, session });
      const option = document.createElement('option');
      option.value = created.id;
      option.textContent = created.name;
      option.selected = true;
      userSelect.appendChild(option);
      userSelect.disabled = false;
      closeQuickUserPanel({ clear: true });
      showToast('Persona creada y seleccionada.');
    } catch (error) {
      quickUserError.textContent = error.message || 'No se pudo registrar la persona.';
      quickUserError.classList.remove('hidden');
    } finally {
      quickUserSave.disabled = false;
      quickUserSave.textContent = 'Guardar y seleccionar';
    }
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const raw = Object.fromEntries(new FormData(form).entries());
    const errorSlot = form.querySelector('#member-error');
    if (!raw.userId) {
      errorSlot.textContent = 'Selecciona o registra una persona.';
      errorSlot.classList.remove('hidden');
      userSelect.focus();
      return;
    }
    const submit = form.querySelector('#member-submit');
    submit.disabled = true;
    submit.innerHTML = '<span class="spinner"></span> Asignando...';
    try {
      await ProjectService.assignMember({ projectId: project.id, input: { userId: raw.userId, role: raw.role, allocation: Math.min(100, Math.max(0, Number(raw.allocation || 0))) }, session });
      modal.close(); showToast('Miembro asignado.'); await onSaved?.();
    } catch (error) {
      errorSlot.textContent = error.message;
      errorSlot.classList.remove('hidden');
      submit.disabled = false;
      submit.textContent = 'Asignar';
    }
  });
}

function showDriveStructure(structure) {
  openModal({
    title: structure.mode === 'mock' ? 'Estructura documental simulada' : 'Estructura creada en Google Drive',
    subtitle: structure.folderName || 'Carpeta del proyecto',
    body: `<div class="drive-tree"><strong>${escapeHtml(structure.folderName || 'Proyecto')}</strong>${(structure.folders || []).map(folder => `<span>${icon('folder')} ${escapeHtml(folder)}</span>`).join('')}</div>${structure.folderUrl ? `<div class="modal-actions"><a class="button button-primary" href="${escapeHtml(structure.folderUrl)}" target="_blank" rel="noopener">${icon('external')} Abrir en Drive</a></div>` : '<p class="modal-note">En modo demo no se crea una carpeta real. Al activar Apps Script esta misma acción trabajará en Google Drive.</p>'}`,
    size: 'md'
  });
}

function linkButton(label, url, iconName) {
  return url ? `<a class="button button-secondary" href="${escapeHtml(url)}" target="_blank" rel="noopener">${icon(iconName)} ${label}</a>` : '';
}

function resourceRow(resource, canManage) {
  return `<div class="resource-row"><span class="resource-icon">${icon(resource.type === 'github' ? 'briefcase' : resource.type === 'prototype' ? 'layers' : 'file')}</span><div class="list-copy"><strong>${escapeHtml(resource.name)}</strong><small>${escapeHtml(resource.type)} · ${escapeHtml(resource.visibility)}</small></div><a class="icon-button" href="${escapeHtml(resource.url)}" target="_blank" rel="noopener" aria-label="Abrir">${icon('external')}</a>${canManage ? `<button class="icon-button icon-button-danger" data-remove-resource="${resource.id}" aria-label="Retirar">${icon('trash')}</button>` : ''}</div>`;
}

function memberRow(member, canManage) {
  return `<div class="team-row"><span class="team-avatar">${escapeHtml(member.user.initials || member.user.name.slice(0, 2).toUpperCase())}</span><div class="list-copy"><strong>${escapeHtml(member.user.name)}</strong><small>${escapeHtml(member.role)} · ${Number(member.allocation || 0)}% de dedicación</small></div>${canManage ? `<button class="icon-button icon-button-danger" data-remove-member="${member.id}" aria-label="Retirar">${icon('trash')}</button>` : ''}</div>`;
}

function loadingTab(text) {
  return `<div class="loading-panel tab-panel"><span class="spinner spinner-blue"></span><p>${text}</p></div>`;
}

function tabError(message) {
  return `<div class="empty-state tab-panel"><div class="empty-state-icon">${icon('alert')}</div><h2>No se pudo cargar la sección</h2><p>${escapeHtml(message)}</p></div>`;
}
