import { demoCanvasInstances } from '../../data/demo-canvases.js';
import { getCanvasTemplate } from '../../data/canvas-templates.js';
import { demoUsers } from '../../data/demo-users.js';
import { canAccessProject, canDeleteCanvas, canEditCanvas, canManageCanvas } from '../utils/permissions.js';

const STORAGE_KEY = 'wonkup.e5.canvases';
const PRESENCE_KEY = 'wonkup.e5.canvas-presence';
const CHANNEL_NAME = 'wonkup-canvas';
const MAX_HISTORY = 150;
const MAX_SNAPSHOTS = 20;
const wait = (milliseconds = 80) => new Promise(resolve => setTimeout(resolve, milliseconds));
const clone = value => JSON.parse(JSON.stringify(value));
const subscribers = new Set();
const channel = 'BroadcastChannel' in globalThis ? new BroadcastChannel(CHANNEL_NAME) : null;
const clientId = sessionStorage.getItem('wonkup.canvas.clientId') || uid('client');
sessionStorage.setItem('wonkup.canvas.clientId', clientId);

function uid(prefix) {
  return globalThis.crypto?.randomUUID
    ? `${prefix}-${crypto.randomUUID()}`
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function now() { return new Date().toISOString(); }
function actor(session) { return session?.user?.id || 'system'; }
function usersById() { return Object.fromEntries(demoUsers.map(user => [user.id, user])); }

function snapshotPayload(instance, session, label) {
  return {
    id: uid('version'),
    version: Number(instance.version || 1),
    label: String(label || `Versión ${instance.version || 1}`).slice(0, 120),
    createdAt: now(),
    createdBy: actor(session),
    title: instance.title,
    templateId: instance.templateId,
    notes: clone(instance.notes || [])
  };
}

function migrate(instance) {
  const value = clone(instance);
  value.status ||= 'active';
  value.version = Number(value.version || 1);
  value.shareTokens ||= [];
  value.notes ||= [];
  value.history ||= [];
  value.snapshots ||= [];
  value.notes = value.notes.map((note, index) => ({
    ...note,
    position: Number(note.position || (index + 1) * 1000),
    colorId: note.colorId || 'sky',
    comments: note.comments || [],
    sourceCanvasId: note.sourceCanvasId || '',
    sourceNoteId: note.sourceNoteId || ''
  }));
  if (!value.snapshots.length) {
    value.snapshots = [{
      id: `version-initial-${value.id}`,
      version: value.version,
      label: 'Versión inicial',
      createdAt: value.updatedAt || value.createdAt || now(),
      createdBy: value.createdBy || 'system',
      title: value.title,
      templateId: value.templateId,
      notes: clone(value.notes)
    }];
  }
  return value;
}

function readInstances() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw).map(migrate);
  } catch { /* use seed */ }
  const seeded = demoCanvasInstances.map(migrate);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded)); } catch { /* noop */ }
  return seeded;
}

function writeInstances(instances, event = {}) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(instances));
  const payload = { source: 'mock', at: now(), ...event };
  subscribers.forEach(listener => listener(payload));
  channel?.postMessage(payload);
  return clone(instances);
}

channel?.addEventListener('message', event => subscribers.forEach(listener => listener(event.data || { source: 'broadcast' })));
window.addEventListener('storage', event => {
  if (![STORAGE_KEY, PRESENCE_KEY].includes(event.key)) return;
  subscribers.forEach(listener => listener({ source: 'storage', at: now(), key: event.key }));
});

function requireAccess(session, instance) {
  if (!instance || !canAccessProject(session, instance.projectId, instance.workspaceId)) throw new Error('No tienes acceso a este canvas.');
}
function requireEdit(session, instance) {
  requireAccess(session, instance);
  if (!canEditCanvas(session)) throw new Error('Tu rol no permite modificar canvases.');
}
function requireManage(session, instance) {
  requireAccess(session, instance);
  if (!canManageCanvas(session)) throw new Error('Tu rol no permite administrar este canvas.');
}
function requireSuperadmin(session, instance) {
  requireAccess(session, instance);
  if (session?.role !== 'superadmin') throw new Error('Solo el superadministrador puede restaurar versiones.');
}

