function routeRequest_(action, payload) {
  switch (action) {
    case 'health':
      return { status: 'ok', version: '0.2.0' };
    case 'auth.exchangeCode':
      return exchangeAccessCode_(payload);
    case 'auth.validate':
      var session = validateSessionToken_(payload.sessionToken);
      if (!session) throw new Error('Sesión inválida o vencida.');
      return session;
    case 'auth.revoke':
      return revokeSessionToken_(payload.sessionToken);
    case 'workspaces.list':
      return listWorkspacesForSession_(payload);
    default:
      throw new Error('Acción no soportada: ' + action);
  }
}
