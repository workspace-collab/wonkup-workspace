export const ROLE_LABELS = Object.freeze({
  superadmin: 'Superadministrador',
  workspace_admin: 'Administrador de workspace',
  project_lead: 'Líder de proyecto',
  collaborator: 'Colaborador',
  reviewer: 'Revisor',
  client: 'Cliente',
  guest: 'Invitado'
});

const INTERNAL_ROLES = new Set(['superadmin', 'workspace_admin', 'project_lead', 'collaborator']);
const MANAGEMENT_ROLES = new Set(['superadmin', 'workspace_admin']);

export function getWorkspaceRole(session, workspaceId = null) {
  if (!session) return null;
  if (session.role === 'superadmin') return 'superadmin';
  if (workspaceId && session.workspaceRoles?.[workspaceId]) return session.workspaceRoles[workspaceId];
  return session.role || null;
}

export function getProjectRole(session, projectId = null, workspaceId = null) {
  if (!session) return null;
  const workspaceRole = getWorkspaceRole(session, workspaceId);
  if (['superadmin', 'workspace_admin'].includes(workspaceRole)) return workspaceRole;
  if (projectId && session.projectRoles?.[projectId]) return session.projectRoles[projectId];
  return workspaceRole;
}

export function canManageCloudFoundation(session) {
  return session?.role === 'superadmin';
}


function hasAnyMappedRole(session, roles) {
  if (!session) return false;
  if (roles.has(session.role)) return true;
  return Object.values(session.workspaceRoles || {}).some(role => roles.has(role));
}

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

export function canCreateProject(session, workspaceId = null) {
  if (!session) return false;
  return workspaceId
    ? MANAGEMENT_ROLES.has(getWorkspaceRole(session, workspaceId))
    : hasAnyMappedRole(session, MANAGEMENT_ROLES);
}

export function canEditProject(session, projectId, workspaceId) {
  if (!session || !canAccessProject(session, projectId, workspaceId)) return false;
  const role = getProjectRole(session, projectId, workspaceId);
  return MANAGEMENT_ROLES.has(role) || role === 'project_lead';
}

export function canArchiveProject(session, workspaceId) {
  return Boolean(session && MANAGEMENT_ROLES.has(getWorkspaceRole(session, workspaceId)) && canAccessWorkspace(session, workspaceId));
}

export function canManageWorkspace(session) {
  return hasAnyMappedRole(session, MANAGEMENT_ROLES);
}

export function canManageClients(session, workspaceId = null) {
  if (!session) return false;
  return workspaceId
    ? MANAGEMENT_ROLES.has(getWorkspaceRole(session, workspaceId))
    : hasAnyMappedRole(session, MANAGEMENT_ROLES);
}

export function canCreateWorkspaceUser(session, workspaceId) {
  if (!session || !workspaceId || !canAccessWorkspace(session, workspaceId)) return false;
  return ['superadmin', 'workspace_admin', 'project_lead'].includes(getWorkspaceRole(session, workspaceId));
}

export function canManageProjectTeam(session, projectId, workspaceId) {
  return canEditProject(session, projectId, workspaceId);
}

export function canManageProjectResources(session, projectId, workspaceId) {
  if (!session || !canAccessProject(session, projectId, workspaceId)) return false;
  return INTERNAL_ROLES.has(getProjectRole(session, projectId, workspaceId));
}

export function canViewReports(session) {
  return Boolean(session && INTERNAL_ROLES.has(session.role));
}

export function canViewFinancials(session) {
  return hasAnyMappedRole(session, MANAGEMENT_ROLES);
}

export function canAccessProjectFinance(session, projectId, workspaceId) {
  if (!session || !isInternalUser(session)) return false;
  return canAccessProject(session, projectId, workspaceId);
}

export function canManageProjectFinance(session, projectId, workspaceId) {
  if (!canAccessProjectFinance(session, projectId, workspaceId)) return false;
  const role = getProjectRole(session, projectId, workspaceId);
  return MANAGEMENT_ROLES.has(role) || role === 'project_lead';
}

export function canConfigureProjectFinance(session, projectId, workspaceId) {
  if (!canAccessProjectFinance(session, projectId, workspaceId)) return false;
  return MANAGEMENT_ROLES.has(getWorkspaceRole(session, workspaceId));
}

export function canViewProjectProfitability(session, projectId, workspaceId) {
  return canConfigureProjectFinance(session, projectId, workspaceId);
}

export function canLogProjectTime(session, projectId, workspaceId) {
  return canAccessProjectFinance(session, projectId, workspaceId);
}