function findInstance(instances, canvasId, { includeArchived = false } = {}) {
  const instance = instances.find(item => item.id === canvasId && (includeArchived || item.status !== 'archived'));
  if (!instance) throw new Error('Canvas no encontrado.');
  return instance;
}

function addHistory(instance, type, title, session, meta = {}) {
  instance.history ||= [];
  instance.history.unshift({ id: uid('hist'), type, title, actorId: actor(session), createdAt: now(), meta });
  instance.history = instance.history.slice(0, MAX_HISTORY);
}

function touch(instance) {
  instance.updatedAt = now();
  instance.version = Number(instance.version || 0) + 1;
}

function saveSnapshot(instance, session, label) {
  instance.snapshots ||= [];
  instance.snapshots.unshift(snapshotPayload(instance, session, label));
  instance.snapshots = instance.snapshots.slice(0, MAX_SNAPSHOTS);
}

function finishMutation(instance, session, historyType, historyTitle, event, meta = {}) {
  touch(instance);
  addHistory(instance, historyType, historyTitle, session, meta);
  saveSnapshot(instance, session, historyTitle);
  return event;
}

function normalizePositions(instance, sectionId) {
  instance.notes
    .filter(note => note.sectionId === sectionId)
    .sort((a, b) => Number(a.position || 0) - Number(b.position || 0))
    .forEach((note, index) => { note.position = (index + 1) * 1000; });
}

function enrich(instance) {
  const people = usersById();
  const template = getCanvasTemplate(instance.templateId);
  return {
    ...clone(instance),
    template: clone(template),
    author: people[instance.createdBy] || null,
    notes: instance.notes.map(note => ({
      ...clone(note),
      author: people[note.authorId] || null,
      comments: (note.comments || []).map(comment => ({ ...clone(comment), author: people[comment.authorId] || null }))
    })),
    history: (instance.history || []).map(entry => ({ ...clone(entry), actor: people[entry.actorId] || null })),
    snapshots: (instance.snapshots || []).map(snapshot => ({ ...clone(snapshot), actor: people[snapshot.createdBy] || null }))
  };
}

