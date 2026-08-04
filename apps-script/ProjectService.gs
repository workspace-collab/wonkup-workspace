var PROJECT_STATUSES_ = ['draft','planned','active','pending_client','on_hold','blocked','completed','cancelled','archived'];
var PROJECT_STAGES_ = ['discovery','definition','planning','ux_ui','development','validation','launch','closing'];
var PROJECT_PRIORITIES_ = ['low','medium','high','critical'];

function listProjects_(payload) {
  var session = requireSession_(payload.sessionToken);
  var workspaceId = String(payload.workspaceId || 'all');
  var includeArchived = payload.includeArchived === true || String(payload.includeArchived) === 'true';

  return getObjects_(WONKUP_CONFIG.sheets.projects)
    .filter(function(project) {
      if (workspaceId !== 'all' && String(project.workspace_id) !== workspaceId) return false;
      if (!includeArchived && String(project.status) === 'archived') return false;
      return canAccessProject_(session, project);
    })
    .map(projectToClient_);
}

function getProjectForSession_(payload) {
  var session = requireSession_(payload.sessionToken);
  var project = findProjectById_(payload.projectId);
  if (!project || !canAccessProject_(session, project)) return null;
  return projectToClient_(project);
}

function createProject_(payload) {
  var session = requireSession_(payload.sessionToken);
  assertManagementRole_(session);
  var input = sanitizeProjectInput_(payload.input || {});
  assertWorkspaceAccess_(session, input.workspace_id);
  if (!input.name || input.name.length < 3) throw new Error('El nombre del proyecto es obligatorio.');
  if (!input.owner_user_id) throw new Error('Selecciona un responsable.');
  if (input.start_date && input.due_date && new Date(input.start_date).getTime() > new Date(input.due_date).getTime()) throw new Error('La fecha de entrega no puede ser anterior al inicio.');

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var now = nowIso_();
    var project = {
      id: Utilities.getUuid(),
      workspace_id: input.workspace_id,
      client_id: input.client_id,
      code: nextProjectCode_(input.workspace_id),
      name: input.name,
      tagline: input.tagline,
      description: input.description,
      status: input.status,
      stage: input.stage,
      priority: input.priority,
      health: input.health,
      progress: input.progress,
      owner_user_id: input.owner_user_id,
      start_date: input.start_date,
      due_date: input.due_date,
      budget: input.budget,
      cost: 0,
      hours: 0,
      pending_tasks: 0,
      logo_url: input.logo_url,
      cover_image_url: input.cover_image_url,
      brand_color: input.brand_color,
      status_before_archive: '',
      archived_at: '',
      archived_by: '',
      restored_at: '',
      restored_by: '',
      drive_folder_id: '',
      drive_folder_url: '',
      github_url: input.github_url,
      figma_url: input.figma_url,
      hosting_url: input.hosting_url,
      domain: input.domain,
      created_by: session.user.id,
      updated_by: session.user.id,
      created_at: now,
      updated_at: now
    };
    appendObject_(WONKUP_CONFIG.sheets.projects, project);
    appendObject_(WONKUP_CONFIG.sheets.projectMembers, {
      id: Utilities.getUuid(), project_id: project.id, user_id: project.owner_user_id,
      role: 'project_lead', allocation: 40, status: 'active', created_at: now, updated_at: now
    });
    audit_(session.user.id, 'project.created', 'project', project.id, { code: project.code, workspaceId: project.workspace_id });
    return projectToClient_(project);
  } finally {
    lock.releaseLock();
  }
}

