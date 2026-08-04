function getSheet_(name) {
  var sheet = getMasterSpreadsheet_().getSheetByName(name);
  if (!sheet) throw new Error('No existe la hoja requerida: ' + name);
  return sheet;
}

function getHeaders_(sheet) {
  var lastColumn = sheet.getLastColumn();
  if (!lastColumn) return [];
  return sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(String);
}

function getObjects_(sheetName) {
  var sheet = getSheet_(sheetName);
  var headers = getHeaders_(sheet);
  if (!headers.length || sheet.getLastRow() < 2) return [];
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, headers.length).getValues();
  return values.map(function(row, index) {
    var object = { __row: index + 2 };
    headers.forEach(function(header, column) { object[header] = row[column]; });
    return object;
  });
}

function findObject_(sheetName, predicate) {
  var objects = getObjects_(sheetName);
  for (var index = 0; index < objects.length; index += 1) {
    if (predicate(objects[index])) return objects[index];
  }
  return null;
}

function appendObject_(sheetName, object) {
  var sheet = getSheet_(sheetName);
  var headers = getHeaders_(sheet);
  var row = headers.map(function(header) { return object[header] !== undefined ? object[header] : ''; });
  sheet.appendRow(row);
  return object;
}

function updateObject_(sheetName, rowNumber, patch) {
  var sheet = getSheet_(sheetName);
  var headers = getHeaders_(sheet);
  headers.forEach(function(header, index) {
    if (patch[header] !== undefined) sheet.getRange(rowNumber, index + 1).setValue(patch[header]);
  });
}

function jsonArray_(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try { return JSON.parse(String(value)); } catch (error) { return []; }
}

function nowIso_() {
  return new Date().toISOString();
}

function sha256_(value) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value), Utilities.Charset.UTF_8);
  return bytes.map(function(byte) {
    var normalized = byte < 0 ? byte + 256 : byte;
    return ('0' + normalized.toString(16)).slice(-2);
  }).join('');
}

function secretHash_(value) {
  var properties = PropertiesService.getScriptProperties();
  var pepper = properties.getProperty('ACCESS_PEPPER');
  if (!pepper) {
    pepper = randomToken_();
    properties.setProperty('ACCESS_PEPPER', pepper);
  }
  return sha256_(pepper + ':' + String(value));
}

function randomToken_() {
  return Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
}

function audit_(actorId, action, entityType, entityId, details) {
  appendObject_(WONKUP_CONFIG.sheets.audit, {
    id: Utilities.getUuid(),
    actor_id: actorId || 'anonymous',
    action: action,
    entity_type: entityType,
    entity_id: entityId || '',
    details_json: JSON.stringify(details || {}),
    created_at: nowIso_()
  });
}

function upsertObject_(sheetName, id, object) {
  var existing = findObject_(sheetName, function(item) { return String(item.id) === String(id); });
  if (existing) {
    updateObject_(sheetName, existing.__row, object);
    return Object.assign({}, existing, object);
  }
  appendObject_(sheetName, object);
  return object;
}

function upsertDefaults_(sheetName, id, object) {
  var existing = findObject_(sheetName, function(item) { return String(item.id) === String(id); });
  if (!existing) {
    appendObject_(sheetName, object);
    return object;
  }
  var patch = {};
  Object.keys(object).forEach(function(key) {
    var current = existing[key];
    if ((current === '' || current === null || current === undefined) && object[key] !== '' && object[key] !== null && object[key] !== undefined) {
      patch[key] = object[key];
    }
  });
  if (Object.keys(patch).length) updateObject_(sheetName, existing.__row, patch);
  return Object.assign({}, existing, patch);
}
