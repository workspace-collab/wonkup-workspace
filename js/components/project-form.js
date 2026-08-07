import { DemoService } from '../services/demo-service.js?v=12.3.0';
import { ProjectService } from '../services/project-service.js?v=12.3.0';
import { getState } from '../state/store.js?v=12.3.0';
import { escapeHtml } from '../utils/format.js?v=12.3.0';
import { isValidEmail, normalizeAssetUrl, normalizeProjectInput, normalizeText, normalizeUrl, validateProjectInput } from '../utils/validation.js?v=12.3.0';
import { canManageClients } from '../utils/permissions.js?v=12.3.0';
import { openModal } from './modal.js?v=12.3.0';
import { showToast } from './toast.js?v=12.3.0';

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
  const field = form.querySelector(`[name="${name}"]`);
  if (!field) return;
  field.classList.toggle('field-invalid', Boolean(message));
  field.setAttribute('aria-invalid', message ? 'true' : 'false');
  const errorId = slot?.id;
  if (errorId) field.setAttribute('aria-describedby', errorId);
}

function readForm(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function projectFormHtml({ project, workspaces, defaultWorkspaceId, allowQuickClientCreate }) {
  const value = (key, fallback = '') => escapeHtml(project?.[key] ?? fallback);
  return `<form id="project-form" class="project-form" novalidate>
    <div class="form-section">
      <div class="form-section-title"><strong>Información principal</strong><span>Datos que identifican el proyecto.</span></div>
      <div class="form-grid form-grid-2">
        <label class="form-field"><span>Workspace *</span><select class="select" id="project-workspace" name="workspaceId" required aria-required="true" aria-describedby="project-workspace-error" ${project ? 'disabled' : ''}>${workspaces.map(workspace => `<option value="${workspace.id}" ${workspace.id === (project?.workspaceId || defaultWorkspaceId) ? 'selected' : ''}>${escapeHtml(workspace.name)}</option>`).join('')}</select><small id="project-workspace-error" data-error-for="workspaceId"></small></label>
        <div class="form-field form-field-quick-create">
          <div class="form-label-row"><label for="project-client-select">Cliente</label>${allowQuickClientCreate ? '<button class="quick-create-trigger" type="button" id="open-quick-client" aria-controls="quick-client-panel" aria-expanded="false">+ Nuevo cliente</button>' : ''}</div>
          <select class="select" name="clientId" id="project-client-select"><option value="">Sin cliente</option></select>
          <small data-error-for="clientId"></small>
          ${allowQuickClientCreate ? `<section class="quick-create-panel" id="quick-client-panel" aria-label="Registrar nuevo cliente" hidden>
            <div class="quick-create-heading"><div><strong>Nuevo cliente</strong><span>Se guardará y quedará seleccionado en este proyecto.</span></div></div>
            <div class="quick-create-grid">
              <label><span>Nombre *</span><input class="input" id="quick-client-name" maxlength="120" autocomplete="organization"></label>
              <label><span>Contacto principal</span><input class="input" id="quick-client-contact" maxlength="120" autocomplete="name"></label>
              <label><span>Correo</span><input class="input" id="quick-client-email" type="email" maxlength="254" autocomplete="email"></label>
              <label><span>Teléfono</span><input class="input" id="quick-client-phone" maxlength="40" autocomplete="tel"></label>
            </div>
            <div class="quick-create-error hidden" id="quick-client-error" role="alert"></div>
            <div class="quick-create-actions"><button class="button button-secondary button-compact" type="button" id="cancel-quick-client">Cancelar</button><button class="button button-primary button-compact" type="button" id="save-quick-client">Guardar y seleccionar</button></div>
          </section>` : ''}
        </div>
        <label class="form-field form-span-2"><span>Nombre del proyecto *</span><input class="input" id="project-name" name="name" maxlength="120" required aria-required="true" aria-describedby="project-name-error" value="${value('name')}" placeholder="Ej. Plataforma de reservas"><small id="project-name-error" data-error-for="name"></small></label>
        <label class="form-field form-span-2"><span>Frase breve</span><input class="input" name="tagline" maxlength="180" value="${value('tagline')}" placeholder="Describe el proyecto en una frase"><small data-error-for="tagline"></small></label>
        <label class="form-field form-span-2"><span>Descripción</span><textarea class="textarea" name="description" rows="4" maxlength="2000" placeholder="Objetivo, alcance y resultado esperado">${value('description')}</textarea><small data-error-for="description"></small></label>
      </div>
    </div>

    <div class="form-section">
      <div class="form-section-title"><strong>Gestión</strong><span>Responsable, etapa, prioridad y fechas.</span></div>
      <div class="form-grid form-grid-3">
        <label class="form-field"><span>Responsable *</span><select class="select" name="ownerUserId" id="project-owner-select" required aria-required="true" aria-describedby="project-owner-error"><option value="">Selecciona</option></select><small id="project-owner-error" data-error-for="ownerUserId"></small></label>
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

    <div class="form-global-error hidden" id="project-form-error" role="alert" tabindex="-1"></div>
    <div class="modal-actions"><button class="button button-secondary" type="button" data-modal-close>Cancelar</button><button class="button button-primary" type="submit" id="project-submit">${project ? 'Guardar cambios' : 'Crear proyecto'}</button></div>
  </form>`;
}

export async function openProjectForm({ session = getState().session, workspaceId = null, project = null, onSaved = null } = {}) {
  const availableWorkspaces = DemoService.getWorkspacesForSession(session).filter(item => item.status === 'active');
  const defaultWorkspaceId = project?.workspaceId || (workspaceId && workspaceId !== 'all' ? workspaceId : availableWorkspaces[0]?.id);
  const modal = openModal({
    title: project ? 'Editar proyecto' : 'Nuevo proyecto',
    subtitle: project ? `${project.code} · Los cambios se guardan en la fuente activa.` : 'Crea la ficha y, opcionalmente, su estructura documental.',
    body: projectFormHtml({ project, workspaces: availableWorkspaces, defaultWorkspaceId, allowQuickClientCreate: canManageClients(session) }),
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

  async function loadRelations(nextWorkspaceId, preferredClientId = null) {
    const selectedClientId = preferredClientId ?? clientSelect.value ?? project?.clientId ?? '';
    const selectedOwnerId = ownerSelect.value || project?.ownerUserId || '';
    clientSelect.disabled = true;
    ownerSelect.disabled = true;
    const [clients, users] = await Promise.all([
      ProjectService.listClients({ workspaceId: nextWorkspaceId, session }),
      ProjectService.listUsers({ workspaceId: nextWorkspaceId, session })
    ]);
    clientSelect.innerHTML = `<option value="">Sin cliente</option>${clients.map(client => `<option value="${client.id}" ${client.id === selectedClientId ? 'selected' : ''}>${escapeHtml(client.name)}</option>`).join('')}`;
    ownerSelect.innerHTML = `<option value="">Selecciona</option>${users.map(user => `<option value="${user.id}" ${user.id === selectedOwnerId ? 'selected' : ''}>${escapeHtml(user.name)}</option>`).join('')}`;
    clientSelect.disabled = false;
    ownerSelect.disabled = false;
  }

  try {
    await loadRelations(defaultWorkspaceId, project?.clientId || '');
  } catch (error) {
    form.querySelector('#project-form-error').textContent = error.message;
    form.querySelector('#project-form-error').classList.remove('hidden');
  }

  const quickClientTrigger = form.querySelector('#open-quick-client');
  const quickClientPanel = form.querySelector('#quick-client-panel');
  const quickClientName = form.querySelector('#quick-client-name');
  const quickClientContact = form.querySelector('#quick-client-contact');
  const quickClientEmail = form.querySelector('#quick-client-email');
  const quickClientPhone = form.querySelector('#quick-client-phone');
  const quickClientError = form.querySelector('#quick-client-error');
  const quickClientSave = form.querySelector('#save-quick-client');

  function closeQuickClientPanel({ clear = false } = {}) {
    if (!quickClientPanel) return;
    quickClientPanel.hidden = true;
    quickClientTrigger?.setAttribute('aria-expanded', 'false');
    if (clear) {
      [quickClientName, quickClientContact, quickClientEmail, quickClientPhone].forEach(field => { if (field) field.value = ''; });
      quickClientError?.classList.add('hidden');
      if (quickClientError) quickClientError.textContent = '';
    }
  }

  quickClientTrigger?.addEventListener('click', () => {
    const opening = quickClientPanel?.hidden !== false;
    if (!quickClientPanel) return;
    quickClientPanel.hidden = !opening;
    quickClientTrigger.setAttribute('aria-expanded', String(opening));
    if (opening) requestAnimationFrame(() => quickClientName?.focus());
  });
  form.querySelector('#cancel-quick-client')?.addEventListener('click', () => closeQuickClientPanel({ clear: true }));
  quickClientPanel?.addEventListener('keydown', event => {
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return;
    event.preventDefault();
    quickClientSave?.click();
  });
  quickClientSave?.addEventListener('click', async () => {
    const workspaceIdForClient = project?.workspaceId || workspaceSelect?.value || defaultWorkspaceId;
    const input = {
      workspaceId: normalizeText(workspaceIdForClient, 80),
      name: normalizeText(quickClientName?.value, 120),
      contactName: normalizeText(quickClientContact?.value, 120),
      email: normalizeText(quickClientEmail?.value, 254),
      phone: normalizeText(quickClientPhone?.value, 40)
    };
    let message = '';
    if (input.name.length < 2) message = 'Escribe el nombre del cliente.';
    else if (!isValidEmail(input.email)) message = 'Escribe un correo válido o deja el campo vacío.';
    if (message) {
      quickClientError.textContent = message;
      quickClientError.classList.remove('hidden');
      (input.name.length < 2 ? quickClientName : quickClientEmail)?.focus();
      return;
    }
    quickClientSave.disabled = true;
    quickClientSave.innerHTML = '<span class="spinner"></span> Guardando...';
    quickClientError.classList.add('hidden');
    try {
      const created = await ProjectService.createClient({ input, session });
      await loadRelations(workspaceIdForClient, created.id);
      closeQuickClientPanel({ clear: true });
      showToast('Cliente creado y seleccionado.');
    } catch (error) {
      quickClientError.textContent = error.message || 'No se pudo crear el cliente.';
      quickClientError.classList.remove('hidden');
    } finally {
      quickClientSave.disabled = false;
      quickClientSave.textContent = 'Guardar y seleccionar';
    }
  });

  workspaceSelect?.addEventListener('change', event => {
    closeQuickClientPanel({ clear: true });
    loadRelations(event.target.value, '');
  });

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
    form.querySelectorAll('[aria-invalid="true"]').forEach(field => field.setAttribute('aria-invalid', 'false'));
    form.querySelectorAll('.field-invalid').forEach(field => field.classList.remove('field-invalid'));
    Object.entries(errors).forEach(([name, message]) => fieldError(form, name, message));
    if (Object.keys(errors).length) {
      const globalError = form.querySelector('#project-form-error');
      globalError.textContent = `Revisa ${Object.keys(errors).length} campo(s) antes de continuar.`;
      globalError.classList.remove('hidden');
      globalError.focus();
      form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

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
