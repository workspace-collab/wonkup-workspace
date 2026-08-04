import { ProjectService } from '../services/project-service.js';
import { canManageClients } from '../utils/permissions.js';
import { escapeHtml } from '../utils/format.js';
import { icon } from '../utils/icons.js';
import { openModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { normalizeText, isValidEmail } from '../utils/validation.js';
import { DemoService } from '../services/demo-service.js';

export function renderClients(container, workspaceId, session) {
  container.innerHTML = `<section class="page">
    <div class="page-header"><div><span class="page-kicker">RELACIONES COMERCIALES</span><h1>Clientes</h1><p>Directorio de clientes disponible para crear y vincular proyectos.</p></div>${canManageClients(session) ? `<div class="page-header-actions"><button class="button button-primary" id="new-client">${icon('plus')} Nuevo cliente</button></div>` : ''}</div>
    <div class="toolbar" style="margin-bottom:18px"><label class="search-box">${icon('search')}<input id="client-search" type="search" placeholder="Buscar cliente o contacto..."></label><span class="service-mode">Fuente: ${ProjectService.mode === 'mock' ? 'demo local' : 'Google Apps Script'}</span></div>
    <div id="clients-content"><div class="loading-panel"><span class="spinner spinner-blue"></span><p>Cargando clientes...</p></div></div>
  </section>`;

  const state = { clients: [], query: '' };
  const content = container.querySelector('#clients-content');

  const renderList = () => {
    const filtered = state.clients.filter(client => `${client.name} ${client.contactName} ${client.email}`.toLowerCase().includes(state.query.toLowerCase()));
    content.innerHTML = filtered.length
      ? `<div class="client-grid">${filtered.map(clientCard).join('')}</div>`
      : `<div class="empty-state"><div class="empty-state-icon">${icon('user')}</div><h3>No hay clientes para mostrar</h3><p>Crea el primer cliente o cambia la búsqueda.</p></div>`;
  };

  const load = async () => {
    try {
      state.clients = await ProjectService.listClients({ workspaceId, session });
      renderList();
    } catch (error) {
      content.innerHTML = `<div class="empty-state"><div class="empty-state-icon">${icon('alert')}</div><h3>No se pudieron cargar los clientes</h3><p>${escapeHtml(error.message)}</p></div>`;
    }
  };

  container.querySelector('#client-search').addEventListener('input', event => {
    state.query = event.target.value;
    renderList();
  });
  container.querySelector('#new-client')?.addEventListener('click', () => openClientForm({ workspaceId, session, onSaved: load }));
  load();
}

function clientCard(client) {
  return `<article class="workspace-card client-card"><div class="client-avatar">${escapeHtml(client.name.slice(0, 2).toUpperCase())}</div><div class="client-copy"><h3>${escapeHtml(client.name)}</h3><p>${escapeHtml(client.contactName || 'Sin contacto principal')}</p></div><div class="client-meta"><span>${icon('file')} ${escapeHtml(client.email || 'Sin correo')}</span><span class="badge badge-green">Activo</span></div></article>`;
}

async function openClientForm({ workspaceId, session, onSaved }) {
  const workspaces = DemoService.getWorkspacesForSession(session);
  const defaultWorkspaceId = workspaceId === 'all' ? workspaces[0]?.id : workspaceId;
  const modal = openModal({
    title: 'Nuevo cliente',
    subtitle: 'Registra la organización o persona que podrá vincularse a proyectos.',
    body: `<form id="client-form" class="project-form" novalidate>
      <div class="form-grid form-grid-2">
        <label class="form-field"><span>Workspace *</span><select class="select" name="workspaceId">${workspaces.map(item => `<option value="${item.id}" ${item.id === defaultWorkspaceId ? 'selected' : ''}>${escapeHtml(item.name)}</option>`).join('')}</select><small data-error-for="workspaceId"></small></label>
        <label class="form-field"><span>Nombre *</span><input class="input" name="name" maxlength="120"><small data-error-for="name"></small></label>
        <label class="form-field"><span>Contacto principal</span><input class="input" name="contactName" maxlength="120"><small data-error-for="contactName"></small></label>
        <label class="form-field"><span>Correo</span><input class="input" type="email" name="email" maxlength="254"><small data-error-for="email"></small></label>
        <label class="form-field form-span-2"><span>Teléfono</span><input class="input" name="phone" maxlength="40"><small data-error-for="phone"></small></label>
      </div>
      <div class="form-global-error hidden" id="client-form-error"></div>
      <div class="modal-actions"><button class="button button-secondary" type="button" data-modal-close>Cancelar</button><button class="button button-primary" id="client-submit">Guardar cliente</button></div>
    </form>`,
    size: 'md',
    closeOnBackdrop: false
  });

  const form = modal.root.querySelector('#client-form');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const raw = Object.fromEntries(new FormData(form).entries());
    const input = {
      workspaceId: normalizeText(raw.workspaceId, 80),
      name: normalizeText(raw.name, 120),
      contactName: normalizeText(raw.contactName, 120),
      email: normalizeText(raw.email, 254),
      phone: normalizeText(raw.phone, 40)
    };
    const errors = {};
    if (!input.workspaceId) errors.workspaceId = 'Selecciona un workspace.';
    if (input.name.length < 2) errors.name = 'Escribe el nombre del cliente.';
    if (!isValidEmail(input.email)) errors.email = 'Escribe un correo válido.';
    form.querySelectorAll('[data-error-for]').forEach(slot => { slot.textContent = ''; });
    Object.entries(errors).forEach(([name, message]) => {
      form.querySelector(`[data-error-for="${name}"]`).textContent = message;
    });
    if (Object.keys(errors).length) return;

    const submit = form.querySelector('#client-submit');
    submit.disabled = true;
    submit.innerHTML = '<span class="spinner"></span> Guardando...';
    try {
      await ProjectService.createClient({ input, session });
      modal.close();
      showToast('Cliente creado correctamente.');
      await onSaved?.();
    } catch (error) {
      const slot = form.querySelector('#client-form-error');
      slot.textContent = error.message;
      slot.classList.remove('hidden');
      submit.disabled = false;
      submit.textContent = 'Guardar cliente';
    }
  });
}
