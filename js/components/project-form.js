import { DemoService } from '../services/demo-service.js';
import { ProjectService } from '../services/project-service.js';
import { getState } from '../state/store.js';
import { escapeHtml } from '../utils/format.js';
import { normalizeAssetUrl, normalizeProjectInput, normalizeUrl, validateProjectInput } from '../utils/validation.js';
import { openModal } from './modal.js';
import { showToast } from './toast.js';

const STATUS_OPTIONS = [
  ['draft', 'Borrador'],
  ['planned', 'Planeamiento'],
  ['active', 'Activo'],
  ['pending_client', 'Esperando cliente'],
  ['on_hold', 'En pausa'],
  ['blocked', 'Bloqueado'],
  ['completed', 'Completado']
];

const STAGE_OPTIONS = [
  ['discovery', 'Descubrimiento'],
  ['definition', 'Definición'],
  ['planning', 'Planificación'],
  ['ux_ui', 'UX/UI'],
  ['development', 'Desarrollo'],
  ['validation', 'Validación'],
  ['launch', 'Lanzamiento'],
  ['closing', 'Cierre']
];

const PRIORITY_OPTIONS = [
  ['low', 'Baja'],
  ['medium', 'Media'],
  ['high', 'Alta'],
  ['critical', 'Crítica']
];

function options(items, selected) {
  return items.map(([value, label]) => `<option value="${value}" ${value === selected ? 'selected' : ''}>${label}</option>`).join('');
}

function fieldError(form, name, message = '') {
  const slot = form.querySelector(`[data-error-for="${name}"]`);
  if (slot) slot.textContent = message;
  form.querySelector(`[name="${name}"]`)?.classList.toggle('field-invalid', Boolean(message));
}

