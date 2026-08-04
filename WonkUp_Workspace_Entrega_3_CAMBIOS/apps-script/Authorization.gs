function requireSession_(plainToken) {
  var session = validateSessionToken_(plainToken);
  if (!session) throw new Error('Sesión inválida o vencida.');
  return session;
}

function scopeIncludes_(scope, id) {
  return (scope || []).indexOf('*') >= 0 || (scope || []).indexOf(String(id)) >= 0;
}

function canViewMaster_(session) {
  return session && String(session.role) === 'superadmin';
}

function canAccessWorkspace_(session, workspaceId) {
  return session && scopeIncludes_(session.scopes.workspaceIds, workspaceId);
}

function canAccessProject_(session, project) {
  if (!session || !project) return false;
  if (!canAccessWorkspace_(session, project.workspace_id)) return false;
  return scopeIncludes_(session.scopes.projectIds, project.id);
}

function isManagementRole_(session) {
  return session && ['superadmin', 'workspace_admin'].indexOf(String(session.role)) >= 0;
}

function canEditProject_(session, project) {
  if (!canAccessProject_(session, project)) return false;
  return isManagementRole_(session) || String(session.role) === 'project_lead';
}

function canManageResources_(session, project) {
  return canEditProject_(session, project) || String(session.role) === 'collaborator';
}

function isReadOnlyRole_(session) {
  return session && ['client', 'guest'].indexOf(String(session.role)) >= 0;
}

function assertWorkspaceAccess_(session, workspaceId) {
  if (!canAccessWorkspace_(session, workspaceId)) throw new Error('No tienes acceso a este workspace.');
}

function assertManagementRole_(session) {
  if (!isManagementRole_(session)) throw new Error('Tu rol no permite realizar esta acción.');
}

function assertProjectAccess_(session, project) {
  if (!canAccessProject_(session, project)) throw new Error('Proyecto no encontrado o no autorizado.');
}

function assertProjectEdit_(session, project) {
  if (!canEditProject_(session, project)) throw new Error('Tu rol no permite editar este proyecto.');
}
