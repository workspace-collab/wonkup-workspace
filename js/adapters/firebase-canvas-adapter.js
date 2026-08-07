import { getFirebaseClient, waitForFirebaseAuth } from '../cloud/firebase-client.js?v=12.3.0';
import { getCanvasTemplate } from '../../data/canvas-templates.js?v=12.3.0';
import {
  canAccessProject,
  canDeleteCanvas,
  canViewCanvas,
  canCommentCanvas,
  canEditCanvas,
  canManageCanvas,
  getWorkspaceRole
} from '../utils/permissions.js?v=12.3.0';

const listeners = new Set();
const locationCache = new Map();
const directoryCache = new Map();
const realtimeStops = new Map();
const MAX_HISTORY = 150;
const MAX_VERSIONS = 20;
const SCHEMA_VERSION = 12;
const clone = value => JSON.parse(JSON.stringify(value));
let presenceClientId = uid('tab');
try {
  presenceClientId = globalThis.sessionStorage?.getItem('wonkup.canvas.firebaseClientId') || presenceClientId;
  globalThis.sessionStorage?.setItem('wonkup.canvas.firebaseClientId', presenceClientId);
} catch {
  // Session storage may be unavailable in privacy modes or test runners.
}

function uid(prefix) {
  return globalThis.crypto?.randomUUID
    ? `${prefix}-${globalThis.crypto.randomUUID()}`
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function asIso(value, fallback = '') {
  if (!value) return fallback;
  if (typeof value?.toDate === 'function') return value.toDate().toISOString();
  if (typeof value === 'number') {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date.toISOString() : fallback;
  }
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : String(value || fallback);
}

function timestampMillis(value) {
  if (!value) return 0;
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (typeof value?.toDate === 'function') return value.toDate().getTime();
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.getTime() : 0;
}

function friendlyError(error) {
  const code = String(error?.code || '');
  const messages = {
    'permission-denied': 'Las reglas de Firestore no permiten esta operación sobre el canvas.',
    'unavailable': 'Firebase no está disponible temporalmente.',
    'failed-precondition': 'Firebase requiere una configuración o índice adicional.',
    'not-found': 'El canvas o la nota ya no existe.',
    'aborted': 'Otro usuario modificó el canvas al mismo tiempo. Vuelve a intentarlo.',
    'database/permission-denied': 'Las reglas de Realtime Database no permiten publicar la presencia.'
  };
  return new Error(messages[code] || error?.message || 'No se pudo completar la operación del Canvas Engine.');
}

async function context(session) {
  if (session?.source !== 'firebase') {
    throw new Error('Para usar el Canvas Engine en la nube ingresa con una Cuenta WonkUp.');
  }
  const client = await getFirebaseClient();
  const user = client.auth.currentUser || await waitForFirebaseAuth();
  if (!user || user.uid !== session.firebaseUid) {
    throw new Error('La sesión de Firebase no está disponible. Ingresa nuevamente.');
  }
  return client;
}

function actor(session) {
  return {
    actorId: session?.user?.id || session?.firebaseUid || 'system',
    actorUid: session?.firebaseUid || '',
    actorName: session?.user?.name || session?.user?.email || 'Usuario WonkUp'
  };
}

function requireAccess(session, projectId, workspaceId, canvasId = '') {
  const allowed = canvasId
    ? canViewCanvas(session, projectId, workspaceId, canvasId)
    : canAccessProject(session, projectId, workspaceId);
  if (!allowed) throw new Error('No tienes acceso a este canvas.');
}

function requireComment(session, projectId, workspaceId, canvasId) {
  requireAccess(session, projectId, workspaceId, canvasId);
  if (!canCommentCanvas(session, projectId, workspaceId, canvasId)) {
    throw new Error('Tu permiso no permite comentar este canvas.');
  }
}

function requireEdit(session, projectId, workspaceId, canvasId = '') {
  requireAccess(session, projectId, workspaceId, canvasId);
  if (!canEditCanvas(session, projectId, workspaceId, canvasId)) {
    throw new Error('Tu permiso no permite modificar este canvas.');
  }
}

function requireManage(session, projectId, workspaceId) {
  requireAccess(session, projectId, workspaceId);
  if (!canManageCanvas(session, projectId, workspaceId)) {
    throw new Error('Tu rol no permite administrar este canvas.');
  }
}

function requireSuperadmin(session, projectId, workspaceId) {
  requireAccess(session, projectId, workspaceId);
  if (session?.role !== 'superadmin') {
    throw new Error('Solo el superadministrador puede restaurar versiones.');
  }
}

function refs(client, workspaceId, projectId, canvasId = '') {
  const { doc, collection } = client.sdk.firestore;
  const projectRef = doc(client.db, 'workspaces', workspaceId, 'projects', projectId);
  const canvasesRef = collection(projectRef, 'canvases');
  const canvasRef = canvasId ? doc(canvasesRef, canvasId) : null;
  return {
    projectRef,
    canvasesRef,
    canvasRef,
    notesRef: canvasRef ? collection(canvasRef, 'notes') : null,
    historyRef: canvasRef ? collection(canvasRef, 'history') : null,
    versionsRef: canvasRef ? collection(canvasRef, 'versions') : null,
    shareLinksRef: canvasRef ? collection(canvasRef, 'shareLinks') : null
  };
}

function rememberLocation(canvasId, workspaceId, projectId) {
  if (canvasId && workspaceId && projectId) locationCache.set(canvasId, { workspaceId, projectId });
}

function resolveLocation({ canvasId, workspaceId = '', projectId = '' }) {
  if (workspaceId && projectId) {
    rememberLocation(canvasId, workspaceId, projectId);
    return { workspaceId, projectId };
  }
  const cached = locationCache.get(canvasId);
  if (cached) return cached;
  throw new Error('No se pudo determinar el proyecto del canvas. Ábrelo nuevamente desde el Innovation Toolkit.');
}

function normalizeCanvas(data, id = '') {
  const createdAt = asIso(data?.createdAt, nowIso());
  return {
    id: String(data?.id || id),
    workspaceId: String(data?.workspaceId || ''),
    projectId: String(data?.projectId || ''),
    templateId: String(data?.templateId || ''),
    title: String(data?.title || 'Canvas').trim().slice(0, 140) || 'Canvas',
    status: data?.status === 'archived' ? 'archived' : 'active',
    createdBy: String(data?.createdBy || ''),
    createdByUid: String(data?.createdByUid || ''),
    createdAt,
    updatedAt: asIso(data?.updatedAt, createdAt),
    updatedBy: String(data?.updatedBy || ''),
    version: Math.max(1, Number(data?.version || 1)),
    noteCount: Math.max(0, Number(data?.noteCount || 0)),
    activeSectionCount: Math.max(0, Number(data?.activeSectionCount || 0)),
    historyCount: Math.max(0, Number(data?.historyCount || 0)),
    versionCount: Math.max(0, Number(data?.versionCount || 0)),
    shareCount: Math.max(0, Number(data?.shareCount || 0)),
    archivedAt: asIso(data?.archivedAt, ''),
    archivedBy: String(data?.archivedBy || ''),
    restoredAt: asIso(data?.restoredAt, ''),
    restoredBy: String(data?.restoredBy || ''),
    schemaVersion: Number(data?.schemaVersion || SCHEMA_VERSION)
  };
}

function normalizeNote(data, id = '') {
  const createdAt = asIso(data?.createdAt, nowIso());
  return {
    id: String(data?.id || id),
    canvasId: String(data?.canvasId || ''),
    workspaceId: String(data?.workspaceId || ''),
    projectId: String(data?.projectId || ''),
    sectionId: String(data?.sectionId || ''),
    text: String(data?.text || '').trim().slice(0, 1200),
    colorId: String(data?.colorId || 'sky'),
    colorHex: /^#[0-9a-f]{6}$/i.test(String(data?.colorHex || '')) ? String(data.colorHex).toLowerCase() : '',
    authorId: String(data?.authorId || ''),
    authorUid: String(data?.authorUid || ''),
    authorName: String(data?.authorName || ''),
    createdAt,
    updatedAt: asIso(data?.updatedAt, createdAt),
    position: Number(data?.position || 1000),
    comments: [],
    commentCount: Math.max(0, Number(data?.commentCount || 0)),
    sourceCanvasId: String(data?.sourceCanvasId || ''),
    sourceNoteId: String(data?.sourceNoteId || ''),
    archived: Boolean(data?.archived),
    archivedAt: asIso(data?.archivedAt, ''),
    archivedBy: String(data?.archivedBy || ''),
    schemaVersion: Number(data?.schemaVersion || SCHEMA_VERSION)
  };
}

function normalizeComment(data, id = '') {
  return {
    id: String(data?.id || id),
    noteId: String(data?.noteId || ''),
    canvasId: String(data?.canvasId || ''),
    authorId: String(data?.authorId || data?.actorId || ''),
    authorUid: String(data?.authorUid || data?.actorUid || ''),
    authorName: String(data?.authorName || data?.actorName || ''),
    text: String(data?.text || '').trim().slice(0, 800),
    createdAt: asIso(data?.createdAt, nowIso()),
    schemaVersion: Number(data?.schemaVersion || SCHEMA_VERSION)
  };
}

function normalizeHistory(data, id = '') {
  return {
    id: String(data?.id || id),
    type: String(data?.type || 'updated'),
    title: String(data?.title || 'Canvas actualizado').slice(0, 180),
    actorId: String(data?.actorId || ''),
    actorUid: String(data?.actorUid || ''),
    actorName: String(data?.actorName || ''),
    createdAt: asIso(data?.createdAt, nowIso()),
    meta: clone(data?.meta || {}),
    schemaVersion: Number(data?.schemaVersion || SCHEMA_VERSION)
  };
}

function normalizeVersion(data, id = '') {
  return {
    id: String(data?.id || id),
    version: Math.max(1, Number(data?.version || 1)),
    label: String(data?.label || 'Punto de control').slice(0, 120),
    createdAt: asIso(data?.createdAt, nowIso()),
    createdBy: String(data?.createdBy || data?.actorId || ''),
    createdByUid: String(data?.createdByUid || data?.actorUid || ''),
    createdByName: String(data?.createdByName || data?.actorName || ''),
    title: String(data?.title || 'Canvas').slice(0, 140),
    templateId: String(data?.templateId || ''),
    notes: Array.isArray(data?.notes) ? clone(data.notes) : [],
    schemaVersion: Number(data?.schemaVersion || SCHEMA_VERSION)
  };
}

function historyEntry(type, title, session, workspaceId, projectId, canvasId, meta = {}) {
  return {
    id: uid('hist'),
    canvasId,
    workspaceId,
    projectId,
    type,
    title: String(title || '').slice(0, 180),
    ...actor(session),
    createdAt: nowIso(),
    meta: clone(meta),
    schemaVersion: SCHEMA_VERSION
  };
}

function versionPayload(instance, session, label, id = uid('version')) {
  return {
    id,
    canvasId: instance.id,
    workspaceId: instance.workspaceId,
    projectId: instance.projectId,
    version: Number(instance.version || 1),
    label: String(label || `Versión ${instance.version || 1}`).slice(0, 120),
    createdAt: nowIso(),
    createdBy: actor(session).actorId,
    createdByUid: actor(session).actorUid,
    createdByName: actor(session).actorName,
    title: instance.title,
    templateId: instance.templateId,
    notes: clone((instance.notes || []).map(note => ({
      id: note.id,
      sectionId: note.sectionId,
      text: note.text,
      colorId: note.colorId,
      colorHex: note.colorHex || '',
      authorId: note.authorId || '',
      authorUid: note.authorUid || '',
      authorName: note.authorName || note.author?.name || '',
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      position: Number(note.position || 1000),
      sourceCanvasId: note.sourceCanvasId || '',
      sourceNoteId: note.sourceNoteId || '',
      comments: (note.comments || []).map(comment => ({
        id: comment.id,
        authorId: comment.authorId || '',
        authorUid: comment.authorUid || '',
        authorName: comment.authorName || comment.author?.name || '',
        text: comment.text,
        createdAt: comment.createdAt
      }))
    }))),
    schemaVersion: SCHEMA_VERSION
  };
}

async function loadDirectory(client, workspaceId, projectId, session, { force = false } = {}) {
  const key = `${workspaceId}:${projectId}`;
  if (!force && directoryCache.has(key)) return directoryCache.get(key);
  const map = new Map();
  if (session?.user) {
    map.set(session.user.id || session.firebaseUid, {
      id: session.user.id || session.firebaseUid,
      authUid: session.firebaseUid || '',
      name: session.user.name || session.user.email || 'Usuario WonkUp',
      email: session.user.email || '',
      initials: session.user.initials || ''
    });
    if (session.firebaseUid) map.set(session.firebaseUid, map.get(session.user.id || session.firebaseUid));
  }
  try {
    const { collection, getDocs, doc, getDoc } = client.sdk.firestore;
    const [peopleSnapshot, membersSnapshot] = await Promise.all([
      getDocs(collection(client.db, 'workspaces', workspaceId, 'people')),
      getDocs(collection(client.db, 'workspaces', workspaceId, 'projects', projectId, 'members'))
    ]);
    const peopleByEmail = new Map();
    peopleSnapshot.docs.forEach(item => {
      const person = { id: item.id, ...item.data() };
      map.set(person.id, person);
      if (person.authUid) map.set(person.authUid, person);
      if (person.email) peopleByEmail.set(String(person.email).trim().toLowerCase(), person);
    });
    for (const item of membersSnapshot.docs) {
      const member = { id: item.id, ...item.data() };
      const authUid = String(member.authUid || item.id || '').trim();
      let person = map.get(member.userId) || map.get(authUid) || null;
      if (!person && authUid) {
        try {
          const profile = await getDoc(doc(client.db, 'users', authUid));
          if (profile.exists()) {
            const data = profile.data();
            person = map.get(data.personId)
              || peopleByEmail.get(String(data.email || '').trim().toLowerCase())
              || { id: data.personId || authUid, authUid, ...data };
          }
        } catch {
          // Optional directory enrichment must not block the canvas.
        }
      }
      if (person) {
        map.set(member.id, person);
        if (authUid) map.set(authUid, person);
      }
    }
  } catch {
    // The canvas remains usable with actor names stored on each document.
  }
  directoryCache.set(key, map);
  return map;
}

function publicPerson(person, fallback = {}) {
  const name = person?.name || person?.displayName || fallback.name || fallback.email || 'Usuario';
  return {
    id: person?.id || fallback.id || '',
    authUid: person?.authUid || fallback.authUid || '',
    name,
    email: person?.email || fallback.email || '',
    initials: person?.initials || fallback.initials || String(name).split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase(),
    photoURL: person?.photoURL || fallback.photoURL || ''
  };
}

async function enrichInstance(client, instance, session) {
  const directory = await loadDirectory(client, instance.workspaceId, instance.projectId, session);
  const template = getCanvasTemplate(instance.templateId);
  const author = publicPerson(directory.get(instance.createdBy) || directory.get(instance.createdByUid), {
    id: instance.createdBy,
    authUid: instance.createdByUid,
    name: instance.createdByName || ''
  });
  return {
    ...clone(instance),
    template: clone(template),
    author,
    notes: (instance.notes || []).map(note => ({
      ...clone(note),
      author: publicPerson(directory.get(note.authorId) || directory.get(note.authorUid), {
        id: note.authorId,
        authUid: note.authorUid,
        name: note.authorName
      }),
      comments: (note.comments || []).map(comment => ({
        ...clone(comment),
        author: publicPerson(directory.get(comment.authorId) || directory.get(comment.authorUid), {
          id: comment.authorId,
          authUid: comment.authorUid,
          name: comment.authorName
        })
      }))
    })),
    history: (instance.history || []).map(entry => ({
      ...clone(entry),
      actor: publicPerson(directory.get(entry.actorId) || directory.get(entry.actorUid), {
        id: entry.actorId,
        authUid: entry.actorUid,
        name: entry.actorName
      })
    })),
    snapshots: (instance.snapshots || []).map(version => ({
      ...clone(version),
      actor: publicPerson(directory.get(version.createdBy) || directory.get(version.createdByUid), {
        id: version.createdBy,
        authUid: version.createdByUid,
        name: version.createdByName
      })
    }))
  };
}

async function loadComments(client, noteRef) {
  const { getDocs, collection } = client.sdk.firestore;
  const snapshot = await getDocs(collection(noteRef, 'comments'));
  return snapshot.docs
    .map(item => normalizeComment(item.data(), item.id))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

async function loadInstance(client, workspaceId, projectId, canvasId, session, { includeArchived = false, includeHistory = true } = {}) {
  requireAccess(session, projectId, workspaceId, canvasId);
  const { getDoc, getDocs, query, orderBy, limit } = client.sdk.firestore;
  const reference = refs(client, workspaceId, projectId, canvasId);
  const canvasSnapshot = await getDoc(reference.canvasRef);
  if (!canvasSnapshot.exists()) throw new Error('Canvas no encontrado.');
  const canvas = normalizeCanvas(canvasSnapshot.data(), canvasSnapshot.id);
  if (!includeArchived && canvas.status === 'archived') throw new Error('El canvas está archivado.');
  rememberLocation(canvas.id, workspaceId, projectId);

  const noteSnapshot = await getDocs(query(reference.notesRef, orderBy('position', 'asc')));
  const notePairs = await Promise.all(noteSnapshot.docs
    .map(item => ({ item, note: normalizeNote(item.data(), item.id) }))
    .filter(({ note }) => !note.archived)
    .map(async ({ item, note }) => ({ ...note, comments: await loadComments(client, item.ref) })));

  let history = [];
  if (includeHistory) {
    try {
      const historySnapshot = await getDocs(query(reference.historyRef, orderBy('createdAt', 'desc'), limit(MAX_HISTORY)));
      history = historySnapshot.docs.map(item => normalizeHistory(item.data(), item.id));
    } catch {
      const historySnapshot = await getDocs(reference.historyRef);
      history = historySnapshot.docs.map(item => normalizeHistory(item.data(), item.id))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, MAX_HISTORY);
    }
  }

  const activeSections = new Set(notePairs.map(note => note.sectionId)).size;
  return enrichInstance(client, {
    ...canvas,
    noteCount: notePairs.length,
    activeSectionCount: activeSections,
    notes: notePairs,
    history,
    snapshots: []
  }, session);
}

async function workspaceIdsForSession(client, workspaceId, session) {
  if (workspaceId && workspaceId !== 'all') return [workspaceId];
  const explicit = (session?.scopes?.workspaceIds || []).filter(id => id && id !== '*');
  if (!(session?.scopes?.workspaceIds || []).includes('*')) return explicit;
  const snapshot = await client.sdk.firestore.getDocs(client.sdk.firestore.collection(client.db, 'workspaces'));
  return snapshot.docs.map(item => item.id);
}

async function projectIdsForWorkspace(client, workspaceId, projectId, session) {
  if (projectId) return [projectId];
  const role = getWorkspaceRole(session, workspaceId);
  if (['superadmin', 'workspace_admin'].includes(role)) {
    const snapshot = await client.sdk.firestore.getDocs(client.sdk.firestore.collection(client.db, 'workspaces', workspaceId, 'projects'));
    return snapshot.docs.map(item => item.id);
  }
  const mapped = Object.keys(session?.projectRoles || {});
  const explicit = [...new Set([...(session?.scopes?.projectIds || []).filter(id => id !== '*'), ...mapped])];
  const result = [];
  for (const id of explicit) {
    try {
      const snapshot = await client.sdk.firestore.getDoc(client.sdk.firestore.doc(client.db, 'workspaces', workspaceId, 'projects', id));
      if (snapshot.exists()) result.push(id);
    } catch {
      // Skip projects outside this workspace or outside the current user's scope.
    }
  }
  return result;
}

function emit(event) {
  const payload = { source: 'local', at: nowIso(), ...event };
  listeners.forEach(listener => listener(payload));
}

function nextCanvasPatch(canvas, session, patch = {}) {
  return {
    ...patch,
    version: Number(canvas.version || 1) + 1,
    updatedAt: nowIso(),
    updatedBy: session?.firebaseUid || '',
    schemaVersion: SCHEMA_VERSION
  };
}

async function activeNotesInSection(client, workspaceId, projectId, canvasId, sectionId, excludeNoteId = '') {
  const reference = refs(client, workspaceId, projectId, canvasId);
  const snapshot = await client.sdk.firestore.getDocs(reference.notesRef);
  return snapshot.docs
    .map(item => normalizeNote(item.data(), item.id))
    .filter(note => !note.archived && note.sectionId === sectionId && note.id !== excludeNoteId)
    .sort((a, b) => Number(a.position || 0) - Number(b.position || 0));
}

function positionForIndex(notes, index) {
  const safeIndex = Math.max(0, Math.min(Number(index || 0), notes.length));
  const before = notes[safeIndex - 1];
  const after = notes[safeIndex];
  if (!before && !after) return 1000;
  if (!before) return Number(after.position || 1000) - 1000;
  if (!after) return Number(before.position || 0) + 1000;
  const midpoint = (Number(before.position || 0) + Number(after.position || 0)) / 2;
  return Number.isFinite(midpoint) ? midpoint : Number(before.position || 0) + 1;
}

function sanitizedNote(note) {
  return {
    id: note.id,
    sectionId: note.sectionId,
    text: note.text,
    colorId: note.colorId || 'sky',
    colorHex: note.colorHex || '',
    position: Number(note.position || 1000),
    sourceCanvasId: note.sourceCanvasId || '',
    sourceNoteId: note.sourceNoteId || ''
  };
}

function publicShareSnapshot(instance, link) {
  return {
    id: link.code,
    code: link.code,
    active: link.active !== false,
    workspaceId: instance.workspaceId,
    projectId: instance.projectId,
    canvasId: instance.id,
    title: instance.title,
    templateId: instance.templateId,
    version: Number(instance.version || 1),
    noteCount: instance.notes.length,
    activeSectionCount: new Set(instance.notes.map(note => note.sectionId)).size,
    notes: instance.notes.map(sanitizedNote),
    expiresAt: link.expiresAt,
    createdAt: link.createdAt || nowIso(),
    updatedAt: nowIso(),
    schemaVersion: SCHEMA_VERSION
  };
}

async function refreshPublicShares(client, instance) {
  try {
    const reference = refs(client, instance.workspaceId, instance.projectId, instance.id);
    const snapshot = await client.sdk.firestore.getDocs(reference.shareLinksRef);
    const active = snapshot.docs
      .map(item => ({ id: item.id, ...item.data() }))
      .filter(link => link.active !== false
        && link.shareType !== 'person'
        && link.requiresAuth !== true
        && timestampMillis(link.expiresAt) > Date.now());
    await Promise.all(active.map(link => client.sdk.firestore.setDoc(
      client.sdk.firestore.doc(client.db, 'canvasShares', link.code),
      publicShareSnapshot(instance, link),
      { merge: true }
    )));
  } catch (error) {
    console.warn('WonkUp: no se pudieron refrescar los enlaces públicos del canvas.', error);
  }
}

async function afterMutation(client, location, canvasId, session, action, extra = {}) {
  const next = await loadInstance(client, location.workspaceId, location.projectId, canvasId, session);
  await refreshPublicShares(client, next);
  emit({ action, canvasId, workspaceId: location.workspaceId, projectId: location.projectId, ...extra });
  return next;
}

async function callCanvasAccessFunction(name, data = {}, session = null) {
  try {
    const client = session ? await context(session) : await getFirebaseClient();
    const callable = client.sdk.functions.httpsCallable(client.functions, name);
    const result = await callable(data);
    return result.data;
  } catch (error) {
    const wrapped = friendlyError(error);
    wrapped.code = String(error?.code || '');
    wrapped.cause = error;
    throw wrapped;
  }
}

function collaborativeShareSession(session, access) {
  return {
    ...session,
    canvasShareAccess: {
      ...(session?.canvasShareAccess || {}),
      [access.canvasId]: {
        active: true,
        token: access.token,
        permission: access.permission,
        workspaceId: access.workspaceId,
        projectId: access.projectId,
        expiresAt: access.expiresAt
      }
    }
  };
}

export const FirebaseCanvasAdapter = {
  async listInstances({ workspaceId = 'all', projectId = '', session, includeArchived = false }) {
    try {
      const client = await context(session);
      const workspaceIds = await workspaceIdsForSession(client, workspaceId, session);
      const result = [];
      for (const resolvedWorkspaceId of workspaceIds) {
        const projectIds = await projectIdsForWorkspace(client, resolvedWorkspaceId, projectId, session);
        for (const resolvedProjectId of projectIds) {
          if (!canAccessProject(session, resolvedProjectId, resolvedWorkspaceId)) continue;
          try {
            const snapshot = await client.sdk.firestore.getDocs(refs(client, resolvedWorkspaceId, resolvedProjectId).canvasesRef);
            for (const item of snapshot.docs) {
              const canvas = normalizeCanvas(item.data(), item.id);
              if (!includeArchived && canvas.status === 'archived') continue;
              rememberLocation(canvas.id, resolvedWorkspaceId, resolvedProjectId);
              result.push(await loadInstance(client, resolvedWorkspaceId, resolvedProjectId, canvas.id, session, {
                includeArchived: true,
                includeHistory: false
              }));
            }
          } catch (error) {
            if (String(error?.code || '') !== 'permission-denied') throw error;
          }
        }
      }
      return result.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async getInstance({ canvasId, workspaceId, projectId, session }) {
    try {
      const client = await context(session);
      const location = resolveLocation({ canvasId, workspaceId, projectId });
      return await loadInstance(client, location.workspaceId, location.projectId, canvasId, session);
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async createInstance({ workspaceId, projectId, templateId, title, session }) {
    try {
      requireEdit(session, projectId, workspaceId);
      const template = getCanvasTemplate(templateId);
      if (!template) throw new Error('Plantilla no encontrada.');
      const client = await context(session);
      const reference = refs(client, workspaceId, projectId);
      const canvasRef = client.sdk.firestore.doc(reference.canvasesRef);
      const createdAt = nowIso();
      const canvas = normalizeCanvas({
        id: canvasRef.id,
        workspaceId,
        projectId,
        templateId,
        title: String(title || template.name).trim().slice(0, 140) || template.name,
        status: 'active',
        createdBy: actor(session).actorId,
        createdByUid: actor(session).actorUid,
        createdByName: actor(session).actorName,
        createdAt,
        updatedAt: createdAt,
        updatedBy: actor(session).actorUid,
        version: 1,
        noteCount: 0,
        activeSectionCount: 0,
        historyCount: 1,
        versionCount: 1,
        shareCount: 0,
        schemaVersion: SCHEMA_VERSION
      }, canvasRef.id);
      const event = historyEntry('created', 'Canvas creado', session, workspaceId, projectId, canvas.id, { templateId });
      const initialVersion = versionPayload({ ...canvas, notes: [] }, session, 'Versión inicial', `version-initial-${canvas.id}`);
      const batch = client.sdk.firestore.writeBatch(client.db);
      batch.set(canvasRef, canvas);
      batch.set(client.sdk.firestore.doc(canvasRef, 'history', event.id), event);
      batch.set(client.sdk.firestore.doc(canvasRef, 'versions', initialVersion.id), initialVersion);
      await batch.commit();
      rememberLocation(canvas.id, workspaceId, projectId);
      emit({ action: 'canvas:created', canvasId: canvas.id, workspaceId, projectId });
      return loadInstance(client, workspaceId, projectId, canvas.id, session);
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async updateInstance({ canvasId, workspaceId, projectId, patch, session }) {
    try {
      const location = resolveLocation({ canvasId, workspaceId, projectId });
      requireManage(session, location.projectId, location.workspaceId);
      const client = await context(session);
      const reference = refs(client, location.workspaceId, location.projectId, canvasId);
      await client.sdk.firestore.runTransaction(client.db, async transaction => {
        const snapshot = await transaction.get(reference.canvasRef);
        if (!snapshot.exists()) throw new Error('Canvas no encontrado.');
        const canvas = normalizeCanvas(snapshot.data(), snapshot.id);
        const title = patch?.title !== undefined ? String(patch.title || '').trim().slice(0, 140) : canvas.title;
        if (!title) throw new Error('El título del canvas no puede quedar vacío.');
        const event = historyEntry('updated', 'Información del canvas actualizada', session, location.workspaceId, location.projectId, canvasId);
        transaction.update(reference.canvasRef, nextCanvasPatch(canvas, session, {
          title,
          historyCount: Number(canvas.historyCount || 0) + 1
        }));
        transaction.set(client.sdk.firestore.doc(reference.historyRef, event.id), event);
      });
      return afterMutation(client, location, canvasId, session, 'canvas:updated');
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async archiveInstance({ canvasId, workspaceId, projectId, session }) {
    try {
      const location = resolveLocation({ canvasId, workspaceId, projectId });
      requireManage(session, location.projectId, location.workspaceId);
      const client = await context(session);
      const reference = refs(client, location.workspaceId, location.projectId, canvasId);
      await client.sdk.firestore.runTransaction(client.db, async transaction => {
        const snapshot = await transaction.get(reference.canvasRef);
        if (!snapshot.exists()) throw new Error('Canvas no encontrado.');
        const canvas = normalizeCanvas(snapshot.data(), snapshot.id);
        const event = historyEntry('archived', 'Canvas archivado', session, location.workspaceId, location.projectId, canvasId);
        transaction.update(reference.canvasRef, nextCanvasPatch(canvas, session, {
          status: 'archived',
          archivedAt: nowIso(),
          archivedBy: actor(session).actorId,
          historyCount: Number(canvas.historyCount || 0) + 1
        }));
        transaction.set(client.sdk.firestore.doc(reference.historyRef, event.id), event);
      });
      return afterMutation(client, location, canvasId, session, 'canvas:archived');
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async restoreInstance({ canvasId, workspaceId, projectId, session }) {
    try {
      const location = resolveLocation({ canvasId, workspaceId, projectId });
      requireManage(session, location.projectId, location.workspaceId);
      const client = await context(session);
      const reference = refs(client, location.workspaceId, location.projectId, canvasId);
      await client.sdk.firestore.runTransaction(client.db, async transaction => {
        const snapshot = await transaction.get(reference.canvasRef);
        if (!snapshot.exists()) throw new Error('Canvas no encontrado.');
        const canvas = normalizeCanvas(snapshot.data(), snapshot.id);
        const event = historyEntry('restored', 'Canvas restaurado', session, location.workspaceId, location.projectId, canvasId);
        transaction.update(reference.canvasRef, nextCanvasPatch(canvas, session, {
          status: 'active',
          restoredAt: nowIso(),
          restoredBy: actor(session).actorId,
          historyCount: Number(canvas.historyCount || 0) + 1
        }));
        transaction.set(client.sdk.firestore.doc(reference.historyRef, event.id), event);
      });
      return afterMutation(client, location, canvasId, session, 'canvas:restored');
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async deleteInstance({ canvasId, workspaceId, projectId, session }) {
    const location = resolveLocation({ canvasId, workspaceId, projectId });
    if (!canDeleteCanvas(session, location.workspaceId)) throw new Error('Solo un administrador puede eliminar canvases definitivamente.');
    throw new Error('En la nube se conserva el archivo lógico. Restaura el canvas o mantenlo archivado para proteger su trazabilidad.');
  },

  async createNote({ canvasId, workspaceId, projectId, sectionId, input, session }) {
    try {
      const location = resolveLocation({ canvasId, workspaceId, projectId });
      requireEdit(session, location.projectId, location.workspaceId, canvasId);
      const client = await context(session);
      const reference = refs(client, location.workspaceId, location.projectId, canvasId);
      const canvasSnapshot = await client.sdk.firestore.getDoc(reference.canvasRef);
      if (!canvasSnapshot.exists()) throw new Error('Canvas no encontrado.');
      const canvas = normalizeCanvas(canvasSnapshot.data(), canvasSnapshot.id);
      const template = getCanvasTemplate(canvas.templateId);
      const section = template?.sections.find(item => item.id === sectionId);
      if (!section) throw new Error('Sección no válida.');
      const text = String(input?.text || '').trim().slice(0, 1200);
      if (!text) throw new Error('Escribe el contenido de la nota.');
      const existing = await activeNotesInSection(client, location.workspaceId, location.projectId, canvasId, sectionId);
      const noteRef = client.sdk.firestore.doc(reference.notesRef);
      const createdAt = nowIso();
      const note = normalizeNote({
        id: noteRef.id,
        canvasId,
        workspaceId: location.workspaceId,
        projectId: location.projectId,
        sectionId,
        text,
        colorId: input?.colorId || 'sky',
        colorHex: input?.colorHex || '',
        authorId: actor(session).actorId,
        authorUid: actor(session).actorUid,
        authorName: actor(session).actorName,
        createdAt,
        updatedAt: createdAt,
        position: positionForIndex(existing, existing.length),
        commentCount: 0,
        sourceCanvasId: input?.sourceCanvasId || '',
        sourceNoteId: input?.sourceNoteId || '',
        archived: false,
        schemaVersion: SCHEMA_VERSION
      }, noteRef.id);
      const event = historyEntry('note:created', `Nota agregada en ${section.title}`, session, location.workspaceId, location.projectId, canvasId, { noteId: note.id, sectionId });
      await client.sdk.firestore.runTransaction(client.db, async transaction => {
        const currentSnapshot = await transaction.get(reference.canvasRef);
        if (!currentSnapshot.exists()) throw new Error('Canvas no encontrado.');
        const current = normalizeCanvas(currentSnapshot.data(), currentSnapshot.id);
        transaction.set(noteRef, note);
        transaction.update(reference.canvasRef, nextCanvasPatch(current, session, {
          noteCount: Number(current.noteCount || 0) + 1,
          activeSectionCount: Math.max(Number(current.activeSectionCount || 0), sectionId ? 1 : 0),
          historyCount: Number(current.historyCount || 0) + 1
        }));
        transaction.set(client.sdk.firestore.doc(reference.historyRef, event.id), event);
      });
      return afterMutation(client, location, canvasId, session, 'note:created', { noteId: note.id });
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async updateNote({ canvasId, workspaceId, projectId, noteId, patch, session }) {
    try {
      const location = resolveLocation({ canvasId, workspaceId, projectId });
      requireEdit(session, location.projectId, location.workspaceId, canvasId);
      const client = await context(session);
      const reference = refs(client, location.workspaceId, location.projectId, canvasId);
      const noteRef = client.sdk.firestore.doc(reference.notesRef, noteId);
      let nextPosition = null;
      if (patch?.sectionId) {
        const canvasSnapshot = await client.sdk.firestore.getDoc(reference.canvasRef);
        const canvas = normalizeCanvas(canvasSnapshot.data(), canvasSnapshot.id);
        const template = getCanvasTemplate(canvas.templateId);
        if (!template?.sections.some(section => section.id === patch.sectionId)) throw new Error('Sección no válida.');
        const notes = await activeNotesInSection(client, location.workspaceId, location.projectId, canvasId, patch.sectionId, noteId);
        nextPosition = positionForIndex(notes, notes.length);
      }
      await client.sdk.firestore.runTransaction(client.db, async transaction => {
        const [canvasSnapshot, noteSnapshot] = await Promise.all([
          transaction.get(reference.canvasRef),
          transaction.get(noteRef)
        ]);
        if (!canvasSnapshot.exists() || !noteSnapshot.exists()) throw new Error('Nota no encontrada.');
        const canvas = normalizeCanvas(canvasSnapshot.data(), canvasSnapshot.id);
        const note = normalizeNote(noteSnapshot.data(), noteSnapshot.id);
        if (note.archived) throw new Error('La nota está eliminada.');
        const next = { updatedAt: nowIso(), schemaVersion: SCHEMA_VERSION };
        if (patch?.text !== undefined) {
          const text = String(patch.text || '').trim().slice(0, 1200);
          if (!text) throw new Error('La nota no puede quedar vacía.');
          next.text = text;
        }
        if (patch?.colorId !== undefined) next.colorId = String(patch.colorId || 'sky');
        if (patch?.colorHex !== undefined) next.colorHex = /^#[0-9a-f]{6}$/i.test(String(patch.colorHex || '')) ? String(patch.colorHex).toLowerCase() : '';
        if (patch?.sectionId !== undefined) {
          next.sectionId = String(patch.sectionId);
          next.position = Number(nextPosition || note.position || 1000);
        }
        const event = historyEntry('note:updated', 'Nota actualizada', session, location.workspaceId, location.projectId, canvasId, { noteId, sectionId: next.sectionId || note.sectionId });
        transaction.update(noteRef, next);
        transaction.update(reference.canvasRef, nextCanvasPatch(canvas, session, {
          historyCount: Number(canvas.historyCount || 0) + 1
        }));
        transaction.set(client.sdk.firestore.doc(reference.historyRef, event.id), event);
      });
      return afterMutation(client, location, canvasId, session, 'note:updated', { noteId });
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async moveNote({ canvasId, workspaceId, projectId, noteId, toSectionId, toIndex = 0, session }) {
    try {
      const location = resolveLocation({ canvasId, workspaceId, projectId });
      requireEdit(session, location.projectId, location.workspaceId, canvasId);
      const client = await context(session);
      const reference = refs(client, location.workspaceId, location.projectId, canvasId);
      const canvasSnapshot = await client.sdk.firestore.getDoc(reference.canvasRef);
      if (!canvasSnapshot.exists()) throw new Error('Canvas no encontrado.');
      const canvas = normalizeCanvas(canvasSnapshot.data(), canvasSnapshot.id);
      const destination = getCanvasTemplate(canvas.templateId)?.sections.find(section => section.id === toSectionId);
      if (!destination) throw new Error('Sección de destino no válida.');
      const notes = await activeNotesInSection(client, location.workspaceId, location.projectId, canvasId, toSectionId, noteId);
      const nextPosition = positionForIndex(notes, toIndex);
      const noteRef = client.sdk.firestore.doc(reference.notesRef, noteId);
      await client.sdk.firestore.runTransaction(client.db, async transaction => {
        const [currentCanvasSnapshot, noteSnapshot] = await Promise.all([
          transaction.get(reference.canvasRef),
          transaction.get(noteRef)
        ]);
        if (!currentCanvasSnapshot.exists() || !noteSnapshot.exists()) throw new Error('Nota no encontrada.');
        const currentCanvas = normalizeCanvas(currentCanvasSnapshot.data(), currentCanvasSnapshot.id);
        const note = normalizeNote(noteSnapshot.data(), noteSnapshot.id);
        if (note.archived) throw new Error('La nota está eliminada.');
        const event = historyEntry('note:moved', `Nota movida a ${destination.title}`, session, location.workspaceId, location.projectId, canvasId, {
          noteId,
          fromSectionId: note.sectionId,
          toSectionId
        });
        transaction.update(noteRef, {
          sectionId: toSectionId,
          position: nextPosition,
          updatedAt: nowIso(),
          schemaVersion: SCHEMA_VERSION
        });
        transaction.update(reference.canvasRef, nextCanvasPatch(currentCanvas, session, {
          historyCount: Number(currentCanvas.historyCount || 0) + 1
        }));
        transaction.set(client.sdk.firestore.doc(reference.historyRef, event.id), event);
      });
      return afterMutation(client, location, canvasId, session, 'note:moved', { noteId });
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async deleteNote({ canvasId, workspaceId, projectId, noteId, session }) {
    try {
      const location = resolveLocation({ canvasId, workspaceId, projectId });
      requireEdit(session, location.projectId, location.workspaceId, canvasId);
      const client = await context(session);
      const reference = refs(client, location.workspaceId, location.projectId, canvasId);
      const noteRef = client.sdk.firestore.doc(reference.notesRef, noteId);
      await client.sdk.firestore.runTransaction(client.db, async transaction => {
        const [canvasSnapshot, noteSnapshot] = await Promise.all([
          transaction.get(reference.canvasRef),
          transaction.get(noteRef)
        ]);
        if (!canvasSnapshot.exists() || !noteSnapshot.exists()) throw new Error('Nota no encontrada.');
        const canvas = normalizeCanvas(canvasSnapshot.data(), canvasSnapshot.id);
        const note = normalizeNote(noteSnapshot.data(), noteSnapshot.id);
        if (note.archived) return;
        const event = historyEntry('note:deleted', 'Nota eliminada', session, location.workspaceId, location.projectId, canvasId, { noteId, sectionId: note.sectionId });
        transaction.update(noteRef, {
          archived: true,
          archivedAt: nowIso(),
          archivedBy: actor(session).actorId,
          updatedAt: nowIso(),
          schemaVersion: SCHEMA_VERSION
        });
        transaction.update(reference.canvasRef, nextCanvasPatch(canvas, session, {
          noteCount: Math.max(0, Number(canvas.noteCount || 1) - 1),
          historyCount: Number(canvas.historyCount || 0) + 1
        }));
        transaction.set(client.sdk.firestore.doc(reference.historyRef, event.id), event);
      });
      return afterMutation(client, location, canvasId, session, 'note:deleted', { noteId });
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async addComment({ canvasId, workspaceId, projectId, noteId, text, session }) {
    try {
      const location = resolveLocation({ canvasId, workspaceId, projectId });
      requireComment(session, location.projectId, location.workspaceId, canvasId);
      const value = String(text || '').trim().slice(0, 800);
      if (!value) throw new Error('Escribe un comentario.');
      const client = await context(session);
      const reference = refs(client, location.workspaceId, location.projectId, canvasId);
      const noteRef = client.sdk.firestore.doc(reference.notesRef, noteId);
      const commentRef = client.sdk.firestore.doc(noteRef, 'comments', uid('comment'));
      const comment = normalizeComment({
        id: commentRef.id,
        noteId,
        canvasId,
        authorId: actor(session).actorId,
        authorUid: actor(session).actorUid,
        authorName: actor(session).actorName,
        text: value,
        createdAt: nowIso(),
        schemaVersion: SCHEMA_VERSION
      }, commentRef.id);
      await client.sdk.firestore.runTransaction(client.db, async transaction => {
        const [canvasSnapshot, noteSnapshot] = await Promise.all([
          transaction.get(reference.canvasRef),
          transaction.get(noteRef)
        ]);
        if (!canvasSnapshot.exists() || !noteSnapshot.exists()) throw new Error('Nota no encontrada.');
        const canvas = normalizeCanvas(canvasSnapshot.data(), canvasSnapshot.id);
        const note = normalizeNote(noteSnapshot.data(), noteSnapshot.id);
        const event = historyEntry('note:commented', 'Comentario agregado a una nota', session, location.workspaceId, location.projectId, canvasId, { noteId });
        transaction.set(commentRef, comment);
        transaction.update(noteRef, {
          commentCount: Number(note.commentCount || 0) + 1,
          updatedAt: nowIso(),
          schemaVersion: SCHEMA_VERSION
        });
        transaction.update(reference.canvasRef, nextCanvasPatch(canvas, session, {
          historyCount: Number(canvas.historyCount || 0) + 1
        }));
        transaction.set(client.sdk.firestore.doc(reference.historyRef, event.id), event);
      });
      return afterMutation(client, location, canvasId, session, 'comment:created', { noteId });
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async linkNote({ sourceCanvasId, sourceWorkspaceId, sourceProjectId, sourceNoteId, targetCanvasId, targetWorkspaceId, targetProjectId, targetSectionId, session }) {
    try {
      const sourceLocation = resolveLocation({ canvasId: sourceCanvasId, workspaceId: sourceWorkspaceId, projectId: sourceProjectId });
      const targetLocation = resolveLocation({ canvasId: targetCanvasId, workspaceId: targetWorkspaceId, projectId: targetProjectId });
      requireAccess(session, sourceLocation.projectId, sourceLocation.workspaceId, sourceCanvasId);
      requireEdit(session, targetLocation.projectId, targetLocation.workspaceId, targetCanvasId);
      const client = await context(session);
      const sourceRef = refs(client, sourceLocation.workspaceId, sourceLocation.projectId, sourceCanvasId);
      const sourceSnapshot = await client.sdk.firestore.getDoc(client.sdk.firestore.doc(sourceRef.notesRef, sourceNoteId));
      if (!sourceSnapshot.exists()) throw new Error('Nota de origen no encontrada.');
      const sourceNote = normalizeNote(sourceSnapshot.data(), sourceSnapshot.id);
      return this.createNote({
        canvasId: targetCanvasId,
        workspaceId: targetLocation.workspaceId,
        projectId: targetLocation.projectId,
        sectionId: targetSectionId,
        input: {
          text: sourceNote.text,
          colorId: sourceNote.colorId,
          colorHex: sourceNote.colorHex,
          sourceCanvasId,
          sourceNoteId
        },
        session
      });
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async createShareToken({ canvasId, workspaceId, projectId, expiresAt, label = '', session }) {
    try {
      const location = resolveLocation({ canvasId, workspaceId, projectId });
      requireManage(session, location.projectId, location.workspaceId);
      const client = await context(session);
      const instance = await loadInstance(client, location.workspaceId, location.projectId, canvasId, session);
      const expiry = new Date(expiresAt || Date.now() + 7 * 86400000);
      if (!Number.isFinite(expiry.getTime()) || expiry.getTime() <= Date.now()) throw new Error('Selecciona una fecha de vencimiento futura.');
      const code = uid('share').replace(/[^a-z0-9]/gi, '').slice(-24).toUpperCase();
      const reference = refs(client, location.workspaceId, location.projectId, canvasId);
      const shareRef = client.sdk.firestore.doc(reference.shareLinksRef);
      const timestamp = client.sdk.firestore.Timestamp.fromDate(expiry);
      const link = {
        id: shareRef.id,
        code,
        canvasId,
        workspaceId: location.workspaceId,
        projectId: location.projectId,
        label: String(label || '').trim().slice(0, 80),
        shareType: 'public',
        permission: 'viewer',
        requiresAuth: false,
        createdBy: actor(session).actorId,
        createdByUid: actor(session).actorUid,
        createdByName: actor(session).actorName,
        createdAt: nowIso(),
        expiresAt: timestamp,
        active: true,
        schemaVersion: SCHEMA_VERSION
      };
      const event = historyEntry('shared', 'Enlace de consulta generado', session, location.workspaceId, location.projectId, canvasId, { tokenId: link.id, expiresAt: expiry.toISOString() });
      const batch = client.sdk.firestore.writeBatch(client.db);
      batch.set(shareRef, link);
      batch.set(client.sdk.firestore.doc(client.db, 'canvasShares', code), publicShareSnapshot(instance, link));
      batch.set(client.sdk.firestore.doc(reference.historyRef, event.id), event);
      batch.update(reference.canvasRef, {
        version: Number(instance.version || 1) + 1,
        shareCount: Number(instance.shareCount || 0) + 1,
        historyCount: Number(instance.historyCount || 0) + 1,
        updatedAt: nowIso(),
        updatedBy: session?.firebaseUid || '',
        schemaVersion: SCHEMA_VERSION
      });
      await batch.commit();
      emit({ action: 'canvas:shared', canvasId, workspaceId: location.workspaceId, projectId: location.projectId });
      return { ...link, expiresAt: expiry.toISOString() };
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async listShareTokens({ canvasId, workspaceId, projectId, session }) {
    try {
      const location = resolveLocation({ canvasId, workspaceId, projectId });
      requireManage(session, location.projectId, location.workspaceId);
      const client = await context(session);
      const snapshot = await client.sdk.firestore.getDocs(refs(client, location.workspaceId, location.projectId, canvasId).shareLinksRef);
      return snapshot.docs.map(item => {
        const data = { id: item.id, ...item.data() };
        return { ...data, expiresAt: asIso(data.expiresAt), createdAt: asIso(data.createdAt), revokedAt: asIso(data.revokedAt) };
      }).filter(item => item.shareType !== 'person' && item.requiresAuth !== true)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async revokeShareToken({ canvasId, workspaceId, projectId, tokenId, session }) {
    try {
      const location = resolveLocation({ canvasId, workspaceId, projectId });
      requireManage(session, location.projectId, location.workspaceId);
      const client = await context(session);
      const reference = refs(client, location.workspaceId, location.projectId, canvasId);
      const shareRef = client.sdk.firestore.doc(reference.shareLinksRef, tokenId);
      const snapshot = await client.sdk.firestore.getDoc(shareRef);
      if (!snapshot.exists()) throw new Error('Enlace no encontrado.');
      const link = { id: snapshot.id, ...snapshot.data() };
      const event = historyEntry('share:revoked', 'Enlace de consulta revocado', session, location.workspaceId, location.projectId, canvasId, { tokenId });
      const canvasSnapshot = await client.sdk.firestore.getDoc(reference.canvasRef);
      const canvas = normalizeCanvas(canvasSnapshot.data(), canvasSnapshot.id);
      const batch = client.sdk.firestore.writeBatch(client.db);
      batch.update(shareRef, {
        active: false,
        revokedAt: nowIso(),
        revokedBy: actor(session).actorId,
        revokedByUid: actor(session).actorUid
      });
      batch.set(client.sdk.firestore.doc(client.db, 'canvasShares', link.code), {
        active: false,
        revokedAt: nowIso(),
        updatedAt: nowIso()
      }, { merge: true });
      batch.set(client.sdk.firestore.doc(reference.historyRef, event.id), event);
      batch.update(reference.canvasRef, nextCanvasPatch(canvas, session, {
        shareCount: Math.max(0, Number(canvas.shareCount || 1) - 1),
        historyCount: Number(canvas.historyCount || 0) + 1
      }));
      await batch.commit();
      emit({ action: 'canvas:share-revoked', canvasId, workspaceId: location.workspaceId, projectId: location.projectId });
      return { ...link, active: false, revokedAt: nowIso(), expiresAt: asIso(link.expiresAt) };
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async getSharedInstance({ token }) {
    try {
      const normalized = String(token || '').trim().toUpperCase();
      if (!normalized) throw new Error('El enlace compartido no es válido.');
      const client = await getFirebaseClient();
      const snapshot = await client.sdk.firestore.getDoc(client.sdk.firestore.doc(client.db, 'canvasShares', normalized));
      if (!snapshot.exists()) throw new Error('El enlace compartido no existe, expiró o fue revocado.');
      const data = snapshot.data();
      if (data.active === false || timestampMillis(data.expiresAt) <= Date.now()) {
        throw new Error('El enlace compartido no existe, expiró o fue revocado.');
      }
      return {
        id: data.canvasId,
        workspaceId: data.workspaceId,
        projectId: data.projectId,
        templateId: data.templateId,
        title: data.title,
        status: 'active',
        version: Number(data.version || 1),
        createdAt: asIso(data.createdAt, nowIso()),
        updatedAt: asIso(data.updatedAt, nowIso()),
        notes: (data.notes || []).map(note => ({
          ...normalizeNote({ ...note, canvasId: data.canvasId, workspaceId: data.workspaceId, projectId: data.projectId }, note.id),
          comments: [],
          author: null
        })),
        history: [],
        snapshots: [],
        shareTokens: [],
        template: clone(getCanvasTemplate(data.templateId)),
        author: null,
        publicShare: true
      };
    } catch (error) {
      if (String(error?.code || '') === 'permission-denied') {
        throw new Error('El enlace compartido no existe, expiró o fue revocado.');
      }
      throw friendlyError(error);
    }
  },

  async createPersonShare({ canvasId, workspaceId, projectId, email, permission, expiresAt, session }) {
    requireManage(session, projectId, workspaceId);
    const result = await callCanvasAccessFunction('wonkupCreateCanvasShareAccess', {
      canvasId, workspaceId, projectId, email, permission, expiresAt
    }, session);
    return result.grant;
  },

  async listPersonShares({ canvasId, workspaceId, projectId, session }) {
    requireManage(session, projectId, workspaceId);
    const result = await callCanvasAccessFunction('wonkupListCanvasShareAccess', {
      canvasId, workspaceId, projectId
    }, session);
    return result.grants || [];
  },

  async updatePersonShare({ canvasId, workspaceId, projectId, targetUid, permission, expiresAt, session }) {
    requireManage(session, projectId, workspaceId);
    return callCanvasAccessFunction('wonkupUpdateCanvasShareAccess', {
      canvasId, workspaceId, projectId, targetUid, permission, expiresAt
    }, session);
  },

  async revokePersonShare({ canvasId, workspaceId, projectId, targetUid, session }) {
    requireManage(session, projectId, workspaceId);
    return callCanvasAccessFunction('wonkupRevokeCanvasShareAccess', {
      canvasId, workspaceId, projectId, targetUid
    }, session);
  },

  async resolvePersonShare({ token, session = null }) {
    return callCanvasAccessFunction('wonkupResolveCanvasShareAccess', { token }, session);
  },

  async getSharedCollaborativeInstance({ token, session, access = null }) {
    try {
      if (!session?.firebaseUid) throw new Error('Inicia sesión con la Cuenta WonkUp autorizada.');
      const resolved = access || await this.resolvePersonShare({ token, session });
      if (resolved.requiresAuth) throw new Error('Inicia sesión con la Cuenta WonkUp autorizada.');
      const sharedSession = collaborativeShareSession(session, resolved);
      const client = await context(sharedSession);
      const instance = await loadInstance(
        client,
        resolved.workspaceId,
        resolved.projectId,
        resolved.canvasId,
        sharedSession,
        { includeHistory: false }
      );
      return { instance: { ...instance, sharedAccess: resolved }, session: sharedSession, access: resolved };
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async listVersions({ canvasId, workspaceId, projectId, session }) {
    try {
      const location = resolveLocation({ canvasId, workspaceId, projectId });
      requireAccess(session, location.projectId, location.workspaceId);
      const client = await context(session);
      const reference = refs(client, location.workspaceId, location.projectId, canvasId);
      let docs;
      try {
        const snapshot = await client.sdk.firestore.getDocs(client.sdk.firestore.query(reference.versionsRef, client.sdk.firestore.orderBy('createdAt', 'desc'), client.sdk.firestore.limit(MAX_VERSIONS)));
        docs = snapshot.docs;
      } catch {
        const snapshot = await client.sdk.firestore.getDocs(reference.versionsRef);
        docs = snapshot.docs.sort((a, b) => new Date(asIso(b.data().createdAt)) - new Date(asIso(a.data().createdAt))).slice(0, MAX_VERSIONS);
      }
      const versions = docs.map(item => normalizeVersion(item.data(), item.id));
      const directory = await loadDirectory(client, location.workspaceId, location.projectId, session);
      return versions.map(version => ({
        ...version,
        actor: publicPerson(directory.get(version.createdBy) || directory.get(version.createdByUid), {
          id: version.createdBy,
          authUid: version.createdByUid,
          name: version.createdByName
        })
      }));
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async createVersion({ canvasId, workspaceId, projectId, label = '', session }) {
    try {
      const location = resolveLocation({ canvasId, workspaceId, projectId });
      requireManage(session, location.projectId, location.workspaceId);
      const client = await context(session);
      const instance = await loadInstance(client, location.workspaceId, location.projectId, canvasId, session);
      const reference = refs(client, location.workspaceId, location.projectId, canvasId);
      const version = versionPayload(instance, session, label || `Punto de control · versión ${instance.version}`);
      const event = historyEntry('version:created', 'Punto de control creado', session, location.workspaceId, location.projectId, canvasId, { snapshotId: version.id });
      const batch = client.sdk.firestore.writeBatch(client.db);
      batch.set(client.sdk.firestore.doc(reference.versionsRef, version.id), version);
      batch.set(client.sdk.firestore.doc(reference.historyRef, event.id), event);
      batch.update(reference.canvasRef, nextCanvasPatch(instance, session, {
        versionCount: Number(instance.versionCount || 0) + 1,
        historyCount: Number(instance.historyCount || 0) + 1
      }));
      await batch.commit();
      emit({ action: 'canvas:version-created', canvasId, workspaceId: location.workspaceId, projectId: location.projectId });
      return { ...version, actor: publicPerson(session?.user, session?.user || {}) };
    } catch (error) {
      throw friendlyError(error);
    }
  },

  async restoreVersion({ canvasId, workspaceId, projectId, snapshotId, session }) {
    try {
      const location = resolveLocation({ canvasId, workspaceId, projectId });
      requireSuperadmin(session, location.projectId, location.workspaceId);
      const client = await context(session);
      const reference = refs(client, location.workspaceId, location.projectId, canvasId);
      const [instance, versionSnapshot] = await Promise.all([
        loadInstance(client, location.workspaceId, location.projectId, canvasId, session),
        client.sdk.firestore.getDoc(client.sdk.firestore.doc(reference.versionsRef, snapshotId))
      ]);
      if (!versionSnapshot.exists()) throw new Error('Versión no encontrada.');
      const selected = normalizeVersion(versionSnapshot.data(), versionSnapshot.id);
      const backup = versionPayload(instance, session, `Respaldo antes de restaurar versión ${selected.version}`);
      const event = historyEntry('version:restored', `Versión ${selected.version} restaurada`, session, location.workspaceId, location.projectId, canvasId, { snapshotId });
      const currentSnapshot = await client.sdk.firestore.getDocs(reference.notesRef);
      const selectedNotes = selected.notes.slice(0, 180);
      const estimatedWrites = currentSnapshot.size
        + selectedNotes.reduce((total, note) => total + 1 + Math.min((note.comments || []).length, 80), 0)
        + 3;
      if (estimatedWrites > 450) {
        throw new Error('La versión es demasiado grande para restaurarla de forma atómica. Reduce notas o comentarios y vuelve a intentarlo.');
      }
      const batch = client.sdk.firestore.writeBatch(client.db);
      currentSnapshot.docs.forEach(item => batch.set(item.ref, {
        archived: true,
        archivedAt: nowIso(),
        archivedBy: actor(session).actorId,
        updatedAt: nowIso(),
        schemaVersion: SCHEMA_VERSION
      }, { merge: true }));
      for (const source of selectedNotes) {
        // Restored notes receive fresh IDs. The previous documents remain archived,
        // preserving their original comments and avoiding duplicate writes in one batch.
        const noteRef = client.sdk.firestore.doc(reference.notesRef);
        const noteId = noteRef.id;
        const note = normalizeNote({
          ...source,
          id: noteId,
          canvasId,
          workspaceId: location.workspaceId,
          projectId: location.projectId,
          archived: false,
          archivedAt: '',
          archivedBy: '',
          commentCount: (source.comments || []).length,
          schemaVersion: SCHEMA_VERSION
        }, noteId);
        batch.set(noteRef, { ...note, comments: undefined }, { merge: true });
        for (const sourceComment of (source.comments || []).slice(0, 80)) {
          const commentId = String(sourceComment.id || uid('comment'));
          batch.set(client.sdk.firestore.doc(noteRef, 'comments', commentId), normalizeComment({
            ...sourceComment,
            id: commentId,
            noteId,
            canvasId,
            schemaVersion: SCHEMA_VERSION
          }, commentId), { merge: true });
        }
      }
      batch.set(client.sdk.firestore.doc(reference.versionsRef, backup.id), backup);
      batch.set(client.sdk.firestore.doc(reference.historyRef, event.id), event);
      batch.update(reference.canvasRef, {
        title: selected.title || instance.title,
        templateId: selected.templateId || instance.templateId,
        version: Number(instance.version || 1) + 1,
        noteCount: selected.notes.length,
        activeSectionCount: new Set(selected.notes.map(note => note.sectionId)).size,
        versionCount: Number(instance.versionCount || 0) + 1,
        historyCount: Number(instance.historyCount || 0) + 1,
        updatedAt: nowIso(),
        updatedBy: session?.firebaseUid || '',
        schemaVersion: SCHEMA_VERSION
      });
      await batch.commit();
      return afterMutation(client, location, canvasId, session, 'canvas:version-restored');
    } catch (error) {
      throw friendlyError(error);
    }
  },

  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  async startRealtime({ canvasId, workspaceId, projectId, session }) {
    try {
      const location = resolveLocation({ canvasId, workspaceId, projectId });
      requireAccess(session, location.projectId, location.workspaceId, canvasId);
      const client = await context(session);
      const key = `${session.firebaseUid}:${location.workspaceId}:${location.projectId}:${canvasId}`;
      realtimeStops.get(key)?.();
      let initialized = false;
      const stop = client.sdk.firestore.onSnapshot(
        refs(client, location.workspaceId, location.projectId, canvasId).canvasRef,
        snapshot => {
          if (!initialized) {
            initialized = true;
            return;
          }
          listeners.forEach(listener => listener({
            source: 'firestore',
            action: snapshot.exists() ? 'canvas:realtime' : 'canvas:removed',
            canvasId,
            workspaceId: location.workspaceId,
            projectId: location.projectId,
            at: nowIso()
          }));
        },
        error => console.warn('WonkUp Canvas realtime listener', friendlyError(error).message)
      );
      const wrapped = () => {
        stop();
        if (realtimeStops.get(key) === wrapped) realtimeStops.delete(key);
      };
      realtimeStops.set(key, wrapped);
      return wrapped;
    } catch (error) {
      throw friendlyError(error);
    }
  },

  startPresence({ canvasId, workspaceId, projectId, session, onChange }) {
    let stopped = false;
    let cleanup = () => {};
    (async () => {
      try {
        const location = resolveLocation({ canvasId, workspaceId, projectId });
        requireAccess(session, location.projectId, location.workspaceId, canvasId);
        const client = await context(session);
        if (!client.realtimeDb) throw new Error('Realtime Database no está configurada.');
        const { ref, onValue, onDisconnect, set, remove, serverTimestamp } = client.sdk.database;
        const uidValue = session.firebaseUid;
        const rootPath = `presence/${location.workspaceId}/${location.projectId}/${canvasId}`;
        const memberPath = `${rootPath}/${uidValue}/${presenceClientId}`;
        const rootRef = ref(client.realtimeDb, rootPath);
        const memberRef = ref(client.realtimeDb, memberPath);
        const connectedRef = ref(client.realtimeDb, '.info/connected');
        const publish = async () => {
          await set(memberRef, {
            authUid: uidValue,
            userId: session?.user?.id || uidValue,
            userName: session?.user?.name || session?.user?.email || 'Participante',
            initials: session?.user?.initials || 'P',
            clientId: presenceClientId,
            lastChanged: serverTimestamp()
          });
        };
        const stopConnected = onValue(connectedRef, async snapshot => {
          if (!snapshot.val() || stopped) return;
          try {
            await onDisconnect(memberRef).remove();
            await publish();
          } catch (error) {
            console.warn('WonkUp Canvas presence publish', friendlyError(error).message);
          }
        });
        const stopList = onValue(rootRef, snapshot => {
          const value = snapshot.val() || {};
          const cutoff = Date.now() - 90000;
          const people = [];
          Object.entries(value).forEach(([authUid, connections]) => {
            const entries = Object.values(connections || {}).filter(entry => Number(entry?.lastChanged || 0) >= cutoff);
            if (!entries.length) return;
            const entry = entries.sort((a, b) => Number(b.lastChanged || 0) - Number(a.lastChanged || 0))[0];
            people.push({
              authUid,
              clientId: entry.clientId,
              userId: entry.userId,
              userName: entry.userName,
              initials: entry.initials,
              user: {
                id: entry.userId || authUid,
                authUid,
                name: entry.userName || 'Participante',
                initials: entry.initials || 'P'
              }
            });
          });
          onChange?.(people);
        }, error => console.warn('WonkUp Canvas presence listener', friendlyError(error).message));
        const interval = setInterval(() => publish().catch(() => {}), 30000);
        cleanup = () => {
          clearInterval(interval);
          stopConnected?.();
          stopList?.();
          remove(memberRef).catch(() => {});
        };
        if (stopped) cleanup();
      } catch (error) {
        console.warn('WonkUp Canvas presence unavailable', friendlyError(error).message);
        onChange?.([]);
      }
    })();
    return () => {
      stopped = true;
      cleanup();
    };
  },

  async resetDemo() {
    throw new Error('Los canvases Firebase no se restablecen desde el navegador. Usa la migración controlada de Cloud Foundation.');
  }
};
