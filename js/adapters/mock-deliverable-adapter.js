import { demoDeliverables } from '../../data/demo-deliverables.js?v=9.0.5';
import {
  canAccessProject,
  canCommentDeliverable,
  canManageDeliverables,
  canReviewDeliverable,
  canViewMaster,
  isReadOnlyRole
} from '../utils/permissions.js?v=9.0.5';

const STORAGE_KEY = 'wonkup.e6.deliverables';
const CHANNEL_NAME = 'wonkup-deliverables';
const listeners = new Set();
const wait = (milliseconds = 90) => new Promise(resolve => setTimeout(resolve, milliseconds));
const clone = value => JSON.parse(JSON.stringify(value));
let channel = null;

try {
  channel = new BroadcastChannel(CHANNEL_NAME);
  channel.addEventListener('message', event => notify(event.data || { type: 'sync' }, false));
} catch {
  channel = null;
}

window.addEventListener('storage', event => {
  if (event.key === STORAGE_KEY) notify({ type: 'sync' }, false);
});

function read() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // Use seed when local storage is unavailable.
  }
  const seeded = clone(demoDeliverables);
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded)); } catch { /* noop */ }
  return seeded;
}

function write(items, event = { type: 'sync' }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  notify(event, true);
  return clone(items);
}

function notify(event, broadcast) {
  listeners.forEach(listener => {
    try { listener(clone(event)); } catch { /* listener isolation */ }
  });
  if (broadcast) {
    try { channel?.postMessage(event); } catch { /* noop */ }
  }
}

