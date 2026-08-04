var PROJECT_FOLDER_NAMES_ = ['00_Resumen','01_Investigación','02_Planeamiento','03_UX-UI','04_Desarrollo','05_Pruebas','06_Marketing','07_Finanzas','09_Legal','10_Archivo'];

function setupWonkUpDriveRoot() {
  var properties = PropertiesService.getScriptProperties();
  var existingId = properties.getProperty('WONKUP_ROOT_FOLDER_ID');
  if (existingId) {
    try { return DriveApp.getFolderById(existingId).getUrl(); } catch (error) { properties.deleteProperty('WONKUP_ROOT_FOLDER_ID'); }
  }
  var root = DriveApp.createFolder('WONKUP_WORKSPACE');
  root.createFolder('00_CONTROL_MAESTRO');
  properties.setProperty('WONKUP_ROOT_FOLDER_ID', root.getId());
  return root.getUrl();
}

function createProjectDriveStructure_(payload) {
  var session = requireSession_(payload.sessionToken);
  var project = findProjectById_(payload.projectId);
  if (!project) throw new Error('Proyecto no encontrado.');
  assertProjectEdit_(session, project);

  if (project.drive_folder_id) {
    try {
      var existing = DriveApp.getFolderById(String(project.drive_folder_id));
      return driveStructureResponse_(existing, project, 'apps-script');
    } catch (error) {
      // If the folder was deleted, create it again.
    }
  }

  var workspaceFolder = ensureWorkspaceDriveFolder_(project.workspace_id);
  var projectsFolder = getOrCreateChildFolder_(workspaceFolder, '02_Proyectos');
  var folderName = sanitizeFolderName_(project.code + '_' + project.name);
  var projectFolder = getOrCreateChildFolder_(projectsFolder, folderName);

  PROJECT_FOLDER_NAMES_.forEach(function(name) { getOrCreateChildFolder_(projectFolder, name); });
  var deliverables = getOrCreateChildFolder_(projectFolder, '08_Entregables');
  getOrCreateChildFolder_(deliverables, 'Internos');
  getOrCreateChildFolder_(deliverables, 'Cliente');

  var patch = { drive_folder_id: projectFolder.getId(), drive_folder_url: projectFolder.getUrl(), updated_by: session.user.id, updated_at: nowIso_() };
  updateObject_(WONKUP_CONFIG.sheets.projects, project.__row, patch);
  appendObject_(WONKUP_CONFIG.sheets.driveFolders, { id:Utilities.getUuid(), workspace_id:project.workspace_id, project_id:project.id, folder_type:'project_root', drive_id:projectFolder.getId(), url:projectFolder.getUrl(), created_at:nowIso_() });
  audit_(session.user.id, 'drive.project_structure_created', 'project', project.id, { folderId: projectFolder.getId() });
  return driveStructureResponse_(projectFolder, Object.assign({}, project, patch), 'apps-script');
}

function ensureWorkspaceDriveFolder_(workspaceId) {
  var workspace = findObject_(WONKUP_CONFIG.sheets.workspaces, function(item) { return String(item.id) === String(workspaceId); });
  if (!workspace) throw new Error('Workspace no encontrado.');
  if (workspace.drive_folder_id) {
    try { return DriveApp.getFolderById(String(workspace.drive_folder_id)); } catch (error) { /* recreate */ }
  }
  var rootId = PropertiesService.getScriptProperties().getProperty('WONKUP_ROOT_FOLDER_ID');
  if (!rootId) setupWonkUpDriveRoot();
  rootId = PropertiesService.getScriptProperties().getProperty('WONKUP_ROOT_FOLDER_ID');
  var root = DriveApp.getFolderById(rootId);
  var folder = getOrCreateChildFolder_(root, sanitizeFolderName_('WSP_' + String(workspace.name || workspace.code).toUpperCase().replace(/\s+/g, '_')));
  updateObject_(WONKUP_CONFIG.sheets.workspaces, workspace.__row, { drive_folder_id: folder.getId(), updated_at: nowIso_() });
  ['00_Administración','01_Programas','02_Proyectos','03_Recursos_Compartidos','04_Reportes','99_Archivo'].forEach(function(name) { getOrCreateChildFolder_(folder, name); });
  return folder;
}

function getOrCreateChildFolder_(parent, name) {
  var iterator = parent.getFoldersByName(name);
  return iterator.hasNext() ? iterator.next() : parent.createFolder(name);
}

function sanitizeFolderName_(value) {
  return String(value || '').replace(/[\\/:*?"<>|#%{}]/g, '-').replace(/\s+/g, '-').slice(0, 180);
}

function driveStructureResponse_(folder, project, mode) {
  return {
    mode: mode,
    folderId: folder.getId(),
    folderName: folder.getName(),
    folderUrl: folder.getUrl(),
    folders: ['00_Resumen','01_Investigación','02_Planeamiento','03_UX-UI','04_Desarrollo','05_Pruebas','06_Marketing','07_Finanzas','08_Entregables/Internos','08_Entregables/Cliente','09_Legal','10_Archivo']
  };
}
