import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const read = path => fs.readFileSync(new URL(path, root), 'utf8');

test('12.5 records token usage and estimated cost per AI interaction', () => {
  const functions = read('functions/index.js');
  assert.match(functions, /payload\.usageMetadata/);
  assert.match(functions, /promptTokenCount/);
  assert.match(functions, /candidatesTokenCount/);
  assert.match(functions, /thoughtsTokenCount/);
  assert.match(functions, /estimatedCostUsd/);
  assert.match(functions, /aiUsageEvents\/\$\{interactionId\}/);
  assert.match(functions, /'gemini-2\.5-flash-lite'.*input: 0\.10, output: 0\.40/s);
});

test('12.5 aggregates AI usage by user, action, workspace, project and Lienzo', () => {
  const functions = read('functions/index.js');
  assert.match(functions, /function aggregateAiEvents/);
  assert.match(functions, /usageShare/);
  assert.match(functions, /acceptanceRate/);
  assert.match(functions, /topCanvases/);
  assert.match(functions, /workspaceId/);
  assert.match(functions, /projectId/);
  assert.match(functions, /canvasId/);
  assert.match(functions, /wonkupAiUsageSummary/);
});

test('12.5 tracks accepted AI notes idempotently', () => {
  const functions = read('functions/index.js');
  assert.match(functions, /exports\.wonkupRecordAiAcceptance/);
  assert.match(functions, /db\.runTransaction/);
  assert.match(functions, /previousAccepted/);
  assert.match(functions, /delta = Math\.max\(0, nextAccepted - previousAccepted\)/);
  assert.match(functions, /acceptedNotes: FieldValue\.increment\(delta\)/);
});

test('Superadmin has an IA y consumo control center', () => {
  const view = read('js/views/ai-admin-view.js');
  const shell = read('js/components/app-shell.js');
  const router = read('js/router.js');
  const permissions = read('js/utils/permissions.js');
  assert.match(view, /IA y consumo/);
  assert.match(view, /Presupuesto mensual/);
  assert.match(view, /Tasa de aceptación/);
  assert.match(view, /Indicador/);
  assert.match(view, /Excepcional/);
  assert.match(view, /Intensivo/);
  assert.match(view, /Usuarios/);
  assert.match(view, /Lienzos/);
  assert.match(shell, /\['aiAdmin', 'IA y consumo'/);
  assert.match(router, /#\\\/master\\\/ai/);
  assert.match(permissions, /'aiAdmin'/);
});

test('Budget control is alert-only and does not cap users during the pilot', () => {
  const functions = read('functions/index.js');
  const admin = read('js/views/ai-admin-view.js');
  assert.match(functions, /AI_DEFAULT_MONTHLY_BUDGET_USD = 10/);
  assert.match(functions, /budgetAction: 'alert_only'/);
  assert.match(functions, /alertThresholds: \[50, 75, 90, 100\]/);
  assert.match(functions, /unlimitedPerUser: true/);
  assert.match(admin, /no suspende automáticamente la IA/);
});

test('Generic user-facing Canvas terminology is presented as Lienzo while internal routes remain compatible', () => {
  const project = read('js/views/project-view.js');
  const toolkit = read('js/views/toolkit-view.js');
  const shell = read('js/components/app-shell.js');
  const router = read('js/router.js');
  assert.match(project, /Lienzos/);
  assert.match(toolkit, /Nuevo lienzo/);
  assert.match(toolkit, /Motor de Lienzos/);
  assert.match(shell, /Nuevo lienzo/);
  assert.match(router, /share\\\/canvas/);
  assert.match(router, /\\\/canvas\\\//);
});
