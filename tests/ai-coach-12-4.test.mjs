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
  assert.match(functions, /gemini-2\.5-flash/);
  assert.doesNotMatch(runtime, /GEMINI_API_KEY/);
});

test('AI Coach authenticates users and limits daily usage before calling Gemini', () => {
  const functions = read('functions/index.js');
  assert.match(functions, /requireAiCanvasAccess/);
  assert.match(functions, /AI_DAILY_USER_LIMIT = 30/);
  assert.match(functions, /AI_DAILY_GLOBAL_LIMIT = 1000/);
  assert.match(functions, /reserveAiQuota/);
  assert.match(functions, /aiUsage\/\$\{date\}\/users\/\$\{uid\}/);
});

test('AI Coach is methodology-aware for WonkUp canvas templates', () => {
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

test('Canvas UI exposes questions, review and note suggestions', () => {
  const view = read('js/views/canvas-view.js');
  assert.match(view, /WonkUp AI Coach/);
  assert.match(view, /Preguntas guía/);
  assert.match(view, /Revisar sección/);
  assert.match(view, /Proponer notas/);
  assert.match(view, /Agregar seleccionadas al Canvas/);
  assert.match(view, /AiCoachService\.suggestNotes/);
});

test('AI-generated notes are only inserted after explicit user selection', () => {
  const view = read('js/views/canvas-view.js');
  assert.match(view, /data-ai-suggestion/);
  assert.match(view, /CanvasService\.createNote/);
  assert.match(view, /Revisa cada propuesta antes de agregarla/);
});

test('AI usage counters cannot be read or written from the browser', () => {
  const rules = read('firebase/firestore.rules');
  assert.match(rules, /match \/aiUsage\/\{document=\*\*\}/);
  assert.match(rules, /allow read, write: if false/);
});



test('Hotfix 12.4.1 uses the supported Gemini structured-output fields', () => {
  const functions = read('functions/index.js');
  assert.match(functions, /responseMimeType: 'application\/json'/);
  assert.match(functions, /responseJsonSchema: aiResponseSchema\(action\)/);
  assert.doesNotMatch(functions, /responseFormat:\s*\{/);
  assert.doesNotMatch(functions, /mimeType:\s*'application\/json'/);
  assert.match(functions, /refundAiQuota/);
  assert.match(functions, /quota could not be refunded after a failed Gemini request/);
});

test('Frontend remains 12.4 while the AI function package is hotfixed to 12.4.1', () => {
  const runtime = read('js/config/runtime-config.js');
  const appConfig = read('js/config/app-config.js');
  const index = read('index.html');
  const pkg = JSON.parse(read('functions/package.json'));
  assert.match(runtime, /release: '12\.4\.0'/);
  assert.match(appConfig, /0\.12\.4-ai-coach/);
  assert.match(index, /bootstrap\.js\?v=12\.4\.0/);
  assert.equal(pkg.version, '12.4.1');
});
