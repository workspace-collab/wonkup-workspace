import { icon } from '../utils/icons.js';
import { DemoService } from '../services/demo-service.js';
import { AccessService } from '../services/access-service.js';
import { getState, setState, clearSession } from '../state/store.js';
import { showToast } from './toast.js';
import { escapeHtml } from '../utils/format.js';
import { canCreateProject, canViewMaster, getDefaultRoute, isInternalUser, isReadOnlyRole } from '../utils/permissions.js';

const internalNavItems = [
  ['dashboard', 'Dashboard', 'home'],
  ['projects', 'Mis proyectos', 'folder'],
  ['toolkit', 'Innovation Toolkit', 'lightbulb'],
  ['kanban', 'Kanban', 'kanban'],
  ['calendar', 'Calendario', 'calendar'],
  ['team', 'Equipo', 'users'],
  ['clients', 'Clientes', 'user'],
  ['documents', 'Documentos', 'file'],
  ['reports', 'Reportes', 'chart'],
  ['settings', 'Configuración', 'settings']
];

function workspaceBase(id) {
  return id === 'all' ? '#/master' : `#/w/${id}`;
}

function navHref(key, workspaceId) {
  if (['dashboard', 'projects'].includes(key)) return `${workspaceBase(workspaceId)}/${key}`;
  return `${workspaceBase(workspaceId)}/${key}`;
}

function createReadOnlyNav(session) {
  const workspaceId = session.scopes.workspaceIds.find(id => id !== '*');
  const projectId = session.scopes.projectIds.find(id => id !== '*');
  return [[
    'project',
    session.role === 'client' ? 'Mi proyecto' : 'Proyecto compartido',
    'briefcase',
    `#/w/${workspaceId}/p/${projectId}/summary`
  ]];
}

export function createAppShell() {
  const app = document.querySelector('#app');
  app.innerHTML = `<div class="app-shell" id="app-shell"><aside class="app-sidebar" id="sidebar"></aside><header class="app-header" id="header"></header><main class="app-main" id="main-view"></main><button class="sidebar-backdrop" id="sidebar-backdrop" aria-label="Cerrar menú"></button></div>`;
  document.querySelector('#sidebar-backdrop').addEventListener('click', () => setState({ sidebarOpen: false }));
  return { main: document.querySelector('#main-view'), renderShell };
}

