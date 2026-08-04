import { icon } from '../utils/icons.js';
import { DemoService } from '../services/demo-service.js';
import { AccessService } from '../services/access-service.js';
import { NotificationService } from '../services/notification-service.js';
import { GlobalSearchService } from '../services/global-search-service.js';
import { getState, setState, clearSession } from '../state/store.js';
import { showToast } from './toast.js';
import { confirmModal } from './modal.js';
import { escapeHtml } from '../utils/format.js';
import { closePopovers, initializePopoverManager, togglePopover } from '../utils/popover-manager.js';
import { canCreateProject, canViewMaster, isInternalUser, isReadOnlyRole } from '../utils/permissions.js';

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

let keyboardShortcutsBound = false;
let searchTimer = null;

function workspaceBase(id) {
  return id === 'all' ? '#/master' : `#/w/${id}`;
}

function navHref(key, workspaceId) {
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

function popover({ id, triggerId, className = '', body = '' }) {
  return `<div class="dropdown ${className} hidden" id="${id}" data-popover-panel data-trigger-id="${triggerId}">${body}</div>`;
}

export function createAppShell() {
  initializePopoverManager();
  const app = document.querySelector('#app');
  app.innerHTML = `<div class="app-shell" id="app-shell"><aside class="app-sidebar" id="sidebar"></aside><header class="app-header" id="header"></header><main class="app-main" id="main-view"></main><button class="sidebar-backdrop" id="sidebar-backdrop" aria-label="Cerrar menú"></button></div>`;
  document.querySelector('#sidebar-backdrop').addEventListener('click', () => setState({ sidebarOpen: false }));
  bindGlobalKeyboardShortcuts();
  return { main: document.querySelector('#main-view'), renderShell };
}

export function renderShell(route = null) {
  const state = getState();
  const session = state.session;
  const shell = document.querySelector('#app-shell');
  const accessMode = route?.view === 'access';

  closePopovers();
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
  const notifications = NotificationService.list(session);
  const unreadCount = notifications.filter(item => !item.read).length;

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
        <div class="sidebar-tip"><strong>Ajuste 4.1</strong>Kanban configurable, búsqueda, notificaciones y mejoras de usabilidad.</div>
      </div>
    </div>`;

  const quickMenu = popover({
    id: 'quick-menu', triggerId: 'quick-add', className: 'header-popover compact-menu',
    body: `<div class="popover-title">Crear rápidamente</div><button data-action="project">${icon('folder')}<span><strong>Nuevo proyecto</strong><small>Registra una nueva iniciativa</small></span></button><button data-action="task">${icon('checkSquare')}<span><strong>Nueva tarea</strong><small>Abre el Kanban actual</small></span></button><button data-action="canvas">${icon('lightbulb')}<span><strong>Nuevo canvas</strong><small>Abre Innovation Toolkit</small></span></button>`
  });

  const themeMenu = popover({
    id: 'theme-menu', triggerId: 'theme-button', className: 'header-popover theme-popover',
    body: `<div class="popover-title">Apariencia</div><button data-theme="light">${icon('sun')}<span>Claro</span><i data-theme-check="light">${icon('check')}</i></button><button data-theme="dark">${icon('moon')}<span>Oscuro</span><i data-theme-check="dark">${icon('check')}</i></button><button data-theme="system">${icon('monitor')}<span>Sistema</span><i data-theme-check="system">${icon('check')}</i></button>`
  });

  const notificationMenu = popover({
    id: 'notification-menu', triggerId: 'notification-button', className: 'header-popover notification-popover',
    body: renderNotifications(notifications)
  });

  const profileMenu = popover({
    id: 'profile-menu', triggerId: 'profile-button', className: 'header-popover profile-dropdown',
    body: `<div class="profile-menu-info"><strong>${escapeHtml(session.user.name)}</strong><small>${escapeHtml(session.user.email || '')}</small><span>${escapeHtml(session.roleLabel)}</span></div><button data-profile-action="preferences">${icon('settings')} Preferencias</button><div class="dropdown-divider"></div><button id="logout-button" class="danger-menu-item">${icon('logout')} Cerrar sesión</button>`
  });

  document.querySelector('#header').innerHTML = `
    <button class="header-icon-button mobile-menu-button" id="menu-toggle" aria-label="Abrir menú lateral">${icon('menu')}</button>
    <div class="header-workspace"><strong>${escapeHtml(current?.name || 'WonkUp Workspace')}</strong><small>${escapeHtml(current?.shortName || 'Centro de operaciones')}</small></div>
    ${isInternalUser(session) ? `<div class="header-search-wrap"><label class="header-search"><span class="sr-only">Buscar</span>${icon('search')}<input id="global-search" type="search" autocomplete="off" placeholder="Buscar proyectos, tareas o clientes..." aria-controls="global-search-results" aria-expanded="false"><kbd>⌘ K</kbd></label>${popover({ id: 'global-search-results', triggerId: 'global-search', className: 'search-popover', body: '<div class="search-hint">Escribe al menos 2 caracteres para buscar.</div>' })}</div>` : '<div class="header-search-spacer"></div>'}
    <div class="header-actions">
      ${isInternalUser(session) ? `<div class="relative"><button class="header-icon-button" id="quick-add" aria-label="Crear" aria-expanded="false">${icon('plus')}</button>${quickMenu}</div>` : ''}
      <div class="relative"><button class="header-icon-button" id="theme-button" aria-label="Cambiar apariencia" aria-expanded="false">${icon('sun')}</button>${themeMenu}</div>
      <div class="relative"><button class="header-icon-button" id="notification-button" aria-label="Notificaciones" aria-expanded="false">${icon('bell')}${unreadCount ? `<span class="notification-dot">${unreadCount > 9 ? '9+' : unreadCount}</span>` : ''}</button>${notificationMenu}</div>
      <div class="relative"><button class="profile-button" id="profile-button" aria-expanded="false"><span class="profile-avatar">${escapeHtml(session.user.initials || session.user.name.slice(0, 1))}</span><span class="profile-copy"><strong>${escapeHtml(session.user.name)}</strong><small>${escapeHtml(session.roleLabel)}</small></span>${icon('chevronDown', 'profile-chevron')}</button>${profileMenu}</div>
    </div>`;

  bindShellEvents(session, selected);
  updateThemeChecks(state.themePreference);
}

function renderNotifications(notifications) {
  if (!notifications.length) return `<div class="popover-title">Notificaciones</div><div class="notification-empty">${icon('bell')}<strong>Todo al día</strong><span>No tienes notificaciones pendientes.</span></div>`;
  return `<div class="popover-heading"><div><strong>Notificaciones</strong><small>${notifications.filter(item => !item.read).length} sin leer</small></div><button class="text-button" id="mark-all-read">Marcar todas</button></div><div class="notification-list">${notifications.map(item => `<a class="notification-item ${item.read ? 'read' : ''}" href="${escapeHtml(item.href)}" data-notification-id="${escapeHtml(item.id)}"><span class="notification-icon">${icon(notificationIcon(item.type))}</span><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.message)}</small><time>${relativeTime(item.createdAt)}</time></span>${item.read ? '' : '<i></i>'}</a>`).join('')}</div>`;
}

function notificationIcon(type) {
  if (type === 'assignment') return 'userPlus';
  if (type === 'comment') return 'message';
  if (type === 'wip') return 'alert';
  return 'bell';
}

function relativeTime(value) {
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  return `Hace ${Math.floor(hours / 24)} d`;
}

function bindShellEvents(session, selectedWorkspaceId) {
  document.querySelectorAll('.nav-link').forEach(link => link.addEventListener('click', () => {
    closePopovers();
    setState({ sidebarOpen: false });
  }));

  document.querySelector('#workspace-select')?.addEventListener('change', event => {
    setState({ selectedWorkspaceId: event.target.value, sidebarOpen: false });
    location.hash = event.target.value === 'all' ? '#/master/dashboard' : `#/w/${event.target.value}/dashboard`;
  });

  document.querySelector('#menu-toggle')?.addEventListener('click', () => {
    closePopovers();
    setState({ sidebarOpen: !getState().sidebarOpen });
  });

  bindPopoverTrigger('quick-add', 'quick-menu');
  bindPopoverTrigger('theme-button', 'theme-menu');
  bindPopoverTrigger('notification-button', 'notification-menu');
  bindPopoverTrigger('profile-button', 'profile-menu');

  document.querySelectorAll('#theme-menu [data-theme]').forEach(button => {
    button.addEventListener('click', () => {
      setState({ themePreference: button.dataset.theme });
      updateThemeChecks(button.dataset.theme);
      closePopovers();
    });
  });

  document.querySelectorAll('#quick-menu [data-action]').forEach(button => {
    button.addEventListener('click', () => {
      const action = button.dataset.action;
      if (action === 'project' && canCreateProject(session)) {
        sessionStorage.setItem('wonkup.intent.newProject', '1');
        location.hash = selectedWorkspaceId === 'all' ? '#/master/projects' : `#/w/${selectedWorkspaceId}/projects`;
      } else if (action === 'task') {
        location.hash = selectedWorkspaceId === 'all' ? '#/master/kanban' : `#/w/${selectedWorkspaceId}/kanban`;
        showToast('Selecciona un proyecto para crear la tarea.');
      } else if (action === 'canvas') {
        location.hash = selectedWorkspaceId === 'all' ? '#/master/toolkit' : `#/w/${selectedWorkspaceId}/toolkit`;
      } else {
        showToast('Tu rol no permite realizar esta acción.');
      }
      closePopovers();
    });
  });

  document.querySelectorAll('[data-notification-id]').forEach(item => {
    item.addEventListener('click', () => {
      NotificationService.markRead(item.dataset.notificationId, session);
      closePopovers();
    });
  });

  document.querySelector('#mark-all-read')?.addEventListener('click', event => {
    event.stopPropagation();
    NotificationService.markAllRead(session);
    document.querySelector('#notification-button .notification-dot')?.remove();
    const panel = document.querySelector('#notification-menu');
    if (panel) panel.innerHTML = renderNotifications(NotificationService.list(session));
    closePopovers();
    showToast('Notificaciones marcadas como leídas.');
  });

  document.querySelector('[data-profile-action="preferences"]')?.addEventListener('click', () => {
    closePopovers();
    location.hash = selectedWorkspaceId === 'all' ? '#/master/settings' : `#/w/${selectedWorkspaceId}/settings`;
  });

  bindGlobalSearch(session, selectedWorkspaceId);

  document.querySelector('#logout-button')?.addEventListener('click', async () => {
    closePopovers();
    const confirmed = await confirmModal({
      title: 'Cerrar sesión',
      message: '¿Deseas cerrar tu sesión de WonkUp Workspace?',
      confirmLabel: 'Cerrar sesión',
      danger: true
    });
    if (!confirmed) return;
    try { await AccessService.revokeSession(session); } catch { /* Close local session anyway. */ }
    clearSession();
    location.hash = '#/access';
  });
}