function readPresence() {
  try { return JSON.parse(localStorage.getItem(PRESENCE_KEY) || '{}'); }
  catch { return {}; }
}
function writePresence(value) {
  try { localStorage.setItem(PRESENCE_KEY, JSON.stringify(value)); } catch { /* noop */ }
  channel?.postMessage({ source: 'presence', at: now() });
}
function activePresence(canvasId) {
  const value = readPresence();
  const cutoff = Date.now();
  const people = usersById();
  let dirty = false;
  Object.entries(value).forEach(([key, entry]) => {
    if (!entry?.expiresAt || entry.expiresAt < cutoff) { delete value[key]; dirty = true; }
  });
  if (dirty) writePresence(value);
  const seen = new Set();
  return Object.values(value)
    .filter(entry => entry.canvasId === canvasId)
    .filter(entry => {
      const key = entry.userId || entry.clientId;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map(entry => ({ ...entry, user: people[entry.userId] || { id: entry.userId, name: entry.userName, initials: entry.initials } }));
}

export const MockCanvasAdapter = {
  async listInstances({ workspaceId = 'all', projectId = '', session, includeArchived = false }) {
    await wait();
    return readInstances()
      .filter(instance => includeArchived || instance.status !== 'archived')
      .filter(instance => !projectId || instance.projectId === projectId)
      .filter(instance => workspaceId === 'all' || instance.workspaceId === workspaceId)
      .filter(instance => canAccessProject(session, instance.projectId, instance.workspaceId))
      .map(enrich)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  },

  async getInstance({ canvasId, session }) {
    await wait();
    const instance = findInstance(readInstances(), canvasId);
    requireAccess(session, instance);
    return enrich(instance);
  },

  async createInstance({ workspaceId, projectId, templateId, title, session }) {
    await wait(130);
    if (!canAccessProject(session, projectId, workspaceId)) throw new Error('No tienes acceso al proyecto seleccionado.');
    if (!canEditCanvas(session)) throw new Error('Tu rol no permite crear canvases.');
    const template = getCanvasTemplate(templateId);
    if (!template) throw new Error('Plantilla no encontrada.');
    const instances = readInstances();
    const createdAt = now();
    const instance = migrate({
      id: uid('canvas'), workspaceId, projectId, templateId,
      title: String(title || template.name).trim().slice(0, 140) || template.name,
      status: 'active', createdBy: actor(session), createdAt, updatedAt: createdAt,
      version: 1, shareTokens: [], notes: [], history: [], snapshots: []
    });
    addHistory(instance, 'created', 'Canvas creado', session, { templateId });
    instances.push(instance);
    writeInstances(instances, { canvasId: instance.id, projectId, action: 'canvas:created' });
    return enrich(instance);
  },

  async updateInstance({ canvasId, patch, session }) {
    await wait(90);
    const instances = readInstances();
    const instance = findInstance(instances, canvasId);
    requireEdit(session, instance);
    if ('title' in patch) {
      const title = String(patch.title || '').trim().slice(0, 140);
      if (!title) throw new Error('El título del canvas no puede quedar vacío.');
      instance.title = title;
    }
    finishMutation(instance, session, 'updated', 'Información del canvas actualizada');
    writeInstances(instances, { canvasId, projectId: instance.projectId, action: 'canvas:updated' });
    return enrich(instance);
  },

  async archiveInstance({ canvasId, session }) {
    await wait(100);
    const instances = readInstances();
    const instance = findInstance(instances, canvasId);
    requireManage(session, instance);
    instance.status = 'archived';
    instance.archivedAt = now();
    instance.archivedBy = actor(session);
    finishMutation(instance, session, 'archived', 'Canvas archivado');
    writeInstances(instances, { canvasId, projectId: instance.projectId, action: 'canvas:archived' });
    return enrich(instance);
  },

  async restoreInstance({ canvasId, session }) {
    await wait(100);
    const instances = readInstances();
    const instance = findInstance(instances, canvasId, { includeArchived: true });
    requireManage(session, instance);
    instance.status = 'active';
    instance.restoredAt = now();
    instance.restoredBy = actor(session);
    finishMutation(instance, session, 'restored', 'Canvas restaurado');
    writeInstances(instances, { canvasId, projectId: instance.projectId, action: 'canvas:restored' });
    return enrich(instance);
  },

  async deleteInstance({ canvasId, session }) {
    await wait(100);
    const instances = readInstances();
    const instance = findInstance(instances, canvasId, { includeArchived: true });
    requireAccess(session, instance);
    if (!canDeleteCanvas(session)) throw new Error('Solo un administrador puede eliminar canvases definitivamente.');
    if (instance.status !== 'archived') throw new Error('Archiva el canvas antes de eliminarlo definitivamente.');
    writeInstances(instances.filter(item => item.id !== canvasId), { canvasId, projectId: instance.projectId, action: 'canvas:deleted' });
    return true;
  },

  async createNote({ canvasId, sectionId, input, session }) {
    await wait(85);
    const instances = readInstances();
    const instance = findInstance(instances, canvasId);
    requireEdit(session, instance);
    const template = getCanvasTemplate(instance.templateId);
    if (!template?.sections.some(section => section.id === sectionId)) throw new Error('Sección no válida.');
    const text = String(input?.text || '').trim().slice(0, 1200);
    if (!text) throw new Error('Escribe el contenido de la nota.');
    const existing = instance.notes.filter(note => note.sectionId === sectionId);
    const createdAt = now();
    const note = {
      id: uid('note'), sectionId, text,
      colorId: input?.colorId || 'sky',
      authorId: actor(session), createdAt, updatedAt: createdAt,
      position: (existing.length + 1) * 1000, comments: [],
      sourceCanvasId: input?.sourceCanvasId || '', sourceNoteId: input?.sourceNoteId || ''
    };
    instance.notes.push(note);
    const sectionTitle = template.sections.find(section => section.id === sectionId)?.title || 'sección';
    finishMutation(instance, session, 'note:created', `Nota agregada en ${sectionTitle}`, null, { noteId: note.id, sectionId });
    writeInstances(instances, { canvasId, projectId: instance.projectId, noteId: note.id, action: 'note:created' });
    return enrich(instance);
  },

  async updateNote({ canvasId, noteId, patch, session }) {
    await wait(80);
    const instances = readInstances();
    const instance = findInstance(instances, canvasId);
    requireEdit(session, instance);
    const note = instance.notes.find(item => item.id === noteId);
    if (!note) throw new Error('Nota no encontrada.');
    if ('text' in patch) {
      const text = String(patch.text || '').trim().slice(0, 1200);
      if (!text) throw new Error('La nota no puede quedar vacía.');
      note.text = text;
    }
    if ('colorId' in patch) note.colorId = String(patch.colorId || 'sky');
    if ('sectionId' in patch) {
      const template = getCanvasTemplate(instance.templateId);
      if (!template?.sections.some(section => section.id === patch.sectionId)) throw new Error('Sección no válida.');
      const previousSection = note.sectionId;
      note.sectionId = patch.sectionId;
      note.position = (instance.notes.filter(item => item.id !== note.id && item.sectionId === patch.sectionId).length + 1) * 1000;
      normalizePositions(instance, previousSection);
    }
    note.updatedAt = now();
    finishMutation(instance, session, 'note:updated', 'Nota actualizada', null, { noteId, sectionId: note.sectionId });
    writeInstances(instances, { canvasId, projectId: instance.projectId, noteId, action: 'note:updated' });
    return enrich(instance);
  },

  async moveNote({ canvasId, noteId, toSectionId, toIndex = 0, session }) {
    await wait(60);
    const instances = readInstances();
    const instance = findInstance(instances, canvasId);
    requireEdit(session, instance);
    const template = getCanvasTemplate(instance.templateId);
    const destination = template?.sections.find(section => section.id === toSectionId);
    if (!destination) throw new Error('Sección de destino no válida.');
    const note = instance.notes.find(item => item.id === noteId);
    if (!note) throw new Error('Nota no encontrada.');
    const fromSectionId = note.sectionId;
    const targetNotes = instance.notes.filter(item => item.id !== noteId && item.sectionId === toSectionId).sort((a, b) => Number(a.position) - Number(b.position));
    const safeIndex = Math.max(0, Math.min(Number(toIndex || 0), targetNotes.length));
    targetNotes.splice(safeIndex, 0, note);
    note.sectionId = toSectionId;
    targetNotes.forEach((item, index) => { item.position = (index + 1) * 1000; });
    normalizePositions(instance, fromSectionId);
    note.updatedAt = now();
    finishMutation(instance, session, 'note:moved', `Nota movida a ${destination.title}`, null, { noteId, fromSectionId, toSectionId });
    writeInstances(instances, { canvasId, projectId: instance.projectId, noteId, action: 'note:moved' });
    return enrich(instance);
  },

  async deleteNote({ canvasId, noteId, session }) {
    await wait(70);
    const instances = readInstances();
    const instance = findInstance(instances, canvasId);
    requireEdit(session, instance);
    const note = instance.notes.find(item => item.id === noteId);
    if (!note) throw new Error('Nota no encontrada.');
    instance.notes = instance.notes.filter(item => item.id !== noteId);
    normalizePositions(instance, note.sectionId);
    finishMutation(instance, session, 'note:deleted', 'Nota eliminada', null, { noteId, sectionId: note.sectionId });
    writeInstances(instances, { canvasId, projectId: instance.projectId, noteId, action: 'note:deleted' });
    return enrich(instance);
  },

  async addComment({ canvasId, noteId, text, session }) {
    await wait(70);
    const instances = readInstances();
    const instance = findInstance(instances, canvasId);
    requireEdit(session, instance);
    const note = instance.notes.find(item => item.id === noteId);
    if (!note) throw new Error('Nota no encontrada.');
    const value = String(text || '').trim().slice(0, 800);
    if (!value) throw new Error('Escribe un comentario.');
    note.comments ||= [];
    note.comments.push({ id: uid('comment'), authorId: actor(session), text: value, createdAt: now() });
    note.updatedAt = now();
    finishMutation(instance, session, 'note:commented', 'Comentario agregado a una nota', null, { noteId });
    writeInstances(instances, { canvasId, projectId: instance.projectId, noteId, action: 'comment:created' });
    return enrich(instance);
  },

  async linkNote({ sourceCanvasId, sourceNoteId, targetCanvasId, targetSectionId, session }) {
    await wait(110);
    const instances = readInstances();
    const source = findInstance(instances, sourceCanvasId);
    const target = findInstance(instances, targetCanvasId);
    requireAccess(session, source);
    requireEdit(session, target);
    const note = source.notes.find(item => item.id === sourceNoteId);
    if (!note) throw new Error('Nota de origen no encontrada.');
    const targetTemplate = getCanvasTemplate(target.templateId);
    if (!targetTemplate?.sections.some(section => section.id === targetSectionId)) throw new Error('Sección de destino no válida.');
    const createdAt = now();
    const linked = {
      id: uid('note'), sectionId: targetSectionId, text: note.text, colorId: note.colorId,
      authorId: actor(session), createdAt, updatedAt: createdAt,
      position: (target.notes.filter(item => item.sectionId === targetSectionId).length + 1) * 1000,
      comments: [], sourceCanvasId, sourceNoteId
    };
    target.notes.push(linked);
    finishMutation(target, session, 'note:linked', 'Resultado vinculado desde otro canvas', null, { sourceCanvasId, sourceNoteId, noteId: linked.id });
    writeInstances(instances, { canvasId: targetCanvasId, projectId: target.projectId, noteId: linked.id, action: 'note:linked' });
    return enrich(target);
  },

  async createShareToken({ canvasId, expiresAt, label = '', session }) {
    await wait(80);
    const instances = readInstances();
    const instance = findInstance(instances, canvasId);
    requireManage(session, instance);
    const expiry = new Date(expiresAt || Date.now() + 7 * 86400000);
    if (!Number.isFinite(expiry.getTime()) || expiry.getTime() <= Date.now()) throw new Error('Selecciona una fecha de vencimiento futura.');
    const rawToken = uid('share').replace(/-/g, '').slice(-18).toUpperCase();
    const token = {
      id: uid('token'), code: rawToken,
      label: String(label || '').trim().slice(0, 80),
      createdBy: actor(session), createdAt: now(), expiresAt: expiry.toISOString(), active: true
    };
    instance.shareTokens ||= [];
    instance.shareTokens.push(token);
    finishMutation(instance, session, 'shared', 'Enlace de consulta generado', null, { tokenId: token.id, expiresAt: token.expiresAt });
    writeInstances(instances, { canvasId, projectId: instance.projectId, action: 'canvas:shared' });
    return { ...token, canvasId, workspaceId: instance.workspaceId, projectId: instance.projectId };
  },

  async listShareTokens({ canvasId, session }) {
    await wait(50);
    const instance = findInstance(readInstances(), canvasId, { includeArchived: true });
    requireManage(session, instance);
    return clone((instance.shareTokens || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
  },

  async revokeShareToken({ canvasId, tokenId, session }) {
    await wait(60);
    const instances = readInstances();
    const instance = findInstance(instances, canvasId, { includeArchived: true });
    requireManage(session, instance);
    const token = (instance.shareTokens || []).find(item => item.id === tokenId);
    if (!token) throw new Error('Enlace no encontrado.');
    token.active = false;
    token.revokedAt = now();
    token.revokedBy = actor(session);
    finishMutation(instance, session, 'share:revoked', 'Enlace de consulta revocado', null, { tokenId });
    writeInstances(instances, { canvasId, projectId: instance.projectId, action: 'canvas:share-revoked' });
    return clone(token);
  },

  async getSharedInstance({ token }) {
    await wait();
    const normalized = String(token || '').trim().toUpperCase();
    const instance = readInstances().find(item => (item.shareTokens || []).some(entry => entry.code === normalized && entry.active && new Date(entry.expiresAt).getTime() > Date.now()));
    if (!instance) throw new Error('El enlace compartido no existe, expiró o fue revocado.');
    const enriched = enrich(instance);
    delete enriched.shareTokens;
    delete enriched.snapshots;
    return enriched;
  },

  async listVersions({ canvasId, session }) {
    await wait(50);
    const instance = findInstance(readInstances(), canvasId, { includeArchived: true });
    requireAccess(session, instance);
    return enrich(instance).snapshots;
  },

  async createVersion({ canvasId, label = '', session }) {
    await wait(60);
    const instances = readInstances();
    const instance = findInstance(instances, canvasId);
    requireManage(session, instance);
    saveSnapshot(instance, session, label || `Punto de control · versión ${instance.version}`);
    addHistory(instance, 'version:created', 'Punto de control creado', session, { snapshotId: instance.snapshots[0].id });
    instance.updatedAt = now();
    writeInstances(instances, { canvasId, projectId: instance.projectId, action: 'canvas:version-created' });
    return clone(instance.snapshots[0]);
  },

  async restoreVersion({ canvasId, snapshotId, session }) {
    await wait(100);
    const instances = readInstances();
    const instance = findInstance(instances, canvasId);
    requireSuperadmin(session, instance);
    const snapshot = (instance.snapshots || []).find(item => item.id === snapshotId);
    if (!snapshot) throw new Error('Versión no encontrada.');
    saveSnapshot(instance, session, `Respaldo antes de restaurar versión ${snapshot.version}`);
    instance.title = snapshot.title;
    instance.notes = clone(snapshot.notes || []);
    touch(instance);
    addHistory(instance, 'version:restored', `Versión ${snapshot.version} restaurada`, session, { snapshotId });
    saveSnapshot(instance, session, `Restauración de versión ${snapshot.version}`);
    writeInstances(instances, { canvasId, projectId: instance.projectId, action: 'canvas:version-restored' });
    return enrich(instance);
  },

  subscribe(listener) {
    subscribers.add(listener);
    return () => subscribers.delete(listener);
  },

  startPresence({ canvasId, session, onChange }) {
    const key = `${canvasId}:${clientId}`;
    let stopped = false;
    const publish = () => {
      if (stopped) return;
      const value = readPresence();
      value[key] = {
        canvasId, clientId, userId: actor(session),
        userName: session?.user?.name || 'Participante',
        initials: session?.user?.initials || 'P',
        expiresAt: Date.now() + 30000
      };
      writePresence(value);
      onChange?.(activePresence(canvasId));
    };
    const refresh = () => onChange?.(activePresence(canvasId));
    const interval = setInterval(publish, 10000);
    const unsubscribe = this.subscribe(event => {
      if (event.source === 'presence' || event.key === PRESENCE_KEY) refresh();
    });
    publish();
    return () => {
      stopped = true;
      clearInterval(interval);
      unsubscribe();
      const value = readPresence();
      delete value[key];
      writePresence(value);
    };
  },

  async resetDemo({ session }) {
    if (session?.role !== 'superadmin') throw new Error('Solo el superadministrador puede restablecer los canvases demo.');
    const seeded = demoCanvasInstances.map(migrate);
    writeInstances(seeded, { action: 'canvas:reset' });
    return seeded.map(enrich);
  }
};
