import { createAppShell, renderShell } from './components/app-shell.js';
import { startRouter } from './router.js';
import { getState, subscribe, setState, setSession, clearSession } from './state/store.js';
import { AccessService } from './services/access-service.js';
import { canAccessRoute, canAccessWorkspace, getDefaultRoute } from './utils/permissions.js';
import { renderAccess } from './views/access-view.js';
import { renderForbidden } from './views/forbidden-view.js';
import { renderDashboard } from './views/dashboard-view.js';
import { renderProjects } from './views/projects-view.js';
import { renderProject } from './views/project-view.js';
import { renderToolkit, cleanupToolkitView } from './views/toolkit-view.js';
import { renderCanvas, renderSharedCanvas, cleanupCanvasView } from './views/canvas-view.js?v=5.8.0';
import { renderKanban, cleanupKanbanView } from './views/kanban-view.js';
import { renderPlaceholder } from './views/placeholder-view.js';
import { renderClients } from './views/clients-view.js';
import { icon } from './utils/icons.js';

const shell = createAppShell();
let sessionExpiryTimer = null;
let lastSessionToken = getState().session?.token || null;
let routeSequence = 0;

function scheduleSessionExpiry(session) {
  clearTimeout(sessionExpiryTimer);
  if (!session?.expiresAt) return;
  const remaining = new Date(session.expiresAt).getTime() - Date.now();
  if (remaining <= 0) {
    clearSession();
    location.hash = '#/access?reason=expired';
    return;
  }
  sessionExpiryTimer = setTimeout(() => {
    clearSession();
    location.hash = '#/access?reason=expired';
  }, Math.min(remaining, 2147483647));
}

function applyTheme(preference) {
  const resolved = preference === 'system'
    ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : preference;
  document.documentElement.dataset.theme = resolved;
}

applyTheme(getState().themePreference);
subscribe(state => {
  applyTheme(state.themePreference);
  document.querySelector('#app-shell')?.classList.toggle('sidebar-open', state.sidebarOpen);
  const menuButton = document.querySelector('#menu-toggle');
  if (menuButton) {
    const desktopSidebar = matchMedia('(min-width: 981px)').matches;
    const collapsed = document.querySelector('#app-shell')?.classList.contains('sidebar-collapsed');
    const expanded = desktopSidebar ? !collapsed : Boolean(state.sidebarOpen);
    const label = desktopSidebar
      ? (collapsed ? 'Mostrar menú lateral' : 'Ocultar menú lateral')
      : (state.sidebarOpen ? 'Cerrar menú lateral' : 'Abrir menú lateral');
    menuButton.setAttribute('aria-expanded', String(expanded));
    menuButton.setAttribute('aria-label', label);
    menuButton.setAttribute('title', label);
  }
  const nextToken = state.session?.token || null;
  if (nextToken !== lastSessionToken) {
    lastSessionToken = nextToken;
    scheduleSessionExpiry(state.session);
  }
});

matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (getState().themePreference === 'system') applyTheme('system');
});

async function bootstrap() {
  let state = getState();

  if (state.session) {
    try {
      const validated = await AccessService.validateSession(state.session);
      if (validated) {
        setSession(validated);
        scheduleSessionExpiry(validated);
      }
      else clearSession();
    } catch {
      clearSession();
    }
  }

  scheduleSessionExpiry(getState().session);
  startRouter(handleRoute);

  if (!location.hash) {
    location.hash = getDefaultRoute(getState().session);
  }
}

function createRouteHost(route) {
  const host = document.createElement('div');
  host.className = `route-host route-host-${route.view}`;
  host.dataset.routeSequence = String(++routeSequence);
  host.dataset.routeHash = route.hash || '';
  shell.main.replaceChildren(host);
  return host;
}

function cleanupActiveViews() {
  cleanupCanvasView();
  cleanupToolkitView();
  cleanupKanbanView();
}

function handleRoute(route) {
  cleanupActiveViews();
  const state = getState();
  const session = state.session;

  if (route.view === 'sharedCanvas') {
    renderShell({ view: 'access', params: {} });
    const host = createRouteHost(route);
    renderSharedCanvas(host, route.params.token);
    return;
  }

  if (route.view === 'access') {
    if (session) {
      location.hash = getDefaultRoute(session);
      return;
    }
    renderShell(route);
    const host = createRouteHost(route);
    renderAccess(host, { reason: route.params.reason });
    return;
  }

  if (!session) {
    location.hash = '#/access';
    return;
  }

  if (!canAccessRoute(route, session)) {
    renderShell({ view: 'forbidden', params: {} });
    const host = createRouteHost({ ...route, view: 'forbidden' });
    renderForbidden(host, session);
    return;
  }

  const routeWorkspace = route.params.workspaceId;
  if (routeWorkspace && routeWorkspace !== 'all' && canAccessWorkspace(session, routeWorkspace) && routeWorkspace !== state.selectedWorkspaceId) {
    setState({ selectedWorkspaceId: routeWorkspace, sidebarOpen: false });
  }
  if (routeWorkspace === 'all' && state.selectedWorkspaceId !== 'all') {
    setState({ selectedWorkspaceId: 'all', sidebarOpen: false });
  }

  renderShell(route);
  const host = createRouteHost(route);
  const workspaceId = routeWorkspace || getState().selectedWorkspaceId;

  switch (route.view) {
    case 'dashboard':
      renderDashboard(host, workspaceId, session);
      break;
    case 'projects':
      renderProjects(host, workspaceId, session);
      break;
    case 'project':
      renderProject(host, route.params, session);
      break;
    case 'toolkit':
      renderToolkit(host, workspaceId, null, false, session);
      break;
    case 'canvas':
      renderCanvas(host, route.params, session);
      break;
    case 'kanban':
      renderKanban(host, workspaceId, null, false, session);
      break;
    case 'clients':
      renderClients(host, workspaceId, session);
      break;
    case 'placeholder':
      renderPlaceholder(host, route.params.section);
      break;
    case 'forbidden':
      renderForbidden(host, session);
      break;
    default:
      host.innerHTML = `<section class="page"><div class="empty-state"><div class="empty-state-icon">${icon('alert')}</div><h1>Ruta no encontrada</h1><p>Regresa a tu espacio autorizado para continuar.</p><a class="button button-primary" href="${getDefaultRoute(session)}">Volver</a></div></section>`;
  }

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
  requestAnimationFrame(() => {
    if (!host.isConnected) return;
    const heading = host.querySelector('h1');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    } else {
      shell.main.focus({ preventScroll: true });
    }
  });
}

bootstrap();
