function doGet(e) {
  return handleRequest_(e);
}

function doPost(e) {
  return handleRequest_(e);
}

function handleRequest_(e) {
  try {
    var action = String((e && e.parameter && e.parameter.action) || 'health');
    var payload = {};
    var rawPayload = e && e.parameter && e.parameter.payload;
    if (rawPayload) payload = JSON.parse(rawPayload);
    var data = routeRequest_(action, payload);
    return jsonResponse_({ ok: true, data: data });
  } catch (error) {
    return jsonResponse_({ ok: false, error: error.message || String(error) });
  }
}

function jsonResponse_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
