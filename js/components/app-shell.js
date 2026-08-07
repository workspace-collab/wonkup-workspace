import { icon } from '../utils/icons.js?v=12.3.0';
import { DemoService } from '../services/demo-service.js?v=12.3.0';
import { AccessService } from '../services/access-service.js?v=12.3.0';
import { NotificationService } from '../services/notification-service.js?v=12.3.0';
import { GlobalSearchService } from '../services/global-search-service.js?v=12.3.0';
import { getState, setState, clearSession } from '../state/store.js?v=12.3.0';
import { showToast } from './toast.js?v=12.3.0';
import { confirmModal } from './modal.js?v=12.3.0';
import { escapeHtml } from '../utils/format.js?v=12.3.0';
import { closePopovers, initializePopoverManager, togglePopover } from '../utils/popover-manager.js?v=12.3.0';
import { canCreateProject, canManageCloudFoundation, canViewMaster, isInternalUser, isReadOnlyRole } from '../utils/permissions.js?v=12.3.0';

const internalNavItems = [
  ['dashboard', 'Dashboard', 'home', null, true],
  ['projects', 'Mis proyectos', 'folder', null, true],
  ['toolkit', 'Innovation Toolkit', 'lightbulb', null, true],
  ['kanban', 'Kanban', 'kanban', null, true],
  ['calendar', 'Calendario', 'calendar', null, false],
  ['team', 'Equipo', 'users', null, false],
  ['clients', 'Clientes', 'user', null, true],
  ['documents', 'Documentos', 'file', null, false],
  ['reports', 'Reportes', 'chart', null, true],
  ['usersAdmin', 'Usuarios', 'users', '#/master/users', true],
  ['cloud', 'Cloud Foundation', 'cloud', '#/master/cloud', true],
  ['settings', 'Configuración', 'settings', null, false]
];

let keyboardShortcutsBound = false;
let searchTimer = null;
let notificationSyncKey = '';
let stopNotificationSubscription = null;
const SIDEBAR_COLLAPSED_KEY = 'wonkup.sidebar.collapsed';

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
    'clientPortal',
    session.role === 'client' ? 'Portal del cliente' : 'Proyecto compartido',
    'briefcase',
    `#/portal/w/${workspaceId}/p/${projectId}/overview`
  ]];
}


function createReviewerNav() {
  return internalNavItems.filter(item => ['dashboard', 'projects', 'kanban'].includes(item[0]));
}

function popover({ id, triggerId, className = '', body = '' }) {
  return `<div class="dropdown ${className} hidden" id="${id}" role="menu" aria-label="Menú contextual" data-popover-panel data-trigger-id="${triggerId}">${body}</div>`;
}

