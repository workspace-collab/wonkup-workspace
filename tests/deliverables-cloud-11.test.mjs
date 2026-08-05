import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const read = path => fs.readFileSync(new URL(path, root), 'utf8');
const planModule = await import(`../js/cloud/deliverable-migration-plan.js?test=${Date.now()}`);

test('Deliverable migration creates deterministic project paths', () => {
  const plan = planModule.buildDeliverableMigrationPlan();
  assert.equal(plan.counts.deliverables, 6);
  assert.equal(plan.counts.total, 6);
  assert.equal(plan.counts.versions, 5);
  assert.equal(plan.counts.comments, 2);
  assert.deepEqual(plan.duplicates, []);
  assert.ok(plan.operations.some(item => item.path === 'workspaces/w-agora/projects/p-taxichurro/deliverables/del-taxi-prototype'));
});

test('Deliverable migration respects workspace filters', () => {
  const plan = planModule.buildDeliverableMigrationPlan(undefined, { workspaceIds: ['w-wonkup'] });
  assert.equal(plan.counts.deliverables, 0);
});

test('Deliverable hybrid mode routes Firebase sessions to Firestore', async () => {
  globalThis.WONKUP_API_CONFIG = { mode: 'mock', deliverableMode: 'hybrid', firebase: {} };
  delete globalThis.BroadcastChannel;
  globalThis.window = { addEventListener() {} };
  globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
  const service = await import(`../js/services/deliverable-service.js?test=${Date.now()}`);
  assert.equal(service.deliverableDataSourceForSession({ source: 'firebase' }), 'firebase');
  assert.equal(service.deliverableDataSourceForSession({ source: 'mock' }), 'mock');
});

test('Firebase deliverable adapter uses shared Firebase singleton and realtime listener', () => {
  const source = read('js/adapters/firebase-deliverable-adapter.js');
  assert.match(source, /getFirebaseClient/);
  assert.match(source, /startRealtime/);
  assert.match(source, /onSnapshot/);
  assert.match(source, /where\('visibility', '==', 'client'\)/);
  assert.doesNotMatch(source, /initializeApp\(/);
  assert.doesNotMatch(source, /initializeFirestore\(/);
});

test('Firestore rules restrict deliverables by visibility and safe field updates', () => {
  const rules = read('firebase/firestore.rules');
  assert.match(rules, /function validDeliverable/);
  assert.match(rules, /function canManageDeliverables/);
  assert.match(rules, /function canReviewDeliverables/);
  assert.match(rules, /resource\.data\.visibility == 'client'/);
  assert.match(rules, /'comments', 'history', 'updatedAt', 'updatedBy', 'schemaVersion'/);
});

test('Cloud Foundation exposes deliverable backup, migration and verification', () => {
  const view = read('js/views/cloud-foundation-view.js');
  const service = read('js/services/cloud-foundation-service.js');
  assert.match(view, /id="export-deliverable-backup"/);
  assert.match(view, /id="execute-deliverable-migration"/);
  assert.match(view, /id="verify-deliverable-migration"/);
  assert.match(service, /async migrateDeliverables/);
  assert.match(service, /async verifyDeliverableMigration/);
});

test('Deliverable view passes workspace and project context to cloud operations', () => {
  const view = read('js/views/deliverables-view.js');
  assert.match(view, /getDeliverable\(\{ deliverableId, workspaceId: context\.workspaceId, projectId: context\.projectId/);
  assert.match(view, /requestReview\(\{ deliverableId, workspaceId: item\.workspaceId, projectId: item\.projectId/);
  assert.match(view, /startRealtime/);
});
