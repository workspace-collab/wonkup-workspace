var WONKUP_CONFIG = Object.freeze({
  sessionHours: 8,
  spreadsheetId: '',
  sheets: {
    workspaces: 'Workspaces',
    users: 'Usuarios',
    accessGrants: 'Accesos',
    sessions: 'Sesiones',
    workspaceMembers: 'Miembros_Workspace',
    clients: 'Clientes',
    projects: 'Proyectos',
    projectMembers: 'Miembros_Proyecto',
    configuration: 'Configuracion',
    audit: 'Actividad'
  }
});

function getMasterSpreadsheet_() {
  if (WONKUP_CONFIG.spreadsheetId) {
    return SpreadsheetApp.openById(WONKUP_CONFIG.spreadsheetId);
  }
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error('Vincula este Apps Script al Google Sheets maestro o configura spreadsheetId.');
  return spreadsheet;
}
