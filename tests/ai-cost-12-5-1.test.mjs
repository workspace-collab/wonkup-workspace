import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const read = path => fs.readFileSync(new URL(path, root), 'utf8');

test('Hotfix 12.5.1 prices Gemini 3.1 Flash-Lite at the current Standard paid-tier rate', () => {
  const functions = read('functions/index.js');
  assert.match(functions, /'gemini-3\.1-flash-lite': Object\.freeze\(\{ input: 0\.25, output: 1\.50 \}\)/);
  assert.match(functions, /default: 'gemini-3\.1-flash-lite'/);
  assert.match(functions, /const RELEASE = '12\.5\.1'/);
});

test('Hotfix 12.5.1 recalculates historical zero-cost events from their model and token counts', () => {
  const functions = read('functions/index.js');
  assert.match(functions, /function aiEventEstimatedCostUsd/);
  assert.match(functions, /if \(stored > 0\) return stored/);
  assert.match(functions, /return estimateAiCostUsd\(cleanText\(event\.model, 80\), event\)/);
  assert.match(functions, /totals\.estimatedCostUsd \+= aiEventEstimatedCostUsd\(event\)/);
  assert.match(functions, /user\.estimatedCostUsd \+= aiEventEstimatedCostUsd\(event\)/);
  assert.match(functions, /current\.estimatedCostUsd \+= aiEventEstimatedCostUsd\(event\)/);
});

test('Hotfix 12.5.1 recalculates monthly budget cost from immutable AI interaction events', () => {
  const functions = read('functions/index.js');
  assert.match(functions, /const monthEvents = monthDateKeys\.every\(date => loadedDateKeys\.has\(date\)\)/);
  assert.match(functions, /allEvents\.filter\(event => monthDateKeySet\.has\(event\.date\)\)/);
  assert.match(functions, /await loadAiEventsForDates\(monthDateKeys\)/);
  assert.match(functions, /successfulMonthEvents = monthEvents\.filter\(event => event\.success !== false\)/);
  assert.match(functions, /successfulMonthEvents\.reduce\(\(sum, event\) => sum \+ aiEventEstimatedCostUsd\(event\), 0\)/);
  assert.match(functions, /const monthRequests = successfulMonthEvents\.length/);
});
