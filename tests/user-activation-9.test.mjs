import test from 'node:test';
import assert from 'node:assert/strict';
import { buildUserActivationPlan } from '../js/cloud/user-activation-plan.js?v=9.0.0';

const snapshot = {
  workspaces: [{ id: 'w-1', name: 'Workspace 1' }, { id: 'w-2', name: 'Workspace 2' }],
  projects: [{ id: 'p-1', workspaceId: 'w-1', name: 'Proyecto 1' }, { id: 'p-2', workspaceId: 'w-2', name: 'Proyecto 2' }],
  people: [{ id: 'person-1', name: 'Persona Uno', email: 'persona@example.com' }]
};

test('builds a least-privilege user activation plan', () => {
  const plan = buildUserActivationPlan(snapshot, {
    uid: 'FirebaseUID123',
    name: 'Persona Uno',
    email: 'persona@example.com',
    role: 'collaborator',
    personId: 'person-1',
    workspaceIds: ['w-1'],
    projectIds: ['p-1'],
    allocation: 25
  });
  assert.equal(plan.counts.total, 4);
  assert.equal(plan.counts.profiles, 1);
  assert.equal(plan.counts.workspaceMemberships, 1);
  assert.equal(plan.counts.projectMemberships, 1);
  assert.equal(plan.counts.peopleLinks, 1);
  assert.equal(plan.duplicates.length, 0);
  assert.deepEqual(plan.input.workspaceIds, ['w-1']);
  assert.deepEqual(plan.input.projectIds, ['p-1']);
});

test('rejects project scope outside selected workspaces', () => {
  assert.throws(() => buildUserActivationPlan(snapshot, {
    uid: 'FirebaseUID123',
    name: 'Persona Uno',
    email: 'persona@example.com',
    role: 'collaborator',
    workspaceIds: ['w-1'],
    projectIds: ['p-2']
  }), /workspace no seleccionado/);
});

test('requires a project for project-scoped roles', () => {
  assert.throws(() => buildUserActivationPlan(snapshot, {
    uid: 'FirebaseUID123',
    name: 'Cliente Uno',
    email: 'cliente@example.com',
    role: 'client',
    workspaceIds: ['w-1'],
    projectIds: []
  }), /al menos un proyecto/);
});
