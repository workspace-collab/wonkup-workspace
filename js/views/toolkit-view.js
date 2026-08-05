import { CanvasService } from '../services/canvas-service.js?v=9.0.5';
import { ProjectService } from '../services/project-service.js?v=9.0.5';
import { canvasTemplates } from '../../data/canvas-templates.js?v=9.0.5';
import { canEditCanvas, canManageCanvas } from '../utils/permissions.js?v=9.0.5';
import { icon } from '../utils/icons.js?v=9.0.5';
import { escapeHtml, formatDate } from '../utils/format.js?v=9.0.5';
import { openModal, confirmModal } from '../components/modal.js?v=9.0.5';
import { showToast } from '../components/toast.js?v=9.0.5';
import { calculateCanvasProgress } from '../utils/canvas-progress.js?v=9.0.5';

let unsubscribeToolkit = null;
let toolkitGeneration = 0;

export async function renderToolkit(container, workspaceId, projectId = null, embedded = false, session = null) {
  const generation = ++toolkitGeneration;
  unsubscribeToolkit?.();
  unsubscribeToolkit = null;
  container.innerHTML = `<section class="${embedded ? 'toolkit-embedded' : 'page'}" ${embedded ? '' : 'aria-labelledby="toolkit-title"'}>
    ${embedded ? '' : `<div class="page-header"><div><span class="page-kicker">Innovación aplicada</span><h1 id="toolkit-title">Innovation Toolkit</h1><p>Comprende, valida, prioriza y presenta proyectos mediante un motor común de canvases.</p></div><div class="page-header-actions">${canEditCanvas(session) ? `<button class="button button-primary" id="new-canvas">${icon('plus')} Nuevo canvas</button>` : ''}</div></div>`}
    <div class="panel toolkit-loading"><div class="panel-body"><span class="spinner"></span> Cargando herramientas y canvases...</div></div>
  </section>`;

  try {
    const [instances, projects] = await Promise.all([
      CanvasService.listInstances({ workspaceId, projectId, session, includeArchived: canManageCanvas(session) }),
      ProjectService.listProjects({ workspaceId, session, includeArchived: false })
    ]);
    if (generation !== toolkitGeneration || !container.isConnected) return;
    renderToolkitContent(container, { workspaceId, projectId, embedded, session, instances, projects });
    unsubscribeToolkit = CanvasService.subscribe(event => {
      if (generation !== toolkitGeneration || !container.isConnected) return;
      if (!String(event.action || '').startsWith('canvas') && !String(event.action || '').startsWith('note')) return;
      renderToolkit(container, workspaceId, projectId, embedded, session);
    });
  } catch (error) {
    if (generation !== toolkitGeneration || !container.isConnected) return;
    const loading = container.querySelector('.toolkit-loading');
    if (!loading) return;
    loading.innerHTML = `<div class="empty-state"><div class="empty-state-icon">${icon('alert')}</div><h2>No se pudo cargar el Toolkit</h2><p>${escapeHtml(error.message || 'Ocurrió un error inesperado.')}</p></div>`;
  }
}

