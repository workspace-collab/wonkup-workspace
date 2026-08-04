var WONKUP_SCHEMAS = {};
WONKUP_SCHEMAS[WONKUP_CONFIG.sheets.workspaces] = ['id','code','name','short_name','description','logo_url','status','drive_folder_id','created_at','updated_at'];
WONKUP_SCHEMAS[WONKUP_CONFIG.sheets.users] = ['id','display_name','email','initials','status','created_at','updated_at'];
WONKUP_SCHEMAS[WONKUP_CONFIG.sheets.accessGrants] = ['id','code_hash','user_id','role','workspace_ids_json','project_ids_json','expires_at','status','created_at','last_used_at'];
WONKUP_SCHEMAS[WONKUP_CONFIG.sheets.sessions] = ['id','session_hash','user_id','role','workspace_ids_json','project_ids_json','expires_at','status','created_at','last_seen_at'];
WONKUP_SCHEMAS[WONKUP_CONFIG.sheets.workspaceMembers] = ['id','workspace_id','user_id','role','status','created_at','updated_at'];
WONKUP_SCHEMAS[WONKUP_CONFIG.sheets.clients] = ['id','workspace_id','name','contact_name','email','phone','status','created_at','updated_at'];
WONKUP_SCHEMAS[WONKUP_CONFIG.sheets.projects] = ['id','workspace_id','client_id','code','name','tagline','description','status','stage','priority','health','progress','owner_user_id','start_date','due_date','budget','cost','hours','pending_tasks','logo_url','drive_folder_id','drive_folder_url','github_url','figma_url','hosting_url','domain','created_by','updated_by','created_at','updated_at'];
WONKUP_SCHEMAS[WONKUP_CONFIG.sheets.projectMembers] = ['id','project_id','user_id','role','allocation','status','created_at','updated_at'];
WONKUP_SCHEMAS[WONKUP_CONFIG.sheets.resources] = ['id','project_id','type','name','url','visibility','status','created_by','created_at','updated_at'];
WONKUP_SCHEMAS[WONKUP_CONFIG.sheets.milestones] = ['id','project_id','name','due_date','status','visibility','created_at','updated_at'];
WONKUP_SCHEMAS[WONKUP_CONFIG.sheets.driveFolders] = ['id','workspace_id','project_id','folder_type','drive_id','url','created_at'];
WONKUP_SCHEMAS[WONKUP_CONFIG.sheets.configuration] = ['key','scope_type','scope_id','value_json','updated_at'];
WONKUP_SCHEMAS[WONKUP_CONFIG.sheets.audit] = ['id','actor_id','action','entity_type','entity_id','details_json','created_at'];

function setupWonkUpMaster() {
  var spreadsheet = getMasterSpreadsheet_();
  Object.keys(WONKUP_SCHEMAS).forEach(function(name) {
    var sheet = spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
    ensureSheetSchema_(sheet, WONKUP_SCHEMAS[name]);
  });
  seedWonkUpDemoData_();
  Logger.log('Configuración Entrega 3 completada. Códigos demo: WONKUP-ADMIN, AGORA-ADMIN, TAXI-LIDER, TAXI-CLIENTE, HUELLITAS-INVITADO');
  return 'WonkUp Master actualizado para la Entrega 3.';
}

function ensureSheetSchema_(sheet, requiredHeaders) {
  var current = getHeaders_(sheet);
  if (!current.length) {
    sheet.getRange(1, 1, 1, requiredHeaders.length).setValues([requiredHeaders]);
  } else {
    var missing = requiredHeaders.filter(function(header) { return current.indexOf(header) < 0; });
    if (missing.length) sheet.getRange(1, current.length + 1, 1, missing.length).setValues([missing]);
  }
  var headers = getHeaders_(sheet);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#0b142c').setFontColor('#ffffff');
  sheet.autoResizeColumns(1, headers.length);
}

