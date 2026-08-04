function listClients_(payload) {
  var session = requireSession_(payload.sessionToken);
  if (isReadOnlyRole_(session)) throw new Error('Tu rol no permite consultar el directorio de clientes.');
  var workspaceId = String(payload.workspaceId || 'all');
  return getObjects_(WONKUP_CONFIG.sheets.clients)
    .filter(function(client) {
      if (workspaceId !== 'all' && String(client.workspace_id) !== workspaceId) return false;
      return canViewMaster_(session) || canAccessWorkspace_(session, client.workspace_id);
    })
    .filter(function(client) { return String(client.status || 'active') === 'active'; })
    .map(clientToClient_);
}

function createClient_(payload) {
  var session = requireSession_(payload.sessionToken);
  assertManagementRole_(session);
  var input = payload.input || {};
  var workspaceId = String(input.workspaceId || '').trim();
  var name = String(input.name || '').trim().slice(0, 120);
  if (!workspaceId) throw new Error('Selecciona un workspace.');
  if (name.length < 2) throw new Error('El nombre del cliente es obligatorio.');
  assertWorkspaceAccess_(session, workspaceId);
  var email = String(input.email || '').trim().slice(0, 254);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('El correo no es válido.');
  var now = nowIso_();
  var client = {
    id: Utilities.getUuid(), workspace_id: workspaceId, name: name,
    contact_name: String(input.contactName || '').trim().slice(0, 120),
    email: email, phone: String(input.phone || '').trim().slice(0, 40),
    status: 'active', created_at: now, updated_at: now
  };
  appendObject_(WONKUP_CONFIG.sheets.clients, client);
  audit_(session.user.id, 'client.created', 'client', client.id, { workspaceId: workspaceId });
  return clientToClient_(client);
}

function clientToClient_(client) {
  return {
    id: String(client.id), workspaceId: String(client.workspace_id), name: String(client.name || ''),
    contactName: String(client.contact_name || ''), email: String(client.email || ''),
    phone: String(client.phone || ''), status: String(client.status || 'active')
  };
}
