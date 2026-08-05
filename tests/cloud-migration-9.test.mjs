import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFoundationMigrationPlan, getLocalFoundationSnapshot } from '../js/cloud/migration-plan.js';
import { canCreateProject, canEditProject, canManageCloudFoundation } from '../js/utils/permissions.js';

test('migration plan is deterministic and has unique paths', () => {
  const snapshot = getLocalFoundationSnapshot();
  const plan = buildFoundationMigrationPlan(snapshot);
  assert.equal(plan.schemaVersion, 9);
  assert.ok(plan.counts.workspaces >= 4);
  assert.ok(plan.counts.projects >= 7);
  assert.ok(plan.counts.total > plan.counts.projects);
  assert.deepEqual(plan.duplicates, []);
  assert.equal(new Set(plan.operations.map(item => item.path)).size, plan.operations.length);
  assert.ok(plan.operations.every(item => item.path.startsWith('workspaces/')));
});

test('workspace filter excludes unrelated projects', () => {
  const snapshot = getLocalFoundationSnapshot();
  const plan = buildFoundationMigrationPlan(snapshot, { workspaceIds: ['w-agora'] });
  assert.deepEqual(plan.selectedWorkspaceIds, ['w-agora']);
  assert.ok(plan.operations.every(item => item.path.includes('workspaces/w-agora')));
  assert.ok(plan.counts.projects >= 4);
});

test('module flags create a safe dry run', () => {
  const snapshot = getLocalFoundationSnapshot();
  const plan = buildFoundationMigrationPlan(snapshot, {
    workspaceIds: ['w-wonkup'],
    include: { workspaces: true, projects: false, clients: false, people: false, projectMembers: false }
  });
  assert.equal(plan.counts.total, 1);
  assert.equal(plan.operations[0].path, 'workspaces/w-wonkup');
});

test('role maps do not over-authorize unrelated projects', () => {
  const session = {
    role: 'collaborator',
    workspaceRoles: { 'w-agora': 'workspace_admin' },
    projectRoles: { 'p-one': 'project_lead' },
    scopes: { workspaceIds: ['w-agora', 'w-wonkup'], projectIds: ['p-one', 'p-two'] }
  };
  assert.equal(canCreateProject(session), true);
  assert.equal(canCreateProject(session, 'w-agora'), true);
  assert.equal(canCreateProject(session, 'w-wonkup'), false);
  assert.equal(canEditProject(session, 'p-one', 'w-wonkup'), true);
  assert.equal(canEditProject(session, 'p-two', 'w-wonkup'), false);
  assert.equal(canManageCloudFoundation(session), false);
});