export function createAppShell() {
  initializePopoverManager();
  const app = document.querySelector('#app');
  app.innerHTML = `<div class="app-shell" id="app-shell"><aside class="app-sidebar" id="sidebar"></aside><header class="app-header" id="header"></header><main class="app-main" id="main-view" tabindex="-1"></main><button class="sidebar-backdrop" id="sidebar-backdrop" aria-label="Cerrar menú lateral"></button></div>`;
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
  const desktopSidebar = matchMedia('(min-width: 981px)').matches;
  const sidebarCollapsed = desktopSidebar && localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
  shell?.classList.toggle('auth-shell', accessMode);
  shell?.classList.toggle('sidebar-open', state.sidebarOpen && !accessMode);
  shell?.classList.toggle('sidebar-collapsed', sidebarCollapsed && !accessMode);

  if (accessMode || !session) {
    NotificationService.stopRealtime?.();
    notificationSyncKey = '';
    stopNotificationSubscription?.();
    stopNotificationSubscription = null;
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

  const active = route?.view === 'canvas' ? 'toolkit' : (route?.view === 'clientPortal' ? 'clientPortal' : (route?.view || 'dashboard'));
  const readOnly = isReadOnlyRole(session);
  const navItems = readOnly
    ? createReadOnlyNav(session)
    : (session.role === 'reviewer'
      ? createReviewerNav()
      : internalNavItems.filter(item => !['cloud', 'usersAdmin'].includes(item[0]) || canManageCloudFoundation(session)));
  const notifications = NotificationService.list(session);
  const unreadCount = notifications.filter(item => !item.read).length;

  document.querySelector('#sidebar').innerHTML = `
    <div class="sidebar-inner">
      <div class="sidebar-brand">
        <div class="brand-logo"><img src="./assets/brand/logo-wonkup.png" alt="" onerror="const p=this.parentElement; this.remove(); if(p) p.textContent='W';"></div>
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
          const [key, label, iconName, customHref, enabled = true] = item;
          const href = customHref || navHref(key, selected);
          const itemActive = key === 'project' ? active === 'project' : active === key;
          const divider = key === 'usersAdmin' ? '<div class="nav-group-title">Administración</div>' : '';
          if (!enabled) return `${divider}<span class="nav-link nav-link-disabled" aria-disabled="true"><span class="nav-icon">${icon(iconName)}</span><span>${escapeHtml(label)}</span><span class="nav-soon">Próximamente</span></span>`;
          return `${divider}<a class="nav-link ${itemActive ? 'active' : ''}" href="${href}" ${itemActive ? 'aria-current="page"' : ''}><span class="nav-icon">${icon(iconName)}</span><span>${escapeHtml(label)}</span></a>`;
        }).join('')}
      </nav>

      <div class="sidebar-footer">
        <div class="sidebar-tip"><strong>WonkUp Workspace</strong>Organiza proyectos, equipo e innovación en un solo lugar.</div>
      </div>
    </div>`;

  const quickMenu = popover({
    id: 'quick-menu', triggerId: 'quick-add', className: 'header-popover compact-menu',
    body: `<div class="popover-title">Crear rápidamente</div><button role="menuitem" data-action="project">${icon('folder')}<span><strong>Nuevo proyecto</strong><small>Registra una nueva iniciativa</small></span></button><button role="menuitem" data-action="task">${icon('checkSquare')}<span><strong>Nueva tarea</strong><small>Crea una tarjeta en el Kanban</small></span></button><button role="menuitem" data-action="canvas">${icon('lightbulb')}<span><strong>Nuevo canvas</strong><small>Abre el Innovation Toolkit</small></span></button>`
  });

  const themeMenu = popover({
    id: 'theme-menu', triggerId: 'theme-button', className: 'header-popover theme-popover',
    body: `<div class="popover-title">Apariencia</div><button role="menuitemradio" data-theme="light">${icon('sun')}<span>Claro</span><i data-theme-check="light">${icon('check')}</i></button><button role="menuitemradio" data-theme="dark">${icon('moon')}<span>Oscuro</span><i data-theme-check="dark">${icon('check')}</i></button><button role="menuitemradio" data-theme="system">${icon('monitor')}<span>Sistema</span><i data-theme-check="system">${icon('check')}</i></button>`
  });

  const notificationMenu = popover({
    id: 'notification-menu', triggerId: 'notification-button', className: 'header-popover notification-popover',
    body: renderNotifications(notifications)
  });

  const profileMenu = popover({
    id: 'profile-menu', triggerId: 'profile-button', className: 'header-popover profile-dropdown',
    body: `<div class="profile-menu-info"><strong>${escapeHtml(session.user.name)}</strong><small>${escapeHtml(session.user.email || '')}</small><span>${escapeHtml(session.roleLabel)}</span></div><button role="menuitem" data-profile-action="preferences">${icon('sun')} Apariencia</button><button role="menuitem" data-profile-action="update">${icon('refresh')} <span>Actualizar aplicación<small>Versión ${escapeHtml(globalThis.WONKUP_API_CONFIG?.release || '12.3.0')}</small></span></button><div class="dropdown-divider"></div><button role="menuitem" id="logout-button" class="danger-menu-item">${icon('logout')} Cerrar sesión</button>`
  });

  const menuExpanded = desktopSidebar ? !sidebarCollapsed : Boolean(state.sidebarOpen);
  const menuLabel = desktopSidebar
    ? (sidebarCollapsed ? 'Mostrar menú lateral' : 'Ocultar menú lateral')
    : (state.sidebarOpen ? 'Cerrar menú lateral' : 'Abrir menú lateral');

  document.querySelector('#header').innerHTML = `
    <button class="header-icon-button shell-menu-button" id="menu-toggle" aria-label="${menuLabel}" aria-expanded="${menuExpanded}" aria-controls="sidebar" title="${menuLabel}">${icon('menu')}</button>
    <div class="header-workspace"><strong>${escapeHtml(current?.name || 'WonkUp Workspace')}</strong><small>${escapeHtml(current?.shortName || 'Centro de operaciones')}</small></div>
    ${isInternalUser(session) ? `<div class="header-search-wrap"><label class="sr-only" for="global-search">Búsqueda global de proyectos, tareas, entregables, clientes y canvases</label><div class="header-search">${icon('search')}<input id="global-search" type="search" autocomplete="off" placeholder="Buscar proyectos, tareas, entregables, clientes o canvases..." aria-controls="global-search-results" aria-expanded="false"><kbd>⌘ K</kbd></div>${popover({ id: 'global-search-results', triggerId: 'global-search', className: 'search-popover', body: '<div class="search-hint">Escribe al menos 2 caracteres para buscar.</div>' })}</div>` : '<div class="header-search-spacer"></div>'}
    <div class="header-actions">
      ${isInternalUser(session) ? `<div class="relative"><button class="header-icon-button" id="quick-add" aria-label="Abrir menú Crear" aria-expanded="false" aria-controls="quick-menu">${icon('plus')}</button>${quickMenu}</div>` : ''}
      <div class="relative"><button class="header-icon-button" id="theme-button" aria-label="Abrir opciones de apariencia" aria-expanded="false" aria-controls="theme-menu">${icon('sun')}</button>${themeMenu}</div>
      <div class="relative"><button class="header-icon-button" id="notification-button" aria-label="Notificaciones${unreadCount ? `, ${unreadCount} sin leer` : ''}" aria-expanded="false" aria-controls="notification-menu">${icon('bell')}${unreadCount ? `<span class="notification-dot" aria-hidden="true">${unreadCount > 9 ? '9+' : unreadCount}</span>` : ''}</button>${notificationMenu}</div>
      <div class="relative"><button class="profile-button" id="profile-button" aria-label="Abrir menú de perfil" aria-expanded="false" aria-controls="profile-menu"><span class="profile-avatar">${escapeHtml(session.user.initials || session.user.name.slice(0, 1))}</span><span class="profile-copy"><strong>${escapeHtml(session.user.name)}</strong><small>${escapeHtml(session.roleLabel)}</small></span>${icon('chevronDown', 'profile-chevron')}</button>${profileMenu}</div>
    </div>`;

  bindShellEvents(session, selected);
  updateThemeChecks(state.themePreference);
  startNotificationSync(session);
}

function renderNotifications(notifications) {
  if (!notifications.length) return `<div class="popover-title">Notificaciones</div><div class="notification-empty">${icon('bell')}<strong>Todo al día</strong><span>No tienes notificaciones pendientes.</span></div>`;
  return `<div class="popover-heading"><div><strong>Notificaciones</strong><small>${notifications.filter(item => !item.read).length} sin leer</small></div><button class="text-button" id="mark-all-read">Marcar todas</button></div><div class="notification-list">${notifications.map(item => `<a class="notification-item ${item.read ? 'read' : ''}" href="${escapeHtml(item.href)}" data-notification-id="${escapeHtml(item.id)}"><span class="notification-icon">${icon(notificationIcon(item.type))}</span><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.message)}</small><time>${relativeTime(item.createdAt)}</time></span>${item.read ? '' : '<i></i>'}</a>`).join('')}</div>`;
}

