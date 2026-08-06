'use strict';

const { randomBytes } = require('node:crypto');
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

initializeApp();
setGlobalOptions({ region: 'us-central1', maxInstances: 3 });

const db = getFirestore();
const adminAuth = getAuth();
const RELEASE = '12.2.0';
const ALLOWED_ROLES = Object.freeze(['workspace_admin', 'project_lead', 'collaborator', 'reviewer', 'client', 'guest']);
const PROJECT_SCOPED_ROLES = new Set(['project_lead', 'collaborator', 'reviewer', 'client', 'guest']);
const ROLE_LABELS = Object.freeze({
  workspace_admin: 'Administrador de workspace',
  project_lead: 'Líder de proyecto',
  collaborator: 'Colaborador',
  reviewer: 'Revisor',
  client: 'Cliente',
  guest: 'Invitado'
});

const callableOptions = Object.freeze({
  cors: true,
  enforceAppCheck: false,
  memory: '256MiB',
  timeoutSeconds: 60,
  maxInstances: 3
});

function cleanText(value, max = 240) {
  return String(value || '').trim().slice(0, max);
}

function cleanEmail(value) {
  return cleanText(value, 254).toLowerCase();
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function uniqueIds(value) {
  return [...new Set((Array.isArray(value) ? value : []).map(item => cleanText(item, 128)).filter(Boolean))];
}

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'WU';
}

function isoNow() {
  return new Date().toISOString();
}

function publicError(error, fallback = 'No se pudo completar la operación.') {
  if (error instanceof HttpsError) return error;
  console.error(error);
  return new HttpsError('internal', fallback);
}

async function requireSuperadmin(request) {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Inicia sesión para administrar usuarios.');
  const profileSnapshot = await db.doc(`users/${uid}`).get();
  const profile = profileSnapshot.exists ? profileSnapshot.data() : null;
  if (!profile || profile.status !== 'active' || profile.role !== 'superadmin') {
    throw new HttpsError('permission-denied', 'Solo un superadministrador activo puede administrar cuentas.');
  }
  return { uid, profile, email: request.auth.token.email || '' };
}

async function loadDirectory() {
  const workspaceSnapshot = await db.collection('workspaces').get();
  const workspaces = workspaceSnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(item => item.status !== 'archived')
    .sort((a, b) => String(a.name || a.id).localeCompare(String(b.name || b.id), 'es'));
  const projects = [];
  for (const workspace of workspaces) {
    const projectSnapshot = await db.collection(`workspaces/${workspace.id}/projects`).get();
    projectSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.status === 'archived') return;
      projects.push({ id: doc.id, workspaceId: workspace.id, ...data });
    });
  }
  projects.sort((a, b) => String(a.name || a.id).localeCompare(String(b.name || b.id), 'es'));
  return { workspaces, projects };
}

function normalizeAccessInput(raw = {}) {
  const input = {
    uid: cleanText(raw.uid, 128),
    name: cleanText(raw.name, 120),
    email: cleanEmail(raw.email),
    role: cleanText(raw.role, 40),
    personId: cleanText(raw.personId, 128),
    workspaceIds: uniqueIds(raw.workspaceIds),
    projectIds: uniqueIds(raw.projectIds),
    allocation: Math.max(0, Math.min(100, Number(raw.allocation || 0))),
    status: raw.status === 'inactive' ? 'inactive' : 'active'
  };
  if (input.name.length < 2) throw new HttpsError('invalid-argument', 'Escribe el nombre completo.');
  if (!validEmail(input.email)) throw new HttpsError('invalid-argument', 'Escribe un correo válido.');
  if (!ALLOWED_ROLES.includes(input.role)) throw new HttpsError('invalid-argument', 'Selecciona un rol permitido.');
  if (!input.workspaceIds.length) throw new HttpsError('invalid-argument', 'Selecciona al menos un workspace.');
  if (PROJECT_SCOPED_ROLES.has(input.role) && !input.projectIds.length) {
    throw new HttpsError('invalid-argument', 'Este rol necesita al menos un proyecto asignado.');
  }
  return input;
}