export function renderShell(route = null) {
  const state = getState();
  const session = state.session;
  const shell = document.querySelector('#app-shell');
  const accessMode = route?.view === 'access';

  shell?.classList.toggle('auth-shell', accessMode);
  shell?.classList.toggle('sidebar-open', state.sidebarOpen && !accessMode);

  if (accessMode || !session) {
    document.querySelector('#sidebar').innerHTML = '';
    document.querySelector('#header').innerHTML = '';
    return;
  }

  const workspaces = DemoService.getWorkspacesForSession(session);
  const selected = canViewMaster(session) && state.selectedWorkspaceId === 'all'
    ? 'all'
    : (workspaces.some(item => item.id === state.selectedWorkspaceId) ? state.selectedWorkspaceId : workspaces[0]?.id);

  const current = selected === 'all'
    ? { name: 'Panel Maestro', shortName: 'Todos los workspaces' }
    : DemoService.getWorkspace(selected);

  const active = route?.view || 'dashboard';
  const readOnly = isReadOnlyRole(session);
  const navItems = readOnly ? createReadOnlyNav(session) : internalNavItems;

  document.querySelector('#sidebar').innerHTML = `
    <div class="sidebar-inner">
      <div class="sidebar-brand">
        <div class="brand-logo"><img src="./assets/brand/logo-wonkup.png" alt="" onerror="this.remove(); this.parentElement.textContent='W';"></div>
        <div class="brand-copy"><strong>WonkUp</strong><small>Workspace</small></div>
      </div>

      <div class="sidebar-workspace">
        <label class="sidebar-label" for="workspace-select">Workspace</label>
        ${readOnly ? `
          <div class="workspace-fixed"><strong>${escapeHtml(current?.name || 'Proyecto autorizado')}</strong><small>Acceso limitado</small></div>
        ` : `
          <select class="sidebar-select" id="workspace-select">
            ${canViewMaster(session) ? '<option value="all">Panel Maestro WonkUp</option>' : ''}
            ${workspaces.map(workspace => `<option value="${workspace.id}" ${workspace.id === selected ? 'selected' : ''}>${escapeHtml(workspace.name)}</option>`).join('')}
          </select>
        `}
      </div>

      <div class="role-chip">${icon(readOnly ? 'eye' : 'shield')} ${escapeHtml(session.roleLabel)}</div>

      <nav class="sidebar-nav" aria-label="Navegación principal">
        ${navItems.map((item, index) => {
          const [key, label, iconName, customHref] = item;
          const href = customHref || navHref(key, selected);
          const itemActive = key === 'project' ? active === 'project' : active === key;
          return `${index === navItems.length - 1 && key === 'settings' ? '<div class="nav-group-title">Administración</div>' : ''}<a class="nav-link ${itemActive ? 'active' : ''}" href="${href}"><span class="nav-icon">${icon(iconName)}</span>${escapeHtml(label)}</a>`;
        }).join('')}
      </nav>

      <div class="sidebar-footer">
        <div class="sidebar-tip"><strong>Entrega 2</strong>Sesiones, roles y workspaces preparados para conectarse con Apps Script.</div>
      </div>
    </div>`;

  document.querySelector('#header').innerHTML = `
    <button class="header-icon-button mobile-menu-button" id="menu-toggle" aria-label="Abrir menú">${icon('menu')}</button>
    <div class="header-workspace"><strong>${escapeHtml(current?.name || 'WonkUp Workspace')}</strong><small>${escapeHtml(current?.shortName || 'Centro de operaciones')}</small></div>
    ${isInternalUser(session) ? `<label class="header-search"><span class="sr-only">Buscar</span>${icon('search')}<input id="global-search" type="search" placeholder="Buscar en WonkUp..."></label>` : '<div class="header-search-spacer"></div>'}
    <div class="header-actions">
      ${canCreateProject(session) ? `<div class="relative"><button class="header-icon-button" id="quick-add" aria-label="Crear">${icon('plus')}</button><div class="dropdown hidden" id="quick-menu"><button data-action="project">${icon('folder')} Nuevo proyecto</button><button data-action="task">${icon('check')} Nueva tarea</button><button data-action="canvas">${icon('lightbulb')} Nuevo canvas</button></div></div>` : ''}
      <div class="relative"><button class="header-icon-button" id="theme-button" aria-label="Cambiar tema">${icon('sun')}</button><div class="dropdown hidden" id="theme-menu"><button data-theme="light">${icon('sun')} Claro</button><button data-theme="dark">${icon('moon')} Oscuro</button><button data-theme="system">${icon('monitor')} Sistema</button></div></div>
      <button class="header-icon-button" aria-label="Notificaciones">${icon('bell')}<span class="notification-dot">3</span></button>
      <div class="relative">
        <button class="profile-button" id="profile-button"><span class="profile-avatar">${escapeHtml(session.user.initials || session.user.name.slice(0, 1))}</span><span class="profile-copy"><strong>${escapeHtml(session.user.name)}</strong><small>${escapeHtml(session.roleLabel)}</small></span></button>
        <div class="dropdown profile-dropdown hidden" id="profile-menu">
          <div class="profile-menu-info"><strong>${escapeHtml(session.user.name)}</strong><small>${escapeHtml(session.user.email || '')}</small></div>
          <button id="logout-button">${icon('logout')} Cerrar sesión</button>
        </div>
      </div>
    </div>`;

  bindShellEvents(session);
}

function bindShellEvents(session) {
  document.querySelector('#workspace-select')?.addEventListener('change', event => {
    setState({ selectedWorkspaceId: event.target.value, sidebarOpen: false });
    location.hash = event.target.value === 'all'
      ? '#/master/dashboard'
      : `#/w/${event.target.value}/dashboard`;
  });

  document.querySelector('#menu-toggle')?.addEventListener('click', () => {
    setState({ sidebarOpen: !getState().sidebarOpen });
  });

  document.querySelector('#quick-add')?.addEventListener('click', () => {
    document.querySelector('#quick-menu')?.classList.toggle('hidden');
  });

  document.querySelector('#theme-button')?.addEventListener('click', () => {
    document.querySelector('#theme-menu')?.classList.toggle('hidden');
  });

  document.querySelector('#profile-button')?.addEventListener('click', () => {
    document.querySelector('#profile-menu')?.classList.toggle('hidden');
  });

  document.querySelectorAll('#theme-menu [data-theme]').forEach(button => {
    button.addEventListener('click', () => {
      setState({ themePreference: button.dataset.theme });
      document.querySelector('#theme-menu')?.classList.add('hidden');
    });
  });

  document.querySelectorAll('#quick-menu [data-action]').forEach(button => {
    button.addEventListener('click', () => {
      showToast('Esta acción se habilitará en la entrega funcional correspondiente.');
      document.querySelector('#quick-menu')?.classList.add('hidden');
    });
  });

  document.querySelector('#global-search')?.addEventListener('keydown', event => {
    if (event.key === 'Enter') showToast(`Búsqueda demo: ${event.target.value || 'sin término'}`);
  });

  document.querySelector('#logout-button')?.addEventListener('click', async () => {
    try {
      await AccessService.revokeSession(session);
    } catch {
      // La sesión local debe cerrarse aunque la API no responda.
    }
    clearSession();
    location.hash = '#/access';
  });
}
