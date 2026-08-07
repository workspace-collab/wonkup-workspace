import { ManagedUsersService } from '../services/managed-users-service.js?v=12.3.0';
import { openModal, confirmModal } from '../components/modal.js?v=12.3.0';
import { showToast } from '../components/toast.js?v=12.3.0';
import { escapeHtml } from '../utils/format.js?v=12.3.0';
import { icon } from '../utils/icons.js?v=12.3.0';

const ROLE_OPTIONS = Object.freeze([
  ['workspace_admin', 'Administrador de workspace'],
  ['project_lead', 'Líder de proyecto'],
  ['collaborator', 'Colaborador'],
  ['reviewer', 'Revisor'],
  ['client', 'Cliente'],
  ['guest', 'Invitado']
]);
const PROJECT_SCOPED_ROLES = new Set(['project_lead', 'collaborator', 'reviewer', 'client', 'guest']);
let active = true;
let state = { users: [], directory: { workspaces: [], projects: [] }, query: '' };

function formatDate(value) {
  const date = new Date(value || '');
  if (!Number.isFinite(date.getTime())) return 'Sin registro';
  return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function roleLabel(role) {
  return ROLE_OPTIONS.find(item => item[0] === role)?.[1] || role || 'Sin perfil';
}

function userState(user) {
  if (user.disabled || user.profile?.status === 'inactive') return { key: 'inactive', label: 'Inactivo' };
  if (!user.lastSignInAt) return { key: 'invited', label: 'Invitado' };
  return { key: 'active', label: 'Activo' };
}

function workspaceNames(ids = []) {
  const map = new Map(state.directory.workspaces.map(item => [item.id, item.name]));
  return ids.map(id => id === '*' ? 'Todos los workspaces' : (map.get(id) || id));
}

function stats() {
  const result = { total: state.users.length, active: 0, invited: 0, inactive: 0 };
  state.users.forEach(user => { result[userState(user).key] += 1; });
  return result;
}

function renderStats(container) {
  const counts = stats();
  const host = container.querySelector('#users-admin-stats');
  if (!host) return;
  host.innerHTML = `
    <article><strong>${counts.total}</strong><span>Cuentas</span></article>
    <article><strong>${counts.active}</strong><span>Activas</span></article>
    <article><strong>${counts.invited}</strong><span>Invitadas</span></article>
    <article><strong>${counts.inactive}</strong><span>Inactivas</span></article>`;
}

function filteredUsers() {
  const query = state.query.trim().toLowerCase();
  if (!query) return state.users;
  return state.users.filter(user => [
    user.name,
    user.email,
    user.profile?.roleLabel,
    user.profile?.role,
    ...workspaceNames(user.profile?.workspaceIds || [])
  ].some(value => String(value || '').toLowerCase().includes(query)));
}

function renderUsers(container) {
  renderStats(container);
  const host = container.querySelector('#users-admin-list');
  if (!host) return;
  const users = filteredUsers();
  if (!users.length) {
    host.innerHTML = `<div class="empty-state compact"><div class="empty-state-icon">${icon('users')}</div><h2>No se encontraron cuentas</h2><p>Prueba otra búsqueda o crea una invitación.</p></div>`;
    return;
  }
  host.innerHTML = users.map(user => {
    const profile = user.profile || {};
    const status = userState(user);
    const isSuperadmin = profile.role === 'superadmin';
    const workspaces = workspaceNames(profile.workspaceIds || []);
    return `
      <article class="managed-user-card" data-user-uid="${escapeHtml(user.uid)}">
        <div class="managed-user-avatar">${escapeHtml((profile.name || user.name || user.email || 'WU').split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase())}</div>
        <div class="managed-user-main">
          <div class="managed-user-title"><strong>${escapeHtml(profile.name || user.name || 'Sin nombre')}</strong><span class="managed-user-status is-${status.key}">${escapeHtml(status.label)}</span></div>
          <span class="managed-user-email">${escapeHtml(user.email || profile.email || '')}</span>
          <div class="managed-user-tags"><span>${escapeHtml(profile.roleLabel || roleLabel(profile.role))}</span>${workspaces.map(name => `<span>${escapeHtml(name)}</span>`).join('')}</div>
          <small>Último acceso: ${escapeHtml(formatDate(user.lastSignInAt))}</small>
        </div>
        <div class="managed-user-actions">
          <button class="button button-secondary button-sm" type="button" data-user-action="resend" ${!user.email ? 'disabled' : ''}>${icon('mail')} Reenviar acceso</button>
          <button class="button button-secondary button-sm" type="button" data-user-action="edit" ${isSuperadmin ? 'disabled title="La cuenta maestra se protege fuera de este módulo"' : ''}>${icon('edit')} Editar</button>
          <button class="button ${status.key === 'inactive' ? 'button-primary' : 'button-danger'} button-sm" type="button" data-user-action="status" ${isSuperadmin ? 'disabled' : ''}>${icon(status.key === 'inactive' ? 'check' : 'lock')} ${status.key === 'inactive' ? 'Reactivar' : 'Desactivar'}</button>
        </div>
      </article>`;
  }).join('');
}

function roleOptions(selected = '') {
  return ROLE_OPTIONS.map(([value, label]) => `<option value="${value}" ${selected === value ? 'selected' : ''}>${label}</option>`).join('');
}

function workspaceChecks(selected = []) {
  return state.directory.workspaces.map(item => `
    <label class="cloud-check-card managed-user-scope-card">
      <input type="checkbox" data-user-workspace value="${escapeHtml(item.id)}" ${selected.includes(item.id) ? 'checked' : ''}>
      <span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.id)}</small></span>
    </label>`).join('');
}

function projectChecks(selected = []) {
  return state.directory.projects.map(item => `
    <label class="cloud-project-check managed-user-project-card" data-user-project-card data-workspace-id="${escapeHtml(item.workspaceId)}">
      <input type="checkbox" data-user-project value="${escapeHtml(item.id)}" ${selected.includes(item.id) ? 'checked' : ''}>
      <span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.workspaceId)} · ${escapeHtml(item.code || item.id)}</small></span>
    </label>`).join('');
}

function selectedValues(root, selector) {
  return [...root.querySelectorAll(`${selector}:checked`)].map(input => input.value);
}

function updateProjectVisibility(root) {
  const selectedWorkspaces = selectedValues(root, '[data-user-workspace]');
  root.querySelectorAll('[data-user-project-card]').forEach(card => {
    const visible = selectedWorkspaces.includes(card.dataset.workspaceId);
    card.classList.toggle('hidden', !visible);
    if (!visible) card.querySelector('input').checked = false;
  });
  const role = root.querySelector('#managed-user-role')?.value;
  const note = root.querySelector('#managed-user-project-note');
  if (note) note.textContent = PROJECT_SCOPED_ROLES.has(role)
    ? 'Selecciona al menos un proyecto para este rol.'
    : 'El administrador de workspace obtiene acceso a todos los proyectos del workspace.';
}

function formInput(root, existing = null) {
  return {
    uid: existing?.uid || '',
    name: root.querySelector('#managed-user-name').value.trim(),
    email: root.querySelector('#managed-user-email').value.trim().toLowerCase(),
    role: root.querySelector('#managed-user-role').value,
    workspaceIds: selectedValues(root, '[data-user-workspace]'),
    projectIds: selectedValues(root, '[data-user-project]'),
    allocation: Number(root.querySelector('#managed-user-allocation').value || 0),
    status: existing?.profile?.status === 'inactive' || existing?.disabled ? 'inactive' : 'active'
  };
}

function validateInput(input) {
  if (input.name.length < 2) return 'Escribe el nombre completo.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) return 'Escribe un correo válido.';
  if (!input.workspaceIds.length) return 'Selecciona al menos un workspace.';
  if (PROJECT_SCOPED_ROLES.has(input.role) && !input.projectIds.length) return 'Selecciona al menos un proyecto para este rol.';
  return '';
}

function openUserForm(container, existing = null) {
  const profile = existing?.profile || {};
  const editing = Boolean(existing);
  const modal = openModal({
    title: editing ? 'Editar acceso' : 'Invitar nuevo usuario',
    subtitle: editing ? 'Actualiza el rol y los alcances de la cuenta.' : 'La persona recibirá un correo para definir su contraseña.',
    size: 'lg',
    body: `
      <form id="managed-user-form" class="managed-user-form" novalidate>
        <div class="form-grid two-columns">
          <label><span>Nombre completo *</span><input class="input" id="managed-user-name" maxlength="120" value="${escapeHtml(profile.name || existing?.name || '')}" required></label>
          <label><span>Correo *</span><input class="input" id="managed-user-email" type="email" maxlength="254" value="${escapeHtml(profile.email || existing?.email || '')}" required></label>
          <label><span>Rol *</span><select class="select" id="managed-user-role">${roleOptions(profile.role || 'collaborator')}</select></label>
          <label><span>Dedicación (%)</span><input class="input" id="managed-user-allocation" type="number" min="0" max="100" step="5" value="20"></label>
        </div>
        <fieldset class="cloud-activation-fieldset"><legend>Workspaces autorizados *</legend><div class="cloud-workspace-options">${workspaceChecks(profile.workspaceIds || [])}</div></fieldset>
        <fieldset class="cloud-activation-fieldset"><legend>Proyectos autorizados</legend><p id="managed-user-project-note"></p><div class="cloud-activation-projects">${projectChecks(profile.projectIds || [])}</div></fieldset>
        <div class="form-error hidden" id="managed-user-form-error" role="alert"></div>
        <div class="modal-actions"><button class="button button-secondary" type="button" data-modal-close>Cancelar</button><button class="button button-primary" id="managed-user-submit" type="submit">${icon(editing ? 'check' : 'userPlus')} ${editing ? 'Guardar cambios' : 'Crear e invitar'}</button></div>
      </form>`
  });
  const form = modal.root.querySelector('#managed-user-form');
  const errorHost = modal.root.querySelector('#managed-user-form-error');
  const refreshScopes = () => updateProjectVisibility(modal.root);
  modal.root.querySelectorAll('[data-user-workspace]').forEach(input => input.addEventListener('change', refreshScopes));
  modal.root.querySelector('#managed-user-role').addEventListener('change', refreshScopes);
  refreshScopes();
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const input = formInput(modal.root, existing);
    const validation = validateInput(input);
    if (validation) {
      errorHost.textContent = validation;
      errorHost.classList.remove('hidden');
      return;
    }
    errorHost.classList.add('hidden');
    const button = modal.root.querySelector('#managed-user-submit');
    button.disabled = true;
    button.innerHTML = '<span class="spinner"></span> Guardando...';
    try {
      if (editing) {
        await ManagedUsersService.update(input);
        showToast('Acceso actualizado correctamente.');
      } else {
        const invited = await ManagedUsersService.invite(input);
        try {
          await ManagedUsersService.sendInvitationEmail(invited.email);
          showToast('Cuenta creada e invitación enviada.');
        } catch (emailError) {
          showToast('La cuenta fue creada, pero el correo no pudo enviarse. Usa “Reenviar acceso”.');
        }
      }
      modal.close();
      await refreshUsers(container);
    } catch (error) {
      errorHost.textContent = error.message;
      errorHost.classList.remove('hidden');
      button.disabled = false;
      button.innerHTML = `${icon(editing ? 'check' : 'userPlus')} ${editing ? 'Guardar cambios' : 'Crear e invitar'}`;
    }
  });
}