function notificationIcon(type) {
  if (['assignment', 'task_assigned'].includes(type)) return 'userPlus';
  if (['comment', 'task_comment'].includes(type)) return 'message';
  if (['wip', 'due_date_changed'].includes(type)) return 'alert';
  if (['review', 'task_moved'].includes(type)) return 'eye';
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


function updateNotificationUi(session) {
  const notifications = NotificationService.list(session);
  const unreadCount = notifications.filter(item => !item.read).length;
  const button = document.querySelector('#notification-button');
  const panel = document.querySelector('#notification-menu');
  if (button) {
    button.innerHTML = `${icon('bell')}${unreadCount ? `<span class="notification-dot" aria-hidden="true">${unreadCount > 9 ? '9+' : unreadCount}</span>` : ''}`;
    button.setAttribute('aria-label', `Notificaciones${unreadCount ? `, ${unreadCount} sin leer` : ''}`);
  }
  if (panel) {
    panel.innerHTML = renderNotifications(notifications);
    bindNotificationPanelEvents(session);
  }
}

function bindNotificationPanelEvents(session) {
  document.querySelectorAll('#notification-menu [data-notification-id]').forEach(item => {
    if (item.dataset.notificationBound === '1') return;
    item.dataset.notificationBound = '1';
    item.addEventListener('click', async () => {
      await NotificationService.markRead(item.dataset.notificationId, session).catch(() => {});
      closePopovers();
    });
  });

  const markAll = document.querySelector('#mark-all-read');
  if (markAll && markAll.dataset.notificationBound !== '1') {
    markAll.dataset.notificationBound = '1';
    markAll.addEventListener('click', async event => {
      event.stopPropagation();
      await NotificationService.markAllRead(session).catch(() => {});
      updateNotificationUi(session);
      closePopovers();
      showToast('Notificaciones marcadas como leídas.');
    });
  }
}

async function startNotificationSync(session) {
  if (session?.source !== 'firebase') return;
  const key = `${session.firebaseUid || ''}:${session.token || ''}`;
  if (notificationSyncKey !== key) {
    stopNotificationSubscription?.();
    stopNotificationSubscription = NotificationService.subscribe(() => updateNotificationUi(session));
    notificationSyncKey = key;
  }
  await NotificationService.hydrate(session).catch(() => []);
  await NotificationService.startRealtime(session).catch(() => () => {});
  updateNotificationUi(session);
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
    const button = document.querySelector('#menu-toggle');
    const shell = document.querySelector('#app-shell');
    if (matchMedia('(min-width: 981px)').matches) {
      const nextCollapsed = !shell?.classList.contains('sidebar-collapsed');
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, nextCollapsed ? '1' : '0');
      shell?.classList.toggle('sidebar-collapsed', nextCollapsed);
      button?.setAttribute('aria-expanded', String(!nextCollapsed));
      button?.setAttribute('aria-label', nextCollapsed ? 'Mostrar menú lateral' : 'Ocultar menú lateral');
      button?.setAttribute('title', nextCollapsed ? 'Mostrar menú lateral' : 'Ocultar menú lateral');
      return;
    }
    const nextOpen = !getState().sidebarOpen;
    setState({ sidebarOpen: nextOpen });
    button?.setAttribute('aria-expanded', String(nextOpen));
    button?.setAttribute('aria-label', nextOpen ? 'Cerrar menú lateral' : 'Abrir menú lateral');
    button?.setAttribute('title', nextOpen ? 'Cerrar menú lateral' : 'Abrir menú lateral');
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
        sessionStorage.setItem('wonkup.intent.newTask', '1');
        const target = selectedWorkspaceId === 'all' ? '#/master/kanban' : `#/w/${selectedWorkspaceId}/kanban`;
        if (location.hash === target) window.dispatchEvent(new HashChangeEvent('hashchange'));
        else location.hash = target;
      } else if (action === 'canvas') {
        sessionStorage.setItem('wonkup.intent.newCanvas', '1');
        const target = selectedWorkspaceId === 'all' ? '#/master/toolkit' : `#/w/${selectedWorkspaceId}/toolkit`;
        if (location.hash === target) window.dispatchEvent(new HashChangeEvent('hashchange'));
        else location.hash = target;
      } else {
        showToast('Tu rol no permite realizar esta acción.');
      }
      closePopovers();
    });
  });

  bindNotificationPanelEvents(session);

  document.querySelector('[data-profile-action="preferences"]')?.addEventListener('click', () => {
    closePopovers();
    const trigger = document.querySelector('#theme-button');
    const panel = document.querySelector('#theme-menu');
    if (trigger && panel) togglePopover(trigger, panel);
  });

  document.querySelector('[data-profile-action="update"]')?.addEventListener('click', () => {
    closePopovers();
    const url = new URL(location.href);
    url.searchParams.set('v', String(Date.now()));
    location.replace(url.toString());
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
    const selected = check.dataset.themeCheck === preference;
    check.classList.toggle('visible', selected);
    check.closest('button')?.setAttribute('aria-checked', String(selected));
  });
}
