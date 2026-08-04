var WONKUP_SCHEMAS = {};
WONKUP_SCHEMAS[WONKUP_CONFIG.sheets.workspaces] = ['id','code','name','short_name','description','logo_url','status','drive_folder_id','created_at','updated_at'];
WONKUP_SCHEMAS[WONKUP_CONFIG.sheets.users] = ['id','display_name','email','initials','status','created_at','updated_at'];
WONKUP_SCHEMAS[WONKUP_CONFIG.sheets.accessGrants] = ['id','code_hash','user_id','role','workspace_ids_json','project_ids_json','expires_at','status','created_at','last_used_at'];
WONKUP_SCHEMAS[WONKUP_CONFIG.sheets.sessions] = ['id','session_hash','user_id','role','workspace_ids_json','project_ids_json','expires_at','status','created_at','last_seen_at'];
WONKUP_SCHEMAS[WONKUP_CONFIG.sheets.workspaceMembers] = ['id','workspace_id','user_id','role','status','created_at','updated_at'];
WONKUP_SCHEMAS[WONKUP_CONFIG.sheets.clients] = ['id','workspace_id','name','contact_name','email','status','created_at','updated_at'];
WONKUP_SCHEMAS[WONKUP_CONFIG.sheets.projects] = ['id','workspace_id','client_id','code','name','description','status','stage','priority','progress','owner_user_id','created_at','updated_at'];
WONKUP_SCHEMAS[WONKUP_CONFIG.sheets.projectMembers] = ['id','project_id','user_id','role','status','created_at','updated_at'];
WONKUP_SCHEMAS[WONKUP_CONFIG.sheets.configuration] = ['key','scope_type','scope_id','value_json','updated_at'];
WONKUP_SCHEMAS[WONKUP_CONFIG.sheets.audit] = ['id','actor_id','action','entity_type','entity_id','details_json','created_at'];

function setupWonkUpMaster() {
  var spreadsheet = getMasterSpreadsheet_();
  Object.keys(WONKUP_SCHEMAS).forEach(function(name) {
    var sheet = spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
    var headers = WONKUP_SCHEMAS[name];
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#0b142c').setFontColor('#ffffff');
      sheet.autoResizeColumns(1, headers.length);
    }
  });

  seedWonkUpDemoData_();
  Logger.log('Configuración completada. Códigos demo: WONKUP-ADMIN, AGORA-ADMIN, TAXI-LIDER, TAXI-CLIENTE, HUELLITAS-INVITADO');
  return 'WonkUp Master configurado correctamente.';
}

function seedWonkUpDemoData_() {
  if (getObjects_(WONKUP_CONFIG.sheets.workspaces).length) return;
  var now = nowIso_();

  [
    ['w-wonkup','WSP-WON','WonkUp','WonkUp'],
    ['w-agora','WSP-AGO','Ágora Education','Ágora'],
    ['w-personalclass','WSP-PC','Personal Class','Personal Class'],
    ['w-nija','WSP-NIJ','NIJA','NIJA']
  ].forEach(function(item) {
    appendObject_(WONKUP_CONFIG.sheets.workspaces, { id:item[0], code:item[1], name:item[2], short_name:item[3], status:'active', created_at:now, updated_at:now });
  });

  var users = [
    ['usr-rodrigo','Rodrigo','rodrigo.demo@wonkup.pe','RG'],
    ['usr-edinson','Edinson','edinson.demo@wonkup.pe','EG'],
    ['usr-brenda','Brenda','brenda.demo@wonkup.pe','BG'],
    ['usr-cliente-taxi','Cliente TaxiChurro','cliente.demo@taxichurro.pe','CT'],
    ['usr-invitado','Invitado Huellitas','invitado.demo@wonkup.pe','IH']
  ];
  users.forEach(function(item) {
    appendObject_(WONKUP_CONFIG.sheets.users, { id:item[0], display_name:item[1], email:item[2], initials:item[3], status:'active', created_at:now, updated_at:now });
  });

  [
    ['WONKUP-ADMIN','usr-rodrigo','superadmin',['*'],['*']],
    ['AGORA-ADMIN','usr-edinson','workspace_admin',['w-agora'],['*']],
    ['TAXI-LIDER','usr-brenda','project_lead',['w-agora'],['p-taxichurro']],
    ['TAXI-CLIENTE','usr-cliente-taxi','client',['w-agora'],['p-taxichurro']],
    ['HUELLITAS-INVITADO','usr-invitado','guest',['w-agora'],['p-huellitas']]
  ].forEach(function(item) {
    appendObject_(WONKUP_CONFIG.sheets.accessGrants, {
      id: Utilities.getUuid(),
      code_hash: secretHash_(item[0]),
      user_id: item[1],
      role: item[2],
      workspace_ids_json: JSON.stringify(item[3]),
      project_ids_json: JSON.stringify(item[4]),
      expires_at: '2027-12-31T23:59:59-05:00',
      status: 'active',
      created_at: now,
      last_used_at: ''
    });
  });

  [
    ['p-wonkup-workspace','w-wonkup','PROY-WON-001','WonkUp Workspace'],
    ['p-taxichurro','w-agora','PROY-AGO-001','TaxiChurro'],
    ['p-compraya','w-agora','PROY-AGO-002','CompraYa'],
    ['p-huellitas','w-agora','PROY-AGO-003','Huellitas Conecta'],
    ['p-selvaviva','w-agora','PROY-AGO-004','Selva Viva'],
    ['p-personalclass','w-personalclass','PROY-PC-001','Plataforma Personal Class'],
    ['p-nija-growth','w-nija','PROY-NIJ-001','Crecimiento comercial NIJA']
  ].forEach(function(item) {
    appendObject_(WONKUP_CONFIG.sheets.projects, { id:item[0], workspace_id:item[1], code:item[2], name:item[3], status:'active', progress:0, created_at:now, updated_at:now });
  });
}