async function refreshUsers(container) {
  const list = container.querySelector('#users-admin-list');
  if (list) list.innerHTML = '<div class="cloud-loading"><span class="spinner spinner-blue"></span> Cargando cuentas...</div>';
  try {
    const result = await ManagedUsersService.list();
    if (!active || !container.isConnected) return;
    state.users = result.users || [];
    state.directory = result.directory || { workspaces: [], projects: [] };
    const version = container.querySelector('#users-functions-version');
    if (version) version.textContent = `Functions ${result.release || 'activa'}`;
    renderUsers(container);
  } catch (error) {
    if (!active || !container.isConnected) return;
    list.innerHTML = `<div class="cloud-operation-result is-error"><strong>No se pudo abrir Usuarios e invitaciones</strong><span>${escapeHtml(error.message)}</span><small>Publica primero las Cloud Functions incluidas en el Ajuste 12.2.</small></div>`;
  }
}

function bindEvents(container) {
  container.querySelector('#invite-managed-user')?.addEventListener('click', () => openUserForm(container));
  container.querySelector('#refresh-managed-users')?.addEventListener('click', () => refreshUsers(container));
  container.querySelector('#managed-users-search')?.addEventListener('input', event => {
    state.query = event.target.value;
    renderUsers(container);
  });
  container.querySelector('#users-admin-list')?.addEventListener('click', async event => {
    const button = event.target.closest('[data-user-action]');
    const card = event.target.closest('[data-user-uid]');
    if (!button || !card) return;
    const user = state.users.find(item => item.uid === card.dataset.userUid);
    if (!user) return;
    const action = button.dataset.userAction;
    if (action === 'edit') {
      openUserForm(container, user);
      return;
    }
    if (action === 'resend') {
      button.disabled = true;
      try {
        await ManagedUsersService.sendInvitationEmail(user.email);
        showToast(`Correo de acceso enviado a ${user.email}.`);
      } catch (error) {
        showToast(error.message);
      } finally {
        button.disabled = false;
      }
      return;
    }
    if (action === 'status') {
      const status = userState(user).key === 'inactive' ? 'active' : 'inactive';
      const confirmed = await confirmModal({
        title: status === 'active' ? 'Reactivar usuario' : 'Desactivar usuario',
        message: status === 'active'
          ? `La cuenta de <strong>${escapeHtml(user.email)}</strong> podrá ingresar nuevamente.`
          : `La cuenta de <strong>${escapeHtml(user.email)}</strong> perderá el acceso, sin borrar su historial.`,
        confirmLabel: status === 'active' ? 'Reactivar' : 'Desactivar',
        danger: status === 'inactive'
      });
      if (!confirmed) return;
      button.disabled = true;
      try {
        await ManagedUsersService.setStatus(user.uid, status);
        showToast(status === 'active' ? 'Usuario reactivado.' : 'Usuario desactivado.');
        await refreshUsers(container);
      } catch (error) {
        showToast(error.message);
        button.disabled = false;
      }
    }
  });
}

