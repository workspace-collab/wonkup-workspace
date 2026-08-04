export const ROLE_LABELS = Object.freeze({
  superadmin: 'Superadministrador',
  workspace_admin: 'Administrador de workspace',
  project_lead: 'Líder de proyecto',
  collaborator: 'Colaborador',
  client: 'Cliente',
  guest: 'Invitado'
});

const INTERNAL_ROLES = new Set(['superadmin', 'workspace_admin', 'project_lead', 'collaborator']);
const MANAGEMENT_ROLES = new Set(['superadmin', 'workspace_admin']);

function scopeIncludes(scope = [], id) {
  return scope.includes('*') || scope.includes(id);
}

export function isInternalUser(session) {
  return Boolean(session && INTERNAL_ROLES.has(session.role));
}

export function canViewMaster(session) {
  return session?.role === 'superadmin';
}

export function canAccessWorkspace(session, workspaceId) {
  if (!session || !workspaceId) return false;
  return scopeIncludes(session.scopes?.workspaceIds, workspaceId);
}

export function canAccessProject(session, projectId, workspaceId = null) {
  if (!session || !projectId) return false;
  if (workspaceId && !canAccessWorkspace(session, workspaceId)) return false;
  return scopeIncludes(session.scopes?.projectIds, projectId);
}

export function canCreateProject(session) {
  return Boolean(session && MANAGEMENT_ROLES.has(session.role));
}

export function canEditProject(session, projectId, workspaceId) {
  if (!session || !canAccessProject(session, projectId, workspaceId)) return false;
  return MANAGEMENT_ROLES.has(session.role) || session.role === 'project_lead';
}

export function canArchiveProject(session, workspaceId) {
  return Boolean(session && MANAGEMENT_ROLES.has(session.role) && canAccessWorkspace(session, workspaceId));
}

export function canManageWorkspace(session) {
  return Boolean(session && MANAGEMENT_ROLES.has(session.role));
}

export function canManageClients(session) {
  return Boolean(session && MANAGEMENT_ROLES.has(session.role));
}

export function canManageProjectTeam(session, projectId, workspaceId) {
  return canEditProject(session, projectId, workspaceId);
}

export function canManageProjectResources(session, projectId, workspaceId) {
  return canEditProject(session, projectId, workspaceId) || session?.role === 'collaborator';
}

export function canViewFinancials(session) {
  return Boolean(session && MANAGEMENT_ROLES.has(session.role));
}

export function canEditKanban(session) {
  return Boolean(session && INTERNAL_ROLES.has(session.role));
}


export function canConfigureKanban(session) {
  return Boolean(session && ['superadmin', 'workspace_admin', 'project_lead'].includes(session.role));
}

export function canDeleteKanbanCard(session) {
  return Boolean(session && MANAGEMENT_ROLES.has(session.role));
}

export function canEditCanvas(session) {
  return Boolean(session && INTERNAL_ROLES.has(session.role));
}

export function canManageCanvas(session) {
  return Boolean(session && ['superadmin', 'workspace_admin', 'project_lead'].includes(session.role));
}

export function canDeleteCanvas(session) {
  return Boolean(session && MANAGEMENT_ROLES.has(session.role));
}

export function isReadOnlyRole(session) {
  return Boolean(session && ['client', 'guest'].includes(session.role));
}

export function getDefaultRoute(session) {
  if (!session) return '#/access';
  if (canViewMaster(session)) return '#/master/dashboard';

  const workspaceId = session.scopes?.workspaceIds?.find(id => id !== '*');
  const projectId = session.scopes?.projectIds?.find(id => id !== '*');

  if (isReadOnlyRole(session) && workspaceId && projectId) {
    return `#/w/${workspaceId}/p/${projectId}/summary`;
  }

  if (workspaceId) return `#/w/${workspaceId}/dashboard`;
  return '#/access';
}

export function canAccessRoute(route, session) {
  if (route.view === 'access') return true;
  if (!session) return false;
  if (route.view === 'forbidden' || route.view === 'notFound') return true;

  if (route.params?.workspaceId === 'all') return canViewMaster(session);
  if (route.hash?.startsWith('#/master/')) return canViewMaster(session);

  if (['dashboard', 'projects', 'toolkit', 'kanban', 'clients', 'placeholder'].includes(route.view)) {
    if (!isInternalUser(session)) return false;
    return canAccessWorkspace(session, route.params?.workspaceId);
  }

  if (route.view === 'canvas') {
    if (!isInternalUser(session)) return false;
    return canAccessProject(session, route.params?.projectId, route.params?.workspaceId);
  }

  if (route.view === 'project') {
    const allowed = canAccessProject(session, route.params?.projectId, route.params?.workspaceId);
    if (!allowed) return false;

    if (['client', 'guest'].includes(session.role)) {
      return route.params?.tab === 'summary';
    }

    if (route.params?.tab === 'finance' && !canViewFinancials(session)) return false;
    return true;
  }

  return true;
}
