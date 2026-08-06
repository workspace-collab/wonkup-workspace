import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const client = fs.readFileSync(new URL('../js/cloud/firebase-client.js', import.meta.url), 'utf8');
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = `${dir}/${entry.name}`;
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.js')) files.push(full);
  }
}
walk(new URL('../js', import.meta.url).pathname);

test('Firebase client uses a shared browser singleton', () => {
  assert.match(client, /__WONKUP_FIREBASE_CLIENT_PROMISE__/);
  assert.match(client, /globalThis\[CLIENT_PROMISE_KEY\]/);
});

test('Firebase client reuses an existing Firestore instance', () => {
  assert.match(client, /initializeFirestore\(app, firestoreSettings\)/);
  assert.match(client, /getFirestore\(app\)/);
  assert.match(client, /already been called with different options/);
});

test('all JavaScript module imports use cache version 12.0.0', () => {
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    const versions = [...source.matchAll(/\?v=(\d+\.\d+\.\d+)/g)].map(match => match[1]);
    versions.forEach(version => assert.equal(version, '12.0.0', `${file} uses ${version}`));
  }
});