export function canViewAllProjectTime(session, projectId, workspaceId) {
  if (!canAccessProjectFinance(session, projectId, workspaceId)) return false;
  const role = getProjectRole(session, projectId, workspaceId);
  return MANAGEMENT_ROLES.has(role) || role === 'project_lead';
}

export function canViewKanban(session, projectId = null, workspaceId = null) {
  if (!session) return false;
  if (projectId && !canAccessProject(session, projectId, workspaceId)) return false;
  const role = getProjectRole(session, projectId, workspaceId);
  return INTERNAL_ROLES.has(role) || role === 'reviewer';
}

export function canEditKanban(session, projectId = null, workspaceId = null) {
  if (!canViewKanban(session, projectId, workspaceId)) return false;
  return INTERNAL_ROLES.has(getProjectRole(session, projectId, workspaceId));
}

export function canCommentKanban(session, projectId = null, workspaceId = null) {
  if (!canViewKanban(session, projectId, workspaceId)) return false;
  return ['superadmin', 'workspace_admin', 'project_lead', 'collaborator', 'reviewer'].includes(
    getProjectRole(session, projectId, workspaceId)
  );
}

export function canConfigureKanban(session, projectId = null, workspaceId = null) {
  if (!canViewKanban(session, projectId, workspaceId)) return false;
  return ['superadmin', 'workspace_admin', 'project_lead'].includes(
    getProjectRole(session, projectId, workspaceId)
  );
}

export function canDeleteKanbanCard(session, projectId = null, workspaceId = null) {
  if (!canViewKanban(session, projectId, workspaceId)) return false;
  return MANAGEMENT_ROLES.has(getWorkspaceRole(session, workspaceId));
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


export function canViewDeliverables(session, projectId, workspaceId) {
  return Boolean(session && canAccessProject(session, projectId, workspaceId));
}

export function canManageDeliverables(session, projectId, workspaceId) {
  if (!session || !canAccessProject(session, projectId, workspaceId)) return false;
  return INTERNAL_ROLES.has(getProjectRole(session, projectId, workspaceId));
}

export function canReviewDeliverable(session, projectId, workspaceId) {
  if (!session || !canAccessProject(session, projectId, workspaceId)) return false;
  const role = getProjectRole(session, projectId, workspaceId);
  return role === 'client' || MANAGEMENT_ROLES.has(role);
}

export function canCommentDeliverable(session, projectId, workspaceId) {
  if (!session || !canAccessProject(session, projectId, workspaceId)) return false;
  return getProjectRole(session, projectId, workspaceId) !== 'guest';
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
    return `#/portal/w/${workspaceId}/p/${projectId}/overview`;
  }

  if (workspaceId) return `#/w/${workspaceId}/dashboard`;
  return '#/access';
}

export function canAccessRoute(route, session) {
  if (route.view === 'access') return true;
  if (!session) return false;
  if (route.view === 'forbidden' || route.view === 'notFound') return true;

  if (route.params?.workspaceId === 'all') return canViewMaster(session);
  if (route.view === 'cloud') return canManageCloudFoundation(session);
  if (route.hash?.startsWith('#/master/')) return canViewMaster(session);

  if (route.view === 'kanban') {
    if (!canAccessWorkspace(session, route.params?.workspaceId)) return false;
    if (route.params?.projectId) return canViewKanban(session, route.params.projectId, route.params.workspaceId);
    return isInternalUser(session) || session.role === 'reviewer';
  }

  if (['dashboard', 'projects'].includes(route.view) && session.role === 'reviewer') {
    return canAccessWorkspace(session, route.params?.workspaceId);
  }

  if (['dashboard', 'projects', 'toolkit', 'clients', 'reports', 'placeholder'].includes(route.view)) {
    if (!isInternalUser(session)) return false;
    return canAccessWorkspace(session, route.params?.workspaceId);
  }

  if (route.view === 'canvas') {
    if (!isInternalUser(session)) return false;
    return canAccessProject(session, route.params?.projectId, route.params?.workspaceId);
  }

  if (route.view === 'clientPortal') {
    return canAccessProject(session, route.params?.projectId, route.params?.workspaceId);
  }

  if (route.view === 'project') {
    const allowed = canAccessProject(session, route.params?.projectId, route.params?.workspaceId);
    if (!allowed) return false;

    if (['client', 'guest'].includes(session.role)) {
      return route.params?.tab === 'summary';
    }

    if (route.params?.tab === 'finance' && !canAccessProjectFinance(session, route.params?.projectId, route.params?.workspaceId)) return false;
    return true;
  }

  return true;
}