function seedWonkUpDemoData_() {
  var now = nowIso_();
  [
    {id:'w-wonkup',code:'WSP-WON',name:'WonkUp',short_name:'WonkUp',description:'Innovación, tecnología y desarrollo de proyectos.',status:'active'},
    {id:'w-agora',code:'WSP-AGO',name:'Ágora Education',short_name:'Ágora',description:'Educación, creatividad y proyectos de innovación escolar.',status:'active'},
    {id:'w-personalclass',code:'WSP-PC',name:'Personal Class',short_name:'Personal Class',description:'Servicios educativos personalizados y plataforma académica.',status:'active'},
    {id:'w-nija',code:'WSP-NIJ',name:'NIJA',short_name:'NIJA',description:'Café de especialidad, crecimiento comercial y alianzas.',status:'active'}
  ].forEach(function(item) { upsertDefaults_(WONKUP_CONFIG.sheets.workspaces, item.id, Object.assign({created_at:now,updated_at:now}, item)); });

  [
    {id:'usr-rodrigo',display_name:'Rodrigo',email:'rodrigo.demo@wonkup.pe',initials:'RG'},
    {id:'usr-edinson',display_name:'Edinson',email:'edinson.demo@wonkup.pe',initials:'EG'},
    {id:'usr-brenda',display_name:'Brenda',email:'brenda.demo@wonkup.pe',initials:'BG'},
    {id:'usr-cliente-taxi',display_name:'Cliente TaxiChurro',email:'cliente.demo@taxichurro.pe',initials:'CT'},
    {id:'usr-invitado',display_name:'Invitado Huellitas',email:'invitado.demo@wonkup.pe',initials:'IH'}
  ].forEach(function(item) { upsertDefaults_(WONKUP_CONFIG.sheets.users, item.id, Object.assign({status:'active',created_at:now,updated_at:now}, item)); });

  var grantSeeds = [
    ['WONKUP-ADMIN','usr-rodrigo','superadmin',['*'],['*']],
    ['AGORA-ADMIN','usr-edinson','workspace_admin',['w-agora'],['*']],
    ['TAXI-LIDER','usr-brenda','project_lead',['w-agora'],['p-taxichurro']],
    ['TAXI-CLIENTE','usr-cliente-taxi','client',['w-agora'],['p-taxichurro']],
    ['HUELLITAS-INVITADO','usr-invitado','guest',['w-agora'],['p-huellitas']]
  ];
  grantSeeds.forEach(function(item) {
    var hash = secretHash_(item[0]);
    var existing = findObject_(WONKUP_CONFIG.sheets.accessGrants, function(grant) { return String(grant.code_hash) === hash; });
    if (!existing) appendObject_(WONKUP_CONFIG.sheets.accessGrants, { id:Utilities.getUuid(),code_hash:hash,user_id:item[1],role:item[2],workspace_ids_json:JSON.stringify(item[3]),project_ids_json:JSON.stringify(item[4]),expires_at:'2027-12-31T23:59:59-05:00',status:'active',created_at:now,last_used_at:'' });
  });

  [
    {id:'client-wonkup',workspace_id:'w-wonkup',name:'WonkUp',contact_name:'Equipo WonkUp',email:'contacto@wonkup.org'},
    {id:'client-taxichurro',workspace_id:'w-agora',name:'TaxiChurro',contact_name:'Responsable TaxiChurro',email:'cliente.demo@taxichurro.pe'},
    {id:'client-agora',workspace_id:'w-agora',name:'Ágora Education',contact_name:'Coordinación de Innovación',email:'innovacion.demo@agora.edu.pe'},
    {id:'client-personalclass',workspace_id:'w-personalclass',name:'Personal Class',contact_name:'Administración Personal Class',email:'administracion.demo@personalclass.pe'},
    {id:'client-nija',workspace_id:'w-nija',name:'NIJA',contact_name:'Equipo comercial NIJA',email:'comercial.demo@nija.pe'}
  ].forEach(function(item) { upsertDefaults_(WONKUP_CONFIG.sheets.clients, item.id, Object.assign({phone:'',status:'active',created_at:now,updated_at:now}, item)); });

  var projects = [
    ['p-wonkup-workspace','w-wonkup','client-wonkup','PROY-WON-001','WonkUp Workspace','Centro operativo para innovación y gestión de proyectos.','planning','usr-edinson','2026-08-03','2026-10-30',18000,48],
    ['p-taxichurro','w-agora','client-taxichurro','PROY-AGO-001','TaxiChurro','Tu viaje local, seguro y al toque.','development','usr-rodrigo','2026-07-10','2026-08-30',8500,62],
    ['p-compraya','w-agora','client-agora','PROY-AGO-002','CompraYa','Todo lo local, en un solo lugar.','validation','usr-edinson','2026-06-18','2026-09-05',6200,45],
    ['p-huellitas','w-agora','client-agora','PROY-AGO-003','Huellitas Conecta','Cada huella merece volver a casa.','definition','usr-brenda','2026-07-22','2026-09-20',5600,30],
    ['p-selvaviva','w-agora','client-agora','PROY-AGO-004','Selva Viva','Naturaleza que nos conecta.','ux_ui','usr-edinson','2026-06-30','2026-09-12',6900,55],
    ['p-personalclass','w-personalclass','client-personalclass','PROY-PC-001','Plataforma Personal Class','Aprendizaje personalizado con seguimiento real.','development','usr-edinson','2026-05-15','2026-09-30',15000,70],
    ['p-nija-growth','w-nija','client-nija','PROY-NIJ-001','Crecimiento comercial NIJA','Café de especialidad que conecta origen y oportunidad.','launch','usr-rodrigo','2026-07-01','2026-11-15',9200,40]
  ];
  projects.forEach(function(item) {
    upsertDefaults_(WONKUP_CONFIG.sheets.projects, item[0], {id:item[0],workspace_id:item[1],client_id:item[2],code:item[3],name:item[4],tagline:item[5],description:'Proyecto demostrativo de WonkUp Workspace.',status:'active',stage:item[6],priority:'medium',health:'green',progress:item[11],owner_user_id:item[7],start_date:item[8],due_date:item[9],budget:item[10],cost:0,hours:0,pending_tasks:0,logo_url:'',drive_folder_id:'',drive_folder_url:'',github_url:'',figma_url:'',hosting_url:'',domain:'',created_by:'usr-rodrigo',updated_by:'usr-rodrigo',created_at:now,updated_at:now});
  });

  [
    ['pm-001','p-wonkup-workspace','usr-edinson','project_lead',50],
    ['pm-003','p-taxichurro','usr-rodrigo','project_lead',40],
    ['pm-004','p-taxichurro','usr-brenda','collaborator',30]
  ].forEach(function(item) { upsertDefaults_(WONKUP_CONFIG.sheets.projectMembers, item[0], {id:item[0],project_id:item[1],user_id:item[2],role:item[3],allocation:item[4],status:'active',created_at:now,updated_at:now}); });

  [
    ['ms-001','p-taxichurro','Validación del prototipo','2026-08-12','completed','client'],
    ['ms-002','p-taxichurro','Pruebas con usuarios','2026-08-22','active','client'],
    ['ms-003','p-taxichurro','Entrega de versión demostrativa','2026-08-30','planned','client']
  ].forEach(function(item) { upsertDefaults_(WONKUP_CONFIG.sheets.milestones, item[0], {id:item[0],project_id:item[1],name:item[2],due_date:item[3],status:item[4],visibility:item[5],created_at:now,updated_at:now}); });
}