function validateDirectoryScope(input, directory) {
  const workspaceIds = new Set(directory.workspaces.map(item => item.id));
  const projects = new Map(directory.projects.map(item => [item.id, item]));
  input.workspaceIds.forEach(id => {
    if (!workspaceIds.has(id)) throw new HttpsError('failed-precondition', `El workspace ${id} no existe o está archivado.`);
  });
  input.projectIds.forEach(id => {
    const project = projects.get(id);
    if (!project) throw new HttpsError('failed-precondition', `El proyecto ${id} no existe o está archivado.`);
    if (!input.workspaceIds.includes(project.workspaceId)) {
      throw new HttpsError('invalid-argument', `El proyecto ${id} pertenece a un workspace no seleccionado.`);
    }
  });
  return projects;
}

async function assertTargetIsNotSuperadmin(uid) {
  const snapshot = await db.doc(`users/${uid}`).get();
  if (snapshot.exists && snapshot.data().role === 'superadmin') {
    throw new HttpsError('failed-precondition', 'Las cuentas superadministradoras no se modifican desde este módulo.');
  }
  return snapshot.exists ? snapshot.data() : null;
}

async function writeAccessGraph({ input, uid, actorUid, action, invitationId = '' }) {
  const directory = await loadDirectory();
  const projectById = validateDirectoryScope(input, directory);
  const profileRef = db.doc(`users/${uid}`);
  const [profileSnapshot, assignmentsSnapshot] = await Promise.all([
    profileRef.get(),
    profileRef.collection('projectAssignments').get()
  ]);
  const previous = profileSnapshot.exists ? profileSnapshot.data() : {};
  const previousWorkspaceIds = uniqueIds(previous.workspaceIds);
  const previousAssignments = assignmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  const allWorkspaceIds = [...new Set([...previousWorkspaceIds, ...input.workspaceIds])];
  const allProjectIds = [...new Set([...previousAssignments.map(item => item.projectId || item.id), ...input.projectIds])];
  const workspaceRoles = Object.fromEntries(input.workspaceIds.map(id => [id, input.role]));
  const projectRoles = Object.fromEntries(input.projectIds.map(id => [id, input.role]));
  const now = isoNow();
  const batch = db.batch();

  batch.set(profileRef, {
    uid,
    personId: input.personId,
    name: input.name,
    email: input.email,
    initials: initials(input.name),
    role: input.role,
    roleLabel: ROLE_LABELS[input.role],
    status: input.status,
    workspaceIds: input.workspaceIds,
    projectIds: input.projectIds,
    workspaceRoles,
    projectRoles,
    schemaVersion: 12,
    invitationState: invitationId ? 'sent' : (previous.invitationState || 'managed'),
    invitationId: invitationId || previous.invitationId || '',
    invitedAt: invitationId ? now : (previous.invitedAt || ''),
    invitedBy: invitationId ? actorUid : (previous.invitedBy || ''),
    createdAt: previous.createdAt || now,
    updatedAt: now,
    updatedBy: actorUid
  }, { merge: true });

  for (const workspaceId of allWorkspaceIds) {
    const selected = input.workspaceIds.includes(workspaceId);
    batch.set(db.doc(`workspaces/${workspaceId}/members/${uid}`), {
      id: uid,
      authUid: uid,
      userId: input.personId,
      workspaceId,
      role: input.role,
      status: selected && input.status === 'active' ? 'active' : 'inactive',
      schemaVersion: 12,
      createdAt: now,
      updatedAt: now,
      updatedBy: actorUid
    }, { merge: true });
    if (selected && input.personId) {
      batch.set(db.doc(`workspaces/${workspaceId}/people/${input.personId}`), {
        authUid: uid,
        email: input.email,
        updatedAt: now,
        updatedBy: actorUid
      }, { merge: true });
    }
  }

  for (const projectId of allProjectIds) {
    const selected = input.projectIds.includes(projectId);
    const oldAssignment = previousAssignments.find(item => (item.projectId || item.id) === projectId);
    const project = projectById.get(projectId);
    const workspaceId = project?.workspaceId || oldAssignment?.workspaceId;
    if (!workspaceId) continue;
    const status = selected && input.status === 'active' ? 'active' : 'inactive';
    const common = {
      id: uid,
      authUid: uid,
      userId: input.personId,
      workspaceId,
      projectId,
      role: input.role,
      allocation: input.allocation,
      status,
      schemaVersion: 12,
      createdAt: oldAssignment?.createdAt || now,
      updatedAt: now,
      updatedBy: actorUid
    };
    batch.set(db.doc(`workspaces/${workspaceId}/projects/${projectId}/members/${uid}`), common, { merge: true });
    batch.set(db.doc(`users/${uid}/projectAssignments/${projectId}`), {
      ...common,
      id: projectId
    }, { merge: true });
  }

  const auditId = `${action}-${Date.now()}-${randomBytes(4).toString('hex')}`;
  batch.set(db.doc(`system/schema/userAdminAudit/${auditId}`), {
    id: auditId,
    action,
    targetUid: uid,
    targetEmail: input.email,
    role: input.role,
    status: input.status,
    workspaceIds: input.workspaceIds,
    projectIds: input.projectIds,
    executedAt: FieldValue.serverTimestamp(),
    executedBy: actorUid,
    source: 'wonkup-superadmin',
    release: RELEASE
  });

  await batch.commit();
  return { auditId, directory };
}

