function listClients_(payload) {
  var session = requireSession_(payload.sessionToken);
  if (isReadOnlyRole_(session)) throw new Error('Tu rol no permite consultar el directorio de clientes.');
  var workspaceId = String(payload.workspaceId || 'all');
  var includeArchived = Boolean(payload.includeArchived);
  return getObjects_(WONKUP_CONFIG.sheets.clients)
    .filter(function(client) {
      if (workspaceId !== 'all' && String(client.workspace_id) !== workspaceId) return false;
      return canViewMaster_(session) || canAccessWorkspace_(session, client.workspace_id);
    })
    .filter(function(client) { return includeArchived || String(client.status || 'active') !== 'archived'; })
    .map(clientToClient_);
}

function createClient_(payload) {
  var session = requireSession_(payload.sessionToken);
  assertManagementRole_(session);
  var input = validateClientInput_(payload.input || {}, true);
  assertWorkspaceAccess_(session, input.workspaceId);
  var now = nowIso_();
  var client = {
    id: Utilities.getUuid(), workspace_id: input.workspaceId, name: input.name,
    contact_name: input.contactName, email: input.email, phone: input.phone,
    status: 'active', archived_at: '', archived_by: '', restored_at: '', restored_by: '',
    created_at: now, updated_at: now
  };
  appendObject_(WONKUP_CONFIG.sheets.clients, client);
  audit_(session.user.id, 'client.created', 'client', client.id, { workspaceId: input.workspaceId });
  return clientToClient_(client);
}

function updateClient_(payload) {
  var session = requireSession_(payload.sessionToken);
  assertManagementRole_(session);
  var clientId = String(payload.clientId || '');
  var current = findObject_(WONKUP_CONFIG.sheets.clients, function(item) { return String(item.id) === clientId; });
  if (!current) throw new Error('Cliente no encontrado.');
  assertWorkspaceAccess_(session, current.workspace_id);
  var input = validateClientInput_(Object.assign({ workspaceId: current.workspace_id }, payload.patch || {}), true);
  var patch = {
    name: input.name, contact_name: input.contactName, email: input.email,
    phone: input.phone, updated_at: nowIso_()
  };
  updateObject_(WONKUP_CONFIG.sheets.clients, current.__row, patch);
  audit_(session.user.id, 'client.updated', 'client', clientId, {});
  return clientToClient_(Object.assign({}, current, patch));
}

function archiveClient_(payload) {
  var session = requireSession_(payload.sessionToken);
  assertManagementRole_(session);
  var clientId = String(payload.clientId || '');
  var current = findObject_(WONKUP_CONFIG.sheets.clients, function(item) { return String(item.id) === clientId; });
  if (!current) throw new Error('Cliente no encontrado.');
  assertWorkspaceAccess_(session, current.workspace_id);
  var now = nowIso_();
  var patch = { status: 'archived', archived_at: now, archived_by: session.user.id, restored_at: '', restored_by: '', updated_at: now };
  updateObject_(WONKUP_CONFIG.sheets.clients, current.__row, patch);
  audit_(session.user.id, 'client.archived', 'client', clientId, {});
  return clientToClient_(Object.assign({}, current, patch));
}

function restoreClient_(payload) {
  var session = requireSession_(payload.sessionToken);
  assertManagementRole_(session);
  var clientId = String(payload.clientId || '');
  var current = findObject_(WONKUP_CONFIG.sheets.clients, function(item) { return String(item.id) === clientId; });
  if (!current) throw new Error('Cliente no encontrado.');
  assertWorkspaceAccess_(session, current.workspace_id);
  if (String(current.status || '') !== 'archived') throw new Error('El cliente no está archivado.');
  var now = nowIso_();
  var patch = { status: 'active', restored_at: now, restored_by: session.user.id, updated_at: now };
  updateObject_(WONKUP_CONFIG.sheets.clients, current.__row, patch);
  audit_(session.user.id, 'client.restored', 'client', clientId, {});
  return clientToClient_(Object.assign({}, current, patch));
}

function deleteClient_(payload) {
  var session = requireSession_(payload.sessionToken);
  if (String(session.role) !== 'superadmin') throw new Error('Solo el superadministrador puede eliminar clientes definitivamente.');
  var clientId = String(payload.clientId || '');
  var current = findObject_(WONKUP_CONFIG.sheets.clients, function(item) { return String(item.id) === clientId; });
  if (!current) throw new Error('Cliente no encontrado.');
  assertWorkspaceAccess_(session, current.workspace_id);
  if (String(current.status || '') !== 'archived') throw new Error('Archiva el cliente antes de eliminarlo definitivamente.');
  var linked = findObject_(WONKUP_CONFIG.sheets.projects, function(project) { return String(project.client_id) === clientId; });
  if (linked) throw new Error('No puedes eliminar este cliente porque está vinculado a uno o más proyectos.');
  getSheet_(WONKUP_CONFIG.sheets.clients).deleteRow(current.__row);
  audit_(session.user.id, 'client.deleted', 'client', clientId, {});
  return { deleted: true, clientId: clientId };
}

function validateClientInput_(input, workspaceRequired) {
  var workspaceId = String(input.workspaceId || '').trim();
  var name = String(input.name || '').trim().slice(0, 120);
  var email = String(input.email || '').trim().slice(0, 254);
  if (workspaceRequired && !workspaceId) throw new Error('Selecciona un workspace.');
  if (name.length < 2) throw new Error('El nombre del cliente es obligatorio.');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('El correo no es válido.');
  return {
    workspaceId: workspaceId, name: name,
    contactName: String(input.contactName || '').trim().slice(0, 120),
    email: email, phone: String(input.phone || '').trim().slice(0, 40)
  };
}

function clientToClient_(client) {
  return {
    id: String(client.id), workspaceId: String(client.workspace_id), name: String(client.name || ''),
    contactName: String(client.contact_name || ''), email: String(client.email || ''),
    phone: String(client.phone || ''), status: String(client.status || 'active'),
    archivedAt: String(client.archived_at || ''), archivedBy: String(client.archived_by || ''),
    restoredAt: String(client.restored_at || ''), restoredBy: String(client.restored_by || '')
  };
}
