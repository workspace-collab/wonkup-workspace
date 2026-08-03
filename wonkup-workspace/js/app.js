import { createAppShell, renderShell } from './components/app-shell.js';
import { startRouter } from './router.js';
import { getState, subscribe, setState } from './state/store.js';
import { renderDashboard } from './views/dashboard-view.js';
import { renderProjects } from './views/projects-view.js';
import { renderProject } from './views/project-view.js';
import { renderToolkit } from './views/toolkit-view.js';
import { renderKanban } from './views/kanban-view.js';
import { renderPlaceholder } from './views/placeholder-view.js';
import { icon } from './utils/icons.js';

const shell=createAppShell();
let currentRoute=null;
function applyTheme(preference){
  const resolved=preference==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):preference;
  document.documentElement.dataset.theme=resolved;
}
applyTheme(getState().themePreference);
subscribe(state=>{ applyTheme(state.themePreference); document.querySelector('#app-shell')?.classList.toggle('sidebar-open',state.sidebarOpen); });
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{if(getState().themePreference==='system')applyTheme('system');});

startRouter(route=>{
  currentRoute=route;
  const state=getState();
  const routeWorkspace=route.params.workspaceId;
  if(routeWorkspace && routeWorkspace!==state.selectedWorkspaceId) setState({selectedWorkspaceId:routeWorkspace,sidebarOpen:false});
  renderShell(route);
  const workspaceId=routeWorkspace||getState().selectedWorkspaceId;
  switch(route.view){
    case 'dashboard': renderDashboard(shell.main,workspaceId); break;
    case 'projects': renderProjects(shell.main,workspaceId); break;
    case 'project': renderProject(shell.main,route.params); break;
    case 'toolkit': renderToolkit(shell.main,workspaceId); break;
    case 'kanban': renderKanban(shell.main,workspaceId); break;
    case 'placeholder': renderPlaceholder(shell.main,route.params.section); break;
    default: shell.main.innerHTML=`<section class="page"><div class="empty-state"><div class="empty-state-icon">${icon('alert')}</div><h3>Ruta no encontrada</h3><p>Regresa al Dashboard para continuar.</p><a class="button button-primary" href="#/master/dashboard">Ir al Dashboard</a></div></section>`;
  }
  window.scrollTo({top:0,behavior:'smooth'});
});