function readForm(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function projectFormHtml({ project, workspaces, defaultWorkspaceId }) {
  const value = (key, fallback = '') => escapeHtml(project?.[key] ?? fallback);
  return `<form id="project-form" class="project-form" novalidate>
    <div class="form-section">
      <div class="form-section-title"><strong>Información principal</strong><span>Datos que identifican el proyecto.</span></div>
      <div class="form-grid form-grid-2">
        <label class="form-field"><span>Workspace *</span><select class="select" name="workspaceId" ${project ? 'disabled' : ''}>${workspaces.map(workspace => `<option value="${workspace.id}" ${workspace.id === (project?.workspaceId || defaultWorkspaceId) ? 'selected' : ''}>${escapeHtml(workspace.name)}</option>`).join('')}</select><small data-error-for="workspaceId"></small></label>
        <label class="form-field"><span>Cliente</span><select class="select" name="clientId" id="project-client-select"><option value="">Sin cliente</option></select><small data-error-for="clientId"></small></label>
        <label class="form-field form-span-2"><span>Nombre del proyecto *</span><input class="input" name="name" maxlength="120" value="${value('name')}" placeholder="Ej. Plataforma de reservas"><small data-error-for="name"></small></label>
        <label class="form-field form-span-2"><span>Frase breve</span><input class="input" name="tagline" maxlength="180" value="${value('tagline')}" placeholder="Describe el proyecto en una frase"><small data-error-for="tagline"></small></label>
        <label class="form-field form-span-2"><span>Descripción</span><textarea class="textarea" name="description" rows="4" maxlength="2000" placeholder="Objetivo, alcance y resultado esperado">${value('description')}</textarea><small data-error-for="description"></small></label>
      </div>
    </div>

    <div class="form-section">
      <div class="form-section-title"><strong>Gestión</strong><span>Responsable, etapa, prioridad y fechas.</span></div>
      <div class="form-grid form-grid-3">
        <label class="form-field"><span>Responsable *</span><select class="select" name="ownerUserId" id="project-owner-select"><option value="">Selecciona</option></select><small data-error-for="ownerUserId"></small></label>
        <label class="form-field"><span>Estado</span><select class="select" name="status">${options(STATUS_OPTIONS, project?.status || 'planned')}</select><small data-error-for="status"></small></label>
        <label class="form-field"><span>Etapa</span><select class="select" name="stage">${options(STAGE_OPTIONS, project?.stage || 'definition')}</select><small data-error-for="stage"></small></label>
        <label class="form-field"><span>Prioridad</span><select class="select" name="priority">${options(PRIORITY_OPTIONS, project?.priority || 'medium')}</select><small data-error-for="priority"></small></label>
        <label class="form-field"><span>Inicio</span><input class="input" type="date" name="startDate" value="${value('startDate')}"><small data-error-for="startDate"></small></label>
        <label class="form-field"><span>Entrega estimada</span><input class="input" type="date" name="dueDate" value="${value('dueDate')}"><small data-error-for="dueDate"></small></label>
        <label class="form-field"><span>Progreso</span><input class="input" type="number" min="0" max="100" name="progress" value="${value('progress', 0)}"><small data-error-for="progress"></small></label>
        <label class="form-field"><span>Presupuesto demo (S/)</span><input class="input" type="number" min="0" step="0.01" name="budget" value="${value('budget', 0)}"><small data-error-for="budget"></small></label>
      </div>
    </div>

    <div class="form-section">
      <div class="form-section-title"><strong>Identidad visual y enlaces</strong><span>Logo y portada aceptan URL o ruta assets/...; los demás enlaces usan http o https.</span></div>
      <div class="form-grid form-grid-2">
        <label class="form-field"><span>Logo</span><input class="input" type="url" name="logo" value="${value('logo')}" placeholder="https://... o assets/projects/logo.png"><small data-error-for="logo"></small></label>
        <label class="form-field"><span>Portada horizontal</span><input class="input" type="url" name="coverImage" value="${value('coverImage')}" placeholder="https://... o assets/projects/portada.webp"><small data-error-for="coverImage"></small></label>
        <label class="form-field"><span>Color de marca</span><div class="color-input-row"><input class="color-input" type="color" name="brandColor" value="${value('brandColor', '#50a8f3')}"><code>${value('brandColor', '#50a8f3')}</code></div><small data-error-for="brandColor"></small></label>
        <label class="form-field"><span>GitHub</span><input class="input" type="url" name="githubUrl" value="${value('githubUrl')}" placeholder="https://github.com/..."><small data-error-for="githubUrl"></small></label>
        <label class="form-field"><span>Figma</span><input class="input" type="url" name="figmaUrl" value="${value('figmaUrl')}" placeholder="https://figma.com/..."><small data-error-for="figmaUrl"></small></label>
        <label class="form-field"><span>Hosting</span><input class="input" type="url" name="hostingUrl" value="${value('hostingUrl')}" placeholder="https://..."><small data-error-for="hostingUrl"></small></label>
        <label class="form-field form-span-2"><span>Dominio</span><input class="input" name="domain" maxlength="180" value="${value('domain')}" placeholder="ejemplo.com"><small data-error-for="domain"></small></label>
      </div>
    </div>

    ${project ? '' : `<label class="check-field"><input type="checkbox" name="createDrive" value="yes"><span><strong>Crear estructura documental</strong><small>En modo demo se genera una estructura simulada. Con Apps Script se crearán carpetas reales.</small></span></label>`}

    <div class="form-global-error hidden" id="project-form-error"></div>
    <div class="modal-actions"><button class="button button-secondary" type="button" data-modal-close>Cancelar</button><button class="button button-primary" type="submit" id="project-submit">${project ? 'Guardar cambios' : 'Crear proyecto'}</button></div>
  </form>`;
}

export async function openProjectForm({ session = getState().session, workspaceId = null, project = null, onSaved = null } = {}) {
  const availableWorkspaces = DemoService.getWorkspacesForSession(session).filter(item => item.status === 'active');
  const defaultWorkspaceId = project?.workspaceId || (workspaceId && workspaceId !== 'all' ? workspaceId : availableWorkspaces[0]?.id);
  const modal = openModal({
    title: project ? 'Editar proyecto' : 'Nuevo proyecto',
    subtitle: project ? `${project.code} · Los cambios se guardan en la fuente activa.` : 'Crea la ficha y, opcionalmente, su estructura documental.',
    body: projectFormHtml({ project, workspaces: availableWorkspaces, defaultWorkspaceId }),
    size: 'lg',
    closeOnBackdrop: false
  });

  const form = modal.root.querySelector('#project-form');
  const clientSelect = form.querySelector('#project-client-select');
  const ownerSelect = form.querySelector('#project-owner-select');
  const workspaceSelect = form.querySelector('[name="workspaceId"]');
  const submit = form.querySelector('#project-submit');
  const brandColorInput = form.querySelector('[name="brandColor"]');
  const brandColorCode = brandColorInput?.closest('.color-input-row')?.querySelector('code');
  brandColorInput?.addEventListener('input', event => { if (brandColorCode) brandColorCode.textContent = event.target.value; });

  async function loadRelations(nextWorkspaceId) {
    clientSelect.disabled = true;
    ownerSelect.disabled = true;
    const [clients, users] = await Promise.all([
      ProjectService.listClients({ workspaceId: nextWorkspaceId, session }),
      ProjectService.listUsers({ workspaceId: nextWorkspaceId, session })
    ]);
    clientSelect.innerHTML = `<option value="">Sin cliente</option>${clients.map(client => `<option value="${client.id}" ${client.id === project?.clientId ? 'selected' : ''}>${escapeHtml(client.name)}</option>`).join('')}`;
    ownerSelect.innerHTML = `<option value="">Selecciona</option>${users.map(user => `<option value="${user.id}" ${user.id === project?.ownerUserId ? 'selected' : ''}>${escapeHtml(user.name)}</option>`).join('')}`;
    clientSelect.disabled = false;
    ownerSelect.disabled = false;
  }

  try {
    await loadRelations(defaultWorkspaceId);
  } catch (error) {
    form.querySelector('#project-form-error').textContent = error.message;
    form.querySelector('#project-form-error').classList.remove('hidden');
  }

  workspaceSelect?.addEventListener('change', event => loadRelations(event.target.value));

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const raw = readForm(form);
    if (project) raw.workspaceId = project.workspaceId;
    const input = normalizeProjectInput(raw);
    const errors = validateProjectInput(input);

    if (raw.logo && !normalizeAssetUrl(raw.logo)) errors.logo = 'Usa una URL válida o una ruta assets/...';
    if (raw.coverImage && !normalizeAssetUrl(raw.coverImage)) errors.coverImage = 'Usa una URL válida o una ruta assets/...';
    ['githubUrl', 'figmaUrl', 'hostingUrl'].forEach(name => {
      if (raw[name] && !normalizeUrl(raw[name])) errors[name] = 'Ingresa una URL válida con https://';
    });

    form.querySelectorAll('[data-error-for]').forEach(slot => { slot.textContent = ''; });
    form.querySelectorAll('.field-invalid').forEach(field => field.classList.remove('field-invalid'));
    Object.entries(errors).forEach(([name, message]) => fieldError(form, name, message));
    if (Object.keys(errors).length) return;

    submit.disabled = true;
    submit.innerHTML = '<span class="spinner"></span> Guardando...';
    const globalError = form.querySelector('#project-form-error');
    globalError.classList.add('hidden');

    try {
      const saved = project
        ? await ProjectService.updateProject({ projectId: project.id, patch: input, session })
        : await ProjectService.createProject({ input, session });

      if (!project && raw.createDrive === 'yes') {
        await ProjectService.createDriveStructure({ projectId: saved.id, session });
      }

      modal.close();
      showToast(project ? 'Proyecto actualizado correctamente.' : 'Proyecto creado correctamente.');
      await onSaved?.(saved);
    } catch (error) {
      globalError.textContent = error.message || 'No se pudo guardar el proyecto.';
      globalError.classList.remove('hidden');
      submit.disabled = false;
      submit.textContent = project ? 'Guardar cambios' : 'Crear proyecto';
    }
  });

  return modal;
}
