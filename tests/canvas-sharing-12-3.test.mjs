import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const read = path => fs.readFileSync(new URL(path, root), 'utf8');

test('Canvas share permissions distinguish reader, commenter and editor', async () => {
  const permissions = await import(`../js/utils/permissions.js?share=${Date.now()}`);
  const base = {
    source: 'firebase',
    role: 'guest',
    scopes: { workspaceIds: [], projectIds: [] },
    canvasShareAccess: {
      'canvas-1': {
        active: true,
        workspaceId: 'w-1',
        projectId: 'p-1',
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      }
    }
  };
  const session = permission => ({
    ...base,
    canvasShareAccess: { 'canvas-1': { ...base.canvasShareAccess['canvas-1'], permission } }
  });
  assert.equal(permissions.canViewCanvas(session('viewer'), 'p-1', 'w-1', 'canvas-1'), true);
  assert.equal(permissions.canCommentCanvas(session('viewer'), 'p-1', 'w-1', 'canvas-1'), false);
  assert.equal(permissions.canCommentCanvas(session('commenter'), 'p-1', 'w-1', 'canvas-1'), true);
  assert.equal(permissions.canEditCanvas(session('commenter'), 'p-1', 'w-1', 'canvas-1'), false);
  assert.equal(permissions.canEditCanvas(session('editor'), 'p-1', 'w-1', 'canvas-1'), true);
});

test('Cloud Functions manage personalized Canvas access securely', () => {
  const functions = read('functions/index.js');
  for (const name of [
    'wonkupCreateCanvasShareAccess',
    'wonkupListCanvasShareAccess',
    'wonkupUpdateCanvasShareAccess',
    'wonkupRevokeCanvasShareAccess',
    'wonkupResolveCanvasShareAccess'
  ]) assert.match(functions, new RegExp(`exports\\.${name}`));
  assert.match(functions, /getUserByEmail/);
  assert.match(functions, /requireCanvasManager/);
  assert.match(functions, /CANVAS_SHARE_PERMISSIONS = Object\.freeze\(\['viewer', 'commenter', 'editor'\]\)/);
  assert.match(functions, /Este enlace fue asignado a otra Cuenta WonkUp/);
});

test('Firestore rules isolate personalized links and enforce granular permissions', () => {
  const rules = read('firebase/firestore.rules');
  assert.match(rules, /function hasActiveCanvasAccess/);
  assert.match(rules, /function canCommentCanvasDocument/);
  assert.match(rules, /function canEditCanvasDocument/);
  assert.match(rules, /canvasAccessPermission\(workspaceId, projectId, canvasId\) in \['viewer', 'commenter', 'editor'\]/);
  assert.match(rules, /match \/canvasShareAccess\/\{shareId\}/);
  assert.match(rules, /allow read, write: if false/);
  assert.match(rules, /match \/access\/\{memberId\}/);
  assert.match(rules, /'commentCount', 'updatedAt', 'schemaVersion'/);
});

test('Restricted share links are never copied to public Canvas snapshots', () => {
  const adapter = read('js/adapters/firebase-canvas-adapter.js');
  assert.match(adapter, /link\.shareType !== 'person'/);
  assert.match(adapter, /link\.requiresAuth !== true/);
  assert.match(adapter, /collaborativeShareSession/);
  assert.match(adapter, /getSharedCollaborativeInstance/);
});

test('Canvas sharing UI provides authenticated access management and return-to-link login', () => {
  const view = read('js/views/canvas-view.js');
  const access = read('js/views/access-view.js');
  const app = read('js/app.js');
  assert.match(view, /Personas con acceso/);
  assert.match(view, /Editor en tiempo real/);
  assert.match(view, /Comentarista/);
  assert.match(view, /renderPersonShareAccess/);
  assert.match(view, /wonkup\.auth\.returnHash/);
  assert.match(access, /sessionStorage\.getItem\('wonkup\.auth\.returnHash'\)/);
  assert.match(app, /renderSharedCanvas\(host, route\.params\.token, session\)/);
});

test('Anonymous public Canvas links remain read-only', () => {
  const adapter = read('js/adapters/firebase-canvas-adapter.js');
  const view = read('js/views/canvas-view.js');
  assert.match(adapter, /shareType: 'public'/);
  assert.match(adapter, /permission: 'viewer'/);
  assert.match(adapter, /requiresAuth: false/);
  assert.match(view, /Enlace público de solo lectura/);
  assert.match(view, /readOnly: true, sharedToken: token, sharedAccess: null/);
});
