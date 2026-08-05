function listUsersForWorkspace_(payload) {
  var session = requireSession_(payload.sessionToken);
  if (isReadOnlyRole_(session)) throw new Error('Tu rol no permite consultar usuarios.');
  assertWorkspaceAccess_(session, payload.workspaceId);
  var restrictedUserIds = getObjects_(WONKUP_CONFIG.sheets.accessGrants)
    .filter(function(grant) { return ['client','guest'].indexOf(String(grant.role)) >= 0 && String(grant.status) === 'active'; })
    .map(function(grant) { return String(grant.user_id); });
  return getObjects_(WONKUP_CONFIG.sheets.users)
    .filter(function(user) { return String(user.status) === 'active' && restrictedUserIds.indexOf(String(user.id)) < 0; })
    .map(function(user) {
      return { id: String(user.id), name: String(user.display_name), email: String(user.email || ''), initials: String(user.initials || '') };
    });
}


function createUserForWorkspace_(payload) {
  var session = requireSession_(payload.sessionToken);
  var input = payload.input || {};
  var workspaceId = String(input.workspaceId || '').trim();
  assertWorkspaceAccess_(session, workspaceId);
  if (['superadmin','workspace_admin','project_lead'].indexOf(String(session.role)) < 0) {
    throw new Error('Tu rol no permite registrar personas en este workspace.');
  }

  var name = String(input.name || '').trim().replace(/\s+/g, ' ');
  var email = String(input.email || '').trim().toLowerCase();
  if (name.length < 2) throw new Error('Escribe el nombre de la persona.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Escribe un correo válido.');

  var duplicate = findObject_(WONKUP_CONFIG.sheets.users, function(user) {
    return String(user.email || '').trim().toLowerCase() === email && String(user.status) !== 'archived';
  });
  if (duplicate) throw new Error('Ya existe una persona registrada con ese correo.');

  var initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map(function(part) { return part.charAt(0); }).join('').toUpperCase() || 'US';
  var now = nowIso_();
  var userId = Utilities.getUuid();
  appendObject_(WONKUP_CONFIG.sheets.users, {
    id: userId,
    display_name: name,
    email: email,
    initials: initials,
    status: 'active',
    created_at: now,
    updated_at: now
  });
  appendObject_(WONKUP_CONFIG.sheets.workspaceMembers, {
    id: Utilities.getUuid(),
    workspace_id: workspaceId,
    user_id: userId,
    role: 'collaborator',
    status: 'active',
    created_at: now,
    updated_at: now
  });
  audit_(session.user.id, 'workspace.user_created', 'user', userId, { workspaceId: workspaceId, email: email });
  return { id: userId, name: name, email: email, initials: initials, status: 'active' };
}

function listProjectMembers_(payload) {
  var session = requireSession_(payload.sessionToken);
  if (isReadOnlyRole_(session)) throw new Error('Tu rol no permite consultar el equipo interno.');
  var project = findProjectById_(payload.projectId);
  assertProjectAccess_(session, project);
  return getObjects_(WONKUP_CONFIG.sheets.projectMembers)
    .filter(function(member) { return String(member.project_id) === String(project.id) && String(member.status) === 'active'; })
    .map(function(member) {
      var user = findObject_(WONKUP_CONFIG.sheets.users, function(item) { return String(item.id) === String(member.user_id); });
      return {
        id: String(member.id), projectId: String(member.project_id), userId: String(member.user_id),
        role: String(member.role || 'collaborator'), allocation: Number(member.allocation || 0), status: String(member.status),
        user: { id: String(user ? user.id : member.user_id), name: String(user ? user.display_name : 'Usuario'), email: String(user ? user.email : ''), initials: String(user ? user.initials : 'US') }
      };
    });
}

function assignProjectMember_(payload) {
  var session = requireSession_(payload.sessionToken);
  var project = findProjectById_(payload.projectId);
  assertProjectEdit_(session, project);
  var input = payload.input || {};
  var userId = String(input.userId || '');
  if (!userId) throw new Error('Selecciona un usuario.');
  var user = findObject_(WONKUP_CONFIG.sheets.users, function(item) { return String(item.id) === userId && String(item.status) === 'active'; });
  if (!user) throw new Error('Usuario no encontrado.');
  var member = findObject_(WONKUP_CONFIG.sheets.projectMembers, function(item) { return String(item.project_id) === String(project.id) && String(item.user_id) === userId; });
  var now = nowIso_();
  var patch = { role: String(input.role || 'collaborator'), allocation: Math.max(0, Math.min(100, Number(input.allocation || 0))), status: 'active', updated_at: now };
  if (member) updateObject_(WONKUP_CONFIG.sheets.projectMembers, member.__row, patch);
  else appendObject_(WONKUP_CONFIG.sheets.projectMembers, Object.assign({ id: Utilities.getUuid(), project_id: project.id, user_id: userId, created_at: now }, patch));
  audit_(session.user.id, 'project.member_assigned', 'project', project.id, { userId: userId });
  return listProjectMembers_(payload);
}

function removeProjectMember_(payload) {
  var session = requireSession_(payload.sessionToken);
  var project = findProjectById_(payload.projectId);
  assertProjectEdit_(session, project);
  var member = findObject_(WONKUP_CONFIG.sheets.projectMembers, function(item) { return String(item.id) === String(payload.memberId) && String(item.project_id) === String(project.id); });
  if (member) updateObject_(WONKUP_CONFIG.sheets.projectMembers, member.__row, { status: 'inactive', updated_at: nowIso_() });
  audit_(session.user.id, 'project.member_removed', 'project', project.id, { memberId: payload.memberId });
  return { removed: Boolean(member) };
}
