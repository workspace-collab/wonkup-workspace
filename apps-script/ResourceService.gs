function listResources_(payload) {
  var session = requireSession_(payload.sessionToken);
  var project = findProjectById_(payload.projectId);
  assertProjectAccess_(session, project);
  return getObjects_(WONKUP_CONFIG.sheets.resources)
    .filter(function(resource) { return String(resource.project_id) === String(project.id) && String(resource.status) === 'active'; })
    .filter(function(resource) { return !isReadOnlyRole_(session) || String(resource.visibility) === 'client'; })
    .map(resourceToClient_);
}

function createResource_(payload) {
  var session = requireSession_(payload.sessionToken);
  var project = findProjectById_(payload.projectId);
  if (!canManageResources_(session, project)) throw new Error('Tu rol no permite registrar recursos.');
  var input = payload.input || {};
  var name = String(input.name || '').trim().slice(0, 160);
  var url = String(input.url || '').trim().slice(0, 1000);
  if (!name) throw new Error('El nombre del recurso es obligatorio.');
  if (!/^https?:\/\//i.test(url)) throw new Error('La URL debe comenzar con http:// o https://');
  var resource = {
    id: Utilities.getUuid(), project_id: project.id, type: String(input.type || 'other').slice(0, 30),
    name: name, url: url, visibility: String(input.visibility || 'internal').slice(0, 30),
    status: 'active', created_by: session.user.id, created_at: nowIso_(), updated_at: nowIso_()
  };
  appendObject_(WONKUP_CONFIG.sheets.resources, resource);
  audit_(session.user.id, 'resource.created', 'resource', resource.id, { projectId: project.id });
  return resourceToClient_(resource);
}

function removeResource_(payload) {
  var session = requireSession_(payload.sessionToken);
  var project = findProjectById_(payload.projectId);
  if (!canManageResources_(session, project)) throw new Error('Tu rol no permite retirar recursos.');
  var resource = findObject_(WONKUP_CONFIG.sheets.resources, function(item) { return String(item.id) === String(payload.resourceId) && String(item.project_id) === String(project.id); });
  if (resource) updateObject_(WONKUP_CONFIG.sheets.resources, resource.__row, { status: 'inactive', updated_at: nowIso_() });
  audit_(session.user.id, 'resource.removed', 'resource', payload.resourceId, { projectId: project.id });
  return { removed: Boolean(resource) };
}

function listMilestones_(payload) {
  var session = requireSession_(payload.sessionToken);
  var project = findProjectById_(payload.projectId);
  assertProjectAccess_(session, project);
  return getObjects_(WONKUP_CONFIG.sheets.milestones)
    .filter(function(item) { return String(item.project_id) === String(project.id); })
    .filter(function(item) { return !isReadOnlyRole_(session) || String(item.visibility) === 'client'; })
    .map(function(item) { return { id:String(item.id), projectId:String(item.project_id), name:String(item.name), dueDate:String(item.due_date || ''), status:String(item.status || 'planned'), visibility:String(item.visibility || 'internal') }; });
}

function resourceToClient_(resource) {
  return { id:String(resource.id), projectId:String(resource.project_id), type:String(resource.type || 'other'), name:String(resource.name || ''), url:String(resource.url || ''), visibility:String(resource.visibility || 'internal'), status:String(resource.status || 'active') };
}
