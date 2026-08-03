import { APP_CONFIG } from '../config/app-config.js';

const listeners = new Set();
const storedWorkspace = localStorage.getItem('wonkup.workspace') || APP_CONFIG.defaultWorkspaceId;
const storedTheme = localStorage.getItem('wonkup.theme') || APP_CONFIG.defaultTheme;

const state = {
  selectedWorkspaceId: storedWorkspace,
  themePreference: storedTheme,
  sidebarOpen: false,
  user: { id: 'demo-admin', name: 'Rodrigo', role: 'Superadministrador' }
};

export function getState() { return { ...state }; }
export function subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); }
export function setState(patch) {
  Object.assign(state, patch);
  if ('selectedWorkspaceId' in patch) localStorage.setItem('wonkup.workspace', state.selectedWorkspaceId);
  if ('themePreference' in patch) localStorage.setItem('wonkup.theme', state.themePreference);
  listeners.forEach(listener => listener(getState()));
}