exports.wonkupUserAdminHealth = onCall(callableOptions, async request => {
  const actor = await requireSuperadmin(request);
  return { ok: true, release: RELEASE, actorUid: actor.uid, region: 'us-central1' };
});

exports.wonkupListManagedUsers = onCall(callableOptions, async request => {
  try {
    await requireSuperadmin(request);
    const [authResult, directory] = await Promise.all([
      adminAuth.listUsers(250),
      loadDirectory()
    ]);
    const refs = authResult.users.map(user => db.doc(`users/${user.uid}`));
    const profileSnapshots = refs.length ? await db.getAll(...refs) : [];
    const profileByUid = new Map(profileSnapshots.filter(item => item.exists).map(item => [item.id, item.data()]));
    const users = authResult.users.map(user => {
      const profile = profileByUid.get(user.uid) || null;
      return {
        uid: user.uid,
        email: user.email || profile?.email || '',
        name: user.displayName || profile?.name || '',
        disabled: user.disabled,
        emailVerified: user.emailVerified,
        createdAt: user.metadata.creationTime || '',
        lastSignInAt: user.metadata.lastSignInTime || '',
        profile: profile ? {
          name: profile.name || '',
          email: profile.email || '',
          role: profile.role || '',
          roleLabel: profile.roleLabel || ROLE_LABELS[profile.role] || profile.role || '',
          status: profile.status || 'inactive',
          personId: profile.personId || '',
          workspaceIds: uniqueIds(profile.workspaceIds),
          projectIds: uniqueIds(profile.projectIds),
          invitationState: profile.invitationState || '',
          invitedAt: profile.invitedAt || ''
        } : null
      };
    }).sort((a, b) => String(a.name || a.email).localeCompare(String(b.name || b.email), 'es'));
    return {
      ok: true,
      release: RELEASE,
      users,
      directory: {
        workspaces: directory.workspaces.map(item => ({ id: item.id, name: item.name || item.id, status: item.status || 'active' })),
        projects: directory.projects.map(item => ({ id: item.id, workspaceId: item.workspaceId, name: item.name || item.id, code: item.code || item.id, status: item.status || 'active' }))
      }
    };
  } catch (error) {
    throw publicError(error, 'No se pudo cargar el directorio de usuarios.');
  }
});