export async function renderUsersAdmin(container) {
  active = true;
  state = { users: [], directory: { workspaces: [], projects: [] }, query: '' };
  container.innerHTML = `
    <section class="page users-admin-page">
      <header class="page-header users-admin-header">
        <div><span class="eyebrow">ADMINISTRACIÓN</span><h1>Usuarios e invitaciones</h1><p>Crea cuentas, asigna roles y controla accesos sin entrar a Firebase Console.</p></div>
        <div class="page-actions"><span class="badge badge-success" id="users-functions-version">Cloud Functions</span><button class="button button-secondary" id="refresh-managed-users" type="button">${icon('refresh')} Actualizar</button><button class="button button-primary" id="invite-managed-user" type="button">${icon('userPlus')} Invitar usuario</button></div>
      </header>
      <div class="users-admin-security-note">${icon('shield')}<div><strong>Flujo seguro de invitación</strong><span>WonkUp crea la identidad mediante Firebase Admin SDK. La persona define su propia contraseña desde el correo recibido.</span></div></div>
      <section class="users-admin-stats" id="users-admin-stats"><article><strong>—</strong><span>Cuentas</span></article><article><strong>—</strong><span>Activas</span></article><article><strong>—</strong><span>Invitadas</span></article><article><strong>—</strong><span>Inactivas</span></article></section>
      <section class="panel users-admin-panel">
        <div class="panel-heading users-admin-toolbar"><div><span class="panel-kicker">DIRECTORIO</span><h2>Cuentas WonkUp</h2></div><label class="users-admin-search"><span class="sr-only">Buscar cuentas</span>${icon('search')}<input id="managed-users-search" type="search" placeholder="Buscar por nombre, correo, rol o workspace"></label></div>
        <div class="managed-users-list" id="users-admin-list"><div class="cloud-loading"><span class="spinner spinner-blue"></span> Cargando cuentas...</div></div>
      </section>
    </section>`;
  bindEvents(container);
  await refreshUsers(container);
}

export function cleanupUsersAdminView() {
  active = false;
}
