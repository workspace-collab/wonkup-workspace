import { ProjectService } from '../services/project-service.js';
import { canManageClients } from '../utils/permissions.js';
import { escapeHtml } from '../utils/format.js';
import { icon } from '../utils/icons.js';
import { openModal, confirmModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { normalizeText, isValidEmail } from '../utils/validation.js';
import { DemoService } from '../services/demo-service.js';

export function renderClients(container, workspaceId, session) {
  const manageable = canManageClients(session);
  container.innerHTML = `<section class="page">
    <div class="page-header"><div><span class="page-kicker">RELACIONES COMERCIALES</span><h1>Clientes</h1><p>Administra clientes activos, edita sus datos y conserva el historial mediante archivo lógico.</p></div>${manageable ? `<div class="page-header-actions"><button class="button button-primary" id="new-client">${icon('plus')} Nuevo cliente</button></div>` : ''}</div>
    <div class="toolbar client-toolbar" style="margin-bottom:18px"><label class="search-box" for="client-search"><span class="sr-only">Buscar clientes o contactos</span>${icon('search')}<input id="client-search" type="search" placeholder="Buscar cliente o contacto..." aria-label="Buscar clientes"></label>${manageable ? `<label class="toggle-field"><input id="show-archived-clients" type="checkbox"><span>Mostrar archivados</span></label>` : ''}<span class="service-mode">Fuente: ${ProjectService.mode === 'mock' ? 'demo local' : 'Google Apps Script'}</span></div>
    <div id="clients-content"><div class="loading-panel"><span class="spinner spinner-blue"></span><p>Cargando clientes...</p></div></div>
  </section>`;

  const state = { clients: [], query: '', includeArchived: false };
  const content = container.querySelector('#clients-content');

  const renderList = () => {
    const query = state.query.toLocaleLowerCase('es');
    const filtered = state.clients.filter(client => `${client.name} ${client.contactName} ${client.email}`.toLocaleLowerCase('es').includes(query));
    content.innerHTML = filtered.length
      ? `<div class="client-grid">${filtered.map(client => clientCard(client, session, manageable)).join('')}</div>`
      : `<div class="empty-state"><div class="empty-state-icon">${icon('user')}</div><h2>No hay clientes para mostrar</h2><p>Crea el primer cliente, cambia la búsqueda o revisa los archivados.</p></div>`;
    bindClientActions();
  };

  const load = async () => {
    try {
      state.clients = await ProjectService.listClients({ workspaceId, session, includeArchived: state.includeArchived });
      renderList();
    } catch (error) {
      content.innerHTML = `<div class="empty-state"><div class="empty-state-icon">${icon('alert')}</div><h2>No se pudieron cargar los clientes</h2><p>${escapeHtml(error.message)}</p></div>`;
    }
  };

  const bindClientActions = () => {
    content.querySelectorAll('[data-client-edit]').forEach(button => button.addEventListener('click', () => {
      const client = state.clients.find(item => item.id === button.dataset.clientEdit);
      if (client) openClientForm({ workspaceId, session, client, onSaved: load });
    }));

    content.querySelectorAll('[data-client-archive]').forEach(button => button.addEventListener('click', async () => {
      const client = state.clients.find(item => item.id === button.dataset.clientArchive);
      if (!client) return;
      const confirmed = await confirmModal({
        title: 'Archivar cliente',
        message: `El cliente <strong>${escapeHtml(client.name)}</strong> se ocultará del directorio activo, pero conservará sus relaciones e historial.`,
        confirmLabel: 'Archivar', danger: true
      });
      if (!confirmed) return;
      try {
        await ProjectService.archiveClient({ clientId: client.id, session });
        showToast('Cliente archivado.');
        await load();
      } catch (error) { showToast(error.message || 'No se pudo archivar el cliente.'); }
    }));

    content.querySelectorAll('[data-client-restore]').forEach(button => button.addEventListener('click', async () => {
      try {
        await ProjectService.restoreClient({ clientId: button.dataset.clientRestore, session });
        showToast('Cliente restaurado.');
        await load();
      } catch (error) { showToast(error.message || 'No se pudo restaurar el cliente.'); }
    }));

    content.querySelectorAll('[data-client-delete]').forEach(button => button.addEventListener('click', async () => {
      const client = state.clients.find(item => item.id === button.dataset.clientDelete);
      if (!client) return;
      const confirmed = await confirmModal({
        title: 'Eliminar cliente definitivamente',
        message: `Esta acción no se puede deshacer. Solo será posible si <strong>${escapeHtml(client.name)}</strong> no tiene proyectos vinculados.`,
        confirmLabel: 'Eliminar definitivamente', danger: true
      });
      if (!confirmed) return;
      try {
        await ProjectService.deleteClient({ clientId: client.id, session });
        showToast('Cliente eliminado definitivamente.');
        await load();
      } catch (error) { showToast(error.message || 'No se pudo eliminar el cliente.'); }
    }));
  };

  container.querySelector('#client-search').addEventListener('input', event => {
    state.query = event.target.value;
    renderList();
  });
  container.querySelector('#show-archived-clients')?.addEventListener('change', async event => {
    state.includeArchived = event.target.checked;
    await load();
  });
  container.querySelector('#new-client')?.addEventListener('click', () => openClientForm({ workspaceId, session, onSaved: load }));
  load();
}

function clientCard(client, session, manageable) {
  const archived = client.status === 'archived';
  return `<article class="workspace-card client-card ${archived ? 'is-archived' : ''}">
    <div class="client-card-head"><div class="client-avatar">${escapeHtml(client.name.slice(0, 2).toUpperCase())}</div>${manageable ? `<details class="card-action-menu"><summary aria-label="Acciones del cliente">${icon('more')}</summary><div><button type="button" data-client-edit="${escapeHtml(client.id)}">${icon('edit')} Editar</button>${archived ? `<button type="button" data-client-restore="${escapeHtml(client.id)}">${icon('restore')} Restaurar</button>${session.role === 'superadmin' ? `<button type="button" class="danger-menu-item" data-client-delete="${escapeHtml(client.id)}">${icon('trash')} Eliminar definitivamente</button>` : ''}` : `<button type="button" data-client-archive="${escapeHtml(client.id)}">${icon('archive')} Archivar</button>`}</div></details>` : ''}</div>
    <div class="client-copy"><h2>${escapeHtml(client.name)}</h2><p>${escapeHtml(client.contactName || 'Sin contacto principal')}</p></div>
    <div class="client-contact-list"><span>${icon('file')} ${escapeHtml(client.email || 'Sin correo')}</span>${client.phone ? `<span>${icon('user')} ${escapeHtml(client.phone)}</span>` : ''}</div>
    <div class="client-meta"><span>${archived ? 'Registro conservado' : 'Disponible para proyectos'}</span><span class="badge ${archived ? 'badge-gray' : 'badge-green'}">${archived ? 'Archivado' : 'Activo'}</span></div>
  </article>`;
}

async function openClientForm({ workspaceId, session, client = null, onSaved }) {
  const editing = Boolean(client);
  const workspaces = DemoService.getWorkspacesForSession(session);
  const defaultWorkspaceId = client?.workspaceId || (workspaceId === 'all' ? workspaces[0]?.id : workspaceId);
  const modal = openModal({
    title: editing ? 'Editar cliente' : 'Nuevo cliente',
    subtitle: editing ? 'Actualiza los datos comerciales sin perder el historial.' : 'Registra la organización o persona que podrá vincularse a proyectos.',
    body: `<form id="client-form" class="project-form" novalidate>
      <div class="form-grid form-grid-2">
        <label class="form-field"><span>Workspace *</span><select class="select" name="workspaceId" required aria-required="true" aria-describedby="client-workspace-error" ${editing ? 'disabled' : ''}>${workspaces.map(item => `<option value="${item.id}" ${item.id === defaultWorkspaceId ? 'selected' : ''}>${escapeHtml(item.name)}</option>`).join('')}</select><small id="client-workspace-error" data-error-for="workspaceId"></small></label>
        <label class="form-field"><span>Nombre *</span><input class="input" name="name" maxlength="120" required aria-required="true" aria-describedby="client-name-error" value="${escapeHtml(client?.name || '')}"><small id="client-name-error" data-error-for="name"></small></label>
        <label class="form-field"><span>Contacto principal</span><input class="input" name="contactName" maxlength="120" value="${escapeHtml(client?.contactName || '')}"><small data-error-for="contactName"></small></label>
        <label class="form-field"><span>Correo</span><input class="input" type="email" name="email" maxlength="254" aria-describedby="client-email-error" value="${escapeHtml(client?.email || '')}"><small id="client-email-error" data-error-for="email"></small></label>
        <label class="form-field form-span-2"><span>Teléfono</span><input class="input" name="phone" maxlength="40" value="${escapeHtml(client?.phone || '')}"><small data-error-for="phone"></small></label>
      </div>
      <div class="form-global-error hidden" id="client-form-error" role="alert" tabindex="-1"></div>
      <div class="modal-actions"><button class="button button-secondary" type="button" data-modal-close>Cancelar</button><button class="button button-primary" id="client-submit">${editing ? 'Guardar cambios' : 'Guardar cliente'}</button></div>
    </form>`,
    size: 'md', closeOnBackdrop: false
  });

  const form = modal.root.querySelector('#client-form');
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const raw = Object.fromEntries(new FormData(form).entries());
    const input = {
      workspaceId: editing ? client.workspaceId : normalizeText(raw.workspaceId, 80),
      name: normalizeText(raw.name, 120), contactName: normalizeText(raw.contactName, 120),
      email: normalizeText(raw.email, 254), phone: normalizeText(raw.phone, 40)
    };
    const errors = {};
    if (!input.workspaceId) errors.workspaceId = 'Selecciona un workspace.';
    if (input.name.length < 2) errors.name = 'Escribe el nombre del cliente.';
    if (!isValidEmail(input.email)) errors.email = 'Escribe un correo válido.';
    form.querySelectorAll('[data-error-for]').forEach(slot => { slot.textContent = ''; });
    form.querySelectorAll('[aria-invalid="true"]').forEach(field => field.setAttribute('aria-invalid', 'false'));
    Object.entries(errors).forEach(([name, message]) => {
      const slot = form.querySelector(`[data-error-for="${name}"]`);
      const field = form.querySelector(`[name="${name}"]`);
      if (slot) slot.textContent = message;
      if (field) {
        field.setAttribute('aria-invalid', 'true');
        if (slot?.id) field.setAttribute('aria-describedby', slot.id);
      }
    });
    if (Object.keys(errors).length) {
      const summary = form.querySelector('#client-form-error');
      summary.textContent = `Revisa ${Object.keys(errors).length} campo(s) antes de continuar.`;
      summary.classList.remove('hidden');
      summary.focus();
      form.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    const submit = form.querySelector('#client-submit');
    submit.disabled = true;
    submit.innerHTML = '<span class="spinner"></span> Guardando...';
    try {
      if (editing) await ProjectService.updateClient({ clientId: client.id, patch: input, session });
      else await ProjectService.createClient({ input, session });
      modal.close();
      showToast(editing ? 'Cliente actualizado.' : 'Cliente creado correctamente.');
      await onSaved?.();
    } catch (error) {
      const slot = form.querySelector('#client-form-error');
      slot.textContent = error.message;
      slot.classList.remove('hidden');
      submit.disabled = false;
      submit.textContent = editing ? 'Guardar cambios' : 'Guardar cliente';
    }
  });
}