exports.wonkupInviteUser = onCall(callableOptions, async request => {
  let createdAuthUser = false;
  let authUser = null;
  try {
    const actor = await requireSuperadmin(request);
    const input = normalizeAccessInput(request.data || {});
    const directory = await loadDirectory();
    validateDirectoryScope(input, directory);

    try {
      authUser = await adminAuth.getUserByEmail(input.email);
      const existingProfile = await db.doc(`users/${authUser.uid}`).get();
      if (existingProfile.exists) {
        throw new HttpsError('already-exists', 'Este correo ya tiene una cuenta WonkUp. Usa Editar o Reenviar invitación.');
      }
      await adminAuth.updateUser(authUser.uid, { displayName: input.name, disabled: false });
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      if (error.code !== 'auth/user-not-found') throw error;
      const temporaryPassword = `${randomBytes(24).toString('base64url')}Aa1!`;
      authUser = await adminAuth.createUser({
        email: input.email,
        displayName: input.name,
        password: temporaryPassword,
        emailVerified: false,
        disabled: false
      });
      createdAuthUser = true;
    }

    input.uid = authUser.uid;
    const invitationId = `invite-${Date.now()}-${randomBytes(4).toString('hex')}`;
    await writeAccessGraph({ input, uid: authUser.uid, actorUid: actor.uid, action: 'invite', invitationId });
    return {
      ok: true,
      release: RELEASE,
      invitationId,
      uid: authUser.uid,
      email: input.email,
      name: input.name,
      createdAuthUser,
      message: 'Cuenta creada. Envía ahora el correo para que la persona defina su contraseña.'
    };
  } catch (error) {
    if (createdAuthUser && authUser?.uid) {
      try { await adminAuth.deleteUser(authUser.uid); } catch (rollbackError) { console.error('Auth rollback failed', rollbackError); }
    }
    throw publicError(error, 'No se pudo crear la invitación.');
  }
});

exports.wonkupUpdateManagedUser = onCall(callableOptions, async request => {
  try {
    const actor = await requireSuperadmin(request);
    const uid = cleanText(request.data?.uid, 128);
    if (!uid) throw new HttpsError('invalid-argument', 'Falta el UID del usuario.');
    await assertTargetIsNotSuperadmin(uid);
    const input = normalizeAccessInput({ ...request.data, uid });
    const authUser = await adminAuth.getUser(uid);
    if (cleanEmail(authUser.email) !== input.email) {
      const emailOwner = await adminAuth.getUserByEmail(input.email).catch(error => error.code === 'auth/user-not-found' ? null : Promise.reject(error));
      if (emailOwner && emailOwner.uid !== uid) throw new HttpsError('already-exists', 'El correo ya pertenece a otra cuenta.');
    }
    await adminAuth.updateUser(uid, {
      email: input.email,
      displayName: input.name,
      disabled: input.status !== 'active'
    });
    await writeAccessGraph({ input, uid, actorUid: actor.uid, action: 'update' });
    return { ok: true, release: RELEASE, uid, email: input.email };
  } catch (error) {
    throw publicError(error, 'No se pudo actualizar el usuario.');
  }
});

exports.wonkupSetManagedUserStatus = onCall(callableOptions, async request => {
  try {
    const actor = await requireSuperadmin(request);
    const uid = cleanText(request.data?.uid, 128);
    const status = request.data?.status === 'active' ? 'active' : 'inactive';
    if (!uid) throw new HttpsError('invalid-argument', 'Falta el UID del usuario.');
    const profile = await assertTargetIsNotSuperadmin(uid);
    if (!profile) throw new HttpsError('not-found', 'El usuario no tiene un perfil WonkUp.');
    const input = normalizeAccessInput({
      uid,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      personId: profile.personId,
      workspaceIds: profile.workspaceIds,
      projectIds: profile.projectIds,
      allocation: request.data?.allocation || 0,
      status
    });
    await adminAuth.updateUser(uid, { disabled: status !== 'active' });
    await writeAccessGraph({ input, uid, actorUid: actor.uid, action: status === 'active' ? 'reactivate' : 'deactivate' });
    return { ok: true, release: RELEASE, uid, status };
  } catch (error) {
    throw publicError(error, 'No se pudo cambiar el estado del usuario.');
  }
});