function bindPopoverTrigger(triggerId, panelId) {
  const trigger = document.getElementById(triggerId);
  const panel = document.getElementById(panelId);
  if (!trigger || !panel) return;
  trigger.addEventListener('click', event => {
    event.stopPropagation();
    togglePopover(trigger, panel);
  });
  panel.addEventListener('click', event => event.stopPropagation());
}

function bindGlobalSearch(session, selectedWorkspaceId) {
  const input = document.querySelector('#global-search');
  const panel = document.querySelector('#global-search-results');
  if (!input || !panel) return;

  const run = () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(async () => {
      const query = input.value.trim();
      if (query.length < 2) {
        panel.innerHTML = '<div class="search-hint">Escribe al menos 2 caracteres para buscar.</div>';
        panel.classList.add('hidden');
        input.setAttribute('aria-expanded', 'false');
        return;
      }
      panel.innerHTML = '<div class="search-loading"><span class="spinner spinner-blue"></span> Buscando...</div>';
      panel.classList.remove('hidden');
      input.setAttribute('aria-expanded', 'true');
      try {
        const results = await GlobalSearchService.search({ query, workspaceId: selectedWorkspaceId, session });
        panel.innerHTML = results.length ? `<div class="search-results-title">Resultados para “${escapeHtml(query)}”</div>${results.map(result => `<a class="search-result" href="${escapeHtml(result.href)}"><span>${icon(result.icon)}</span><div><small>${escapeHtml(result.type)}</small><strong>${escapeHtml(result.title)}</strong><p>${escapeHtml(result.subtitle)}</p></div>${icon('arrowRight')}</a>`).join('')}` : `<div class="search-empty">${icon('search')}<strong>Sin resultados</strong><span>Prueba con otro nombre o término.</span></div>`;
        panel.querySelectorAll('a').forEach(link => link.addEventListener('click', closePopovers));
      } catch (error) {
        panel.innerHTML = `<div class="search-empty">${icon('alert')}<strong>No se pudo buscar</strong><span>${escapeHtml(error.message || 'Intenta nuevamente.')}</span></div>`;
      }
    }, 220);
  };

  input.addEventListener('input', run);
  input.addEventListener('focus', () => {
    if (input.value.trim().length >= 2) {
      closePopovers(panel);
      panel.classList.remove('hidden');
      input.setAttribute('aria-expanded', 'true');
    }
  });
  input.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      panel.classList.add('hidden');
      input.setAttribute('aria-expanded', 'false');
      input.blur();
    }
  });
}

function bindGlobalKeyboardShortcuts() {
  if (keyboardShortcutsBound) return;
  keyboardShortcutsBound = true;
  document.addEventListener('keydown', event => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      const input = document.querySelector('#global-search');
      if (!input) return;
      event.preventDefault();
      input.focus();
      input.select();
    }
  });
}

function updateThemeChecks(preference) {
  document.querySelectorAll('[data-theme-check]').forEach(check => {
    check.classList.toggle('visible', check.dataset.themeCheck === preference);
  });
}