function updateProject_(payload) {
  var session = requireSession_(payload.sessionToken);
  var project = findProjectById_(payload.projectId);
  if (!project) throw new Error('Proyecto no encontrado.');
  assertProjectEdit_(session, project);
  var input = sanitizeProjectInput_(payload.patch || {});
  if (!input.name || input.name.length < 3) throw new Error('El nombre del proyecto es obligatorio.');
  if (input.start_date && input.due_date && new Date(input.start_date).getTime() > new Date(input.due_date).getTime()) throw new Error('La fecha de entrega no puede ser anterior al inicio.');

  var patch = {
    client_id: input.client_id,
    name: input.name,
    tagline: input.tagline,
    description: input.description,
    status: input.status,
    stage: input.stage,
    priority: input.priority,
    health: input.health,
    progress: input.progress,
    owner_user_id: input.owner_user_id,
    start_date: input.start_date,
    due_date: input.due_date,
    budget: input.budget,
    logo_url: input.logo_url,
    cover_image_url: input.cover_image_url,
    brand_color: input.brand_color,
    github_url: input.github_url,
    figma_url: input.figma_url,
    hosting_url: input.hosting_url,
    domain: input.domain,
    updated_by: session.user.id,
    updated_at: nowIso_()
  };
  updateObject_(WONKUP_CONFIG.sheets.projects, project.__row, patch);
  audit_(session.user.id, 'project.updated', 'project', project.id, { fields: Object.keys(patch) });
  return projectToClient_(Object.assign({}, project, patch));
}

function archiveProject_(payload) {
  var session = requireSession_(payload.sessionToken);
  assertManagementRole_(session);
  var project = findProjectById_(payload.projectId);
  if (!project) throw new Error('Proyecto no encontrado.');
  assertWorkspaceAccess_(session, project.workspace_id);
  if (String(project.status) === 'archived') return projectToClient_(project);
  var now = nowIso_();
  var patch = {
    status_before_archive: String(project.status || 'planned'),
    status: 'archived',
    archived_at: now,
    archived_by: session.user.id,
    restored_at: '',
    restored_by: '',
    updated_by: session.user.id,
    updated_at: now
  };
  updateObject_(WONKUP_CONFIG.sheets.projects, project.__row, patch);
  audit_(session.user.id, 'project.archived', 'project', project.id, { previousStatus: patch.status_before_archive });
  return projectToClient_(Object.assign({}, project, patch));
}

function restoreProject_(payload) {
  var session = requireSession_(payload.sessionToken);
  assertManagementRole_(session);
  var project = findProjectById_(payload.projectId);
  if (!project) throw new Error('Proyecto no encontrado.');
  assertWorkspaceAccess_(session, project.workspace_id);
  if (String(project.status) !== 'archived') throw new Error('El proyecto no está archivado.');
  var now = nowIso_();
  var restoredStatus = String(project.status_before_archive || 'planned');
  if (PROJECT_STATUSES_.indexOf(restoredStatus) < 0 || restoredStatus === 'archived') restoredStatus = 'planned';
  var patch = {
    status: restoredStatus,
    status_before_archive: '',
    restored_at: now,
    restored_by: session.user.id,
    updated_by: session.user.id,
    updated_at: now
  };
  updateObject_(WONKUP_CONFIG.sheets.projects, project.__row, patch);
  audit_(session.user.id, 'project.restored', 'project', project.id, { restoredStatus: restoredStatus });
  return projectToClient_(Object.assign({}, project, patch));
}

function findProjectById_(projectId) {
  return findObject_(WONKUP_CONFIG.sheets.projects, function(project) {
    return String(project.id) === String(projectId);
  });
}

