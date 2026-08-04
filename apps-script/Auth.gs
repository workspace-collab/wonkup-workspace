function roleLabel_(role) {
  var labels = {
    superadmin: 'Superadministrador',
    workspace_admin: 'Administrador de workspace',
    project_lead: 'Líder de proyecto',
    collaborator: 'Colaborador',
    client: 'Cliente',
    guest: 'Invitado'
  };
  return labels[role] || role;
}

function exchangeAccessCode_(payload) {
  var code = String(payload.code || '').trim().toUpperCase().replace(/\s+/g, '-');
  if (!code) throw new Error('Debes ingresar un código de acceso.');

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var grant = findObject_(WONKUP_CONFIG.sheets.accessGrants, function(item) {
      return String(item.code_hash) === secretHash_(code);
    });

    if (!grant || String(grant.status) !== 'active') throw new Error('Código inválido, inactivo o revocado.');
    if (new Date(grant.expires_at).getTime() <= Date.now()) throw new Error('El código ha expirado.');

    var user = findObject_(WONKUP_CONFIG.sheets.users, function(item) {
      return String(item.id) === String(grant.user_id);
    });
    if (!user || String(user.status) !== 'active') throw new Error('El usuario asociado no está activo.');

    var plainToken = randomToken_();
    var expiresAt = new Date(Date.now() + WONKUP_CONFIG.sessionHours * 60 * 60 * 1000).toISOString();
    var sessionId = Utilities.getUuid();

    appendObject_(WONKUP_CONFIG.sheets.sessions, {
      id: sessionId,
      session_hash: secretHash_(plainToken),
      user_id: user.id,
      role: grant.role,
      workspace_ids_json: grant.workspace_ids_json,
      project_ids_json: grant.project_ids_json,
      expires_at: expiresAt,
      status: 'active',
      created_at: nowIso_(),
      last_seen_at: nowIso_()
    });
    updateObject_(WONKUP_CONFIG.sheets.accessGrants, grant.__row, { last_used_at: nowIso_() });
    audit_(user.id, 'session.created', 'session', sessionId, { role: grant.role });

    return safeSession_(plainToken, expiresAt, grant.role, user, grant.workspace_ids_json, grant.project_ids_json);
  } finally {
    lock.releaseLock();
  }
}

function validateSessionToken_(plainToken) {
  if (!plainToken) return null;
  var session = findObject_(WONKUP_CONFIG.sheets.sessions, function(item) {
    return String(item.session_hash) === secretHash_(plainToken);
  });
  if (!session || String(session.status) !== 'active') return null;
  if (new Date(session.expires_at).getTime() <= Date.now()) {
    updateObject_(WONKUP_CONFIG.sheets.sessions, session.__row, { status: 'expired' });
    return null;
  }

  var user = findObject_(WONKUP_CONFIG.sheets.users, function(item) {
    return String(item.id) === String(session.user_id);
  });
  if (!user || String(user.status) !== 'active') return null;

  updateObject_(WONKUP_CONFIG.sheets.sessions, session.__row, { last_seen_at: nowIso_() });
  return safeSession_(plainToken, session.expires_at, session.role, user, session.workspace_ids_json, session.project_ids_json);
}

function revokeSessionToken_(plainToken) {
  if (!plainToken) return { revoked: true };
  var session = findObject_(WONKUP_CONFIG.sheets.sessions, function(item) {
    return String(item.session_hash) === secretHash_(plainToken);
  });
  if (session) {
    updateObject_(WONKUP_CONFIG.sheets.sessions, session.__row, { status: 'revoked', last_seen_at: nowIso_() });
    audit_(session.user_id, 'session.revoked', 'session', session.id, {});
  }
  return { revoked: true };
}

function safeSession_(plainToken, expiresAt, role, user, workspaceIdsJson, projectIdsJson) {
  return {
    token: plainToken,
    source: 'apps-script',
    issuedAt: nowIso_(),
    expiresAt: String(expiresAt),
    role: String(role),
    roleLabel: roleLabel_(String(role)),
    user: {
      id: String(user.id),
      name: String(user.display_name),
      email: String(user.email || ''),
      initials: String(user.initials || '')
    },
    scopes: {
      workspaceIds: jsonArray_(workspaceIdsJson),
      projectIds: jsonArray_(projectIdsJson)
    }
  };
}
