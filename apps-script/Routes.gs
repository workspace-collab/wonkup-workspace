function routeRequest_(action, payload) {
  switch (action) {
    case 'health': return { status: 'ok', version: '0.8.1' };
    case 'auth.exchangeCode': return exchangeAccessCode_(payload);
    case 'auth.validate':
      var session = validateSessionToken_(payload.sessionToken);
      if (!session) throw new Error('Sesión inválida o vencida.');
      return session;
    case 'auth.revoke': return revokeSessionToken_(payload.sessionToken);
    case 'workspaces.list': return listWorkspacesForSession_(payload);

    case 'projects.list': return listProjects_(payload);
    case 'projects.get': return getProjectForSession_(payload);
    case 'projects.create': return createProject_(payload);
    case 'projects.update': return updateProject_(payload);
    case 'projects.archive': return archiveProject_(payload);
    case 'projects.restore': return restoreProject_(payload);

    case 'clients.list': return listClients_(payload);
    case 'clients.create': return createClient_(payload);
    case 'clients.update': return updateClient_(payload);
    case 'clients.archive': return archiveClient_(payload);
    case 'clients.restore': return restoreClient_(payload);
    case 'clients.delete': return deleteClient_(payload);

    case 'users.listForWorkspace': return listUsersForWorkspace_(payload);
    case 'users.create': return createUserForWorkspace_(payload);
    case 'projectMembers.list': return listProjectMembers_(payload);
    case 'projectMembers.assign': return assignProjectMember_(payload);
    case 'projectMembers.remove': return removeProjectMember_(payload);

    case 'resources.list': return listResources_(payload);
    case 'resources.create': return createResource_(payload);
    case 'resources.remove': return removeResource_(payload);
    case 'milestones.list': return listMilestones_(payload);

    case 'drive.createProjectStructure': return createProjectDriveStructure_(payload);
    default: throw new Error('Acción no soportada: ' + action);
  }
}