function renderToolkitContent(container, context) {
  const { workspaceId, projectId, embedded, session, instances, projects } = context;
  const root = container.querySelector(embedded ? '.toolkit-embedded' : '.page');
  const activeInstances = instances.filter(item => item.status !== 'archived');
  const archivedInstances = instances.filter(item => item.status === 'archived');
  const projectMap = Object.fromEntries(projects.map(project => [project.id, project]));

  root.innerHTML = `
    ${embedded ? `<div class="toolkit-embedded-head"><div><h2>Innovation Toolkit</h2><p>Canvases vinculados a este proyecto.</p></div>${canEditCanvas(session) ? `<button class="button button-primary" id="new-canvas">${icon('plus')} Nuevo canvas</button>` : ''}</div>` : root.querySelector('.page-header')?.outerHTML || ''}

    <section class="toolkit-section" aria-labelledby="canvas-instances-title">
      <div class="section-heading"><div><h2 id="canvas-instances-title">Canvases del proyecto</h2><p>${activeInstances.length} activo${activeInstances.length === 1 ? '' : 's'}${archivedInstances.length ? ` · ${archivedInstances.length} archivado${archivedInstances.length === 1 ? '' : 's'}` : ''}</p></div>${session?.role === 'superadmin' && !embedded ? `<button class="button button-ghost" id="reset-canvases">${icon('refresh')} Restablecer demo</button>` : ''}</div>
      ${activeInstances.length ? `<div class="canvas-instance-grid">${activeInstances.map(instance => instanceCard(instance, projectMap[instance.projectId], session)).join('')}</div>` : `<div class="empty-state compact-empty"><div class="empty-state-icon">${icon('lightbulb')}</div><h2>Aún no hay canvases</h2><p>Crea una instancia a partir de una de las plantillas metodológicas.</p>${canEditCanvas(session) ? `<button class="button button-primary" id="empty-new-canvas">${icon('plus')} Crear primer canvas</button>` : ''}</div>`}
    </section>

    <section class="toolkit-section" aria-labelledby="canvas-templates-title">
      <div class="section-heading"><div><h2 id="canvas-templates-title">Plantillas metodológicas</h2><p>Un mismo Canvas Engine, seis herramientas especializadas.</p></div></div>
      <div class="toolkit-grid">${canvasTemplates.map(template => templateCard(template, canEditCanvas(session))).join('')}</div>
    </section>

    ${archivedInstances.length ? `<details class="panel archived-canvases"><summary>Canvases archivados (${archivedInstances.length})</summary><div class="panel-body canvas-instance-grid">${archivedInstances.map(instance => archivedCard(instance, projectMap[instance.projectId], session)).join('')}</div></details>` : ''}
  `;

  const create = templateId => openCreateCanvas({ workspaceId, projectId, projects, templateId, session, onCreated: instance => { location.hash = canvasHref(instance); } });
  root.querySelector('#new-canvas')?.addEventListener('click', () => create(''));
  if (sessionStorage.getItem('wonkup.intent.newCanvas') === '1' && canEditCanvas(session)) {
    sessionStorage.removeItem('wonkup.intent.newCanvas');
    requestAnimationFrame(() => create(''));
  }
  root.querySelector('#empty-new-canvas')?.addEventListener('click', () => create(''));
  root.querySelectorAll('[data-create-template]').forEach(button => button.addEventListener('click', () => create(button.dataset.createTemplate)));
  root.querySelectorAll('[data-restore-canvas]').forEach(button => button.addEventListener('click', async () => {
    try {
      await CanvasService.restoreInstance({ canvasId: button.dataset.restoreCanvas, session });
      showToast('Canvas restaurado.');
      renderToolkit(container, workspaceId, projectId, embedded, session);
    } catch (error) { showToast(error.message, { type: 'error' }); }
  }));
  root.querySelectorAll('[data-delete-canvas]').forEach(button => button.addEventListener('click', async () => {
    const confirmed = await confirmModal({ title: 'Eliminar canvas definitivamente', message: 'Esta acción elimina notas, comentarios e historial y no se puede deshacer.', confirmLabel: 'Eliminar', danger: true });
    if (!confirmed) return;
    try {
      await CanvasService.deleteInstance({ canvasId: button.dataset.deleteCanvas, session });
      showToast('Canvas eliminado.');
      renderToolkit(container, workspaceId, projectId, embedded, session);
    } catch (error) { showToast(error.message, { type: 'error' }); }
  }));
  root.querySelector('#reset-canvases')?.addEventListener('click', async () => {
    const confirmed = await confirmModal({ title: 'Restablecer canvases demo', message: 'Se reemplazarán los canvases locales por los datos demostrativos iniciales.', confirmLabel: 'Restablecer', danger: true });
    if (!confirmed) return;
    try { await CanvasService.resetDemo({ session }); showToast('Canvases demo restablecidos.'); renderToolkit(container, workspaceId, projectId, embedded, session); }
    catch (error) { showToast(error.message, { type: 'error' }); }
  });
}

function instanceCard(instance, project, session) {
  const template = instance.template;
  const progress = calculateCanvasProgress(instance);
  return `<article class="canvas-instance-card" style="--canvas-accent:${escapeHtml(template?.color || '#50a8f3')}">
    <div class="canvas-instance-top"><span class="canvas-template-icon">${icon(template?.icon || 'lightbulb')}</span><span class="status-badge status-active">Activo</span></div>
    <h3>${escapeHtml(instance.title)}</h3>
    <p>${escapeHtml(template?.name || 'Canvas')} · ${escapeHtml(project?.name || 'Proyecto')}</p>
    <div class="canvas-instance-progress"><span><strong>${instance.notes.length}</strong> notas</span><span><strong>${progress}%</strong> avance</span></div>
    <div class="progress-track"><div class="progress-bar" style="width:${progress}%"></div></div>
    <div class="canvas-instance-footer"><span>Actualizado ${relativeTime(instance.updatedAt)}</span><a class="button button-secondary" href="${canvasHref(instance)}">Abrir</a></div>
  </article>`;
}

function archivedCard(instance, project, session) {
  return `<article class="canvas-instance-card canvas-archived"><div class="canvas-instance-top"><span class="canvas-template-icon">${icon(instance.template?.icon || 'archive')}</span><span class="status-badge">Archivado</span></div><h3>${escapeHtml(instance.title)}</h3><p>${escapeHtml(project?.name || 'Proyecto')} · ${formatDate(instance.archivedAt)}</p><div class="canvas-instance-footer"><button class="button button-secondary" data-restore-canvas="${escapeHtml(instance.id)}">${icon('restore')} Restaurar</button>${session?.role === 'superadmin' || session?.role === 'workspace_admin' ? `<button class="button button-danger" data-delete-canvas="${escapeHtml(instance.id)}">${icon('trash')} Eliminar</button>` : ''}</div></article>`;
}

