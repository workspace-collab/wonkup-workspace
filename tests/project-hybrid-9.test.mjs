import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.WONKUP_API_CONFIG = {
  mode: 'mock',
  authMode: 'hybrid',
  projectMode: 'hybrid',
  firebase: {}
};

const { projectDataSourceForSession } = await import(`../js/services/project-service.js?v=9.0.0&test=${Date.now()}`);

test('hybrid mode routes Firebase accounts to Firestore', () => {
  assert.equal(projectDataSourceForSession({ source: 'firebase' }), 'firebase');
});

test('hybrid mode preserves demo codes on local adapters', () => {
  assert.equal(projectDataSourceForSession({ source: 'mock' }), 'mock');
  assert.equal(projectDataSourceForSession(null), 'mock');
});
