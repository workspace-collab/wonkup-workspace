import { APP_CONFIG } from '../config/app-config.js?v=12.0.1';

const listeners = new Set();
const SESSION_KEY = 'wonkup.session';
const WORKSPACE_KEY = 'wonkup.workspace';
const THEME_KEY = 'wonkup.theme';

function readStoredSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session?.expiresAt || new Date(session.expiresAt).getTime() <= Date.now()) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

const state = {
  selectedWorkspaceId: localStorage.getItem(WORKSPACE_KEY) || APP_CONFIG.defaultWorkspaceId,
  themePreference: localStorage.getItem(THEME_KEY) || APP_CONFIG.defaultTheme,
  sidebarOpen: false,
  session: readStoredSession(),
  sessionStatus: 'idle'
};

function emit() {
  const snapshot = getState();
  listeners.forEach(listener => listener(snapshot));
}

export function getState() {
  return {
    ...state,
    session: state.session ? {
      ...state.session,
      user: { ...state.session.user },
      scopes: {
        workspaceIds: [...(state.session.scopes?.workspaceIds || [])],
        projectIds: [...(state.session.scopes?.projectIds || [])]
      },
      workspaceRoles: { ...(state.session.workspaceRoles || {}) },
      projectRoles: { ...(state.session.projectRoles || {}) },
      workspaces: Array.isArray(state.session.workspaces)
        ? state.session.workspaces.map(item => ({ ...item }))
        : []
    } : null
  };
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setState(patch) {
  Object.assign(state, patch);
  if ('selectedWorkspaceId' in patch) localStorage.setItem(WORKSPACE_KEY, state.selectedWorkspaceId);
  if ('themePreference' in patch) localStorage.setItem(THEME_KEY, state.themePreference);
  emit();
}

export function setSession(session) {
  state.session = session;
  if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else sessionStorage.removeItem(SESSION_KEY);
  emit();
}

export function clearSession() {
  state.session = null;
  state.selectedWorkspaceId = APP_CONFIG.defaultWorkspaceId;
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(WORKSPACE_KEY);
  emit();
}
