import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const functionsSource = fs.readFileSync(new URL('../functions/index.js', import.meta.url), 'utf8');
const viewSource = fs.readFileSync(new URL('../js/views/users-admin-view.js', import.meta.url), 'utf8');
const serviceSource = fs.readFileSync(new URL('../js/services/managed-users-service.js', import.meta.url), 'utf8');
const routerSource = fs.readFileSync(new URL('../js/router.js', import.meta.url), 'utf8');
const shellSource = fs.readFileSync(new URL('../js/components/app-shell.js', import.meta.url), 'utf8');


test('user administration functions require an active superadmin', () => {
  assert.match(functionsSource, /requireSuperadmin\(request\)/);
  assert.match(functionsSource, /profile\.status !== 'active'/);
  assert.match(functionsSource, /profile\.role !== 'superadmin'/);
});

test('invitation creates Auth identity and access graph without returning temporary password', () => {
  assert.match(functionsSource, /adminAuth\.createUser/);
  assert.match(functionsSource, /writeAccessGraph/);
  assert.match(functionsSource, /wonkupInviteUser/);
  const responseBlock = functionsSource.slice(functionsSource.indexOf('exports.wonkupInviteUser'), functionsSource.indexOf('exports.wonkupUpdateManagedUser'));
  const returnStart = responseBlock.indexOf('    return {');
  const returnEnd = responseBlock.indexOf('    };', returnStart);
  const returnedPayload = responseBlock.slice(returnStart, returnEnd);
  assert.doesNotMatch(returnedPayload, /temporaryPassword/);
});

test('frontend offers create, edit, disable and resend access flows', () => {
  assert.match(viewSource, /Invitar nuevo usuario/);
  assert.match(viewSource, /Reenviar acceso/);
  assert.match(viewSource, /Desactivar/);
  assert.match(serviceSource, /sendPasswordResetEmail/);
  assert.match(serviceSource, /wonkupUpdateManagedUser/);
});

test('superadmin navigation exposes the Users module', () => {
  assert.match(routerSource, /master\\\/users/);
  assert.match(shellSource, /'usersAdmin', 'Usuarios'/);
});