function sanitizeProjectInput_(input) {
  function text(value, max) { return String(value || '').trim().slice(0, max); }
  function allowed(value, list, fallback) { value = text(value, 40); return list.indexOf(value) >= 0 ? value : fallback; }
  function url(value) {
    value = text(value, 1000);
    if (!value) return '';
    if (!/^https?:\/\//i.test(value)) throw new Error('Los enlaces deben comenzar con http:// o https://');
    return value;
  }
  function assetUrl(value) {
    value = text(value, 1000);
    if (!value) return '';
    if (/^(?:\.\/)?assets\/[a-zA-Z0-9_./-]+$/.test(value)) return value.indexOf('./') === 0 ? value : './' + value;
    return url(value);
  }
  return {
    workspace_id: text(input.workspaceId || input.workspace_id, 80),
    client_id: text(input.clientId || input.client_id, 80),
    name: text(input.name, 120),
    tagline: text(input.tagline, 180),
    description: text(input.description, 2000),
    status: allowed(input.status, PROJECT_STATUSES_, 'planned'),
    stage: allowed(input.stage, PROJECT_STAGES_, 'definition'),
    priority: allowed(input.priority, PROJECT_PRIORITIES_, 'medium'),
    health: allowed(input.health, ['green','amber','red'], 'green'),
    progress: Math.max(0, Math.min(100, Number(input.progress || 0))),
    owner_user_id: text(input.ownerUserId || input.owner_user_id, 80),
    start_date: text(input.startDate || input.start_date, 20),
    due_date: text(input.dueDate || input.due_date, 20),
    budget: Math.max(0, Number(input.budget || 0)),
    logo_url: assetUrl(input.logo || input.logo_url),
    cover_image_url: assetUrl(input.coverImage || input.cover_image_url),
    brand_color: /^#[0-9a-fA-F]{6}$/.test(text(input.brandColor || input.brand_color, 20)) ? text(input.brandColor || input.brand_color, 20).toLowerCase() : '#50a8f3',
    github_url: url(input.githubUrl || input.github_url),
    figma_url: url(input.figmaUrl || input.figma_url),
    hosting_url: url(input.hostingUrl || input.hosting_url),
    domain: text(input.domain, 180)
  };
}

function nextProjectCode_(workspaceId) {
  var workspace = findObject_(WONKUP_CONFIG.sheets.workspaces, function(item) { return String(item.id) === String(workspaceId); });
  if (!workspace) throw new Error('Workspace no encontrado.');
  var prefix = String(workspace.code || 'WSP-GEN').replace(/^WSP-/, '');
  var max = 0;
  getObjects_(WONKUP_CONFIG.sheets.projects).forEach(function(project) {
    if (String(project.workspace_id) !== String(workspaceId)) return;
    var match = String(project.code || '').match(/(\d+)$/);
    if (match) max = Math.max(max, Number(match[1]));
  });
  return 'PROY-' + prefix + '-' + String(max + 1).padStart(3, '0');
}

function projectToClient_(project) {
  var client = project.client_id ? findObject_(WONKUP_CONFIG.sheets.clients, function(item) { return String(item.id) === String(project.client_id); }) : null;
  var owner = project.owner_user_id ? findObject_(WONKUP_CONFIG.sheets.users, function(item) { return String(item.id) === String(project.owner_user_id); }) : null;
  return {
    id: String(project.id),
    workspaceId: String(project.workspace_id),
    clientId: String(project.client_id || ''),
    code: String(project.code || ''),
    name: String(project.name || ''),
    tagline: String(project.tagline || ''),
    description: String(project.description || ''),
    status: String(project.status || 'draft'),
    stage: String(project.stage || 'definition'),
    priority: String(project.priority || 'medium'),
    health: String(project.health || 'green'),
    progress: Number(project.progress || 0),
    ownerUserId: String(project.owner_user_id || ''),
    owner: owner ? String(owner.display_name) : 'Sin responsable',
    client: client ? String(client.name) : 'Sin cliente',
    startDate: String(project.start_date || ''),
    dueDate: String(project.due_date || ''),
    budget: Number(project.budget || 0),
    cost: Number(project.cost || 0),
    hours: Number(project.hours || 0),
    pendingTasks: Number(project.pending_tasks || 0),
    logo: String(project.logo_url || ''),
    coverImage: String(project.cover_image_url || ''),
    brandColor: String(project.brand_color || '#50a8f3'),
    statusBeforeArchive: String(project.status_before_archive || ''),
    archivedAt: String(project.archived_at || ''),
    archivedBy: String(project.archived_by || ''),
    restoredAt: String(project.restored_at || ''),
    restoredBy: String(project.restored_by || ''),
    driveFolderId: String(project.drive_folder_id || ''),
    driveUrl: String(project.drive_folder_url || ''),
    githubUrl: String(project.github_url || ''),
    figmaUrl: String(project.figma_url || ''),
    hostingUrl: String(project.hosting_url || ''),
    domain: String(project.domain || ''),
    createdAt: String(project.created_at || ''),
    updatedAt: String(project.updated_at || '')
  };
}