function templateCard(template, editable) {
  return `<article class="tool-card canvas-template-card" style="--template-color:${escapeHtml(template.color)}"><div class="tool-icon">${icon(template.icon)}</div><span class="template-category">${escapeHtml(template.category)}</span><h2>${escapeHtml(template.name)}</h2><p>${escapeHtml(template.description)}</p><div class="tool-meta"><span>${template.sections.length} secciones</span><span>${templateLayoutLabel(template)}</span></div>${editable ? `<button class="button button-secondary" data-create-template="${escapeHtml(template.id)}">Usar plantilla</button>` : ''}</article>`;
}


function templateLayoutLabel(template) {
  const labels = {
    'business-model': '9 bloques',
    lean: '9 bloques',
    empathy: '2 columnas',
    'value-proposition': '2 paneles',
    prioritization: '4 cuadrantes',
    generic: `${template.columns || 3} columnas`
  };
  return labels[template.layout] || `${template.columns || 3} columnas`;
}

function openCreateCanvas({ workspaceId, projectId, projects, templateId, session, onCreated }) {
  const availableProjects = projectId ? projects.filter(project => project.id === projectId) : projects;
  if (!availableProjects.length) { showToast('No hay proyectos disponibles para crear un canvas.', { type: 'error' }); return; }
  const selectedTemplate = canvasTemplates.find(template => template.id === templateId) || canvasTemplates[0];
  const modal = openModal({
    title: 'Nuevo canvas',
    subtitle: 'Crea una instancia metodológica vinculada a un proyecto.',
    size: 'md',
    initialFocus: '#canvas-project',
    body: `<form id="canvas-create-form" class="form-grid" novalidate>
      <div class="field field-full"><label for="canvas-project">Proyecto *</label><select class="select" id="canvas-project" required aria-required="true">${availableProjects.map(project => `<option value="${escapeHtml(project.id)}" data-workspace="${escapeHtml(project.workspaceId)}" ${project.id === projectId ? 'selected' : ''}>${escapeHtml(project.name)} · ${escapeHtml(project.code)}</option>`).join('')}</select><small class="field-error" id="canvas-project-error"></small></div>
      <div class="field field-full"><label for="canvas-template">Plantilla *</label><select class="select" id="canvas-template" required aria-required="true">${canvasTemplates.map(template => `<option value="${escapeHtml(template.id)}" ${template.id === selectedTemplate.id ? 'selected' : ''}>${escapeHtml(template.name)}</option>`).join('')}</select></div>
      <div class="field field-full"><label for="canvas-title">Título *</label><input class="input" id="canvas-title" maxlength="140" required aria-required="true" value="${escapeHtml(selectedTemplate.name)}"><small class="field-help">Ejemplo: Mapa de Empatía · Familias usuarias</small><small class="field-error" id="canvas-title-error"></small></div>
      <div class="modal-actions field-full"><button class="button button-secondary" type="button" data-modal-close>Cancelar</button><button class="button button-primary" type="submit">${icon('plus')} Crear canvas</button></div>
    </form>`
  });
  const form = modal.root.querySelector('#canvas-create-form');
  const templateSelect = modal.root.querySelector('#canvas-template');
  const titleInput = modal.root.querySelector('#canvas-title');
  let titleTouched = false;
  titleInput.addEventListener('input', () => { titleTouched = true; });
  templateSelect.addEventListener('change', () => {
    if (titleTouched) return;
    const template = canvasTemplates.find(item => item.id === templateSelect.value);
    titleInput.value = template?.name || '';
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const projectSelect = modal.root.querySelector('#canvas-project');
    const title = titleInput.value.trim();
    titleInput.setAttribute('aria-invalid', String(!title));
    if (!title) { modal.root.querySelector('#canvas-title-error').textContent = 'Escribe un título.'; titleInput.focus(); return; }
    const option = projectSelect.selectedOptions[0];
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    submit.innerHTML = '<span class="spinner"></span> Creando...';
    try {
      const instance = await CanvasService.createInstance({ workspaceId: option.dataset.workspace, projectId: projectSelect.value, templateId: templateSelect.value, title, session });
      modal.close();
      showToast('Canvas creado correctamente.');
      onCreated?.(instance);
    } catch (error) {
      showToast(error.message, { type: 'error' });
      submit.disabled = false;
      submit.innerHTML = `${icon('plus')} Crear canvas`;
    }
  });
}

function canvasHref(instance) {
  return `#/w/${encodeURIComponent(instance.workspaceId)}/p/${encodeURIComponent(instance.projectId)}/canvas/${encodeURIComponent(instance.id)}`;
}


export function cleanupToolkitView() {
  toolkitGeneration += 1;
  unsubscribeToolkit?.();
  unsubscribeToolkit = null;
}

function relativeTime(value) {
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'ahora';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}
