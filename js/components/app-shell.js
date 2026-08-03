import { icon } from '../utils/icons.js';
import { DemoService } from '../services/demo-service.js';
import { getState, setState } from '../state/store.js';
import { showToast } from './toast.js';

const navItems = [
  ['dashboard','Dashboard','home'], ['projects','Mis proyectos','folder'], ['toolkit','Innovation Toolkit','lightbulb'],
  ['kanban','Kanban','kanban'], ['calendar','Calendario','calendar'], ['team','Equipo','users'],
  ['clients','Clientes','user'], ['documents','Documentos','file'], ['reports','Reportes','chart'], ['settings','Configuracion','settings']
];

function workspaceBase(id) { return id === 'all' ? '#/master' : `#/w/${id}`; }
function navHref(key, workspaceId) {
  if (['dashboard','projects'].includes(key)) return `${workspaceBase(workspaceId)}/${key}`;
  if (['toolkit','kanban'].includes(key) && workspaceId !== 'all') return `${workspaceBase(workspaceId)}/${key}`;
  return `#/placeholder/${key}`;
}

export function createAppShell() {
  const app = document.querySelector('#app');
  app.innerHTML = `<div class="app-shell" id="app-shell"><aside class="app-sidebar" id="sidebar"></aside><header class="app-header" id="header"></header><main class="app-main" id="main-view"></main><button class="sidebar-backdrop" id="sidebar-backdrop" aria-label="Cerrar menu"></button></div>`;
  document.querySelector('#sidebar-backdrop').addEventListener('click', () => setState({ sidebarOpen: false }));
  renderShell();
  return { main: document.querySelector('#main-view'), renderShell };
}

export function renderShell(route = null) {
  const state = getState();
  const shell = document.querySelector('#app-shell');
  shell?.classList.toggle('sidebar-open', state.sidebarOpen);
  const workspaces = DemoService.getWorkspaces();
  const selected = state.selectedWorkspaceId;
  const current = selected === 'all' ? { name: 'Panel Maestro', shortName: 'Todos los workspaces' } : DemoService.getWorkspace(selected);
  const active = route?.view || 'dashboard';
  document.querySelector('#sidebar').innerHTML = `
    <div class="sidebar-inner">
      <div class="sidebar-brand"><div class="brand-logo"><img src="./assets/brand/logo-wonkup.png" alt="" onerror="this.remove(); this.parentElement.textContent='W';"></div><div class="brand-copy"><strong>WonkUp</strong><small>Workspace</small></div></div>
      <div class="sidebar-workspace"><label class="sidebar-label" for="workspace-select">Workspace</label><select class="sidebar-select" id="workspace-select"><option value="all">Panel Maestro WonkUp</option>${workspaces.map(w=>`<option value="${w.id}" ${w.id===selected?'selected':''}>${w.name}</option>`).join('')}</select></div>
      <nav class="sidebar-nav" aria-label="Navegacion principal">
        ${navItems.map(([key,label,ico],i)=>`${i===9?'<div class="nav-group-title">Administracion</div>':''}<a class="nav-link ${active===key?'active':''}" href="${navHref(key,selected)}"><span class="nav-icon">${icon(ico)}</span>${label}</a>`).join('')}
      </nav>
      <div class="sidebar-footer"><div class="sidebar-tip"><strong>Entrega 1</strong>Nucleo visual con datos demostrativos. Las integraciones reales se conectaran en las siguientes entregas.</div></div>
    </div>`;
  document.querySelector('#header').innerHTML = `
    <button class="header-icon-button mobile-menu-button" id="menu-toggle" aria-label="Abrir menu">${icon('menu')}</button>
    <div class="header-workspace"><strong>${current?.name || 'WonkUp Workspace'}</strong><small>${current?.shortName || 'Centro de operaciones'}</small></div>
    <label class="header-search"><span class="sr-only">Buscar</span>${icon('search')}<input id="global-search" type="search" placeholder="Buscar en WonkUp..."></label>
    <div class="header-actions">
      <div class="relative"><button class="header-icon-button" id="quick-add" aria-label="Crear">${icon('plus')}</button><div class="dropdown hidden" id="quick-menu"><button data-action="project">${icon('folder')} Nuevo proyecto</button><button data-action="task">${icon('check')} Nueva tarea</button><button data-action="canvas">${icon('lightbulb')} Nuevo canvas</button></div></div>
      <div class="relative"><button class="header-icon-button" id="theme-button" aria-label="Cambiar tema">${icon('sun')}</button><div class="dropdown hidden" id="theme-menu"><button data-theme="light">${icon('sun')} Claro</button><button data-theme="dark">${icon('moon')} Oscuro</button><button data-theme="system">${icon('monitor')} Sistema</button></div></div>
      <button class="header-icon-button" aria-label="Notificaciones">${icon('bell')}<span class="notification-dot">3</span></button>
      <button class="profile-button"><span class="profile-avatar">R</span><span class="profile-copy"><strong>Rodrigo</strong><small>Superadmin</small></span></button>
    </div>`;
  bindShellEvents();
}

function bindShellEvents() {
  document.querySelector('#workspace-select')?.addEventListener('change', e => {
    setState({ selectedWorkspaceId: e.target.value, sidebarOpen: false });
    location.hash = e.target.value === 'all' ? '#/master/dashboard' : `#/w/${e.target.value}/dashboard`;
  });
  document.querySelector('#menu-toggle')?.addEventListener('click', () => setState({ sidebarOpen: !getState().sidebarOpen }));
  document.querySelector('#quick-add')?.addEventListener('click', () => document.querySelector('#quick-menu').classList.toggle('hidden'));
  document.querySelector('#theme-button')?.addEventListener('click', () => document.querySelector('#theme-menu').classList.toggle('hidden'));
  document.querySelectorAll('#theme-menu [data-theme]').forEach(btn => btn.addEventListener('click', () => { setState({ themePreference: btn.dataset.theme }); document.querySelector('#theme-menu').classList.add('hidden'); }));
  document.querySelectorAll('#quick-menu [data-action]').forEach(btn => btn.addEventListener('click', () => { showToast('Esta accion se habilitara en las siguientes entregas.'); document.querySelector('#quick-menu').classList.add('hidden'); }));
  document.querySelector('#global-search')?.addEventListener('keydown', e => { if (e.key === 'Enter') showToast(`Busqueda demo: ${e.target.value || 'sin termino'}`); });
}
