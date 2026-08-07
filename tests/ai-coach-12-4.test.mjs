import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const read = path => fs.readFileSync(new URL(path, root), 'utf8');

test('AI Coach keeps the Gemini credential server-side in Secret Manager', () => {
  const functions = read('functions/index.js');
  const runtime = read('js/config/runtime-config.js');
  assert.match(functions, /defineSecret\('GEMINI_API_KEY'\)/);
  assert.match(functions, /secrets: \[GEMINI_API_KEY\]/);
  assert.match(functions, /x-goog-api-key/);
  assert.match(functions, /gemini-2\.5-flash-lite/);
  assert.doesNotMatch(runtime, /GEMINI_API_KEY/);
});

test('AI Coach pilot is unlimited by WonkUp and no longer reserves daily quota', () => {
  const functions = read('functions/index.js');
  assert.match(functions, /requireAiCanvasAccess/);
  assert.match(functions, /unlimitedPerUser: true/);
  assert.doesNotMatch(functions, /AI_DAILY_USER_LIMIT/);
  assert.doesNotMatch(functions, /AI_DAILY_GLOBAL_LIMIT/);
  assert.doesNotMatch(functions, /reserveAiQuota/);
  assert.doesNotMatch(functions, /refundAiQuota/);
});

test('AI Coach is methodology-aware for WonkUp Lienzos while preserving canonical methodology names', () => {
  const functions = read('functions/index.js');
  for (const method of [
    'Business Model Canvas de Osterwalder y Pigneur',
    'Lean Canvas de Ash Maurya',
    'Value Proposition Canvas de Strategyzer',
    'Design Thinking / Mapa de Empatía'
  ]) assert.match(functions, new RegExp(method.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(functions, /No inventes clientes, cifras, evidencias ni hechos/);
  assert.match(functions, /evidence', 'inference', 'hypothesis/);
});

test('Lienzo UI exposes questions, review and note suggestions without a user quota counter', () => {
  const view = read('js/views/canvas-view.js');
  assert.match(view, /WonkUp AI Coach/);
  assert.match(view, /Preguntas guía/);
  assert.match(view, /Revisar sección/);
  assert.match(view, /Proponer notas/);
  assert.match(view, /Agregar seleccionadas al lienzo/);
  assert.match(view, /uso libre durante el piloto/);
  assert.doesNotMatch(view, /30 consultas/);
  assert.match(view, /AiCoachService\.suggestNotes/);
});

test('AI-generated notes are inserted only after explicit selection and acceptance is measured', () => {
  const view = read('js/views/canvas-view.js');
  const service = read('js/services/ai-coach-service.js');
  assert.match(view, /data-ai-suggestion/);
  assert.match(view, /CanvasService\.createNote/);
  assert.match(view, /Revisa cada propuesta antes de agregarla/);
  assert.match(view, /AiCoachService\.recordAcceptance/);
  assert.match(service, /wonkupRecordAiAcceptance/);
});

test('AI metrics cannot be read or written directly from the browser', () => {
  const rules = read('firebase/firestore.rules');
  assert.match(rules, /match \/aiUsage\/\{document=\*\*\}/);
  assert.match(rules, /match \/aiUsageEvents\/\{document=\*\*\}/);
  assert.match(rules, /allow read, write: if false/);
});

test('Hotfix 12.4.1 structured output remains supported in 12.5', () => {
  const functions = read('functions/index.js');
  assert.match(functions, /responseMimeType: 'application\/json'/);
  assert.match(functions, /responseJsonSchema: aiResponseSchema\(action\)/);
  assert.doesNotMatch(functions, /responseFormat:\s*\{/);
  assert.doesNotMatch(functions, /mimeType:\s*'application\/json'/);
});

test('Frontend stays on Ajuste 12.5 while Functions carry Hotfix 12.5.1', () => {
  const runtime = read('js/config/runtime-config.js');
  const appConfig = read('js/config/app-config.js');
  const index = read('index.html');
  const pkg = JSON.parse(read('functions/package.json'));
  assert.match(runtime, /release: '12\.5\.0'/);
  assert.match(appConfig, /0\.12\.5-lienzos-ai-usage/);
  assert.match(index, /bootstrap\.js\?v=12\.5\.0/);
  assert.equal(pkg.version, '12.5.1');
});