function id(prefix) {
  return globalThis.crypto?.randomUUID
    ? `${prefix}-${crypto.randomUUID()}`
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function now() {
  return new Date().toISOString();
}

function assertVisible(item, session) {
  if (!item || !session) throw new Error('Entregable no encontrado.');
  if (canViewMaster(session)) return;
  if (!canAccessProject(session, item.projectId, item.workspaceId)) throw new Error('No tienes acceso a este entregable.');
  if (isReadOnlyRole(session) && item.visibility !== 'client') throw new Error('Este entregable es interno.');
}

function findIndex(items, deliverableId) {
  const index = items.findIndex(item => item.id === deliverableId);
  if (index < 0) throw new Error('Entregable no encontrado.');
  return index;
}

function historyEntry(action, label, session) {
  return {
    id: id('dh'), action, label,
    actor: session?.user?.name || 'Usuario',
    actorId: session?.user?.id || '',
    createdAt: now()
  };
}

function normalizeChecklist(checklist = []) {
  return checklist
    .map(item => typeof item === 'string' ? { id: id('dchk'), label: item.trim(), done: false } : {
      id: item.id || id('dchk'),
      label: String(item.label || '').trim().slice(0, 180),
      done: Boolean(item.done)
    })
    .filter(item => item.label);
}

export const MockDeliverableAdapter = {
  async listDeliverables({ projectId, workspaceId = '', session, includeArchived = false } = {}) {
    await wait();
    return read()
      .filter(item => !projectId || item.projectId === projectId)
      .filter(item => !workspaceId || workspaceId === 'all' || item.workspaceId === workspaceId)
      .filter(item => includeArchived || !item.archived)
      .filter(item => {
        try { assertVisible(item, session); return true; } catch { return false; }
      })
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  },

  async getDeliverable({ deliverableId, session }) {
    await wait(45);
    const item = read().find(entry => entry.id === deliverableId);
    assertVisible(item, session);
    return clone(item);
  },

  async createDeliverable({ workspaceId, projectId, input, session }) {
    await wait(140);
    if (!canManageDeliverables(session, projectId, workspaceId)) throw new Error('Tu rol no permite crear entregables.');
    const items = read();
    const createdAt = now();
    const deliverable = {
      id: id('del'), workspaceId, projectId,
      title: String(input.title || '').trim().slice(0, 180),
      type: String(input.type || 'document'),
      description: String(input.description || '').trim().slice(0, 2000),
      status: 'draft', visibility: input.visibility === 'internal' ? 'internal' : 'client',
      priority: String(input.priority || 'medium'),
      dueDate: String(input.dueDate || ''),
      ownerId: input.ownerId || session?.user?.id || '',
      ownerName: input.ownerName || session?.user?.name || 'Responsable',
      archived: false,
      checklist: normalizeChecklist(input.checklist),
      versions: [], comments: [],
      history: [historyEntry('created', 'Entregable creado', session)],
      createdAt, updatedAt: createdAt
    };
    if (deliverable.title.length < 3) throw new Error('Escribe un nombre de al menos 3 caracteres.');
    items.push(deliverable);
    write(items, { type: 'created', deliverableId: deliverable.id, projectId });
    return clone(deliverable);
  },

  async updateDeliverable({ deliverableId, patch, session }) {
    await wait(110);
    const items = read();
    const index = findIndex(items, deliverableId);
    const current = items[index];
    assertVisible(current, session);
    if (!canManageDeliverables(session, current.projectId, current.workspaceId)) throw new Error('Tu rol no permite editar entregables.');
    const next = {
      ...current,
      title: patch.title !== undefined ? String(patch.title || '').trim().slice(0, 180) : current.title,
      description: patch.description !== undefined ? String(patch.description || '').trim().slice(0, 2000) : current.description,
      type: patch.type !== undefined ? String(patch.type || 'document') : current.type,
      priority: patch.priority !== undefined ? String(patch.priority || 'medium') : current.priority,
      dueDate: patch.dueDate !== undefined ? String(patch.dueDate || '') : current.dueDate,
      visibility: patch.visibility !== undefined ? (patch.visibility === 'internal' ? 'internal' : 'client') : current.visibility,
      ownerName: patch.ownerName !== undefined ? String(patch.ownerName || '').trim().slice(0, 120) : current.ownerName,
      checklist: patch.checklist !== undefined ? normalizeChecklist(patch.checklist) : current.checklist,
      updatedAt: now(),
      history: [historyEntry('updated', 'Información del entregable actualizada', session), ...(current.history || [])]
    };
    if (next.title.length < 3) throw new Error('Escribe un nombre de al menos 3 caracteres.');
    items[index] = next;
    write(items, { type: 'updated', deliverableId, projectId: current.projectId });
    return clone(next);
  },

  async addVersion({ deliverableId, input, session }) {
    await wait(120);
    const items = read();
    const index = findIndex(items, deliverableId);
    const current = items[index];
    assertVisible(current, session);
    if (!canManageDeliverables(session, current.projectId, current.workspaceId)) throw new Error('Tu rol no permite registrar versiones.');
    const versions = current.versions || [];
    const number = Math.max(0, ...versions.map(version => Number(version.number || 0))) + 1;
    const version = {
      id: id('dver'), number,
      label: String(input.label || `Versión ${number}`).trim().slice(0, 120),
      fileName: String(input.fileName || input.label || `Versión ${number}`).trim().slice(0, 180),
      fileType: String(input.fileType || 'Enlace').trim().slice(0, 60),
      size: String(input.size || '').trim().slice(0, 40),
      url: String(input.url || '').trim().slice(0, 1000),
      notes: String(input.notes || '').trim().slice(0, 1000),
      createdAt: now(), createdBy: session?.user?.name || 'Usuario'
    };
    if (!/^https?:\/\//i.test(version.url)) throw new Error('Ingresa un enlace válido con http o https.');
    const next = {
      ...current,
      versions: [version, ...versions],
      status: current.status === 'approved' ? 'draft' : current.status,
      approvedAt: current.status === 'approved' ? '' : current.approvedAt,
      approvedBy: current.status === 'approved' ? '' : current.approvedBy,
      updatedAt: now(),
      history: [historyEntry('version_added', `${version.label} registrada`, session), ...(current.history || [])]
    };
    items[index] = next;
    write(items, { type: 'version_added', deliverableId, projectId: current.projectId });
    return clone(next);
  },

  async requestReview({ deliverableId, session }) {
    await wait(95);
    const items = read();
    const index = findIndex(items, deliverableId);
    const current = items[index];
    assertVisible(current, session);
    if (!canManageDeliverables(session, current.projectId, current.workspaceId)) throw new Error('Tu rol no permite enviar entregables a revisión.');
    if (!(current.versions || []).length) throw new Error('Registra al menos una versión antes de solicitar revisión.');
    const next = {
      ...current, status: 'in_review', requestedAt: now(), updatedAt: now(),
      history: [historyEntry('review_requested', 'Enviado a revisión del cliente', session), ...(current.history || [])]
    };
    items[index] = next;
    write(items, { type: 'review_requested', deliverableId, projectId: current.projectId });
    return clone(next);
  },

  async approve({ deliverableId, session }) {
    await wait(100);
    const items = read();
    const index = findIndex(items, deliverableId);
    const current = items[index];
    assertVisible(current, session);
    if (!canReviewDeliverable(session, current.projectId, current.workspaceId)) throw new Error('Tu rol no permite aprobar entregables.');
    if (current.status !== 'in_review') throw new Error('El entregable no está pendiente de aprobación.');
    const approvedAt = now();
    const next = {
      ...current, status: 'approved', approvedAt,
      approvedBy: session?.user?.name || 'Cliente', updatedAt: approvedAt,
      history: [historyEntry('approved', 'Entregable aprobado', session), ...(current.history || [])]
    };
    items[index] = next;
    write(items, { type: 'approved', deliverableId, projectId: current.projectId });
    return clone(next);
  },

  async requestChanges({ deliverableId, feedback, session }) {
    await wait(100);
    const items = read();
    const index = findIndex(items, deliverableId);
    const current = items[index];
    assertVisible(current, session);
    if (!canReviewDeliverable(session, current.projectId, current.workspaceId)) throw new Error('Tu rol no permite solicitar cambios.');
    const text = String(feedback || '').trim().slice(0, 2000);
    if (text.length < 3) throw new Error('Describe el cambio solicitado.');
    const createdAt = now();
    const comment = {
      id: id('dcom'), text,
      authorId: session?.user?.id || '', authorName: session?.user?.name || 'Cliente',
      role: session?.role || 'client', createdAt
    };
    const next = {
      ...current, status: 'changes_requested', updatedAt: createdAt,
      comments: [...(current.comments || []), comment],
      history: [historyEntry('changes_requested', 'Cambios solicitados', session), ...(current.history || [])]
    };
    items[index] = next;
    write(items, { type: 'changes_requested', deliverableId, projectId: current.projectId });
    return clone(next);
  },

  async addComment({ deliverableId, text, session }) {
    await wait(75);
    const items = read();
    const index = findIndex(items, deliverableId);
    const current = items[index];
    assertVisible(current, session);
    if (!canCommentDeliverable(session, current.projectId, current.workspaceId)) throw new Error('Tu rol no permite comentar.');
    const value = String(text || '').trim().slice(0, 2000);
    if (!value) throw new Error('Escribe un comentario.');
    const comment = {
      id: id('dcom'), text: value,
      authorId: session?.user?.id || '', authorName: session?.user?.name || 'Usuario',
      role: session?.role || '', createdAt: now()
    };
    const next = {
      ...current,
      comments: [...(current.comments || []), comment],
      updatedAt: comment.createdAt,
      history: [historyEntry('comment_added', 'Comentario agregado', session), ...(current.history || [])]
    };
    items[index] = next;
    write(items, { type: 'comment_added', deliverableId, projectId: current.projectId });
    return clone(next);
  },

  async toggleChecklist({ deliverableId, checklistId, done, session }) {
    await wait(65);
    const items = read();
    const index = findIndex(items, deliverableId);
    const current = items[index];
    assertVisible(current, session);
    if (!canManageDeliverables(session, current.projectId, current.workspaceId)) throw new Error('Tu rol no permite modificar el checklist.');
    const checklist = (current.checklist || []).map(item => item.id === checklistId ? { ...item, done: Boolean(done) } : item);
    const next = { ...current, checklist, updatedAt: now() };
    items[index] = next;
    write(items, { type: 'checklist_updated', deliverableId, projectId: current.projectId });
    return clone(next);
  },

  async archiveDeliverable({ deliverableId, session }) {
    await wait(80);
    const items = read();
    const index = findIndex(items, deliverableId);
    const current = items[index];
    assertVisible(current, session);
    if (!canManageDeliverables(session, current.projectId, current.workspaceId)) throw new Error('Tu rol no permite archivar entregables.');
    const next = {
      ...current, archived: true, archivedAt: now(), updatedAt: now(),
      history: [historyEntry('archived', 'Entregable archivado', session), ...(current.history || [])]
    };
    items[index] = next;
    write(items, { type: 'archived', deliverableId, projectId: current.projectId });
    return clone(next);
  },

  async restoreDeliverable({ deliverableId, session }) {
    await wait(80);
    const items = read();
    const index = findIndex(items, deliverableId);
    const current = items[index];
    assertVisible(current, session);
    if (!canManageDeliverables(session, current.projectId, current.workspaceId)) throw new Error('Tu rol no permite restaurar entregables.');
    const next = {
      ...current, archived: false, archivedAt: '', updatedAt: now(),
      history: [historyEntry('restored', 'Entregable restaurado', session), ...(current.history || [])]
    };
    items[index] = next;
    write(items, { type: 'restored', deliverableId, projectId: current.projectId });
    return clone(next);
  },

  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  resetDemo() {
    localStorage.removeItem(STORAGE_KEY);
    notify({ type: 'reset' }, true);
  }
};
