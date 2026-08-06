import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const read = path => fs.readFileSync(new URL(path, root), 'utf8');
const planModule = await import(`../js/cloud/canvas-migration-plan.js?test=${Date.now()}`);

test('Canvas migration creates deterministic Firestore paths without duplicates', () => {
  const plan = planModule.buildCanvasMigrationPlan();
  assert.equal(plan.schemaVersion, 12);
  assert.equal(plan.counts.canvases, 4);
  assert.equal(plan.counts.notes, 11);
  assert.equal(plan.counts.total, 24);
  assert.deepEqual(plan.duplicates, []);
  assert.ok(plan.operations.some(item => item.path === 'workspaces/w-agora/projects/p-taxichurro/canvases/canvas-taxi-lean'));
  assert.ok(plan.operations.some(item => item.path.includes('/canvases/canvas-taxi-lean/notes/')));
});

test('Canvas migration respects workspace filters', () => {
  const plan = planModule.buildCanvasMigrationPlan(undefined, { workspaceIds: ['w-wonkup'] });
  assert.equal(plan.counts.canvases, 0);
  assert.equal(plan.counts.notes, 0);
});

test('Canvas hybrid mode routes Firebase accounts to Firestore and demos to local storage', async () => {
  globalThis.WONKUP_API_CONFIG = { mode: 'mock', canvasMode: 'hybrid', firebase: {} };
  delete globalThis.BroadcastChannel;
  globalThis.window = { addEventListener() {} };
  globalThis.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
  globalThis.sessionStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
  const service = await import(`../js/services/canvas-service.js?test=${Date.now()}`);
  assert.equal(service.canvasDataSourceForSession({ source: 'firebase' }), 'firebase');
  assert.equal(service.canvasDataSourceForSession({ source: 'mock' }), 'mock');
});

test('Firebase Canvas adapter uses Firestore transactions, listeners and RTDB presence', () => {
  const adapter = read('js/adapters/firebase-canvas-adapter.js');
  assert.match(adapter, /getFirebaseClient/);
  assert.match(adapter, /runTransaction/);
  assert.match(adapter, /onSnapshot/);
  assert.match(adapter, /onDisconnect/);
  assert.match(adapter, /\.info\/connected/);
  assert.match(adapter, /canvasShares/);
  assert.match(adapter, /estimatedWrites > 450/);
  assert.doesNotMatch(adapter, /initializeApp\(/);
});

test('Firebase loader and runtime configure Realtime Database', () => {
  const loader = read('js/cloud/firebase-sdk-loader.js');
  const client = read('js/cloud/firebase-client.js');
  const runtime = read('js/config/runtime-config.js');
  assert.match(loader, /sdkUrl\('database'\)/);
  assert.match(client, /getDatabase\(app, API_CONFIG\.firebase\.databaseURL\)/);
  assert.match(runtime, /canvasMode: 'hybrid'/);
  assert.match(runtime, /https:\/\/wonkup-workspace-default-rtdb\.firebaseio\.com/);
});

test('Firestore rules protect Canvas internals and expose only active public snapshots', () => {
  const rules = read('firebase/firestore.rules');
  assert.match(rules, /function validCanvas\(/);
  assert.match(rules, /function validCanvasNote\(/);
  assert.match(rules, /match \/canvasShares\/\{shareId\}/);
  assert.match(rules, /allow get: if resource\.data\.active == true/);
  assert.match(rules, /allow list: if false/);
  assert.match(rules, /match \/canvases\/\{canvasId\}/);
  assert.match(rules, /allow delete: if false/);
});

test('Realtime Database rules allow users to write only their own presence connection', () => {
  const rules = JSON.parse(read('firebase/realtime-database.rules.json'));
  const connection = rules.rules.presence.$workspaceId.$projectId.$canvasId.$uid.$connectionId;
  assert.equal(connection['.write'], 'auth != null && auth.uid == $uid');
  assert.match(connection.authUid['.validate'], /auth\.uid/);
  assert.match(connection.clientId['.validate'], /\$connectionId/);
  assert.equal(connection.$other['.validate'], false);
});

test('Cloud Foundation exposes Canvas backup, simulation, migration and verification', () => {
  const view = read('js/views/cloud-foundation-view.js');
  const service = read('js/services/cloud-foundation-service.js');
  assert.match(view, /id="export-canvas-backup"/);
  assert.match(view, /id="preview-canvas-migration"/);
  assert.match(view, /id="execute-canvas-migration"/);
  assert.match(view, /id="verify-canvas-migration"/);
  assert.match(service, /async migrateCanvas/);
  assert.match(service, /async verifyCanvasMigration/);
  assert.match(service, /canvasSchemaVersion: 12/);
});

test('Canvas permissions follow the project role rather than the global profile role', async () => {
  const permissions = await import(`../js/utils/permissions.js?canvasRoles=${Date.now()}`);
  const base = {
    role: 'collaborator',
    scopes: { workspaceIds: ['w-wonkup'], projectIds: ['p-wonkup-workspace'] },
    workspaceRoles: { 'w-wonkup': 'collaborator' }
  };
  assert.equal(permissions.canViewCanvas({
    ...base,
    projectRoles: { 'p-wonkup-workspace': 'reviewer' }
  }, 'p-wonkup-workspace', 'w-wonkup'), false);
  assert.equal(permissions.canEditCanvas({
    ...base,
    role: 'reviewer',
    projectRoles: { 'p-wonkup-workspace': 'collaborator' }
  }, 'p-wonkup-workspace', 'w-wonkup'), true);
  assert.equal(permissions.canManageCanvas({
    ...base,
    projectRoles: { 'p-wonkup-workspace': 'project_lead' }
  }, 'p-wonkup-workspace', 'w-wonkup'), true);
});


test('Hotfix 12.0.1 indexes project assignments for dynamic cloud projects', () => {
  const access = read('js/adapters/firebase-access-adapter.js');
  const projects = read('js/adapters/firebase-project-adapter.js');
  const activation = read('js/cloud/user-activation-plan.js');
  const rules = read('firebase/firestore.rules');
  assert.match(access, /getProjectAssignmentContext/);
  assert.match(access, /projectAssignments/);
  assert.match(projects, /users', authUid, 'projectAssignments'/);
  assert.match(projects, /status: 'inactive'/);
  assert.match(activation, /group: 'projectAssignments'/);
  assert.match(rules, /match \/projectAssignments\/\{projectId\}/);
  assert.match(rules, /canLeadProject\(request\.resource\.data\.workspaceId, projectId\)/);
});
