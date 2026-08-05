import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const read = path => fs.readFileSync(new URL(path, root), 'utf8');

const planModule = await import(`../js/cloud/kanban-migration-plan.js?test=${Date.now()}`);

test('Kanban migration plan creates deterministic board and card paths', () => {
  const plan = planModule.buildKanbanMigrationPlan();
  assert.equal(plan.counts.boards, 1);
  assert.equal(plan.counts.cards, 9);
  assert.equal(plan.counts.total, 10);
  assert.deepEqual(plan.duplicates, []);
  assert.ok(plan.operations.some(item => item.path === 'workspaces/w-agora/projects/p-taxichurro/boards/main'));
  assert.ok(plan.operations.some(item => item.path.endsWith('/boards/main/cards/card-taxi-001')));
});

test('Kanban migration respects workspace filters', () => {
  const plan = planModule.buildKanbanMigrationPlan(undefined, { workspaceIds: ['w-wonkup'] });
  assert.equal(plan.counts.boards, 0);
  assert.equal(plan.counts.cards, 0);
});

test('Kanban hybrid mode routes Firebase sessions to Firestore', async () => {
  globalThis.WONKUP_API_CONFIG = { mode: 'mock', kanbanMode: 'hybrid', firebase: {} };
  delete globalThis.BroadcastChannel;
  globalThis.window = { addEventListener() {} };
  globalThis.localStorage = { getItem() { return null; }, setItem() {} };
  const service = await import(`../js/services/kanban-service.js?test=${Date.now()}`);
  assert.equal(service.kanbanDataSourceForSession({ source: 'firebase' }), 'firebase');
  assert.equal(service.kanbanDataSourceForSession({ source: 'mock' }), 'mock');
});

test('Firebase Kanban adapter reuses the shared Firebase client', () => {
  const source = read('js/adapters/firebase-kanban-adapter.js');
  assert.match(source, /getFirebaseClient/);
  assert.doesNotMatch(source, /firebaseCustomToken/);
  assert.doesNotMatch(source, /10\.12\.5/);
  assert.match(source, /commitCardPatches/);
  assert.match(source, /chunkSize = 4/);
});

test('Firestore rules cover boards, activity and user notifications', () => {
  const rules = read('firebase/firestore.rules');
  assert.match(rules, /function canReadKanban/);
  assert.match(rules, /projectRole\(workspaceId, projectId\) == 'reviewer'/);
  assert.match(rules, /match \/activity\/\{eventId\}/);
  assert.match(rules, /match \/notifications\/\{notificationId\}/);
  assert.match(rules, /affectedKeys\(\)\.hasOnly\(\['read', 'readAt'\]\)/);
});


test('Reviewer can read the Kanban directory and comment without editing the board', () => {
  const rules = read('firebase/firestore.rules');
  const adapter = read('js/adapters/firebase-kanban-adapter.js');
  assert.match(rules, /workspaceRole\(workspaceId\) == 'reviewer'/);
  assert.match(rules, /allow read: if canReadKanban\(workspaceId, projectId\)/);
  assert.match(adapter, /if \(canEditKanban\(session, projectId, workspaceId\)\) \{\s*await updateBoardTouch/);
});

test('Cloud Foundation exposes the Kanban migration controls', () => {
  const view = read('js/views/cloud-foundation-view.js');
  const service = read('js/services/cloud-foundation-service.js');
  assert.match(view, /id="execute-kanban-migration"/);
  assert.match(view, /id="verify-kanban-migration"/);
  assert.match(service, /async migrateKanban/);
  assert.match(service, /async verifyKanbanMigration/);
});
