function listWorkspacesForSession_(payload) {
  var session = validateSessionToken_(payload.sessionToken);
  if (!session) throw new Error('Sesión inválida o vencida.');

  var allowed = session.scopes.workspaceIds;
  return getObjects_(WONKUP_CONFIG.sheets.workspaces)
    .filter(function(workspace) {
      return String(workspace.status) === 'active' && (allowed.indexOf('*') >= 0 || allowed.indexOf(String(workspace.id)) >= 0);
    })
    .map(function(workspace) {
      return {
        id: String(workspace.id),
        code: String(workspace.code),
        name: String(workspace.name),
        shortName: String(workspace.short_name || workspace.name),
        description: String(workspace.description || ''),
        logoUrl: String(workspace.logo_url || ''),
        status: String(workspace.status)
      };
    });
}
